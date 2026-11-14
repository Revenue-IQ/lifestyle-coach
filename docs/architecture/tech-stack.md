# Tech stack

Status: locked on 2026-11-14; Phase 1 (first-session flow) built on this stack the same day · Last updated: 2026-11-14

## What this covers

The technologies the Wellbeing app is built on, and why each one was chosen.

The app helps people who feel stuck work out what is going wrong in their life and fix it. A person enters details about one area of life (the first is daily diet). An AI model turns that into structured numbers, the app's own code rates them, and the person gets suggestions written from the app's own knowledge base. Everything is stored and editable, and the experience is gamified.

Three constraints shaped every choice:

1. **Web first, mobile later, no rewrite.** The idea started at a 2-day Buildathon that expects a web app. The real product is a mobile app. Whatever ships as the web app must become the mobile app without rebuilding the screens.
2. **Easy for an AI to code.** The code is written mostly by an AI coding assistant, so the stack favours widely used tools and one language end to end.
3. **A knowledge base of our own.** The Buildathon requires the app to have its own knowledge base that acts as a guardrail on the AI, instead of relying on the model's intelligence alone.

## The stack

One language everywhere: TypeScript.

### App (`mobile/`, web now, iOS and Android later)

| Piece | Choice |
|---|---|
| Framework | Expo SDK 57 (React Native) with Expo Router |
| Web output | Expo's web build, bundled with Metro, for the Buildathon |
| Styling | NativeWind 4.2.7 with Tailwind CSS 3.4 (Tailwind-style classes that work on web and native) |
| Server state | TanStack React Query v5 |
| Login | Clerk through `@clerk/expo`, using its web components (`@clerk/expo/web`) for the Buildathon |
| API calls | Hono's typed client, so the app and the API share types |
| Icons | `lucide-react-native` with `react-native-svg` |
| Fonts | Geist through `@expo-google-fonts/geist` |

### Backend (`api/`)

| Piece | Choice |
|---|---|
| Server | Hono (~4.12) with `@hono/node-server` on Node 22 |
| Database | PostgreSQL through Drizzle ORM and drizzle-kit (`pg` driver) |
| Knowledge base | The pgvector extension in the same PostgreSQL database, queried through Drizzle |
| Login | Clerk for identity only. Any roles live in the app's own `users` table |
| AI | Google Gemini API, called only from the backend. `gemini-3.8-flash` writes text. `gemini-embedding-2` at 768 dimensions turns text into vectors for the knowledge base |
| Tests | Vitest for unit tests, tsx for development |

### Deployment

| Piece | Choice |
|---|---|
| Host | One Amazon Lightsail instance (a plain virtual server) |
| Containers | Two Docker containers on that same instance, run with docker-compose: the app container and the Postgres container |
| App container | Runs the API and can serve the web build |
| Database container | A Postgres image that includes pgvector, with its data on a persistent volume |
| Local development | The same docker-compose Postgres setup, or a Postgres already on the machine (the owner's Mac runs Homebrew Postgres 17 and has no Docker, so `DATABASE_URL` points there) |
| Login without keys | The API has an `AUTH_MODE=dev` that accepts an `x-dev-user-id` header, and the app shows a developer sign-in when no Clerk publishable key is set. Clerk is wired in and takes over as soon as the keys exist |
| CI/CD | A GitHub pipeline (GitHub Actions) that deploys to the instance |
| Mobile builds | Expo's build service, when the mobile phase starts |

## How the AI fits in

The AI estimates, the code rates, and suggestions are written from the app's own knowledge base.

### Rating

1. The person describes what they ate.
2. The backend sends it to the AI model once and asks for a structured list: each food, its portion, and its protein, carbs and fat.
3. The backend stores that list. The person can see it and correct any item.
4. The app's own formula reads the stored numbers and produces the rating. The AI is never asked for a score.

The rating is only recalculated from stored numbers. The AI is called again only when the person creates or edits an entry.

The formula needs a target to rate against, so the app keeps a short profile: weight, age, sex and activity level. It is not collected at signup; every field is optional and is asked as a quest or at the moment it first matters, with a rougher rating shown if skipped. The original "goal" field was replaced by the "What's bugging you" screen. See `docs/features/profile.md` and `docs/features/whats-bugging-you.md` (decided 2026-11-14).

### Suggestions

Suggestions are not left to the model's general knowledge. They are written from a knowledge base the app owns.

The knowledge base is a set of short guidance notes (around thirty to fifty for diet), each written in our own words with its public source named. A one-time loading script turns each note into a vector with the embedding model and stores the note, its source and its vector in Postgres.

When a rating is produced:

1. The formula's result lists the gaps, such as low protein.
2. The backend turns the gaps and the person's profile into a vector and searches the knowledge base for the closest notes.
3. The backend sends the gaps and those notes to the AI model, with an instruction to write suggestions from the notes only.
4. The suggestions are stored together with the notes they came from, so the app can show its sources.

Hard limits are not left to that instruction. Rules such as a minimum calorie floor, or answering "see a professional" for pregnancy, medical conditions or under 18, are checked by the backend's own code on every suggestion.

## Decisions

- **Expo instead of React + Vite for the frontend** — the usual frontend (React 19, Vite, React Router v7, Tailwind v4, Base UI, shadcn) renders HTML, and none of it runs in React Native. Using it would mean rebuilding every screen for mobile. Expo gives one codebase for the Buildathon web app and the later iOS and Android apps. Accepted costs: no shadcn or Base UI components, a slightly less polished web version, and AI-written React Native is a little less reliable than plain React.
- **Rejected: keep Vite and wrap it with Capacitor later** — fastest for the two days and no change to the usual stack, but the store app would be a website inside a native shell. That feels like a web page, and animations, haptics and health data access are weaker. A gamified app depends on how it feels in the hand.
- **Rejected: Next.js web app now, mobile rewrite later** — the quickest web demo, but it guarantees a full screen rewrite for mobile.
- **Hono + Drizzle + Postgres instead of Supabase** — Supabase was considered to avoid writing a backend. It lost because this app has real server logic (call the AI once, store the items, score by formula), which belongs in a proper API. Formulas become plain functions that Vitest can check. Supabase's per-user access rules are also a place where AI-written code tends to fail silently.
- **Clerk instead of Supabase Auth** — already the known choice, and it has an Expo package, so the same login works on web and mobile.
- **AI extracts numbers, code does the rating** — an AI asked to give a score can give a different one each run, which breaks a points system. With the split, every score is explainable, testable, and can be recomputed for free if the formula changes.
- **Estimate once and store** — the same meal can come back with slightly different gram counts on two AI runs. Storing the first result and never re-asking keeps a person's rating stable.
- **Per-item results, not just totals** — the person can spot and fix a wrong item, which fits the requirement that everything stored is editable.
- **Score in bands** — rating against ranges (for example protein per kilogram of body weight) stops small estimation noise from flipping a score.
- **Game logic in plain tables, no gamification library** — points, levels and badges are computed by the backend from stored rows, so they stay consistent and editable. There are no daily streaks, because the app is not expected to be used every day; the rules are in the `gamification` project skill.
- **Gemini free tier for the Buildathon only** — it costs nothing for the demo. Two limits make it unsuitable for real users: Google's terms allow free tier prompts and responses to be used to improve its products and read by reviewers, and the request quota is small. The AI call sits behind one backend function so the provider or tier can be changed in one place.
- **A Claude Max subscription does not replace an API plan** — Max includes some monthly API credits, but the API is otherwise billed separately, so it was not chosen as the free option for the demo.
- **Diet output is general guidance** — suggestions must not read as medical advice, since the audience includes people who are already struggling.
- **A vector knowledge base, because the Buildathon requires one** — the original plan was to rely on Gemini's own knowledge. The Buildathon asks for a knowledge base of our own that acts as a guardrail, and a vector database with retrieval is the form the judges are expected to look for.
- **pgvector inside the existing Postgres, not a separate vector database** — it is an extension, so there is no second service to run, deploy or pay for, and Drizzle supports vector columns and similarity search directly.
- **Retrieval is used for suggestions, not for the nutrient numbers** — suggestions are free-form health advice, which is where an unguided model is riskiest, so grounding them is a real guardrail. It also leaves the rating path untouched, so scores stay consistent.
- **Rejected: a knowledge base that the app never reads** — adding one only to tick the requirement was considered. It costs about the same as a small real one and adds a part that does nothing.
- **Rejected: plain tables without vectors** — a food reference table and a rules table would ground the app without any vector search, and at this size they would work as well. They were set aside because they may not count as the knowledge base the Buildathon asks for.
- **Hard limits stay in code** — telling the model to use only the retrieved notes is strong guidance, not a guarantee, so safety rules are enforced by the backend.
- **Notes are written in our own words, with sources** — the notes are the app's voice on health, so each one names where its guidance comes from and is reviewed by a person before the demo.
- **Accepted cost of retrieval** — each rating makes one extra embedding call and one extra text call against the Gemini free tier quota. With only a few dozen notes, vector search does less than it appears to; it earns its place as notes grow and more life areas are added.
- **`gemini-3.8-flash` for text** — on 2026-11-14 it was the newest Gemini model marked stable, it is on the free tier, and it supports structured output, which the per-item nutrient list depends on. Rejected: the Gemini 2.5 models (deprecated, and rerouted to other models from 2026-12-01), `gemini-4-hydrogen` (free, but carried no stable label), and the Pro and other Gemini 4 models (not on the free tier).
- **`gemini-embedding-2` at 768 dimensions for vectors** — it is Google's recommended embedding model and is on the free tier. 768 is one of its recommended sizes; it keeps rows small and stays under pgvector's limit for indexed columns, which the default 3072 does not. Rejected: `gemini-embedding-001`, the older text-only model. Three things to know when building: this model has no task type setting, so queries and notes are marked with a text prefix instead; several texts sent in one content list come back as one combined vector, so each note is sent as its own content; and vectors from different embedding models cannot be mixed, so changing the model means re-embedding every note.
- **Model names live in one config place** — Gemini model names change often, so the backend reads them from configuration and no other file names a model.
- **Expo SDK 57 with NativeWind 4.2.7 and Tailwind CSS 3.4, pinned** — this is the combination NativeWind's own install guide names as supported. NativeWind 5, which uses Tailwind v4, was still a release candidate on 2026-11-14 and its maintainers had not promoted it to stable. Expo SDK 58 was already out, but stable NativeWind did not state support for it. A two-day build should not sit on a release candidate. Accepted cost: Tailwind v3 uses a config file, unlike the CSS-based theme of Tailwind v4 in the owner's other projects. Revisit after the Buildathon.
- **`@clerk/expo`, web components first** — this package replaced the older `@clerk/clerk-expo`. Its web components cover the Buildathon. Its prebuilt native sign-in screens were in beta and need a development build, so the native sign-in approach is decided in the mobile phase.
- **The Expo app lives in `mobile/`** — Expo Router keeps its screens in a folder called `app`, so naming the project folder `app/` would nest two folders of the same name. `web/` would mislabel a project whose real target is mobile. The backend stays in `api/`.
- **Lucide icons and the Geist font, as in the owner's other projects** — `lucide-react-native` and `@expo-google-fonts/geist` are the React Native equivalents. On web, Lucide's default import style can pull the whole icon set into the bundle, so icons are imported the way Lucide's optimisation guide describes.
- **About thirty diet notes for the demo, reviewed by the project owner** — enough for retrieval to return different notes for different gaps, and small enough to review in one sitting. The notes are drafted from public dietary guidance, and none is loaded until the owner has read it.
- **One Lightsail instance running both containers** — the project owner's choice. The API and Postgres run side by side under docker-compose on a single virtual server, which is simple and cheap for a demo and mirrors local development exactly.
- **A Lightsail instance, not the Lightsail container service** — an instance is a plain server where docker-compose and volumes behave normally. Community reports say the container service does not support persistent volumes, which would lose the database on redeploy. This was not confirmed against AWS's own documentation, and it does not matter while the instance is used.
- **Postgres data on a persistent volume** — without one, the database is wiped whenever its container is recreated, which every deploy can do.
- **Postgres in a container instead of a managed database** — accepted for the Buildathon because it costs nothing extra and needs no second service. Accepted cost: nothing takes backups automatically, and the database shares one server's memory and disk with the API.
- **GitHub pipeline for deployment, not GitLab** — the owner's other projects use GitLab CI/CD. This project deploys through a GitHub pipeline by the owner's choice.

## Future

- **Paid AI tier before real users** — move off the Gemini free tier before anyone outside the demo enters personal data.
- **Database backups before real users** — either scheduled backups of the Postgres volume or a move to a managed database. The demo setup has neither.
- **Nutrient lookup from a food database** — later the AI only identifies foods and portions, and the gram values come from a food database instead of the model's estimate. The food entries can live in the same knowledge base.
- **Knowledge notes for other life areas** — each new area adds its own notes to the same knowledge base.
- **Mobile release** — iOS and Android builds from the same Expo codebase, after the Buildathon.
- **Push notifications for reminders** — the mobile replacement for email reminders.
- **Resend for email** — part of the usual backend stack, deliberately left out of the Buildathon build because the demo sends no email.

## Open items

The technical items that were open when the stack was locked are now settled and recorded under Decisions. What remains:

- **Product scope, not tech:** which life areas beyond diet are in the Buildathon demo. The working assumption is diet end to end, with one more area at most.
- **To check before the demo:** the live free tier request limits for both Gemini models, shown in Google AI Studio. They were not verified when the models were chosen.
- **To settle when the pipeline is built:** where the app's Docker image is built and stored, how the pipeline reaches the instance, and how the demo URL gets HTTPS. The suggestion on record is to build the image in the pipeline and not on the instance, since a small instance can run out of memory during a build.
- **Confirmed at project setup (2026-11-14):** the pinned versions install and run together: Expo SDK 57.0.33, NativeWind 4.2.7 with Tailwind 3.4.19, `@clerk/expo` 4.16.1, Hono 4.13, Drizzle 0.45, Node 22.23. One thing learned: NativeWind needs `darkMode: 'class'` in the Tailwind config, because Expo sets the colour scheme from `userInterfaceStyle` and NativeWind refuses that in its default media mode.
- **Shared TypeScript between app and API:** the `shared/` workspace holds content both sides need, and the app imports the API's route types directly (`import type` from `api/src/app.ts`) for Hono's typed client. No build step; Metro and tsx both read the TypeScript source.
