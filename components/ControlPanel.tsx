/*
 * OttoQuest - UI Components
 * Toolbar button and control panel for manual quest management
 */

import { React } from "@webpack/common";
import { Quest } from "../utils/stores";
import QuestManager from "../core/QuestManager";
import { settings } from "../settings";

const { useState, useEffect } = React;

// Quest status badge colors
const STATUS_COLORS = {
  pending: "#faa61a",    // Orange - awaiting enrollment
  ready: "#43b581",      // Green - ready to complete
  inProgress: "#5865f2", // Blurple - completing
  completed: "#747f8d"   // Gray - done
};

/**
 * Get quest status for display
 */
function getQuestDisplayStatus(quest: Quest): {
  status: string;
  color: string;
  action: string | null;
} {
  if (quest.userStatus?.completedAt) {
    return { status: "Completed", color: STATUS_COLORS.completed, action: null };
  }

  if (QuestManager.isBeingCompleted(quest)) {
    return { status: "In Progress", color: STATUS_COLORS.inProgress, action: "stop" };
  }

  if (!quest.userStatus?.enrolledAt) {
    return { status: "Not Enrolled", color: STATUS_COLORS.pending, action: "enroll" };
  }

  return { status: "Ready", color: STATUS_COLORS.ready, action: "complete" };
}

/**
 * Single quest row in the control panel
 */
function QuestRow({ quest, onRefresh }: { quest: Quest; onRefresh: () => void; }) {
  const [loading, setLoading] = useState(false);
  const { status, color, action } = getQuestDisplayStatus(quest);
  const questType = QuestManager.getQuestType(quest);
  const questName = quest.config.messages.questName;

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
          // TODO: Add stop functionality per quest
          break;
      }
    } finally {
      setLoading(false);
      onRefresh();
    }
  };

  const buttonLabels: Record<string, string> = {
    enroll: "Enroll",
    complete: "Complete",
    stop: "Stop"
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 12px",
      borderRadius: "4px",
      backgroundColor: "var(--background-secondary)",
      marginBottom: "8px"
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, color: "var(--header-primary)" }}>
          {questName}
        </div>
        <div style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          display: "flex",
          gap: "8px",
          marginTop: "4px"
        }}>
          <span style={{
            backgroundColor: color,
            color: "white",
            padding: "2px 6px",
            borderRadius: "3px",
            fontSize: "10px",
            fontWeight: 600
          }}>
            {status}
          </span>
          <span style={{ textTransform: "capitalize" }}>
            {questType}
          </span>
        </div>
      </div>

      {action && (
        <button
          onClick={handleAction}
          disabled={loading}
          style={{
            backgroundColor: "var(--brand-experiment)",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "4px",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
            fontSize: "13px",
            fontWeight: 500
          }}
        >
          {loading ? "..." : buttonLabels[action]}
        </button>
      )}
    </div>
  );
}

/**
 * Main control panel component
 * Shows all quests and allows manual control
 */
export function ControlPanel() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [, forceUpdate] = useState(0);
  const mode = settings.store.completionMode;

  const refresh = () => {
    setQuests(QuestManager.getQuests());
    forceUpdate(n => n + 1);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, []);

  const activeQuests = quests.filter(q => !q.userStatus?.completedAt);
  const completedQuests = quests.filter(q => q.userStatus?.completedAt);

  const handleCompleteAll = async () => {
    await QuestManager.manualCompleteAll();
    refresh();
  };

  const handleStopAll = () => {
    QuestManager.stopAll();
    refresh();
  };

  return (
    <div style={{ padding: "16px" }}>
      {/* Mode indicator */}
      <div style={{
        marginBottom: "16px",
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: mode === "manual" ? "rgba(250, 166, 26, 0.1)" : "rgba(67, 181, 129, 0.1)",
        border: `1px solid ${mode === "manual" ? "#faa61a" : "#43b581"}`
      }}>
        <div style={{
          fontWeight: 600,
          color: mode === "manual" ? "#faa61a" : "#43b581",
          marginBottom: "4px"
        }}>
          {mode === "manual" ? "🎮 Manual Mode" :
            mode === "semi" ? "⚡ Semi-Auto Mode" : "🚀 Full Auto Mode"}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {mode === "manual" ? "Click buttons to enroll and complete quests" :
            mode === "semi" ? "Auto-completes, but asks before enrolling" :
              "Automatically enrolls and completes all quests"}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          onClick={handleCompleteAll}
          style={{
            flex: 1,
            backgroundColor: "#43b581",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          ▶ Complete All
        </button>
        <button
          onClick={handleStopAll}
          style={{
            flex: 1,
            backgroundColor: "#f04747",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          ⏹ Stop All
        </button>
      </div>

      {/* Active quests */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{
          fontWeight: 600,
          marginBottom: "8px",
          color: "var(--header-primary)"
        }}>
          Active Quests ({activeQuests.length})
        </div>
        {activeQuests.length === 0 ? (
          <div style={{
            padding: "20px",
            textAlign: "center",
            color: "var(--text-muted)",
            backgroundColor: "var(--background-secondary)",
            borderRadius: "4px"
          }}>
            No active quests available
          </div>
        ) : (
          activeQuests.map(quest => (
            <QuestRow key={quest.id} quest={quest} onRefresh={refresh} />
          ))
        )}
      </div>

      {/* Completed quests (collapsed) */}
      {completedQuests.length > 0 && (
        <details>
          <summary style={{
            cursor: "pointer",
            fontWeight: 600,
            marginBottom: "8px",
            color: "var(--text-muted)"
          }}>
            Completed Quests ({completedQuests.length})
          </summary>
          {completedQuests.map(quest => (
            <QuestRow key={quest.id} quest={quest} onRefresh={refresh} />
          ))}
        </details>
      )}
    </div>
  );
}

/**
 * Toolbar button for quick access
 * Shows quest count badge
 */
export function QuestToolbarButton({ onClick }: { onClick: () => void; }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => {
      const quests = QuestManager.getQuests();
      const active = quests.filter(q =>
        !q.userStatus?.completedAt &&
        new Date(q.config.expiresAt).getTime() > Date.now()
      ).length;
      setCount(active);
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "4px",
        backgroundColor: "var(--background-modifier-hover)"
      }}
      title="OttoQuest - Click to manage quests"
    >
      <span role="img" aria-label="quest">🎯</span>
      {count > 0 && (
        <span style={{
          position: "absolute",
          top: "-4px",
          right: "-4px",
          backgroundColor: "#f04747",
          color: "white",
          fontSize: "10px",
          fontWeight: 600,
          padding: "2px 5px",
          borderRadius: "10px",
          minWidth: "14px",
          textAlign: "center"
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
