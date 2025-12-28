/*
 * OttoQuest - Video Quest Completer
 * Completes video quests by spoofing video progress via REST API
 */

import { RestAPI } from "@webpack/common";
import { Quest } from "../utils/stores";
import logger from "../utils/logger";
import { settings } from "../settings";

// Track active video completions
const activeVideoCompletions = new Map<string, boolean>();

export function isVideoQuest(quest: Quest): boolean {
  const tasks = quest.config.taskConfigV2?.tasks ?? quest.config.taskConfig?.tasks;
  return !!(tasks?.WATCH_VIDEO || tasks?.WATCH_VIDEO_ON_MOBILE);
}

export function getVideoTarget(quest: Quest): number {
  const tasks = quest.config.taskConfigV2?.tasks ?? quest.config.taskConfig?.tasks;
  return tasks?.WATCH_VIDEO?.target ?? tasks?.WATCH_VIDEO_ON_MOBILE?.target ?? 0;
}

export function isCompletingVideo(questId: string): boolean {
  return activeVideoCompletions.get(questId) === true;
}

export function stopVideoCompletion(questId: string): void {
  activeVideoCompletions.set(questId, false);
}

export function stopAllVideoCompletions(): void {
  for (const questId of activeVideoCompletions.keys()) {
    activeVideoCompletions.set(questId, false);
  }
}

/**
 * Get interval between progress updates based on speed setting
 * Lower speed = longer intervals = more natural
 */
function getProgressInterval(): number {
  const speed = settings.store.videoSpeed;
  // Base interval of 1 second, extended for lower speeds
  const baseInterval = 1000;

  // Add random variation if enabled
  if (settings.store.randomizeDelay) {
    const variation = baseInterval * 0.3;
    return baseInterval + (Math.random() * variation * 2 - variation);
  }

  return baseInterval;
}

export async function completeVideoQuest(quest: Quest): Promise<boolean> {
  const questName = quest.config.messages.questName;
  const target = getVideoTarget(quest);

  if (!target) {
    logger.warn(`Could not find video duration for quest: ${questName}`);
    return false;
  }

  if (!quest.userStatus?.enrolledAt) {
    logger.warn(`Quest not enrolled: ${questName}`);
    return false;
  }

  const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();
  const taskType = quest.config.taskConfigV2?.tasks?.WATCH_VIDEO ? "WATCH_VIDEO" : "WATCH_VIDEO_ON_MOBILE";
  let currentProgress = quest.userStatus?.progress?.[taskType]?.value ?? 0;

  const remainingSeconds = target - currentProgress;
  const estimatedMinutes = Math.ceil(remainingSeconds / 60 / settings.store.videoSpeed);

  logger.info(`Completing quest "${questName}" - ${taskType}`);
  logger.info(`  Duration: ${target}s, Progress: ${currentProgress}s, Remaining: ~${estimatedMinutes} min at ${settings.store.videoSpeed}x speed`);

  activeVideoCompletions.set(quest.id, true);

  const maxFuture = 10; // Max seconds into future allowed
  const speed = settings.store.videoSpeed;

  try {
    while (activeVideoCompletions.get(quest.id)) {
      const now = Date.now();
      const maxAllowed = Math.floor((now - enrolledAt) / 1000) + maxFuture;
      const diff = maxAllowed - currentProgress;

      // Wait if we're too far ahead
      if (diff < speed) {
        await sleep(getProgressInterval());
        continue;
      }

      // Calculate next progress timestamp with small random variation
      const randomOffset = settings.store.randomizeDelay ? Math.random() : 0;
      const timestamp = Math.min(target, currentProgress + speed + randomOffset);

      // Send progress update
      const res = await RestAPI.post({
        url: `/quests/${quest.id}/video-progress`,
        body: { timestamp }
      });

      const completed = res.body?.completed_at != null;
      currentProgress = Math.min(target, timestamp);

      if (settings.store.debugLogging) {
        logger.debug(`Quest "${questName}" progress: ${Math.floor(currentProgress)}/${target}s`);
      }

      // Check if complete
      if (completed || currentProgress >= target) {
        // Send final completion if not already marked complete
        if (!completed) {
          await RestAPI.post({
            url: `/quests/${quest.id}/video-progress`,
            body: { timestamp: target }
          });
        }

        logger.info(`Quest "${questName}" completed!`);
        activeVideoCompletions.delete(quest.id);
        return true;
      }

      await sleep(getProgressInterval());
    }

    // Stopped externally
    logger.info(`Stopped completing quest: ${questName}`);
    activeVideoCompletions.delete(quest.id);
    return false;

  } catch (error) {
    logger.error(`Error completing video quest "${questName}":`, error);
    activeVideoCompletions.delete(quest.id);
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  isVideoQuest,
  getVideoTarget,
  isCompletingVideo,
  stopVideoCompletion,
  stopAllVideoCompletions,
  completeVideoQuest
};
