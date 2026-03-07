import { useState } from 'react';
import type { ToolCall } from '../types';

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon =
    toolCall.status === 'pending' ? (
      <span className="tool-status tool-status-pending" />
    ) : toolCall.status === 'success' ? (
      <span className="tool-status tool-status-success">&#10003;</span>
    ) : (
      <span className="tool-status tool-status-error">&#10007;</span>
    );

  const borderClass =
    toolCall.status === 'success'
      ? 'tool-card-success'
      : toolCall.status === 'error'
        ? 'tool-card-error'
        : 'tool-card-pending';

  return (
    <div
      className={`tool-call-card ${borderClass}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="tool-call-header">
        {statusIcon}
        <span className="tool-call-name">{toolCall.tool_name}</span>
        {toolCall.duration_ms != null && (
          <span className="tool-call-duration">{toolCall.duration_ms}ms</span>
        )}
        <span className="tool-call-chevron">{expanded ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expanded && (
        <div className="tool-call-body">
          <div className="tool-call-section">
            <div className="tool-call-label">Arguments</div>
            <pre className="tool-call-json">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>
          {toolCall.result !== undefined && (
            <div className="tool-call-section">
              <div className="tool-call-label">Result</div>
              <pre className="tool-call-json">
                {typeof toolCall.result === 'string'
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
