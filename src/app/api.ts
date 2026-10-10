export interface StudyProfile {
  name: string;
  standard: string;
  subjects: string[];
  dailyGoal: string;
}

export interface StudyTask {
  id: string;
  title: string;
  time: string;
  done: boolean;
  dueDate?: string;
  reason?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

export interface Session {
  user: { id: string; email: string };
  profile: StudyProfile;
  tasks: StudyTask[];
  messages: ChatMessage[];
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed with status ${response.status}.`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  signUp: (input: { name: string; standard: string; email: string; password: string; subjects: string[]; dailyGoal: string }) =>
    request<Session>("/api/auth/signup", { method: "POST", body: JSON.stringify(input) }),
  signIn: (email: string, password: string) =>
    request<Session>("/api/auth/signin", { method: "POST", body: JSON.stringify({ email, password }) }),
  currentSession: () => request<Session>("/api/auth/me"),
  signOut: () => request<{ ok: true }>("/api/auth/signout", { method: "POST", body: "{}" }),
  updateProfile: (profile: StudyProfile) => request<StudyProfile>("/api/profile", { method: "PUT", body: JSON.stringify(profile) }),
  createTask: (title: string, dueDate: string, reason: string) =>
    request<StudyTask>("/api/tasks", { method: "POST", body: JSON.stringify({ title, dueDate, reason }) }),
  updateTask: (taskId: string, update: Partial<Pick<StudyTask, "title" | "done" | "dueDate" | "reason">>) =>
    request<StudyTask>(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "PATCH", body: JSON.stringify(update) }),
  deleteTask: (taskId: string) => request<void>(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" }),
  sendMessage: (message: string, language: "English" | "Hindi") =>
    request<{ message: ChatMessage }>("/api/chat", { method: "POST", body: JSON.stringify({ message, language }) }),
  health: () => request<{ ok: boolean; aiConfigured: boolean; model: string }>("/api/health"),
};
