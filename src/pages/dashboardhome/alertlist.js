import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { updateAlertAPI } from "../../features/alert/alertSlice";
import { getRois } from "../../features/cameras/roilistslice";
import {
  IoAddCircleOutline,
  IoRemove,
  IoCallOutline,
  IoThumbsUp,
  IoThumbsUpOutline,
  IoThumbsDown,
  IoThumbsDownOutline,
} from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "../../utils/datehelper";
import CallPopup from "../../component/CallPopup";

import { toast } from "react-toastify";

const VALIDATION_STATES = {
  FALSE_ALERT: "FALSE_ALERT",
  UNREVIEWED: "UNREVIEWED",
  GENUINE: "GENUINE",
};

const AlertItem = ({ alert, tenantId, timezone }) => {
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
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityBorderColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "border-red-500";
      case "medium":
        return "border-yellow-400";
      case "low":
        return "border-green-400";
      default:
        return "border-gray-300";
    }
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

      toast.success(
        t("alerts.up_status_sucess") ||
          "Validation status updated successfully",
      );
    } catch (error) {
      console.error("Failed to update validation status:", error);

      // Revert on error
      setValidationStatus(previousStatus);

      toast.error(
        t("alerts.up_status_failed") || "Failed to update validation status",
      );
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

  return (
    <>
      <div
        className={`bg-white rounded-full w-full flex flex-col mb-4 hover:shadow-lg transition-all duration-300 ${
          !isRead ? "border-l-4 border-blue-500" : ""
        } ${isNew ? "animate-pulse-new border-2 border-green-400 shadow-green-400/50" : ""}`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className={`w-12 h-12 rounded-full border-4 ${getPriorityBorderColor(
                alert_priority,
              )} flex items-center justify-center flex-shrink-0`}
            >
              <svg
                width="32"
                height="29"
                viewBox="0 0 32 29"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M21.1314 23.9164C21.8193 23.9164 22.4427 23.6338 22.8925 23.1789C23.3424 22.7239 23.6218 22.0935 23.6218 21.3979C23.6218 20.7023 23.3439 20.0719 22.8925 19.6154C22.4411 19.1605 21.8178 18.8779 21.1299 18.8779C20.4421 18.8779 19.8187 19.1589 19.3673 19.6154C18.9174 20.0719 18.638 20.7007 18.638 21.3979C18.638 22.0951 18.9174 22.7239 19.3673 23.1789C19.8172 23.6353 20.4405 23.9164 21.1284 23.9164H21.1314ZM27.904 8.71231L28.38 9.58182C28.6026 9.97621 28.6456 10.4218 28.5381 10.8255C28.4306 11.2323 28.1681 11.6003 27.7781 11.827L20.3499 16.1637L21.4846 18.1512C22.2339 18.2335 22.9079 18.5766 23.413 19.0875C23.5021 19.1775 23.5865 19.2738 23.6648 19.3732H27.0749V17.645C27.0749 16.9277 27.3636 16.2786 27.8288 15.8066C28.2955 15.3361 28.9389 15.0442 29.6451 15.0442H31.0899V28.1289H29.6451C28.9373 28.1289 28.294 27.837 27.8288 27.3665C27.3636 26.896 27.0749 26.2454 27.0749 25.5296V23.8015H23.3148C22.7405 24.3356 21.9728 24.6617 21.1314 24.6617C20.2409 24.6617 19.4333 24.2952 18.8499 23.7052C18.2649 23.1152 17.9025 22.2969 17.9025 21.3963C17.9025 21.1976 17.9194 21.0035 17.9532 20.8141L16.5606 18.3748L8.81617 22.8963C8.42618 23.123 7.98092 23.1695 7.57865 23.0608C7.17638 22.9522 6.8125 22.6866 6.58833 22.2923L6.32271 21.8202L4.36356 22.9661C4.20849 23.0546 4.03499 23.0717 3.87992 23.0298C3.72331 22.9879 3.58052 22.8823 3.493 22.7301L0.0829258 16.7864C-0.00612628 16.6311 -0.0214801 16.4556 0.0199752 16.2973C0.0629658 16.1389 0.165836 15.9929 0.316303 15.9044L1.26363 15.3517L0.44374 14.7834C0.333193 14.7073 0.239534 14.6079 0.176584 14.4915C0.113633 14.3766 0.079855 14.243 0.0813904 14.1017C0.0844611 13.9589 0.122846 13.8238 0.188867 13.7074C0.256424 13.5893 0.354688 13.49 0.475983 13.4201L23.0906 0.222117C23.479 -0.00613033 23.9258 -0.0527115 24.3296 0.0559779C24.7334 0.164667 25.0973 0.43018 25.3215 0.823014L28.5289 6.4407C28.7531 6.83509 28.7991 7.28692 28.6917 7.69528C28.5842 8.10365 28.3216 8.47008 27.9332 8.69678L27.9055 8.71231H27.904ZM20.6463 18.1683C19.9492 18.2739 19.3243 18.6061 18.8468 19.089C18.6165 19.3219 18.4215 19.589 18.2695 19.8825L17.1978 18.0037L19.7143 16.5333L20.6463 18.1667V18.1683ZM24.1024 20.12C24.2682 20.5129 24.3588 20.9445 24.3588 21.3963C24.3588 22.0019 24.1961 22.5702 23.912 23.0562H27.0749V20.12H24.1024ZM27.7351 9.93894L27.7397 9.9467C27.8626 10.161 27.8871 10.4079 27.8272 10.6314C27.7674 10.855 27.6246 11.0569 27.4096 11.1827L8.45075 22.2519C8.23733 22.3761 7.9932 22.4009 7.77057 22.3404C7.54948 22.2798 7.34834 22.1339 7.22551 21.9181L4.97004 17.9198L7.44661 19.6356C7.70148 19.811 7.9886 19.898 8.27878 19.9011C8.57051 19.9058 8.86683 19.825 9.13552 19.6682L27.2668 9.08185L27.7351 9.93584V9.93894ZM5.95882 21.1743L4.63533 18.8235L3.56363 16.9463L1.93613 15.819L0.769241 16.4991L4.08105 22.2721L5.95882 21.1728V21.1743ZM27.8134 23.4288V25.5296C27.8134 26.0389 28.0192 26.5032 28.3523 26.8386C28.684 27.174 29.1431 27.3836 29.6467 27.3836H30.3529V15.7911H29.6467C29.1415 15.7911 28.6824 15.9991 28.3523 16.333C28.0207 16.6699 27.815 17.1342 27.815 17.645V23.4288H27.8134ZM23.4591 0.864937C23.6725 0.740721 23.9166 0.715877 24.1408 0.776433C24.3619 0.835435 24.5615 0.98139 24.6843 1.19566L27.8917 6.81179C28.0146 7.02762 28.0391 7.27761 27.9808 7.5012C27.9209 7.72479 27.7781 7.92664 27.5647 8.05085L8.76703 19.0269C8.61503 19.1154 8.44767 19.162 8.28646 19.1589C8.13906 19.1573 7.9932 19.1123 7.86116 19.0207L0.856757 14.167L0.822979 14.1328L0.816837 14.1111L0.824514 14.0831L0.842939 14.0645L23.4591 0.864937Z"
                  fill="#393A4A"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-gray-800 text-sm leading-4 font-medium mb-1">
                {formattedTitle}
              </p>

              <p className="text-gray-600 text-sm mb-1 leading-4">
                {getFormattedMessage()}
              </p>

              <p className="text-gray-600 text-sm leading-4">
                {formatDateTime(alert.created_at, t("date_locale"), timezone)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 rounded-r-full h-full">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  !isRead
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {!isRead ? t("alerts.unread") : t("alerts.read")}
              </span>

              <button
                onClick={() => handleOpenCallPopup(alert)}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
              >
                <IoCallOutline className="text-white text-xl" />
              </button>

              <button
                onClick={toggleExpand}
                className="p-2 bg-[#3a3d4d] rounded-full transition-colors"
              >
                {isExpanded ? (
                  <IoRemove className="text-white text-xl" />
                ) : (
                  <IoAddCircleOutline className="text-white text-xl" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-white rounded-lg p-6 border border-gray-200 mt-2 mb-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/2">
              <div className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={FRAME_URL}
                  alt={t("alerts.alert_detection_image_alt")}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            <div className="lg:w-1/2 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("alerts.location")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {alert.meta?.location || "Store"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("alerts.unit")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {roi_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("alerts.camera")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {camera_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("alerts.time")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(
                        alert.created_at,
                        t("date_locale"),
                        timezone,
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("alerts.priority")}
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mt-1
                      ${
                        alert_priority?.toLowerCase() === "high"
                          ? "bg-red-100 text-red-800"
                          : alert_priority?.toLowerCase() === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {t(`alerts.priority_${alert_priority?.toLowerCase()}`)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("alerts.confidence")}
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {confidence_score
                        ? (confidence_score * 100).toFixed(0) + "%"
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-md p-3 mb-6 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  {t("alerts.comments")}:
                </p>
                <p className="text-sm text-gray-700 leading-relaxed italic">
                  "
                  {(enriched_message && enriched_message[i18n.language]) ||
                    notes ||
                    t("alerts.default_comment")}
                  "
                </p>
              </div>

              <div className="border-t border-gray-100 pt-5 mt-auto">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        handleValidationStatusChange(
                          validationStatus === VALIDATION_STATES.GENUINE
                            ? VALIDATION_STATES.UNREVIEWED
                            : VALIDATION_STATES.GENUINE,
                        )
                      }
                      disabled={isUpdating}
                      className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200
                        ${
                          validationStatus === VALIDATION_STATES.GENUINE
                            ? "bg-green-500 text-white shadow-md border-green-600"
                            : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
                        }`}
                    >
                      {validationStatus === VALIDATION_STATES.GENUINE ? (
                        <IoThumbsUp className="text-xl" />
                      ) : (
                        <IoThumbsUpOutline className="text-xl" />
                      )}
                    </button>

                    <button
                      onClick={() =>
                        handleValidationStatusChange(
                          validationStatus === VALIDATION_STATES.FALSE_ALERT
                            ? VALIDATION_STATES.UNREVIEWED
                            : VALIDATION_STATES.FALSE_ALERT,
                        )
                      }
                      disabled={isUpdating}
                      className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200
                        ${
                          validationStatus === VALIDATION_STATES.FALSE_ALERT
                            ? "bg-red-500 text-white shadow-md border-red-600"
                            : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
                        }`}
                    >
                      {validationStatus === VALIDATION_STATES.FALSE_ALERT ? (
                        <IoThumbsDown className="text-xl" />
                      ) : (
                        <IoThumbsDownOutline className="text-xl" />
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 italic">
                    *{t("alerts.feedback_instruction")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCallPopup && (
        <CallPopup
          recipients={callRecipients}
          onClose={() => setShowCallPopup(false)}
        />
      )}
    </>
  );
};

export default AlertItem;
