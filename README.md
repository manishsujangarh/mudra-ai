# Mudra AI 🧘

An **offline-first** React Native (Expo) app that recommends yoga hand-mudras for
wellness goals (anxiety, stress, sleep, low energy…), builds daily practice
routines with reminders, and guides timed practice sessions.

All mudra content lives in a **local SQLite database** on the device. There is
**no backend and no custom API server** — the app is fully usable offline after
the first launch. An optional OpenAI key powers a RAG chat experience; without
it, the app falls back to fully local recommendation matching.

## Stack

| Concern        | Choice                          |
| -------------- | ------------------------------- |
| Framework      | React Native + Expo (SDK 51)    |
| Language       | TypeScript                      |
| Navigation     | Expo Router (file-based)        |
| Local storage  | Expo SQLite                     |
| Server state   | TanStack React Query            |
| UI state       | Zustand                         |
| Styling        | NativeWind (Tailwind)           |
| AI             | OpenAI (RAG over local SQLite)  |
| Notifications  | Expo Notifications              |

## Getting started

```bash
cd mudra-ai
npm install
cp .env.example .env        # optional: add EXPO_PUBLIC_OPENAI_API_KEY
npm run start               # then press i / a, or scan the QR
```

> The app seeds itself from `src/data/seed-mudras.json` on first launch, so it
> works immediately with **no key and no network**.

## App startup flow

`src/hooks/useBootstrap.ts` runs on launch:

1. Open + migrate SQLite (`src/db/client.ts`).
2. If the `mudras` table is empty → seed from bundled JSON.
3. If data exists → load from SQLite.
4. Kick off a throttled background sync from a remote JSON source
   (`EXPO_PUBLIC_MUDRA_SOURCE_URL`); silently no-ops when offline.

## Database schema (`src/db/schema.ts`)

- **mudras** — `id, name, slug, description, benefits, instructions, duration, category, image_url, source_url`
  (`benefits` / `instructions` stored as JSON-encoded TEXT).
- **routines** — `id, mudra_id, reminder_time, duration, start_date, streak, notification_id, active`.
- **sessions** — `id, routine_id, completed, completed_at`.
- **user_preferences** — single row: `preferred_time, wellness_goal, onboarding_completed`.

Repositories live in `src/db/repositories/` and are the only code that touches SQL.

## AI recommendation engine (RAG)

`src/ai/` implements Retrieval-Augmented Generation:

1. **Retrieve** — `retrieval.ts` searches local SQLite and scores mudras against
   the user's condition (with synonym expansion for anxiety/stress/sleep/energy…).
2. **Augment** — only those retrieved mudras are sent to OpenAI as grounding context.
3. **Generate** — `recommend.ts` asks the model to pick **one** mudra *from the list*,
   explain why, and suggest a duration. A strict system prompt forbids inventing mudras.
4. **Fallback** — with no API key or on any API error, a deterministic local
   explanation is produced from the same retrieved set. The AI can **never**
   recommend a mudra that isn't in the local database.

## Feature map

| Spec feature        | Implementation                                        |
| ------------------- | ----------------------------------------------------- |
| Home screen         | `app/(tabs)/index.tsx` — today's mudra, active routine, streak, start |
| Mudra search        | `app/(tabs)/search.tsx` — search + benefit/category filters |
| AI chat (RAG)       | `app/(tabs)/chat.tsx` + `src/hooks/useChat.ts`        |
| Routine builder     | `app/routine-builder.tsx` — picks time, creates daily routine |
| Notifications       | `src/notifications/index.ts` — daily + streak reminders |
| Practice screen     | `app/practice/[id].tsx` — image, steps, countdown, complete |
| Offline-first       | SQLite + bundled seed + `expo-image` cached images    |
| Data import system  | `src/data/import.ts` — normalize, de-dupe, upsert     |

## Project structure

```
mudra-ai/
├── app/                      # Expo Router screens
│   ├── _layout.tsx           # providers + bootstrap gate
│   ├── index.tsx             # onboarding redirect gate
│   ├── onboarding.tsx
│   ├── (tabs)/               # Home, Explore, AI Guide, Routines
│   ├── mudra/[slug].tsx      # mudra detail
│   ├── practice/[id].tsx     # timed practice
│   └── routine-builder.tsx   # modal
├── src/
│   ├── ai/                   # openai client, retrieval, recommend (RAG)
│   ├── components/           # MudraCard, ChatBubble, CountdownTimer, ui, …
│   ├── data/                 # seed JSON + import/normalize system
│   ├── db/                   # client, schema, repositories
│   ├── hooks/                # React Query + bootstrap hooks
│   ├── lib/                  # queryClient, sync, utils
│   ├── notifications/        # Expo Notifications wrapper
│   ├── store/                # Zustand stores
│   └── types/                # shared domain types
└── assets/                   # icons / splash
```

## Production notes

- **OpenAI key safety:** anything under `EXPO_PUBLIC_` ships in the client
  bundle. For production, route OpenAI calls through your own serverless proxy
  and leave the bundled key blank (set `baseURL` in `src/ai/openai.ts`).
- **Remote sync source:** point `EXPO_PUBLIC_MUDRA_SOURCE_URL` at a JSON
  endpoint returning either an array or `{ "mudras": [...] }`. The 7Pranayama
  category page is HTML, not JSON — host a JSON export (e.g. scraped once) for
  live updates. The bundled seed covers offline use regardless.
```
