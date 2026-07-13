# Topping Balance Lab sources and asset audit

Date accessed: 2026-07-13

This document supports Patch 342. The page uses DoughTools' existing topping calculator as the product baseline, then adds an educational visual layer. The sources below establish practical principles, not universal gram rules.

## Research notes

| Source | Organization / author | URL | Point used | Source role |
| --- | --- | --- | --- | --- |
| How to add pizza toppings — the right way | King Arthur Baking | https://www.kingarthurbaking.com/blog/2024/06/07/add-pizza-toppings | Topping order, restrained addition and preparation matter more than simply adding more ingredients. | Expert practical guidance |
| How To Make Homemade Pizza | Gozney | https://www.gozney.com/blogs/news/how-to-make-homemade-pizza-a-complete-guide | Too much sauce or cheese can contribute to soggy centers, especially with fast-cooking pizza ovens. | Expert practical guidance |
| The Pizza Lab: The Best Low-Moisture Mozzarella For Pizzas | Serious Eats / J. Kenji López-Alt | https://www.seriouseats.com/the-pizza-lab-the-best-low-moisture-mozzarella-for-pizzas | Low-moisture mozzarella behaves differently from fresh mozzarella and is commonly useful for longer-baked styles. | Expert practical guidance |
| Pizza Sauce Guide and Calculator source notes | DoughTools research notes | docs/research/pizza-sauce-sources.md | Sauce amount, tomato texture and water content must be judged together with cheese and oven behavior. | DoughTools synthesis |
| Pizza Oven and Heat Guide source notes | DoughTools research notes | docs/research/pizza-oven-sources.md | Heat balance, bake time and oven environment affect moisture management and topping restraint. | DoughTools synthesis |

## DoughTools interpretation

- Sauce grams and cheese grams are useful learning anchors, but they are not exact universal truths.
- Pizza diameter alone is not enough. The clear rim reduces the usable topped area.
- Sauce, cheese, fresh mozzarella drainage, additional toppings and oven heat must be understood as one moisture system.
- A visual simulation is more honest than relabeling unrelated photographs with precise gram values.
- The lab therefore displays normalized density per 100 cm² and clear practical language such as “starting balance,” “likely” and “possible.”

## Current `public/toppings/` asset audit

| File | Dimensions | Size | Subject | Current use | Realism and accuracy | Recommendation |
| --- | ---: | ---: | --- | --- | --- | --- |
| `too-light.webp` | 960×960 | 266,318 B | Top-down pizza with sparse cheese and visible sauce | Legacy local reference asset | Same crop family as the other original images. Directionally useful but not a controlled single-variable study. | Retain in repo for compatibility / avoid unrelated cleanup |
| `balanced.webp` | 960×960 | 265,124 B | Top-down pizza with sauce, melted cheese and mushrooms | Legacy local reference asset | Consistent top-down crop and useful balanced comparison, but mushrooms make it unsuitable as a pure cheese-only variable reference. | Retain in repo for compatibility / avoid unrelated cleanup |
| `too-heavy.webp` | 960×960 | 291,162 B | Top-down pizza with heavy cheese and multiple toppings | Legacy local reference asset | Clearly communicates overload, but it changes several variables at once. | Retain in repo for compatibility / avoid unrelated cleanup |
| `references/sauce-light.webp` | 960×960 | 172,994 B | Pizza with sparse tomato coverage | Active realistic sauce reference | Shows light sauce as a distinct variable while keeping the rim and dough visible. | Use |
| `references/sauce-balanced.webp` | 960×960 | 232,582 B | Pizza with even tomato coverage | Active realistic sauce reference | Shows thin, even tomato coverage and a clear rim. | Use |
| `references/sauce-heavy.webp` | 960×960 | 211,944 B | Pizza with deep tomato layer and wet pools | Active realistic sauce reference | Shows excessive sauce and visible moisture without changing cheese variables. | Use |
| `references/cheese-light.webp` | 960×960 | 187,884 B | Pizza with sparse fior di latte pieces | Active realistic cheese reference | Shows sauce still visible and cheese islands remaining separate. | Use |
| `references/cheese-balanced.webp` | 960×960 | 150,434 B | Pizza with restrained fior di latte islands | Active realistic cheese reference | Shows cheese supporting the sauce without forming a blanket. | Use |
| `references/cheese-heavy.webp` | 960×960 | 104,270 B | Pizza with near-continuous melted mozzarella | Active realistic cheese reference | Shows a cheese blanket that can trap steam and dominate the bake. | Use |
| `references/mozzarella-wet.webp` | 960×960 | 64,260 B | Fresh fior di latte pieces with visible milky liquid | Active realistic moisture reference | Shows undrained cheese before it reaches the pizza. | Use |
| `references/mozzarella-drained.webp` | 960×960 | 63,986 B | Fresh fior di latte pieces with dry-looking surface | Active realistic moisture reference | Shows drained cheese with no pooling liquid. | Use |

## Image decision

Patch 342 did not add new photographic assets. Patch 352 adds a controlled local WebP reference series for sauce amount, cheese amount and fresh mozzarella moisture state while keeping the CSS-based visual simulation as the primary live experiment. The reference images are teaching examples, not precise proof of universal gram thresholds.

No production topping asset contains people, hands, faces, arms, silhouettes, human reflections, logos, packaging or embedded text.

