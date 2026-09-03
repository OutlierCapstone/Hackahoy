# Problem 7 - Fake Departure Form

AI prompt-injection challenge supplied by the challenge author. Players can
edit only the remarks field of a sealed departure form. The backend asks Gemini
for a JSON verdict and returns the server-side flag only when the verdict has
`approved: true`.

The desktop demo runs the frontend and backend as separate Compose services.
The frontend exposes `/api/*` as a same-origin rewrite to `prob7-backend`, so
the existing OpenResty route on port 5007 can continue to target the frontend.

Runtime secrets are not stored here:

- `GEMINI_API_KEY` is restored from the existing per-user DPAPI file.
- `PROB7_FLAG` is restored from `prob7-flag.dpapi` by `desktop-deploy.ps1`.
- `DEMO_MOCK_AI=true` and the placeholder flag in `.env.example` are for local
  smoke tests only.

The backend limits each player to one AI request every eight seconds and caps
concurrent Gemini judgments at three to prevent accidental quota or cost spikes.
