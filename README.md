# HireFlowly

AI-powered resume analyzer that compares resumes against job descriptions, scores impact/authenticity, and suggests improvements.

## Live App

- Primary: https://hire-flowly.vercel.app

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Edge Functions)
- Vitest (tests)

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure frontend environment

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 3. Run the app

```bash
npm run dev
```

App runs on `http://localhost:8080` (see Vite config).

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - build production bundle
- `npm run preview` - preview production build locally
- `npm run test` - run tests once
- `npm run test:watch` - run tests in watch mode
- `npm run lint` - run lint checks

## Deploy (Vercel)

1. Import this repo into Vercel.
2. Keep framework preset as `Vite`.
3. Add frontend env vars in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Deploy.

SPA routing rewrite is already configured in [vercel.json](vercel.json).

## Supabase Edge Function Setup

Function path: [supabase/functions/analyze-resume/index.ts](supabase/functions/analyze-resume/index.ts)

Required function secrets:

- `AI_GATEWAY_URL`
- `AI_GATEWAY_API_KEY`

Optional function secret:

- `ALLOWED_ORIGINS` (comma-separated list of allowed browser origins)

### Deploy the function

```bash
npx supabase functions deploy analyze-resume
```

### Set secrets (example)

```bash
npx supabase functions secrets set AI_GATEWAY_URL="https://your-ai-gateway-url" AI_GATEWAY_API_KEY="your_key" ALLOWED_ORIGINS="https://hire-flowly.vercel.app,http://localhost:5173"
```

## Notes

- Google OAuth in the app uses native Supabase auth flow.
- Vercel SPA rewrites are handled in [vercel.json](vercel.json).

