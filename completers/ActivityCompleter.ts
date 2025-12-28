/*
 * OttoQuest - Activity Quest Completer
 * Completes activity quests by sending heartbeat requests
 */

import { RestAPI } from "@webpack/common";
import { Quest, ChannelStore, GuildChannelStore } from "../utils/stores";
import logger from "../utils/logger";

// Track active activity completions
const completionState = new Map<string, boolean>();

export function isActivityQuest(quest: Quest): boolean {
  const tasks = quest.config.taskConfigV2?.tasks ?? quest.config.taskConfig?.tasks;
  return !!tasks?.PLAY_ACTIVITY;
}

export function getActivityTarget(quest: Quest): number {
  const tasks = quest.config.taskConfigV2?.tasks ?? quest.config.taskConfig?.tasks;
  return tasks?.PLAY_ACTIVITY?.target ?? 0;
}

export function isCompletingActivity(questId: string): boolean {
  return completionState.get(questId) === true;
}

export function stopActivityCompletion(questId: string): void {
  completionState.set(questId, false);
}

export function stopAllActivityCompletions(): void {
  for (const questId of completionState.keys()) {
    completionState.set(questId, false);
  }
}

function findChannelId(): string | null {
  // Try private channels first
  const privateChannels = ChannelStore?.getSortedPrivateChannels?.() ?? [];
  if (privateChannels.length > 0 && privateChannels[0]?.id) {
    return privateChannels[0].id;
  }

  // Fall back to any guild voice channel
  const allGuilds = GuildChannelStore?.getAllGuilds?.() ?? {};
  for (const guildId in allGuilds) {
    const guild = allGuilds[guildId];
    if (guild?.VOCAL?.length > 0) {
      const voiceChannel = guild.VOCAL[0]?.channel;
      if (voiceChannel?.id) {
        return voiceChannel.id;
      }
    }
  }

  return null;
}

export async function completeActivityQuest(quest: Quest): Promise<boolean> {
  const questName = quest.config.messages.questName;
  const target = getActivityTarget(quest);

  if (!target) {
    logger.warn(`Could not find activity duration for quest: ${questName}`);
    return false;
  }

  const channelId = findChannelId();
  if (!channelId) {
    logger.error(`Could not find a valid channel for activity quest: ${questName}`);
    return false;
  }

  const streamKey = `call:${channelId}:1`;
  const heartbeatIntervalMs = 20 * 1000; // 20 seconds

  const currentProgress = quest.userStatus?.progress?.PLAY_ACTIVITY?.value ?? 0;
  const remaining = Math.max(0, target - currentProgress);

  logger.info(`Completing quest "${questName}" - PLAY_ACTIVITY for ${target} seconds (${Math.ceil(remaining / 60)} min remaining)`);

  completionState.set(quest.id, true);

  try {
    while (completionState.get(quest.id)) {
      // Send heartbeat
      const res = await RestAPI.post({
        url: `/quests/${quest.id}/heartbeat`,
        body: {
          stream_key: streamKey,
          terminal: false
        }
      });

      const progress = res.body?.progress?.PLAY_ACTIVITY?.value ?? 0;
      logger.debug(`Quest progress "${questName}": ${progress}/${target}`);

      // Check completion
      if (progress >= target) {
        // Send terminal heartbeat
        await RestAPI.post({
          url: `/quests/${quest.id}/heartbeat`,
          body: {
            stream_key: streamKey,
            terminal: true
          }
        });

        logger.info(`Quest "${questName}" completed!`);
        completionState.delete(quest.id);
        return true;
      }

      // Check if stopped
      if (!completionState.get(quest.id)) {
        logger.info(`Stopped completing quest: ${questName}`);
        completionState.delete(quest.id);
        return false;
      }

      // Wait for next heartbeat interval
      await sleep(heartbeatIntervalMs);
    }

    completionState.delete(quest.id);
    return false;

  } catch (error) {
    logger.error(`Error completing activity quest "${questName}":`, error);
    completionState.delete(quest.id);
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  isActivityQuest,
  getActivityTarget,
  isCompletingActivity,
  stopActivityCompletion,
  stopAllActivityCompletions,
  completeActivityQuest
};
