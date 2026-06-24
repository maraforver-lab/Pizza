# Start Here path

DoughTools Start Here is a beginner-friendly entry layer for users who know what kind of pizza they want to make, but do not yet want to tune every calculator setting.

It is not a separate calculator. It sends a safe starter setup into the existing DoughTools calculator, Planner and Dough Doctor workflow.

## Why it exists

The calculator is powerful, but a first-time user may not know whether to start with hydration, flour strength, oven type, fermentation time or ball weight. Start Here begins with the user goal instead:

1. Home oven pizza
2. Pizza oven pizza
3. Pan / tray pizza

The principle is:

> Choose the pizza path first. Adjust technical settings later.

## The three starter paths

### Home oven pizza

For a regular kitchen oven, especially with a baking steel, stone or sturdy tray.

The path keeps hydration and handling risk moderate. It focuses on preheating, timing, topping load and repeatability rather than chasing high-heat Neapolitan results.

### Pizza oven pizza

For high-heat outdoor pizza ovens such as Ooni, Gozney, Roccbox-style ovens or similar.

The path focuses on heat control, launching, turning and keeping toppings light. It avoids extreme hydration for the first high-heat bake.

### Pan / tray pizza

For pizza baked in a pan or tray.

The pan supports the dough, so the user can focus on fermentation, topping balance and baking instead of perfect round shaping or peel launching.

## Experience-level behavior

Start Here uses the shared DoughTools experience-level system.

### Beginner

Beginner copy should:

- show the next action clearly
- avoid jargon overload
- use safe defaults
- keep technical details secondary
- help the user start without understanding baker’s percentages

### Enthusiast

Enthusiast copy should:

- keep the same paths
- explain why the path works
- mention practical variables such as hydration, fermentation, flour strength, oven behavior and topping load
- help the user adjust with confidence

### Pizza Nerd

Pizza Nerd copy should:

- keep the same paths
- expose assumptions, constraints and tradeoffs
- mention dough handling risk, heat transfer, hydration range, timing and repeatability
- avoid unnecessary simplification

## Link behavior

Start Here uses the existing recipe URL parameter system. Starter path links may prefill:

- pizza count
- ball weight
- waste
- hydration
- salt
- yeast type
- fermentation
- temperature
- style
- oven
- flour
- pizza style

Only parameters already supported by the calculator are used.

## What Patch 22 does not change

Patch 22 does not change:

- dough formulas
- yeast calculations
- planner timing logic
- Dough Doctor diagnosis logic
- saved recipes
- shared recipe URL parsing
- BakeResult storage
- Journal IndexedDB
- authentication or Supabase behavior
- noindex, robots, sitemap or domain behavior

## Future work

Future patches can add deeper progressive disclosure inside the calculator, stronger starter presets, optional "compare paths" UI or smarter handoff between Start Here and recipe planning.
