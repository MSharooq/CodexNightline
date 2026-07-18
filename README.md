# Sahaayi

Sahaayi is a multilingual, voice-first support navigator for migrant workers in Kerala.

It helps a worker explain a need in their own language, understand the right next step, prepare for an existing service or benefit, and create a reviewed support request when escalation is needed.

## What is working now

- Mobile-first worker experience with Bengali, Hindi, Malayalam, Tamil, Odia, Assamese, Kannada, Telugu, Marathi, and English language selection
- Broad worker-helper journeys: benefits, wage support, injury/health help, registration, documents, and hospital navigation
- Guided support escalation with a worker review step
- A callback-request entry point that lets the Bolna voice agent call the worker, with safe demo fallbacks until it is configured
- Demo case status tracking and a caseworker dashboard
- Cloudflare Worker API routes for health checks, a Bolna case handoff, and service-directory data
- Progressive Web App metadata and offline shell

The app intentionally uses local demo data until external credentials are configured. It will run and present well without any API keys.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Environment variables

Copy the examples into a local `.dev.vars` file when you are ready to connect services:

```bash
cp .env.example .dev.vars
```

Do not commit `.dev.vars`. For Cloudflare deployment, add secrets with `npx wrangler secret put KEY_NAME`.

| Variable | When it is needed |
| --- | --- |
| `BOLNA_API_KEY` | To authenticate server-side requests to Bolna |
| `BOLNA_AGENT_ID` | To connect the worker voice experience to the configured Bolna agent |
| `BOLNA_FROM_PHONE_NUMBER` | The E.164 caller ID Bolna should use when calling a worker back |
| `BOLNA_FUNCTION_TOKEN` | A long random value configured as the Bearer token on Bolna custom functions that call Sahaayi |
| `OPENAI_API_KEY` | OpenAI key for the browser-helper fallback and structured support guidance |
| `OPENAI_MODEL` | Optional model override; defaults to `gpt-5.6-luna` in this project |
| `SUPABASE_URL` | To store real cases, conversations, and the verified service directory |
| `SUPABASE_ANON_KEY` | Public Supabase client access if worker sign-in is added |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only case and evidence writes; never expose this to the browser |
| `MAPBOX_ACCESS_TOKEN` | Optional: nearby verified support-centre and hospital maps |

## Bolna connection plan

1. Create a phone-call agent in Bolna and configure its supported languages.
2. Add every language offered by Sahaayi to the Bolna agent, then add this to the top of its main prompt: `The worker selected {preferred_language} ({preferred_language_code}). {language_instruction} Start the call in the selected language. Do not default to English.` Bolna replaces these callback variables at call time.
3. Keep the agent prompt strictly scoped: ask one question at a time, do not invent eligibility or legal outcomes, and flag urgent injuries immediately.
4. Add a custom function that calls `POST /api/bolna/case` with this shape. Configure the custom function’s Bearer token to match `BOLNA_FUNCTION_TOKEN`:

```json
{
  "workerLanguage": "Bengali",
  "issueType": "unpaid_wages",
  "urgency": "standard",
  "statement": "My contractor has not paid me for two months.",
  "evidence": ["payment-message"]
}
```

5. Replace the demo response in `worker/index.ts` with a Supabase insert after validating the custom-function Bearer token.
6. Pass only a short structured summary to a caseworker. Keep original audio/evidence access consent-based.

## Phone-call setup

Sahaayi uses a callback-only experience: the worker enters a phone number and the PWA posts it to `POST /api/callback`. The Cloudflare Worker calls Bolna’s Call API server-side, which starts the configured voice agent’s outbound call.

The callback endpoint sends `agent_id`, `recipient_phone_number`, optional `from_phone_number`, and worker context to Bolna. Do not call Bolna directly from the browser because the Bolna API key must remain secret.

Before deploying, add `BOLNA_API_KEY` and `BOLNA_AGENT_ID` as Cloudflare secrets/variables. Add `BOLNA_FROM_PHONE_NUMBER` too if your Bolna setup requires an explicit caller ID.

## Important product boundary

Sahaayi is an access and support layer, not a replacement for Kerala government systems. Any future ATHIDHI connection should be presented as an approved, API-based and consent-driven service handoff—not direct access to a government database.

## Verify before deploying

```bash
npm run cf-typegen
npm run build
npm run lint
```

## Deploy

After logging in to Cloudflare and adding the required secrets:

```bash
npm run deploy
```
