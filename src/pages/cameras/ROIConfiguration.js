import React, { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Line, Circle, Image as KonvaImage } from 'react-konva'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { bgcolors } from '../../theme'
import {
  IoArrowBackCircle,
  IoChatboxEllipsesOutline,
  IoLogoWhatsapp,
  IoMailOutline,
  IoReload,
  IoScanCircle,
  IoPencil,
  IoTrash,
  IoCamera
} from 'react-icons/io5'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  createRoi,
  getRois,
  updateRoi,
  deleteRoi
} from '../../features/cameras/roilistslice'
import useImage from 'use-image'
import { getCameraSnapshot } from '../../features/cameras/cameraApiSlice'

const ROIConfiguration = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const {
    snapshot,
    cameraId,
    tenantId: propTenantId,
    rtsp_url,
    username,
    password,
    roiToEdit // Add roiToEdit to destructuring
  } = location.state || {}
  const tenantId = propTenantId || 1 // Default to 1 if not provided

  const [points, setPoints] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const stageRef = useRef(null)
  const [imageUrl, setImageUrl] = useState()
  // const [image] = useImage(`${process.env.REACT_APP_BASE_URL}${snapshot}`, 'anonymous')
  const [image] = useImage(
    `https://media.istockphoto.com/id/517188688/photo/mountain-landscape.jpg?s=1024x1024&w=0&k=20&c=z8_rWaI8x4zApNEEG9DnWlGXyDIXe-OmsAyQ5fGPVV8=`,
    'anonymous'
  )

  const [stageDimensions, setStageDimensions] = useState({
    width: 1050,
    height: 450
  })

  const { rois, isLoading, error, operationSuccess } = useSelector(
    state => state.roilist
  )
  const { snapshotResult, isLoading: isSnapshotLoading } = useSelector(
    state => state.cameraApi
  )

  useEffect(() => {
    console.log(`${process.env.REACT_APP_BASE_URL}${snapshot}`)
  }, [])

  // Notification states
  const [emailNotification, setEmailNotification] = useState(false)
  const [callNotification, setCallNotification] = useState(false)
  const [whatsappNotification, setWhatsappNotification] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [emailRecipients, setEmailRecipients] = useState([])
  const [callRecipients, setCallRecipients] = useState([])
  const [whatsappRecipients, setWhatsappRecipients] = useState([])

  // Detection sensitivity states
  const [personSensitivity, setPersonSensitivity] = useState(66)
  const [weaponSensitivity, setWeaponSensitivity] = useState(88)
  const [vehicleSensitivity, setVehicleSensitivity] = useState(90)
  const [fireSensitivity, setFireSensitivity] = useState(18)
  const [motionThreshold, setMotionThreshold] = useState(66)
  const [minimumObjectSize, setMinimumObjectSize] = useState(98)

  // ROI Settings
  const [roiName, setRoiName] = useState('')
  const [detectionType, setDetectionType] = useState('ALL_DETECTION') // Changed default to match backend
  const [alertPriority, setAlertPriority] = useState('High')
  const [currentRoiId, setCurrentRoiId] = useState(null)

  // New states for specific detection configs
  const [idieDuration, setIdieDuration] = useState(3000)
  const [vehicleCount, setVehicleCount] = useState(3)

  // Set the image URL from snapshot or snapshotResult
  // useEffect(() => {
  //   let url = null
  //   if (snapshotResult?.frame_url) {
  //     url = snapshotResult.frame_url.startsWith('https')
  //       ? snapshotResult.frame_url
  //       : `${process.env.REACT_APP_BASE_URL}${snapshotResult.frame_url}`
  //   } else if (snapshot) {
  //     url = snapshot.startsWith('https')
  //       ? snapshot
  //       : `${process.env.REACT_APP_BASE_URL}${snapshot}`
  //   }

  //   if (url) {
  //     // Appending a timestamp to bypass cache
  //     setImageUrl(`${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`)
  //   }
  // }, [snapshot, snapshotResult])

  // Set stage dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth > 1400 ? 1200 : 1050
      setStageDimensions({ width, height: 450 })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Load ROIs when cameraId and tenantId are available
  useEffect(() => {
    if (cameraId && tenantId) {
      dispatch(getRois({ tenantId, cameraId }))
    }
    if (roiToEdit) {
      handleEditRoi(roiToEdit)
    }
  }, [dispatch, cameraId, tenantId, roiToEdit])

  // Handle errors and success messages
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
    if (operationSuccess) {
      toast.success('Operation successful!')
      dispatch(getRois({ tenantId, cameraId })) // Refresh ROIs
    }
  }, [error, operationSuccess, dispatch, tenantId, cameraId])

  const handleMouseDown = e => {
    if (!isDrawing || !image) return
    const stage = e.target.getStage()
    const pointerPosition = stage.getPointerPosition()

    // Calculate scale factor to map pointer position to image coordinates
    const scaleX = image.width / stage.width()
    const scaleY = image.height / stage.height()

    setPoints([
      ...points,
      {
        x: pointerPosition.x * scaleX,
        y: pointerPosition.y * scaleY
      }
    ])
  }

  const handleDragMove = (e, index) => {
    const newPoints = [...points]
    const stage = e.target.getStage()
    const scaleX = image.width / stage.width()
    const scaleY = image.height / stage.height()

    newPoints[index] = {
      x: e.target.x() * scaleX,
      y: e.target.y() * scaleY
    }
    setPoints(newPoints)
  }

  // Calculate points for display on stage
  const getStagePoints = point => {
    if (!image || !stageRef.current) return { x: point.x, y: point.y }

    const scaleX = stageRef.current.width() / image.width
    const scaleY = stageRef.current.height() / image.height

    return {
      x: point.x * scaleX,
      y: point.y * scaleY
    }
  }

  const handleTakeSnapshot = () => {
    if (!rtsp_url) {
      toast.error('RTSP URL is missing. Cannot take a snapshot.')
      return
    }
    const connectionData = {
      rtsp_url,
      username: username || '',
      password: password || ''
    }
    dispatch(getCameraSnapshot({ tenantId, connectionData }))
  }

  const handleSaveRoi = () => {
    if (!cameraId) {
      toast.error('Please save the camera first before configuring ROIs.')
      return
    }
    if (!roiName.trim() || points.length < 3) {
      toast.error(
        'Please provide an ROI name and draw a polygon with at least 3 points.'
      )
      return
    }

    const roiData = {
      name: roiName.trim(),
      frame_url: snapshot,
      polygons: JSON.stringify(points.map(p => [p.x, p.y])), // Convert to string
      alert_priority: alertPriority.toLowerCase(),
      detection_type: detectionType,
      detection_config: (() => {
        if (detectionType === 'IDIE_VEHICLE') {
          return {
            IDIE_DURATION: idieDuration,
            VEHICLE_COUNT: vehicleCount
          }
        }
        return {
          person_sensitivity: personSensitivity,
          weapon_sensitivity: weaponSensitivity,
          vehicle_sensitivity: vehicleSensitivity,
          fire_sensitivity: fireSensitivity,
          motion_threshold: motionThreshold,
          minimum_object_size: minimumObjectSize
        }
      })(),
      notification_config: {
        whatsapp: {
          enabled: whatsappNotification,
          recipients: whatsappRecipients
        },
        email: {
          enabled: emailNotification,
          recipients: emailRecipients
        },
        call: {
          enabled: callNotification,
          recipients: callRecipients
        }
      },
      status: 'active',
      meta: {},
      camera_id: cameraId // Make sure to include camera_id
    }

    if (currentRoiId) {
      dispatch(updateRoi({ tenantId, cameraId, roiId: currentRoiId, roiData }))
    } else {
      dispatch(createRoi({ tenantId, cameraId, roiData }))
    }
    resetForm()
  }

  const handleEditRoi = roi => {
    setCurrentRoiId(roi.id)
    setRoiName(roi.name)
    setDetectionType(roi.detection_type)
    setAlertPriority(
      roi.alert_priority.charAt(0).toUpperCase() + roi.alert_priority.slice(1)
    )

    // Parse the polygons string back to array
    try {
      const parsedPolygons =
        typeof roi.polygons === 'string'
          ? JSON.parse(roi.polygons)
          : roi.polygons
      setPoints(parsedPolygons.map(p => ({ x: p[0], y: p[1] })))
    } catch (error) {
      console.error('Error parsing polygons:', error)
      setPoints(roi.polygons?.map(p => ({ x: p[0], y: p[1] })) || [])
    }

    // Populate notification states
    setEmailNotification(roi.notification_config.email.enabled)
    setEmailRecipients(roi.notification_config.email.recipients || [])
    setWhatsappNotification(roi.notification_config.whatsapp.enabled)
    setWhatsappRecipients(roi.notification_config.whatsapp.recipients || [])
    setCallNotification(roi.notification_config.call.enabled)
    setCallRecipients(roi.notification_config.call.recipients || [])

    // Populate detection sensitivity states
    if (roi.detection_type === 'IDIE_VEHICLE') {
      setIdieDuration(roi.detection_config.IDIE_DURATION || 3000)
      setVehicleCount(roi.detection_config.VEHICLE_COUNT || 3)
    } else {
      setPersonSensitivity(roi.detection_config.person_sensitivity || 66)
      setWeaponSensitivity(roi.detection_config.weapon_sensitivity || 88)
      setVehicleSensitivity(roi.detection_config.vehicle_sensitivity || 90)
      setFireSensitivity(roi.detection_config.fire_sensitivity || 18)
      setMotionThreshold(roi.detection_config.motion_threshold || 66)
      setMinimumObjectSize(roi.detection_config.minimum_object_size || 98)
    }
  }

  const handleDeleteRoi = roiId => {
    if (window.confirm('Are you sure you want to delete this ROI?')) {
      dispatch(deleteRoi({ tenantId, cameraId, roiId }))
    }
  }

  const resetForm = () => {
    setCurrentRoiId(null)
    setRoiName('')
    setDetectionType('ALL_DETECTION') // Changed default to match backend
    setAlertPriority('High')
    setPoints([])
    setIsDrawing(false)
    setEmailNotification(false)
    setCallNotification(false)
    setWhatsappNotification(false)
    setEmailRecipients([])
    setCallRecipients([])
    setWhatsappRecipients([])
    setWhatsappNumber('')
    setPersonSensitivity(66)
    setWeaponSensitivity(88)
    setVehicleSensitivity(90)
    setFireSensitivity(18)
    setMotionThreshold(66)
    setMinimumObjectSize(98)
    setIdieDuration(3000) // Reset new states
    setVehicleCount(3) // Reset new states
  }

  // Function to handle image error in Konva
  const handleImageError = () => {
    toast.error('Failed to display snapshot image')
  }

  // Function to parse ROI polygons for display
  const parseRoiPolygons = roi => {
    try {
      return typeof roi.polygons === 'string'
        ? JSON.parse(roi.polygons)
        : roi.polygons
    } catch (error) {
      console.error('Error parsing ROI polygons:', error)
      return roi.polygons || []
    }
  }

  return (
    <div className={`p-6 ${bgcolors.dark} text-white min-h-screen`}>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>Camera Configuration Settings</h1>
          <p className='text-sm text-gray-400'>
            Configure as configurações de conexão da sua câmera de segurança
            para adicionar uma nova câmera ao seu sistema de monitoramento
          </p>
        </div>
        <button
          onClick={() => navigate('/camera-setup')}
          className='bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full flex items-center gap-2 transition-colors'
        >
          <IoArrowBackCircle size={20} className='inline-block' />
          <span>Back</span>
        </button>
      </div>

      {/* ROI Setting Section */}
      <div className='bg-[#30313F] rounded-lg p-6 mb-6'>
        <h2 className='text-xl font-bold mb-4'>ROI Setting</h2>
        <div className='relative'>
          {/* Camera Feed */}
          <div className='w-full bg-black rounded-lg overflow-hidden relative'>
            <Stage
              width={stageDimensions.width}
              height={stageDimensions.height}
              onMouseDown={handleMouseDown}
              ref={stageRef}
              className='w-full h-full'
            >
              <Layer>
                {/* {image && imageStatus === 'loaded' && ( */}
                <KonvaImage
                  image={image}
                  width={stageDimensions.width}
                  height={stageDimensions.height}
                  onError={handleImageError}
                />
                {/* )} */}
                {points.length > 0 && (
                  <Line
                    points={points.flatMap(p => {
                      const stagePoint = getStagePoints(p)
                      return [stagePoint.x, stagePoint.y]
                    })}
                    stroke='#10b981'
                    strokeWidth={3}
                    closed={points.length > 2}
                    fill='rgba(16, 185, 129, 0.2)'
                  />
                )}
                {points.map((point, index) => {
                  const stagePoint = getStagePoints(point)
                  return (
                    <Circle
                      key={index}
                      x={stagePoint.x}
                      y={stagePoint.y}
                      radius={8}
                      fill='#10b981'
                      stroke='white'
                      strokeWidth={2}
                      draggable
                      onDragMove={e => handleDragMove(e, index)}
                    />
                  )
                })}
              </Layer>
              <Layer>
                {rois.map(roi => {
                  const roiPoints = parseRoiPolygons(roi)
                  return (
                    <Line
                      key={roi.id}
                      points={roiPoints.flatMap(p => {
                        const stagePoint = getStagePoints(p)
                        return [stagePoint.x, stagePoint.y]
                      })}
                      stroke='yellow'
                      strokeWidth={3}
                      closed={true}
                      fill='rgba(255, 255, 0, 0.2)'
                    />
                  )
                })}
              </Layer>
            </Stage>

            {/* Loading state */}
            {/* {imageStatus === 'loading' && (
              <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
                <div className='text-white'>Loading snapshot...</div>
              </div>
            )} */}

            {/* Error state */}
            {/* {imageStatus === 'failed' && (
              <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
                <div className='text-red-400 text-center'>
                  Failed to load snapshot
                  <br />
                  <button
                    onClick={handleTakeSnapshot}
                    className='mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded'
                  >
                    Retry Snapshot
                  </button>
                </div>
              </div>
            )} */}

            {/* No image state */}
            {/* {!imageUrl && imageStatus !== 'loading' && (
              <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
                <div className='text-gray-400 text-center'>
                  No snapshot available
                  <br />
                  <button
                    onClick={handleTakeSnapshot}
                    className='mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded'
                  >
                    Take Snapshot
                  </button>
                </div>
              </div>
            )} */}
          </div>
        </div>

        {/* ROI Configuration Fields */}
        <div className='flex flex-col mt-3'>
          {/* Reset and Draw ROI Buttons */}
          <div className='flex gap-3 w-full justify-end'>
            {/* <button
              onClick={handleTakeSnapshot}
              disabled={isSnapshotLoading}
              className='bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 transition-colors disabled:opacity-50'
            >
              <IoCamera size={20} />
              <span>{isSnapshotLoading ? 'Loading...' : 'Take Snapshot'}</span>
            </button> */}
            <button
              onClick={() => setPoints([])}
              className='bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 transition-colors'
            >
              <IoReload size={20} />
              <span>Reset</span>
            </button>
            <button
              onClick={() => {
                resetForm()
                setIsDrawing(true)
              }}
              className='bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 transition-colors'
            >
              <IoScanCircle size={20} />
              <span>Draw ROI</span>
            </button>
          </div>

          {/* List of Configured ROIs */}
          {rois.length > 0 && (
            <div className='mt-6'>
              <h3 className='text-lg font-bold mb-3'>Configured ROIs</h3>
              <div className='space-y-3'>
                {rois.map(roi => (
                  <div
                    key={roi.id}
                    className='flex items-center justify-between bg-gray-700 p-3 rounded-lg'
                  >
                    <span className='text-white'>{roi.name}</span>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => handleEditRoi(roi)}
                        className='text-blue-400 hover:text-blue-600 transition-colors'
                      >
                        <IoPencil size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteRoi(roi.id)}
                        className='text-red-400 hover:text-red-600 transition-colors'
                      >
                        <IoTrash size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className='mt-3 space-y-4'>
            {/* ROI Name - Full Width */}
            <div>
              <label className='block text-sm text-gray-400 mb-2'>
                ROI Name*
              </label>
              <input
                type='text'
                value={roiName}
                onChange={e => setRoiName(e.target.value)}
                placeholder='e.g., Camera 01 | Posto Petrobras- Zona Sul'
                className='w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors'
              />
            </div>

            {/* Detection Type and Alert Priority - Side by Side */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm text-gray-400 mb-2'>
                  Detection Type
                </label>
                <select
                  value={detectionType}
                  onChange={e => setDetectionType(e.target.value)}
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none'
                >
                  <option value='ALL_DETECTION'>All Detection</option>
                  <option value='PERSON_DETECTION'>Person Detection</option>
                  <option value='VEHICLE_DETECTION'>Vehicle Detection</option>
                  <option value='MOTION_DETECTION'>Motion Detection</option>
                  <option value='WEAPON_DETECTION'>Weapon Detection</option>
                  <option value='FIRE_DETECTION'>Fire Detection</option>
                  <option value='IDIE_VEHICLE'>IDIE Vehicle</option>
                </select>
              </div>
              <div>
                <label className='block text-sm text-gray-400 mb-2'>
                  Alert Priority
                </label>
                <select
                  value={alertPriority}
                  onChange={e => setAlertPriority(e.target.value)}
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none'
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detection Sensitive Section */}
      <div className='bg-[#30313F] rounded-lg p-6 mb-6'>
        <h2 className='text-xl font-bold mb-6'>Detection Sensitive</h2>
        <div className='grid grid-cols-2 gap-x-12 gap-y-6'>
          {(detectionType === 'ALL_DETECTION' ||
            detectionType === 'PERSON_DETECTION') && (
            <div>
              <div className='flex justify-between mb-2'>
                <label className='text-sm text-gray-300'>
                  Person Detection Sensitivity
                </label>
                <span className='text-sm font-semibold'>
                  {personSensitivity}%
                </span>
              </div>
              <input
                type='range'
                min='0'
                max='100'
                value={personSensitivity}
                onChange={e => setPersonSensitivity(e.target.value)}
                className='w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500'
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${personSensitivity}%, #4b5563 ${personSensitivity}%, #4b5563 100%)`
                }}
              />
            </div>
          )}

          {(detectionType === 'ALL_DETECTION' ||
            detectionType === 'FIRE_DETECTION') && (
            <div>
              <div className='flex justify-between mb-2'>
                <label className='text-sm text-gray-300'>
                  Fire Detection Sensitivity
                </label>
                <span className='text-sm font-semibold'>
                  {fireSensitivity}%
                </span>
              </div>
              <input
                type='range'
                min='0'
                max='100'
                value={fireSensitivity}
                onChange={e => setFireSensitivity(e.target.value)}
                className='w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500'
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${fireSensitivity}%, #4b5563 ${fireSensitivity}%, #4b5563 100%)`
                }}
              />
            </div>
          )}

          {(detectionType === 'ALL_DETECTION' ||
            detectionType === 'WEAPON_DETECTION') && (
            <div>
              <div className='flex justify-between mb-2'>
                <label className='text-sm text-gray-300'>
                  Weapon Detection Sensitivity
                </label>
                <span className='text-sm font-semibold'>
                  {weaponSensitivity}%
                </span>
              </div>
              <input
                type='range'
                min='0'
                max='100'
                value={weaponSensitivity}
                onChange={e => setWeaponSensitivity(e.target.value)}
                className='w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500'
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${weaponSensitivity}%, #4b5563 ${weaponSensitivity}%, #4b5563 100%)`
                }}
              />
            </div>
          )}

          {(detectionType === 'ALL_DETECTION' ||
            detectionType === 'MOTION_DETECTION') && (
            <div>
              <div className='flex justify-between mb-2'>
                <label className='text-sm text-gray-300'>
                  Motion Detection Threshold
                </label>
                <span className='text-sm font-semibold'>
                  {motionThreshold}%
                </span>
              </div>
              <input
                type='range'
                min='0'
                max='100'
                value={motionThreshold}
                onChange={e => setMotionThreshold(e.target.value)}
                className='w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500'
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${motionThreshold}%, #4b5563 ${motionThreshold}%, #4b5563 100%)`
                }}
              />
            </div>
          )}

          {(detectionType === 'ALL_DETECTION' ||
            detectionType === 'VEHICLE_DETECTION') && (
            <div>
              <div className='flex justify-between mb-2'>
                <label className='text-sm text-gray-300'>
                  Vehicle Detection Sensitivity
                </label>
                <span className='text-sm font-semibold'>
                  {vehicleSensitivity}%
                </span>
              </div>
              <input
                type='range'
                min='0'
                max='100'
                value={vehicleSensitivity}
                onChange={e => setVehicleSensitivity(e.target.value)}
                className='w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500'
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${vehicleSensitivity}%, #4b5563 ${vehicleSensitivity}%, #4b5563 100%)`
                }}
              />
            </div>
          )}

          {(detectionType === 'ALL_DETECTION' ||
            detectionType === 'PERSON_DETECTION' ||
            detectionType === 'VEHICLE_DETECTION' ||
            detectionType === 'MOTION_DETECTION' ||
            detectionType === 'WEAPON_DETECTION' ||
            detectionType === 'FIRE_DETECTION') && (
            <div>
              <div className='flex justify-between mb-2'>
                <label className='text-sm text-gray-300'>
                  Minimum Object Size
                </label>
                <span className='text-sm font-semibold'>
                  {minimumObjectSize}%
                </span>
              </div>
              <input
                type='range'
                min='0'
                max='100'
                value={minimumObjectSize}
                onChange={e => setMinimumObjectSize(e.target.value)}
                className='w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500'
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${minimumObjectSize}%, #4b5563 ${minimumObjectSize}%, #4b5563 100%)`
                }}
              />
            </div>
          )}

          {detectionType === 'IDIE_VEHICLE' && (
            <>
              <div>
                <label className='block text-sm text-gray-400 mb-2'>
                  IDIE Duration (ms)
                </label>
                <input
                  type='number'
                  value={idieDuration}
                  onChange={e => setIdieDuration(Number(e.target.value))}
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors'
                />
              </div>
              <div>
                <label className='block text-sm text-gray-400 mb-2'>
                  Vehicle Count
                </label>
                <input
                  type='number'
                  value={vehicleCount}
                  onChange={e => setVehicleCount(Number(e.target.value))}
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors'
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notifications Section */}
      <div className='bg-[#30313F] rounded-lg p-6 mb-6'>
        <h2 className='text-xl font-bold mb-6'>Notifications</h2>
        <div className='grid grid-cols-3 gap-6'>
          {/* Email Notification */}
          <div className='bg-gray-900 rounded-lg p-4 border border-gray-700'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <IoMailOutline size={20} />
                <span className='font-semibold'>Email Notification</span>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={emailNotification}
                  onChange={() => setEmailNotification(!emailNotification)}
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3885CC]"></div>
              </label>
            </div>
            <div>
              <label className='block text-sm text-gray-400 mb-2'>
                Enable Email Alerts
              </label>
              <div className='flex gap-2'>
                <input
                  type='email'
                  value={emailAddress}
                  onChange={e => setEmailAddress(e.target.value)}
                  placeholder='Enter Email address'
                  className='flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 transition-colors'
                />
                <button
                  onClick={() => {
                    if (
                      emailAddress.trim() &&
                      !emailRecipients.includes(emailAddress.trim())
                    ) {
                      setEmailRecipients([
                        ...emailRecipients,
                        emailAddress.trim()
                      ])
                      setEmailAddress('')
                    }
                  }}
                  className='bg-[#3885CC] hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors'
                >
                  +
                </button>
              </div>
              <div className='mt-2 flex flex-wrap gap-2'>
                {emailRecipients.map((recipient, idx) => (
                  <span
                    key={idx}
                    className='bg-gray-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'
                  >
                    {recipient}
                    <button
                      onClick={() =>
                        setEmailRecipients(
                          emailRecipients.filter(r => r !== recipient)
                        )
                      }
                      className='text-red-400 hover:text-red-600'
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Call Notification */}
          <div className='bg-gray-900 rounded-lg p-4 border border-gray-700'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <IoChatboxEllipsesOutline size={20} />
                <span className='font-semibold'>Call Notification</span>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={callNotification}
                  onChange={() => setCallNotification(!callNotification)}
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            <div>
              <label className='block text-sm text-gray-400 mb-2'>
                Enable Call Alerts
              </label>
              <div className='flex gap-2'>
                <input
                  type='tel'
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder='Enter Phone Number'
                  className='flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 transition-colors'
                />
                <button
                  onClick={() => {
                    if (
                      phoneNumber.trim() &&
                      !callRecipients.includes(phoneNumber.trim())
                    ) {
                      setCallRecipients([...callRecipients, phoneNumber.trim()])
                      setPhoneNumber('')
                    }
                  }}
                  className='bg-[#3885CC] hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors'
                >
                  +
                </button>
              </div>
              <div className='mt-2 flex flex-wrap gap-2'>
                {callRecipients.map((recipient, idx) => (
                  <span
                    key={idx}
                    className='bg-gray-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'
                  >
                    {recipient}
                    <button
                      onClick={() =>
                        setCallRecipients(
                          callRecipients.filter(r => r !== recipient)
                        )
                      }
                      className='text-red-400 hover:text-red-600'
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* WhatsApp Notification */}
          <div className='bg-gray-900 rounded-lg p-4 border border-gray-700'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <IoLogoWhatsapp size={20} />
                <span className='font-semibold'>WhatsApp Notification</span>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={whatsappNotification}
                  onChange={() =>
                    setWhatsappNotification(!whatsappNotification)
                  }
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            <div>
              <label className='block text-sm text-gray-400 mb-2'>
                Enable WhatsApp Alerts
              </label>
              <div className='flex gap-2'>
                <input
                  type='tel'
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  placeholder='Enter WhatsApp Number'
                  className='flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 transition-colors'
                />
                <button
                  onClick={() => {
                    if (
                      whatsappNumber.trim() &&
                      !whatsappRecipients.includes(whatsappNumber.trim())
                    ) {
                      setWhatsappRecipients([
                        ...whatsappRecipients,
                        whatsappNumber.trim()
                      ])
                      setWhatsappNumber('')
                    }
                  }}
                  className='bg-[#3885CC] hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors'
                >
                  +
                </button>
              </div>
              <div className='mt-2 flex flex-wrap gap-2'>
                {whatsappRecipients.map((recipient, idx) => (
                  <span
                    key={idx}
                    className='bg-gray-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'
                  >
                    {recipient}
                    <button
                      onClick={() =>
                        setWhatsappRecipients(
                          whatsappRecipients.filter(r => r !== recipient)
                        )
                      }
                      className='text-red-400 hover:text-red-600'
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
      <div className='bg-[#30313F] flex justify-between items-center rounded-lg p-4 mb-6'>
        <p className='text-white font-medium'>Save Camera</p>

        <div className='flex gap-3'>
          <button
            onClick={resetForm}
            className='bg-[#4D4D4D] text-sm text-white font-semibold py-2 px-6 rounded-full transition-colors hover:bg-gray-600'
          >
            Clear
          </button>
          <button
            onClick={handleSaveRoi}
            className='bg-[#3885CC] text-sm text-white font-semibold py-2 px-6 rounded-full transition-colors hover:bg-blue-600'
          >
            {currentRoiId ? 'Update' : 'Save'} ROI
          </button>
        </div>
      </div>
    </div>
  )
}

export default ROIConfiguration;