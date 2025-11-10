import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { bgcolors } from '../../theme'
import {
  IoArrowBack,
  IoEyeOutline,
  IoPencil,
  IoEye,
  IoTrash,
  IoMailOutline,
  IoCallOutline,
  IoChatbubbleOutline,
  IoEyeOffOutline,
  IoChevronDown
} from 'react-icons/io5'
import {
  createCamera,
  updateCamera,
  testCameraConnection,
  getCameraSnapshot,
  getCameras
} from '../../features/cameras/cameraApiSlice'
import {
  getLocations,
  createLocation
} from '../../features/locations/locationApiSlice'
import {
  getRois,
  deleteRoi,
  updateRoiStatus
} from '../../features/cameras/roilistslice'
import { toast } from 'react-toastify'
import CreatableSelect from '../../component/CreatableSelect'
import 'react-toastify/dist/ReactToastify.css'

const AddCamera = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const current_cameraId = searchParams.get('id')

  // Redux State
  const { cameras, isLoading, error, testConnectionResult, snapshotResult } =
    useSelector(state => state.cameraApi)

  const { locations, isLoading: locationsLoading } = useSelector(
    state => state.locationApi
  )

  const { rois: roiList, isLoading: roisLoading } = useSelector(
    state => state.roilist
  )

  // Get tenant_id from auth state - Update this based on your auth implementation
  const tenantId = localStorage.getItem('tenant_id')

  // Component State
  const [cameraName, setCameraName] = useState('')
  const [location, setLocation] = useState('')
  const [rtspUrl, setRtspUrl] = useState('')
  const [cameraType, setCameraType] = useState('ip')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedRoiId, setSelectedRoiId] = useState(null)
  const [isConnectionTested, setIsConnectionTested] = useState(false)
  const [isCameraSaved, setIsCameraSaved] = useState(false)
  const [cameraId, setCameraId] = useState(current_cameraId) // Store new camera ID
  const [isAddingRoi, setIsAddingRoi] = useState(false)
  const [cameraStatus, setCameraStatus] = useState('active') // Camera enable/disable state

  // Fetch locations on component mount
  useEffect(() => {
    if (tenantId) {
      dispatch(getLocations(tenantId))
    }
  }, [dispatch, tenantId])

  // Fetch cameras if editing
  useEffect(() => {
    if (cameraId && tenantId) {
      dispatch(getCameras({ tenantId, cameraId: parseInt(cameraId) }))
      dispatch(getRois({ tenantId, cameraId: parseInt(cameraId) }))
      // For existing cameras, mark as saved and connection tested
      setIsCameraSaved(true)
      setIsConnectionTested(true)
      setCameraId(parseInt(cameraId)) // Set the camera ID for editing case
      console.log('roi list', roiList)
    }
  }, [dispatch, cameraId, tenantId])

  // Populate form when editing
  useEffect(() => {
    if (cameraId && cameras.length > 0) {
      const cameraToEdit = cameras.find(
        camera => camera.id === parseInt(cameraId)
      )
      if (cameraToEdit) {
        setCameraName(cameraToEdit.name || '')
        setLocation(cameraToEdit.location_id || '')
        setRtspUrl(cameraToEdit.rtsp_url || '')
        setCameraType(cameraToEdit.camera_type || 'ip')
        setUsername(cameraToEdit.username || '')
        setPassword(cameraToEdit.password || '')
        setCameraStatus(cameraToEdit.status || 'inactive') // Set camera status
      } else {
        toast.error('Camera not found.')
        navigate('/camera')
      }
    }
  }, [cameraId, cameras, navigate, t])

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [])

  // Reset flags when form data changes for new cameras
  useEffect(() => {
    if (!cameraId) {
      setIsConnectionTested(false)
      setIsCameraSaved(false)
      setCameraId(null) // Reset camera ID when form changes
    }
  }, [cameraName, location, rtspUrl, cameraType, username, password, cameraId])

  // Format detection type for display
  const formatDetectionType = type => {
    const typeMap = {
      ALL_DETECTION: 'All Detection',
      PERSON_DETECTION: 'Person Detection',
      VEHICLE_DETECTION: 'Vehicle Detection',
      MOTION_DETECTION: 'Motion Detection',
      WEAPON_DETECTION: 'Weapon Detection',
      FIRE_DETECTION: 'Fire Detection',
      IDIE_VEHICLE: 'IDIE Vehicle'
    }
    return typeMap[type] || type
  }

  // Format alert priority for display
  const formatAlertPriority = priority => {
    if (!priority) return 'Medium'
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
  }

  // Validation
  const validateForm = () => {
    if (!cameraName.trim()) {
      toast.error('Camera name is required')
      return false
    }
    if (!location) {
      toast.error('Location is required')
      return false
    }
    if (!rtspUrl.trim()) {
      toast.error('RTSP URL is required')
      return false
    }
    return true
  }

  const handleSaveCamera = () => {
    if (!validateForm()) return

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
      camera_type: 'ip',
      status: cameraStatus, // Include camera status
      location_id: parseInt(location),
      meta: {}
    }

    if (cameraId) {
      dispatch(
        updateCamera({
          tenantId,
          cameraId: parseInt(cameraId),
          cameraData
        })
      )
        .unwrap()
        .then(() => {
          toast.success('Camera updated successfully!')
          navigate('/camera')
        })
        .catch(err => {
          toast.error(err || 'Failed to update camera.')
        })
    } else {
      dispatch(createCamera({ tenantId, cameraData }))
        .unwrap()
        .then(result => {
          toast.success('Camera added successfully!')
          setIsCameraSaved(true)
          console.log(result)
          // Store the new camera ID
          if (result.id) {
            setCameraId(result.id)
          }
        })
        .catch(err => {
          toast.error(err || 'Failed to add camera.')
        })
    }
  }

  const handleTestConnection = () => {
    if (!rtspUrl.trim()) {
      toast.warn('Please enter RTSP URL first')
      return false
    }
    toast.info(
      'Testing your RTSP camera connection...Please wait for few seconds'
    )
    setIsTestingConnection(true)
    const connectionData = {
      rtsp_url: rtspUrl.trim(),
      username: '',
      password: ''
    }

    return dispatch(testCameraConnection({ tenantId, connectionData }))
      .unwrap()
      .then(result => {
        setIsTestingConnection(false)
        setIsConnectionTested(true)
        toast.success(
          result.message ||
            t('addCamera.testConnectionSuccess') ||
            'Connection successful!'
        )
        return true
      })
      .catch(err => {
        console.log(err)
        setIsTestingConnection(false)
        setIsConnectionTested(false)
        toast.error(err)
        return false
      })
    return false
  }

  const handleAddCameraWithTest = async () => {
    if (!validateForm()) return

    // If connection is already tested, just save the camera
    if (!isConnectionTested) {
      const status = await handleTestConnection()
      console.log('1', status)
      if (status) {
        console.log('2', status)
        handleSaveCamera()
      }
      return
    } else {
      handleSaveCamera()
      console.log('3')
    }

    return
  }

  const handleAddRoi = () => {
    setIsAddingRoi(true)

    // For new cameras, check if camera is saved and connection is tested
    if (!cameraId) {
      if (!isCameraSaved) {
        toast.error('Please save the camera first before adding ROI.')
        return
      }
      if (!isConnectionTested) {
        toast.error('Please test the connection first before adding ROI.')
        return
      }
      if (!cameraId) {
        toast.error('Camera ID not found. Please save the camera first.')
        return
      }
    }

    const toastId = toast.loading('Retrieving RTSP frame...')

    dispatch(
      getCameraSnapshot({
        tenantId,
        cameraId: cameraId,
        rtsp_url: rtspUrl,
        username: '',
        password: ''
      })
    )
      .unwrap()
      .then(result => {
        toast.dismiss(toastId)
        setIsAddingRoi(false)
        setIsAddingRoi(false)
        console.log(result)
        toast.success('Frame retrieved successfully!', { id: toastId })

        navigate('/roi-configuration', {
          state: {
            rtsp_url: rtspUrl,
            snapshot: result.frame_url,
            cameraId: cameraId,
            tenantId,
            addnew: true
          }
        })
      })
      .catch(err => {
        toast.dismiss(toastId)
        setIsAddingRoi(false)
        setIsAddingRoi(false)

        // Update toast to error
        toast.error(
          err || t('addCamera.snapshotError') || 'Failed to get snapshot.',
          { id: toastId }
        )
      })
  }

  const handleEditRoi = roi => {
    console.log(roi.id)
    console.log(roi)
    // return
    navigate('/roi-configuration', {
      state: {
        rtsp_url: rtspUrl,
        snapshot: roi.frame_url,
        cameraId: parseInt(cameraId),
        tenantId,
        roiToEdit: roi, // Pass the entire ROI object for editing
        currentRoi_Id: roi.id,
        status: roi.status
      }
    })
  }

  const handleDeleteRoi = roiId => {
    setSelectedRoiId(roiId)
    setShowConfirm(true)
  }

  const confirmDelete = () => {
    if (!selectedRoiId) return
    dispatch(
      deleteRoi({
        tenantId,
        cameraId: parseInt(cameraId),
        roiId: selectedRoiId
      })
    )
      .unwrap()
      .then(() => {
        toast.success('ROI deleted successfully!')
        dispatch(getRois({ tenantId, cameraId: parseInt(cameraId) }))
      })
      .catch(err => {
        toast.error(err || 'Failed to delete ROI.')
      })
      .finally(() => {
        setShowConfirm(false)
        setSelectedRoiId(null)
      })
  }
  const handleCreateLocation = locationName => {
    const locationData = {
      tenant_id: tenantId,
      name: locationName,
      meta: {}
    }
    dispatch(createLocation({ tenantId, locationData }))
      .unwrap()
      .then(newLocation => {
        toast.success(`Location "${newLocation.name}" created successfully!`)
        setLocation(newLocation.id)
        dispatch(getLocations(tenantId)) // Refresh locations
      })
      .catch(err => {
        toast.error(err || 'Failed to create location.')
      })
  }

  // Handle ROI status change (non-functional for now)
  const handleRoiStatusChange = (roiId, newStatus) => {
    if (!cameraId || !tenantId) {
      toast.error('Camera ID or Tenant ID not found')
      return
    }

    dispatch(
      updateRoiStatus({
        tenantId,
        cameraId: parseInt(cameraId),
        roiId,
        status: newStatus
      })
    )
      .unwrap()
      .then(() => {
        toast.success(
          `ROI ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully!`
        )
        // Refresh the ROI list to get updated data
        dispatch(getRois({ tenantId, cameraId: parseInt(cameraId) }))
      })
      .catch(err => {
        toast.error(err || 'Failed to update ROI status')
        // Revert the select value by refreshing the ROI list
        dispatch(getRois({ tenantId, cameraId: parseInt(cameraId) }))
      })
  }

  return (
    <div className={`p-8 ${bgcolors.dark} text-white min-h-screen`}>
      {showConfirm && (
        <div className='fixed inset-0 flex items-center justify-center bg-black/60 z-50'>
          <div className='bg-[#2A2B36] rounded-xl p-6 w-[90%] max-w-sm border border-gray-700 shadow-lg text-center'>
            <h3 className='text-lg font-semibold text-white mb-3'>
              Confirm Deletion
            </h3>
            <p className='text-gray-300 mb-6'>
              Are you sure you want to delete this ROI?
            </p>
            <div className='flex justify-center gap-4'>
              <button
                onClick={confirmDelete}
                className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md'
              >
                Delete
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className='bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>
            {cameraId ? t('addCamera.editTitle') : t('addCamera.addTitle')}
          </h1>
          <p className='text-gray-400 mt-1'>
            {cameraId
              ? t('addCamera.editDescription')
              : t('addCamera.addDescription')}
          </p>
        </div>
        <Link to='/camera'>
          <button className='flex items-center gap-2 bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-full transition-colors'>
            <IoArrowBack size={18} />
            {t('addCamera.backButton')}
          </button>
        </Link>
      </div>

      <div className='bg-[#2A2B36] rounded-xl p-6 border border-gray-700/50'>
        <h2 className='text-lg font-semibold mb-6'>
          {cameraId
            ? t('addCamera.editCameraDetails')
            : t('addCamera.addCameraDetails')}
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
          {/* Camera Name */}
          <div>
            <label className='block text-white mb-2 text-sm font-medium'>
              {t('cameraSetup.cameraNameLabel')} *
            </label>
            <input
              type='text'
              className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 text-sm'
              placeholder={t('cameraSetup.cameraNamePlaceholder')}
              value={cameraName}
              onChange={e => setCameraName(e.target.value)}
            />
          </div>

          {/* Location Dropdown */}
          <div>
            <label className='block text-white mb-2 text-sm font-medium'>
              {t('cameraSetup.locationLabel')} *
            </label>
            <div className='relative'>
              <CreatableSelect
                options={locations}
                value={location}
                onChange={e => setLocation(e.target.value)}
                onCreate={handleCreateLocation}
                placeholder={
                  locationsLoading
                    ? t('addCamera.loadingLocations') || 'Loading locations...'
                    : t('cameraSetup.locationPlaceholder') || 'Select Location'
                }
                disabled={locationsLoading}
              />
            </div>
          </div>

          {/* RTSP URL */}
          <div>
            <label className='block text-white mb-2 text-sm font-medium'>
              {t('cameraSetup.rtspUrlLabel')} *
            </label>
            <input
              type='text'
              className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 text-sm'
              placeholder={
                'rtsp://[username]:[password]@[domain_or_ip]:[port]/[stream_path]'
              }
              value={rtspUrl}
              onChange={e => setRtspUrl(e.target.value)}
            />
          </div>

          {/* Camera Status Dropdown */}
          {cameraId && (
            <div>
              <label className='block text-white mb-2 text-sm font-medium'>
                Camera Status
              </label>
              <div className='relative'>
                <select
                  className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 pr-10 text-white focus:outline-none focus:border-gray-500 text-sm appearance-none cursor-pointer'
                  value={cameraStatus}
                  onChange={e => setCameraStatus(e.target.value)}
                >
                  <option value='active'>Active</option>
                  <option value='inactive'>Inactive</option>
                  <option value='error'>Error</option>
                  <option value='processing'>Processing</option>
                </select>
                <IoChevronDown
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
                  size={16}
                />
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
              <IoChevronDown
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

        {/* Test Connection Section */}
        <div className='mt-8 pt-6 border-t border-gray-700/50'>
          <div className='flex justify-between items-center'>
            <div>
              <h3 className='text-lg font-semibold'>
                {t('cameraSetup.connectionStatusTitle')}
              </h3>
              {testConnectionResult && (
                <p
                  className={`text-sm mt-2 ${
                    testConnectionResult.success === true
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {/* {testConnectionResult.success === true ? (
                    <>✓ {'Connection successful'}</>
                  ) : (
                    <>✗ {'Connection failed'}</>
                  )} */}
                </p>
              )}
              {!cameraId && isConnectionTested && (
                <p className='text-green-400 text-sm mt-1'>
                  ✓ Connection tested successfully
                </p>
              )}
              {/* {!cameraId && cameraId && (
                <p className='text-blue-400 text-sm mt-1'>
                  ✓ Camera ID: {cameraId}
                </p>
              )} */}
            </div>
            <div className='flex items-center gap-4'>
              <button
                className='bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-6 rounded-full transition-colors text-sm'
                onClick={() => navigate('/camera')}
              >
                {t('addCamera.cancelButton') || 'Cancel'}
              </button>
              <button
                className='bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-full transition-colors text-sm disabled:bg-gray-600 disabled:cursor-not-allowed'
                onClick={handleTestConnection}
                disabled={isTestingConnection}
              >
                {isTestingConnection
                  ? t('addCamera.testingConnection') || 'Testing...'
                  : t('cameraSetup.testConnectionButton') || 'Test Connection'}
              </button>
              <button
                className='bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-full transition-colors text-sm disabled:bg-gray-600 disabled:cursor-not-allowed'
                onClick={handleAddCameraWithTest}
                disabled={isLoading || isTestingConnection || isAddingRoi}
              >
                {isAddingRoi
                  ? 'Submit'
                  : !isTestingConnection && isLoading
                  ? t('addCamera.addingCamera') || 'Submitting...'
                  : t('addCamera.addCameraButton') || 'Sumbit'}
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
      <div className='bg-[#2A2B36] rounded-xl p-6 border border-gray-700/50 mt-6'>
        {!cameraId ? (
          // No Camera Selected (for new cameras)
          <div className='text-center py-12'>
            <h3 className='text-2xl font-bold mb-2'>
              {isCameraSaved ? 'Camera Saved Successfully' : 'No Camera Saved'}
            </h3>
            <p className='text-gray-400 mb-6 text-sm'>
              {isCameraSaved
                ? 'You can now add ROIs for this camera.'
                : 'Please save the camera first to add ROIs.'}
            </p>
            {/* {cameraId && (
              <p className='text-blue-400 text-sm mb-4'>
                Camera ID: {cameraId}
              </p>
            )} */}
            <button
              onClick={handleAddRoi}
              disabled={!isCameraSaved || !cameraId}
              className={`flex items-center gap-2 text-white font-semibold py-2.5 px-5 rounded-full transition-colors mx-auto ${
                isCameraSaved && cameraId
                  ? 'bg-[#3885CC] hover:bg-blue-600'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <span className='text-lg'>+</span>
              <span className='text-sm'>Add ROI</span>
            </button>
            {!isCameraSaved && (
              <p className='text-yellow-400 text-sm mt-2'>
                Please save the camera first
              </p>
            )}
            {isCameraSaved && !cameraId && (
              <p className='text-yellow-400 text-sm mt-2'>
                Camera ID not available. Please try saving again.
              </p>
            )}
          </div>
        ) : roiList.length === 0 ? (
          // Camera Selected but No ROI Found
          <div className='text-center py-12'>
            <h3 className='text-2xl font-bold mb-2'>No ROI found</h3>
            <p className='text-gray-400 mb-6 text-sm'>
              You do not have any ROI for this camera.
            </p>
            <button
              onClick={handleAddRoi}
              className='flex items-center gap-2 bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-full transition-colors mx-auto'
            >
              <span className='text-lg'>+</span>
              <span className='text-sm'>Add ROI</span>
            </button>
          </div>
        ) : (
          // ROI List Display
          <div>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-lg font-semibold'>ROI List</h3>
              <button
                onClick={handleAddRoi}
                className='flex items-center gap-2 bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-full transition-colors'
              >
                <span className='text-xl leading-none'>+</span>
                <span className='text-sm'>Add ROI</span>
              </button>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='bg-[#3A3B47] border-b border-gray-700/50'>
                    <th className='text-left py-3 px-4 text-sm font-semibold text-gray-300'>
                      ROI Name
                    </th>
                    <th className='text-left py-3 px-4 text-sm font-semibold text-gray-300'>
                      Detection Type
                    </th>
                    <th className='text-left py-3 px-4 text-sm font-semibold text-gray-300'>
                      Alert Priority
                    </th>
                    <th className='text-left py-3 px-4 text-sm font-semibold text-gray-300'>
                      Status
                    </th>
                    <th className='text-left py-3 px-4 text-sm font-semibold text-gray-300'>
                      Enable/Disable
                    </th>
                    <th className='text-left py-3 px-4 text-sm font-semibold text-gray-300'>
                      Notifications
                    </th>
                    <th className='text-left py-3 px-4 text-sm font-semibold text-gray-300'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roiList.map((roi, index) => (
                    <tr
                      key={index}
                      className='border-b border-gray-700/30 hover:bg-[#1C1C24] transition-colors'
                    >
                      <td className='py-4 px-4 text-sm text-white'>
                        {roi.name}
                      </td>
                      <td className='py-4 px-4 text-sm text-gray-300'>
                        {formatDetectionType(roi.detection_type)}
                      </td>
                      <td className='py-4 px-4 text-sm'>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            roi.alert_priority === 'high'
                              ? 'bg-red-500/20 text-red-400'
                              : roi.alert_priority === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {formatAlertPriority(roi.alert_priority)}
                        </span>
                      </td>
                      <td className='py-4 px-4 text-sm'>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            roi.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {roi.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className='py-4 px-4 text-sm'>
                        <div className='relative'>
                          <select
                            className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-1.5 px-3 pr-8 text-white focus:outline-none focus:border-gray-500 text-xs appearance-none cursor-pointer'
                            value={roi.status || 'active'}
                            onChange={e =>
                              handleRoiStatusChange(roi.id, e.target.value)
                            }
                          >
                            <option value='active'>Enable</option>
                            <option value='inactive'>Disable</option>
                          </select>
                          <IoChevronDown
                            className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
                            size={12}
                          />
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='flex items-center gap-3'>
                          {roi.notification_config?.email?.enabled && (
                            <button
                              className='p-1.5 rounded bg-blue-500/20 text-blue-400'
                              title='Email Notifications'
                            >
                              <IoMailOutline size={16} />
                            </button>
                          )}

                          {roi.notification_config?.call?.enabled && (
                            <button
                              className='p-1.5 rounded bg-green-500/20 text-green-400'
                              title='Call Notifications'
                            >
                              <IoCallOutline size={16} />
                            </button>
                          )}

                          {roi.notification_config?.whatsapp?.enabled && (
                            <button
                              className='p-1.5 rounded bg-purple-500/20 text-purple-400'
                              title='WhatsApp Notifications'
                            >
                              <IoChatbubbleOutline size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() => handleEditRoi(roi)}
                            className='p-2 rounded-lg border flex items-center justify-center gap-2 px-4 border-[#0088FF] text-[12px] hover:border-gray-500 transition-all'
                          >
                            <IoPencil size={12} />
                            <p>Edit</p>
                          </button>
                          <button
                            onClick={() => handleDeleteRoi(roi.id)}
                            className='p-2 rounded-lg text-gray-400 hover:text-red-500 transition-all'
                          >
                            <IoTrash size={14} />
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
  )
}

export default AddCamera
