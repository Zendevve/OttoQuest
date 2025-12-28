/*
 * OttoQuest - Stream Quest Completer
 * Completes stream quests by spoofing stream metadata
 */

import { FluxDispatcher } from "@webpack/common";
import { Quest } from "../utils/stores";
import logger from "../utils/logger";

// Track fake streams and completion state
const fakeStreams = new Map<string, any>();
const completionState = new Map<string, boolean>();
const heartbeatSubscribers = new Map<string, (event: any) => void>();

export function isStreamQuest(quest: Quest): boolean {
  const tasks = quest.config.taskConfigV2?.tasks ?? quest.config.taskConfig?.tasks;
  return !!tasks?.STREAM_ON_DESKTOP;
}

export function getStreamTarget(quest: Quest): number {
  const tasks = quest.config.taskConfigV2?.tasks ?? quest.config.taskConfig?.tasks;
  return tasks?.STREAM_ON_DESKTOP?.target ?? 0;
}

export function isCompletingStream(questId: string): boolean {
  return completionState.get(questId) === true;
}

export function stopStreamCompletion(questId: string): void {
  completionState.set(questId, false);
  cleanupFakeStream(questId);
}

export function stopAllStreamCompletions(): void {
  for (const questId of completionState.keys()) {
    stopStreamCompletion(questId);
  }
}

function cleanupFakeStream(questId: string): void {
  fakeStreams.delete(questId);

  const subscriber = heartbeatSubscribers.get(questId);
  if (subscriber) {
    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", subscriber);
    heartbeatSubscribers.delete(questId);
  }

  completionState.delete(questId);
}

// Called by webpack patch to get fake stream metadata
export function getStreamerActiveStreamMetadata(): any | undefined {
  if (fakeStreams.size > 0) {
    return Array.from(fakeStreams.values())[0];
  }
  return undefined;
}

export async function completeStreamQuest(quest: Quest): Promise<boolean> {
  const questName = quest.config.messages.questName;
  const applicationId = quest.config.application.id;
  const applicationName = quest.config.application.name;
  const target = getStreamTarget(quest);

  if (!target) {
    logger.warn(`Could not find stream duration for quest: ${questName}`);
    return false;
  }

  const currentProgress = quest.userStatus?.progress?.STREAM_ON_DESKTOP?.value ??
    quest.userStatus?.streamProgressSeconds ?? 0;
  const remaining = Math.max(0, target - currentProgress);

  logger.info(`Completing quest "${questName}" - STREAM_ON_DESKTOP for ${target} seconds (${Math.ceil(remaining / 60)} min remaining)`);
  logger.warn("Note: Stream quests require at least 1 other person in your voice channel!");

  completionState.set(quest.id, true);

  try {
    // Create fake stream metadata
    const pid = Math.floor(Math.random() * 30000) + 1000;
    const fakeStream = {
      id: applicationId,
      name: `FakeStream ${applicationName} (OttoQuest)`,
      pid,
      sourceName: null
    };

    fakeStreams.set(quest.id, fakeStream);

    // Subscribe to heartbeat success events
    return new Promise<boolean>((resolve) => {
      const heartbeatHandler = (event: any) => {
        if (event.questId !== quest.id) return;

        const configVersion = quest.config.configVersion;
        const progress = configVersion === 1
          ? event.userStatus?.streamProgressSeconds ?? 0
          : event.userStatus?.progress?.STREAM_ON_DESKTOP?.value ?? 0;

        logger.debug(`Quest progress "${questName}": ${progress}/${target}`);

        if (!completionState.get(quest.id) || progress >= target) {
          cleanupFakeStream(quest.id);

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
    logger.error(`Error completing stream quest "${questName}":`, error);
    cleanupFakeStream(quest.id);
    return false;
  }
}

export default {
  isStreamQuest,
  getStreamTarget,
  isCompletingStream,
  stopStreamCompletion,
  stopAllStreamCompletions,
  completeStreamQuest,
  getStreamerActiveStreamMetadata
};
