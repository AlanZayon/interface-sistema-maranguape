import React from "react";

/**
 * Drag handle on a panel's vertical edge to resize horizontally.
 *
 * @param {{
 *   edge?: 'left' | 'right',
 *   onResizeStart: (e: React.PointerEvent) => void,
 *   onAdjust?: (delta: number) => void,
 *   label?: string,
 *   className?: string,
 * }} props
 */
export default function PanelResizeHandle({
  edge = "right",
  onResizeStart,
  onAdjust,
  label = "Redimensionar painel",
  className = "",
}) {
  return (
    <div
      className={`panel-resize-handle panel-resize-handle--${edge}${
        className ? ` ${className}` : ""
      }`}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onResizeStart}
      onKeyDown={(e) => {
        if (!onAdjust) return;
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const step = e.shiftKey ? 24 : 12;
        if (e.key === "ArrowRight") {
          onAdjust(edge === "right" ? step : -step);
        } else {
          onAdjust(edge === "right" ? -step : step);
        }
      }}
    />
  );
}
