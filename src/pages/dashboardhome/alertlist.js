import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { colors, bgcolors, textcolors, borderstyles, textSizes } from "../../theme";
import { updateAlertAPI } from "../../features/alert/alertSlice";
import { getRois } from "../../features/cameras/roilistslice";
import {
  CloseIcon,
  PhoneIcon,
  ThumbsUpFilledIcon,
  ThumbsUpIcon,
  ThumbsDownFilledIcon,
  ThumbsDownIcon,
  EllipsisIcon,
  ChevronDownIcon,
  FlameIcon,
  WarningIcon,
  PeopleIcon,
  PersonRemoveIcon,
  HardHatIcon,
  GlovesIcon,
  VestIcon,
  SafetyBootIcon,
  GogglesIcon,
  FaceMaskIcon,
} from "../../icons";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "../../utils/datehelper";
import CallPopup from "../../component/CallPopup";

import { toast } from "react-toastify";

const VALIDATION_STATES = {
  FALSE_ALERT: "FALSE_ALERT",
  UNREVIEWED: "UNREVIEWED",
  GENUINE: "GENUINE",
};

const AlertItem = ({ alert, tenantId, timezone, isPopup = false, onClose }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isRead, setIsRead] = useState(
    alert.is_read === true || alert.is_read === "true",
  );
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [callRecipients, setCallRecipients] = useState([]);
  const [isNew, setIsNew] = useState(false);

  const [validationStatus, setValidationStatus] = useState(
    alert.meta?.validation_status || VALIDATION_STATES.UNREVIEWED,
  );
  const { locations = [] } = useSelector((state) => state.locationApi || {});
  const [isUpdating, setIsUpdating] = useState(false);

  const PRIORITY_COLORS = {
    high:   { fill: colors.danger,   bg: "#fff1f1" },
    medium: { fill: colors.warning,   bg: "#fffbeb" },
    low:    { fill: colors.primary,  bg: "#eff6ff" },
  };

  const getPriorityColor = (priority) =>
    PRIORITY_COLORS[priority?.toLowerCase()]?.fill ?? colors.border2;

  const getPriorityBg = (priority) =>
    PRIORITY_COLORS[priority?.toLowerCase()]?.bg ?? colors.bg2;

  const getDetectionIcon = (detectionType, color) => {
    const props = { size: 24, style: { color } };
    switch (detectionType?.toUpperCase()) {
      case "PPE_HELMET_VIOLATION":             return <HardHatIcon {...props} />;
      case "PPE_GLOVES_VIOLATION":             return <GlovesIcon {...props} />;
      case "PPE_VEST_VIOLATION":               return <VestIcon {...props} />;
      case "PPE_SAFETY_SHOE_VIOLATION":        return <SafetyBootIcon {...props} />;
      case "PPE_GOGGLES_VIOLATION":            return <GogglesIcon {...props} />;
      case "PPE_MASK_VIOLATION":               return <FaceMaskIcon {...props} />;
      case "FIRE_SMOKE_DETECTION":             return <FlameIcon {...props} />;
      case "RESTRICTED_AREA_BREACH_DETECTION": return <WarningIcon {...props} />;
      case "CROWD_SURGE":                      return <PeopleIcon {...props} />;
      case "PERSON_QUEUE_DETECTION":           return <PeopleIcon {...props} />;
      case "PERSON_FALL_DETECTION":            return <PersonRemoveIcon {...props} />;
      default:                                 return <WarningIcon {...props} />;
    }
  };



  const renderMessage = () => {
    const msg = getFormattedMessage();
    if (!camera_name || camera_name === "N/A") return <span>{msg}</span>;
    const parts = msg.split(camera_name);
    if (parts.length < 2) return <span>{msg}</span>;
    return (
      <span>
        {parts[0]}
        <span className={`${textcolors.primary} font-medium`}>{camera_name}</span>
        {parts[1]}
      </span>
    );
  };

  // ADD THIS NEW FUNCTION
  const handleValidationStatusChange = async (newStatus) => {
    if (isUpdating) return;

    const previousStatus = validationStatus;
    setIsUpdating(true);

    // Optimistic update
    setValidationStatus(newStatus);

    try {
      await dispatch(
        updateAlertAPI({
          tenantId,
          alertId: alert.id,
          data: {
            meta: {
              ...alert.meta,
              validation_status: newStatus,
            },
          },
        }),
      ).unwrap();

      // toast.success(
      //   t("alerts.up_status_sucess") ||
      //     "Validation status updated successfully",
      // );
    } catch (error) {
      console.error("Failed to update validation status:", error);

      // Revert on error
      setValidationStatus(previousStatus);

      // toast.error(
      //   t("alerts.up_status_failed") || "Failed to update validation status",
      // );
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleExpand = async () => {
    const newExpand = !isExpanded;
    setIsExpanded(newExpand);

    if (!isRead) {
      dispatch(
        updateAlertAPI({
          tenantId,
          alertId: alert.id,
          data: { is_read: "true" },
        }),
      );
      setIsRead(true);
    }
  };

  useEffect(() => {
    const alertAge = Date.now() - new Date(alert.created_at).getTime();

    // If alert was created in the last 10 seconds, mark as new
    if (alertAge < 10000) {
      setIsNew(true);

      // Remove "new" highlight after 5 seconds
      const timer = setTimeout(() => setIsNew(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert.created_at]);

  const handleOpenCallPopup = async (alert) => {
    try {
      const roiRes = await dispatch(
        getRois({
          tenantId,
          cameraId: alert.camera_id,
          id: alert.meta?.roi_id,
          skip: 0,
          limit: 1,
        }),
      ).unwrap();

      const roiData = Array.isArray(roiRes) ? roiRes[0] : roiRes;

      if (roiData && roiData.notification_config) {
        setCallRecipients(roiData.notification_config);
      } else {
        setCallRecipients({});
      }

      setShowCallPopup(true);
    } catch (err) {
      console.error("Error fetching ROI:", err);
      setCallRecipients({});
      setShowCallPopup(true);
    }
  };

useEffect(() => {
    setValidationStatus(
      alert.meta?.validation_status || VALIDATION_STATES.UNREVIEWED,
    );
  }, [alert.meta?.validation_status]);

  useEffect(() => {
    if (isPopup) {
      setIsExpanded(true);
      setIsRead(true);
    }
  }, [isPopup]);

  const {
    camera_name = "N/A",
    roi_name = "N/A",
    alert_priority,
    confidence_score,
    frame_clip,
    notes,
    detection_type,
    enriched_message,
  } = alert.meta || {};

  const formattedTitle = t(
    `alerts.detection_titles.${(detection_type || alert.title)?.toLowerCase()}`,
    (detection_type || alert.title)
      ?.replace(/_/g, " ")
      ?.replace(/\b\w/g, (char) => char.toUpperCase()),
  );

  const getFormattedMessage = () => {
    const type = detection_type?.toLowerCase();
    return (
      t(`alerts.messages.${type}`, {
        camera: camera_name,
        type: formattedTitle,
      }) || `Detected by Camera ${camera_name}.`
    );
  };

  const FRAME_DIR = `${process.env.REACT_APP_BASE_URL}/api/v1/tenants/${tenantId}/cameras/alert/image`;
  const FRAME_URL = `${FRAME_DIR}/${frame_clip}`;

  const locationName =
    locations.find((loc) => String(loc.id) === String(alert.location_id))?.name ||
    "Unknown Location";

  const detailLabel = `${textSizes.extrasmall} font-semibold uppercase tracking-wide`;
  const detailValue = `${textSizes.subtitle} font-medium`;

  const renderExpandedContent = () => (
    <div className={`${bgcolors.white} rounded-lg p-6 shadow-sm`} style={{ border: `1px solid ${colors.border}` }}>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2">
          <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: colors.bg2, border: `1px solid ${colors.border}` }}>
            <img
              src={FRAME_URL}
              alt={t("alerts.alert_detection_image_alt")}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
        <div className="lg:w-1/2 flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6">
            <div className="space-y-3">
              <div>
                <p className={`${detailLabel}`} style={{ color: colors.textDim }}>{t("alerts.location")}</p>
                <p className={`${detailValue}`} style={{ color: colors.text }}>{locationName}</p>
              </div>
              <div>
                <p className={`${detailLabel}`} style={{ color: colors.textDim }}>{t("alerts.unit")}</p>
                <p className={`${detailValue}`} style={{ color: colors.text }}>{roi_name}</p>
              </div>
              <div>
                <p className={`${detailLabel}`} style={{ color: colors.textDim }}>{t("alerts.camera")}</p>
                <p className={`${detailValue}`} style={{ color: colors.text }}>{camera_name}</p>
              </div>
              <div>
                <p className={`${detailLabel}`} style={{ color: colors.textDim }}>{t("alerts.time")}</p>
                <p className={`${detailValue}`} style={{ color: colors.text }}>
                  {formatDateTime(alert.created_at, t("date_locale"), timezone)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className={`${detailLabel}`} style={{ color: colors.textDim }}>{t("alerts.priority")}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mt-1 ${
                  alert_priority?.toLowerCase() === "high"
                    ? `${bgcolors.dangerLight} ${textcolors.dangerBadge}`
                    : alert_priority?.toLowerCase() === "medium"
                      ? `${bgcolors.warningLight} ${textcolors.warningBadge}`
                      : `${bgcolors.successLighter} ${textcolors.successBadge}`
                }`}>
                  {t(`alerts.priority_${alert_priority?.toLowerCase()}`)}
                </span>
              </div>
              <div>
                <p className={`${detailLabel}`} style={{ color: colors.textDim }}>{t("alerts.confidence")}</p>
                <p className={`${textSizes.subtitle} font-bold`} style={{ color: colors.text }}>
                  {confidence_score ? (confidence_score * 100).toFixed(0) + "%" : "N/A"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-md p-3 mb-6" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
            <p className={`${detailLabel} mb-1`} style={{ color: colors.textDim }}>{t("alerts.comments")}:</p>
            <p className={`${textSizes.subtitle} leading-relaxed italic`} style={{ color: colors.textDim }}>
              "{(enriched_message && enriched_message[i18n.language]) || notes || t("alerts.default_comment")}"
            </p>
          </div>
          <div className="pt-5 mt-auto" style={{ borderTop: `1px solid ${colors.border}` }}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleValidationStatusChange(
                    validationStatus === VALIDATION_STATES.GENUINE
                      ? VALIDATION_STATES.UNREVIEWED
                      : VALIDATION_STATES.GENUINE,
                  )}
                  disabled={isUpdating}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 ${
                    validationStatus === VALIDATION_STATES.GENUINE
                      ? `${bgcolors.success} ${textcolors.white} shadow-md ${borderstyles.successActive}`
                      : bgcolors.hoverMedium
                  }`}
                  style={validationStatus !== VALIDATION_STATES.GENUINE ? { backgroundColor: colors.bg2, color: colors.textMute, borderColor: colors.border } : {}}
                >
                  {validationStatus === VALIDATION_STATES.GENUINE
                    ? <ThumbsUpFilledIcon className="text-xl" />
                    : <ThumbsUpIcon className="text-xl" />}
                </button>
                <button
                  onClick={() => handleValidationStatusChange(
                    validationStatus === VALIDATION_STATES.FALSE_ALERT
                      ? VALIDATION_STATES.UNREVIEWED
                      : VALIDATION_STATES.FALSE_ALERT,
                  )}
                  disabled={isUpdating}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 ${
                    validationStatus === VALIDATION_STATES.FALSE_ALERT
                      ? `${bgcolors.danger} ${textcolors.white} shadow-md ${borderstyles.dangerActive}`
                      : bgcolors.hoverMedium
                  }`}
                  style={validationStatus !== VALIDATION_STATES.FALSE_ALERT ? { backgroundColor: colors.bg2, color: colors.textMute, borderColor: colors.border } : {}}
                >
                  {validationStatus === VALIDATION_STATES.FALSE_ALERT
                    ? <ThumbsDownFilledIcon className="text-xl" />
                    : <ThumbsDownIcon className="text-xl" />}
                </button>
              </div>
              <p className={`${textSizes.subtitle} italic`} style={{ color: colors.textDim }}>*{t("alerts.feedback_instruction")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isPopup ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <div
            className={`absolute inset-0 ${bgcolors.backdropSubtle} backdrop-blur-[2px]`}
            onClick={onClose}
          />
          <div className={`relative z-10 ${bgcolors.white} rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`} style={{ border: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-2xl font-semibold`} style={{ color: colors.text }}>{formattedTitle}</h2>
              <button onClick={onClose} className="transition-colors" style={{ color: colors.textDim }}
                onMouseEnter={e => e.currentTarget.style.color = colors.text}
                onMouseLeave={e => e.currentTarget.style.color = colors.textDim}
              >
                <CloseIcon size={24} />
              </button>
            </div>
            {renderExpandedContent()}
          </div>
        </div>
     ) : (
        <>
          <div className={`${bgcolors.white} w-full flex flex-col mb-3 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all duration-300 ${isNew ? borderstyles.ringSuccess : ""}`} style={{ borderLeftColor: getPriorityColor(alert_priority) }}>
            <div className="flex items-center justify-between px-3 sm:px-5 py-3">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: getPriorityBg(alert_priority) }}>
                  {getDetectionIcon(detection_type, getPriorityColor(alert_priority))}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`${textSizes.subtitle} font-bold mb-0.5 leading-5`} style={{ color: colors.text }}>{formattedTitle}</p>
                  <p className={`${textSizes.extrasmall} mb-0.5 leading-4`} style={{ color: colors.textDim }}>{renderMessage()}</p>
                  <p className={`${textSizes.extrasmall} leading-4`} style={{ color: colors.textMute }}>
                    {formatDateTime(alert.created_at, t("date_locale"), timezone)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 ml-2 sm:ml-4 flex-shrink-0">
                <button
                  onClick={toggleExpand}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                    !isRead
                      ? `${borderstyles.accentSoft} ${textcolors.accentText} ${bgcolors.accentLight} ${bgcolors.accentHoverStrong}`
                      : bgcolors.hoverFaint
                  }`}
                  style={isRead ? { borderColor: colors.border, color: colors.textDim, backgroundColor: colors.panel } : {}}
                >
                  {!isRead ? t("alerts.unread") : t("alerts.read")}
                  <ChevronDownIcon size={11} style={{ transition: "transform 0.3s ease", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
                <button
                  onClick={() => handleOpenCallPopup(alert)}
                  className={`w-9 h-9 flex items-center justify-center ${bgcolors.successLight} ${bgcolors.successHover} rounded-full ${borderstyles.successFaint} transition-colors`}
                >
                  <PhoneIcon className={`${textcolors.success} text-lg`} />
                </button>
                <button
                  onClick={toggleExpand}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                  style={{ color: colors.textMute }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.bg2}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <EllipsisIcon className="text-xl" />
                </button>
              </div>
            </div>
          </div>
          {isExpanded && (
            <div className="mt-2 mb-4">{renderExpandedContent()}</div>
          )}
        </>
      )}
      {showCallPopup && (
        <CallPopup recipients={callRecipients} onClose={() => setShowCallPopup(false)} />
      )}
    </>
  );
};

export default AlertItem;
