import { useCallback, useEffect, useRef, useState } from 'react';
import type { AgentType, ChatMessage } from '../types';
import { ToolCallCard } from './ToolCallCard';

interface ChatPanelProps {
  messages: ChatMessage[];
  thinkingAgents: Set<string>;
  onSend: (content: string) => void;
  agents: Map<string, { type: AgentType }>;
}

const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  orchestrator: 'Orchestrator',
  planning: 'Planning',
  building_lead: 'Build Lead',
  scripting_lead: 'Script Lead',
  visual_lead: 'Visual Lead',
  video_analysis: 'Video',
  worker_building: 'Builder',
  worker_scripting: 'Scripter',
  worker_vfx: 'VFX',
  worker_texture: 'Texture',
};

function renderMarkdown(text: string): React.JSX.Element[] {
  const lines = text.split('\n');
  const elements: React.JSX.Element[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="chat-code-block">
            <code>{codeLines.join('\n')}</code>
          </pre>,
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
        void codeLang; // language hint not used in rendering
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Process inline formatting
    let html = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code class="chat-inline-code">$1</code>');

    // List items
    if (/^[-*]\s/.test(line)) {
      html = `<li>${html.replace(/^[-*]\s/, '')}</li>`;
    } else if (/^\d+\.\s/.test(line)) {
      html = `<li>${html.replace(/^\d+\.\s/, '')}</li>`;
    }

    if (line.trim() === '') {
      elements.push(<br key={`br-${i}`} />);
    } else {
      elements.push(
        <p
          key={`p-${i}`}
          className="chat-line"
          dangerouslySetInnerHTML={{ __html: html }}
        />,
      );
    }
  }

  // Close unclosed code block
  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre key="code-end" className="chat-code-block">
        <code>{codeLines.join('\n')}</code>
      </pre>,
    );
  }

  return elements;
}

export function ChatPanel({
  messages,
  thinkingAgents,
  onSend,
  agents,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingAgents.size]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      // Auto-resize
      const ta = e.target;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
    },
    [],
  );

  function getAgentLabel(msg: ChatMessage): string {
    const agentType = msg.agent_type ?? agents.get(msg.agent_id ?? '')?.type;
    if (agentType) return AGENT_TYPE_LABELS[agentType] ?? agentType;
    return msg.agent_id ?? 'Agent';
  }

  return (
    <div className="chat-panel">
      <div className="panel-header">Chat</div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message chat-message-${msg.role}`}>
            {msg.role === 'agent' && (
              <div className="chat-agent-header">
                <span className="chat-agent-name">
                  {msg.agent_id?.split('-')[0] ?? 'Agent'}
                </span>
                <span className="chat-agent-badge">{getAgentLabel(msg)}</span>
              </div>
            )}
            {msg.role === 'system' ? (
              <div className="chat-system-text">{msg.content}</div>
            ) : (
              <div className="chat-bubble">
                {msg.content && (
                  <div className="chat-content">
                    {renderMarkdown(msg.content)}
                  </div>
                )}
                {msg.tool_calls && msg.tool_calls.length > 0 && (
                  <div className="chat-tool-calls">
                    {msg.tool_calls.map((tc) => (
                      <ToolCallCard key={tc.id} toolCall={tc} />
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="chat-timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {Array.from(thinkingAgents).map((agentId) => (
          <div key={`thinking-${agentId}`} className="chat-message chat-message-agent">
            <div className="chat-agent-header">
              <span className="chat-agent-name">{agentId.split('-')[0]}</span>
            </div>
            <div className="chat-bubble">
              <div className="typing-indicator">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Ctrl+Enter to send)"
          rows={1}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
