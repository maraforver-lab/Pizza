# Patch 469C: Quick Calculator release verification

## Summary

Patch 469C released the Patch 469A/469B Quick Dough Calculator UX to production and verified the public route:

- `/calculator/quick`

The release initially deployed application commit `5e6c2e5479c367aff76cdb016d15aec197db93f9`. Production verification found one concrete guidance-level defect: a Pizza Nerd-only exact fermentation temperature could remain active after switching down to Enthusiast without a confirmation dialog. The minimal release fix was committed as `89c1f7f0` and redeployed.

Final production deployment:

- Deployment URL: `https://pizza-o88fnr5b7-maraforver.vercel.app`
- Production alias: `https://www.doughtools.app`
- Vercel status: `READY`
- Vercel project: `pizza`

No database migration was applied and no production account, session, API or cloud data was modified.

## Preflight

- Expected starting commit confirmed: `5e6c2e5479c367aff76cdb016d15aec197db93f9`
- `master` matched `origin/master` before release work.
- Tracked working tree was clean before deployment.
- Vercel project confirmed as `pizza`.
- Supabase local and remote migration histories matched through `20260722131000`.
- No pending migration was found.
- No new environment variable requirement was found.
- Admin prototype routes remained protected by source and test coverage.

## Automated validation

Before the first production deployment:

- `npm run test -- tests/quick-calculator.test.ts tests/quick-calculator-prototypes.test.ts tests/experience-levels.test.ts tests/responsive-visual-audit.test.ts tests/accessibility-baseline.test.ts`
- `npm run lint`
- `npm run build`
- `git diff --check`

After the release fix:

- `npm run test -- tests/quick-calculator.test.ts tests/experience-levels.test.ts tests/accessibility-baseline.test.ts tests/responsive-visual-audit.test.ts`
- `npm run lint`
- `npm run build`
- `git diff --check`

All listed validation passed.

## Defect found and fixed

Production defect:

- Route: `/calculator/quick`
- Level path: Pizza Nerd to Enthusiast
- Trigger: set the Pizza Nerd-only exact fermentation temperature to `8 C`, then switch to Enthusiast.
- Observed before fix: Enthusiast rendered without the exact-temperature input, but the result still used `8 C` and changed the yeast output from `0.66 g` to `0.50 g`.
- Expected: switching to Enthusiast should detect the hidden Pizza Nerd-only value, show `Use Enthusiast practical settings?`, and reset the exact fermentation temperature to the canonical default for the selected environment.

Root cause:

- `fermentationTemperatureCelsius` was included in the Enthusiast-supported key list even though Enthusiast does not expose the exact temperature input.

Correction:

- Removed `fermentationTemperatureCelsius` from the Enthusiast-supported key list.
- Added a focused regression test proving exact fermentation temperature is Pizza Nerd-only for reset detection.

Production retest after fix:

- Setting Pizza Nerd exact temperature to `8 C` and switching to Enthusiast now shows:
  - `Use Enthusiast practical settings?`
  - `This resets Pizza Nerd-only recipe settings. Your pizza count and practical recipe controls stay the same.`
- Confirming `Use practical settings` resets the hidden exact temperature and restores the canonical default result.

## Production measurements

### 390x844

| Level | Live Recipe top | Ingredient list top | Share recipe top | Controls top | Document height | Result |
|---|---:|---:|---:|---:|---:|---|
| Beginner | 374 px | 598 px | 945 px | 1029 px | 2162 px | Pass |
| Enthusiast | 326 px | 550 px | 905 px | 989 px | 3308 px | Pass |
| Pizza Nerd | 326 px | 550 px | 905 px | 989 px | 4606 px | Pass |

### 430x740

| Level | Live Recipe top | Ingredient list top | Share recipe top | Controls top | Document height | Result |
|---|---:|---:|---:|---:|---:|---|
| Beginner | 350 px | 537 px | 883 px | 968 px | 2080 px | Pass |
| Enthusiast | 326 px | 513 px | 867 px | 952 px | 3170 px | Pass |
| Pizza Nerd | 326 px | 513 px | 867 px | 952 px | 4400 px | Pass |

### 1280x900

| Level | Live Recipe top | Ingredient list top | Share recipe top | Controls top | Document height | Result |
|---|---:|---:|---:|---:|---:|---|
| Beginner | 334 px | 527 px | 874 px | 334 px | 1327 px | Pass |
| Enthusiast | 286 px | 519 px | 874 px | 286 px | 1722 px | Pass |
| Pizza Nerd | 286 px | 519 px | 874 px | 286 px | 2719 px | Pass |

### 1440x900

| Level | Live Recipe top | Ingredient list top | Share recipe top | Controls top | Document height | Result |
|---|---:|---:|---:|---:|---:|---|
| Beginner | 334 px | 527 px | 874 px | 334 px | 1327 px | Pass |
| Enthusiast | 286 px | 519 px | 874 px | 286 px | 1722 px | Pass |
| Pizza Nerd | 286 px | 519 px | 874 px | 286 px | 2719 px | Pass |

## Guidance-level verification

Beginner:

- Only pizza count was editable.
- Dough-ball weight, fermentation controls, hydration, salt, extra dough, yeast type, exact temperature, preferments, dough-temperature tools, flour tools, baker's percentages and assumptions were absent.
- No technical disclosure list rendered.
- Live Recipe stayed near the top.
- Document height stayed below the preferred 2600 px mobile target.

Enthusiast:

- Pizza count, dough-ball weight, fermentation duration, fermentation environment, hydration, salt, extra dough and yeast type were available.
- Exact technical temperature, preferments, sizing systems, advanced dough-temperature tools, flour blend, custom ingredients, baker's percentages and calculation assumptions were not exposed.
- The yeast disclosure opened successfully and showed all yeast options without exact temperature.

Pizza Nerd:

- Complete technical workspace was available.
- Formula, yeast/temperature and baker's percentages opened by default.
- Sizing, preferments, technical tools and assumptions remained collapsed unless opened.
- Pizza Nerd did not auto-expand every technical group on mobile.

## Share recipe verification

Production route:

- `Share recipe` rendered as the only result action.
- `Copy recipe`, share-link action and saved-recipe UI were absent.
- In the in-app browser, selecting `Share recipe` generated the local recipe image and returned the status `Recipe image shared.`
- No fallback preview opened because native sharing succeeded in this browser.
- Fallback preview and `Save image` behavior remained covered by focused automated tests and source verification.

Recipe image source verification:

- `createQuickRecipeImageDataUrl` creates a local canvas.
- Canvas size is `1080 x 1350`.
- Export format is PNG data URL.
- The generated image includes DoughTools branding, `Dough recipe`, dough-ball summary, total dough, flour, water, salt, yeast, fermentation summary, `Planned with DoughTools` and `doughtools.app`.
- No upload, API call, Supabase write, account write, session write or Pizza Plan write is used.

## Local data and privacy

- Saved-recipe UI was absent at every guidance level.
- Public calculator no longer presented Save, Load, Rename, Duplicate or Delete recipe controls.
- Existing legacy localStorage data was not cleared, migrated or deleted.
- Quick Calculator continued to state: `Quick Calculator does not create or prepopulate a Pizza Plan.`
- `/session/start` opens only through the explicit Pizza Plan handoff.

## Control-route checks

HTTP status checks:

- `/` returned `200`.
- `/guide` returned `200`.
- `/session/start` returned `200`.
- `/calculator/quick` returned `200`.
- `/guide/practical-pizza-tips` returned `200`.

No visual or functional regression was observed on the checked control routes during this release verification.

## Console and layout

Across `/calculator/quick` at `390x844`, `430x740`, `1280x900` and `1440x900`:

- No horizontal overflow was detected.
- No console errors or hydration warnings were detected.
- Result values remained dominant.
- Old saved-recipe, copy and share-link actions remained absent.

## Release decision

Release approved after the focused production defect was corrected and redeployed.

Remaining note:

- Native share succeeded in the available production browser, so fallback preview was not visually forced in production. Fallback coverage is documented as automated/source-verified for this release.
