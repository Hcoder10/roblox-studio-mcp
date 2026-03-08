import { useCallback, useEffect, useRef, useState } from 'react';
import type { WsEvent } from '../types';

interface StudioPreviewProps {
  lastEvent: WsEvent | null;
}

export function StudioPreview({ lastEvent }: StudioPreviewProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === 'screenshot_update') {
      const data = lastEvent.payload as { url?: string; base64?: string };
      const url = data.url ?? (data.base64 ? `data:image/png;base64,${data.base64}` : null);
      if (url) {
        setScreenshotUrl(url);
      }
    }
  }, [lastEvent]);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const toggleZoom = useCallback(() => {
    setZoomed((prev) => !prev);
  }, []);

  // Close zoom overlay on Escape key
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!zoomed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoomed]);

  return (
    <>
      <div className={`studio-preview ${collapsed ? 'studio-preview-collapsed' : ''}`}>
        <div className="studio-preview-header" onClick={toggleCollapse}>
          <span>Studio Preview</span>
          <span className="studio-preview-toggle">{collapsed ? '\u25B2' : '\u25BC'}</span>
        </div>
        {!collapsed && (
          <div className="studio-preview-body">
            {screenshotUrl ? (
              <img
                src={screenshotUrl}
                alt="Studio screenshot"
                className="studio-preview-img"
                onClick={toggleZoom}
              />
            ) : (
              <div className="studio-preview-placeholder">
                No preview available
              </div>
            )}
          </div>
        )}
      </div>

      {zoomed && screenshotUrl && (
        <div
          ref={overlayRef}
          className="studio-zoom-overlay"
          onClick={toggleZoom}
          role="dialog"
          aria-label="Zoomed studio screenshot"
        >
          <img
            src={screenshotUrl}
            alt="Studio screenshot zoomed"
            className="studio-zoom-img"
          />
        </div>
      )}
    </>
  );
}
