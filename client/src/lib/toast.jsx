/**
 * toast.jsx
 * Lightweight, zero-dependency professional toast notification system.
 * Usage:
 *   import { useToast } from '../lib/toast';
 *   const toast = useToast();
 *   toast.success('Saved!');
 *   toast.error('Something went wrong');
 *   toast.info('FYI…');
 *   toast.warning('Be careful');
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
} from 'react';

// ─── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ─── Reducer ───────────────────────────────────────────────────────────────────
let _uid = 0;
function reducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [action.toast, ...state].slice(0, 5); // max 5 visible
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    dispatch({ type: 'REMOVE', id });
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const show = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++_uid;
      dispatch({ type: 'ADD', toast: { id, message, type } });
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = {
    success: (msg, dur) => show(msg, 'success', dur),
    error:   (msg, dur) => show(msg, 'error', dur ?? 5500),
    info:    (msg, dur) => show(msg, 'info', dur),
    warning: (msg, dur) => show(msg, 'warning', dur),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
const icons = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <circle cx={12} cy={12} r={10} />
      <line x1={15} y1={9} x2={9} y2={15} />
      <line x1={9} y1={9} x2={15} y2={15} />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1={12} y1={9} x2={12} y2={13} />
      <line x1={12} y1={17} x2={12.01} y2={17} />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <circle cx={12} cy={12} r={10} />
      <line x1={12} y1={8} x2={12} y2={12} />
      <line x1={12} y1={16} x2={12.01} y2={16} />
    </svg>
  ),
};

// ─── Colour palette ────────────────────────────────────────────────────────────
const palette = {
  success: {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.45)',
    icon: '#10b981',
    bar: '#10b981',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.45)',
    icon: '#ef4444',
    bar: '#ef4444',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.45)',
    icon: '#f59e0b',
    bar: '#f59e0b',
  },
  info: {
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.45)',
    icon: '#6366f1',
    bar: '#6366f1',
  },
};

// ─── Container ─────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, dismiss }) {
  return (
    <>
      <style>{`
        @keyframes _toast_slide_in {
          from { opacity: 0; transform: translateX(110%) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
        @keyframes _toast_progress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
        ._toast_wrap {
          animation: _toast_slide_in 0.32s cubic-bezier(0.16,1,0.3,1) both;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12);
          cursor: pointer;
          min-width: 280px;
          max-width: 380px;
          transition: opacity 0.2s, box-shadow 0.2s;
          font-family: -apple-system, 'Inter', sans-serif;
        }
        ._toast_wrap:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.28); }
        ._toast_progress_bar {
          position: absolute;
          bottom: 0; left: 0; height: 3px;
          border-radius: 0 0 12px 12px;
          animation: _toast_progress linear both;
        }
        ._toast_close {
          background: none; border: none; cursor: pointer;
          padding: 0; margin-left: auto; opacity: 0.45;
          line-height: 1; flex-shrink: 0;
          transition: opacity 0.15s;
          display: flex; align-items: center;
        }
        ._toast_close:hover { opacity: 0.9; }
      `}</style>

      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {[...toasts].reverse().map((t) => {
          const p = palette[t.type] || palette.info;
          // Durations: success/info=4s, error=5.5s, warning=4s
          const dur = t.type === 'error' ? 5500 : 4000;
          return (
            <div
              key={t.id}
              className="_toast_wrap"
              onClick={() => dismiss(t.id)}
              style={{
                background: p.bg,
                borderColor: p.border,
                color: 'var(--toast-text, #f1f5f9)',
                pointerEvents: 'auto',
              }}
              role="alert"
              aria-live="assertive"
            >
              {/* Icon */}
              <span style={{ color: p.icon, marginTop: 1 }}>{icons[t.type]}</span>

              {/* Message */}
              <span style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.45, flex: 1 }}>
                {t.message}
              </span>

              {/* Close button */}
              <button className="_toast_close" aria-label="Dismiss" style={{ color: 'currentColor' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ width: 14, height: 14 }}>
                  <line x1={18} y1={6} x2={6} y2={18} />
                  <line x1={6} y1={6} x2={18} y2={18} />
                </svg>
              </button>

              {/* Progress bar */}
              <div
                className="_toast_progress_bar"
                style={{
                  background: p.bar,
                  animationDuration: `${dur}ms`,
                }}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
