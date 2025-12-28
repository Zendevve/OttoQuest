/*
 * OttoQuest - The Definitive Discord Quest Completer
 * Automatically completes all Discord quests with zero interaction
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const settings = definePluginSettings({
  // === Mode Settings ===
  completionMode: {
    type: OptionType.SELECT,
    description: "When to complete quests",
    options: [
      { label: "Full Auto - Complete immediately when detected", value: "auto", default: true },
      { label: "Manual - Only complete when you click the button", value: "manual" },
      { label: "Semi-Auto - Auto-complete but ask before enrolling", value: "semi" }
    ],
    default: "auto"
  },

  // === Quest Type Toggles ===
  completeVideoQuests: {
    type: OptionType.BOOLEAN,
    description: "Complete video quests (WATCH_VIDEO)",
    default: true
  },
  completeGameQuests: {
    type: OptionType.BOOLEAN,
    description: "Complete game quests (PLAY_ON_DESKTOP)",
    default: true
  },
  completeStreamQuests: {
    type: OptionType.BOOLEAN,
    description: "Complete stream quests (STREAM_ON_DESKTOP)",
    default: true
  },
  completeActivityQuests: {
    type: OptionType.BOOLEAN,
    description: "Complete activity quests (PLAY_ACTIVITY)",
    default: true
  },

  // === Speed & Throttle Settings ===
  videoSpeed: {
    type: OptionType.SLIDER,
    description: "Video quest speed multiplier (lower = more natural)",
    default: 5,
    markers: [1, 2, 3, 4, 5, 6, 7],
    stickToMarkers: true
  },
  completionDelay: {
    type: OptionType.SLIDER,
    description: "Delay between quest actions in seconds (higher = safer)",
    default: 2,
    markers: [0, 1, 2, 5, 10, 30],
    stickToMarkers: false
  },
  randomizeDelay: {
    type: OptionType.BOOLEAN,
    description: "Add random variation to delays (more natural behavior)",
    default: true
  },

  // === Other Settings ===
  mobileFix: {
    type: OptionType.BOOLEAN,
    description: "Convert mobile-only video quests to desktop format",
    default: true
  },
  notifyOnComplete: {
    type: OptionType.BOOLEAN,
    description: "Show notification when a quest completes",
    default: true
  },
  debugLogging: {
    type: OptionType.BOOLEAN,
    description: "Show detailed logs in console (for troubleshooting)",
    default: false
  }
});

export default settings;
