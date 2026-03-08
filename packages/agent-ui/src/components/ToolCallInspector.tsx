import { useCallback, useState } from 'react';
import type { ToolCall } from '../types';

interface ToolCallInspectorProps {
  toolCall: ToolCall;
}

export function ToolCallInspector({ toolCall }: ToolCallInspectorProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    }).catch(() => {});
  }, []);

  const statusIcon =
    toolCall.status === 'pending' ? (
      <span className="tool-status tool-status-pending" />
    ) : toolCall.status === 'success' ? (
      <span className="tool-status tool-status-success">{'\u2713'}</span>
    ) : (
      <span className="tool-status tool-status-error">{'\u2717'}</span>
    );

  const borderClass =
    toolCall.status === 'success'
      ? 'tool-card-success'
      : toolCall.status === 'error'
        ? 'tool-card-error'
        : 'tool-card-pending';

  const argsJson = JSON.stringify(toolCall.args, null, 2);
  const resultJson =
    toolCall.result !== undefined
      ? typeof toolCall.result === 'string'
        ? toolCall.result
        : JSON.stringify(toolCall.result, null, 2)
      : null;

  return (
    <div
      className={`tool-call-card ${borderClass}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="tool-call-header">
        {statusIcon}
        <span className="tool-call-name">{toolCall.tool_name}</span>
        {toolCall.duration_ms != null && (
          <span className="tool-call-duration">
            {toolCall.duration_ms < 1000
              ? `${toolCall.duration_ms}ms`
              : `${(toolCall.duration_ms / 1000).toFixed(1)}s`}
          </span>
        )}
        <span className="tool-call-chevron">{expanded ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expanded && (
        <div className="tool-call-body" onClick={(e) => e.stopPropagation()}>
          <div className="tool-call-section">
            <div className="tool-call-label-row">
              <span className="tool-call-label">Arguments</span>
              <button
                className="tool-copy-btn"
                onClick={() => copyToClipboard(argsJson, 'args')}
              >
                {copiedField === 'args' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="tool-call-json">{highlightJson(argsJson)}</pre>
          </div>
          {resultJson != null && (
            <div className="tool-call-section">
              <div className="tool-call-label-row">
                <span className="tool-call-label">Result</span>
                <button
                  className="tool-copy-btn"
                  onClick={() => copyToClipboard(resultJson, 'result')}
                >
                  {copiedField === 'result' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="tool-call-json">{highlightJson(resultJson)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function highlightJson(json: string): React.JSX.Element[] {
  // Simple syntax highlighting for JSON
  return json.split('\n').map((line, i) => {
    const highlighted = line
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
      .replace(/: "(.*?)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="json-bool">$1</span>')
      .replace(/: (null)/g, ': <span class="json-null">$1</span>');

    return (
      <span
        key={i}
        className="json-line"
        dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
      />
    );
  });
}
