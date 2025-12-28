/*
 * OttoQuest - UI Components
 * Control panel for quest management with Laws of UX applied
 *
 * UX Principles Applied:
 * - Hick's Law: Limited options (3 modes)
 * - Miller's Law: Chunked into sections
 * - Goal-Gradient Effect: Progress bars for active quests
 * - Von Restorff Effect: Primary actions stand out
 * - Fitts's Law: Large touch targets
 * - Doherty Threshold: Immediate visual feedback
 * - Peak-End Rule: Celebration on completion
 */

import { React } from "@webpack/common";
import { Quest } from "../utils/stores";
import QuestManager from "../core/QuestManager";
import { settings } from "../settings";

const { useState, useEffect, useCallback } = React;

// Design tokens (following Discord's design system)
const COLORS = {
  // Status colors
  pending: "#faa61a",    // Orange - awaiting action
  ready: "#43b581",      // Green - ready to complete
  inProgress: "#5865f2", // Blurple - completing
  completed: "#747f8d",  // Gray - done

  // Action colors
  primary: "#5865f2",    // Discord blurple
  success: "#43b581",    // Green
  danger: "#f04747",     // Red
  warning: "#faa61a",    // Orange

  // Background
  cardBg: "var(--background-secondary)",
  cardBgHover: "var(--background-secondary-alt)",
  progressBg: "var(--background-tertiary)",

  // Text
  textPrimary: "var(--header-primary)",
  textSecondary: "var(--text-muted)",
  textOnColor: "#ffffff"
};

// Spacing tokens (following 4px grid)
const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px"
};

/**
 * Progress Bar Component
 * UX: Goal-Gradient Effect - shows progress to motivate completion
 */
function ProgressBar({
  progress,
  total,
  color = COLORS.inProgress,
  showLabel = true,
  animated = true
}: {
  progress: number;
  total: number;
  color?: string;
  showLabel?: boolean;
  animated?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, (progress / total) * 100));

  return (
    <div style={{ width: "100%", marginTop: SPACING.xs }}>
      {/* Progress track */}
      <div style={{
        width: "100%",
        height: "6px",
        backgroundColor: COLORS.progressBg,
        borderRadius: "3px",
        overflow: "hidden"
      }}>
        {/* Progress fill with animation */}
        <div style={{
          width: `${percentage}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: "3px",
          transition: animated ? "width 0.5s ease-out" : "none",
          // Subtle shimmer animation for active progress
          background: animated
            ? `linear-gradient(90deg, ${color} 0%, ${color}dd 50%, ${color} 100%)`
            : color,
          backgroundSize: "200% 100%",
          animation: animated ? "shimmer 2s infinite" : "none"
        }} />
      </div>

      {/* Label */}
      {showLabel && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: COLORS.textSecondary,
          marginTop: "2px"
        }}>
          <span>{Math.floor(progress)}s / {total}s</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}

/**
 * Status Badge Component
 * UX: Von Restorff Effect - distinct visual states
 */
function StatusBadge({ status, color }: { status: string; color: string }) {
  return (
    <span style={{
      backgroundColor: color,
      color: COLORS.textOnColor,
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "10px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    }}>
      {status}
    </span>
  );
}

/**
 * Action Button Component
 * UX: Fitts's Law - large touch target with good spacing
 */
function ActionButton({
  onClick,
  loading,
  variant = "primary",
  children,
  disabled = false,
  fullWidth = false
}: {
  onClick: () => void;
  loading?: boolean;
  variant?: "primary" | "success" | "danger";
  children: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const bgColors = {
    primary: COLORS.primary,
    success: COLORS.success,
    danger: COLORS.danger
  };

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        backgroundColor: bgColors[variant],
        color: COLORS.textOnColor,
        border: "none",
        padding: "8px 16px",
        borderRadius: "4px",
        cursor: loading || disabled ? "not-allowed" : "pointer",
        opacity: loading || disabled ? 0.6 : 1,
        fontSize: "13px",
        fontWeight: 600,
        width: fullWidth ? "100%" : "auto",
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACING.xs
      }}
    >
      {loading && <span style={{ animation: "spin 1s linear infinite" }}>⏳</span>}
      {children}
    </button>
  );
}

/**
 * Quest Card Component
 * UX: Law of Common Region - grouped elements with clear boundaries
 */
function QuestCard({
  quest,
  onRefresh
}: {
  quest: Quest;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const questName = quest.config.messages.questName;
  const questType = QuestManager.getQuestType(quest);
  const isCompleting = QuestManager.isBeingCompleted(quest);
  const isCompleted = !!quest.userStatus?.completedAt;
  const isEnrolled = !!quest.userStatus?.enrolledAt;

  // Get progress info
  const tasks = quest.config.taskConfigV2?.tasks ?? quest.config.taskConfig?.tasks;
  const taskType = Object.keys(tasks || {}).find(k =>
    ["WATCH_VIDEO", "WATCH_VIDEO_ON_MOBILE", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY"].includes(k)
  );
  const target = taskType ? (tasks as any)[taskType]?.target ?? 0 : 0;
  const progress = taskType ? quest.userStatus?.progress?.[taskType]?.value ?? 0 : 0;

  // Determine status
  const getStatus = () => {
    if (isCompleted) return { status: "Completed", color: COLORS.completed, action: null };
    if (isCompleting) return { status: "In Progress", color: COLORS.inProgress, action: "stop" };
    if (!isEnrolled) return { status: "Available", color: COLORS.pending, action: "enroll" };
    return { status: "Ready", color: COLORS.ready, action: "complete" };
  };

  const { status, color, action } = getStatus();

  const handleAction = async () => {
    setLoading(true);
    try {
      switch (action) {
        case "enroll":
          await QuestManager.confirmEnrollment(quest.id);
          break;
        case "complete":
          await QuestManager.manualComplete(quest.id);
          break;
        case "stop":
          // Stop functionality would go here
          break;
      }
    } finally {
      setLoading(false);
      onRefresh();
    }
  };

  // UX: Peak-End Rule - celebrate completion
  useEffect(() => {
    if (isCompleted && !celebrating) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 2000);
    }
  }, [isCompleted]);

  const actionLabels: Record<string, string> = {
    enroll: "▶ Enroll",
    complete: "⚡ Complete",
    stop: "⏹ Stop"
  };

  return (
    <div style={{
      padding: SPACING.md,
      borderRadius: "8px",
      backgroundColor: celebrating ? `${COLORS.success}15` : COLORS.cardBg,
      marginBottom: SPACING.sm,
      border: celebrating ? `1px solid ${COLORS.success}40` : "1px solid transparent",
      transition: "all 0.3s ease"
    }}>
      {/* Header: Name and Status */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: SPACING.sm
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 600,
            color: COLORS.textPrimary,
            marginBottom: SPACING.xs
          }}>
            {celebrating ? "🎉 " : ""}{questName}
          </div>
          <div style={{
            display: "flex",
            gap: SPACING.sm,
            alignItems: "center"
          }}>
            <StatusBadge status={status} color={color} />
            <span style={{
              fontSize: "12px",
              color: COLORS.textSecondary,
              textTransform: "capitalize"
            }}>
              {questType} Quest
            </span>
          </div>
        </div>

        {action && (
          <ActionButton
            onClick={handleAction}
            loading={loading}
            variant={action === "stop" ? "danger" : action === "complete" ? "success" : "primary"}
          >
            {actionLabels[action]}
          </ActionButton>
        )}
      </div>

      {/* Progress bar for active quests - UX: Goal-Gradient Effect */}
      {isCompleting && target > 0 && (
        <ProgressBar
          progress={progress}
          total={target}
          color={COLORS.inProgress}
          animated={true}
        />
      )}

      {/* Completed progress */}
      {isCompleted && target > 0 && (
        <ProgressBar
          progress={target}
          total={target}
          color={COLORS.success}
          animated={false}
        />
      )}
    </div>
  );
}

/**
 * Mode Indicator Component
 * UX: Law of Similarity - consistent styling shows relationship
 */
function ModeIndicator() {
  const mode = settings.store.completionMode;

  const modeConfig: Record<string, { emoji: string; title: string; desc: string; color: string }> = {
    auto: {
      emoji: "🚀",
      title: "Full Auto Mode",
      desc: "Automatically enrolls and completes all quests",
      color: COLORS.success
    },
    semi: {
      emoji: "⚡",
      title: "Semi-Auto Mode",
      desc: "Asks before enrolling, then auto-completes",
      color: COLORS.warning
    },
    manual: {
      emoji: "🎮",
      title: "Manual Mode",
      desc: "Click buttons to control each quest",
      color: COLORS.primary
    }
  };

  const config = modeConfig[mode] || modeConfig.manual;

  return (
    <div style={{
      padding: SPACING.md,
      borderRadius: "8px",
      backgroundColor: `${config.color}10`,
      border: `1px solid ${config.color}30`,
      marginBottom: SPACING.lg
    }}>
      <div style={{
        fontWeight: 600,
        color: config.color,
        marginBottom: SPACING.xs,
        fontSize: "14px"
      }}>
        {config.emoji} {config.title}
      </div>
      <div style={{
        fontSize: "12px",
        color: COLORS.textSecondary
      }}>
        {config.desc}
      </div>
    </div>
  );
}

/**
 * Section Header Component
 * UX: Chunking - clear visual separation of content groups
 */
function SectionHeader({
  title,
  count,
  collapsible = false,
  defaultOpen = true
}: {
  title: string;
  count: number;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (collapsible) {
    return (
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: SPACING.sm,
          cursor: "pointer",
          marginBottom: SPACING.sm,
          padding: `${SPACING.xs} 0`
        }}
      >
        <span style={{
          transform: isOpen ? "rotate(90deg)" : "rotate(0)",
          transition: "transform 0.2s ease"
        }}>
          ▶
        </span>
        <span style={{
          fontWeight: 600,
          color: COLORS.textSecondary,
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          {title} ({count})
        </span>
      </div>
    );
  }

  return (
    <div style={{
      fontWeight: 600,
      color: COLORS.textPrimary,
      marginBottom: SPACING.sm,
      fontSize: "14px"
    }}>
      {title} <span style={{ color: COLORS.textSecondary }}>({count})</span>
    </div>
  );
}

/**
 * Empty State Component
 * UX: Provide clear guidance when no content
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: SPACING.xl,
      textAlign: "center",
      color: COLORS.textSecondary,
      backgroundColor: COLORS.cardBg,
      borderRadius: "8px",
      fontSize: "13px"
    }}>
      {message}
    </div>
  );
}

/**
 * Main Control Panel Component
 * UX: Law of Common Region, Chunking, Clear Hierarchy
 */
export function ControlPanel() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(() => {
    setQuests(QuestManager.getQuests());
    forceUpdate((n: number) => n + 1);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 1000); // Faster updates for smoother progress
    return () => clearInterval(interval);
  }, [refresh]);

  const activeQuests = quests.filter((q: Quest) => !q.userStatus?.completedAt);
  const completedQuests = quests.filter((q: Quest) => q.userStatus?.completedAt);
  const inProgressCount = activeQuests.filter((q: Quest) => QuestManager.isBeingCompleted(q)).length;

  const handleCompleteAll = async () => {
    await QuestManager.manualCompleteAll();
    refresh();
  };

  const handleStopAll = () => {
    QuestManager.stopAll();
    refresh();
  };

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div style={{ padding: SPACING.lg }}>
      {/* Mode Indicator */}
      <ModeIndicator />

      {/* Quick Stats - UX: Information at a glance */}
      {inProgressCount > 0 && (
        <div style={{
          padding: SPACING.md,
          borderRadius: "8px",
          backgroundColor: `${COLORS.inProgress}15`,
          border: `1px solid ${COLORS.inProgress}30`,
          marginBottom: SPACING.lg,
          display: "flex",
          alignItems: "center",
          gap: SPACING.sm
        }}>
          <span style={{ fontSize: "20px" }}>⚡</span>
          <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>
            {inProgressCount} quest{inProgressCount > 1 ? "s" : ""} completing...
          </span>
        </div>
      )}

      {/* Action Buttons - UX: Fitts's Law - Large, spaced targets */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: SPACING.sm,
        marginBottom: SPACING.lg
      }}>
        <ActionButton onClick={handleCompleteAll} variant="success" fullWidth>
          ▶ Complete All
        </ActionButton>
        <ActionButton onClick={handleStopAll} variant="danger" fullWidth>
          ⏹ Stop All
        </ActionButton>
      </div>

      {/* Active Quests - UX: Zeigarnik Effect - Incomplete tasks prominent */}
      <SectionHeader title="Active Quests" count={activeQuests.length} />
      {activeQuests.length === 0 ? (
        <EmptyState message="No active quests available" />
      ) : (
        activeQuests.map((quest: Quest) => (
          <QuestCard key={quest.id} quest={quest} onRefresh={refresh} />
        ))
      )}

      {/* Completed Quests - Collapsible */}
      {completedQuests.length > 0 && (
        <div style={{ marginTop: SPACING.lg }}>
          <SectionHeader
            title="Completed"
            count={completedQuests.length}
            collapsible={true}
            defaultOpen={false}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Toolbar Button Component
 * UX: Von Restorff Effect - Badge draws attention to pending quests
 */
export function QuestToolbarButton({ onClick }: { onClick: () => void }) {
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const update = () => {
      const quests = QuestManager.getQuests();
      const active = quests.filter((q: Quest) =>
        !q.userStatus?.completedAt &&
        new Date(q.config.expiresAt).getTime() > Date.now()
      ).length;

      if (active > count) setPulse(true);
      setCount(active);
      setTimeout(() => setPulse(false), 500);
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [count]);

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        cursor: "pointer",
        padding: "6px 10px",
        borderRadius: "4px",
        backgroundColor: "var(--background-modifier-hover)",
        transition: "all 0.15s ease",
        transform: pulse ? "scale(1.1)" : "scale(1)"
      }}
      title="OttoQuest - Click to manage quests"
    >
      <span role="img" aria-label="quest" style={{ fontSize: "16px" }}>🎯</span>
      {count > 0 && (
        <span style={{
          position: "absolute",
          top: "-4px",
          right: "-4px",
          backgroundColor: COLORS.danger,
          color: COLORS.textOnColor,
          fontSize: "10px",
          fontWeight: 700,
          padding: "2px 6px",
          borderRadius: "10px",
          minWidth: "14px",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

export default {
  ControlPanel,
  QuestToolbarButton
};
