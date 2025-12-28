/*
 * OttoQuest - The Definitive Discord Quest Completer
 * Automatically completes all Discord quests with zero interaction
 *
 * Features:
 * - Auto-enrollment in new quests (with optional confirmation)
 * - Video quest completion via progress spoofing
 * - Game quest completion via RunningGameStore injection
 * - Stream quest completion via stream metadata spoofing
 * - Activity quest completion via heartbeat spoofing
 * - Parallel completion of multiple quests
 * - Mobile quest compatibility fix
 * - Manual mode with control panel
 * - Per-quest-type toggles
 * - Configurable delays for natural behavior
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { QuestsStore } from "./utils/stores";
import logger from "./utils/logger";
import { settings } from "./settings";
import QuestManager from "./core/QuestManager";
import GameCompleter from "./completers/GameCompleter";
import StreamCompleter from "./completers/StreamCompleter";
import { ControlPanel } from "./components/ControlPanel";

export default definePlugin({
  name: "OttoQuest",
  description: "The definitive Discord quest completer - automatically completes all quests with configurable safety controls",
  authors: [{
    name: "OttoQuest",
    id: 0n
  }],
  settings,

  // Settings panel with control UI
  settingsAboutComponent: () => ControlPanel(),

  // Webpack patches for game/stream spoofing
  patches: [
    {
      // Patch RunningGameStore to inject fake games
      find: '"RunningGameStore"',
      group: true,
      replacement: [
        {
          match: /}getRunningGames\(\){return/,
          replace: "}getRunningGames(){const games=$self.getRunningGames();return games ? games : "
        },
        {
          match: /}getGameForPID\((\i)\){/,
          replace: "}getGameForPID($1){const pid=$self.getGameForPID($1);if(pid){return pid;}"
        }
      ]
    },
    {
      // Patch ApplicationStreamingStore to inject fake stream metadata
      find: "ApplicationStreamingStore",
      replacement: {
        match: /}getStreamerActiveStreamMetadata\(\){/,
        replace: "}getStreamerActiveStreamMetadata(){const metadata=$self.getStreamerActiveStreamMetadata();if(metadata){return metadata;}"
      }
    }
  ],

  // Flux event handlers for quest updates
  flux: {
    // Quest data fetched - process all quests
    QUESTS_FETCH_CURRENT_QUESTS_SUCCESS(data: any) {
      if (settings.store.debugLogging) {
        logger.debug("Quests fetched", data);
      }
      QuestManager.processQuests();
    },

    // Quest enrolled - start completion
    QUESTS_ENROLL_SUCCESS(data: any) {
      logger.info(`Quest enrolled: ${data.questId}`);
      QuestManager.processQuests();
    },

    // Quest status updated - recheck
    QUESTS_USER_STATUS_UPDATE(data: any) {
      if (settings.store.debugLogging) {
        logger.debug("Quest status updated", data);
      }
      QuestManager.processQuests();
    },

    // Running games changed - stop fake game if real game launched
    RUNNING_GAMES_CHANGE(data: any) {
      const gameIds = data.games?.map((g: any) => g.id) ?? [];

      // Check if any of our fake games' real apps were launched
      for (const quest of QuestManager.getQuests()) {
        const appId = quest.config.application.id;
        if (gameIds.includes(appId) && GameCompleter.isCompletingGame(quest.id)) {
          logger.info(`Real game launched for quest "${quest.config.messages.questName}", stopping fake game`);
          GameCompleter.stopGameCompletion(quest.id);
        }
      }
    },

    // User logged in - start processing
    LOGIN_SUCCESS() {
      logger.info("User logged in, starting quest processing");
      // Delay to ensure stores are ready
      setTimeout(() => QuestManager.processQuests(), 3000);
    },

    // User logged out - stop all
    LOGOUT() {
      logger.info("User logged out, stopping all completions");
      QuestManager.stopAll();
    }
  },

  // Exposed methods for webpack patches
  getRunningGames() {
    return GameCompleter.getRunningGames();
  },

  getGameForPID(pid: number) {
    return GameCompleter.getGameForPID(pid);
  },

  getStreamerActiveStreamMetadata() {
    return StreamCompleter.getStreamerActiveStreamMetadata();
  },

  // Plugin lifecycle
  start() {
    const mode = settings.store.completionMode;
    logger.info(`OttoQuest started in ${mode} mode`);

    // Subscribe to quest store changes
    QuestsStore?.addChangeListener?.(this.onQuestsChange);

    // Initial quest processing (delayed to ensure stores are ready)
    setTimeout(() => QuestManager.processQuests(), 2000);
  },

  stop() {
    logger.info("OttoQuest stopping...");

    // Unsubscribe from quest store
    QuestsStore?.removeChangeListener?.(this.onQuestsChange);

    // Stop all active completions
    QuestManager.stopAll();

    logger.info("OttoQuest stopped");
  },

  onQuestsChange() {
    QuestManager.processQuests();
  }
});
