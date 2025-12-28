# AGENTS.md

OttoQuest — TypeScript / Vencord Plugin

Follows [MCAF](https://mcaf.managed-code.com/)

---

## Conversations (Self-Learning)

Learn the user's habits, preferences, and working style. Extract rules from conversations, save to "## Rules to follow", and generate code according to the user's personal rules.

**Update requirement (core mechanism):**

Before doing ANY task, evaluate the latest user message.
If you detect a new rule, correction, preference, or change → update `AGENTS.md` first.
Only after updating the file you may produce the task output.
If no new rule is detected → do not update the file.

**When to extract rules:**

- prohibition words (never, don't, stop, avoid) or similar → add NEVER rule
- requirement words (always, must, make sure, should) or similar → add ALWAYS rule
- memory words (remember, keep in mind, note that) or similar → add rule
- process words (the process is, the workflow is, we do it like) or similar → add to workflow
- future words (from now on, going forward) or similar → add permanent rule

**Preferences → add to Preferences section:**

- positive (I like, I prefer, this is better) or similar → Likes
- negative (I don't like, I hate, this is bad) or similar → Dislikes
- comparison (prefer X over Y, use X instead of Y) or similar → preference rule

**Corrections → update or add rule:**

- error indication (this is wrong, incorrect, broken) or similar → fix and add rule
- repetition frustration (don't do this again, you ignored, you missed) or similar → emphatic rule
- manual fixes by user → extract what changed and why

**Strong signal (add IMMEDIATELY):**

- swearing, frustration, anger, sarcasm → critical rule
- ALL CAPS, excessive punctuation (!!!, ???) → high priority
- same mistake twice → permanent emphatic rule
- user undoes your changes → understand why, prevent

**Ignore (do NOT add):**

- temporary scope (only for now, just this time, for this task) or similar
- one-off exceptions
- context-specific instructions for current task only

**Rule format:**

- One instruction per bullet
- Tie to category (Testing, Code, Docs, etc.)
- Capture WHY, not just what
- Remove obsolete rules when superseded

---

## Rules to follow (Mandatory, no exceptions)

### Commands

- build: `pnpm build` (within Vencord/Equicord context)
- test: Manual testing in Discord client
- format: `pnpm lint --fix`

### Task Delivery (ALL TASKS)

- Read assignment, inspect code and docs before planning
- Write multi-step plan before implementation
- Implement code and tests together
- Run format before committing
- Summarize changes before marking complete
- Always run required builds yourself; do not ask the user to execute them

### Documentation (ALL TASKS)

- All docs live in `docs/`
- Update feature docs when behaviour changes
- Update ADRs when architecture changes
- Templates: `docs/templates/ADR-Template.md`, `docs/templates/Feature-Template.md`

### Testing (ALL TASKS)

- Vencord plugins require manual testing in Discord client
- Test each quest type (video, game, stream, activity) when available
- Document test steps and expected results in `docs/Testing/`
- Log all completion attempts with timestamps for debugging

### Autonomy

- Start work immediately — no permission seeking
- Questions only for architecture blockers not covered by ADR
- Report only when task is complete

### Code Style

- TypeScript with strict types
- No magic literals — extract to constants, enums, config
- Use Vencord's webpack utilities for store access
- Follow Vencord plugin conventions for patches and flux handlers
- Prefer async/await over raw promises
- Clear, descriptive function and variable names

### Critical (NEVER violate)

- Never commit secrets, keys, connection strings
- Never skip manual testing before claiming completion
- Never force push to main
- Never approve or merge (human decision)
- Never use deprecated Vencord APIs

### Boundaries

**Always:**

- Read AGENTS.md and docs before editing code
- Test in Discord before marking complete

**Ask first:**

- Adding new external dependencies
- Changing public API/settings contracts
- Major architectural changes

---

## Preferences

### Likes

- Pure automation with zero user interaction
- Lightweight, focused plugins (~400 lines or less)
- Clear logging for debugging
- Mobile quest compatibility fixes

### Dislikes

- UI bloat (theming, sorting, filtering) for automation-focused plugins
- Over-engineered settings with 30+ options
- Mocking internal systems

---

## Project Context

### What is OttoQuest?

OttoQuest is a Vencord/Equicord plugin that automatically completes all Discord quests with zero user interaction.

### Key Features

1. **Completion Modes**
   - **Full Auto** — Auto-enroll and auto-complete immediately
   - **Semi-Auto** — Auto-complete but ask before enrolling
   - **Manual** — Only complete when user clicks button

2. **Quest Type Toggles** — Enable/disable per quest type:
   - Video quests (WATCH_VIDEO)
   - Game quests (PLAY_ON_DESKTOP)
   - Stream quests (STREAM_ON_DESKTOP)
   - Activity quests (PLAY_ACTIVITY)

3. **Safety Controls**
   - Configurable delays between actions
   - Random delay variation for natural behavior
   - Debug logging toggle

4. **Quest Completion**
   - Video quest completion via progress spoofing
   - Game quest completion via RunningGameStore injection
   - Stream quest completion via metadata spoofing
   - Activity quest completion via heartbeat spoofing
   - Parallel completion of multiple quests

5. **Mobile Quest Fix** — Converts mobile-only quests to desktop format

6. **Control Panel** — React UI for manual quest management

### Architecture

```
ottoquest/
├── index.ts              # Main plugin entry point
├── settings.ts           # Plugin settings (modes, toggles, delays)
├── core/
│   └── QuestManager.ts   # Central quest orchestration
├── completers/
│   ├── VideoCompleter.ts
│   ├── GameCompleter.ts
│   ├── StreamCompleter.ts
│   └── ActivityCompleter.ts
├── components/
│   └── ControlPanel.tsx  # React UI for manual control
├── utils/
│   ├── logger.ts
│   └── stores.ts
└── docs/
    ├── Features/
    ├── ADR/
    ├── Testing/
    └── Development/
```

### Discord Quest Types

| Type | API Endpoint | Method |
|------|-------------|--------|
| Video | `/quests/{id}/video-progress` | POST with timestamp |
| Game | RunningGameStore spoofing | Heartbeat via Flux |
| Stream | ApplicationStreamingStore | Heartbeat via Flux |
| Activity | `/quests/{id}/heartbeat` | POST with stream_key |
