# ADR-001: Plugin Architecture

Status: Accepted
Date: 2025-12-28
Owner: OttoQuest
Related Features: [auto-complete.md](file:///d:/COMPROG/ottoquest/docs/Features/auto-complete.md)
Supersedes: N/A
Superseded by: N/A

---

## Context

Three existing Discord quest completer plugins exist with varying approaches:
1. **QuestFocused**: Minimal (~40 lines), only prevents video pause
2. **Questify**: Comprehensive (~1200+ lines), includes UI bloat
3. **CompleteDiscordQuest**: Balanced (~350 lines), good automation

We need to choose an architecture that:
- Prioritizes full automation (zero user interaction)
- Supports all quest types (video, game, stream, activity)
- Remains lightweight and maintainable
- Follows Vencord plugin conventions

---

## Decision

Adopt a **modular architecture** with:
1. Central `QuestManager` for orchestration
2. Separate completer modules per quest type
3. Minimal settings (5-6 options only)
4. Shared utility modules for stores and logging

Key points:

- Each quest type has its own completer module with isolated logic
- QuestManager coordinates discovery, enrollment, and routing
- Plugin lifecycle (start/stop) properly cleans up all resources
- Webpack patches for RunningGameStore and ApplicationStreamingStore

---

## Alternatives considered

### Monolithic single-file approach (like CompleteDiscordQuest)

- Pros: Simple, single file to manage
- Cons: Harder to maintain as complexity grows, harder to test individual components
- Rejected because: OttoQuest aims to be the "definitive" solution, needing better organization

### Feature-rich approach (like Questify)

- Pros: Many features, customizable UI
- Cons: 1200+ lines, complex settings, UI bloat
- Rejected because: User explicitly wants pure automation without UI enhancements

---

## Consequences

### Positive

- Clear separation of concerns
- Easy to add new quest types
- Testable individual components
- Estimated ~400 lines total (lightweight)

### Negative / risks

- Slightly more files to manage than single-file approach
- Mitigation: Clear file naming and documentation

---

## Impact

### Code

- Affected modules: All (new project)
- New boundaries: completers/, core/, utils/
- Feature flags: None needed

### Documentation

- Feature docs to update: `docs/Features/auto-complete.md`
- Testing docs to update: `docs/Testing/strategy.md`

---

## Verification

### Objectives

- Plugin loads correctly in Vencord
- All four quest types can be completed
- Multiple quests can run in parallel

### Test environment

- Environment: Discord Desktop with Vencord installed
- Data: Wait for active quests in Discord

### Test commands

- build: `pnpm build` (in Vencord context)
- format: `pnpm lint --fix`

---

## References

- Quest Completer plugins analyzed in implementation_plan.md
- Vencord plugin documentation
