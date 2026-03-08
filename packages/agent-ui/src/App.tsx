import { useMemo } from 'react';
import { AgentActivityFeed } from './components/AgentActivityFeed';
import { AgentPanel } from './components/AgentPanel';
import { AgentTimeline } from './components/AgentTimeline';
import { BuildProgress } from './components/BuildProgress';
import { ChatPanel } from './components/ChatPanel';
import { GeminiLivePanel } from './components/GeminiLivePanel';
import { LockPanel } from './components/LockPanel';
import { StudioPreview } from './components/StudioPreview';
import { TaskPanel } from './components/TaskPanel';
import { useAgentActions } from './hooks/useAgentActions';
import { useAgents } from './hooks/useAgents';
import { useChat } from './hooks/useChat';
import { useGeminiLive } from './hooks/useGeminiLive';
import { useLocks } from './hooks/useLocks';
import { useNavigation, type View } from './hooks/useNavigation';
import { useTasks } from './hooks/useTasks';
import { useWebSocket } from './hooks/useWebSocket';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const LIVE_WS_URL = import.meta.env.VITE_LIVE_WS_URL || 'ws://localhost:3001/live';

const NAV_ITEMS: { view: View; label: string; icon: string }[] = [
  { view: 'chat', label: 'Chat', icon: '\uD83D\uDCAC' },
  { view: 'agents', label: 'Agents', icon: '\uD83E\uDD16' },
  { view: 'tasks', label: 'Tasks', icon: '\uD83D\uDCCB' },
  { view: 'locks', label: 'Locks', icon: '\uD83D\uDD12' },
  { view: 'studio', label: 'Studio', icon: '\uD83D\uDCF8' },
  { view: 'live', label: 'Live', icon: '\uD83C\uDF99' },
];

export function App() {
  const { connected, send, lastEvent } = useWebSocket(WS_URL);
  const { agents } = useAgents(lastEvent);
  const { tasks } = useTasks(lastEvent);
  const { locks } = useLocks(lastEvent);
  const { messages, thinkingAgents, sendUserMessage } = useChat(lastEvent, send);
  const { actions } = useAgentActions(lastEvent);
  const { view, setView } = useNavigation();
  const {
    isLive,
    isListening,
    isSpeaking,
    transcript,
    startLive,
    stopLive,
    sendText,
    getAnalyser,
  } = useGeminiLive(LIVE_WS_URL);

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
        <div className="app-header-right">
          <BuildProgress tasks={tasks} agents={agents} actions={actions} />
          <div className="app-status">
            {isLive && <span className="live-indicator">LIVE</span>}
            <span
              className={`connection-dot ${connected ? 'connection-connected' : 'connection-disconnected'}`}
            />
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar navigation */}
        <nav className="sidebar">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              className={`sidebar-btn ${view === item.view ? 'sidebar-btn-active' : ''}`}
              onClick={() => setView(item.view)}
              title={item.label}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Main content area */}
        <main className="main-content">
          {view === 'chat' && (
            <div className="view-chat">
              <div className="view-chat-main">
                <ChatPanel
                  messages={messages}
                  thinkingAgents={thinkingAgents}
                  onSend={sendUserMessage}
                  agents={agentMap}
                />
              </div>
              <div className="view-chat-sidebar">
                <AgentActivityFeed actions={actions} />
              </div>
            </div>
          )}

          {view === 'agents' && (
            <div className="view-agents">
              <div className="view-agents-grid">
                <AgentPanel agents={agents} locks={locks} />
              </div>
              <div className="view-agents-timeline">
                <AgentTimeline agents={agents} actions={actions} />
              </div>
            </div>
          )}

          {view === 'tasks' && (
            <div className="view-tasks">
              <TaskPanel tasks={tasks} />
            </div>
          )}

          {view === 'locks' && (
            <div className="view-locks">
              <LockPanel locks={locks} />
            </div>
          )}

          {view === 'studio' && (
            <div className="view-studio">
              <StudioPreview lastEvent={lastEvent} />
            </div>
          )}

          {view === 'live' && (
            <div className="view-live">
              <GeminiLivePanel
                isLive={isLive}
                isListening={isListening}
                isSpeaking={isSpeaking}
                transcript={transcript}
                onStart={startLive}
                onStop={stopLive}
                onSendText={sendText}
                getAnalyser={getAnalyser}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
