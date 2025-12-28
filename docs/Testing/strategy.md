# Testing Strategy

## Overview

OttoQuest is a Vencord plugin that runs inside Discord's Electron environment. Automated unit testing is not practical because the plugin heavily depends on Discord's internal APIs (webpack modules, Flux stores, REST API).

## Test Approach

### Manual Testing in Discord

All testing is performed manually in the Discord desktop client with Vencord installed.

### Test Levels

| Level | Description | When |
|-------|-------------|------|
| Smoke | Plugin loads without errors | After any change |
| Functional | Each quest type completes | When quest type code changes |
| Integration | Multiple quests complete simultaneously | Before release |
| Regression | All features still work | Before release |

## Test Environment

### Requirements

- Discord Desktop (not browser/web)
- Vencord installed and working
- Active Discord quests (when available)

### Setup

1. Clone Vencord repository
2. Copy OttoQuest to `src/userplugins/ottoquest/`
3. Run `pnpm build`
4. Launch Discord with Vencord

## Test Cases

### TC-001: Plugin Load

**Steps:**
1. Enable OttoQuest in Vencord settings
2. Open Discord developer console (Ctrl+Shift+I)

**Expected:**
- No errors in console
- Plugin appears in plugin list
- Settings panel accessible

### TC-002: Video Quest Completion

**Prerequisites:** Active video quest in Discord

**Steps:**
1. Ensure quest is enrolled (or wait for auto-enroll)
2. Watch console logs

**Expected:**
- Log: "Completing quest [name] - WATCH_VIDEO for X seconds"
- Progress updates in console
- Log: "Quest completed!" after duration
- Notification appears (if enabled)

### TC-003: Game Quest Completion

**Prerequisites:** Active game quest in Discord Desktop

**Steps:**
1. Ensure quest is enrolled
2. Watch console logs

**Expected:**
- Log: "Spoofed your game to [name]"
- Discord shows "Playing [game]" in status
- Progress updates via heartbeat
- Log: "Quest completed!" when done

### TC-004: Stream Quest Completion

**Prerequisites:** Active stream quest

**Steps:**
1. Ensure quest is enrolled
2. Join a voice channel with at least 1 other person

**Expected:**
- Stream metadata spoofed
- Progress tracked via heartbeat
- Completion when target reached

### TC-005: Activity Quest Completion

**Prerequisites:** Active activity quest

**Steps:**
1. Ensure quest is enrolled
2. Watch console logs

**Expected:**
- Heartbeats sent every 20 seconds
- Progress logged
- Completion when target reached

### TC-006: Parallel Completion

**Prerequisites:** Multiple active quests

**Steps:**
1. Enable multiple quests
2. Watch console logs

**Expected:**
- All quests show progress simultaneously
- No conflicts or errors
- Each completes independently

### TC-007: Mobile Quest Conversion

**Prerequisites:** Mobile-only video quest, `mobileFix` setting enabled

**Steps:**
1. Check quest has `WATCH_VIDEO_ON_MOBILE` but no `WATCH_VIDEO`
2. Enable plugin

**Expected:**
- Quest is converted to desktop format
- Video completion proceeds normally

### TC-008: Plugin Disable/Enable

**Steps:**
1. Disable OttoQuest while quests are completing
2. Re-enable OttoQuest

**Expected:**
- All intervals/timers cleaned up on disable
- In-progress quests detected and resumed on enable

## Logging

All completers log their activity with timestamps for debugging:

```
[OttoQuest] [HH:MM:SS] Completing quest "Game Name Quest" - PLAY_ON_DESKTOP for 900 seconds
[OttoQuest] [HH:MM:SS] Quest progress: 120/900
[OttoQuest] [HH:MM:SS] Quest completed!
```

## Known Limitations

1. Cannot automate tests - requires real Discord environment
2. Quest availability depends on Discord's quest schedule
3. Some quest types may not be available for testing at any given time
