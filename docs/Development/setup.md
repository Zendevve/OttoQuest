# Development Setup

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Git
- Discord Desktop (not browser)
- Vencord or Equicord installed

## Setup

### 1. Clone Vencord (if not already)

```bash
git clone https://github.com/Vendicated/Vencord.git
cd Vencord
pnpm install
```

### 2. Add OttoQuest

```bash
# Copy OttoQuest to userplugins
cp -r /path/to/ottoquest src/userplugins/ottoquest
```

Or symlink for active development:

```bash
# Windows (PowerShell as Admin)
New-Item -ItemType SymbolicLink -Path "src/userplugins/ottoquest" -Target "D:\COMPROG\ottoquest"

# Linux/macOS
ln -s /path/to/ottoquest src/userplugins/ottoquest
```

### 3. Build

```bash
pnpm build
```

### 4. Inject into Discord

```bash
pnpm inject
```

### 5. Launch Discord

The plugin should appear in Settings > Vencord > Plugins

## Development Workflow

### Making Changes

1. Edit source files in `src/userplugins/ottoquest/`
2. Run `pnpm build`
3. Press Ctrl+R in Discord to reload
4. Test changes

### Hot Reload (Optional)

For faster iteration:

```bash
pnpm watch
```

This rebuilds on file changes. Still need Ctrl+R to reload Discord.

## Project Structure

```
ottoquest/
├── index.ts              # Main plugin entry, patches, flux handlers
├── settings.ts           # Plugin settings definition
├── core/
│   └── QuestManager.ts   # Quest detection and orchestration
├── completers/
│   ├── VideoCompleter.ts # Video quest completion
│   ├── GameCompleter.ts  # Game quest completion via fake game
│   ├── StreamCompleter.ts # Stream quest completion
│   └── ActivityCompleter.ts # Activity quest completion
├── utils/
│   ├── logger.ts         # Logging utility
│   └── stores.ts         # Discord store references
└── docs/                 # Documentation
```

## Debugging

### Console Access

Press `Ctrl+Shift+I` in Discord to open Developer Tools.

### OttoQuest Logs

All logs are prefixed with `[OttoQuest]`:

```javascript
// Filter console for OttoQuest logs
// In console filter box, type: OttoQuest
```

### Inspecting Stores

```javascript
// Access QuestsStore
Vencord.Webpack.findByStoreName("QuestsStore")

// Access RunningGameStore
Vencord.Webpack.findByStoreName("RunningGameStore")

// View current quests
Vencord.Webpack.findByStoreName("QuestsStore").quests
```

## Common Issues

### Plugin not loading

1. Check for syntax errors: `pnpm build` should show no errors
2. Ensure plugin is in correct location
3. Check Discord console for errors

### Quests not detecting

1. Verify QuestsStore has quests: check `QuestsStore.quests` in console
2. Check if `autoEnroll` and `autoComplete` settings are enabled
3. Look for errors in console logs

### Build errors

1. Ensure Node.js 18+
2. Run `pnpm install` in Vencord directory
3. Check TypeScript errors in source files

## Useful Vencord APIs

```typescript
// Webpack module finding
import { findByPropsLazy, findByCodeLazy } from "@webpack";

// Common modules
import { FluxDispatcher, RestAPI } from "@webpack/common";

// Notifications
import { showNotification } from "@api/Notifications";

// Plugin definition
import definePlugin from "@utils/types";
```
