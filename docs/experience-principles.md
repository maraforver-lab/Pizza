# DoughTools Experience Principles

Version: 1.0  
Purpose: permanent product philosophy and UX North Star for DoughTools.

Use this document with:

- [Design system](./design-system.md)
- [Visual style guide](./visual-style-guide.md)
- [Global responsive UX rules](./global-responsive-ux-rules.md)
- [Experience levels](./experience-levels.md)

This is the authoritative product-experience source. Other documents may reference it, but should not duplicate it.

## Product mission

DoughTools exists to make home pizza planning easier, clearer, and more enjoyable.

The product does not exist to calculate dough.

It exists to help people confidently make better pizza.

## North Star

People don't come to DoughTools because they want calculations.

They come because they want confidence.

Every future design decision should be evaluated against this principle.

## Product position

DoughTools is not:

- a dough calculator
- a recipe blog
- a glossary
- a timer
- a collection of pizza utilities

DoughTools is:

The most trusted pizza planning and learning companion for home pizza makers.

## Homepage philosophy

The homepage sells the outcome.

The application teaches the workflow.

The homepage should create desire.

The application creates confidence.

## Landing-page principles

### Sell the pizza first

Sell the software second.

The user should want the pizza before they study the interface.

### Speak the user's language

Avoid introducing internal terminology before user value.

Avoid:

```text
Start Pizza Session
```

Prefer:

```text
Plan my next pizza
```

Introduce product terms such as “Pizza Session” only after the user has entered the workflow.

### One question at a time

Never overwhelm users.

Each page should answer one primary question.

### Show before telling

Whenever possible, use:

- photography
- diagrams
- comparisons
- real UI

before long explanations.

### Emotion before interface

Food photography creates desire.

The interface creates trust.

Both are required.

### Every image has a job

Images must:

- teach
- inspire
- explain
- support navigation

They should never exist only for decoration.

### Explain why

Never explain only what to do.

Always explain:

- why
- when
- what changes
- what happens

### Practical before technical

Teach through practical pizza-making.

Only then introduce specialist terminology.

### One obvious next action

Every page should make the next step obvious.

Users should never ask:

```text
What should I do now?
```

## Photography philosophy

Photography should:

- create appetite
- create trust
- create realism

Avoid:

- stock-photo feeling
- artificial perfection
- unnecessary people
- fake chefs
- unrealistic pizza

The first reaction should be:

```text
I want to make that pizza.
```

## Learning philosophy

Users learn best when they:

- solve a problem
- understand one concept
- immediately apply it

Every educational page should connect back to DoughTools.

Learning should always lead to action.

## UX philosophy

Reduce uncertainty.

Never increase it.

Every page should leave users feeling more confident than when they arrived.

## Design philosophy

Consistency builds trust.

Every page should feel like part of one product.

The following must feel coherent:

- typography
- photography
- spacing
- icons
- buttons
- cards
- navigation
- footer
- tone of voice

The homepage footer is the canonical DoughTools site footer. Existing footer-bearing pages should use the shared footer component so the end of each page feels like the same product. Pages without a footer should not receive one automatically, especially focused workflow pages.

The footer should close the page. Route-specific sources, notes, final CTAs or product metadata belong before it, not after it.

## Future content rules

Every future guide should answer:

- What is it?
- Why does it matter?
- How do I recognize it?
- What should I do?
- What should I try next?

Avoid encyclopedia-style articles.

Prefer visual learning.

## Success metric

Every feature should answer:

```text
Does this make someone more confident and excited to make pizza?
```

If the answer is “no,” reconsider the design.

## Governance

Future product, UX, design, learning and marketing patches should reference this document during implementation.

These principles may be overridden only when a user request explicitly states an approved exception.

When a future patch conflicts with this document, the implementation should name the conflict and explain why the exception is intentional.

Pizza Session persistence and resume work must also respect [Pizza Session autosave and resume](./pizza-session-autosave-and-resume.md) so local-first planning remains reliable without creating ghost sessions or silently overwriting active plans.
