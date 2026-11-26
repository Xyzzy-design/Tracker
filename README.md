# Exercise Journal — V1.9.4

Personal fitness PWA · Project reference, changelog and AI development handover

## 1. Purpose and design contract

A personal, mobile-first strength and cardio journal for an intermediate lifter. Optimize for muscle growth and strength, with minimal typing during gym sessions. Priorities: shoulders, chest, triceps, biceps and lower body; calves are not a priority. Prefer dumbbells and machines to barbells. Recommended training days: Tuesday, Friday and Sunday. Aim for 60 minutes including 5–8 minutes of warm-up, particularly Tuesday and Friday; this is a soft target, never a reason to discard records or rush heavy sets.

**Simple frontend, powerful backend.** Keep plan editing separate from recording. Preserve historical data, even when exercises or fields disappear from the UI. Do not implement proposed changes until the owner approves. Prefer small patches to the last working release; document and test each change.

## 2. Files and deployment

| File | Purpose |
|---|---|
| `index.html` | All HTML, CSS, vanilla JavaScript, exercise catalog, plans, recording, history, analytics, migration and Firebase sync |
| `manifest.json` | Installable standalone PWA metadata |
| `sw.js` | Offline shell, update lifecycle, selective public asset caching |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | App icons |
| `README.md` | This living handover document |

No build step or npm dependencies. Serve via HTTPS (GitHub Pages) or localhost for testing; opening a file directly is not a full PWA test. Repository historically `Xyzzy-design/Tracker`. Back up JSON on both devices and verify sync before replacing files. Deploy the six runtime files together; README is documentation only. iPhone: Safari → Share → Add to Home Screen. Accept update when offered. Do not clear site storage as a troubleshooting shortcut. Use a development branch and isolated test Firebase records/project before production. A Git branch alone does not isolate cloud data.

## 3. Current behavior

- Workout: choose date and routine; start/pause/finish timer or enter duration manually. Suggested warm-up ideas and one free-text warm-up field. Enter weight and actual reps; prior weight may be prefilled, reps blank. Leave skipped exercises/sets blank. Add extra exercises at bottom only. One overall workout notes field. No daily reorder/remove/replace, set count controls or individual notes/RIR input. Historical fields must remain intact.
- Exercise Pool: searchable, collapsible muscle categories, active/archived definitions, custom exercises, form guides. My Plans is the place for permanent exercise order and set changes; recommended plans remain available for reset. Actual sessions retain a plan snapshot.
- Cardio: StairMaster, Indoor Running, Outdoor Running, Incline Walking. Duration, activity-specific speed/level, distance or incline, optional heart rate/RPE/notes. Keep cardio separate from strength records.
- History, Progress, Best Practice, Backup and Cloud: historical review, basic trends, guidance, JSON/CSV export, import/merge, sign-in and revision archive.
- Appearance: Athletic Blue, Fresh Mint, Electric Violet. Header compact with appearance on right. Installation notice hidden except when update available; Time & Rest panel removed in V1.9.3. Overall workout duration remains.

## 4. Catalog and recommended plans

21 active strength exercises:

| Group | Exercises |
|---|---|
| Chest | Dumbbell Flat Bench Press; Incline Dumbbell Press; Pec Deck Fly; Dumbbell Pullover |
| Shoulders | Seated Dumbbell Shoulder Press; Dumbbell Lateral Raise; Dumbbell Rear Delt Fly (standing); Cable Face Pull |
| Back | Chest-Supported Dumbbell Row; Single-Arm Dumbbell Row; Lat Pulldown |
| Triceps | Machine Triceps Extension; Cable Triceps Pushdown |
| Biceps | Machine Biceps Curl (Hammer Strength) |
| Lower Body | Leg Press; Dumbbell Romanian Deadlift; Bulgarian Split Squat; Seated Leg Curl; Dumbbell Goblet Squat; Machine Leg Extension |
| Core | Captain's Chair Knee Raise |

Nine warm-up definitions: StairMaster — Easy Intensity, Bodyweight Squat, Bodyweight Hip Hinge, Leg Swings, Arm Circles, Band Pull-Apart, Band External Rotation, Horizontal Arm Swings, Incline Push-Up. Strength exercises can also be used as lighter preparatory sets. Do not count warm-up as working volume.

14 archived definitions: Cable Fly, Overhead Cable Triceps Extension, Dumbbell Biceps Curl, Hack Squat, Hip Thrust Machine, Dumbbell Standing Calf Raise, Standing Calf Raise, Seated Calf Raise, Seated Dumbbell Calf Raise, Hanging Knee Raise, Cable Crunch, Plank, Farmer's Carry, Suitcase Carry. Preserve history and allow restoration. Internal names are not necessarily display labels (`display19`); do not rename keys without migration.

| Day | Ordered working exercises (set counts) | Suggested warm-up |
|---|---|---|
| Tuesday (20 sets) | Leg Press 3; DB Flat Bench 3; DB RDL 3; Bulgarian Split Squat 2; Seated Leg Curl 3; DB Lateral Raise 2; Machine Triceps Extension 2; Captain's Chair 2 | Easy StairMaster, squat, hip hinge, lighter leg press |
| Friday (21 sets) | Seated DB Shoulder Press 3; Chest-Supported DB Row 3; Lat Pulldown 3; DB Lateral Raise 3; Standing DB Rear Delt Fly 3; Machine Biceps Curl 2; Seated Leg Curl 2; Captain's Chair 2 | Easy StairMaster, arm circles, band pull-apart, lighter shoulder press |
| Sunday (24 sets) | DB Flat Bench 4; Incline DB Press 3; Single-Arm DB Row 3; Goblet Squat 3; Pec Deck 2; Machine Biceps Curl 3; Cable Triceps Pushdown 3; Machine Leg Extension 3 | Easy StairMaster, horizontal arm swings, band pull-apart, lighter bench press |

Actual rep ranges and exercise instructions are defined in `specFor`, `rec19`, `routines` and legacy routines in source; inspect these rather than assuming all ranges are identical. Spec tuple: `[name, setCount, minReps, maxReps, mode, instruction]` (warm-up uses duration/repetition semantics). Exercise images use external public sources and some fallbacks; verify availability and licensing before expanding.

## 5. Architecture and data contract (as implemented)

Local storage key `liftlog.v1` must remain compatible. `exercisejournal.theme` stores appearance; `ej.device` identifies device; `liftlog.v1.cloud17` stores sync metadata (uid, base, pending). Main `db` contains `sessions`, `drafts`, `cardio`, `cardioDraft`, `custom`, `archive`. JSON export adds `version: 3` (schema version, not app version). Session fields include `date`, `day`, `notes`, `exercises`, optional `durationSeconds`, plan snapshot and warm-up fields. Exercise fields include `name`, `spec`, `sets` and legacy notes; set fields `weight`, `reps`, `rir` are commonly strings. Preserve unknown/missing values; never interpret blank RIR as zero. Drafts are keyed by `date|day`. Current identity is date + routine, not an independent UUID per strength session. Multiple same-day same-routine sessions are therefore a known limitation. Stable independent exercise IDs were a design goal, but current implementation uses names; do not claim otherwise.

Firebase SDK 10.14.1 dynamically imported from gstatic. Email/password authentication. Existing project `exercise-journal-344e6`; web config lives in source. Never add passwords, private keys, personal backups or account identifiers to the repository. Public web API config is not a substitute for authorization. Firestore rules must restrict reads/writes to the authenticated owner's UID; verify actual deployed rules in console. Do not relax rules for debugging.

Firestore path: `users/{uid}/journalRecords/{recordId}`. Document envelope `{value, updatedAt}`. IDs from `records()`:

- `w_<date>_<day>`: strength session
- `c_<encoded cardio id>`: cardio record
- `d_<encoded draft key>`: strength draft
- `draft_cardio`: cardio draft
- `custom_<encoded key>`: custom plans, exercises, settings
- `archive_<key>`: revision/original backup archive

`persist()` saves locally and triggers cloud change detection. `queueChanges`, `schedule`, `flush`, `receive`, `applyRecord`, `refreshRemote`, `connect` handle local outbox, transactions and remote refresh. Cloud conflicts compare remote value with queued base; differing versions are archived transactionally and incoming local value becomes active. Imported conflicts instead retain existing active record. Archive records must not count twice in analytics. Deletions/closed drafts are archived by the persist wrapper. These behaviors need live integration tests; no guarantee of lossless sync under every failure mode. Do not change storage keys or document IDs casually.

## 6. Backups and migration

`migrationPlan(v, base)` accepts recognized schema 1, 2, 3; validates structure, merges into cloned state, compares canonical values and workout signatures, archives conflicting copies. Existing date/day is the matching key. Import UI previews counts and requests confirmation. Original JSON text is retained in SHA-256-keyed chunks of 100,000 characters in archive (not a separate uploaded file); reassembly uses offsets. Import uses local persist and normal cloud queue. Keep independent original files. CSV is an analysis export, not a complete restore format. No silent unit conversion; legacy weights may lack explicit units even though current UI uses pounds. Future migration should preserve unknown exercises, old notes, incomplete entries and raw values; reject unsupported schemas safely, never overwrite the only copy. Current validation is not exhaustive; extend with fixtures and malformed input tests.

Regression fixture (owner's private V1.8 backup, not bundled): schema 1, two workouts dated 2026-11-15 and 2026-11-17, 39 recorded sets (21 + 18), 17 exercise entries, four empty exercise entries, two notes, one structured duration of 3000 seconds, zero cardio. Import twice must leave two active workouts and 39 performed sets. Preserve missing duration and archived exercises. Use anonymized fixtures for shared repositories.

## 7. Version history

Early history is reconstructed from project discussions, not a complete Git commit audit. Exact early release boundaries are not all recoverable; the available V1.6.1, V1.7, V1.8, V1.8.1 and V1.9-series packages provide later baselines.

| Version / phase | Changes |
|---|---|
| V1.0–V1.3 (Lift Log, early iterations) | Single HTML journal, Tuesday/Friday/Sunday plans, weight/reps/RIR, local storage, exercise illustrations and muscle labels, history/progress and backup; Best Practice guidance; images displayed automatically. Exact per-release allocation uncertain. |
| V1.4 | Workout timer, manual duration, historical average; Hammer Strength machine biceps curl replaces direct DB curls. |
| V1.5 | Exercise Journal branding, light themes and persistent appearance; seated dumbbell calf raise substitution. |
| V1.6–V1.6.1 | Cardio tracking and activity-specific fields; leg extension added, redundant calf work reduced; Captain's Chair guide and primary/secondary muscles on one line. |
| V1.7 | Firebase email/password, local outbox, per-record sync and conflict checks; cross-device use. Owner confirmed working. |
| V1.8 | PWA manifest, service worker, app icons, standalone iPhone installation and update notification. |
| V1.8.1 | Standing rear delt fly illustration; Friday hanging knee raise replaced with Captain's Chair; Tuesday/Friday guide updates. |
| V1.9 | Exercise Pool (21 strength, 9 warm-up, 14 archived), custom plans, session snapshots, custom exercises, revision archive, broader cloud sync, warm-up detail and time management; reduced Tuesday/Friday sets. |
| V1.9.1 | Simplified recording, one warm-up text field and one overall note, removed daily management controls and RIR input, prior weight prefill, muscle grouping, schema 1–3 merge/import. Regression: essential functions accidentally removed, causing initialization failure. |
| V1.9.2 | Restored missing catalog, rendering, timer, cardio and initialization functions; grouped exercise selection and fuller export. Owner confirmed working. |
| V1.9.3 | Compact header, removed subtitle, Appearance on right, hidden installation notice except update, removed Time & Rest panel, retained duration. |
| V1.9.3 documentation update | Added this README; no runtime changes. |

## 8. Developer handover and release tests

Read the actual current `index.html` before editing. Important anchors: `render`, `blank`, `previous`, `persist`, `specFor`, `rec19`, `planFor`, `pool19`, `fillSelect`, `renderPool`, `renderPlans`, `renderWarm`, `migrationPlan`, `records`, `flush`, `receive`. Inline code is densely formatted; use a parser or carefully scoped edits rather than broad regex deletion. V1.9.1 passed syntax checks yet failed at runtime because functions were missing. Syntax checks alone are insufficient.

Before every release:

1. Preserve baseline ZIP and export backups. Inspect diff; keep unrelated changes out.
2. Run JS syntax checks for inline scripts and service worker; run actual browser startup with console error capture, online and offline, including unavailable Firebase.
3. Verify all three routines render eight default exercises, warm-up suggestions, blank reps and prior weight; record a partial set, notes-only workout, skip, append exercise, timer/manual duration, reload and reopen.
4. Test pool search/categories, custom exercises, plan edit/reset, archived history, all cardio types, history/progress, JSON and CSV exports.
5. Test legacy import fixture, repeated import, conflicting records, malformed backup, missing fields, original archive reassembly; confirm no inflated statistics.
6. Test authenticated sync on isolated data: two devices, offline edits/reconnect, simultaneous conflicts, deletes, account separation, failed writes and pending queue recovery. Verify both conflict copies actually exist remotely and are recoverable.
7. Verify iPhone layout, PWA install/update, offline startup and cache replacement. Bump app version and service worker cache name together for runtime releases; do not cache private data. Keep manifest scope relative for GitHub Pages.
8. Package runtime files and updated README, test ZIP integrity, disclose untested areas. Never claim live verification without performing it.

V1.9.2 was confirmed working by owner. V1.9.3 prior checks were syntax/package checks; live browser, iPhone and Firebase tests not confirmed. This documentation-only update does not perform new live tests.

## 9. Roadmap (not implemented unless stated)

- Stability first: real browser integration tests, robust migration validation, archive recovery/merge UI, verify image links and offline behavior. Consider independent session/exercise IDs with explicit backwards-compatible migration. Review Firestore document size limits and local storage quota.
- V1.10 Advanced Training Analytics: strength progression, personal records, estimated 1RM with clearly defined units, weekly direct muscle volume, consistency, exercise frequency, workout efficiency, cardio trends, plateau detection. Distinguish working sets, warm-up, drafts and revisions; avoid double counting and fabricated values. Historical data should work across versions.
- V2.0 Intelligent Training Assistant: personalized suggestions using actual history, not mandatory complexity. No automatic plan changes without owner approval.

Keep this README current after every approved change. Record version, rationale, actual implementation, data compatibility, tests run and limitations. Future AI tools should treat the source code as the authority for current behavior, this document as design intent and historical context, and ask the owner before making major decisions or accessing live data.

## V1.9.4 — Responsive navigation (2026-11-26)

- Five primary destinations: Workout, Cardio, Progress, History, More. Desktop uses a horizontal row; screens up to 700px use fixed bottom navigation with safe-area padding.
- More groups Exercise Pool, My Plans, Backup & Restore, Cloud Sync and Best Practice. Secondary screens have a More return button; More stays highlighted.
- Header palette icon opens the existing native theme selector. Cloud icon opens Cloud Sync; status is available in its accessible label, tooltip and Cloud page, with a colored indicator.
- No changes to workout recording, data schema, migration, Firebase transactions, storage keys or exercise catalog. Service worker cache bumped to V1.9.4.
- Validation: JavaScript syntax and package integrity checked; live browser, iPhone and Firebase tests pending. Verify all destinations, nested navigation, theme selection, cloud status, and mobile bottom clearance before release.


## V1.9.5 — Workout Experience Edition
- Compact training guidelines replace sets-logged progress bar; remove technical explanatory text.
- Horizontal elapsed/remaining timer with a soft 60-minute target, start/pause/resume/finish and collapsible manual entry. Over-target time is shown without stopping the timer. Sticky header timer appears for running or paused selected workout; tap to return to timer.
- Warm-up checklist uses existing `warm[].done` fields; `warmOther` is an optional boolean and `warmNote` retains existing free text. Legacy notes and detailed warm-up records remain intact. Unchecking Others hides but does not erase text. New sessions start unchecked.
- No storage key, Firebase path or backup schema change. Existing autosave and timer persistence retained.
- Validation: JavaScript syntax and package integrity; live browser, iPhone and Firebase behavior require deployment testing.
