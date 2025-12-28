# OttoQuest

**The Definitive Discord Quest Completer for Equicord/Vencord**

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
| 📊 **Progress Bars** | Live progress tracking in Control Panel |

## Installation

### ⚠️ Prerequisites

1. **Git** installed
2. **Node.js LTS** installed
3. **pnpm** installed: `npm i -g pnpm`
4. **Equicord built from source** (see below)

---

### Step 1: Build Equicord from Source

> ⚠️ Do NOT use admin/root terminal. Clone in a folder you'll remember (like Documents).

**Windows:**
```powershell
cd "%USERPROFILE%/Documents"
git clone https://github.com/Equicord/Equicord
cd Equicord
pnpm install --no-frozen-lockfile
pnpm build
pnpm inject
```

**Linux/macOS:**
```bash
cd "$HOME/Documents"
git clone https://github.com/Equicord/Equicord
cd Equicord
pnpm install --no-frozen-lockfile
pnpm build
pnpm inject
```

---

### Step 2: Install OttoQuest

**Navigate to userplugins folder and clone:**

```bash
cd src/userplugins
git clone https://github.com/Zendevve/OttoQuest.git ottoquest
```

**Verify structure is correct:**
```
✅ Correct:
Equicord/src/userplugins/ottoquest/index.ts

❌ Incorrect:
Equicord/src/userplugins/ottoquest/ottoquest/index.ts
Equicord/src/userplugins/index.ts
```

---

### Step 3: Rebuild & Restart

```bash
cd ../..   # Back to Equicord root
pnpm build
```

Then **restart Discord completely** (Ctrl+R or close and reopen).

---

### Step 4: Enable Plugin

1. Open **Discord Settings**
2. Go to **Equicord → Plugins**
3. Search for **"OttoQuest"**
4. **Enable it** ✅

---

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

## Troubleshooting

### Plugin not showing up?

1. Make sure you're in `src/userplugins/` (not `src/equicordplugins/`)
2. Verify folder structure has `ottoquest/index.ts` directly
3. Run `pnpm build` again
4. Restart Discord completely

### Need Developer plugins?

Build with:
```bash
pnpm build --dev
```

## License

GPL-3.0-or-later
