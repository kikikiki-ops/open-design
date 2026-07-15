# Design QA — Community template search cards

## Evidence

- Source visual truth:
  - `/var/folders/5j/fb63hyxj11nblszkmd3vfcjm0000gn/T/codex-clipboard-uNJLat.png`
  - `/var/folders/5j/fb63hyxj11nblszkmd3vfcjm0000gn/T/codex-clipboard-T2iJu2.png`
  - `/var/folders/5j/fb63hyxj11nblszkmd3vfcjm0000gn/T/codex-clipboard-6K3Jcj.png`
  - `/var/folders/5j/fb63hyxj11nblszkmd3vfcjm0000gn/T/codex-clipboard-aaqbsT.png`
- Implementation URL: `http://127.0.0.1:4367`
- Implementation screenshot: unavailable — the in-app Browser runtime reported no available browser instances.
- Intended viewport/state: desktop; compact chat result strip and expanded Questions-tab single-selection grid.
- Primary interactions covered by automated tests: default selection, alternate card selection, answer serialization, compact banner opening, safe preview URL handling, and selected Community plugin id extraction.
- Console errors checked: blocked because no browser instance was available.

## Full-view comparison evidence

Blocked. The four source images were opened at original resolution, but a browser-rendered implementation capture could not be produced, so a valid combined source/implementation comparison was not possible.

## Focused region comparison evidence

Blocked for the same reason. The intended focused regions are the compact preview strip, the selected-card border/check state, and the expanded two-column card grid.

## Findings

- [P1] Browser-rendered visual evidence is missing.
  - Location: compact Community result banner and Questions-tab template picker.
  - Evidence: source screenshots are available, but the Browser runtime returned an empty browser list.
  - Impact: typography, live iframe crops, spacing, overflow, and dark-theme behavior cannot be accepted from code/tests alone.
  - Fix: rerun the local URL in an available in-app browser, capture the compact and expanded states at matching viewports, compare them together with the source images, and fix any P0/P1/P2 drift.

## Required fidelity surfaces

- Fonts and typography: implemented with existing Open Design tokens and component typography; browser comparison blocked.
- Spacing and layout rhythm: compact five-slot strip and responsive two-column expanded grid implemented; browser comparison blocked.
- Colors and visual tokens: uses existing background, border, text, selected, radius, and shadow tokens; browser comparison blocked.
- Image quality and asset fidelity: renders real same-origin Community HTML/image/video previews; external preview URLs are rejected; live crop/sharpness comparison blocked.
- Copy and content: titles, descriptions, reasons, category, and mode come from semantic search results; browser truncation comparison blocked.

## Comparison history

- Initial pass: blocked before visual comparison because no browser instance was available. No source-to-implementation visual fixes were made.

## Implementation checklist

- Capture the compact chat banner.
- Open the Questions tab and capture the expanded card grid.
- Select a second result and verify the selected state and submit action.
- Check console and framework overlays.
- Compare source and implementation at the same viewport, then update this report.

final result: blocked

---

# Design QA · Task Progress + Replayable Computer

- Date: 2026-07-15
- Result: Passed
- Runtime: `task-computer-e2e`, production Web build at `http://127.0.0.1:53914`
- Reference: supplied Open Design screenshots plus the supplied Manus Computer / Task progress reference

## Verified

- The assistant paints an explicit `Preparing...` status before the first content event; visible within 416 ms in the recorded-browser run.
- The composer Task progress card expands and collapses, resets open for a new live round, and exposes a live structured Computer preview without mounting an iframe or bitmap capture.
- The Computer timeline supports previous/next, manual history lock, and Jump to live.
- During live replay, history stayed on the selected Grep step while the slider maximum advanced from 1 to 2; Jump to live then selected the newest Edit step.
- The Computer Task progress section expands and collapses independently and renders only projected replay steps; TodoWrite stays in the composer-side progress card.
- Production visual review covered header hierarchy, compact controls, card radii, borders, focusable semantic buttons, reduced-motion handling, and narrow panel truncation.

## Fixes found during visual QA

- Fixed task-step labels being constrained into the marker column by the parent grid. Final DOM and screenshot show all labels at full available width.

## Automated evidence

- Focused Web tests: 39 passed.
- Full Web suite: 426 files passed, 4,392 tests passed, 7 skipped.
- Web production build: passed.
- Repository guard: passed (78 policy tests).
- Repository typecheck: passed; the landing-page package emitted pre-existing Astro hints only.

final result: passed

---

# Design QA · 8-query matrix + combined Inspiration

- Date: 2026-07-15
- Result: Passed
- Runtime: `task-computer-e2e` (`daemon 53913`, `web 53914`, real Electron shell)
- Template overview: `.tmp/design-qa/query-matrix/09-inspiration-final.png`
- Design-system selection: `.tmp/design-qa/query-matrix/10-inspiration-combined-selection.png`
- Replay / five-stage state: `.tmp/design-qa/query-matrix/11-replay-live-and-progress.png`
- Single Computer tab: `.tmp/design-qa/query-matrix/12-replay-single-computer-tab.png`

## Experience priority contract

- The design brief is now a hard quality gate rather than a prelude to tool activity. The composed
  prompt requires the outcome, audience, content/IA, scope, brand/reference, constraints, and
  acceptance bar before research or generation can advance.
- The first response remains immediate: one short acknowledgement plus one localized form with
  recommended defaults. The form now names success criteria directly instead of burying them in an
  “anything else” field.
- Progress is explicitly truthful and observable: slow work starts with a concrete active state,
  durable batches advance counts, the latest useful preview stays mounted, and the user can remain
  in history until choosing Jump to live.
- Visual ambition stays bounded by the brief: selected template and/or design system, anti-slop and
  brand checks, reduced-motion-safe transitions, and at most one justified flourish.

## Query matrix

| Query intent | Expected / actual shape | First visible stage |
| --- | --- | --- |
| 2026 humanoid robot investor deck | deck / deck | Brief & questions |
| interactive product prototype | prototype / prototype | Brief & questions |
| SaaS landing page | landing / landing | Brief & questions |
| four-screen iOS app | mobile / mobile | Brief & questions |
| analytics dashboard web app | webapp / webapp | Brief & questions |
| product decision RFC | document / document | Brief & questions |
| PDF-first market analysis | report / report | Brief & questions |
| music-festival launch poster | media / media | Brief & questions |

All eight runs persisted the same stable stage ladder. Research remained visible and optional; it did
not disappear just because the run was still awaiting brief answers.

## Combined Inspiration evidence

- Ranked report templates rendered real live previews, reasons, categories, and one selected state.
- Design systems rendered independently with real palettes, summaries, categories, and a separate
  selected state. The panel remained a two-column grid at the 1:1 split width and collapsed cleanly
  to one column at its existing responsive breakpoint.
- The production click path selected `market-diligence-report` and `agentic` together. The API then
  returned matching project metadata, flow choice, and `generated/inspiration.json`; this is not a
  visual-only selection.
- The default system-prompt pipeline was exercised by tests in all modes and includes intentional
  design taste, anti-slop polish, CSS-first motion, GSAP specialization only when justified, lifecycle
  cleanup, and `prefers-reduced-motion` support.

## Replay and shell findings

- Previous step changed `Step 3 of 3 / Using Edit` to `Step 2 of 3 / Using Read`; Jump to live restored
  the newest Edit step. The slider and status copy remained aligned.
- The Computer-side Task progress and the composer-side five-stage card disclosed independently.
- Historical runs had left several valid `computer:<runId>` tabs with the same visible name. The final
  shell now keeps one Computer replay tab and replaces its round on demand; the original conversation
  immediately reconciled to one visible tab without losing the selected replay.
- An optional desktop-pet redirect loop could strand the Electron splash screen. Pet loading is now
  failure-isolated, so the main Open Design window reveals even when that optional surface fails.

## Automated evidence

- Contracts: 38 files / 279 tests passed.
- Focused Web Computer, Inspiration, staged-flow, and projection suites: passed.
- Focused daemon flow/inspire/CLI/system-prompt suites: passed.
- Desktop pet failure-isolation: 2 tests passed.
- Repository guard, workspace typecheck, and production Web build: passed in the final closeout run.

final result: passed

---

# Design QA · Stable five-stage creation journey

- Date: 2026-07-15
- Result: Passed
- Runtime: `task-computer-e2e`, production Web build at `http://127.0.0.1:53914`
- Reference screenshot: `/var/folders/5j/fb63hyxj11nblszkmd3vfcjm0000gn/T/codex-clipboard-8cb60f34-0e64-4aa0-a7b1-51d074f32655.png`
- Implementation screenshot: `.tmp/design-qa/staged-progress/implementation-five-stage-final-2026-07-15.png`
- Focused implementation crop: `.tmp/design-qa/staged-progress/implementation-five-stage-card-final-2026-07-15.png`
- Combined comparison: `.tmp/design-qa/staged-progress/reference-vs-five-stage-final-2026-07-15.png`

## Acceptance criteria

- Current staged creation shows exactly five macro phases: Brief/questions, optional research, outline, inspiration, and implementation.
- Optional research remains visible before it runs; delivery is a completion outcome rather than a sixth progress row.
- A current staged flow wins over TodoWrite details; a later lightweight edit round still renders its TodoWrite list.
- Header, live state, step count, labels, icons, and disclosure control stay aligned without concatenated copy.

## Visual comparison findings

- The raw six-item TodoWrite list in the reference is replaced by one stable five-stage journey; all labels and the `Step 1 of 5` count remain legible on one aligned header.
- `Brief & questions` is the first active checkpoint, `Research (optional)` remains visible before execution, and delivery is absent from the creative-stage ladder.
- A completed run waiting on the brief now says `Needs input` instead of contradicting the active stage with `Task completed`.
- Pending stages do not show artifacts recovered from an older round; the stale `task-progress-replay.html` link found in the first comparison was removed.
- Existing product tokens, typography, iconography, 13px radius, disclosure animation, and structured Computer thumbnail were preserved.

## Runtime and automated evidence

- Production desktop runtime: five labels, `Step 1 of 5`, `Needs input`, and no stale pending-stage artifact confirmed through DOM inspection.
- Collapse → collapsed state → expand interaction: passed on the production build.
- Focused Web tests: 16 passed; contracts flow tests: 29 passed.
- CLI parity: fixed the `od flow` module-initialization TDZ; JSON and human-readable `flow status` both passed against the same live conversation (2 CLI specs plus the existing 2 task CLI specs passed).
- Web typecheck, full workspace typecheck, guard, and production build: passed.

final result: passed

# Design QA · Unified Computer workspace shell

Date: 2026-07-15

- Production runtime: `task-computer-e2e` (`daemon 53913`, `web 53914`)
- Reference split view: `/var/folders/5j/fb63hyxj11nblszkmd3vfcjm0000gn/T/codex-clipboard-6c0457b2-fa7e-433e-b874-44d5179d0523.png`
- Reference Computer modal: `/var/folders/5j/fb63hyxj11nblszkmd3vfcjm0000gn/T/codex-clipboard-dd4dfb05-335c-45c0-9877-c51a0ed95039.png`
- Reference full conversation: `/var/folders/5j/fb63hyxj11nblszkmd3vfcjm0000gn/T/codex-clipboard-01c3ef67-0297-45e1-b150-8b8c0adb88dc.png`
- Implementation captures: `.tmp/design-qa/computer-workspace-shell/final-open.png`,
  `.tmp/design-qa/computer-workspace-shell/final-computer-full.png`,
  `.tmp/design-qa/computer-workspace-shell/final-replay-modal.png`, and
  `.tmp/design-qa/computer-workspace-shell/final-modal-close-chat-full.png`
- Required combined comparison inputs: `.tmp/design-qa/computer-workspace-shell/compare-split.png`,
  `.tmp/design-qa/computer-workspace-shell/compare-modal.png`, and
  `.tmp/design-qa/computer-workspace-shell/compare-chat-full.png`

## Visual comparison findings

- The reference and implementation now share the same primary hierarchy: conversation first on the left,
  one Computer surface on the right, then replay / files / browser content nested inside that surface.
- The Computer header stays one compact row with a real product icon, context line, full-screen control,
  and close control. Internal Pages, Design Files, Browser, file previews, terminal, Questions, and replay
  tabs remain available directly below it.
- The full-conversation state preserves the existing Open Design content and typography rather than copying
  Manus styling. Header actions align on one baseline and remain discoverable without competing with the
  conversation title.
- The modal comparison preserves the same centered, dimmed, dismissible Computer treatment. Open Design's
  replay canvas is intentionally sparser than the search-heavy Manus reference because it renders the
  selected real execution step.

## Runtime measurements and interactions

- Default split: `636px chat / 8px handle / 636px Computer` — exact 1:1.
- Manual drag: `756px chat / 8px handle / 516px Computer`; the selection remains stable after release.
- Computer full screen: `1280px`; chat hidden; Side view restores `636 / 8 / 636px`.
- Computer close: `1280px` chat; Computer hidden; drag handle removed; one-column grid confirmed.
- Design Files action: reopens Computer and activates the existing `All project files` entry.
- More menu: Rename and Delete are visible; Rename opens the current title in the existing rename flow.
- Open Design Cloud action: opens the existing Cloud settings/subscription entry point.
- Replay modal close: modal removed, Computer hidden, conversation restored to the full `1280px` width.

## Defects found and fixed

- [P1] A legacy high-specificity grid rule kept a three-column layout after Computer closed.
  - Fix: exclude `.split-chat-only` from the legacy split selector and clear the imperative grid template
    whenever split mode is inactive.
- [P1] Closing the replay modal returned to the docked Computer instead of the requested full conversation.
  - Fix: centralize close semantics so the modal close exits modal focus and closes Computer; Dock remains
    the explicit return-to-side-view action.
- [P2] Files and replay appeared as peers of Computer, weakening the requested hierarchy.
  - Fix: add one stable outer Computer shell and keep the existing `FileWorkspace` mounted inside it.
- [P2] Conversation-level actions were split between several locations.
  - Fix: group Cloud, Design Files, New, History, Rename, and Delete in the conversation header using existing
    primitives, icons, tokens, and conversation handlers.

## Automated evidence

- `ComputerWorkspaceShell.test.tsx`: close, focus, and child-state preservation covered.
- `ChatPane.conversation-title.test.tsx`: header callbacks plus Rename / Delete covered.
- `ProjectView.run-isolation.test.tsx`: unified focus and modal-close-to-full-chat regression covered.
- `FileWorkspace.test.tsx`: 1:1 helper, chat-only mode, and imperative grid cleanup covered.
- Web typecheck and production build: passed.

final result: passed

---

# Design QA · Todo placement, iconography, and alignment polish

- Date: 2026-07-15
- Result: Passed
- Runtime: `task-computer-e2e`, production Web build at `http://127.0.0.1:53914`
- Reference screenshot: `/var/folders/5j/fb63hyxj11nblszkmd3vfcjm0000gn/T/codex-clipboard-2da2a6fa-5c56-46b7-9486-90856cce4f4a.png`
- Implementation screenshot: `.tmp/design-qa/task-progress-computer/implementation-2026-07-15.png`
- Combined comparison: `.tmp/design-qa/task-progress-computer/reference-vs-implementation-2026-07-15.png`
- Final build screenshot: `.tmp/design-qa/task-progress-computer/implementation-final-2026-07-15.png`
- Final combined comparison: `.tmp/design-qa/task-progress-computer/reference-vs-implementation-final-2026-07-15.png`

## Full-view comparison evidence

The supplied 3840×2098 reference and the 1280×720 production capture were normalized to a common 1280×720 frame and vertically stacked. The final comparison confirms that the right Computer no longer contains the large Todo block from the reference, the replay canvas regains visual priority, and the left composer-side Task progress remains the canonical planning surface.

## Focused region comparison evidence

- Right Computer header: monitor icon, title, status line, expand action, and baselines align as one 58px header row.
- Replay controls: previous/next buttons are equal 28px controls; the heavy full-width blue progress fill is replaced by a neutral 4px track with a compact accent thumb.
- Right Task progress: title, terminal/live state, `Step N of M`, and chevron have consistent spacing; the row expands and collapses independently.
- Left Task progress: the Computer entry is a 72×42 structured current-step preview; Todo status icons, current label, terminal/live state, step count, and chevron share a single baseline.
- Todo ownership: a current-round TodoWrite snapshot wins over an older conversation-level staged flow on the left; TodoWrite/update_plan is excluded from the Computer title, canvas, timeline, and step summary.

## Findings and fixes

- [P1] TodoWrite appeared as Computer content and as the right-side progress source.
  - Fix: filter TodoWrite/update_plan in the shared Computer projection and render only replayable actions on the right.
- [P1] An older staged flow could cover the current round's Todo changes on the left.
  - Fix: current-round Todo snapshots now take precedence in the pinned progress card.
- [P2] Hand-authored SVGs and character glyphs produced mixed stroke weights and baselines.
  - Fix: use the existing `Icon` component for Computer, maximize/dock/close, chevrons, terminal states, and progress states.
- [P2] Header, status, step count, timeline, and disclosure controls were cramped or visually detached.
  - Fix: recalibrated row heights, spacing, type sizes, marker columns, scrollbar footprint, and disclosure alignment with existing tokens.

## Required fidelity surfaces

- Fonts and typography: existing product font stack retained; Computer title is 13.5px/650 and status metadata is 11–11.5px with tabular step counts.
- Spacing and layout rhythm: 58px primary headers, 44px disclosure row, 28px replay controls, 20px marker columns, and consistent 6–11px gaps verified at desktop width.
- Colors and visual tokens: existing panel, subtle, border, text, accent, success, and danger tokens only; no new color system introduced.
- Image quality and asset fidelity: no fake bitmap preview or iframe is mounted in the composer; the structured Computer preview uses the product icon library and primitive text/status data.
- Copy and content: Todo copy is present only in the left progress card; Computer status and lists contain actual replay step labels only.

## Interaction and runtime verification

- Right progress collapse/expand: passed.
- Left progress collapse/expand: passed.
- Previous/next replay: status changed to the prior Bash step and returned to the latest Bash step.
- Todo leak check: no `TODOS`, `TodoWrite`, or known Todo item text in the scoped Computer panel.
- Browser runtime logs: empty.
- Focused regression tests: 19 passed.
- Web typecheck: passed.
- Web production build: passed.

## Comparison history

- Initial reference: Todo occupied the Computer canvas; header copy ran together; the timeline was a dominant blue bar; right progress text was ungrouped.
- First implementation comparison: Todo was removed from Computer and icon/spacing/timeline hierarchy was corrected.
- Final audit: added current-round Todo precedence over stale flow, re-ran focused tests, rebuilt production, and repeated the browser interaction checks.

final result: passed
