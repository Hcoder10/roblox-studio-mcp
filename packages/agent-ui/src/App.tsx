import { useMemo } from 'react';
import { AgentPanel } from './components/AgentPanel';
import { ChatPanel } from './components/ChatPanel';
import { LockPanel } from './components/LockPanel';
import { StudioPreview } from './components/StudioPreview';
import { TaskPanel } from './components/TaskPanel';
import { useAgents } from './hooks/useAgents';
import { useChat } from './hooks/useChat';
import { useLocks } from './hooks/useLocks';
import { useTasks } from './hooks/useTasks';
import { useWebSocket } from './hooks/useWebSocket';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export function App() {
  const { connected, send, lastEvent } = useWebSocket(WS_URL);
  const { agents } = useAgents(lastEvent);
  const { tasks } = useTasks(lastEvent);
  const { locks } = useLocks(lastEvent);
  const { messages, thinkingAgents, sendUserMessage } = useChat(lastEvent, send);

  const agentMap = useMemo(() => {
    const map = new Map<string, { type: (typeof agents)[number]['type'] }>();
    for (const agent of agents) {
      map.set(agent.id, { type: agent.type });
    }
    return map;
  }, [agents]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">Roblox Studio Agent</div>
        <div className="app-status">
          <span
            className={`connection-dot ${connected ? 'connection-connected' : 'connection-disconnected'}`}
          />
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <main className="app-main">
        <div className="panel-left">
          <ChatPanel
            messages={messages}
            thinkingAgents={thinkingAgents}
            onSend={sendUserMessage}
            agents={agentMap}
          />
        </div>
        <div className="panel-right">
          <div className="panel-right-top">
            <AgentPanel agents={agents} locks={locks} />
          </div>
          <div className="panel-right-middle">
            <TaskPanel tasks={tasks} />
          </div>
          <div className="panel-right-bottom">
            <LockPanel locks={locks} />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <StudioPreview lastEvent={lastEvent} />
      </footer>
    </div>
  );
}
