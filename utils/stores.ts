/*
 * OttoQuest - Store References
 * Webpack-based access to Discord's internal stores
 */

import { findByPropsLazy } from "@webpack";
import { findStoreLazy } from "@webpack";

// Quest-related stores
export const QuestsStore = findStoreLazy("QuestsStore");
export const RunningGameStore = findStoreLazy("RunningGameStore");

// Channel stores for activity quests
export const ChannelStore = findStoreLazy("ChannelStore");
export const GuildChannelStore = findStoreLazy("GuildChannelStore");
export const SelectedChannelStore = findStoreLazy("SelectedChannelStore");

// Quest action utilities
export const QuestUtils = findByPropsLazy("enrollInQuest", "claimQuestReward");
export const ApplicationStreamingStore = findStoreLazy("ApplicationStreamingStore");

// Types for quest data
export interface QuestTask {
  type: string;
  target: number;
}

export interface QuestTasks {
  WATCH_VIDEO?: QuestTask;
  WATCH_VIDEO_ON_MOBILE?: QuestTask;
  PLAY_ON_DESKTOP?: QuestTask;
  PLAY_ON_XBOX?: QuestTask;
  PLAY_ON_PLAYSTATION?: QuestTask;
  PLAY_ACTIVITY?: QuestTask;
  STREAM_ON_DESKTOP?: QuestTask;
  [key: string]: QuestTask | undefined;
}

export interface QuestConfig {
  application: {
    id: string;
    name: string;
  };
  messages: {
    questName: string;
  };
  expiresAt: string;
  startsAt: string;
  taskConfig?: {
    tasks: QuestTasks;
  };
  taskConfigV2?: {
    tasks: QuestTasks;
  };
  configVersion?: number;
}

export interface QuestUserStatus {
  visibilityState?: number;
  enrolledAt?: string;
  completedAt?: string;
  claimedAt?: string;
  progress?: {
    [taskType: string]: {
      value: number;
    };
  };
  streamProgressSeconds?: number;
}

export interface Quest {
  id: string;
  config: QuestConfig;
  userStatus?: QuestUserStatus;
}

// Quest enrollment action type
export interface QuestAction {
  questContent: any;
  questContentCTA: string;
  sourceQuestContent: number;
}
