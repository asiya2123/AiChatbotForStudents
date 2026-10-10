# ThriveMate

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` using a key from Google AI Studio. Never put the key in frontend code or commit `.env`.
3. Start both the API and Vite with `npm run dev`, then open the URL printed by Vite.

Without a Gemini key the dashboard, accounts, profile, and planner still work. The tutor reports a configuration error rather than pretending to contact an AI service. Restart the server after changing `.env`.

Use `npm run build` to create the production frontend. With `NODE_ENV=production`, `npm start` serves the built frontend and API together.

## Included backend

- Email/password sign-up and sign-in, using scrypt password hashes and HTTP-only session cookies.
- Profile, study goals, planner tasks, and tutor conversation history stored locally in `server/data/lumilearn.json`.
- Select a date on the interactive calendar to view and schedule study tasks, with an optional reason for each task.
- Gemini requests made only from the server; the API key is never sent to the browser.
- Course recommendations and available subjects adapt to the learner's selected grade and subjects. Course progress, activity statistics, and community examples remain sample data.
- The dashboard offers English and Hindi UI/tutor responses, a daily-life planning and age-appropriate career guide via Gemini, and a private pocket-money tracker stored only in the browser.
- A focused, visible study session is paused for a five-minute movement break after each hour. The break timer persists per account on that browser.
- Daily planning, money management, and career guidance are available on their own dashboard pages.

This is a local prototype. For public deployment, use a production database, HTTPS, backups, account recovery, and a production-grade session store.

GitHub Pages can host only the static frontend; it cannot run this Node API. To deploy the working app, host the frontend and API together on a Node.js-capable service, or host the API separately and configure a secure HTTPS connection with credentialed CORS. Set `GEMINI_API_KEY` as a secret on the backend host only. Never add it to GitHub Pages settings, frontend build variables, or committed files. The `.env` file is ignored by Git.
