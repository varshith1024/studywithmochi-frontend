# StudyWithMochi frontend

Next.js (App Router) + Three.js + Tailwind CSS v4.

```bash
npm install
cp .env.local.example .env.local   # point at your Spring Boot API
npm run dev                        # http://localhost:3000
```

Backend must allow this origin: `CORS_ALLOWED_ORIGINS=http://localhost:3000`.
Auth uses the HttpOnly `access_token` cookie, so every request goes through `lib/api.ts` with `credentials: "include"`.
