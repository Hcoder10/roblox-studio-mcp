import { useMemo } from 'react';
import type { Agent, AgentAction, AgentType } from '../types';

interface AgentTimelineProps {
  agents: Agent[];
  actions: AgentAction[];
}

const TYPE_COLORS: Record<AgentType, string> = {
  orchestrator: 'var(--accent-orchestrator)',
  planning: 'var(--accent-planning)',
  building_lead: 'var(--accent-building)',
  scripting_lead: 'var(--accent-scripting)',
  visual_lead: 'var(--accent-visual)',
  video_analysis: 'var(--accent-visual)',
  worker_building: 'var(--accent-building)',
  worker_scripting: 'var(--accent-scripting)',
  worker_vfx: 'var(--accent-visual)',
  worker_texture: 'var(--accent-texture)',
  testing: 'var(--accent-testing)',
  texture_generator: 'var(--accent-texture)',
};

const STATUS_COLORS: Record<string, string> = {
  idle: 'var(--text-secondary)',
  thinking: 'var(--accent-scripting)',
  executing: 'var(--success)',
  blocked: 'var(--warning)',
  error: 'var(--error)',
  terminated: 'var(--text-secondary)',
};

export function AgentTimeline({ agents, actions }: AgentTimelineProps) {
  const timeRange = useMemo(() => {
    if (actions.length === 0) return { start: Date.now() - 60000, end: Date.now() };
    const timestamps = actions.map((a) => a.timestamp);
    const start = Math.min(...timestamps);
    const end = Math.max(...timestamps, Date.now());
    return { start, end: Math.max(end, start + 10000) };
  }, [actions]);

  const agentActions = useMemo(() => {
    const map = new Map<string, AgentAction[]>();
    for (const action of actions) {
      const list = map.get(action.agent_id) ?? [];
      list.push(action);
      map.set(action.agent_id, list);
    }
    return map;
  }, [actions]);

  const duration = timeRange.end - timeRange.start;

  return (
    <div className="timeline">
      <div className="panel-header">Timeline</div>
      <div className="timeline-body">
        {agents.length === 0 && (
          <div className="panel-empty">No agents to display</div>
        )}
        {agents.map((agent) => {
          const agentActs = agentActions.get(agent.id) ?? [];
          const color = TYPE_COLORS[agent.type] ?? 'var(--text-secondary)';
          const statusColor = STATUS_COLORS[agent.status] ?? STATUS_COLORS.idle;

          return (
            <div key={agent.id} className="timeline-row">
              <div className="timeline-label">
                <span
                  className="timeline-agent-dot"
                  style={{ background: statusColor }}
                />
                <span className="timeline-agent-name">
                  {agent.id.split('-')[0]}
                </span>
              </div>
              <div className="timeline-track">
                <div
                  className="timeline-bar"
                  style={{
                    background: `${color}33`,
                    borderLeft: `2px solid ${color}`,
                  }}
                />
                {agentActs.map((act) => {
                  const left = ((act.timestamp - timeRange.start) / duration) * 100;
                  return (
                    <div
                      key={act.id}
                      className={`timeline-marker timeline-marker-${act.status}`}
                      style={{
                        left: `${Math.min(Math.max(left, 0), 100)}%`,
                        background: act.status === 'error' ? 'var(--error)' : color,
                      }}
                      title={`${act.tool_name ?? act.action} (${act.status})`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
