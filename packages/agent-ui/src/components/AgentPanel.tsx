import { useState } from 'react';
import type { Agent, AgentType, Lock } from '../types';

interface AgentPanelProps {
  agents: Agent[];
  locks: Lock[];
}

const AGENT_TYPE_ICONS: Record<AgentType, string> = {
  orchestrator: '\uD83C\uDFAF', // target
  planning: '\uD83D\uDCCB', // clipboard
  building_lead: '\uD83C\uDFD7', // construction
  scripting_lead: '\uD83D\uDCBB', // laptop
  visual_lead: '\uD83C\uDFA8', // palette
  video_analysis: '\uD83D\uDCF9', // camera
  worker_building: '\uD83E\uDDF1', // brick
  worker_scripting: '\u2328', // keyboard
  worker_vfx: '\u2728', // sparkles
  worker_texture: '\uD83D\uDDBC', // frame
};

const STATUS_CLASS: Record<string, string> = {
  idle: 'status-idle',
  thinking: 'status-thinking',
  executing: 'status-executing',
  blocked: 'status-blocked',
  error: 'status-error',
  terminated: 'status-terminated',
};

export function AgentPanel({ agents, locks }: AgentPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function getAgentLockCount(agentId: string): number {
    return locks.filter((l) => l.agent_id === agentId).length;
  }

  return (
    <div className="agent-panel">
      <div className="panel-header">
        Agents
        <span className="panel-count">{agents.length}</span>
      </div>
      <div className="agent-grid">
        {agents.length === 0 && (
          <div className="panel-empty">No agents active</div>
        )}
        {agents.map((agent) => {
          const isExpanded = expandedId === agent.id;
          const lockCount = getAgentLockCount(agent.id);
          return (
            <div
              key={agent.id}
              className={`agent-card ${isExpanded ? 'agent-card-expanded' : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : agent.id)}
            >
              <div className="agent-card-header">
                <span className="agent-icon">
                  {AGENT_TYPE_ICONS[agent.type] ?? '\uD83E\uDD16'}
                </span>
                <span className="agent-name">{agent.id.split('-')[0]}</span>
                <span
                  className={`agent-status-dot ${STATUS_CLASS[agent.status] ?? ''}`}
                  title={agent.status}
                />
              </div>
              <div className="agent-type-badge">{agent.type.replace(/_/g, ' ')}</div>
              <div className="agent-model">{agent.model}</div>
              {agent.current_task && (
                <div className="agent-task" title={agent.current_task}>
                  {agent.current_task.length > 40
                    ? agent.current_task.slice(0, 40) + '...'
                    : agent.current_task}
                </div>
              )}
              <div className="agent-meta">
                {lockCount > 0 && (
                  <span className="agent-lock-count">
                    {lockCount} lock{lockCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {isExpanded && (
                <div className="agent-details">
                  <div className="agent-detail-row">
                    <span className="detail-label">ID</span>
                    <span className="detail-value">{agent.id}</span>
                  </div>
                  <div className="agent-detail-row">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">{agent.status}</span>
                  </div>
                  {agent.error && (
                    <div className="agent-detail-row agent-error">
                      <span className="detail-label">Error</span>
                      <span className="detail-value">{agent.error}</span>
                    </div>
                  )}
                  {agent.active_locks.length > 0 && (
                    <div className="agent-detail-row">
                      <span className="detail-label">Lock IDs</span>
                      <span className="detail-value">
                        {agent.active_locks.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
