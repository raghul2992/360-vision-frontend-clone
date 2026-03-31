import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCameraHealthTimeline,
  clearHealthTimeline,
} from "../../features/cameras/cameraApiSlice";

/* ─── constants ──────────────────────────────────────────────────── */
const STATUS_CFG = {
  active: { label: "Active", color: "#22c55e" },
  inactive: { label: "Inactive", color: "#6b7280" },
  error: { label: "Error", color: "#ef4444" },
  processing: { label: "Processing", color: "#f59e0b" },
};

const DATE_RANGES = [
  { label: "Last 1 hour", hours: 1 },
  { label: "Last 6 hours", hours: 6 },
  { label: "Last 24 hours", hours: 24 },
  { label: "Last 7 days", hours: 168 },
];

/* ─── helpers ────────────────────────────────────────────────────── */
const fmtDur = (s) => {
  if (!s) return "0s";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

const fmtDT = (iso) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

const fmtTick = (iso, hours) => {
  const d = new Date(iso);
  return hours > 48
    ? d.toLocaleDateString([], { month: "short", day: "numeric" })
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/* ─── SVG Icons ──────────────────────────────────────────────────── */
const IconCam = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="#3885CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 7l-7 5 7 5V7z" />
    <rect x="1" y="5" width="15" height="14" rx="2" />
  </svg>
);
const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconChev = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconCal = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="#4b5563" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconSpin = () => (
  <>
    <style>{`@keyframes _hs{to{transform:rotate(360deg)}}`}</style>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3885CC" strokeWidth="2"
      style={{ display: "block", margin: "0 auto 12px", animation: "_hs 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  </>
);
const IconAlert = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"
    style={{ display: "block", margin: "0 auto 10px" }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ─── Tooltip ────────────────────────────────────────────────────── */
const Tooltip = ({ ev, x, y, visible }) => {
  if (!visible || !ev) return null;
  const cfg = STATUS_CFG[ev.status] || STATUS_CFG.error;
  return (
    <div style={{
      position: "absolute",
      left: Math.min(x + 10, 580),   // clamp so it never exceeds modal width
      top: 40,
      background: "#1a1b22", border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 8, padding: "10px 13px", pointerEvents: "none",
      zIndex: 99999, minWidth: 200, maxWidth: 240,
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {cfg.label}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.8 }}>
        <div>{fmtDT(ev.start)}</div>
        <div style={{ color: "#6b7280" }}>→ {fmtDT(ev.end)}</div>
        <div style={{ color: "#e5e7eb", fontWeight: 600, marginTop: 3 }}>
          Duration: {fmtDur(ev.duration_seconds)}
        </div>
        {ev.error_message && (
          <div style={{ color: "#ef4444", fontSize: 10, marginTop: 2 }}>{ev.error_message}</div>
        )}
      </div>
    </div>
  );
};
/* ─── StatCard ───────────────────────────────────────────────────── */
const StatCard = ({ status, data }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.error;
  const d = data || { duration_seconds: 0, percentage: 0, count: 0 };
  return (
    <div style={{
      background: "#1e1f27", border: `1px solid ${cfg.color}22`,
      borderRadius: 9, padding: "12px 14px", flex: 1, minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
        <span style={{
          fontSize: 10, fontWeight: 600, color: cfg.color,
          textTransform: "uppercase", letterSpacing: "0.07em"
        }}>
          {cfg.label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#f9fafb", lineHeight: 1 }}>
        {d.percentage.toFixed(1)}
        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 400 }}>%</span>
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
        {fmtDur(d.duration_seconds)}
        {d.count > 0 && <span style={{ marginLeft: 4 }}>· {d.count} evt</span>}
      </div>
    </div>
  );
};

/* ─── TimelineBar ────────────────────────────────────────────────── */
const TimelineBar = ({ events, totalSecs }) => {
  const [tooltip, setTooltip] = useState({ visible: false, ev: null, x: 0, y: 0 });
  const barRef = React.useRef(null);

  const handleMouseMove = (e, ev) => {
    const rect = barRef.current.getBoundingClientRect();
    setTooltip({
      visible: true,
      ev,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={barRef}
        style={{ height: 34, borderRadius: 6, display: "flex", cursor: "crosshair", overflow: "hidden" }}
        onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
      >
        {(events || []).map((ev, i) => {
          const pct = Math.max((ev.duration_seconds / totalSecs) * 100, 0.15);
          const cfg = STATUS_CFG[ev.status] || STATUS_CFG.error;
          return (
            <div
              key={i}
              style={{ width: `${pct.toFixed(2)}%`, height: "100%", background: cfg.color, flexShrink: 0 }}
              onMouseMove={e => handleMouseMove(e, ev)}
            />
          );
        })}
        {(!events || events.length === 0) && (
          <div style={{ flex: 1, background: "#1e1f27", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, color: "#4b5563" }}>No events in this period</span>
          </div>
        )}
      </div>
      <Tooltip {...tooltip} />
    </div>
  );
};
/* ─── CameraHealthModal ──────────────────────────────────────────── */
/**
 * Props:
 *   isOpen     {boolean}   – controls visibility
 *   onClose    {function}  – called when modal closes
 *   cameraId   {number}    – the specific camera's id (from edit-camera page)
 *   cameraName {string}    – display name shown in header
 *   tenantId   {number}    – from localStorage("tenant_id")
 */
const CameraHealthModal = ({ isOpen, onClose, cameraId, cameraName = "Camera", tenantId }) => {
  const dispatch = useDispatch();
  const { healthTimeline, healthTimelineLoading, healthTimelineError } = useSelector(
    state => state.cameraApi
  );

  const [hours, setHours] = useState(24);

  /* Build date params from selected hours range and dispatch */
  const fetchTimeline = useCallback(() => {
    if (!cameraId || !tenantId) return;
    const now = new Date();
    const from = new Date(now.getTime() - hours * 3600 * 1000);

    // Send plain date strings — YYYY-MM-DD only
    const toDate = str => str.toISOString().split('T')[0];

    dispatch(
      getCameraHealthTimeline({
        tenantId,
        cameraId,
        dateFrom: toDate(from),
        dateTo: toDate(now),
      })
    );
  }, [dispatch, cameraId, tenantId, hours]);

  /* Fetch on open or when hours filter changes */
  useEffect(() => {
    if (isOpen) fetchTimeline();
  }, [isOpen, fetchTimeline]);

  /* Clear Redux health state when modal closes */
  useEffect(() => {
    if (!isOpen) dispatch(clearHealthTimeline());
  }, [isOpen, dispatch]);

  /* Escape key to close */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /* Derived display data */
  const data = healthTimeline;
  const loading = healthTimelineLoading;
  const err = healthTimelineError;
  const sumMap = {};
  (data?.summary || []).forEach(s => (sumMap[s.status] = s));
  const totalSecs = data?.total_duration_seconds || 1;
  const rangeLbl = DATE_RANGES.find(r => r.hours === hours)?.label || "";

  const timeTicks = () => {
    if (!data) return [];
    const from = new Date(data.date_from), to = new Date(data.date_to);
    const N = hours <= 6 ? 4 : hours <= 24 ? 6 : 6;
    return Array.from({ length: N + 1 }, (_, i) => {
      const t = new Date(from.getTime() + (i / N) * (to - from));
      return fmtTick(t.toISOString(), hours);
    });
  };

  const selStyle = {
    appearance: "none", background: "#1e1f27",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
    color: "#d1d5db", fontSize: 12,
    padding: "6px 28px 6px 28px",
    cursor: "pointer", outline: "none", fontFamily: "inherit",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000 }}
      />

      {/* Modal panel */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: "min(92vw, 860px)",
        background: "#2a2b36",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14,
        zIndex: 1001, boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        overflow: "visible",
      }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* Left: icon + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(56,133,204,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <IconCam />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f9fafb" }}>Camera health</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{cameraName}</div>
            </div>
          </div>

          {/* Right: date range filter + close (single line) */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Date range dropdown */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <IconCal />
              </div>
              <select value={hours} onChange={e => setHours(+e.target.value)} style={selStyle}>
                {DATE_RANGES.map(r => (
                  <option key={r.hours} value={r.hours}>{r.label}</option>
                ))}
              </select>
              <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <IconChev />
              </div>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 7,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#9ca3af", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <IconClose />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px 22px", maxHeight: "calc(90vh - 70px)", overflowY: "auto", overflowX: "hidden" }}>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#6b7280" }}>
              <IconSpin />
              <div style={{ fontSize: 13 }}>Loading health data…</div>
            </div>
          )}

          {/* Error */}
          {err && !loading && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <IconAlert />
              <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>{err}</div>
              <button
                onClick={fetchTimeline}
                style={{
                  background: "#3885CC", border: "none", borderRadius: 8,
                  color: "#fff", fontSize: 12, padding: "8px 16px", cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Data */}
          {!loading && !err && data && (
            <>
              {/* Stat cards */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))",
                gap: 10, marginBottom: 20,
              }}>
                {["active", "inactive", "processing", "error"].map(st => (
                  <StatCard key={st} status={st} data={sumMap[st]} />
                ))}
              </div>

              {/* Timeline label */}
              <div style={{
                fontSize: 10, fontWeight: 600, color: "#4b5563",
                textTransform: "uppercase", letterSpacing: "0.07em",
                marginBottom: 8, display: "flex", alignItems: "center", gap: 5,
              }}>
                <IconClock />
                <span>Status timeline · {rangeLbl}</span>
              </div>

              {/* Timeline bar */}
              <TimelineBar events={data.events} totalSecs={totalSecs} />

              {/* Time ticks */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                {timeTicks().map((t, i) => (
                  <span key={i} style={{ fontSize: 10, color: "#4b5563" }}>{t}</span>
                ))}
              </div>

              {/* Legend */}
              <div style={{
                display: "flex", gap: 14, marginTop: 14,
                paddingTop: 13, borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap",
              }}>
                {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: cfg.color }} />
                    {cfg.label}
                  </div>
                ))}
              </div>

              {/* Event log */}
              {data.events?.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: "#4b5563",
                    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
                  }}>
                    Event log
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, }}>
                    {data.events.map((ev, i) => {
                      const cfg = STATUS_CFG[ev.status] || STATUS_CFG.error;
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          background: "#1e1f27",
                          border: `1px solid ${cfg.color}1a`,
                          borderLeft: `3px solid ${cfg.color}`,
                          borderRadius: "0 7px 7px 0",
                          padding: "8px 12px",
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                              <span style={{ fontSize: 11, color: "#4b5563" }}>{fmtDur(ev.duration_seconds)}</span>
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                              {fmtDT(ev.start)} → {fmtDT(ev.end)}
                            </div>
                            {ev.error_message && (
                              <div style={{ fontSize: 10, color: "#ef4444", marginTop: 2 }}>{ev.error_message}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CameraHealthModal;