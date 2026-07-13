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
| `too-light.webp` | 960×960 | 266,318 B | Top-down pizza with sparse cheese and visible sauce | Retained as a reference image | Same crop family as the other images. The label is directionally useful, but the sauce appears fairly heavy, so the new lab does not rely on it as precise proof. | Retain as secondary reference |
| `balanced.webp` | 960×960 | 265,124 B | Top-down pizza with sauce, melted cheese and mushrooms | Retained as a reference image | Consistent top-down crop and useful balanced comparison. It includes mushrooms, so it is not a pure cheese-only variable study. | Retain as secondary reference |
| `too-heavy.webp` | 960×960 | 291,162 B | Top-down pizza with heavy cheese and multiple toppings | Retained as a reference image | Clearly communicates overload. It changes several variables at once, so it is useful as a warning image rather than a controlled single-variable comparison. | Retain as secondary reference |

## Image decision

Patch 342 did not add new photographic assets. The page uses the existing local images as supporting references and introduces a CSS-based visual simulation for the primary experiment. This avoids pretending that unrelated photos prove precise sauce or cheese gram thresholds.

No production topping asset contains people, hands, faces, arms, silhouettes, human reflections, logos, packaging or embedded text.

