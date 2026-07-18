import React, { useMemo, useState, useRef, useEffect } from "react";
import { Breadcrumb, Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";

/**
 * Breadcrumb com colapso automático em hierarquias profundas.
 * Mantém início + fim visíveis; o meio fica em um menu "…".
 *
 * @param {{
 *   items?: Array<{ label: string, to?: string, active?: boolean }>,
 *   maxVisible?: number
 * }} props
 */
export default function AppBreadcrumb({ items = [], maxVisible = 5 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const overflowRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDocClick = (e) => {
      if (!overflowRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const { head, overflow, tail } = useMemo(() => {
    if (items.length <= maxVisible) {
      return { head: items, overflow: [], tail: [] };
    }
    const keepTail = 2;
    const keepHead = 1;
    return {
      head: items.slice(0, keepHead),
      overflow: items.slice(keepHead, -keepTail),
      tail: items.slice(-keepTail),
    };
  }, [items, maxVisible]);

  if (!items.length) return null;

  const renderItem = (item, key, { forceActive = false } = {}) => {
    const isCurrent = Boolean(forceActive || item.active);
    const showAsLink = Boolean(item.to) && !isCurrent;

    return (
      <Breadcrumb.Item
        key={key}
        active={isCurrent}
        linkAs={showAsLink ? Link : undefined}
        linkProps={showAsLink ? { to: item.to } : undefined}
        title={item.label}
      >
        <span className="app-breadcrumb__label">{item.label}</span>
      </Breadcrumb.Item>
    );
  };

  return (
    <nav className="app-breadcrumb" aria-label="Breadcrumb">
      <Breadcrumb>
        {head.map((item, index) =>
          renderItem(item, `head-${item.label}-${index}`, {
            forceActive: overflow.length === 0 && index === head.length - 1,
          })
        )}

        {overflow.length > 0 ? (
          <Breadcrumb.Item className="app-breadcrumb__overflow" active={false}>
            <div className="app-breadcrumb__overflow-wrap" ref={overflowRef}>
              <Dropdown show={menuOpen} onToggle={(next) => setMenuOpen(next)}>
                <Dropdown.Toggle
                  id="breadcrumb-overflow"
                  className="app-breadcrumb__overflow-btn"
                  variant="light"
                  size="sm"
                >
                  …
                </Dropdown.Toggle>
                <Dropdown.Menu
                  align="start"
                  className="app-breadcrumb__overflow-menu"
                >
                  {overflow.map((item) =>
                    item.to ? (
                      <Dropdown.Item
                        key={`${item.label}-${item.to}`}
                        as={Link}
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Dropdown.Item>
                    ) : (
                      <Dropdown.Item key={item.label} active>
                        {item.label}
                      </Dropdown.Item>
                    )
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Breadcrumb.Item>
        ) : null}

        {tail.map((item, index) =>
          renderItem(item, `tail-${item.label}-${index}`, {
            forceActive: index === tail.length - 1,
          })
        )}
      </Breadcrumb>
    </nav>
  );
}
