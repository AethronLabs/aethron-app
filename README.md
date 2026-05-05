# Aethron App

React Native (Expo) frontend for [Aethron](https://github.com/AethronLabs/aethron-backend) — the OpenAPI-to-CLI platform.

Manage projects, upload specs, generate CLI commands, preview generated code, publish releases, and run live sandbox terminals — all from mobile or web.

## Screens

| Screen | Description |
|--------|-------------|
| Auth | Login / register via Supabase |
| Dashboard | All projects with stats |
| Project Detail | Spec upload, command generation, code preview, publish, build status |
| Sandbox | List sandbox sessions, start new ones |
| Sandbox Session | Live terminal into Docker sandbox via WebSocket |

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Running [aethron-backend](https://github.com/AethronLabs/aethron-backend)
- Supabase project

## Setup

**1. Clone**

```bash
git clone https://github.com/AethronLabs/aethron-app.git
cd aethron-app
npm install
```

**2. Configure environment**

```bash
cp .env.example .env
```

Edit `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
EXPO_PUBLIC_API_URL=http://localhost:3000
```

- **`EXPO_PUBLIC_SUPABASE_URL`** — Supabase dashboard → Project Settings → API → Project URL
- **`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** — Supabase dashboard → Project Settings → API → Publishable key
- **`EXPO_PUBLIC_API_URL`** — URL where aethron-backend is running

**3. Start**

```bash
# iOS simulator
npm run ios

# Android emulator
npm run android

# Web browser
npm run web
```

## Connecting to the backend

`EXPO_PUBLIC_API_URL` must point to a running aethron-backend instance. Auth tokens from Supabase are sent as `Authorization: Bearer <token>` on every API request — the backend verifies them against the same Supabase project.

Both this app and aethron-backend must use the **same Supabase project** for auth to work.

## Tech

- [Expo](https://expo.dev) / React Native
- [@supabase/supabase-js](https://github.com/supabase/supabase-js) — auth
- React Navigation — screen routing
- Custom sidebar + theme context (dark/light)

## Contributing

1. Fork the repo
2. Create a feature branch
3. Open a pull request against `master`

Please open an issue before starting large changes.

## Related

- [aethron-backend](https://github.com/AethronLabs/aethron-backend) — Rust API server

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
