import { useMemo } from 'react';
import type { Lock } from '../types';

interface LockPanelProps {
  locks: Lock[];
}

interface TreeNode {
  name: string;
  path: string;
  lock?: Lock;
  children: Map<string, TreeNode>;
  implicitlyLocked: boolean;
}

function buildTree(locks: Lock[]): TreeNode {
  const root: TreeNode = {
    name: 'game',
    path: 'game',
    children: new Map(),
    implicitlyLocked: false,
  };

  const pathLocks = locks.filter((l) => l.path);

  for (const lock of pathLocks) {
    const parts = lock.path!.split('.');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: parts.slice(0, i + 1).join('.'),
          children: new Map(),
          implicitlyLocked: false,
        });
      }
      current = current.children.get(part)!;
    }

    current.lock = lock;
    // Mark descendants as implicitly locked
    if (lock.descendants) {
      markImplicit(current);
    }
  }

  return root;
}

function markImplicit(node: TreeNode) {
  for (const child of node.children.values()) {
    if (!child.lock) {
      child.implicitlyLocked = true;
    }
    markImplicit(child);
  }
}

function getLockColorClass(node: TreeNode): string {
  if (node.lock) {
    return node.lock.lock_type === 'exclusive'
      ? 'lock-exclusive'
      : 'lock-shared';
  }
  if (node.implicitlyLocked) return 'lock-implicit';
  return 'lock-available';
}

function TreeNodeView({ node, depth }: { node: TreeNode; depth: number }) {
  const colorClass = getLockColorClass(node);
  const children = Array.from(node.children.values());

  return (
    <div className="lock-tree-node" style={{ paddingLeft: depth * 16 }}>
      <div className={`lock-tree-item ${colorClass}`}>
        <span className="lock-tree-dot" />
        <span className="lock-tree-name">{node.name}</span>
        {node.lock && (
          <span className="lock-tree-agent">
            {node.lock.agent_id.split('-')[0]}
            <span className="lock-tree-type">
              ({node.lock.lock_type})
            </span>
            <LockCountdown lock={node.lock} />
          </span>
        )}
      </div>
      {children.map((child) => (
        <TreeNodeView key={child.path} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function LockCountdown({ lock }: { lock: Lock }) {
  const expiresAt = lock.acquired_at + lock.ttl_ms;
  const remaining = Math.max(0, expiresAt - Date.now());
  const seconds = Math.ceil(remaining / 1000);

  if (seconds <= 0) return <span className="lock-expired">expired</span>;

  return (
    <span className="lock-countdown">
      {seconds}s
    </span>
  );
}

export function LockPanel({ locks }: LockPanelProps) {
  const pathLocks = locks.filter((l) => l.path);
  const categoryLocks = locks.filter((l) => l.category);

  const tree = useMemo(() => buildTree(pathLocks), [pathLocks]);
  const hasChildren = tree.children.size > 0;

  return (
    <div className="lock-panel">
      <div className="panel-header">
        Locks
        <span className="panel-count">{locks.length}</span>
      </div>
      <div className="lock-content">
        {locks.length === 0 ? (
          <div className="panel-empty">No active locks</div>
        ) : (
          <>
            {hasChildren && (
              <div className="lock-section">
                <div className="lock-section-title">Path Locks</div>
                <TreeNodeView node={tree} depth={0} />
              </div>
            )}
            {categoryLocks.length > 0 && (
              <div className="lock-section">
                <div className="lock-section-title">Category Locks</div>
                {categoryLocks.map((lock) => (
                  <div key={lock.id} className="lock-category-item">
                    <span
                      className={`lock-tree-dot ${
                        lock.lock_type === 'exclusive' ? 'lock-exclusive' : 'lock-shared'
                      }`}
                    />
                    <span className="lock-category-name">{lock.category}</span>
                    <span className="lock-tree-agent">
                      {lock.agent_id.split('-')[0]}
                      <span className="lock-tree-type">({lock.lock_type})</span>
                      <LockCountdown lock={lock} />
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="lock-legend">
              <span className="lock-legend-item">
                <span className="lock-tree-dot lock-available" /> Available
              </span>
              <span className="lock-legend-item">
                <span className="lock-tree-dot lock-exclusive" /> Exclusive
              </span>
              <span className="lock-legend-item">
                <span className="lock-tree-dot lock-shared" /> Shared
              </span>
              <span className="lock-legend-item">
                <span className="lock-tree-dot lock-implicit" /> Implicit
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
