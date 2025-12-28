# OttoQuest

**The Definitive Discord Quest Completer for Vencord/Equicord**

Automatically complete all Discord quests with zero interaction — or take full control with manual mode.

## Features

| Feature | Description |
|---------|-------------|
| 🎮 **Completion Modes** | Full Auto, Semi-Auto, or Manual |
| 📺 **Video Quests** | Progress spoofing via REST API |
| 🎯 **Game Quests** | RunningGameStore injection |
| 📡 **Stream Quests** | Metadata spoofing |
| 🕹️ **Activity Quests** | Heartbeat simulation |
| 📱 **Mobile Fix** | Converts mobile-only quests to desktop |
| ⚡ **Parallel** | Complete multiple quests simultaneously |
| 🔔 **Notifications** | Alerts when quests complete |

## Safety Controls

- **Per-quest-type toggles** — Enable/disable video, game, stream, or activity completion
- **Configurable delays** — Slow down completion for more natural behavior
- **Random variation** — Adds +/-50% to delays for realism
- **Control Panel** — Visual UI for manual quest management

## Installation

### For Vencord

```bash
# Clone into userplugins
git clone https://github.com/Zendevve/OttoQuest.git ~/.config/Vencord/src/userplugins/ottoquest

# Build Vencord
cd ~/.config/Vencord && pnpm build
```

### For Equicord

```bash
git clone https://github.com/Zendevve/OttoQuest.git ~/.config/Equicord/src/userplugins/ottoquest
cd ~/.config/Equicord && pnpm build
```

### Windows

```powershell
git clone https://github.com/Zendevve/OttoQuest.git %appdata%\Vencord\src\userplugins\ottoquest
```

After cloning, enable **OttoQuest** in Discord: `Settings → Vencord → Plugins`

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Completion Mode | Full Auto | Auto / Semi-Auto / Manual |
| Complete Video Quests | ✅ | Toggle video quest completion |
| Complete Game Quests | ✅ | Toggle game quest completion |
| Complete Stream Quests | ✅ | Toggle stream quest completion |
| Complete Activity Quests | ✅ | Toggle activity quest completion |
| Video Speed | 5x | 1x - 7x multiplier |
| Completion Delay | 2s | 0 - 30 seconds between actions |
| Randomize Delay | ✅ | Add random variation |
| Mobile Fix | ✅ | Convert mobile quests to desktop |
| Notify on Complete | ✅ | Show notifications |
| Debug Logging | ❌ | Verbose console output |

## Modes Explained

| Mode | Enrollment | Completion | Use Case |
|------|------------|------------|----------|
| **Full Auto** | Automatic | Automatic | Set and forget |
| **Semi-Auto** | Ask first | Automatic | Review before enrolling |
| **Manual** | Click button | Click button | Full control |

## Project Structure

```
ottoquest/
├── index.ts              # Main plugin entry
├── settings.ts           # Plugin settings
├── core/
│   └── QuestManager.ts   # Quest orchestration
├── completers/
│   ├── VideoCompleter.ts
│   ├── GameCompleter.ts
│   ├── StreamCompleter.ts
│   └── ActivityCompleter.ts
├── components/
│   └── ControlPanel.tsx  # Manual control UI
└── utils/
    ├── logger.ts
    └── stores.ts
```

## License

GPL-3.0-or-later
