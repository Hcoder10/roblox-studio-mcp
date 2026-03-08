import type { Agent, AgentAction, Task } from '../types';

interface BuildProgressProps {
  tasks: Task[];
  agents: Agent[];
  actions: AgentAction[];
}

export function BuildProgress({ tasks, agents, actions }: BuildProgressProps) {
  const completedTasks = tasks.filter(
    (t) => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled',
  ).length;
  const totalTasks = tasks.length;
  const activeAgents = agents.filter(
    (a) => a.status === 'executing' || a.status === 'thinking',
  ).length;
  const totalToolCalls = actions.length;
  const errorCount = agents.filter((a) => a.status === 'error').length;

  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Elapsed time from first action
  const firstTimestamp = actions.length > 0
    ? Math.min(...actions.map((a) => a.timestamp))
    : Date.now();
  const elapsed = Date.now() - firstTimestamp;
  const elapsedStr = formatDuration(elapsed);

  return (
    <div className="build-progress">
      <div className="build-progress-circle">
        <svg viewBox="0 0 80 80" className="progress-ring">
          <circle
            className="progress-ring-bg"
            cx="40"
            cy="40"
            r="36"
            fill="none"
            strokeWidth="4"
          />
          <circle
            className="progress-ring-fill"
            cx="40"
            cy="40"
            r="36"
            fill="none"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
          />
        </svg>
        <div className="progress-text">
          <span className="progress-percent">{Math.round(progress)}%</span>
        </div>
      </div>
      <div className="build-stats">
        <div className="build-stat">
          <span className="build-stat-value">{completedTasks}/{totalTasks}</span>
          <span className="build-stat-label">Tasks</span>
        </div>
        <div className="build-stat">
          <span className="build-stat-value">{activeAgents}</span>
          <span className="build-stat-label">Active</span>
        </div>
        <div className="build-stat">
          <span className="build-stat-value">{totalToolCalls}</span>
          <span className="build-stat-label">Calls</span>
        </div>
        {errorCount > 0 && (
          <div className="build-stat build-stat-error">
            <span className="build-stat-value">{errorCount}</span>
            <span className="build-stat-label">Errors</span>
          </div>
        )}
        <div className="build-stat">
          <span className="build-stat-value">{elapsedStr}</span>
          <span className="build-stat-label">Elapsed</span>
        </div>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
