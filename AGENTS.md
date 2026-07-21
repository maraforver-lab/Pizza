# DoughTools project instructions

Always follow:

- `docs/experience-principles.md`
- `docs/global-responsive-ux-rules.md`
- `docs/visual-style-guide.md`
- `docs/design-system.md`
- `docs/sitewide-hero-and-imagery-system.md`
- `docs/pizza-session-autosave-and-resume.md` when working on Pizza Session persistence or resume behavior

Core product rules:

- Future product, UX, design, learning, and marketing patches must respect the Experience Principles unless the user explicitly approves an exception.
- Desktop = guided workspace.
- Mobile = focused app experience.
- Same logic, different layout.
- Do not create separate mobile business logic.
- Do not create separate mobile wizard flows.
- New pages must use shared layout components where possible.
- New pages must not create unrelated custom layouts.
- New page introductions must follow the sitewide hero and imagery system.
- The homepage footer is the canonical site footer. Pages that already render a footer must use `components/SiteFooter.tsx`; pages without a footer must not receive one automatically.
- No visible route-specific content may appear after the footer. Route-specific notes, source disclosures and CTAs belong before the footer.
- Colors must come from the official DoughTools palette and semantic aliases in `docs/design-system.md`.
- Legacy color names are compatibility aliases only.
- Do not add new arbitrary brand colors or near-duplicate palette values.
- Buttons must use shared variants where possible.
- Cards must use shared card patterns where possible.
- Marketing and workspace surfaces have different roles, but must share the same visual foundation.
- Realistic image rules in `docs/visual-style-guide.md` are mandatory.
- Do not create or commission AI-generated images containing people, including hands or silhouettes, without Marcin's explicit approval.
- Future icon work must use the shared `DoughToolsIcon` semantic icon system backed by `lucide-react`; emoji are not primary functional UI icons.
- Desktop may show more context.
- Mobile must be compact and kitchen-use friendly.
- On desktop, Back is secondary bottom-left and primary forward action is bottom-right.
- On mobile, primary forward action is prominent and easy to tap; Back is secondary.
- Do not introduce generic SaaS blue styling.
- Do not overuse Italian clichés.
- Do not redesign individual pages independently unless explicitly requested.
- Do not change formulas, calculations, persistence, auth, SEO, pricing or route behavior unless the task explicitly requests it.
- Every route must have one primary user job. Do not let public pages grow into several loosely related products.
- Public learning pages should normally keep a compact content budget: one hero, one primary outcome or interaction, roughly three to six major sections, a compact related-learning group, one final primary action and the canonical footer.
- Use one dominant action per decision point. Avoid duplicate buttons or links that send users to the same destination for the same purpose.
- Related Learning should be curated, not a miniature sitemap; normally use no more than three links unless the user explicitly approves a broader index.
- Before adding a new visible section, first check whether the idea can be merged, shortened, disclosed, linked to an existing guide or omitted.
- Do not turn every fact into a card. Cards should represent meaningful groups, comparisons, states, results or interactions.

Testing guidance:

- Run relevant targeted tests.
- Run `npm run lint`.
- Run `npm run build`.
- Run `npm run test` when practical.

## Codex patch workflow

Use this lightweight workflow for future DoughTools patch prompts.

### Patch scope

1. One prompt covers one patch.
2. One patch should have one primary outcome.
3. Split work when objectives are independent.
4. Reuse existing architecture and helpers.
5. Do not build duplicate implementations.
6. Do not expand scope merely because nearby code could also be improved.
7. Do not perform unrelated cleanup.

### Prompt structure

Each patch prompt should normally contain only:

- Goal
- Read first
- Implement
- Do not change
- Acceptance criteria
- Validation
- Git
- Final report

Typical prompt length should be about 40-100 lines. Longer prompts are acceptable only when genuinely required for security, authentication, database migrations, RLS, or major architecture.

Do not repeat long project background or permanent repository rules in every prompt. Refer instead to `AGENTS.md`, the relevant plan, the relevant audit, or implementation documentation.

### Audits and planning

1. Do not create an audit when the implementation path is already clear.
2. Do not repeat an audit that already exists and is still current.
3. Read the existing audit and implement from it.
4. Create a new audit only when security architecture is unclear, database/RLS design is unclear, multiple materially different approaches exist, or the user explicitly requests an audit.
5. A small visual or copy change normally does not need an audit.
6. Do not create audit documents merely to satisfy a routine patch format.

### Validation

Use risk-based validation. Run only validation that can meaningfully detect regressions caused by the patch.

Documentation-only changes normally need:

- `git diff --check`
- documentation checks when available
- `git status --short`

Do not run the full test suite or production build for documentation-only changes unless repository policy or the changed documentation requires it.

Small UI or copy changes normally need:

- focused affected tests
- lint when relevant
- build when rendering, routing, or imports changed
- `git diff --check`

Logic changes normally need:

- focused behavior tests
- relevant regression tests
- full suite when shared logic or broad behavior changed
- lint
- build
- `git diff --check`

Security, auth, migrations, and RLS changes need the strongest relevant validation, including focused security tests, migration/RLS checks, full suite, lint, build, and `git diff --check`.

### Avoid duplicate validation

1. Do not rerun validation that was already completed successfully for the exact unchanged commit.
2. A fast-forward merge of an already validated commit normally needs only merge preflight, `git diff --check` for the merged commit, and final Git status.
3. Do not rerun the full suite merely because a validated branch is being fast-forward merged.
4. Do rerun validation when files changed after validation, conflicts were resolved, commits were amended, dependencies changed, the target branch changed incompatibly, or repository policy requires it.
5. Report clearly when validation was reused rather than rerun.

### Preflight and blockers

Before editing:

- confirm current branch and commit
- confirm tracked worktree state
- inspect required prerequisite patches
- inspect only the relevant files and documentation

Stop only for a real blocker, such as unrelated tracked changes, a missing prerequisite patch, an unsafe migration, unresolved security ambiguity, failed required validation, a non-fast-forward merge, an unavailable required asset or secret, or repository state that risks losing work.

Do not stop merely to ask for confirmation when the prompt already defines the desired behavior.

### Git workflow

After successful implementation and required validation:

- commit automatically
- fast-forward merge and push only when the prompt requests it
- do not deploy unless explicitly requested
- do not amend or rewrite unrelated history
- stage only files belonging to the patch

Always leave `supabase/.temp/` untouched. Never stage, modify, remove, or commit it.

### Final report

Keep the final report concise. Include only:

- starting commit
- patch commit
- resulting master commit when merged
- changed files
- key behavior implemented
- validation actually run
- validation reused but not rerun
- final Git status
- migration/deployment status when relevant

Do not repeat the full prompt or produce a long audit-style report for a small patch.
