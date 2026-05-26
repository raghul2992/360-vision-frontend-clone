import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCameraHealthTimeline,
  clearHealthTimeline,
} from "../../features/cameras/cameraApiSlice";
import { colors, gradients, shadows } from "../../theme";
import { VideoIcon, CloseIcon, ChevronDownIcon, CalendarIcon, ClockIcon, SpinnerIcon, AlertCircleIcon } from "../../icons";

/* ─── constants ──────────────────────────────────────────────────── */
const STATUS_CFG = {
  active: { label: "Active", color: colors.success },
  inactive: { label: "Inactive", color: colors.textDim },
  error: { label: "Error", color: colors.danger },
  processing: { label: "Processing", color: colors.warning },
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


/* ─── Tooltip ────────────────────────────────────────────────────── */
const Tooltip = ({ ev, x, y, visible }) => {
  if (!visible || !ev) return null;
  const cfg = STATUS_CFG[ev.status] || STATUS_CFG.error;
  return (
    <div style={{
      position: "absolute",
      left: Math.min(x + 10, 580),
      top: 40,
      background: colors.panel, border: `1px solid ${colors.border}`,
      borderRadius: 8, padding: "10px 13px", pointerEvents: "none",
      zIndex: 99999, minWidth: 200, maxWidth: 240,
      boxShadow: shadows.tooltip,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {cfg.label}
        </span>
      </div>
      <div style={{ fontSize: 11, color: colors.textDim, lineHeight: 1.8 }}>
        <div>{fmtDT(ev.start)}</div>
        <div style={{ color: colors.textMute }}>→ {fmtDT(ev.end)}</div>
        <div style={{ color: colors.text, fontWeight: 600, marginTop: 3 }}>
          Duration: {fmtDur(ev.duration_seconds)}
        </div>
        {ev.error_message && (
          <div style={{ color: colors.danger, fontSize: 10, marginTop: 2 }}>{ev.error_message}</div>
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
      background: colors.panel, border: `1px solid ${cfg.color}33`,
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
      <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, lineHeight: 1 }}>
        {d.percentage.toFixed(1)}
        <span style={{ fontSize: 13, color: colors.textMute, fontWeight: 400 }}>%</span>
      </div>
      <div style={{ fontSize: 11, color: colors.textDim, marginTop: 3 }}>
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
          <div style={{ flex: 1, background: colors.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, color: colors.textMute }}>No events in this period</span>
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
  const [isRangeOpen, setIsRangeOpen] = useState(false);

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

  /* Close range dropdown on outside click */
  useEffect(() => {
    if (!isRangeOpen) return;
    const handler = () => setIsRangeOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [isRangeOpen]);

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


  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: colors.backdropDark, zIndex: 1000 }}
      />

      {/* Modal panel */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: "min(92vw, 860px)",
        background: colors.panel,
        border: `1px solid ${colors.border}`, borderRadius: 14,
        zIndex: 1001, boxShadow: shadows.healthModal,
        overflow: "visible",
      }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: `1px solid ${colors.bg2}`,
        }}>
          {/* Left: icon + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: gradients.accentSubtle,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <VideoIcon size={16} color={colors.primary} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>Camera health</div>
              <div style={{ fontSize: 11, color: colors.textDim }}>{cameraName}</div>
            </div>
          </div>

          {/* Right: date range filter + close (single line) */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Date range custom dropdown */}
            <div style={{ position: "relative" }}>
              {/* Trigger */}
              <div
                onClick={(e) => { e.stopPropagation(); setIsRangeOpen(prev => !prev); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: colors.surface, border: `1px solid ${colors.border}`,
                  borderRadius: 8, padding: "6px 28px 6px 28px",
                  cursor: "pointer", fontSize: 12, color: colors.text,
                  userSelect: "none", minWidth: 120,
                }}
              >
                <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <CalendarIcon size={13} color={colors.textDim} />
                </div>
                {DATE_RANGES.find(r => r.hours === hours)?.label}
                <div style={{
                  position: "absolute", right: 8, top: "50%",
                  transform: `translateY(-50%) rotate(${isRangeOpen ? "180deg" : "0deg"})`,
                  transition: "transform 0.2s", pointerEvents: "none",
                }}>
                  <ChevronDownIcon size={11} color={colors.textDim} />
                </div>
              </div>

              {/* Options panel */}
              {isRangeOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute", top: "calc(100% + 4px)", right: 0,
                    background: colors.panel, border: `1px solid ${colors.border}`,
                    borderRadius: 10, boxShadow: shadows.dropdown,
                    zIndex: 9999, minWidth: "100%", overflow: "hidden",
                  }}
                >
                  {DATE_RANGES.map(r => (
                    <div
                      key={r.hours}
                      onClick={() => { setHours(r.hours); setIsRangeOpen(false); }}
                      style={{
                        padding: "8px 14px", fontSize: 12, cursor: "pointer",
                        color: r.hours === hours ? colors.primary : colors.text,
                        background: r.hours === hours ? colors.primaryLight : "transparent",
                        fontWeight: r.hours === hours ? 600 : 400,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => { if (r.hours !== hours) e.currentTarget.style.background = colors.bg2; }}
                      onMouseLeave={e => { if (r.hours !== hours) e.currentTarget.style.background = "transparent"; }}
                    >
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 7,
                background: colors.bg2,
                border: `1px solid ${colors.border}`,
                color: colors.textDim, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <CloseIcon size={14} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px 22px", maxHeight: "calc(90vh - 70px)", overflowY: "auto", overflowX: "hidden" }}>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "48px 0", color: colors.textDim }}>
              <SpinnerIcon size={24} color={colors.primary} className="animate-spin" style={{ display: "block", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 13 }}>Loading health data…</div>
            </div>
          )}

          {/* Error */}
          {err && !loading && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <AlertCircleIcon size={28} color={colors.danger} style={{ display: "block", margin: "0 auto 10px" }} />
              <div style={{ fontSize: 13, color: colors.danger, marginBottom: 12 }}>{err}</div>
              <button
                onClick={fetchTimeline}
                style={{
                  background: colors.primary, border: "none", borderRadius: 8,
                  color: colors.panel, fontSize: 12, padding: "8px 16px", cursor: "pointer",
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
                fontSize: 10, fontWeight: 600, color: colors.textDim,
                textTransform: "uppercase", letterSpacing: "0.07em",
                marginBottom: 8, display: "flex", alignItems: "center", gap: 5,
              }}>
                <ClockIcon size={12} color={colors.textDim} />
                <span>Status timeline · {rangeLbl}</span>
              </div>

              {/* Timeline bar */}
              <TimelineBar events={data.events} totalSecs={totalSecs} />

              {/* Time ticks */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                {timeTicks().map((t, i) => (
                  <span key={i} style={{ fontSize: 10, color: colors.textMute }}>{t}</span>
                ))}
              </div>

              {/* Legend */}
              <div style={{
                display: "flex", gap: 14, marginTop: 14,
                paddingTop: 13, borderTop: `1px solid ${colors.bg2}`, flexWrap: "wrap",
              }}>
                {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: colors.textDim }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: cfg.color }} />
                    {cfg.label}
                  </div>
                ))}
              </div>

              {/* Event log */}
              {data.events?.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: colors.textDim,
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
                          background: colors.bg,
                          border: `1px solid ${cfg.color}22`,
                          borderLeft: `3px solid ${cfg.color}`,
                          borderRadius: "0 7px 7px 0",
                          padding: "8px 12px",
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                              <span style={{ fontSize: 11, color: colors.textMute }}>{fmtDur(ev.duration_seconds)}</span>
                            </div>
                            <div style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>
                              {fmtDT(ev.start)} → {fmtDT(ev.end)}
                            </div>
                            {ev.error_message && (
                              <div style={{ fontSize: 10, color: colors.danger, marginTop: 2 }}>{ev.error_message}</div>
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