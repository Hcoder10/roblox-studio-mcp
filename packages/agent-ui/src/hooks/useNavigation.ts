import { useState } from 'react';

export type View = 'chat' | 'agents' | 'tasks' | 'locks' | 'studio' | 'live';

export function useNavigation() {
  const [view, setView] = useState<View>('chat');
  return { view, setView };
}
