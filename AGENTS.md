# DoughTools project instructions

Always follow:

- `docs/global-responsive-ux-rules.md`
- `docs/visual-style-guide.md`
- `docs/design-system.md`

Core product rules:

- Desktop = guided workspace.
- Mobile = focused app experience.
- Same logic, different layout.
- Do not create separate mobile business logic.
- Do not create separate mobile wizard flows.
- New pages must use shared layout components where possible.
- New pages must not create unrelated custom layouts.
- Colors must come from the official DoughTools palette and semantic aliases in `docs/design-system.md`.
- Legacy color names are compatibility aliases only.
- Do not add new arbitrary brand colors or near-duplicate palette values.
- Buttons must use shared variants where possible.
- Cards must use shared card patterns where possible.
- Marketing and workspace surfaces have different roles, but must share the same visual foundation.
- Realistic image rules in `docs/visual-style-guide.md` are mandatory.
- Do not create or commission AI-generated images containing people, including hands or silhouettes, without Marcin's explicit approval.
- Future icon work must follow one icon system; emoji are not primary functional UI icons.
- Desktop may show more context.
- Mobile must be compact and kitchen-use friendly.
- On desktop, Back is secondary bottom-left and primary forward action is bottom-right.
- On mobile, primary forward action is prominent and easy to tap; Back is secondary.
- Do not introduce generic SaaS blue styling.
- Do not overuse Italian clichés.
- Do not redesign individual pages independently unless explicitly requested.
- Do not change formulas, calculations, persistence, auth, SEO, pricing or route behavior unless the task explicitly requests it.

Testing guidance:

- Run relevant targeted tests.
- Run `npm run lint`.
- Run `npm run build`.
- Run `npm run test` when practical.
