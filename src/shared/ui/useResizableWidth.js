import { useCallback, useEffect, useRef, useState } from "react";

function readStoredWidth(storageKey, fallback) {
  if (!storageKey) return fallback;
  try {
    const raw = localStorage.getItem(storageKey);
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    /* ignore */
  }
  return fallback;
}

/**
 * Horizontal panel width with drag handle + optional localStorage persistence.
 *
 * @param {{
 *   defaultWidth?: number,
 *   minWidth?: number,
 *   maxWidth?: number,
 *   storageKey?: string | null,
 *   edge?: 'left' | 'right',
 * }} options
 */
export function useResizableWidth({
  defaultWidth = 280,
  minWidth = 180,
  maxWidth = 560,
  storageKey = null,
  edge = "right",
} = {}) {
  const [width, setWidth] = useState(() =>
    readStoredWidth(storageKey, defaultWidth)
  );
  const dragRef = useRef(null);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, String(Math.round(width)));
    } catch {
      /* ignore */
    }
  }, [width, storageKey]);

  const clamp = useCallback(
    (value) => Math.min(maxWidth, Math.max(minWidth, value)),
    [minWidth, maxWidth]
  );

  const adjustWidth = useCallback(
    (delta) => {
      setWidth((w) => clamp(w + delta));
    },
    [clamp]
  );

  const onResizeStart = useCallback(
    (event) => {
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;
      dragRef.current = { startX, startWidth };

      const onMove = (e) => {
        if (!dragRef.current) return;
        const delta = e.clientX - dragRef.current.startX;
        const next =
          edge === "right"
            ? dragRef.current.startWidth + delta
            : dragRef.current.startWidth - delta;
        setWidth(clamp(next));
      };

      const onUp = () => {
        dragRef.current = null;
        document.body.classList.remove("is-panel-resizing");
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      document.body.classList.add("is-panel-resizing");
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [width, edge, clamp]
  );

  return { width, setWidth, adjustWidth, onResizeStart, minWidth, maxWidth };
}

export default useResizableWidth;
