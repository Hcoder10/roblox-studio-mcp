import { useState } from 'react';
import type { Agent, AgentType, Lock } from '../types';

interface AgentPanelProps {
  agents: Agent[];
  locks: Lock[];
}

const AGENT_TYPE_ICONS: Record<AgentType, string> = {
  orchestrator: '\uD83C\uDFAF',
  planning: '\uD83D\uDCCB',
  building_lead: '\uD83C\uDFD7',
  scripting_lead: '\uD83D\uDCBB',
  visual_lead: '\uD83C\uDFA8',
  video_analysis: '\uD83D\uDCF9',
  worker_building: '\uD83E\uDDF1',
  worker_scripting: '\u2328',
  worker_vfx: '\u2728',
  worker_texture: '\uD83D\uDDBC',
  testing: '\uD83E\uDDEA',
  texture_generator: '\uD83C\uDFA8',
};

const AGENT_TYPE_COLORS: Record<AgentType, string> = {
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

export function AgentPanel({ agents, locks }: AgentPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function getAgentLocks(agentId: string): Lock[] {
    return locks.filter((l) => l.agent_id === agentId);
  }

  return (
    <div className="agent-panel">
      <div className="panel-header">
        Agents
        <span className="panel-count">{agents.length}</span>
        <span className="panel-count agent-active-count">
          {agents.filter((a) => a.status === 'executing' || a.status === 'thinking').length} active
        </span>
      </div>
      <div className="agent-grid">
        {agents.length === 0 && (
          <div className="panel-empty">No agents active</div>
        )}
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            locks={getAgentLocks(agent.id)}
            expanded={expandedId === agent.id}
            onToggle={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
            borderColor={AGENT_TYPE_COLORS[agent.type] ?? 'var(--border)'}
          />
        ))}
      </div>
    </div>
  );
}

interface AgentCardProps {
  agent: Agent;
  locks: Lock[];
  expanded: boolean;
  onToggle: () => void;
  borderColor: string;
}

function AgentCard({ agent, locks, expanded, onToggle, borderColor }: AgentCardProps) {
  const icon = AGENT_TYPE_ICONS[agent.type] ?? '\uD83E\uDD16';

  return (
    <div
      className={`agent-card ${expanded ? 'agent-card-expanded' : ''}`}
      style={{ borderLeftColor: borderColor }}
      onClick={onToggle}
    >
      <div className="agent-card-header">
        <span className="agent-icon">{icon}</span>
        <span className="agent-name">{agent.id?.split('-')[0] ?? 'unknown'}</span>
        <AgentStatusIndicator status={agent.status} />
      </div>
      <div className="agent-type-badge" style={{ color: borderColor }}>
        {agent.type.replace(/_/g, ' ')}
      </div>
      <div className="agent-model">{agent.model}</div>
      {agent.current_task && (
        <div className="agent-task" title={agent.current_task}>
          {agent.current_task.length > 50
            ? agent.current_task.slice(0, 50) + '...'
            : agent.current_task}
        </div>
      )}
      <div className="agent-meta">
        {locks.length > 0 && (
          <span className="agent-lock-count">
            {locks.length} lock{locks.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Agent-type-specific content */}
      {expanded && (
        <div className="agent-details">
          <AgentTypeContent agent={agent} locks={locks} />
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
          {locks.length > 0 && (
            <div className="agent-detail-row">
              <span className="detail-label">Locks</span>
              <span className="detail-value">
                {locks.map((l) => l.path ?? l.category ?? l.id).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentStatusIndicator({ status }: { status: Agent['status'] }) {
  const indicators: Record<string, { className: string; label: string }> = {
    idle: { className: 'status-idle', label: 'Idle' },
    thinking: { className: 'status-thinking', label: 'Thinking' },
    executing: { className: 'status-executing', label: 'Executing' },
    blocked: { className: 'status-blocked', label: 'Blocked' },
    error: { className: 'status-error', label: 'Error' },
    terminated: { className: 'status-terminated', label: 'Terminated' },
  };
  const info = indicators[status] ?? indicators.idle;

  return (
    <span className={`agent-status-indicator ${info!.className}`} title={info!.label}>
      {status === 'executing' && <span className="status-spinner" />}
      {status === 'thinking' && <span className="status-pulse" />}
      {status !== 'executing' && status !== 'thinking' && (
        <span className="agent-status-dot" />
      )}
    </span>
  );
}

function AgentTypeContent({ agent, locks: _locks }: { agent: Agent; locks: Lock[] }) {
  switch (agent.type) {
    case 'building_lead':
    case 'worker_building':
      return (
        <div className="agent-type-content building-content">
          <div className="agent-type-label">Building Agent</div>
          {agent.current_task && (
            <div className="agent-action-preview">{agent.current_task}</div>
          )}
        </div>
      );
    case 'scripting_lead':
    case 'worker_scripting':
      return (
        <div className="agent-type-content scripting-content">
          <div className="agent-type-label">Scripting Agent</div>
          {agent.current_task && (
            <div className="agent-action-preview code-preview">{agent.current_task}</div>
          )}
        </div>
      );
    case 'visual_lead':
    case 'worker_vfx':
      return (
        <div className="agent-type-content visual-content">
          <div className="agent-type-label">Visual Agent</div>
        </div>
      );
    case 'testing':
      return (
        <div className="agent-type-content testing-content">
          <div className="agent-type-label">Testing Agent</div>
        </div>
      );
    case 'texture_generator':
    case 'worker_texture':
      return (
        <div className="agent-type-content texture-content">
          <div className="agent-type-label">Texture Agent</div>
        </div>
      );
    default:
      return null;
  }
}
