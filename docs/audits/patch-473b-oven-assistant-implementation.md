# Patch 473B: Oven Assistant implementation

## Starting commit

`4787c6c4645d81be66b645499941e2eb389fb43d`

## Previous hierarchy

The Ovens page opened as a broad comparison and quickly became a large equipment and setup catalogue. Users had to scan several setup paths and gear sections before the main decision was clear: which oven path should I follow?

## Implemented Oven Assistant hierarchy

The page now opens with a compact purpose statement:

`Get better pizza from the oven you already have.`

The first interactive decision is:

`What oven do you use?`

The primary page order is now:

1. compact page identity
2. oven-path choice
3. recommended setup for the selected path
4. practical bake guidance
5. detailed setup paths and teaching images
6. troubleshooting and recovery guidance
7. collapsed equipment reference
8. compact Pizza Plan handoff
9. footer

## Oven paths

The assistant uses three presentation paths:

- Home oven
- Pizza oven
- Closest other setup

These paths do not create new oven logic or planner presets. Home oven and Pizza oven remain the canonical Pizza Plan oven choices; other setups direct the user toward the closest practical existing guidance.

## Equipment restructuring

The primary flow now shows only a compact set of tools relevant to the selected oven path. The full equipment list remains available in one collapsed section:

`View all equipment recommendations`

The existing Essential, Useful and Optional groups are retained inside that disclosure. No equipment data or image assets were added, removed or replaced.

## Removed lower-page section

The generic `What should I learn next?` block was removed from `/ovens`, including the broad Dough and Practical Tips cards. The remaining links are contextual: troubleshooting and the Pizza Plan handoff.

## Pizza Plan handoff

The page keeps one compact handoff:

`Plan with the oven you actually have.`

The action remains:

`Plan a pizza` → `/session/start`

Viewing or interacting with the Ovens page does not create a session or write planner state.

## Desktop result

At desktop widths, the first viewport is designed to show the page purpose, oven choice and beginning of the selected recommended setup before the detailed equipment reference. The complete equipment catalogue remains secondary.

## Mobile result

At mobile widths, the reading order is one column: title, oven choice, recommended setup, practical bake guidance, detailed setup paths, compact equipment reference and Pizza Plan handoff. The full equipment list is collapsed by default.

## Focused validation

Focused Ovens tests were updated to cover:

- new hero heading
- oven-path choice
- recommended setup before full equipment
- complete setup paths and images retained
- collapsed full equipment reference
- removed generic learning navigation
- Pizza Plan boundary
- guidance preference preservation

## Production result

Production verification is performed after the patch is merged, pushed and deployed. The final release result is reported in the patch final report.

## Boundaries

This patch did not change oven guidance logic, bake recommendations, Pizza Plan calculations, session behavior, APIs, database, migrations, image assets, header, navigation, footer or other Guide pages.
