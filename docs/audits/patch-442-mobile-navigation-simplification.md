# Patch 442: Mobile Navigation Simplification

## 1. Previous Menu Problems

The previous mobile menu was a long dropdown with nearly equal visual priority for planning, learning links, Quick Calculator, About and Account. Account appeared last, the Learning Center links were all exposed at once, and the menu used a translucent dropdown surface that allowed the page behind it to remain visually present.

## 2. New Information Architecture

The mobile menu now uses this task order:

1. My account
2. Your pizza
3. Tools
4. Learn
5. About

Desktop navigation remains on the existing primary row: Plan my next pizza, Learning Center dropdown, Quick Calculator, About and Account.

## 3. Account Priority

Account is the first section in the mobile menu.

Signed-out state:

- Label: Sign in
- Copy: Save your pizza plans and continue on another device.
- Route: `/account`

Signed-in state:

- Label: My account
- Copy: Manage your pizza plans and preferences.
- Route: `/account`

Loading state:

- Label: Checking account...
- Copy: Checking sign-in status.

The loading state avoids flashing Sign in while authentication is still unresolved.

## 4. Active-Session Action Behavior

The Your pizza section uses `resolveCanonicalActivePizzaSession()` and the returned canonical `href`.

When an active session exists, the menu shows:

- Continue making your pizza
- Context line from the current session step, such as Continue from Kitchen, Continue from Shopping or Continue from Review.

When no active session exists, the menu shows:

- Start making a pizza
- Route: `/session/start`

When active-session resolution is pending, it shows:

- Checking your pizza...

No technical route names, session ids or cloud row ids are exposed in the menu.

## 5. Tools Structure

Patch 442 exposes only the existing functional tool:

- Quick dough calculator -> `/calculator/quick`
- Copy: Calculate dough amounts without starting a full pizza plan.

The Tools section includes a stable extension point before Quick dough calculator so Patch 443 can add a standalone Bake timer link without redesigning the menu.

Patch 442 intentionally does not add a Bake Timer link.

## 6. Collapsed Learning Structure

The Learn section is collapsed by default whenever the menu opens.

Closed label:

- Learn to make better pizza
- Practical guides for dough, sauce, ovens and common problems.

Expanded links:

- How to make pizza dough -> `/guides/dough`
- How to make pizza sauce -> `/sauce`
- Choose and use your oven -> `/ovens`
- Choose your pizza style -> `/styles`
- Fix common pizza problems -> `/guide/pizza-troubleshooting`
- View all pizza guides -> `/guide`

The Learning Center is no longer duplicated in the mobile menu as both a heading and a full always-visible list.

## 7. Label and Route Consistency

The route mapping uses existing canonical guide pages. Current page headings are reasonably aligned with the new task labels:

- Dough: `Pizza Dough Guide`
- Sauce: `Make the sauce, then measure it clearly.`
- Ovens: existing oven guide page
- Styles: existing pizza style guide page
- Troubleshooting: `What went wrong with your pizza?`
- Guide landing: `Find the right pizza guide.`

No guide-page headings were rewritten in Patch 442.

## 8. Viewport and Scroll Behavior

The mobile menu is now a fixed full-viewport surface using `100dvh`, an opaque cream background and safe-area-aware top and bottom padding.

When the menu opens:

- background page scroll is locked
- the previous background scroll position is preserved
- only the menu content scrolls
- the menu covers the full viewport
- no translucent backdrop exposes the page underneath

## 9. Accessibility

The mobile menu uses modal dialog semantics with a nested navigation landmark.

Implemented behavior:

- `role="dialog"`
- `aria-modal="true"`
- labelled menu heading
- close button with `aria-label="Close menu"`
- focus moves to the close button on open
- Escape closes the menu
- focus returns to the menu trigger after close
- Tab focus is trapped inside the menu while open
- Learn disclosure uses `aria-expanded` and `aria-controls`
- selecting a navigation link closes the menu
- toggling Learn does not close the menu

## 10. Desktop Preservation

The desktop navigation structure and labels are unchanged. The Learning Center desktop dropdown remains available, including its existing guide links and menu semantics.

## 11. Patch 443 Integration Point

The mobile Tools section now has a stable `data-mobile-tools-extension-point="before-quick-dough-calculator"` marker. Patch 443 can add:

- Bake timer
- Time one pizza without starting a Pizza Session.

before Quick dough calculator without restructuring the mobile menu.

## 12. Test Coverage

Focused tests cover:

- mobile information-architecture order
- account loading, signed-out and signed-in copy
- canonical active-session resolver usage
- active and empty pizza actions
- Tools copy and Quick Calculator route
- absence of a Bake Timer link in Patch 442
- collapsed Learn structure and practical guide labels
- full-screen opaque menu presentation
- scroll-lock implementation
- focus-return and focus-trap source behavior
- desktop navigation preservation

## 13. Protected Invariants

Patch 442 does not change:

- authentication routes or flows
- Pizza Session schemas
- canonical session resolver behavior
- cloud authority
- formulas
- Timeline, Kitchen, Shopping or Review behavior
- Quick Calculator behavior
- guide routes
- SEO
- Supabase migrations or RLS
- Party Orders
