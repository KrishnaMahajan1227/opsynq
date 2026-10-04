# FINAL COMPANY AI COPILOT

- AI is Company-side only. Agency and Technician frontends have no AI surface and cannot use the platform AI route.
- Server enforces the current Company tenant and the signed-in Company role capability before building AI facts.
- Questions are intent-routed only to an authorized OPSYNQ module context.
- Responses are concise: direct answer, key facts, next steps and at most two data limitations.
- AI is read-only. It cannot mutate records. Controlled automation proposals still require authorized human confirmation.
- Action buttons are generated from the question/context and filtered by the signed-in role.
- Secrets, credentials, system prompts, source internals and other-tenant requests are refused.

QA:
- npm run qa:ai-final
- npm run qa:source
