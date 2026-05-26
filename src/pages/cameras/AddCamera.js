import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { bgcolors, textcolors, textSizes, borderstyles, buttons, colors, shadows } from "../../theme";
import LocationFormModal from "../../component/LocationFormModal";
import { useLoadScript } from "@react-google-maps/api";

import {
  ArrowBackIcon,
  EditIcon,
  TrashIcon,
  MailIcon,
  PhoneIcon,
  ChatIcon,
  ChevronDownIcon,
  CloseCircleIcon,
  VideoIcon,
  WifiIcon,
  BanIcon,
  HeartIcon,
  SpinnerIcon,
} from "../../icons";
import {
  createCamera,
  updateCamera,
  testCameraConnection,
  getCameraSnapshot,
  getCameras,
} from "../../features/cameras/cameraApiSlice";
import {
  getLocations,
  createLocation,
} from "../../features/locations/locationApiSlice";
import {
  getRois,
  deleteRoi,
  updateRoiStatus,
} from "../../features/cameras/roilistslice";
import { toast } from "react-toastify";
import CreatableSelect from "../../component/CreatableSelect";
import "react-toastify/dist/ReactToastify.css";
import CameraHealthModal from "./Camerahealthmodal";

const libraries = ["places"];
const AddCamera = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const current_cameraId = searchParams.get("id");

  // Load Google Maps (required for LocationFormModal)
  const { isLoaded: isMapLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Redux State
  const { cameras, isLoading, error, testConnectionResult, snapshotResult } =
    useSelector((state) => state.cameraApi);

  const { locations, isLoading: locationsLoading } = useSelector(
    (state) => state.locationApi,
  );

  const { rois: roiList, isLoading: roisLoading } = useSelector(
    (state) => state.roilist,
  );

  // Get tenant_id from auth state - Update this based on your auth implementation
  const tenantId = localStorage.getItem("tenant_id");

  // Component State
  const [cameraName, setCameraName] = useState("");
  const [location, setLocation] = useState("");
  const [rtspUrl, setRtspUrl] = useState("");
  const [cameraType, setCameraType] = useState("ip");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedRoiId, setSelectedRoiId] = useState(null);
  const [isConnectionTested, setIsConnectionTested] = useState(false);
  const [isCameraSaved, setIsCameraSaved] = useState(false);
  const [cameraId, setCameraId] = useState(current_cameraId); // Store new camera ID
  const [isAddingRoi, setIsAddingRoi] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("inactive"); // Camera enable/disable state
  const [cameraErrorMessage, setCameraErrorMessage] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [openRoiDropdownId, setOpenRoiDropdownId] = useState(null);
  const [roiDropdownCoords, setRoiDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  // Fetch locations on component mount
  useEffect(() => {
    console.log("tenant id", tenantId);
    if (tenantId) {
      dispatch(getLocations({ tenantId }));
    }
  }, [dispatch, tenantId]);

  // Fetch cameras if editing
  useEffect(() => {
    if (cameraId && tenantId) {
      dispatch(getCameras({ tenantId, cameraId: parseInt(cameraId) }));
      dispatch(getRois({ tenantId, cameraId: parseInt(cameraId) }));
      // For existing cameras, mark as saved and connection tested
      setIsCameraSaved(true);
      setIsConnectionTested(true);
      setCameraId(parseInt(cameraId)); // Set the camera ID for editing case
      console.log("roi list", roiList, cameras);
    }
  }, [dispatch, cameraId, tenantId]);

  // Populate form when editing
  useEffect(() => {
    if (cameraId && cameras.length > 0) {
      const cameraToEdit = cameras.find(
        (camera) => camera.id === parseInt(cameraId),
      );
      if (cameraToEdit) {
        setCameraName(cameraToEdit.name || "");
        setLocation(cameraToEdit.location_id || "");
        setRtspUrl(cameraToEdit.rtsp_url || "");
        setCameraType(cameraToEdit.camera_type || "ip");
        setUsername(cameraToEdit.username || "");
        setPassword(cameraToEdit.password || "");
        setCameraStatus(cameraToEdit.status || "inactive"); // Set camera status
        setCameraErrorMessage(cameraToEdit.meta?.error_message || null); // Set potential error message
      } else {
        toast.error(t("addCamera.cameraNotFound"));
        navigate("/camera");
      }
    }
  }, [cameraId, cameras, navigate, t]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Close status dropdown on outside click
  useEffect(() => {
    if (!isStatusDropdownOpen) return;
    const handler = () => setIsStatusDropdownOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [isStatusDropdownOpen]);

  // Close ROI dropdown on outside click
  useEffect(() => {
    if (!openRoiDropdownId) return;
    const handler = () => setOpenRoiDropdownId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openRoiDropdownId]);

  // Reset flags when form data changes for new cameras
  useEffect(() => {
    if (!cameraId) {
      setIsConnectionTested(false);
      setIsCameraSaved(false);
      setCameraId(null); // Reset camera ID when form changes
    }
  }, [cameraName, location, rtspUrl, cameraType, username, password, cameraId]);

  // Format detection type for display
  const formatDetectionType = (type) => {
    const typeMap = {
      ALL_DETECTION: "All Detection",
      PERSON_DETECTION: "Person Detection",
      VEHICLE_DETECTION: "Vehicle Detection",
      MOTION_DETECTION: "Motion Detection",
      WEAPON_DETECTION: "Weapon Detection",
      FIRE_DETECTION: "Fire Detection",
      IDIE_VEHICLE: "IDIE Vehicle",
    };
    return typeMap[type] || type;
  };

  // Format alert priority for display
  const formatAlertPriority = (priority) => {
    if (!priority) return "Medium";
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  };

  // Validation
  const validateForm = () => {
    if (!cameraName.trim()) {
      toast.error(t("addCamera.cameraNameRequired"));
      return false;
    }
    if (!location) {
      toast.error(t("addCamera.locationRequired"));
      return false;
    }
    if (!rtspUrl.trim()) {
      toast.error(t("addCamera.rtspUrlRequired"));
      return false;
    }
    return true;
  };

  const handleSaveCamera = () => {
    if (!validateForm()) return;

    // For new cameras, require connection test first
    // if (!cameraId && !isConnectionTested) {
    //   toast.error('Please test the connection before saving the camera.')
    //   return
    // }

    const cameraData = {
      tenant_id: tenantId,
      name: cameraName.trim(),
      rtsp_url: rtspUrl.trim(),
      username: username.trim(),
      password: password,
      camera_type: "ip",
      status: cameraStatus, // Include camera status
      location_id: parseInt(location),
      // location_id: 300,
      meta: {},
    };

    if (cameraId) {
      dispatch(
        updateCamera({
          tenantId,
          cameraId: parseInt(cameraId),
          cameraData,
        }),
      )
        .unwrap()
        .then(() => {
          toast.success(t("addCamera.cameraUpdateSuccess"));
          navigate("/camera");
        })
        .catch((err) => {
          toast.error(err || t("addCamera.cameraUpdateFailed"));
        });
    } else {
      dispatch(createCamera({ tenantId, cameraData }))
        .unwrap()
        .then((result) => {
          console.log(result);
          toast.success(t("addCamera.cameraAddSuccess"));
          setIsCameraSaved(true);
          console.log(result);
          // Store the new camera ID
          if (result.id) {
            setCameraId(result.id);
          }
        })
        .catch((err) => {
          console.log(err);
          // toast.error(err || t('addCamera.cameraAddFailed'))
        });
    }
  };

  const handleTestConnection = () => {
    if (!rtspUrl.trim()) {
      toast.warn(t("addCamera.rtspUrlWarning"));
      return false;
    }
    toast.info(t("addCamera.testingConnectionMessage"));
    setIsTestingConnection(true);
    const connectionData = {
      rtsp_url: rtspUrl.trim(),
      username: "",
      password: "",
    };

    return dispatch(testCameraConnection({ tenantId, connectionData }))
      .unwrap()
      .then((result) => {
        setIsTestingConnection(false);
        setIsConnectionTested(true);
        toast.success(result.message || t("addCamera.testConnectionSuccess"));
        return true;
      })
      .catch((err) => {
        console.log(err);
        setIsTestingConnection(false);
        setIsConnectionTested(false);
        // toast.error(err.message);
        // The error is now handled by the useEffect, but we still need to return false for the async flow
        return false;
      });
    return false;
  };

  const handleAddCameraWithTest = async () => {
    if (!validateForm()) return;

    // If connection is already tested, just save the camera
    if (!isConnectionTested) {
      const status = await handleTestConnection();
      console.log("1", status);
      if (status) {
        console.log("2", status);
        handleSaveCamera();
      }
      return;
    } else {
      handleSaveCamera();
      console.log("3");
    }

    return;
  };

  const handleAddRoi = () => {
    setIsAddingRoi(true);

    // For new cameras, check if camera is saved and connection is tested
    if (!cameraId) {
      if (!isCameraSaved) {
        toast.error(t("addCamera.saveCameraBeforeRoi"));
        return;
      }
      if (!isConnectionTested) {
        toast.error(t("addCamera.testConnectionBeforeRoi"));
        return;
      }
      if (!cameraId) {
        toast.error(t("addCamera.cameraIdNotFound"));
        return;
      }
    }

    const toastId = toast.loading(t("addCamera.retrievingFrame"));

    dispatch(
      getCameraSnapshot({
        tenantId,
        cameraId: cameraId,
        rtsp_url: rtspUrl,
        username: "",
        password: "",
      }),
    )
      .unwrap()
      .then((result) => {
        toast.dismiss(toastId);
        setIsAddingRoi(false);
        setIsAddingRoi(false);
        console.log(result);
        toast.success(t("addCamera.frameRetrievedSuccess"), { id: toastId });

        navigate("/roi-configuration", {
          state: {
            rtsp_url: rtspUrl,
            snapshot: result.frame_url,
            cameraId: cameraId,
            tenantId,
            addnew: true,
          },
        });
      })
      .catch((err) => {
        toast.dismiss(toastId);
        setIsAddingRoi(false);
        setIsAddingRoi(false);

        // Update toast to error
        toast.error(err || t("addCamera.snapshotError"), { id: toastId });
      });
  };

  const handleEditRoi = (roi) => {
    console.log(roi.id);
    console.log(roi);
    // return
    navigate("/roi-configuration", {
      state: {
        rtsp_url: rtspUrl,
        snapshot: roi.frame_url,
        cameraId: parseInt(cameraId),
        tenantId,
        roiToEdit: roi, // Pass the entire ROI object for editing
        currentRoi_Id: roi.id,
        status: roi.status,
      },
    });
  };

  const handleDeleteRoi = (roiId) => {
    setSelectedRoiId(roiId);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    if (!selectedRoiId) return;
    dispatch(
      deleteRoi({
        tenantId,
        cameraId: parseInt(cameraId),
        roiId: selectedRoiId,
      }),
    )
      .unwrap()
      .then(() => {
        toast.success(t("addCamera.roiDeleteSuccess"));
        dispatch(getRois({ tenantId, cameraId: parseInt(cameraId) }));
      })
      .catch((err) => {
        toast.error(err || t("addCamera.roiDeleteFailed"));
      })
      .finally(() => {
        setShowConfirm(false);
        setSelectedRoiId(null);
      });
  };
  const handleCreateLocation = (locationName) => {
    const locationData = {
      tenant_id: tenantId,
      name: locationName,
      meta: {},
    };
    dispatch(createLocation({ tenantId, locationData }))
      .unwrap()
      .then((newLocation) => {
        toast.success(
          t("addCamera.locationCreateSuccess", { name: newLocation.name }),
        );
        setLocation(newLocation.id);
        dispatch(getLocations({ tenantId })); // Refresh locations
        setIsLocationModalOpen(false);
      })
      .catch((err) => {
        toast.error(err || t("addCamera.locationCreateFailed"));
      });
  };

  const handleOpenLocationModal = () => {
    setIsLocationModalOpen(true);
  };
  // Handle ROI status change (non-functional for now)
  const handleRoiStatusChange = (roiId, newStatus) => {
    if (!cameraId || !tenantId) {
      toast.error(t("addCamera.cameraIdOrTenantIdNotFound"));
      return;
    }

    dispatch(
      updateRoiStatus({
        tenantId,
        cameraId: parseInt(cameraId),
        roiId,
        status: newStatus,
      }),
    )
      .unwrap()
      .then(() => {
        toast.success(
          t("addCamera.roiStatusUpdateSuccess", {
            status:
              newStatus === "active"
                ? t("common.enabled")
                : t("common.disabled"),
          }),
        );
        // Refresh the ROI list to get updated data
        dispatch(getRois({ tenantId, cameraId: parseInt(cameraId) }));
      })
      .catch((err) => {
        toast.error(err || t("addCamera.roiStatusUpdateFailed"));
        // Revert the select value by refreshing the ROI list
        dispatch(getRois({ tenantId, cameraId: parseInt(cameraId) }));
      });
  };

  const isActive = cameraStatus === "active";

  // Utility function to determine status display details
  const getStatusDisplay = (status) => {
    switch (status) {
      case "active":
        return { icon: WifiIcon, text: t("common.active"), color: textcolors.success };
      case "inactive":
        return { icon: BanIcon, text: t("common.inactive"), color: textcolors.muted };
      case "error":
        return { icon: CloseCircleIcon, text: t("common.error"), color: textcolors.danger };
      case "processing":
        return { icon: SpinnerIcon, text: t("common.processing"), color: `${textcolors.warning} animate-spin` };
      default:
        return { icon: BanIcon, text: t("common.unknown"), color: textcolors.muted };
    }
  };

  // Component to display the camera status
  const CameraStatusDisplay = ({ status, errorMessage }) => {
    const { icon: Icon, text, color } = getStatusDisplay(status);

    return (
      <div className="flex items-center gap-1">
        <Icon size={20} className={color} />
        <div>
          <span className={`text-sm font-medium ${color}`}>{text}</span>
          {status === "error" && errorMessage && (
            <p className={`text-xs ${textcolors.danger} mt-1 max-w-xs truncate`}>
              {t("common.error")}: {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`${bgcolors.surface} p-4 sm:p-6 lg:p-8 min-h-screen`}>
      {showConfirm && (
        <div className={`fixed inset-0 flex items-center justify-center ${bgcolors.modalOverlay} z-50`}>
          <div className={`${bgcolors.white} rounded-2xl p-6 w-[90%] max-w-sm ${borderstyles.light} shadow-2xl text-center`}>
            <h3 className={`text-lg font-bold ${textcolors.normaltext} mb-2`}>
              {t("addCamera.confirmDeletionTitle")}
            </h3>
            <p className={`${textcolors.dim} text-sm mb-6`}>
              {t("addCamera.confirmDeletionMessage")}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmDelete}
                className={`${buttons.danger} px-5 py-2.5 rounded-xl`}
              >
                {t("common.delete")}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className={`${buttons.secondary} px-5 py-2.5 rounded-xl`}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
        <div>
          <h1 className={`text-3xl font-bold flex items-center gap-3 ${textcolors.dark}`}>
            <VideoIcon size={35} />
            {cameraId ? t('addCamera.editTitle') : t('addCamera.addTitle')}
          </h1>
          <p className={`mt-1 ${textcolors.dim} text-sm`}>
            {cameraId
              ? t("addCamera.editDescription")
              : t("addCamera.addDescription")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {cameraId && (
            <button
              onClick={() => setShowHealthModal(true)}
              className={`flex items-center gap-2 ${buttons.success} py-2.5 px-6 rounded-full transition-colors shrink-0`}
            >
              <HeartIcon size={18} />
              {"Camera Health"}
            </button>
          )}
          <Link to="/camera">
            <button className={`flex items-center gap-2 ${buttons.primary} py-2.5 px-5 rounded-full shrink-0`}>
              <ArrowBackIcon size={18} />
              {t("addCamera.backButton")}
            </button>
          </Link>
        </div>
      </div>

      <div className={`${bgcolors.white} rounded-xl p-4 sm:p-6 ${borderstyles.light} shadow-sm`}>
        <h2 className={`text-lg font-semibold mb-6 ${textcolors.normaltext}`}>
          {cameraId
            ? t("addCamera.editCameraDetails")
            : t("addCamera.addCameraDetails")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Camera Name */}
          <div>
            <label className={`block ${textcolors.normaltext} mb-2 text-sm font-medium`}>
              {t("cameraSetup.cameraNameLabel")} <span style={{ color: colors.danger }}>*</span>
            </label>
            <input
              type="text"
              className={`w-full ${bgcolors.surface} ${borderstyles.light} rounded-lg py-2.5 px-4 ${textcolors.normaltext} ${textcolors.placeholder} focus:outline-none ${borderstyles.focusRing} ${textSizes.subtitle}`}
              placeholder={t("cameraSetup.cameraNamePlaceholder")}
              value={cameraName}
              onChange={(e) => setCameraName(e.target.value)}
            />
          </div>

          {/* Location Dropdown */}
          <div>
            <label className={`block ${textcolors.normaltext} mb-2 text-sm font-medium`}>
              {t("cameraSetup.locationLabel")} <span style={{ color: colors.danger }}>*</span>
            </label>
            <div className="relative">
              <CreatableSelect
                options={locations}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onCreate={handleCreateLocation}
                onCreateNew={handleOpenLocationModal}
                placeholder={
                  locationsLoading
                    ? "Loading locations..."
                    : t("cameraSetup.locationPlaceholder") || "Select Location"
                }
                disabled={locationsLoading}
              />
            </div>
          </div>

          {/* RTSP URL */}
          <div>
            <label className={`block ${textcolors.normaltext} mb-2 text-sm font-medium`}>
              {t("cameraSetup.rtspUrlLabel")} <span style={{ color: colors.danger }}>*</span>
            </label>
            <input
              type="text"
              className={`w-full ${bgcolors.surface} ${borderstyles.light} rounded-lg py-2.5 px-4 ${textcolors.normaltext} ${textcolors.placeholder} focus:outline-none ${borderstyles.focusRing} ${textSizes.subtitle}`}
              placeholder={
                "rtsp://[username]:[password]@[domain_or_ip]:[port]/[stream_path]"
              }
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
            />
          </div>

          {/* Camera Status Display and Control */}
          {cameraId && (
            <div className="flex flex-col">
              <div>
                <label className={`block ${textcolors.normaltext} mb-2 text-sm font-medium`}>
                  {t("addCamera.statusControlLabel")}
                </label>
                <div className="relative">
                  <div
                    className={`w-full ${bgcolors.surface} ${borderstyles.light} rounded-lg py-2.5 px-4 pr-10 ${textcolors.normaltext} ${textSizes.subtitle} cursor-pointer select-none`}
                    onClick={(e) => { e.stopPropagation(); setIsStatusDropdownOpen((prev) => !prev); }}
                  >
                    {cameraStatus === "active" || cameraStatus === "processing"
                      ? `${t("common.active")} (${t("common.enable")})`
                      : `${t("common.inactive")} (${t("common.disable")})`}
                    <ChevronDownIcon
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${textcolors.muted} pointer-events-none transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                      size={16}
                    />
                  </div>
                  {isStatusDropdownOpen && (
                    <div
                      className={`absolute z-10 w-full mt-1 ${bgcolors.white} ${borderstyles.light} rounded-xl shadow-lg overflow-hidden`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {[
                        { value: "active", label: `${t("common.active")} (${t("common.enable")})` },
                        { value: "inactive", label: `${t("common.inactive")} (${t("common.disable")})` },
                      ].map((opt) => (
                        <div
                          key={opt.value}
                          className={`px-4 py-2.5 ${textSizes.subtitle} cursor-pointer transition-colors ${
                            (cameraStatus === "active" || cameraStatus === "processing"
                              ? "active"
                              : "inactive") === opt.value
                              ? `${bgcolors.accentLight} ${textcolors.primary} font-medium`
                              : `${textcolors.normaltext} ${bgcolors.accentHover} ${textcolors.accentHover}`
                          }`}
                          onClick={() => {
                            setCameraStatus(opt.value);
                            setIsStatusDropdownOpen(false);
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Camera Type */}
          {/* <div>
            <label className='block text-white mb-2 text-sm font-medium'>
              {t('cameraSetup.cameraTypeLabel')} *
            </label>
            <div className='relative'>
              <select
                className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 pr-10 text-white focus:outline-none focus:border-gray-500 text-sm appearance-none cursor-pointer'
                value={cameraType}
                onChange={e => setCameraType(e.target.value)}
              >
                <option value='ip'>IP Camera</option>
                <option value='analog'>Analog Camera</option>
                <option value='thermal'>Thermal Camera</option>
                <option value='ptz'>PTZ Camera</option>
              </select>
              <ChevronDownIcon
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
                size={16}
              />
            </div>
          </div> */}

          {/* Username */}
          {/* <div>
            <label className='block text-white mb-2 text-sm font-medium'>
              {t('cameraSetup.usernameLabel')}
            </label>
            <input
              type='text'
              className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 text-sm'
              placeholder={t('cameraSetup.usernamePlaceholder')}
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div> */}

          {/* Password */}
          {/* <div>
            <label className='block text-white mb-2 text-sm font-medium'>
              {t('cameraSetup.passwordLabel')}
            </label>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 text-sm'
                placeholder={t('cameraSetup.passwordPlaceholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type='button'
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <IoEyeOffOutline size={18} />
                ) : (
                  <IoEyeOutline size={18} />
                )}
              </button>
            </div>
          </div> */}
        </div>
        {cameras.status === "error" && cameras.meta?.error?.message && (
          <p className={`mt-2 text-xs ${textcolors.danger}`}>
            <span className="text-sm">Error: </span>
            {cameras.meta.error.message}
          </p>
        )}
        {/* Test Connection Section */}
        <div className={`mt-8 pt-6 ${borderstyles.separator}`}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="flex gap-2 items-center justify-center">
                <label className={`block ${textcolors.normaltext} text-sm font-medium`}>
                  {t("addCamera.currentStatusLabel")}
                </label>
                {/* Display Current Status (Active, Inactive, Error, Processing) */}
                <CameraStatusDisplay
                  status={cameraStatus}
                  errorMessage={cameraErrorMessage}
                />
              </div>
              {testConnectionResult && (
                <></>
                // <p
                //   className={`text-sm mt-2 ${
                //     testConnectionResult.success === true
                //       ? 'text-green-400'
                //       : 'text-red-400'
                //   }`}
                // >
                //   {testConnectionResult.success === true ? (
                //     <>{t('common.connectionSuccessful')}</>
                //   ) : (
                //     <>{t('common.connectionFailed')}</>
                //   )}
                // </p>
              )}

              {!cameraId && isConnectionTested && (
                <p className={`${textcolors.success} text-sm mt-1`}>
                  {t("addCamera.connectionTestedSuccessfully")}
                </p>
              )}
              {/* {!cameraId && cameraId && (
                <p className='text-blue-400 text-sm mt-1'>
                  ✓ Camera ID: {cameraId}
                </p>
              )} */}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className={`${buttons.secondary} py-2.5 px-5 rounded-full text-sm`}
                onClick={() => navigate("/camera")}
              >
                {t("addCamera.cancelButton") || "Cancel"}
              </button>
              <button
                className={`${buttons.primary} py-2.5 px-5 rounded-full text-sm disabled:bg-gray-300 disabled:cursor-not-allowed`}
                onClick={handleTestConnection}
                disabled={isTestingConnection}
              >
                {isTestingConnection
                  ? t("addCamera.testingConnection") || "Testing..."
                  : t("cameraSetup.testConnectionButton") || "Test Connection"}
              </button>
              <button
                className={`${buttons.primary} py-2.5 px-5 rounded-full text-sm disabled:bg-gray-300 disabled:cursor-not-allowed`}
                onClick={handleAddCameraWithTest}
                disabled={isLoading || isTestingConnection || isAddingRoi}
              >
                {isAddingRoi
                  ? t("common.submit")
                  : !isTestingConnection && isLoading
                    ? t("addCamera.addingCamera")
                    : t("addCamera.addCameraButton")}
              </button>

              {/* {cameraId && (
                <button
                  className='bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-full transition-colors text-sm disabled:bg-gray-600 disabled:cursor-not-allowed'
                  onClick={handleSaveCamera}
                  disabled={isLoading}
                >
                  {isAddingRoi
                    ? 'Save Changes'
                    : isLoading
                    ? t('addCamera.savingChanges') || 'Saving...'
                    : t('addCamera.saveChangesButton') || 'Save Changes'}
                </button>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* ROI List Section */}
      <div className={`${bgcolors.white} rounded-xl p-4 sm:p-6 ${borderstyles.light} shadow-sm mt-6`}>
        {!cameraId ? (
          // No Camera Selected (for new cameras)
          <div className="text-center py-12">
            <h3 className={`text-2xl ${textcolors.normaltext} font-bold mb-2`}>
              {isCameraSaved
                ? t("addCamera.cameraSavedSuccessfully")
                : t("addCamera.noCameraSaved")}
            </h3>
            <p className={`${textcolors.dim} mb-6 text-sm`}>
              {isCameraSaved
                ? t("addCamera.canNowAddRois")
                : t("addCamera.saveCameraFirstToAddRois")}
            </p>
            {/* {cameraId && (
              <p className='text-blue-400 text-sm mb-4'>
                Camera ID: {cameraId}
              </p>
            )} */}
            <button
              onClick={handleAddRoi}
              disabled={!isCameraSaved || !cameraId || !isActive}
              className={`flex items-center gap-2 py-2.5 px-5 rounded-full mx-auto ${isCameraSaved && cameraId && isActive
                ? `${buttons.primary}`
                : `${bgcolors.disabledBg} ${textcolors.muted} cursor-not-allowed`
                }`}
            >
              <span className="text-lg">+</span>
              <span className="text-sm">{t("addCamera.addRoiButton")}</span>
            </button>
            {!isCameraSaved && (
              <p className={`${textcolors.warning} text-sm mt-2`}>
                {t("addCamera.pleaseSaveCameraFirst")}
              </p>
            )}
            {isCameraSaved && !cameraId && (
              <p className={`${textcolors.warning} text-sm mt-2`}>
                {t("addCamera.cameraIdNotAvailable")}
              </p>
            )}
            {isCameraSaved && cameraId && !isActive && (
              <p className={`${textcolors.warning} text-sm mt-2`}>
                {t("addCamera.activateCameraToAddRoi")}
              </p>
            )}
          </div>
        ) : roiList.length === 0 ? (
          // Camera Selected but No ROI Found
          <div className='text-center py-12'>
            <h3 className={`text-2xl ${textcolors.normaltext} font-bold mb-2`}>
              {t('addCamera.noRoiFound')}
            </h3>
            <p className={`${textcolors.dim} mb-6 text-sm`}>
              {t("addCamera.noRoiForThisCamera")}
            </p>
            <button
              onClick={handleAddRoi}
              disabled={!isActive}
              className={`flex items-center gap-2 py-2.5 px-5 rounded-full mx-auto transition-colors ${isActive ? buttons.primary : `${bgcolors.disabledBg} ${textcolors.muted} cursor-not-allowed`}`}
            >
              <span className="text-lg">+</span>
              <span className="text-sm">{t("addCamera.addRoiButton")}</span>
            </button>
            {!isActive && (
              <p className={`${textcolors.warning} text-sm mt-3`}>
                {t("addCamera.activateCameraToAddRoi")}
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <h3 className={`text-lg font-semibold ${textcolors.normaltext}`}>
                {t("addCamera.roiListTitle")}
              </h3>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleAddRoi}
                  disabled={!isActive}
                  title={!isActive ? (t("addCamera.activateCameraToAddRoi")) : undefined}
                  className={`flex items-center gap-2 py-2.5 px-5 rounded-full transition-colors ${isActive ? buttons.primary : `${bgcolors.disabledBg} ${textcolors.muted} cursor-not-allowed`}`}
                >
                  <span className="text-xl leading-none">+</span>
                  <span className="text-sm">{t("addCamera.addRoiButton")}</span>
                </button>
                {!isActive && (
                  <p className={`${textcolors.warning} text-xs`}>
                    {t("addCamera.activateCameraToAddRoi")}
                  </p>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${bgcolors.tableHeader} ${borderstyles.tableHeader}`}>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${textcolors.dim}`}>
                      {t("addCamera.roiNameHeader")}
                    </th>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${textcolors.dim}`}>
                      {t("addCamera.detectionTypeHeader")}
                    </th>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${textcolors.dim}`}>
                      {t("addCamera.alertPriorityHeader")}
                    </th>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${textcolors.dim}`}>
                      {t("common.status")}
                    </th>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${textcolors.dim}`}>
                      {t("addCamera.enableDisableHeader")}
                    </th>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${textcolors.dim}`}>
                      {t("addCamera.notificationsHeader")}
                    </th>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${textcolors.dim}`}>
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roiList.map((roi, index) => (
                    <tr
                      key={index}
                      className={`${borderstyles.tableHeader} ${bgcolors.accentHoverSubtle} transition-colors`}
                    >
                      <td className={`py-4 px-4 text-sm ${textcolors.normaltext}`}>
                        {roi.name}
                      </td>
                      <td className={`py-4 px-4 text-sm ${textcolors.dim}`}>
                        {formatDetectionType(roi.detection_type)}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${roi.alert_priority === "high"
                            ? `${bgcolors.dangerLight} ${textcolors.dangerDark}`
                            : roi.alert_priority === "medium"
                              ? `${bgcolors.warningLight} ${textcolors.warningDark}`
                              : `${bgcolors.successLighter} ${textcolors.successDark}`
                            }`}
                        >
                          {formatAlertPriority(roi.alert_priority)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${roi.status === "active"
                            ? `${bgcolors.successLighter} ${textcolors.successDark}`
                            : `${bgcolors.dangerLight} ${textcolors.dangerDark}`
                            }`}
                        >
                          {roi.status === "active"
                            ? t("common.active")
                            : t("common.inactive")}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <div
                          className={`flex items-center justify-between gap-2 ${bgcolors.surface} ${borderstyles.light} rounded-lg py-1.5 px-3 text-xs cursor-pointer select-none ${textcolors.normaltext}`}
                          style={{ border: openRoiDropdownId === roi.id ? `1px solid ${colors.accent}` : undefined, minWidth: 90 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openRoiDropdownId === roi.id) {
                              setOpenRoiDropdownId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setRoiDropdownCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                              setOpenRoiDropdownId(roi.id);
                            }
                          }}
                        >
                          <span>{roi.status === "active" ? t("common.enable") : t("common.disable")}</span>
                          <span style={{ display: "inline-flex", transition: "transform 0.2s", transform: openRoiDropdownId === roi.id ? "rotate(180deg)" : "rotate(0deg)" }}>
                            <ChevronDownIcon size={12} className={textcolors.muted} />
                          </span>
                        </div>
                        {openRoiDropdownId === roi.id && ReactDOM.createPortal(
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ position: "fixed", top: roiDropdownCoords.top, left: roiDropdownCoords.left, width: Math.max(roiDropdownCoords.width, 110), backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 10, boxShadow: shadows.menu, zIndex: 9999, overflow: "hidden" }}
                          >
                            {[
                              { value: "active", label: t("common.enable") },
                              { value: "inactive", label: t("common.disable") },
                            ].map((opt) => (
                              <div
                                key={opt.value}
                                onClick={() => { handleRoiStatusChange(roi.id, opt.value); setOpenRoiDropdownId(null); }}
                                className="px-3 py-2 text-xs cursor-pointer"
                                style={{ color: roi.status === opt.value ? colors.primary : colors.text, backgroundColor: roi.status === opt.value ? `${colors.primary}12` : "transparent", fontWeight: roi.status === opt.value ? 600 : 400 }}
                                onMouseEnter={e => { if (roi.status !== opt.value) e.currentTarget.style.backgroundColor = colors.bg2 }}
                                onMouseLeave={e => { if (roi.status !== opt.value) e.currentTarget.style.backgroundColor = "transparent" }}
                              >
                                {opt.label}
                              </div>
                            ))}
                          </div>,
                          document.body
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {roi.notification_config?.email?.enabled && (
                            <button
                              className={`p-1.5 rounded ${bgcolors.accentLight} ${textcolors.primary}`}
                              title={t("addCamera.emailNotifications")}
                            >
                              <MailIcon size={16} />
                            </button>
                          )}

                          {roi.notification_config?.call?.enabled && (
                            <button
                              className={`p-1.5 rounded ${bgcolors.successLight} ${textcolors.success}`}
                              title={t("addCamera.callNotifications")}
                            >
                              <PhoneIcon size={16} />
                            </button>
                          )}

                          {roi.notification_config?.whatsapp?.enabled && (
                            <button
                              className={`p-1.5 rounded ${bgcolors.purpleLight} ${textcolors.purple}`}
                              title={t("addCamera.whatsappNotifications")}
                            >
                              <ChatIcon size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => isActive && handleEditRoi(roi)}
                            disabled={!isActive}
                            title={!isActive ? (t("addCamera.activateCameraToAddRoi")) : undefined}
                            className={`p-2 rounded-lg flex items-center justify-center gap-2 px-4 text-[12px] transition-all ${isActive ? `${borderstyles.accentSoft} ${textcolors.accentText} ${bgcolors.accentHover}` : `${borderstyles.light} ${textcolors.disabled} cursor-not-allowed`}`}
                          >
                            <EditIcon size={12} />
                            <p>{t("common.edit")}</p>
                          </button>
                          <button
                            onClick={() => handleDeleteRoi(roi.id)}
                            className={`p-2 rounded-lg ${textcolors.muted} hover:text-red-500 transition-all`}
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {cameraId && (
        <CameraHealthModal
          isOpen={showHealthModal}
          onClose={() => setShowHealthModal(false)}
          cameraId={parseInt(cameraId)}
          cameraName={cameraName}
          tenantId={tenantId}
        />
      )}
      <LocationFormModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        locationToEdit={null}
        isLoaded={isMapLoaded}
      />

      {/* Action Buttons - Only show for editing existing cameras */}
      {/* {cameraId && (
        <div className='mt-6 flex justify-end gap-4'>
          <button
            className='bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-6 rounded-full transition-colors text-sm'
            onClick={() => navigate('/camera')}
          >
            {t('addCamera.cancelButton') || 'Cancel'}
          </button>
          
        </div>
      )} */}
    </div>
  );
};

export default AddCamera;
