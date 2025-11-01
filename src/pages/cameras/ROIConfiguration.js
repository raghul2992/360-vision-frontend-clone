import React, { useState, useRef, useEffect } from 'react'
import {
  Stage,
  Layer,
  Line,
  Circle,
  Image as KonvaImage,
  Rect
} from 'react-konva'
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
  deleteRoi,
  clearRoiOperationSuccess
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
    roiToEdit,
    currentRoi_Id,
    status,
    addnew
  } = location.state || {}
  const tenantId = propTenantId

  const [polygons, setPolygons] = useState([])
  const [currentPolygon, setCurrentPolygon] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingMode, setDrawingMode] = useState('polygon')
  const [isDrawingRectangle, setIsDrawingRectangle] = useState(false)
  const [rectangleStart, setRectangleStart] = useState(null)
  const [currentRectangle, setCurrentRectangle] = useState(null)
  const stageRef = useRef(null)
  const SNAPSHOT_DIR = `${process.env.REACT_APP_BASE_URL}/api/v1/tenants/${tenantId}/cameras/snapshot/image`
  const SNAPSHOT_URL = `${SNAPSHOT_DIR}/${snapshot}`
  const [snapshotUrl, setSnapshotUrl] = useState(SNAPSHOT_URL)
  const [image] = useImage(snapshotUrl)

  const [stageDimensions, setStageDimensions] = useState({
    width: 1100,
    height: 640
  })

  const { rois, isLoading, error, operationSuccess } = useSelector(
    state => state.roilist
  )
  const { snapshotResult, isLoading: isSnapshotLoading } = useSelector(
    state => state.cameraApi
  )

  // Image dimensions state
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0
  })

  useEffect(() => {
    console.log(`${snapshotUrl}`)
  }, [])

  const [emailNotification, setEmailNotification] = useState(false)
  const [callNotification, setCallNotification] = useState(false)
  const [whatsappNotification, setWhatsappNotification] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [emailRecipients, setEmailRecipients] = useState([])
  const [callRecipients, setCallRecipients] = useState([])
  const [whatsappRecipients, setWhatsappRecipients] = useState([])

  const [personSensitivity, setPersonSensitivity] = useState(66)
  const [weaponSensitivity, setWeaponSensitivity] = useState(88)
  const [vehicleSensitivity, setVehicleSensitivity] = useState(90)
  const [fireSensitivity, setFireSensitivity] = useState(18)
  const [motionThreshold, setMotionThreshold] = useState(66)
  const [minimumObjectSize, setMinimumObjectSize] = useState(98)

  // ROI Settings
  const [roiName, setRoiName] = useState('')
  const [detectionType, setDetectionType] = useState('ALL_DETECTION')
  const [alertPriority, setAlertPriority] = useState('High')
  const [currentRoiId, setCurrentRoiId] = useState(currentRoi_Id)

  // New states for specific detection configs
  const [idieDuration, setIdieDuration] = useState(3000)
  const [vehicleCount, setVehicleCount] = useState(3)

  const searchParams = new URLSearchParams(location.search)
  const cameraIdFromUrl = searchParams.get('cameraId')

  // Update image dimensions when image loads
  useEffect(() => {
    if (image) {
      setImageDimensions({
        width: image.width,
        height: image.height
      })
    }
  }, [image])

  useEffect(() => {
    const effectiveCameraId = cameraId || cameraIdFromUrl

    if (effectiveCameraId && tenantId && !addnew && !roiToEdit) {
      dispatch(getRois({ tenantId, cameraId: effectiveCameraId }))
    }

    if (roiToEdit) {
      handleEditRoi(roiToEdit)
      console.log('ROI to edit loaded, currentRoiId:', roiToEdit.id)
    }
  }, [dispatch, cameraId, cameraIdFromUrl, tenantId, roiToEdit, addnew])

  // Handle errors and success messages
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
    if (operationSuccess) {
      dispatch(getRois({ tenantId, cameraId }))
      dispatch(clearRoiOperationSuccess())
    }
  }, [error, operationSuccess, dispatch, tenantId, cameraId])

  // Get scale factors for coordinate conversion
  const getScaleFactors = () => {
    if (
      !imageDimensions.width ||
      !imageDimensions.height ||
      !stageRef.current
    ) {
      return { scaleX: 1, scaleY: 1 }
    }

    const stageWidth = stageRef.current.width()
    const stageHeight = stageRef.current.height()

    return {
      scaleX: imageDimensions.width / stageWidth,
      scaleY: imageDimensions.height / stageHeight
    }
  }

  // Convert stage coordinates to image coordinates
  const getImagePoint = (stageX, stageY) => {
    const { scaleX, scaleY } = getScaleFactors()
    return {
      x: Math.round(stageX * scaleX),
      y: Math.round(stageY * scaleY)
    }
  }

  // Convert image coordinates to stage coordinates
  const getStagePoint = (imageX, imageY) => {
    const { scaleX, scaleY } = getScaleFactors()
    return {
      x: Math.round(imageX / scaleX),
      y: Math.round(imageY / scaleY)
    }
  }

  // Convert polygon points from image to stage coordinates
  const getStagePolygon = polygon => {
    if (!polygon || polygon.length === 0) return []
    return polygon.map(point => getStagePoint(point.x, point.y))
  }

  // Add this function to transform polygons format
  const transformPolygonsFormat = polygonsArray => {
    return polygonsArray.map((polygon, index) => ({
      roi_name: `Area ${index + 1}`,
      polygon_points: polygon.flatMap(point => [point.x, point.y])
    }))
  }

  // Polygon drawing handlers
  const handleMouseDown = e => {
    if (!isDrawing || !image) return

    const stage = e.target.getStage()
    const pointerPosition = stage.getPointerPosition()
    const imagePoint = getImagePoint(pointerPosition.x, pointerPosition.y)

    if (drawingMode === 'polygon') {
      setCurrentPolygon([
        ...currentPolygon,
        { x: imagePoint.x, y: imagePoint.y }
      ])
    } else if (drawingMode === 'rectangle') {
      setIsDrawingRectangle(true)
      setRectangleStart(pointerPosition)
      setCurrentRectangle({
        x: pointerPosition.x,
        y: pointerPosition.y,
        width: 0,
        height: 0
      })
    }
  }

  const handleMouseMove = e => {
    if (!isDrawingRectangle || !rectangleStart || !image) return

    const stage = e.target.getStage()
    const pointerPosition = stage.getPointerPosition()

    setCurrentRectangle({
      x: Math.min(rectangleStart.x, pointerPosition.x),
      y: Math.min(rectangleStart.y, pointerPosition.y),
      width: Math.abs(pointerPosition.x - rectangleStart.x),
      height: Math.abs(pointerPosition.y - rectangleStart.y)
    })
  }

  const handleMouseUp = () => {
    if (
      isDrawingRectangle &&
      currentRectangle &&
      currentRectangle.width > 10 &&
      currentRectangle.height > 10
    ) {
      // Convert rectangle corners to image coordinates
      const topLeft = getImagePoint(currentRectangle.x, currentRectangle.y)
      const topRight = getImagePoint(
        currentRectangle.x + currentRectangle.width,
        currentRectangle.y
      )
      const bottomRight = getImagePoint(
        currentRectangle.x + currentRectangle.width,
        currentRectangle.y + currentRectangle.height
      )
      const bottomLeft = getImagePoint(
        currentRectangle.x,
        currentRectangle.y + currentRectangle.height
      )

      const rectPoints = [
        { x: topLeft.x, y: topLeft.y },
        { x: topRight.x, y: topRight.y },
        { x: bottomRight.x, y: bottomRight.y },
        { x: bottomLeft.x, y: bottomLeft.y }
      ]

      setPolygons([...polygons, rectPoints])
      setIsDrawingRectangle(false)
      setCurrentRectangle(null)
      setRectangleStart(null)
    }
  }

  const completeCurrentPolygon = () => {
    if (currentPolygon.length >= 3) {
      setPolygons([...polygons, currentPolygon])
      setCurrentPolygon([])
    } else {
      toast.error('A polygon needs at least 3 points')
    }
  }

  // Fixed drag handler with proper coordinate conversion
  const handleDragMove = (e, polygonIndex, pointIndex) => {
    const newPolygons = [...polygons]
    const stagePoint = { x: e.target.x(), y: e.target.y() }
    const imagePoint = getImagePoint(stagePoint.x, stagePoint.y)

    newPolygons[polygonIndex][pointIndex] = {
      x: imagePoint.x,
      y: imagePoint.y
    }
    setPolygons(newPolygons)
  }

  const deletePolygon = index => {
    const newPolygons = polygons.filter((_, i) => i !== index)
    setPolygons(newPolygons)
  }

  const deleteAllPolygons = () => {
    setPolygons([])
    setCurrentPolygon([])
    setCurrentRectangle(null)
    setIsDrawingRectangle(false)
  }

  const handleTakeSnapshot = () => {
    if (!rtsp_url) {
      toast.error('RTSP URL is missing. Cannot take a snapshot.')
      return
    }

    console.log(rtsp_url)
    const connectionData = {
      rtsp_url,
      username: '',
      password: ''
    }
    dispatch(
      getCameraSnapshot({
        tenantId,
        cameraId: cameraId ? parseInt(cameraId) : null,
        rtsp_url: rtsp_url,
        username: '',
        password: ''
      })
    )
      .unwrap()
      .then(result => {
        setSnapshotUrl(`${SNAPSHOT_DIR}/${result.frame_url}`)
        toast.success('Frame retrieved successfully!')
      })
  }

  const handleSaveRoi = () => {
    if (!cameraId) {
      toast.error('Please save the camera first before configuring ROIs.')
      return
    }
    if (!roiName.trim() || polygons.length === 0) {
      toast.error(
        'Please provide an ROI name and draw at least one polygon area.'
      )
      return
    }

    // Transform polygons to the new format
    const transformedPolygons = transformPolygonsFormat(polygons)

    const roiData = {
      name: roiName.trim(),
      frame_url: snapshot,
      polygons: transformedPolygons, // Removed JSON.stringify
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
      status: roiToEdit ? status : 'inactive',
      meta: {},
      camera_id: cameraId
    }

    console.log('handleSaveRoi called. currentRoiId:', currentRoiId)
    console.log('Transformed polygons data:', transformedPolygons)

    if (currentRoiId) {
      dispatch(updateRoi({ tenantId, cameraId, roiId: currentRoiId, roiData }))
      toast.success('ROI updated successfully!')
      navigate(`/add-camera?id=${cameraId}`)
    } else {
      dispatch(createRoi({ tenantId, cameraId, roiData }))
      toast.success('ROI created successfully!')
      resetForm()
      setCurrentRoiId(null)
      navigate(`/add-camera?id=${cameraId}`)
    }
  }

  // UPDATED: Handle ROI editing - parse both old and new formats
  const handleEditRoi = roi => {
    console.log('Editing ROI:', roi)
    setCurrentRoiId(roi.id)
    setRoiName(roi.name)
    setDetectionType(roi.detection_type)
    setAlertPriority(
      roi.alert_priority.charAt(0).toUpperCase() + roi.alert_priority.slice(1)
    )

    // Set the snapshot URL from the ROI being edited
    setSnapshotUrl(`${SNAPSHOT_DIR}/${roi.frame_url}`)

    // Parse the polygons - no need for JSON.parse since we're not stringifying anymore
    try {
      const parsedPolygons = roi.polygons // Direct assignment since it's already an object

      console.log('Parsed ROI polygons for editing:', parsedPolygons)

      // Clear existing polygons and load the ROI's polygons
      if (parsedPolygons && Array.isArray(parsedPolygons)) {
        const roiPolygons = []

        // Check if it's the new format (array of objects)
        if (
          parsedPolygons.length > 0 &&
          typeof parsedPolygons[0] === 'object' &&
          'polygon_points' in parsedPolygons[0]
        ) {
          // New format: array of objects with polygon_points
          parsedPolygons.forEach(polygonObj => {
            const polygonArray = polygonObj.polygon_points
            if (
              polygonArray &&
              Array.isArray(polygonArray) &&
              polygonArray.length >= 6
            ) {
              // At least 3 points (6 coordinates)
              const polygonPoints = []
              for (let i = 0; i < polygonArray.length; i += 2) {
                if (i + 1 < polygonArray.length) {
                  polygonPoints.push({
                    x: polygonArray[i],
                    y: polygonArray[i + 1]
                  })
                }
              }
              if (polygonPoints.length >= 3) {
                roiPolygons.push(polygonPoints)
              }
            }
          })
        } else {
          // Old format: array of polygon arrays (for backward compatibility)
          parsedPolygons.forEach(polygonArray => {
            if (
              polygonArray &&
              Array.isArray(polygonArray) &&
              polygonArray.length >= 6
            ) {
              // At least 3 points (6 coordinates)
              const polygonPoints = []
              for (let i = 0; i < polygonArray.length; i += 2) {
                if (i + 1 < polygonArray.length) {
                  polygonPoints.push({
                    x: polygonArray[i],
                    y: polygonArray[i + 1]
                  })
                }
              }
              if (polygonPoints.length >= 3) {
                roiPolygons.push(polygonPoints)
              }
            }
          })
        }

        console.log('Converted ROI polygons for editing:', roiPolygons)
        setPolygons(roiPolygons)
      } else {
        console.log('No valid polygons found, setting empty array')
        setPolygons([])
      }
    } catch (error) {
      console.error('Error parsing polygons:', error)
      setPolygons([])
    }

    // Populate notification states
    setEmailNotification(roi.notification_config?.email?.enabled || false)
    setEmailRecipients(roi.notification_config?.email?.recipients || [])
    setWhatsappNotification(roi.notification_config?.whatsapp?.enabled || false)
    setWhatsappRecipients(roi.notification_config?.whatsapp?.recipients || [])
    setCallNotification(roi.notification_config?.call?.enabled || false)
    setCallRecipients(roi.notification_config?.call?.recipients || [])

    // Populate detection sensitivity states
    if (roi.detection_type === 'IDIE_VEHICLE') {
      setIdieDuration(roi.detection_config?.IDIE_DURATION || 3000)
      setVehicleCount(roi.detection_config?.VEHICLE_COUNT || 3)
    } else {
      setPersonSensitivity(roi.detection_config?.person_sensitivity || 66)
      setWeaponSensitivity(roi.detection_config?.weapon_sensitivity || 88)
      setVehicleSensitivity(roi.detection_config?.vehicle_sensitivity || 90)
      setFireSensitivity(roi.detection_config?.fire_sensitivity || 18)
      setMotionThreshold(roi.detection_config?.motion_threshold || 66)
      setMinimumObjectSize(roi.detection_config?.minimum_object_size || 98)
    }

    // Enable drawing mode for adding new polygons
    setIsDrawing(true)
  }

  const handleDeleteRoi = roiId => {
    dispatch(deleteRoi({ tenantId, cameraId, roiId }))
    toast.success('ROI deleted successfully!')
  }

  const resetForm = () => {
    setRoiName('')
    setDetectionType('ALL_DETECTION')
    setAlertPriority('High')
    setPolygons([])
    setCurrentPolygon([])
    setIsDrawing(false)
    setIsDrawingRectangle(false)
    setCurrentRectangle(null)
    setDrawingMode('polygon')
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
    setIdieDuration(3000)
    setVehicleCount(3)
    setCurrentRoiId(null)
  }

  // Function to handle image error in Konva
  const handleImageError = () => {
    toast.error('Failed to display Frame image')
  }

  // Function to parse ROI polygons for display - FIXED VERSION
  const parseRoiPolygons = roi => {
    try {
      const parsed = roi.polygons // Direct assignment since it's already an object

      console.log('parseRoiPolygons - parsed:', parsed) // Debug log

      // Handle both old and new formats for display
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Check if new format (array of objects)
        if (typeof parsed[0] === 'object' && 'polygon_points' in parsed[0]) {
          // New format: extract polygon_points from each object and flatten
          return parsed.flatMap(polygonObj => {
            if (
              polygonObj.polygon_points &&
              Array.isArray(polygonObj.polygon_points)
            ) {
              return polygonObj.polygon_points
            }
            return []
          })
        } else {
          // Old format: already flat array
          return parsed.flat()
        }
      }

      // If parsed is not an array or empty, return empty array
      return []
    } catch (error) {
      console.error('Error parsing ROI polygons:', error)
      return []
    }
  }

  // Render polygons with proper coordinate conversion
  const renderPolygons = () => {
    return polygons.map((polygon, polyIndex) => {
      const stagePolygon = getStagePolygon(polygon)
      const flatPoints = stagePolygon.flatMap(p => [p.x, p.y])

      return (
        <React.Fragment key={polyIndex}>
          <Line
            points={flatPoints}
            stroke='#10b981'
            strokeWidth={3}
            closed={true}
            fill='rgba(16, 185, 129, 0.2)'
          />
          {stagePolygon.map((point, pointIndex) => (
            <Circle
              key={`${polyIndex}-${pointIndex}`}
              x={point.x}
              y={point.y}
              radius={6}
              fill='#10b981'
              stroke='white'
              strokeWidth={2}
              draggable
              onDragMove={e => handleDragMove(e, polyIndex, pointIndex)}
            />
          ))}
        </React.Fragment>
      )
    })
  }

  // Render current polygon being drawn
  const renderCurrentPolygon = () => {
    if (currentPolygon.length === 0) return null

    const stagePolygon = getStagePolygon(currentPolygon)
    const flatPoints = stagePolygon.flatMap(p => [p.x, p.y])

    return (
      <>
        <Line
          points={flatPoints}
          stroke='#3b82f6'
          strokeWidth={2}
          dash={[5, 5]}
        />
        {stagePolygon.map((point, index) => (
          <Circle
            key={index}
            x={point.x}
            y={point.y}
            radius={6}
            fill='#3b82f6'
            stroke='white'
            strokeWidth={2}
          />
        ))}
      </>
    )
  }

  // Debug function to log coordinates
  const debugCoordinates = () => {
    console.log('Image dimensions:', imageDimensions)
    console.log('Stage dimensions:', stageDimensions)
    console.log('Scale factors:', getScaleFactors())
    console.log('Polygons (image coordinates):', polygons)
    console.log(
      'Polygons (stage coordinates):',
      polygons.map(poly => getStagePolygon(poly))
    )
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
          onClick={() => navigate('/camera')}
          className='bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full flex items-center gap-2 transition-colors'
        >
          <IoArrowBackCircle size={20} className='inline-block' />
          <span>Back</span>
        </button>
      </div>

      {/* ROI Setting Section */}
      <div className='bg-[#30313F] rounded-lg p-6 mb-6'>
        <h2 className='text-xl font-bold mb-4'>ROI Setting</h2>

        {/* Debug button - remove in production */}
        <button
          onClick={debugCoordinates}
          className='mb-4 bg-gray-600 px-3 py-1 rounded text-sm'
        >
          Debug Coordinates
        </button>

        <div className='relative'>
          {/* Camera Feed */}
          <div className='w-full bg-black rounded-lg  relative '>
            <Stage
              width={stageDimensions.width}
              height={stageDimensions.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              ref={stageRef}
              className='w-full h-full'
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
                    stroke='#3b82f6'
                    strokeWidth={2}
                    dash={[5, 5]}
                    fill='rgba(59, 130, 246, 0.2)'
                  />
                )}

                {/* Display existing ROIs from backend - FIXED VERSION */}
                {rois.map(roi => {
                  if (roi.id === currentRoiId) return null // Don't show the ROI we're currently editing

                  const roiPoints = parseRoiPolygons(roi)
                  console.log('ROI points for display:', roiPoints) // Debug log

                  // Ensure roiPoints is an array and has enough points
                  if (
                    !roiPoints ||
                    !Array.isArray(roiPoints) ||
                    roiPoints.length === 0
                  ) {
                    console.log('Skipping ROI due to invalid points:', roi.id)
                    return null
                  }

                  try {
                    // Convert points to the format expected by getStagePolygon
                    const pointsForDisplay = []
                    for (let i = 0; i < roiPoints.length; i += 2) {
                      if (i + 1 < roiPoints.length) {
                        pointsForDisplay.push({
                          x: roiPoints[i],
                          y: roiPoints[i + 1]
                        })
                      }
                    }

                    if (pointsForDisplay.length === 0) {
                      console.log('No valid points found for ROI:', roi.id)
                      return null
                    }

                    const stagePoints = getStagePolygon(pointsForDisplay)
                    const flatPoints = stagePoints.flatMap(p => [p.x, p.y])

                    return (
                      <Line
                        key={roi.id}
                        points={!addnew && flatPoints}
                        stroke='yellow'
                        strokeWidth={3}
                        closed={true}
                        fill='rgba(255, 255, 0, 0.2)'
                      />
                    )
                  } catch (error) {
                    console.error('Error rendering ROI:', roi.id, error)
                    return null
                  }
                })}
              </Layer>
            </Stage>

            {/* Drawing mode selector */}
            <div className='absolute top-4 left-4 bg-gray-800 bg-opacity-80 rounded-lg p-3'>
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
                  Polygon
                </button>
              </div>
              {drawingMode === 'polygon' && (
                <div className='text-xs text-gray-300'>
                  Click to add points. Complete polygon when done.
                </div>
              )}
              {drawingMode === 'rectangle' && (
                <div className='text-xs text-gray-300'>
                  Click and drag to draw rectangle.
                </div>
              )}
            </div>

            {/* Polygon count display */}
            <div className='absolute top-4 right-4 bg-gray-800 bg-opacity-80 rounded-lg p-3'>
              <div className='text-sm text-gray-300'>
                Areas: {polygons.length}
              </div>
              <div className='text-sm text-gray-300'>Mode: {drawingMode}</div>
            </div>
          </div>
        </div>

        {/* ROI Configuration Fields */}
        <div className='flex flex-col mt-3'>
          {/* Control Buttons */}
          <div className='flex gap-3 w-full justify-between'>
            <div className='flex gap-3'>
              <button
                onClick={handleTakeSnapshot}
                disabled={isSnapshotLoading}
                className='bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 transition-colors disabled:opacity-50'
              >
                <IoCamera size={20} />
                <span>
                  {isSnapshotLoading ? 'Loading...' : 'Capture Frame'}
                </span>
              </button>

              {drawingMode === 'polygon' && currentPolygon.length > 0 && (
                <button
                  onClick={completeCurrentPolygon}
                  className='bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 transition-colors'
                >
                  <IoScanCircle size={20} />
                  <span>Complete Polygon</span>
                </button>
              )}
            </div>

            <div className='flex gap-3'>
              <button
                onClick={deleteAllPolygons}
                className='bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 transition-colors'
              >
                <IoTrash size={20} />
                <span>Clear All</span>
              </button>

              <button
                onClick={() => {
                  deleteAllPolygons()
                  setIsDrawing(true)
                }}
                className='bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 transition-colors'
              >
                <IoScanCircle size={20} />
                <span>Draw New Area</span>
              </button>
            </div>
          </div>

          {/* Polygon management */}
          {polygons.length > 0 && (
            <div className='mt-4'>
              <h3 className='text-lg font-semibold mb-2'>Drawn Areas</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
                {polygons.map((polygon, index) => (
                  <div
                    key={index}
                    className='bg-gray-700 rounded p-2 flex justify-between items-center'
                  >
                    <span className='text-sm'>
                      Area {index + 1} ({polygon.length} points)
                    </span>
                    <button
                      onClick={() => deletePolygon(index)}
                      className='text-red-400 hover:text-red-600'
                    >
                      <IoTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rois.length > 0 && (
            <div className='mt-6'>
              <h3 className='text-lg font-bold mb-3'>Configured ROIs</h3>
            </div>
          )}

          <div className='mt-3 space-y-4'>
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
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
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

export default ROIConfiguration
