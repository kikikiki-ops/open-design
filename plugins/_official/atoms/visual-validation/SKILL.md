---
name: visual-validation
description: Reserved atom id for planned post-generation screenshot comparison once the daemon can execute it against fresh artifacts.
od:
  scenario: new-generation
  mode: critique
---

# Visual validation

This reserved atom id is intentionally not executable in the current pre-start
pipeline. A runnable visual-validation worker needs a post-generation hook so
it can compare fresh artifacts instead of the pre-run HTML snapshot.

## Current state

- `od plugin doctor` warns when a plugin references `visual-validation`.
- The daemon registry treats it as planned and skips it in pipeline stages.
- The helper code under `apps/daemon/src/plugins/atoms/visual-validation.ts`
  remains implementation scaffolding for a future post-generation integration.

Do not rely on this atom for critique-stage signals until the daemon ships a
real post-generation execution boundary.
