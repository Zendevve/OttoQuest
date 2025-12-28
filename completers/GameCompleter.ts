/*
 * OttoQuest - Game Quest Completer
 * Completes game quests by spoofing a running game via RunningGameStore
 */

import { FluxDispatcher, RestAPI } from "@webpack/common";
import { Quest, RunningGameStore } from "../utils/stores";
import logger from "../utils/logger";

// Track fake games and their completion state
const fakeGames = new Map<string, any>();
const completionState = new Map<string, boolean>();
const heartbeatSubscribers = new Map<string, (event: any) => void>();

export function isGameQuest(quest: Quest): boolean {
  const tasks = quest.config.taskConfigV2?.tasks ?? quest.config.taskConfig?.tasks;
  return !!(tasks?.PLAY_ON_DESKTOP || tasks?.PLAY_ON_XBOX || tasks?.PLAY_ON_PLAYSTATION);
}

export function getGameTarget(quest: Quest): number {
  const tasks = quest.config.taskConfigV2?.tasks ?? quest.config.taskConfig?.tasks;
  return tasks?.PLAY_ON_DESKTOP?.target ??
    tasks?.PLAY_ON_XBOX?.target ??
    tasks?.PLAY_ON_PLAYSTATION?.target ?? 0;
}

export function getGameTaskType(quest: Quest): string {
  const tasks = quest.config.taskConfigV2?.tasks ?? quest.config.taskConfig?.tasks;
  if (tasks?.PLAY_ON_DESKTOP) return "PLAY_ON_DESKTOP";
  if (tasks?.PLAY_ON_XBOX) return "PLAY_ON_XBOX";
  if (tasks?.PLAY_ON_PLAYSTATION) return "PLAY_ON_PLAYSTATION";
  return "";
}

export function isCompletingGame(questId: string): boolean {
  return completionState.get(questId) === true;
}

export function stopGameCompletion(questId: string): void {
  completionState.set(questId, false);
  cleanupFakeGame(questId);
}

export function stopAllGameCompletions(): void {
  for (const questId of completionState.keys()) {
    stopGameCompletion(questId);
  }
}

function cleanupFakeGame(questId: string): void {
  const fakeGame = fakeGames.get(questId);
  if (fakeGame) {
    // Remove fake game from running games
    const currentGames = getRunningGamesWithoutFakes();
    FluxDispatcher.dispatch({
      type: "RUNNING_GAMES_CHANGE",
      removed: [fakeGame],
      added: currentGames,
      games: currentGames
    });
    fakeGames.delete(questId);
  }

  // Unsubscribe from heartbeat events
  const subscriber = heartbeatSubscribers.get(questId);
  if (subscriber) {
    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", subscriber);
    heartbeatSubscribers.delete(questId);
  }

  completionState.delete(questId);
}

export function getRunningGamesWithoutFakes(): any[] {
  const realGames = RunningGameStore?.getRunningGames?.() ?? [];
  const fakeGamePids = new Set(Array.from(fakeGames.values()).map(g => g.pid));
  return realGames.filter((g: any) => !fakeGamePids.has(g.pid));
}

// Called by webpack patch to inject fake games
export function getRunningGames(): any[] | undefined {
  if (fakeGames.size > 0) {
    return Array.from(fakeGames.values());
  }
  return undefined;
}

// Called by webpack patch to find fake game by PID
export function getGameForPID(pid: number): any | undefined {
  for (const game of fakeGames.values()) {
    if (game.pid === pid) {
      return game;
    }
  }
  return undefined;
}

export async function completeGameQuest(quest: Quest): Promise<boolean> {
  if (typeof DiscordNative === "undefined") {
    logger.warn("Game quests can only be completed on Discord Desktop");
    return false;
  }

  const questName = quest.config.messages.questName;
  const applicationId = quest.config.application.id;
  const applicationName = quest.config.application.name;
  const target = getGameTarget(quest);
  const taskType = getGameTaskType(quest);

  if (!target || !taskType) {
    logger.warn(`Could not find game duration for quest: ${questName}`);
    return false;
  }

  const currentProgress = quest.userStatus?.progress?.[taskType]?.value ?? 0;
  const remaining = Math.max(0, target - currentProgress);

  logger.info(`Completing quest "${questName}" - ${taskType} for ${target} seconds (${Math.ceil(remaining / 60)} min remaining)`);

  completionState.set(quest.id, true);

  try {
    // Fetch application data to get executable info
    const appRes = await RestAPI.get({
      url: `/applications/public?application_ids=${applicationId}`
    });

    const appData = appRes.body?.[0];
    if (!appData) {
      logger.error(`Could not fetch application data for ${applicationName}`);
      completionState.delete(quest.id);
      return false;
    }

    // Find Windows executable
    const exeInfo = appData.executables?.find((x: any) => x.os === "win32");
    const exeName = exeInfo?.name?.replace(">", "") ?? `${applicationName}.exe`;

    // Create fake game process
    const pid = Math.floor(Math.random() * 30000) + 1000;
    const fakeGame = {
      cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
      exeName,
      exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
      hidden: false,
      isLauncher: false,
      id: applicationId,
      name: appData.name,
      pid,
      pidPath: [pid],
      processName: appData.name,
      start: Date.now()
    };

    // Inject fake game
    const realGames = fakeGames.size === 0 ? (RunningGameStore?.getRunningGames?.() ?? []) : [];
    fakeGames.set(quest.id, fakeGame);

    FluxDispatcher.dispatch({
      type: "RUNNING_GAMES_CHANGE",
      removed: realGames,
      added: [fakeGame],
      games: Array.from(fakeGames.values())
    });

    logger.info(`Spoofed game to "${applicationName}" - waiting for heartbeats`);

    // Subscribe to heartbeat success events
    return new Promise<boolean>((resolve) => {
      const heartbeatHandler = (event: any) => {
        if (event.questId !== quest.id) return;

        const configVersion = quest.config.configVersion;
        const progress = configVersion === 1
          ? event.userStatus?.streamProgressSeconds ?? 0
          : event.userStatus?.progress?.[taskType]?.value ?? 0;

        logger.debug(`Quest progress "${questName}": ${progress}/${target}`);

        if (!completionState.get(quest.id) || progress >= target) {
          cleanupFakeGame(quest.id);

          if (progress >= target) {
            logger.info(`Quest "${questName}" completed!`);
            resolve(true);
          } else {
            logger.info(`Stopped completing quest: ${questName}`);
            resolve(false);
          }
        }
      };

      heartbeatSubscribers.set(quest.id, heartbeatHandler);
      FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", heartbeatHandler);
    });

  } catch (error) {
    logger.error(`Error completing game quest "${questName}":`, error);
    cleanupFakeGame(quest.id);
    return false;
  }
}

export default {
  isGameQuest,
  getGameTarget,
  isCompletingGame,
  stopGameCompletion,
  stopAllGameCompletions,
  completeGameQuest,
  getRunningGames,
  getGameForPID
};
