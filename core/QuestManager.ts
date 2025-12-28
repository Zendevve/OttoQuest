/*
 * OttoQuest - Quest Manager
 * Central orchestration for quest detection, enrollment, and completion routing
 */

import { findByCodeLazy, findByPropsLazy } from "@webpack";
import { showNotification } from "@api/Notifications";
import { Quest, QuestsStore } from "../utils/stores";
import logger from "../utils/logger";
import { settings } from "../settings";

import VideoCompleter from "../completers/VideoCompleter";
import GameCompleter from "../completers/GameCompleter";
import StreamCompleter from "../completers/StreamCompleter";
import ActivityCompleter from "../completers/ActivityCompleter";

// Quest enrollment action
const QuestApplyAction = findByCodeLazy('type:"QUESTS_ENROLL_BEGIN"') as
  (questId: string, action: any) => Promise<any>;
const QuestLocationMap = findByPropsLazy("QUEST_HOME_DESKTOP", "11") as Record<string, any>;

// Track which quests are being processed
const processingQuests = new Set<string>();

// Quests pending user confirmation for enrollment
const pendingEnrollment = new Map<string, Quest>();

// Quests ready to complete (user approved or auto mode)
const approvedQuests = new Set<string>();

/**
 * Get all available quests from the store
 */
export function getQuests(): Quest[] {
  const questsMap = QuestsStore?.quests;
  if (!questsMap) return [];
  return Array.from(questsMap.values()) as Quest[];
}

/**
 * Check if a quest is enrollable (not enrolled, not expired)
 */
export function isEnrollable(quest: Quest): boolean {
  if (quest.userStatus?.enrolledAt) return false;
  const expiresAt = new Date(quest.config.expiresAt).getTime();
  return expiresAt > Date.now();
}

/**
 * Check if a quest is completable (enrolled, not completed, not expired)
 */
export function isCompletable(quest: Quest): boolean {
  if (!quest.userStatus?.enrolledAt) return false;
  if (quest.userStatus?.completedAt) return false;
  const expiresAt = new Date(quest.config.expiresAt).getTime();
  return expiresAt > Date.now();
}

/**
 * Check if a quest is already being completed
 */
export function isBeingCompleted(quest: Quest): boolean {
  return processingQuests.has(quest.id) ||
    VideoCompleter.isCompletingVideo(quest.id) ||
    GameCompleter.isCompletingGame(quest.id) ||
    StreamCompleter.isCompletingStream(quest.id) ||
    ActivityCompleter.isCompletingActivity(quest.id);
}

/**
 * Apply mobile quest fix - convert WATCH_VIDEO_ON_MOBILE to WATCH_VIDEO
 */
export function applyMobileFix(quest: Quest): void {
  if (!settings.store.mobileFix) return;

  const tasks = quest.config.taskConfigV2?.tasks ?? quest.config.taskConfig?.tasks;
  if (!tasks) return;

  if (tasks.WATCH_VIDEO_ON_MOBILE && !tasks.WATCH_VIDEO) {
    tasks.WATCH_VIDEO = {
      ...tasks.WATCH_VIDEO_ON_MOBILE,
      type: "WATCH_VIDEO"
    };
    logger.info(`Applied mobile fix to quest: ${quest.config.messages.questName}`);
  }
}

/**
 * Get randomized delay based on settings
 */
export function getDelay(): number {
  const baseDelay = settings.store.completionDelay * 1000;
  if (!settings.store.randomizeDelay) return baseDelay;

  // Add +/- 50% random variation
  const variation = baseDelay * 0.5;
  return baseDelay + (Math.random() * variation * 2 - variation);
}

/**
 * Sleep with optional randomization
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Automatically enroll in a quest
 */
export async function enrollQuest(quest: Quest): Promise<boolean> {
  if (!isEnrollable(quest)) return false;

  const questName = quest.config.messages.questName;
  const mode = settings.store.completionMode;

  // In semi-auto mode, ask for confirmation
  if (mode === "semi") {
    if (!pendingEnrollment.has(quest.id)) {
      pendingEnrollment.set(quest.id, quest);
      showNotification({
        title: "New Quest Available",
        body: `"${questName}" - Open OttoQuest to enroll`,
        permanent: false
      });
      logger.info(`Quest "${questName}" awaiting enrollment confirmation`);
    }
    return false;
  }

  // In manual mode, don't auto-enroll
  if (mode === "manual") {
    return false;
  }

  // Auto mode - enroll immediately
  try {
    await sleep(getDelay());

    const action = {
      questContent: QuestLocationMap?.QUEST_HOME_DESKTOP ?? 0,
      questContentCTA: "ACCEPT_QUEST",
      sourceQuestContent: 0
    };

    await QuestApplyAction(quest.id, action);
    logger.info(`Enrolled in quest: ${questName}`);
    return true;
  } catch (error) {
    logger.error(`Failed to enroll in quest "${questName}":`, error);
    return false;
  }
}

/**
 * Confirm enrollment for a pending quest (called from UI)
 */
export async function confirmEnrollment(questId: string): Promise<boolean> {
  const quest = pendingEnrollment.get(questId);
  if (!quest) return false;

  try {
    const action = {
      questContent: QuestLocationMap?.QUEST_HOME_DESKTOP ?? 0,
      questContentCTA: "ACCEPT_QUEST",
      sourceQuestContent: 0
    };

    await QuestApplyAction(quest.id, action);
    pendingEnrollment.delete(questId);
    approvedQuests.add(questId);
    logger.info(`Confirmed enrollment: ${quest.config.messages.questName}`);
    return true;
  } catch (error) {
    logger.error(`Failed to confirm enrollment:`, error);
    return false;
  }
}

/**
 * Reject enrollment for a pending quest (called from UI)
 */
export function rejectEnrollment(questId: string): void {
  pendingEnrollment.delete(questId);
  logger.info(`Rejected enrollment for quest: ${questId}`);
}

/**
 * Get pending enrollments for UI display
 */
export function getPendingEnrollments(): Quest[] {
  return Array.from(pendingEnrollment.values());
}

/**
 * Determine quest type and route to appropriate completer
 */
export function getQuestType(quest: Quest): "video" | "game" | "stream" | "activity" | "unknown" {
  if (VideoCompleter.isVideoQuest(quest)) return "video";
  if (GameCompleter.isGameQuest(quest)) return "game";
  if (StreamCompleter.isStreamQuest(quest)) return "stream";
  if (ActivityCompleter.isActivityQuest(quest)) return "activity";
  return "unknown";
}

/**
 * Check if quest type is enabled in settings
 */
export function isQuestTypeEnabled(questType: string): boolean {
  switch (questType) {
    case "video": return settings.store.completeVideoQuests;
    case "game": return settings.store.completeGameQuests;
    case "stream": return settings.store.completeStreamQuests;
    case "activity": return settings.store.completeActivityQuests;
    default: return false;
  }
}

/**
 * Start completing a quest based on its type
 */
export async function completeQuest(quest: Quest): Promise<boolean> {
  if (!isCompletable(quest)) return false;
  if (isBeingCompleted(quest)) return false;

  const questName = quest.config.messages.questName;
  const questType = getQuestType(quest);

  if (questType === "unknown") {
    logger.warn(`Unknown quest type for: ${questName}`);
    return false;
  }

  // Check if quest type is enabled
  if (!isQuestTypeEnabled(questType)) {
    logger.debug(`Quest type "${questType}" is disabled, skipping: ${questName}`);
    return false;
  }

  // In manual mode, only complete if explicitly approved
  const mode = settings.store.completionMode;
  if (mode === "manual" && !approvedQuests.has(quest.id)) {
    return false;
  }

  processingQuests.add(quest.id);

  try {
    // Add delay before starting
    await sleep(getDelay());

    let success = false;

    switch (questType) {
      case "video":
        applyMobileFix(quest);
        success = await VideoCompleter.completeVideoQuest(quest);
        break;
      case "game":
        success = await GameCompleter.completeGameQuest(quest);
        break;
      case "stream":
        success = await StreamCompleter.completeStreamQuest(quest);
        break;
      case "activity":
        success = await ActivityCompleter.completeActivityQuest(quest);
        break;
    }

    if (success) {
      approvedQuests.delete(quest.id);

      if (settings.store.notifyOnComplete) {
        showNotification({
          title: "Quest Completed!",
          body: `"${questName}" has been completed.`,
          permanent: false
        });
      }
    }

    return success;
  } finally {
    processingQuests.delete(quest.id);
  }
}

/**
 * Manually trigger completion for a specific quest (called from UI)
 */
export async function manualComplete(questId: string): Promise<boolean> {
  const quests = getQuests();
  const quest = quests.find(q => q.id === questId);

  if (!quest) {
    logger.error(`Quest not found: ${questId}`);
    return false;
  }

  approvedQuests.add(questId);
  return await completeQuest(quest);
}

/**
 * Manually trigger completion for all completable quests
 */
export async function manualCompleteAll(): Promise<void> {
  const quests = getQuests();

  for (const quest of quests) {
    if (isCompletable(quest) && !isBeingCompleted(quest)) {
      approvedQuests.add(quest.id);
      completeQuest(quest).catch(error => {
        logger.error(`Error completing quest ${quest.config.messages.questName}:`, error);
      });
    }
  }
}

/**
 * Get completable quests for UI display
 */
export function getCompletableQuests(): Quest[] {
  return getQuests().filter(q => isCompletable(q));
}

/**
 * Get in-progress quests for UI display
 */
export function getInProgressQuests(): { quest: Quest; type: string; }[] {
  const result: { quest: Quest; type: string; }[] = [];

  for (const quest of getQuests()) {
    if (isBeingCompleted(quest)) {
      result.push({ quest, type: getQuestType(quest) });
    }
  }

  return result;
}

/**
 * Process all available quests - enroll and complete as needed
 */
export async function processQuests(): Promise<void> {
  const mode = settings.store.completionMode;

  // In manual mode, don't auto-process
  if (mode === "manual") {
    return;
  }

  const quests = getQuests();

  for (const quest of quests) {
    // Auto-enroll if not enrolled
    if (isEnrollable(quest)) {
      await enrollQuest(quest);
    }

    // Auto-complete if enrolled and not completed
    if (isCompletable(quest) && !isBeingCompleted(quest)) {
      // Don't await - let completions run in parallel
      completeQuest(quest).catch(error => {
        logger.error(`Error processing quest ${quest.config.messages.questName}:`, error);
      });
    }
  }
}

/**
 * Stop all active completions
 */
export function stopAll(): void {
  VideoCompleter.stopAllVideoCompletions();
  GameCompleter.stopAllGameCompletions();
  StreamCompleter.stopAllStreamCompletions();
  ActivityCompleter.stopAllActivityCompletions();
  processingQuests.clear();
  approvedQuests.clear();
  logger.info("Stopped all quest completions");
}

export default {
  getQuests,
  isEnrollable,
  isCompletable,
  isBeingCompleted,
  applyMobileFix,
  getDelay,
  sleep,
  enrollQuest,
  confirmEnrollment,
  rejectEnrollment,
  getPendingEnrollments,
  getQuestType,
  isQuestTypeEnabled,
  completeQuest,
  manualComplete,
  manualCompleteAll,
  getCompletableQuests,
  getInProgressQuests,
  processQuests,
  stopAll
};
