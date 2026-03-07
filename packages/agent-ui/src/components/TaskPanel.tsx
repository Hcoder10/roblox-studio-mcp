import type { Task, TaskStatus } from '../types';

interface TaskPanelProps {
  tasks: Task[];
}

const COLUMN_STATUSES: { title: string; statuses: TaskStatus[] }[] = [
  { title: 'Pending', statuses: ['pending'] },
  { title: 'In Progress', statuses: ['in_progress'] },
  { title: 'Done', statuses: ['completed', 'failed', 'cancelled'] },
];

const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--accent-red)',
  2: 'var(--accent-yellow)',
  3: 'var(--accent-blue)',
  4: 'var(--text-secondary)',
  5: 'var(--text-secondary)',
};

function getPriorityColor(priority: number): string {
  return PRIORITY_COLORS[priority] ?? 'var(--text-secondary)';
}

export function TaskPanel({ tasks }: TaskPanelProps) {
  return (
    <div className="task-panel">
      <div className="panel-header">
        Tasks
        <span className="panel-count">{tasks.length}</span>
      </div>
      <div className="task-board">
        {COLUMN_STATUSES.map((col) => {
          const colTasks = tasks.filter((t) =>
            col.statuses.includes(t.status),
          );
          return (
            <div key={col.title} className="task-column">
              <div className="task-column-header">
                {col.title}
                <span className="task-column-count">{colTasks.length}</span>
              </div>
              <div className="task-column-body">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`task-card ${task.status === 'failed' ? 'task-card-failed' : ''}`}
                  >
                    <div className="task-card-header">
                      <span
                        className="task-priority-dot"
                        style={{ background: getPriorityColor(task.priority) }}
                        title={`Priority ${task.priority}`}
                      />
                      <span className="task-title" title={task.title}>
                        {task.title.length > 50
                          ? task.title.slice(0, 50) + '...'
                          : task.title}
                      </span>
                    </div>
                    {task.assigned_to && (
                      <div className="task-assigned">
                        {task.assigned_to.split('-')[0]}
                      </div>
                    )}
                    {task.error && (
                      <div className="task-error" title={task.error}>
                        {task.error.length > 60
                          ? task.error.slice(0, 60) + '...'
                          : task.error}
                      </div>
                    )}
                    <div className="task-meta">
                      <span className="task-status-label">{task.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="task-empty">No tasks</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
