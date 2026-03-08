import { useEffect, useRef } from 'react';
import type { AgentAction, AgentType } from '../types';

interface AgentActivityFeedProps {
  actions: AgentAction[];
}

const TYPE_ICONS: Record<AgentType, string> = {
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

export function AgentActivityFeed({ actions }: AgentActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [actions.length]);

  return (
    <div className="activity-feed">
      <div className="panel-header">
        Activity
        <span className="panel-count">{actions.length}</span>
      </div>
      <div className="activity-feed-body" ref={scrollRef}>
        {actions.length === 0 && (
          <div className="panel-empty">No activity yet</div>
        )}
        {actions.map((action) => (
          <div
            key={action.id}
            className={`activity-item activity-${action.status}`}
          >
            <span className="activity-icon">
              {TYPE_ICONS[action.agent_type] ?? '\uD83E\uDD16'}
            </span>
            <span className="activity-agent">
              {action.agent_id.split('-')[0]}
            </span>
            <span className="activity-arrow">{'\u2192'}</span>
            <span className="activity-action">
              {action.tool_name ?? action.action}
            </span>
            {action.tool_args && Object.keys(action.tool_args).length > 0 && (
              <span className="activity-args">
                ({summarizeArgs(action.tool_args)})
              </span>
            )}
            {action.status === 'completed' && action.duration_ms != null && (
              <span className="activity-duration">{action.duration_ms}ms</span>
            )}
            {action.status === 'error' && (
              <span className="activity-error-badge">ERR</span>
            )}
            <span className="activity-time">
              {new Date(action.timestamp).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function summarizeArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return '';
  const parts: string[] = [];
  for (const [key, value] of entries.slice(0, 3)) {
    const v = typeof value === 'string'
      ? value.length > 30 ? value.slice(0, 30) + '...' : value
      : JSON.stringify(value);
    parts.push(`${key}: ${v}`);
  }
  if (entries.length > 3) parts.push('...');
  return parts.join(', ');
}
