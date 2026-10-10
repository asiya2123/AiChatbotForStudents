import crypto from "node:crypto";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import express from "express";

const scrypt = promisify(crypto.scrypt);
const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 3001);
const dataFile = path.resolve(process.env.LUMILEARN_DB_PATH || path.join("server", "data", "lumilearn.json"));
const dataDirectory = path.dirname(dataFile);
const sessionCookie = "lumilearn_session";
const sessionLifetime = 30 * 24 * 60 * 60 * 1000;
const sessions = new Map();
const chatLimits = new Map();
let store = { users: {} };
let writeQueue = Promise.resolve();

await fs.mkdir(dataDirectory, { recursive: true });
try {
  store = JSON.parse(await fs.readFile(dataFile, "utf8"));
  if (!store || typeof store.users !== "object" || Array.isArray(store.users)) {
    throw new Error("The database file does not contain a users object.");
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), { encoding: "utf8", mode: 0o600 });
}

function persistStore() {
  const contents = JSON.stringify(store, null, 2);
  writeQueue = writeQueue.then(async () => {
    const temporaryFile = `${dataFile}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(temporaryFile, contents, { encoding: "utf8", mode: 0o600 });
    await fs.rename(temporaryFile, dataFile);
  });
  return writeQueue;
}

function fail(response, status, message) {
  return response.status(status).json({ error: message });
}

function getCookie(request, name) {
  const cookieHeader = request.headers.cookie || "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return "";
}

function getAuthenticatedUser(request) {
  const token = getCookie(request, sessionCookie);
  if (!token) return null;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const session = sessions.get(tokenHash);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(tokenHash);
    return null;
  }
  const user = store.users[session.userId];
  if (!user) {
    sessions.delete(tokenHash);
    return null;
  }
  return user;
}

function requireUser(request, response, next) {
  const user = getAuthenticatedUser(request);
  if (!user) return fail(response, 401, "Please sign in to continue.");
  request.user = user;
  return next();
}

function setSessionCookie(response, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  sessions.set(tokenHash, { userId, expiresAt: Date.now() + sessionLifetime });
  const crossSite = Boolean(process.env.APP_ORIGINS);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const sameSite = crossSite ? "None" : "Lax";
  response.setHeader("Set-Cookie", `${sessionCookie}=${token}; HttpOnly; SameSite=${sameSite}; Path=/; Max-Age=${sessionLifetime / 1000}${secure}`);
}

function clearSessionCookie(request, response) {
  const token = getCookie(request, sessionCookie);
  if (token) sessions.delete(crypto.createHash("sha256").update(token).digest("hex"));
  response.setHeader("Set-Cookie", `${sessionCookie}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function publicUser(user) {
  return { id: user.id, email: user.email };
}

function sessionPayload(user) {
  return {
    user: publicUser(user),
    profile: user.profile,
    tasks: user.tasks,
    messages: user.messages.slice(-60),
  };
}

function validText(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "same-origin");
  response.setHeader("Cache-Control", "no-store");
  next();
});
app.use((request, response, next) => {
  const origin = request.get("Origin");
  if (!origin) return next();

  const configuredOrigins = (process.env.APP_ORIGINS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const sameOrigin = origin === `${request.get("x-forwarded-proto") || request.protocol}://${request.get("host")}`;
  const localDevelopmentOrigin = process.env.NODE_ENV !== "production"
    && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (!sameOrigin && !configuredOrigins.includes(origin) && !localDevelopmentOrigin) {
    return fail(response, 403, "This website is not allowed to use the ThriveMate API.");
  }

  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Vary", "Origin");
  if (request.method === "OPTIONS") {
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return response.status(204).end();
  }
  return next();
});
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, aiConfigured: Boolean(process.env.GEMINI_API_KEY), model: process.env.GEMINI_MODEL || "gemini-3.8-flash" });
});

app.post("/api/auth/signup", async (request, response, next) => {
  try {
    const { name, standard, email, password, subjects, dailyGoal } = request.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!validText(name, 80)) return fail(response, 400, "Enter a name between 1 and 80 characters.");
    if (!["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Undergraduate", "Postgraduate", "Other"].includes(standard)) {
      return fail(response, 400, "Choose your current class or standard.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) return fail(response, 400, "Enter a valid email address.");
    if (typeof password !== "string" || password.length < 8 || password.length > 128) return fail(response, 400, "Password must be between 8 and 128 characters.");
    if (store.users[normalizedEmail]) return fail(response, 409, "An account with that email already exists. Please sign in.");
    if (!Array.isArray(subjects) || subjects.length < 1 || subjects.length > 8 || subjects.some((subject) => !validText(subject, 60))) {
      return fail(response, 400, "Choose at least one valid study subject.");
    }
    if (!["30 min a day", "1 hour a day", "2 hours a day"].includes(dailyGoal)) return fail(response, 400, "Choose a valid daily study goal.");

    const salt = crypto.randomBytes(16);
    const passwordHash = await scrypt(password, salt, 64);
    const user = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordSalt: salt.toString("hex"),
      passwordHash: passwordHash.toString("hex"),
      profile: { name: name.trim(), standard, subjects: [...new Set(subjects.map((subject) => subject.trim()))], dailyGoal },
      tasks: [
        { id: crypto.randomUUID(), title: "Choose your first course", time: "Your first study session", done: false },
        { id: crypto.randomUUID(), title: "Plan a focused study block", time: "This week", done: false },
      ],
      messages: [],
    };
    store.users[normalizedEmail] = user;
    await persistStore();
    setSessionCookie(response, normalizedEmail);
    return response.status(201).json(sessionPayload(user));
  } catch (error) {
    return next(error);
  }
});

app.post("/api/auth/signin", async (request, response, next) => {
  try {
    const { email, password } = request.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const user = store.users[normalizedEmail];
    if (!user || typeof password !== "string") return fail(response, 401, "Email or password is incorrect.");
    const candidate = await scrypt(password, Buffer.from(user.passwordSalt, "hex"), 64);
    const storedHash = Buffer.from(user.passwordHash, "hex");
    if (candidate.length !== storedHash.length || !crypto.timingSafeEqual(candidate, storedHash)) {
      return fail(response, 401, "Email or password is incorrect.");
    }
    setSessionCookie(response, normalizedEmail);
    return response.json(sessionPayload(user));
  } catch (error) {
    return next(error);
  }
});

app.get("/api/auth/me", requireUser, (request, response) => response.json(sessionPayload(request.user)));

app.post("/api/auth/signout", requireUser, (request, response) => {
  clearSessionCookie(request, response);
  return response.json({ ok: true });
});

app.get("/api/profile", requireUser, (request, response) => response.json(request.user.profile));

app.put("/api/profile", requireUser, async (request, response, next) => {
  try {
    const { name, standard, subjects, dailyGoal } = request.body || {};
    if (!validText(name, 80)) return fail(response, 400, "Enter a name between 1 and 80 characters.");
    if (!["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Undergraduate", "Postgraduate", "Other"].includes(standard)) {
      return fail(response, 400, "Choose your current class or standard.");
    }
    if (!Array.isArray(subjects) || subjects.length < 1 || subjects.length > 8 || subjects.some((subject) => !validText(subject, 60))) {
      return fail(response, 400, "Choose at least one valid study subject.");
    }
    if (!["30 min a day", "1 hour a day", "2 hours a day"].includes(dailyGoal)) return fail(response, 400, "Choose a valid daily study goal.");
    request.user.profile = { name: name.trim(), standard, subjects: [...new Set(subjects.map((subject) => subject.trim()))], dailyGoal };
    await persistStore();
    return response.json(request.user.profile);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/tasks", requireUser, (request, response) => response.json(request.user.tasks));

app.post("/api/tasks", requireUser, async (request, response, next) => {
  try {
    const { title, reason = "" } = request.body || {};
    const dueDate = request.body?.dueDate ?? new Date().toISOString().slice(0, 10);
    if (!validText(title, 160)) return fail(response, 400, "Task title must be between 1 and 160 characters.");
    if (!validDate(dueDate)) return fail(response, 400, "Choose a valid date for this task.");
    if (typeof reason !== "string" || reason.trim().length > 240) return fail(response, 400, "Task reason must be 240 characters or fewer.");
    if (request.user.tasks.length >= 100) return fail(response, 400, "You have reached the 100-task limit.");
    const task = { id: crypto.randomUUID(), title: title.trim(), time: "Scheduled study task", dueDate, reason: reason.trim(), done: false };
    request.user.tasks.push(task);
    await persistStore();
    return response.status(201).json(task);
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/tasks/:taskId", requireUser, async (request, response, next) => {
  try {
    const task = request.user.tasks.find((entry) => entry.id === request.params.taskId);
    if (!task) return fail(response, 404, "Task not found.");
    const { done, title, dueDate, reason } = request.body || {};
    if (done !== undefined && typeof done !== "boolean") return fail(response, 400, "Task completion must be true or false.");
    if (title !== undefined && !validText(title, 160)) return fail(response, 400, "Task title must be between 1 and 160 characters.");
    if (dueDate !== undefined && !validDate(dueDate)) return fail(response, 400, "Choose a valid date for this task.");
    if (reason !== undefined && (typeof reason !== "string" || reason.trim().length > 240)) return fail(response, 400, "Task reason must be 240 characters or fewer.");
    if (done !== undefined) task.done = done;
    if (title !== undefined) task.title = title.trim();
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (reason !== undefined) task.reason = reason.trim();
    await persistStore();
    return response.json(task);
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/tasks/:taskId", requireUser, async (request, response, next) => {
  try {
    const index = request.user.tasks.findIndex((task) => task.id === request.params.taskId);
    if (index < 0) return fail(response, 404, "Task not found.");
    request.user.tasks.splice(index, 1);
    await persistStore();
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.get("/api/chat/history", requireUser, (request, response) => response.json(request.user.messages.slice(-60)));

app.post("/api/chat", requireUser, async (request, response, next) => {
  try {
    const prompt = request.body?.message;
    const language = request.body?.language || "English";
    if (!validText(prompt, 4000)) return fail(response, 400, "Message must be between 1 and 4,000 characters.");
    if (!["English", "Hindi"].includes(language)) return fail(response, 400, "Choose a supported tutor language.");
    const now = Date.now();
    const recentRequests = (chatLimits.get(request.user.id) || []).filter((timestamp) => now - timestamp < 60_000);
    if (recentRequests.length >= 20) {
      response.setHeader("Retry-After", "60");
      return fail(response, 429, "Too many tutor requests. Please wait a minute and try again.");
    }
    recentRequests.push(now);
    chatLimits.set(request.user.id, recentRequests);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return fail(response, 503, "AI tutor is not configured yet. Add GEMINI_API_KEY to .env and restart the backend.");

    const history = request.user.messages.slice(-12).map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.text }],
    }));
    history.push({ role: "user", parts: [{ text: prompt.trim() }] });
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const requestBody = JSON.stringify({
      systemInstruction: {
        parts: [{ text: `You are ThriveMate, a patient and accurate student assistant. Reply in ${language}. Explain concepts clearly in steps, ask short follow-up questions when useful, and help students learn rather than just giving unexplained answers. Adapt advice and examples to the student's stated class and subjects. For daily planning, create a realistic schedule with breaks and account for their priorities. For money management, provide age-appropriate financial literacy only; never request account credentials or recommend investments. For careers, offer practical exploration steps without guaranteeing jobs or outcomes. For quiz answers, explain why they are correct or incorrect. Do not claim to access private course materials.` }],
      },
      contents: history,
      generationConfig: { temperature: 0.5, maxOutputTokens: 1200 },
    });
    let result;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: requestBody,
          signal: AbortSignal.timeout(18_000),
        });
      } catch (error) {
        if (attempt === 1 || error.name === "TimeoutError" || error.name === "AbortError") throw error;
        console.error(`Gemini connection failed${error.cause?.code ? ` (${error.cause.code})` : ""}; retrying once.`);
        await new Promise((resolve) => setTimeout(resolve, 400));
        continue;
      }
      if (result.status !== 503 || attempt === 1) break;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    if (!result.ok) {
      const providerError = await result.json().catch(() => null);
      const providerCode = providerError?.error?.status;
      const unavailable = result.status >= 500 || providerCode === "UNAVAILABLE" || providerCode === "INTERNAL";
      const status = result.status === 429 ? 429 : result.status === 401 || result.status === 403 || unavailable ? 503 : 502;
      if (status === 429) response.setHeader("Retry-After", "60");
      const detail = status === 429
        ? "The tutor has reached its request limit. Please wait a minute before trying again."
        : status === 503
          ? unavailable
            ? "Gemini is temporarily unavailable. Please try again in a moment."
            : "Gemini rejected the API key. Check GEMINI_API_KEY in .env."
          : `Gemini could not answer the request${providerCode ? ` (${providerCode})` : ""}. Please try again.`;
      console.error(`Gemini request failed with HTTP ${result.status}${providerCode ? ` (${providerCode})` : ""}.`);
      return fail(response, status, detail);
    }
    const payload = await result.json();
    const answer = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter((text) => typeof text === "string")
      .join("\n")
      .trim();
    if (!answer) return fail(response, 502, "Gemini returned an empty reply. Please try asking another way.");

    const userMessage = { id: crypto.randomUUID(), role: "user", text: prompt.trim(), createdAt: new Date().toISOString() };
    const assistantMessage = { id: crypto.randomUUID(), role: "assistant", text: answer, createdAt: new Date().toISOString() };
    request.user.messages.push(userMessage, assistantMessage);
    request.user.messages = request.user.messages.slice(-100);
    await persistStore();
    return response.json({ message: assistantMessage });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") return fail(response, 504, "Gemini took too long to respond. Please try again.");
    if (error instanceof TypeError && error.message === "fetch failed") {
      console.error(`Gemini network request failed${error.cause?.code ? ` (${error.cause.code})` : ""}.`);
      return fail(response, 503, "The tutor cannot reach Gemini right now. Check your internet connection and try again.");
    }
    return next(error);
  }
});

app.use("/api", (_request, response) => fail(response, 404, "API endpoint not found."));

if (process.env.NODE_ENV === "production") {
  const distributionDirectory = path.resolve("dist");
  app.use(express.static(distributionDirectory));
  app.get("*path", (_request, response, next) => {
    response.sendFile(path.join(distributionDirectory, "index.html"), (error) => {
      if (error) next(error);
    });
  });
}

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) return fail(response, 400, "Request body must be valid JSON.");
  if (error.type === "entity.too.large") return fail(response, 413, "Request body is too large.");
  console.error("Request failed:", error.message);
  return fail(response, 500, "Unexpected server error. Please try again.");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`ThriveMate API listening on http://127.0.0.1:${port}`);
  console.log(`Gemini ${process.env.GEMINI_API_KEY ? "configured" : "not configured (set GEMINI_API_KEY in .env)"}`);
});
