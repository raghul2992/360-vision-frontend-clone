import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Line,
  Circle,
  Image as KonvaImage,
  Rect,
} from "react-konva";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { bgcolors } from "../../theme";
import {
  IoArrowBackCircle,
  IoChatboxEllipsesOutline,
  IoLogoWhatsapp,
  IoMailOutline,
  IoReload,
  IoScanCircle,
  IoPencil,
  IoTrash,
  IoCamera,
} from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  createRoi,
  getRois,
  updateRoi,
  deleteRoi,
  clearRoiOperationSuccess,
} from "../../features/cameras/roilistslice";
import useImage from "use-image";
import { getCameraSnapshot } from "../../features/cameras/cameraApiSlice";
import {
  convertTimeSlotsLocalToUTC,
  convertTimeSlotsUTCToLocal,
} from "../../utils/datehelper";

const ROIConfiguration = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    snapshot,
    cameraId,
    tenantId: propTenantId,
    rtsp_url,
    username,
    password,
    roiToEdit,
    currentRoi_Id,
    status,
    addnew,
  } = location.state || {};
  const tenantId = propTenantId;

  const [polygons, setPolygons] = useState([]);
  const [currentPolygon, setCurrentPolygon] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState("polygon");
  const [isDrawingRectangle, setIsDrawingRectangle] = useState(false);
  const [rectangleStart, setRectangleStart] = useState(null);
  const [currentRectangle, setCurrentRectangle] = useState(null);
  const stageRef = useRef(null);
  const SNAPSHOT_DIR = `${process.env.REACT_APP_BASE_URL}/api/v1/tenants/${tenantId}/cameras/snapshot/image`;
  const SNAPSHOT_URL = `${SNAPSHOT_DIR}/${snapshot}`;
  const [snapshotUrl, setSnapshotUrl] = useState(SNAPSHOT_URL);
  const [image] = useImage(snapshotUrl);

  /** @type {Record<string, string>} */
  const dwellDescriptions = {
    VEHICLE_DWELL_TIME: t("roi.dwellTimeSecondsDescription"),
    ATTENDANT_CELLPHONE_DETECTION: t("roi.cellphoneDwellTimeDescription"),
    PERSON_QUEUE_DETECTION: t("roi.queueDwellTimeSecondsDescription"),
  };

  const [stageDimensions, setStageDimensions] = useState({
    width: 1100,
    height: 640,
  });

  const { rois, isLoading, error, operationSuccess } = useSelector(
    (state) => state.roilist,
  );
  const { snapshotResult, isLoading: isSnapshotLoading } = useSelector(
    (state) => state.cameraApi,
  );

  // Image dimensions state
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    console.log(`${snapshotUrl}`);
  }, []);

  const [emailNotification, setEmailNotification] = useState(false);
  const [callNotification, setCallNotification] = useState(false);
  const [whatsappNotification, setWhatsappNotification] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailAddressError, setEmailAddressError] = useState("");
  const [emailName, setEmailName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [callName, setCallName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappNumberError, setWhatsappNumberError] = useState("");
  const [whatsappName, setWhatsappName] = useState("");
  const [emailRecipients, setEmailRecipients] = useState([]);
  const [callRecipients, setCallRecipients] = useState([]);
  const [whatsappRecipients, setWhatsappRecipients] = useState([]);
  const [whatsappNameError, setWhatsappNameError] = useState("");
  const [emailNameError, setEmailNameError] = useState("");

  const [personSensitivity, setPersonSensitivity] = useState(66);
  const [weaponSensitivity, setWeaponSensitivity] = useState(88);
  const [vehicleSensitivity, setVehicleSensitivity] = useState(90);
  const [fireSensitivity, setFireSensitivity] = useState(18);
  const [motionThreshold, setMotionThreshold] = useState(66);
  const [minimumObjectSize, setMinimumObjectSize] = useState(98);

  // ROI Settings
  const [roiName, setRoiName] = useState("");
  const [roiNameError, setRoiNameError] = useState("");
  const [detectionType, setDetectionType] = useState("PERSON_QUEUE_DETECTION");
  const [alertPriority, setAlertPriority] = useState("High"); // Stores the English value
  const [displayAlertPriority, setDisplayAlertPriority] = useState(
    t("roi.high"),
  ); // Stores the translated value for display
  const [currentRoiId, setCurrentRoiId] = useState(currentRoi_Id);

  // NEW: Activity Tracking state
  const [trackingType, setTrackingType] = useState(false);

  // New detection config states
  const [queueCountThreshold, setQueueCountThreshold] = useState(1);
  const [queueDwellTimeSeconds, setQueueDwellTimeSeconds] = useState(40);
  const [dwellTimeSeconds, setDwellTimeSeconds] = useState(40);
  const [attendantAbsenceDwellTime, setAttendantAbsenceDwellTime] =
    useState(60);
  const [confidenceThreshold, setConfidenceThreshold] = useState(50); // Updated default to 50
  const [alertCooldown, setAlertCooldown] = useState(30);
  const [suspiciousConfidenceThreshold, setSuspiciousConfidenceThreshold] =
    useState(40); // NEW: Confidence threshold for suspicious loitering
  const [targetedHourSlots, setTargetedHourSlots] = useState([]);
  const [newTimeSlot, setNewTimeSlot] = useState(["", ""]);

  //added new
  const [crowdSurgeQueueThreshold, setCrowdSurgeQueueThreshold] = useState(10);
  const [crowdSurgeDwellTime, setCrowdSurgeDwellTime] = useState(30);
  const [ppeDwellTime, setPpeDwellTime] = useState(5);
  const [fireSmokeDwellTime, setFireSmokeDwellTime] = useState(1);

  const searchParams = new URLSearchParams(location.search);
  const cameraIdFromUrl = searchParams.get("cameraId");

  // Update image dimensions when image loads
  useEffect(() => {
    if (image) {
      setImageDimensions({
        width: image.width,
        height: image.height,
      });
    }
  }, [image]);

  useEffect(() => {
    const effectiveCameraId = cameraId || cameraIdFromUrl;

    if (effectiveCameraId && tenantId) {
      dispatch(getRois({ tenantId, cameraId: effectiveCameraId }));
    }

    if (roiToEdit) {
      handleEditRoi(roiToEdit);
      console.log("ROI to edit loaded, currentRoiId:", roiToEdit.id);
    }
  }, [dispatch, cameraId, cameraIdFromUrl, tenantId, roiToEdit, addnew]);

  // Handle errors and success messages
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    if (operationSuccess) {
      // The getRois dispatch is now handled directly in handleSaveRoi after creation/update
      dispatch(clearRoiOperationSuccess());
    }
  }, [error, operationSuccess, dispatch]);

  // Get scale factors for coordinate conversion
  const getScaleFactors = () => {
    if (
      !imageDimensions.width ||
      !imageDimensions.height ||
      !stageRef.current
    ) {
      return { scaleX: 1, scaleY: 1 };
    }

    const stageWidth = stageRef.current.width();
    const stageHeight = stageRef.current.height();

    return {
      scaleX: imageDimensions.width / stageWidth,
      scaleY: imageDimensions.height / stageHeight,
    };
  };

  // Convert stage coordinates to image coordinates
  const getImagePoint = (stageX, stageY) => {
    const { scaleX, scaleY } = getScaleFactors();
    return {
      x: Math.round(stageX * scaleX),
      y: Math.round(stageY * scaleY),
    };
  };

  // Convert image coordinates to stage coordinates
  const getStagePoint = (imageX, imageY) => {
    const { scaleX, scaleY } = getScaleFactors();
    return {
      x: Math.round(imageX / scaleX),
      y: Math.round(imageY / scaleY),
    };
  };

  // Convert polygon points from image to stage coordinates
  const getStagePolygon = (polygon) => {
    if (!polygon || polygon.length === 0) return [];
    return polygon.map((point) => getStagePoint(point.x, point.y));
  };

  // Add this function to transform polygons format
  const transformPolygonsFormat = (polygonsArray) => {
    return polygonsArray.map((polygon, index) => ({
      polygon_name: `${t("roi.area")} ${index + 1}`,
      polygon_points: polygon.flatMap((point) => [point.x, point.y]),
    }));
  };

  // Polygon drawing handlers
  const handleMouseDown = (e) => {
    if (!isDrawing || !image) return;

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    const imagePoint = getImagePoint(pointerPosition.x, pointerPosition.y);

    if (drawingMode === "polygon") {
      setCurrentPolygon([
        ...currentPolygon,
        { x: imagePoint.x, y: imagePoint.y },
      ]);
    } else if (drawingMode === "rectangle") {
      setIsDrawingRectangle(true);
      setRectangleStart(pointerPosition);
      setCurrentRectangle({
        x: pointerPosition.x,
        y: pointerPosition.y,
        width: 0,
        height: 0,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawingRectangle || !rectangleStart || !image) return;

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();

    setCurrentRectangle({
      x: Math.min(rectangleStart.x, pointerPosition.x),
      y: Math.min(rectangleStart.y, pointerPosition.y),
      width: Math.abs(pointerPosition.x - rectangleStart.x),
      height: Math.abs(pointerPosition.y - rectangleStart.y),
    });
  };

  const handleMouseUp = () => {
    if (
      isDrawingRectangle &&
      currentRectangle &&
      currentRectangle.width > 10 &&
      currentRectangle.height > 10
    ) {
      // Convert rectangle corners to image coordinates
      const topLeft = getImagePoint(currentRectangle.x, currentRectangle.y);
      const topRight = getImagePoint(
        currentRectangle.x + currentRectangle.width,
        currentRectangle.y,
      );
      const bottomRight = getImagePoint(
        currentRectangle.x + currentRectangle.width,
        currentRectangle.y + currentRectangle.height,
      );
      const bottomLeft = getImagePoint(
        currentRectangle.x,
        currentRectangle.y + currentRectangle.height,
      );

      const rectPoints = [
        { x: topLeft.x, y: topLeft.y },
        { x: topRight.x, y: topRight.y },
        { x: bottomRight.x, y: bottomRight.y },
        { x: bottomLeft.x, y: bottomLeft.y },
      ];

      setPolygons([...polygons, rectPoints]);
      setIsDrawingRectangle(false);
      setCurrentRectangle(null);
      setRectangleStart(null);
    }
  };

  const completeCurrentPolygon = () => {
    if (currentPolygon.length >= 3) {
      setPolygons([...polygons, currentPolygon]);
      setCurrentPolygon([]);
    } else {
      toast.error("A polygon needs at least 3 points");
    }
  };

  // Fixed drag handler with proper coordinate conversion
  const handleDragMove = (e, polygonIndex, pointIndex) => {
    const newPolygons = [...polygons];
    const stagePoint = { x: e.target.x(), y: e.target.y() };
    const imagePoint = getImagePoint(stagePoint.x, stagePoint.y);

    newPolygons[polygonIndex][pointIndex] = {
      x: imagePoint.x,
      y: imagePoint.y,
    };
    setPolygons(newPolygons);
  };

  const deletePolygon = (index) => {
    const newPolygons = polygons.filter((_, i) => i !== index);
    setPolygons(newPolygons);
  };

  const deleteAllPolygons = () => {
    setPolygons([]);
    setCurrentPolygon([]);
    setCurrentRectangle(null);
    setIsDrawingRectangle(false);
  };

  const handleTakeSnapshot = () => {
    if (!rtsp_url) {
      toast.error("RTSP URL is missing. Cannot take a snapshot.");
      return;
    }

    console.log(rtsp_url);
    const connectionData = {
      rtsp_url,
      username: "",
      password: "",
    };
    dispatch(
      getCameraSnapshot({
        tenantId,
        cameraId: cameraId ? parseInt(cameraId) : null,
        rtsp_url: rtsp_url,
        username: "",
        password: "",
      }),
    )
      .unwrap()
      .then((result) => {
        console.log(result.frame_url);

        setSnapshotUrl(`${SNAPSHOT_DIR}/${result.frame_url}`);
        toast.success("Frame retrieved successfully!");
      });
  };

  const handleSaveRoi = async () => {
    if (!cameraId) {
      toast.error("Please save the camera first before configuring ROIs.");
      return;
    }
    if (!roiName.trim()) {
      toast.error(t("roi.roiNameRequired"));
      setRoiNameError(t("roi.roiNameRequired"));
      return;
    }
    if (polygons.length === 0) {
      toast.error(t("roi.polygonRequired"));
      return;
    }

    // Transform polygons to the new format
    const transformedPolygons = transformPolygonsFormat(polygons);

    const alertPriorityMap = {
      [t("roi.high").toLowerCase()]: "high",
      [t("roi.medium").toLowerCase()]: "medium",
      [t("roi.low").toLowerCase()]: "low",
      high: "high", // Fallback for direct English values
      medium: "medium",
      low: "low",
    };

    const priorityToSend =
      alertPriorityMap[displayAlertPriority.toLowerCase()] || "high"; // Default to 'high' if not found

    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const roiData = {
      name: roiName.trim(),
      frame_url: snapshotUrl,
      polygons: transformedPolygons,
      alert_priority: priorityToSend,
      tracking_activity: trackingType,
      detection_type: detectionType,
      detection_config: {
        alert_cooldown_seconds: alertCooldown,
        confidence_threshold: confidenceThreshold,
        ...(() => {
          if (
            detectionType === "VEHICLE_QUEUE_DETECTION" ||
            detectionType === "PERSON_QUEUE_DETECTION"
          ) {
            return {
              queue_count_threshold: queueCountThreshold,
              queue_dwell_time_seconds: queueDwellTimeSeconds,
            };
          }
          if (detectionType === "VEHICLE_DWELL_TIME") {
            return {
              dwell_time_seconds: dwellTimeSeconds,
            };
          }
          if (detectionType === "ATTENDANT_ABSENCE_ON_PUMP") {
            return {
              dwell_time_seconds: attendantAbsenceDwellTime,
            };
          }
          if (detectionType === "ATTENDANT_CELLPHONE_DETECTION") {
            return {
              dwell_time_seconds: dwellTimeSeconds,
            };
          }
          if (detectionType === "RESTRICTED_AREA_BREACH_DETECTION") {
            return {
              targeted_hour_slots: convertTimeSlotsLocalToUTC(
                targetedHourSlots,
                userTimeZone,
              ),
            };
          }
          if (detectionType === "CROWD_SURGE") {
            return {
              queue_count_threshold: crowdSurgeQueueThreshold,
              dwell_time_seconds: crowdSurgeDwellTime,
            };
          }
          if (
            detectionType === "PPE_VEST_VIOLATION" ||
            detectionType === "PPE_HELMET_VIOLATION" ||
            detectionType === "PPE_GLOVE_VIOLATION" ||
            detectionType === "PPE_SAFETY_SHOES_VIOLATION" ||
            detectionType === "PPE_GOGGLES_VIOLATION"
          ) {
            return {
              dwell_time_seconds: ppeDwellTime,
            };
          }
          if (detectionType === "FIRE_SMOKE_DETECTION") {
            return {
              dwell_time_seconds: fireSmokeDwellTime,
            };
          }
          return {};
        })(),
      },

      notification_config: {
        whatsapp: {
          enabled: whatsappNotification,
          recipients: whatsappRecipients.map((r) => ({
            number: r.number,
            name: r.name,
          })),
        },
        email: {
          enabled: emailNotification,
          recipients: emailRecipients.map((r) => ({
            email: r.email,
            name: r.name,
          })),
        },
        call: {
          enabled: callNotification,
          recipients: callRecipients.map((r) => ({
            number: r.number,
            name: r.name,
          })),
        },
      },
      status: roiToEdit ? status : "active",
      meta: {},
      camera_id: cameraId,
    };

    console.log("handleSaveRoi called. currentRoiId:", currentRoiId);
    console.log("Transformed polygons data:", transformedPolygons);
    console.log(
      "Tracking type to send:",
      trackingType,
      "Type:",
      typeof trackingType,
    );
    console.log("Full ROI data to send:", roiData);

    if (currentRoiId) {
      const res = await dispatch(
        updateRoi({ tenantId, cameraId, roiId: currentRoiId, roiData }),
      );
      console.log("roi edit response", res);

      if (res.meta.requestStatus === "fulfilled") {
        toast.success("ROI updated successfully!");
        await dispatch(getRois({ tenantId, cameraId })); // Refresh ROIs after update
        navigate(`/add-camera?id=${cameraId}`);
      } else {
        // toast.error(res.payload || 'Failed to update ROI.')
      }
    } else {
      const res = await dispatch(createRoi({ tenantId, cameraId, roiData }));
      if (res.meta.requestStatus === "fulfilled") {
        toast.success("ROI created successfully!");
        resetForm();
        setCurrentRoiId(null);
        await dispatch(getRois({ tenantId, cameraId })); // Refresh ROIs after creation
        navigate(`/add-camera?id=${cameraId}`);
      } else {
        // toast.error(res.payload || 'Failed to create ROI.')
      }
    }
  };

  // UPDATED: Handle ROI editing - parse both old and new formats
  // UPDATED: Handle ROI editing - parse both old and new formats
  const handleEditRoi = (roi) => {
    console.log("Editing ROI:", roi);
    setCurrentRoiId(roi.id);
    setRoiName(roi.name);
    setDetectionType(roi.detection_type);
    // Set the internal alertPriority state to the English value from the backend
    setAlertPriority(roi.alert_priority);
    // Set the displayAlertPriority to the translated value
    setDisplayAlertPriority(t(`roi.${roi.alert_priority.toLowerCase()}`));

    // DEBUG: Log the ROI object to see its structure
    console.log("ROI object for editing:", roi);
    console.log("Tracking type from ROI:", roi.tracking_activity);

    setAlertCooldown(roi.detection_config?.alert_cooldown_seconds || 30);
    setConfidenceThreshold(roi.detection_config?.confidence_threshold || 50);
    // FIX: Set tracking type from the ROI being edited - handle both boolean and string values
    if (roi.tracking_activity !== undefined && roi.tracking_activity !== null) {
      // Convert to boolean if it's a string
      const trackingValue =
        typeof roi.tracking_activity === "string"
          ? roi.tracking_activity.toLowerCase() === "true"
          : Boolean(roi.tracking_activity);
      console.log("Converted tracking value:", trackingValue);
      setTrackingType(trackingValue);
    } else {
      console.log("No tracking_activity found, defaulting to false");
      setTrackingType(false);
    }

    // Set the snapshot URL from the ROI being edited
    setSnapshotUrl(`${roi.frame_url}`);

    // Parse the polygons
    try {
      const parsedPolygons = roi.polygons;

      console.log("Parsed ROI polygons for editing:", parsedPolygons);

      if (parsedPolygons && Array.isArray(parsedPolygons)) {
        const roiPolygons = [];

        if (
          parsedPolygons.length > 0 &&
          typeof parsedPolygons[0] === "object" &&
          "polygon_points" in parsedPolygons[0]
        ) {
          parsedPolygons.forEach((polygonObj) => {
            const polygonArray = polygonObj.polygon_points;
            if (
              polygonArray &&
              Array.isArray(polygonArray) &&
              polygonArray.length >= 6
            ) {
              const polygonPoints = [];
              for (let i = 0; i < polygonArray.length; i += 2) {
                if (i + 1 < polygonArray.length) {
                  polygonPoints.push({
                    x: polygonArray[i],
                    y: polygonArray[i + 1],
                  });
                }
              }
              if (polygonPoints.length >= 3) {
                roiPolygons.push(polygonPoints);
              }
            }
          });
        } else {
          parsedPolygons.forEach((polygonArray) => {
            if (
              polygonArray &&
              Array.isArray(polygonArray) &&
              polygonArray.length >= 6
            ) {
              const polygonPoints = [];
              for (let i = 0; i < polygonArray.length; i += 2) {
                if (i + 1 < polygonArray.length) {
                  polygonPoints.push({
                    x: polygonArray[i],
                    y: polygonArray[i + 1],
                  });
                }
              }
              if (polygonPoints.length >= 3) {
                roiPolygons.push(polygonPoints);
              }
            }
          });
        }

        console.log("Converted ROI polygons for editing:", roiPolygons);
        setPolygons(roiPolygons);
      } else {
        console.log("No valid polygons found, setting empty array");
        setPolygons([]);
      }
    } catch (error) {
      console.error("Error parsing polygons:", error);
      setPolygons([]);
    }

    // Populate notification states
    setEmailNotification(roi.notification_config?.email?.enabled || false);
    setEmailRecipients(
      roi.notification_config?.email?.recipients?.map((r) => ({
        email: r.email,
        name: r.name || "",
      })) || [],
    );
    setWhatsappNotification(
      roi.notification_config?.whatsapp?.enabled || false,
    );
    setWhatsappRecipients(
      roi.notification_config?.whatsapp?.recipients?.map((r) => ({
        number: r.number,
        name: r.name || "",
      })) || [],
    );
    setCallNotification(roi.notification_config?.call?.enabled || false);
    setCallRecipients(
      roi.notification_config?.call?.recipients?.map((r) => ({
        number: r.number,
        name: r.name || "",
      })) || [],
    );

    // Populate detection sensitivity states based on detection type
    if (
      roi.detection_type === "VEHICLE_QUEUE_DETECTION" ||
      roi.detection_type === "PERSON_QUEUE_DETECTION"
    ) {
      setQueueCountThreshold(roi.detection_config?.queue_count_threshold || 1);
      setQueueDwellTimeSeconds(
        roi.detection_config?.queue_dwell_time_seconds || 8,
      );
    } else if (roi.detection_type === "VEHICLE_DWELL_TIME") {
      setDwellTimeSeconds(roi.detection_config?.dwell_time_seconds || 15);
    } else if (roi.detection_type === "ATTENDANT_ABSENCE_ON_PUMP") {
      setAttendantAbsenceDwellTime(
        roi.detection_config?.dwell_time_seconds || 6,
      );
    } else if (roi.detection_type === "ATTENDANT_CELLPHONE_DETECTION") {
      setDwellTimeSeconds(roi.detection_config?.dwell_time_seconds || 15);
    } else if (roi.detection_type === "RESTRICTED_AREA_BREACH_DETECTION") {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const localTimeSlots = convertTimeSlotsUTCToLocal(
        roi.detection_config?.targeted_hour_slots,
        userTimeZone,
      );
      setTargetedHourSlots(localTimeSlots || []);
    } else if (roi.detection_type === "CROWD_SURGE") {
      setCrowdSurgeQueueThreshold(
        roi.detection_config?.queue_count_threshold || 10,
      );
      setCrowdSurgeDwellTime(roi.detection_config?.dwell_time_seconds || 30);
    } else if (
      roi.detection_type === "PPE_VEST_VIOLATION" ||
      roi.detection_type === "PPE_HELMET_VIOLATION" ||
      roi.detection_type === "PPE_GLOVE_VIOLATION" ||
      roi.detection_type === "PPE_SAFETY_SHOES_VIOLATION" ||
      roi.detection_type === "PPE_GOGGLES_VIOLATION"
    ) {
      setPpeDwellTime(roi.detection_config?.dwell_time_seconds || 5);
    } else if (roi.detection_type === "FIRE_SMOKE_DETECTION") {
      setFireSmokeDwellTime(roi.detection_config?.dwell_time_seconds || 1);
    }

    // Enable drawing mode for adding new polygons
    setIsDrawing(true);
  };

  const handleDeleteRoi = (roiId) => {
    dispatch(deleteRoi({ tenantId, cameraId, roiId }));
    toast.success("ROI deleted successfully!");
  };

  const resetForm = () => {
    setRoiName("");
    setDetectionType("PERSON_QUEUE_DETECTION");
    setAlertPriority("High"); // Reset to English 'High'
    setDisplayAlertPriority(t("roi.high")); // Reset display to translated 'High'
    setTrackingType(false); // Reset tracking type to false
    setRoiName("");
    setDetectionType("PERSON_QUEUE_DETECTION");
    setAlertPriority("High"); // Reset to English 'High'
    setDisplayAlertPriority(t("roi.high"));
    setTrackingType(false);
    if (addnew) {
      setPolygons([]);
    }
    setCurrentPolygon([]);
    setIsDrawing(false);
    setIsDrawingRectangle(false);
    setCurrentRectangle(null);
    setDrawingMode("polygon");
    setEmailNotification(false);
    setCallNotification(false);
    setWhatsappNotification(false);
    setEmailRecipients([]);
    setCallRecipients([]);
    setWhatsappRecipients([]);
    setWhatsappNumber("");
    setQueueCountThreshold(1);
    setQueueDwellTimeSeconds(40);
    setDwellTimeSeconds(15);
    setAttendantAbsenceDwellTime(6);
    setConfidenceThreshold(50);
    setAlertCooldown(30);
    setSuspiciousConfidenceThreshold(40);
    setTargetedHourSlots([]);
    setNewTimeSlot(["", ""]);
    setCurrentRoiId(null);
    setCrowdSurgeQueueThreshold(10);
    setCrowdSurgeDwellTime(30);
    setPpeDwellTime(5);
    setFireSmokeDwellTime(1);
  };

  // Function to handle image error in Konva
  const handleImageError = () => {
    toast.error("Failed to display Frame image");
  };

  // Function to parse ROI polygons for display - FIXED VERSION
  const parseRoiPolygons = (roi) => {
    try {
      const parsed = roi.polygons;

      console.log("parseRoiPolygons - parsed:", parsed);

      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === "object" && "polygon_points" in parsed[0]) {
          const allRoiPolygons = [];
          parsed.forEach((polygonObj) => {
            const polygonArray = polygonObj.polygon_points;
            if (
              polygonArray &&
              Array.isArray(polygonArray) &&
              polygonArray.length >= 6
            ) {
              const polygonPoints = [];
              for (let i = 0; i < polygonArray.length; i += 2) {
                if (i + 1 < polygonArray.length) {
                  polygonPoints.push({
                    x: polygonArray[i],
                    y: polygonArray[i + 1],
                  });
                }
              }
              if (polygonPoints.length >= 3) {
                allRoiPolygons.push(polygonPoints);
              }
            }
          });
          return allRoiPolygons;
        } else {
          const allRoiPolygons = [];
          parsed.forEach((polygonArray) => {
            if (
              polygonArray &&
              Array.isArray(polygonArray) &&
              polygonArray.length >= 6
            ) {
              const polygonPoints = [];
              for (let i = 0; i < polygonArray.length; i += 2) {
                if (i + 1 < polygonArray.length) {
                  polygonPoints.push({
                    x: polygonArray[i],
                    y: polygonArray[i + 1],
                  });
                }
              }
              if (polygonPoints.length >= 3) {
                allRoiPolygons.push(polygonPoints);
              }
            }
          });
          return allRoiPolygons;
        }
      }

      return [];
    } catch (error) {
      console.error("Error parsing ROI polygons:", error);
      return [];
    }
  };

  // Render polygons with proper coordinate conversion
  const renderPolygons = () => {
    return polygons.map((polygon, polyIndex) => {
      const stagePolygon = getStagePolygon(polygon);
      const flatPoints = stagePolygon.flatMap((p) => [p.x, p.y]);

      return (
        <React.Fragment key={polyIndex}>
          <Line
            points={flatPoints}
            stroke="#10b981"
            strokeWidth={3}
            closed={true}
            fill="rgba(16, 185, 129, 0.2)"
          />
          {stagePolygon.map((point, pointIndex) => (
            <Circle
              key={`${polyIndex}-${pointIndex}`}
              x={point.x}
              y={point.y}
              radius={6}
              fill="#10b981"
              stroke="white"
              strokeWidth={2}
              draggable
              onDragMove={(e) => handleDragMove(e, polyIndex, pointIndex)}
            />
          ))}
        </React.Fragment>
      );
    });
  };

  // Render current polygon being drawn
  const renderCurrentPolygon = () => {
    if (currentPolygon.length === 0) return null;

    const stagePolygon = getStagePolygon(currentPolygon);
    const flatPoints = stagePolygon.flatMap((p) => [p.x, p.y]);

    return (
      <>
        <Line points={flatPoints} stroke="#3b82f6" strokeWidth={2} />
        {stagePolygon.map((point, index) => (
          <Circle
            key={index}
            x={point.x}
            y={point.y}
            radius={6}
            fill="#3b82f6"
            stroke="white"
            strokeWidth={2}
          />
        ))}
      </>
    );
  };

  // Debug function to log coordinates
  const debugCoordinates = () => {
    console.log("Image dimensions:", imageDimensions);
    console.log("Stage dimensions:", stageDimensions);
    console.log("Scale factors:", getScaleFactors());
    console.log("Polygons (image coordinates):", polygons);
    console.log(
      "Polygons (stage coordinates):",
      polygons.map((poly) => getStagePolygon(poly)),
    );
  };

  return (
    <div className={`p-6 min-h-screen`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {t("roi.cameraConfigurationSettings")}
          </h1>
          <p className="text-sm">
            {t("roi.configureCameraConnectionSettings")}
          </p>
        </div>
        <button
          onClick={() => navigate(`/add-camera?id=${cameraId}`)}
          className="bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full flex items-center gap-2 transition-colors"
        >
          <IoArrowBackCircle size={20} className="inline-block" />
          <span>{t("roi.back")}</span>
        </button>
      </div>

      {/* ROI Setting Section */}
      <div className="bg-[#30313F] rounded-lg p-6 mb-6">
        <h2 className="text-xl text-white font-bold mb-4">
          {t("roi.roiSetting")}
        </h2>

        <div className="relative">
          {/* Camera Feed */}
          <div className="w-full bg-black rounded-lg  relative ">
            <Stage
              width={stageDimensions.width}
              height={stageDimensions.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              ref={stageRef}
              className="w-full h-full"
            >
              <Layer>
                <KonvaImage
                  image={image}
                  width={stageDimensions.width}
                  height={stageDimensions.height}
                  onError={handleImageError}
                />

                {/* Display existing polygons with proper coordinate conversion */}
                {renderPolygons()}
                {renderCurrentPolygon()}

                {/* Display current rectangle being drawn */}
                {currentRectangle && (
                  <Rect
                    x={currentRectangle.x}
                    y={currentRectangle.y}
                    width={currentRectangle.width}
                    height={currentRectangle.height}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dash={[5, 5]}
                    fill="rgba(59, 130, 246, 0.2)"
                  />
                )}

                {/* Display existing ROIs from backend - FIXED VERSION */}
                {rois.map((roi) => {
                  if (roi.id === currentRoiId) return null;

                  const roiPolygons = parseRoiPolygons(roi);
                  console.log("ROI polygons for display:", roiPolygons);

                  if (
                    !roiPolygons ||
                    !Array.isArray(roiPolygons) ||
                    roiPolygons.length === 0
                  ) {
                    console.log(
                      "Skipping ROI due to invalid polygons:",
                      roi.id,
                    );
                    return null;
                  }

                  return roiPolygons.map((polygon, polyIndex) => {
                    if (polygon.length < 3) {
                      console.log(
                        `Skipping polygon ${polyIndex} for ROI ${roi.id} due to insufficient points.`,
                      );
                      return null;
                    }
                    try {
                      const stagePoints = getStagePolygon(polygon);
                      const flatPoints = stagePoints.flatMap((p) => [p.x, p.y]);

                      return (
                        <Line
                          key={`${roi.id}-${polyIndex}`}
                          points={flatPoints}
                          stroke={addnew ? "rgba(255, 255, 0, 0.5)" : "yellow"}
                          strokeWidth={addnew ? 1 : 3}
                          closed={true}
                          fill={
                            addnew
                              ? "rgba(255, 255, 0, 0.1)"
                              : "rgba(255, 255, 0, 0.2)"
                          }
                        />
                      );
                    } catch (error) {
                      console.error(
                        `Error rendering polygon ${polyIndex} for ROI:`,
                        roi.id,
                        error,
                      );
                      return null;
                    }
                  });
                })}
              </Layer>
            </Stage>

            {/* Drawing mode selector */}
            {/* <div className='absolute top-4 left-4 bg-gray-800 bg-opacity-80 rounded-lg p-3'>
              <div className='flex gap-2 mb-2'>
                <button
                  onClick={() => {
                    setDrawingMode('polygon')
                    setIsDrawing(true)
                    setCurrentPolygon([])
                  }}
                  className={`px-3 py-1 rounded ${
                    drawingMode === 'polygon'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {t('roi.polygon')}
                </button>
              </div>
              {drawingMode === 'polygon' && (
                <div className='text-xs text-gray-300'>
                  {t('roi.clickToAddPoints')}
                </div>
              )}
              {drawingMode === 'rectangle' && (
                <div className='text-xs text-gray-300'>
                  {t('roi.clickAndDragToDrawRectangle')}
                </div>
              )}
            </div> */}

            {/* Polygon count display */}
            <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-80 rounded-lg p-3">
              <div className="text-sm text-gray-300">
                {t("roi.areas")}: {polygons.length}
              </div>
              <div className="text-sm text-gray-300">
                {t("roi.mode")}: {drawingMode}
              </div>
            </div>
          </div>
        </div>

        {/* ROI Configuration Fields */}
        <div className="flex flex-col mt-3">
          {/* Control Buttons */}
          <div className="flex gap-3 w-full justify-between">
            <div className="flex gap-3">
              <button
                onClick={handleTakeSnapshot}
                disabled={isSnapshotLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <IoCamera size={20} />
                <span>
                  {isSnapshotLoading ? t("roi.loading") : t("roi.captureFrame")}
                </span>
              </button>

              {drawingMode === "polygon" && currentPolygon.length > 0 && (
                <button
                  onClick={completeCurrentPolygon}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 transition-colors"
                >
                  <IoScanCircle size={20} />
                  <span>{t("roi.completePolygon")}</span>
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={deleteAllPolygons}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 transition-colors"
              >
                <IoTrash size={20} />
                <span>{t("roi.clearAll")}</span>
              </button>

              <button
                onClick={() => {
                  deleteAllPolygons();
                  setIsDrawing(true);
                }}
                className="bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 transition-colors"
              >
                <IoScanCircle size={20} />
                <span>{t("roi.drawNewArea")}</span>
              </button>
            </div>
          </div>

          {/* Polygon management */}
          {polygons.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg text-white font-semibold mb-2">
                {t("roi.drawnAreas")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {polygons.map((polygon, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 rounded p-2 flex justify-between items-center"
                  >
                    <span className="text-sm text-white">
                      {t("roi.area")} {index + 1} ({polygon.length}{" "}
                      {t("roi.points")})
                    </span>
                    <button
                      onClick={() => deletePolygon(index)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <IoTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rois.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg text-white font-bold mb-3">
                {t("roi.configuredRois")}
              </h3>
            </div>
          )}

          <div className="mt-3 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t("roi.roiName")}*
              </label>
              <input
                type="text"
                value={roiName}
                onChange={(e) => {
                  setRoiName(e.target.value);
                  if (e.target.value.trim()) {
                    setRoiNameError("");
                  }
                }}
                placeholder={t("roi.roiNamePlaceholder")}
                className={`w-full bg-gray-700 border rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  roiNameError
                    ? "border-red-500"
                    : "border-gray-600 focus:border-blue-500"
                }`}
              />
              {roiNameError && (
                <p className="text-red-500 text-xs mt-1">{roiNameError}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  {t("roi.detectionType")}
                </label>
                <select
                  value={detectionType}
                  onChange={(e) => setDetectionType(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                >
                  {/* <option value='VEHICLE_QUEUE_DETECTION'>
                    {t('roi.vehicleQueueDetection')}
                  </option> */}
                  <option value="">{"----"}</option>
                  <option value="PERSON_QUEUE_DETECTION">
                    {t("roi.personQueueDetection")}
                  </option>
                  <option value="CROWD_SURGE">{t("roi.crowdSurge")}</option>
                  <option value="RESTRICTED_AREA_BREACH_DETECTION">
                    {t("roi.restrictedAreaBreachDetection")}
                  </option>
                  <option value="PPE_VEST_VIOLATION">{t("roi.PPEViolation")}</option>
                  <option value="PPE_HELMET_VIOLATION">
                    {t("roi.PPEHelmetViolation")}
                  </option>
                  <option value="PPE_GLOVE_VIOLATION">
                    {t("roi.PPEGloveViolation")}
                  </option>
                  <option value="PPE_SAFETY_SHOES_VIOLATION">
                    {t("roi.PPESafetyShoesViolation")}
                  </option>
                  <option value="PPE_GOGGLES_VIOLATION">
                    {t("roi.PPEGogglesViolation")}
                  </option>

                  <option value="FIRE_SMOKE_DETECTION">
                    {t("roi.FireAndSmokeDetection")}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t("roi.alertPriority")}
                </label>
                <select
                  value={displayAlertPriority}
                  onChange={(e) => setDisplayAlertPriority(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                >
                  <option value={t("roi.high")}>{t("roi.high")}</option>
                  <option value={t("roi.medium")}>{t("roi.medium")}</option>
                  <option value={t("roi.low")}>{t("roi.low")}</option>
                </select>
              </div>
            </div>

            {detectionType === "PERSON_QUEUE_DETECTION" && (
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex items-center">
                  <div className="flex items-center gap-5">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trackingType}
                        onChange={() => setTrackingType(!trackingType)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                    <div>
                      <h3 className="text-sm font-medium text-gray-300">
                        {t("roi.enableActivityTracking") ||
                          "Enable Activity Tracking"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {t("roi.activityTrackingSubtext") ||
                          "Track and record activity related to this ROI for monitoring and reporting purposes."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detection Configuration Section */}
      <div className="bg-[#30313F] rounded-lg p-6 mb-6">
        <h2 className="text-xl text-white font-bold mb-4">
          {t("roi.detectionConfiguration")}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {detectionType === "ATTENDANT_CELLPHONE_DETECTION" &&
            "Configure settings for cellphone detection."}
          {detectionType !== "ATTENDANT_CELLPHONE_DETECTION" &&
            t("roi.detectionConfigurationDescription")}
        </p>
        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          {/* Vehicle/Person Queue Detection Fields */}
          {(detectionType === "VEHICLE_QUEUE_DETECTION" ||
            detectionType === "PERSON_QUEUE_DETECTION") && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t("roi.queueCountThreshold")}
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {t("roi.queueCountThresholdDescription")}
                </p>
                <input
                  type="number"
                  value={queueCountThreshold}
                  onChange={(e) =>
                    setQueueCountThreshold(Number(e.target.value))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t("roi.queueDwellTimeSeconds")}
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {t("roi.queueDwellTimeSecondsDescription")}
                </p>
                <input
                  type="number"
                  value={queueDwellTimeSeconds}
                  onChange={(e) =>
                    setQueueDwellTimeSeconds(Number(e.target.value))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </>
          )}

          {/* Crowd Surge Detection */}
          {detectionType === "CROWD_SURGE" && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t("roi.crowdSurgeQueueCountThreshold")}
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {t("roi.crowdSurgeQueueCountThresholdDescription")}
                </p>
                <input
                  type="number"
                  value={crowdSurgeQueueThreshold}
                  onChange={(e) =>
                    setCrowdSurgeQueueThreshold(Number(e.target.value))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t("roi.crowdSurgeDwellTimeSeconds")}
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {t("roi.crowdSurgeDwellTimeSecondsDescription")}
                </p>
                <input
                  type="number"
                  value={crowdSurgeDwellTime}
                  onChange={(e) =>
                    setCrowdSurgeDwellTime(Number(e.target.value))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </>
          )}

          {/* PPE Violation Detection */}
          {(detectionType === "PPE_VEST_VIOLATION" ||
            detectionType === "PPE_HELMET_VIOLATION" ||
            detectionType === "PPE_GLOVE_VIOLATION" ||
            detectionType === "PPE_SAFETY_SHOES_VIOLATION" ||
            detectionType === "PPE_GOGGLES_VIOLATION") && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t("roi.ppeDwellTimeSeconds")}
              </label>
              <p className="text-xs text-gray-500 mb-2">
                {t("roi.ppeDwellTimeSecondsDescription")}
              </p>
              <input
                type="number"
                value={ppeDwellTime}
                onChange={(e) => setPpeDwellTime(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          {/* Fire & Smoke Detection */}
          {detectionType === "FIRE_SMOKE_DETECTION" && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t("roi.fireSmokeDwellTimeSeconds")}
              </label>
              <p className="text-xs text-gray-500 mb-2">
                {t("roi.fireSmokeDwellTimeSecondsDescription")}
              </p>
              <input
                type="number"
                value={fireSmokeDwellTime}
                onChange={(e) => setFireSmokeDwellTime(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          {/* Vehicle Dwell Time Fields */}
          {/* VEHICLE_DWELL_TIME & ATTENDANT_CELLPHONE_DETECTION */}
          {(detectionType === "VEHICLE_DWELL_TIME" ||
            detectionType === "ATTENDANT_CELLPHONE_DETECTION") && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t("roi.dwellTimeSeconds")}
              </label>

              <p className="text-xs text-gray-500 mb-2">
                {dwellDescriptions[detectionType]}
              </p>

              <input
                type="number"
                value={dwellTimeSeconds}
                onChange={(e) => setDwellTimeSeconds(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          {/* Attendant Absence On Pump Fields */}
          {detectionType === "ATTENDANT_ABSENCE_ON_PUMP" && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t("roi.dwellTimeSeconds")}
              </label>
              <p className="text-xs text-gray-500 mb-2">
                {t("roi.attendantAbsenceDwellTimeDescription")}
              </p>
              <input
                type="number"
                value={attendantAbsenceDwellTime}
                onChange={(e) =>
                  setAttendantAbsenceDwellTime(Number(e.target.value))
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}
          {/* Targeted Hour Slots */}
          {detectionType === "RESTRICTED_AREA_BREACH_DETECTION" && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t("roi.targetedHourSlots")}
              </label>
              <p className="text-xs text-gray-500 mb-2">
                {t("roi.defineTimeSlots")}
              </p>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="time"
                  value={newTimeSlot[0]}
                  onChange={(e) =>
                    setNewTimeSlot([e.target.value, newTimeSlot[1]])
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white time-input"
                />
                <span>to</span>
                <input
                  type="time"
                  value={newTimeSlot[1]}
                  onChange={(e) =>
                    setNewTimeSlot([newTimeSlot[0], e.target.value])
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white time-input"
                />
                <button
                  onClick={() => {
                    if (newTimeSlot[0] && newTimeSlot[1]) {
                      setTargetedHourSlots([...targetedHourSlots, newTimeSlot]);
                      setNewTimeSlot(["", ""]);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Add
                </button>
              </div>
              <div>
                {targetedHourSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-700 rounded-lg p-2 mt-2"
                  >
                    <span>
                      {slot[0]} - {slot[1]}
                    </span>
                    <button
                      onClick={() => {
                        const newSlots = [...targetedHourSlots];
                        newSlots.splice(index, 1);
                        setTargetedHourSlots(newSlots);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t("roi.alertcooldownperiod")}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {t("roi.alertcooldownperioddes")}
            </p>
            <input
              type="number"
              value={alertCooldown}
              onChange={(e) => setAlertCooldown(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t("roi.newconfidenceThreshold")}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {t("roi.newconfidenceThresholdDescription")}
            </p>
            <input
              type="number"
              min="0"
              max="100"
              value={confidenceThreshold}
              onChange={(e) => {
                const val = Number(e.target.value);
                // Ensure value stays between 0 and 100
                if (val >= 0 && val <= 100) {
                  setConfidenceThreshold(val);
                }
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-[#30313F] rounded-lg p-6 mb-6">
        <h2 className="text-xl text-white font-bold mb-1">
          {t("roi.notifications")}
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed mb-2">
          {t("roi.notificationsubtext")}
        </p>
        <div className="grid grid-cols-2 gap-6">
          {/* WhatsApp Notification */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <IoLogoWhatsapp size={20} color="white" />
                <span className="font-semibold text-white">
                  {t("roi.whatsAppNotification")}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappNotification}
                  onChange={() =>
                    setWhatsappNotification(!whatsappNotification)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t("roi.enableWhatsAppAlerts")}
              </label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={whatsappName}
                  onChange={(e) => setWhatsappName(e.target.value)}
                  placeholder={t("roi.enterName")}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => {
                      let value = e.target.value;

                      // Remove everything except digits
                      value = value.replace(/\D/g, "");

                      // Limit to 10 digits max
                      if (value.length > 10) {
                        value = value.slice(0, 10);
                      }

                      setWhatsappNumber(value);

                      if (value.trim()) {
                        setWhatsappNumberError("");
                      }
                    }}
                    placeholder={t("roi.enterWhatsAppNumber")}
                    className={`flex-1 bg-gray-700 border rounded-lg py-2 px-3 text-white placeholder-gray-500 text-sm focus:outline-none transition-colors ${
                      whatsappNumberError
                        ? "border-red-500"
                        : "border-gray-600 focus:border-blue-500"
                    }`}
                  />
                  <button
                    onClick={() => {
                      const phoneRegex = /^\+91[6-9]\d{9}$/;
                      let hasError = false;

                      if (!whatsappName.trim()) {
                        setWhatsappNameError(t("roi.nameRequired"));
                        hasError = true;
                      }

                      if (!whatsappNumber.trim()) {
                        setWhatsappNumberError(t("roi.phoneRequired"));
                        hasError = true;
                      } else if (!/^[6-9]\d{9}$/.test(whatsappNumber.trim())) {
                        setWhatsappNumberError(
                          "Enter a valid 10-digit Indian mobile number",
                        );
                        hasError = true;
                      } else if (
                        whatsappRecipients.some(
                          (r) => r.number === whatsappNumber.trim(),
                        )
                      ) {
                        setWhatsappNumberError(
                          t("roi.phoneNumberAlreadyAdded"),
                        );
                        hasError = true;
                      }

                      if (hasError) return;

                      setWhatsappRecipients([
                        ...whatsappRecipients,
                        {
                          number: whatsappNumber.trim(),
                          name: whatsappName.trim(),
                        },
                      ]);
                      setWhatsappNumber("");
                      setWhatsappName("");
                      setWhatsappNumberError("");
                      setWhatsappNameError("");
                    }}
                    className="bg-[#3885CC] hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    +
                  </button>
                </div>
                {whatsappNumberError && (
                  <p className="text-red-500 text-xs mt-1">
                    {whatsappNumberError}
                  </p>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {whatsappRecipients.map((recipient, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    {recipient.name} ({recipient.number})
                    <button
                      onClick={() =>
                        setWhatsappRecipients(
                          whatsappRecipients.filter(
                            (r) => r.number !== recipient.number,
                          ),
                        )
                      }
                      className="text-red-400 hover:text-red-600"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* Email Notification */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <IoMailOutline size={20} color="white" />
                <span className="font-semibold text-white">
                  {t("roi.emailNotification")}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotification}
                  onChange={() => setEmailNotification(!emailNotification)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t("roi.enableEmailAlerts")}
              </label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={emailName}
                  onChange={(e) => setEmailName(e.target.value)}
                  placeholder={t("roi.enterName")}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => {
                      setEmailAddress(e.target.value);
                      if (e.target.value.trim()) {
                        setEmailAddressError("");
                      }
                    }}
                    placeholder={t("roi.enterEmailAddress")}
                    className={`flex-1 bg-gray-700 border rounded-lg py-2 px-3 text-white placeholder-gray-500 text-sm focus:outline-none transition-colors ${
                      emailAddressError
                        ? "border-red-500"
                        : "border-gray-600 focus:border-blue-500"
                    }`}
                  />
                  <button
                    onClick={() => {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      let hasError = false;

                      if (!emailName.trim()) {
                        setEmailNameError(t("roi.nameRequired"));
                        hasError = true;
                      }

                      if (!emailAddress.trim()) {
                        setEmailAddressError(t("roi.emailRequired"));
                        hasError = true;
                      } else if (!emailRegex.test(emailAddress.trim())) {
                        setEmailAddressError(t("roi.invalidEmailFormat"));
                        hasError = true;
                      } else if (
                        emailRecipients.some(
                          (r) => r.email === emailAddress.trim(),
                        )
                      ) {
                        setEmailAddressError(t("roi.emailAlreadyAdded"));
                        hasError = true;
                      }

                      if (hasError) return;

                      setEmailRecipients([
                        ...emailRecipients,
                        { email: emailAddress.trim(), name: emailName.trim() },
                      ]);
                      setEmailAddress("");
                      setEmailName("");
                      setEmailAddressError("");
                      setEmailNameError("");
                    }}
                    className="bg-[#3885CC] hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    +
                  </button>
                </div>
                {emailAddressError && (
                  <p className="text-red-500 text-xs mt-1">
                    {emailAddressError}
                  </p>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {emailRecipients.map((recipient, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    {recipient.name} ({recipient.email})
                    <button
                      onClick={() =>
                        setEmailRecipients(
                          emailRecipients.filter(
                            (r) => r.email !== recipient.email,
                          ),
                        )
                      }
                      className="text-red-400 hover:text-red-600"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Camera Button */}
      <div className="bg-[#30313F] flex justify-between items-center rounded-lg p-4 mb-6">
        <p className="text-white font-medium">{t("roi.saveCamera")}</p>

        <div className="flex gap-3">
          <button
            onClick={resetForm}
            className="bg-[#4D4D4D] text-sm text-white font-semibold py-2 px-6 rounded-full transition-colors hover:bg-gray-600"
          >
            {t("roi.clear")}
          </button>
          <button
            onClick={handleSaveRoi}
            className="bg-[#3885CC] text-sm text-white font-semibold py-2 px-6 rounded-full transition-colors hover:bg-blue-600"
          >
            {currentRoiId ? t("roi.updateRoi") : t("roi.saveRoi")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ROIConfiguration;
