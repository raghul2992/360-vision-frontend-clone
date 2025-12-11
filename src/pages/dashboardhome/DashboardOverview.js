import React, { useState, useEffect, useCallback, useRef } from 'react'
import Select from 'react-select'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { useDispatch, useSelector } from 'react-redux'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import format from 'date-fns/format'
import { useTranslation } from 'react-i18next'
import { FiMove, FiX, FiPlus } from 'react-icons/fi'

import { getCameras } from '../../features/cameras/cameraApiSlice'
import { getLocations } from '../../features/locations/locationApiSlice'
import { fetchAlerts } from '../../features/alert/alertSlice'
import {
  getTenant,
  updateWidgetLayout,
  getAlertTimeline,
  getAlertTypeBreakdown,
  getTopProblematicRois
} from '../../features/widgets/widgetApiSlice'

import DetectionChart from '../dashboardhome/components/DetectionChart'
import HealthCard from '../dashboardhome/components/HealthCard'
import FilterDropdown from '../../component/FilterDropdown'
import AlertTimelineWidget from '../dashboardhome/components/AlertTimelineWidget'
import AlertTypeBreakdownWidget from '../dashboardhome/components/AlertTypeBreakdownWidget'
import TopProblematicRoisWidget from '../dashboardhome/components/TopProblematicRoisWidget'

const ResponsiveGridLayout = WidthProvider(Responsive)

// Widget definitions - using widget_name as the primary identifier
const WIDGETS = [
  {
    widget_name: 'alert_timeline',
    component: AlertTimelineWidget,
    titleKey: 'dashboard.alert_timeline',
    descriptionKey: 'dashboard.alert_timeline_desc',
    dataKey: 'alertTimeline',
    totalKey: 'totalAlerts'
  },
  {
    widget_name: 'alert_type_breakdown',
    component: AlertTypeBreakdownWidget,
    titleKey: 'dashboard.alert_type_breakdown',
    descriptionKey: 'dashboard.alert_type_breakdown_desc',
    dataKey: 'alertTypeBreakdown',
    totalKey: 'totalAlertTypeBreakdown'
  },
  {
    widget_name: 'priority',
    component: DetectionChart,
    titleKey: 'dashboard.priority_analytics',
    descriptionKey: 'dashboard.priority_desc',
    dataKey: 'priorityData',
    totalKey: 'totalAlerts',
    chartProps: { showPercentages: true }
  },
  {
    widget_name: 'top_problematic_rois',
    component: TopProblematicRoisWidget,
    titleKey: 'dashboard.top_problematic_rois',
    descriptionKey: 'dashboard.top_problematic_rois_desc',
    dataKey: 'topProblematicRois'
  }
]

// Add Widget Modal Component
const AddWidgetModal = ({ widgets, onAddWidget, onClose }) => {
  const { t } = useTranslation()

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]'>
      <div className='bg-[#2a2f45] rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-white text-2xl font-semibold'>
            {t('dashboard.add_widget')}
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white transition-colors'
          >
            <FiX size={24} />
          </button>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {widgets.map(widget => (
            <div
              key={widget.widget_name}
              onClick={() => onAddWidget(widget.widget_name)}
              className='bg-[#1a1d29] rounded-lg p-6 cursor-pointer hover:bg-[#393A4A] transition-colors border border-transparent hover:border-[#6366F1]'
            >
              <p className='text-gray-400 text-sm'>
                {t(widget.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
        {widgets.length === 0 && (
          <div className='text-center text-gray-400 py-8'>
            All available widgets are already added
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardOverview () {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const { locations = [] } = useSelector(state => state.locationApi || {})
  const { cameras = [], isLoading } = useSelector(
    state => state.cameraApi || {}
  )
  const { alerts = [] } = useSelector(state => state.alerts || {})

  // Get tenant data from widgetApi slice
  const {
    tenant = null,
    isLoading: layoutLoading,
    isAlertTimelineLoading,
    isAlertTypeBreakdownLoading,
    isTopProblematicRoisLoading
  } = useSelector(state => state.widgetApi || {})

  const [layout, setLayout] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeWidgets, setActiveWidgets] = useState([])
  const [hasInitialized, setHasInitialized] = useState(false)

  // Independent filters for each widget
  const [healthLocation, setHealthLocation] = useState(null)
  const [healthCamera, setHealthCamera] = useState(null)
  const [detectionLocation, setDetectionLocation] = useState(null)
  const [detectionCamera, setDetectionCamera] = useState(null)
  const [priorityLocation, setPriorityLocation] = useState(null)
  const [priorityCamera, setPriorityCamera] = useState(null)
  const [alertTimelineLocation, setAlertTimelineLocation] = useState(null)
  const [alertTimelineCamera, setAlertTimelineCamera] = useState(null)
  const [alertTypeBreakdownLocation, setAlertTypeBreakdownLocation] =
    useState(null)
  const [alertTypeBreakdownCamera, setAlertTypeBreakdownCamera] = useState(null)

  const today = new Date()
  const [detectionDateRange, setDetectionDateRange] = useState([today, today])
  const [priorityDateRange, setPriorityDateRange] = useState([today, today])
  const [alertTimelineDateRange, setAlertTimelineDateRange] = useState(null)
  const [alertTypeBreakdownDateRange, setAlertTypeBreakdownDateRange] =
    useState(null)
  const [topRoisDateRange, setTopRoisDateRange] = useState(null)
  const [healthDateRange, setHealthDateRange] = useState([today, today])

  // Data state
  const [healthData, setHealthData] = useState({
    active: 0,
    inactive: 0,
    processing: 0,
    error: 0
  })
  const [detectionData, setDetectionData] = useState([])
  const [priorityData, setPriorityData] = useState([])
  const [totalDetection, setTotalDetection] = useState(0)
  const [totalAlerts, setTotalAlerts] = useState(0)
  const [totalAlertTypeBreakdown, setTotalAlertTypeBreakdown] = useState(0)

  // guards to avoid double API calls in React 18 StrictMode
  const hasRequestedTenant = useRef(false)
  const hasRequestedLocations = useRef(false)
  const hasRequestedCameras = useRef(false)
  const lastSavedLayoutRef = useRef(null)

  // Helper function for date params (reusable)
  const getDateParams = dateRange => {
    const [start, end] = dateRange || []
    const isDateValid =
      start &&
      end &&
      start instanceof Date &&
      end instanceof Date &&
      !isNaN(start) &&
      !isNaN(end)

    if (isDateValid) {
      return {
        created_after: format(start, "yyyy-MM-dd'T'00:00:00"),
        created_before: format(end, "yyyy-MM-dd'T'23:59:59")
      }
    }
    return {}
  }

  // Function to refresh tenant data
  const refreshTenantData = useCallback(() => {
    const tenantId = localStorage.getItem('tenant_id')
    if (tenantId) {
      // Reset the ref to allow new API call
      hasRequestedTenant.current = false
      dispatch(getTenant({ tenant_id: tenantId, skip: 0, limit: 100 }))
    }
  }, [dispatch])

  // Fetch tenant data on mount (GET only once)
  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id')
    if (tenantId && !hasRequestedTenant.current) {
      hasRequestedTenant.current = true
      dispatch(getTenant({ tenant_id: tenantId, skip: 0, limit: 100 }))
    }
  }, [dispatch])

  // Initialize layout from tenant.meta.widget_config (DB value)
  useEffect(() => {
    if (!layoutLoading && tenant && !hasInitialized) {
      const widgetConfig = tenant?.meta?.widget_config || []

      if (widgetConfig.length > 0) {
        const mappedLayout = widgetConfig.map(item => ({
          i: item.widget_name,
          x: item.x || 0,
          y: item.y || 0,
          w: item.w || 6,
          h: item.h || 8,
          minW: 3,
          minH: 8
        }))
        setLayout(mappedLayout)

        const activeNames = new Set(widgetConfig.map(item => item.widget_name))
        const active = WIDGETS.filter(w => activeNames.has(w.widget_name))
        setActiveWidgets(active)

        lastSavedLayoutRef.current = mappedLayout
      } else {
        setLayout([])
        setActiveWidgets([])
        lastSavedLayoutRef.current = []
      }
      setHasInitialized(true)
    }
  }, [tenant, layoutLoading, hasInitialized])

  // Keep activeWidgets in sync with layout
  useEffect(() => {
    const activeNames = new Set(layout.map(item => item.i))
    setActiveWidgets(WIDGETS.filter(w => activeNames.has(w.widget_name)))
  }, [layout])

  // local-only layout change handler
  const handleLayoutChangeLocal = newLayout => {
    setLayout(newLayout)
  }

  // central helper: only call PUT when layout really changed
  const saveLayoutToApi = useCallback(
    layoutToSave => {
      if (!hasInitialized) return

      const tenantId = localStorage.getItem('tenant_id')
      if (!tenantId) return

      if (
        JSON.stringify(lastSavedLayoutRef.current) ===
        JSON.stringify(layoutToSave)
      ) {
        return
      }

      lastSavedLayoutRef.current = layoutToSave

      const apiLayout = layoutToSave.map(item => ({
        widget_name: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h
      }))

      dispatch(updateWidgetLayout({ tenantId, layout: apiLayout }))
        .unwrap()
        .then(() => {
          // Refresh tenant data after successful layout update
          refreshTenantData()
        })
        .catch(error => console.error('Failed to save layout:', error))
    },
    [dispatch, hasInitialized, refreshTenantData]
  )

  // Add widget
  const addWidget = widgetName => {
    const newWidget = WIDGETS.find(w => w.widget_name === widgetName)
    if (!newWidget) {
      setIsModalOpen(false)
      return
    }

    if (activeWidgets.some(w => w.widget_name === widgetName)) {
      setIsModalOpen(false)
      return
    }

    const newLayoutItem = {
      i: newWidget.widget_name,
      x: (layout.length * 6) % 12,
      y: Infinity,
      w: 6,
      h: 12,
      minW: 3,
      minH: 8
    }

    const newLayout = [...layout, newLayoutItem]
    setLayout(newLayout)
    setActiveWidgets([...activeWidgets, newWidget])

    // Immediately save layout to API
    saveLayoutToApi(newLayout)
    setIsModalOpen(false)
  }

  // Remove widget
  const removeWidget = widgetName => {
    const newLayout = layout.filter(item => item.i !== widgetName)
    const newActiveWidgets = activeWidgets.filter(
      w => w.widget_name !== widgetName
    )

    setLayout(newLayout)
    setActiveWidgets(newActiveWidgets)

    // Immediately save layout to API
    saveLayoutToApi(newLayout)
  }

  // Fetch locations (GET only once)
  useEffect(() => {
    const tenant_id = localStorage.getItem('tenant_id')
    if (tenant_id && !hasRequestedLocations.current) {
      hasRequestedLocations.current = true
      dispatch(getLocations(tenant_id))
    }
  }, [dispatch])

  // Fetch cameras (GET only once)
  const fetchCameras = useCallback(() => {
    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId || hasRequestedCameras.current) return
    hasRequestedCameras.current = true
    dispatch(getCameras({ tenantId, skip: 0, limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    fetchCameras()
  }, [fetchCameras])

  // ========================================
  // INDEPENDENT API CALLS FOR EACH WIDGET
  // ========================================

  // 1. DETECTION WIDGET - Independent API call
  useEffect(() => {
    if (!activeWidgets.some(w => w.widget_name === 'detection')) return

    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return

    const queryParams = {
      type: 'event_alert',
      skip: 0,
      limit: 100,
      ...getDateParams(detectionDateRange)
    }
    if (detectionLocation?.value)
      queryParams.location_id = detectionLocation.value
    if (detectionCamera?.value) queryParams.camera_id = detectionCamera.value

    dispatch(fetchAlerts({ tenantId, queryParams }))
  }, [
    dispatch,
    activeWidgets,
    detectionDateRange,
    detectionLocation,
    detectionCamera
  ])

  // 2. PRIORITY WIDGET - Independent API call
  useEffect(() => {
    if (!activeWidgets.some(w => w.widget_name === 'priority')) return

    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return

    const queryParams = {
      type: 'event_alert',
      skip: 0,
      limit: 100,
      ...getDateParams(priorityDateRange)
    }
    if (priorityLocation?.value)
      queryParams.location_id = priorityLocation.value
    if (priorityCamera?.value) queryParams.camera_id = priorityCamera.value

    dispatch(fetchAlerts({ tenantId, queryParams }))
  }, [
    dispatch,
    activeWidgets,
    priorityDateRange,
    priorityLocation,
    priorityCamera
  ])

  // 3. ALERT TIMELINE WIDGET - Independent API call
  useEffect(() => {
    if (!activeWidgets.some(w => w.widget_name === 'alert_timeline')) return

    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return

    const params = {
      tenant_id: tenantId,
      ...getDateParams(alertTimelineDateRange)
    }
    if (alertTimelineLocation?.value)
      params.location_id = alertTimelineLocation.value
    if (alertTimelineCamera?.value) params.camera_id = alertTimelineCamera.value

    dispatch(getAlertTimeline(params))
  }, [
    dispatch,
    activeWidgets,
    alertTimelineDateRange,
    alertTimelineLocation,
    alertTimelineCamera
  ])

  // 4. ALERT TYPE BREAKDOWN WIDGET - Independent API call
  useEffect(() => {
    if (!activeWidgets.some(w => w.widget_name === 'alert_type_breakdown'))
      return

    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return

    const params = {
      tenant_id: tenantId,
      ...getDateParams(alertTypeBreakdownDateRange)
    }
    if (alertTypeBreakdownLocation?.value)
      params.location_id = alertTypeBreakdownLocation.value
    if (alertTypeBreakdownCamera?.value)
      params.camera_id = alertTypeBreakdownCamera.value

    dispatch(getAlertTypeBreakdown(params))
  }, [
    dispatch,
    activeWidgets,
    alertTypeBreakdownDateRange,
    alertTypeBreakdownLocation,
    alertTypeBreakdownCamera
  ])

  // 5. TOP PROBLEMATIC ROIS WIDGET - Independent API call (DATE RANGE ONLY)
  useEffect(() => {
    if (!activeWidgets.some(w => w.widget_name === 'top_problematic_rois'))
      return

    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return

    const params = {
      tenant_id: tenantId,
      ...getDateParams(topRoisDateRange),
      limit: 5
    }
    // NO location_id or camera_id parameters

    dispatch(getTopProblematicRois(params))
  }, [dispatch, activeWidgets, topRoisDateRange])

  // ========================================
  // DATA PROCESSING
  // ========================================

  // Process health data
  useEffect(() => {
    if (cameras.length > 0 && !isLoading) {
      const filtered = cameras.filter(c => {
        const locMatch =
          !healthLocation || c.location_id === healthLocation.value
        const camMatch = !healthCamera || c.id === healthCamera.value
        return locMatch && camMatch
      })
      setHealthData({
        active: filtered.filter(c => c.status === 'active').length,
        inactive: filtered.filter(c => c.status === 'inactive').length,
        processing: filtered.filter(c => c.status === 'processing').length,
        error: filtered.filter(c => c.status === 'error').length
      })
    } else {
      setHealthData({ active: 0, inactive: 0, processing: 0, error: 0 })
    }
  }, [cameras, healthLocation, healthCamera, healthDateRange, isLoading])

  // Process analytics data
  useEffect(() => {
    if (cameras.length > 0 && !isLoading) {
      // Detection widget data
      const detectionDetections = {}
      const detectionFilteredCameras = cameras.filter(cam => {
        const locMatch =
          !detectionLocation || cam.location_id === detectionLocation.value
        const camMatch = !detectionCamera || cam.id === detectionCamera.value
        return locMatch && camMatch
      })

      detectionFilteredCameras.forEach(cam => {
        cam.rois?.forEach(roi => {
          if (roi.detection_type)
            detectionDetections[roi.detection_type] =
              (detectionDetections[roi.detection_type] || 0) + 1
        })
      })

      setDetectionData(
        Object.entries(detectionDetections).map(([k, v], i) => ({
          id: i,
          value: v,
          label: k.replace(/_/g, ' '),
          color: ['#34C759', '#00C7BE', '#32ADE6', '#FF9800'][i % 4]
        }))
      )
      setTotalDetection(
        Object.values(detectionDetections).reduce((a, b) => a + b, 0)
      )

      // Priority widget data
      const priorityPriorities = {}
      const priorityFilteredCameras = cameras.filter(cam => {
        const locMatch =
          !priorityLocation || cam.location_id === priorityLocation.value
        const camMatch = !priorityCamera || cam.id === priorityCamera.value
        return locMatch && camMatch
      })

      priorityFilteredCameras.forEach(cam => {
        cam.rois?.forEach(roi => {
          if (roi.alert_priority)
            priorityPriorities[roi.alert_priority] =
              (priorityPriorities[roi.alert_priority] || 0) + 1
        })
      })

      setPriorityData(
        Object.entries(priorityPriorities).map(([k, v], i) => ({
          id: i,
          value: v,
          label: k.charAt(0).toUpperCase() + k.slice(1),
          color: ['#ef4444', '#facc15', '#4ade80'][i % 3]
        }))
      )
      setTotalAlerts(
        Object.values(priorityPriorities).reduce((a, b) => a + b, 0)
      )
    }
  }, [
    cameras,
    detectionLocation,
    detectionCamera,
    priorityLocation,
    priorityCamera,
    isLoading
  ])

  // Options
  const locationOptions = locations.map(loc => ({
    value: loc.id || loc._id,
    label: loc.name
  }))

  const detectionCameraOptions = cameras
    .filter(
      cam => !detectionLocation || cam.location_id === detectionLocation.value
    )
    .map(cam => ({ value: cam.id, label: cam.name }))

  const priorityCameraOptions = cameras
    .filter(
      cam => !priorityLocation || cam.location_id === priorityLocation.value
    )
    .map(cam => ({ value: cam.id, label: cam.name }))

  const alertTimelineCameraOptions = cameras
    .filter(
      cam =>
        !alertTimelineLocation ||
        cam.location_id === alertTimelineLocation.value
    )
    .map(cam => ({ value: cam.id, label: cam.name }))

  const alertTypeBreakdownCameraOptions = cameras
    .filter(
      cam =>
        !alertTypeBreakdownLocation ||
        cam.location_id === alertTypeBreakdownLocation.value
    )
    .map(cam => ({ value: cam.id, label: cam.name }))

  const healthCameraOptions = cameras
    .filter(cam => !healthLocation || cam.location_id === healthLocation.value)
    .map(cam => ({ value: cam.id, label: cam.name }))

  const detectionFilterProps = {
    locationOptions,
    cameraOptions: detectionCameraOptions,
    selectedLocation: detectionLocation,
    setSelectedLocation: opt => {
      setDetectionLocation(opt)
      setDetectionCamera(null)
    },
    selectedCamera: detectionCamera,
    setSelectedCamera: setDetectionCamera,
    setDateRange: setDetectionDateRange,
    dateRange: detectionDateRange
  }

  const priorityFilterProps = {
    locationOptions,
    cameraOptions: priorityCameraOptions,
    selectedLocation: priorityLocation,
    setSelectedLocation: opt => {
      setPriorityLocation(opt)
      setPriorityCamera(null)
    },
    selectedCamera: priorityCamera,
    setSelectedCamera: setPriorityCamera,
    setDateRange: setPriorityDateRange,
    dateRange: priorityDateRange
  }

  const alertTimelineFilterProps = {
    locationOptions,
    cameraOptions: alertTimelineCameraOptions,
    selectedLocation: alertTimelineLocation,
    setSelectedLocation: opt => {
      setAlertTimelineLocation(opt)
      setAlertTimelineCamera(null)
    },
    selectedCamera: alertTimelineCamera,
    setSelectedCamera: setAlertTimelineCamera,
    setDateRange: setAlertTimelineDateRange,
    dateRange: alertTimelineDateRange
  }

  const alertTypeBreakdownFilterProps = {
    locationOptions,
    cameraOptions: alertTypeBreakdownCameraOptions,
    selectedLocation: alertTypeBreakdownLocation,
    setSelectedLocation: opt => {
      setAlertTypeBreakdownLocation(opt)
      setAlertTypeBreakdownCamera(null)
    },
    selectedCamera: alertTypeBreakdownCamera,
    setSelectedCamera: setAlertTypeBreakdownCamera,
    setDateRange: setAlertTypeBreakdownDateRange,
    dateRange: alertTypeBreakdownDateRange
  }

  // TOP PROBLEMATIC ROIS - DATE RANGE ONLY (NO LOCATION/CAMERA)
  const topRoisFilterProps = {
    locationOptions: [],
    cameraOptions: [],
    selectedLocation: null,
    setSelectedLocation: () => {},
    selectedCamera: null,
    setSelectedCamera: () => {},
    setDateRange: setTopRoisDateRange,
    dateRange: topRoisDateRange
  }

  const healthFilterProps = {
    locationOptions,
    cameraOptions: healthCameraOptions,
    selectedLocation: healthLocation,
    setSelectedLocation: opt => {
      setHealthLocation(opt)
      setHealthCamera(null)
    },
    selectedCamera: healthCamera,
    setSelectedCamera: setHealthCamera,
    setDateRange: setHealthDateRange,
    dateRange: healthDateRange
  }

  const showSkeleton = layoutLoading && !hasInitialized

  if (showSkeleton) {
    return (
      <div className='min-h-screen bg-[#1a1d29] p-6 w-full'>
        <div className='mx-auto max-w-7xl animate-pulse'>
          <div className='flex items-center justify-between mb-8'>
            <div className='h-6 w-64 bg-[#2a2f45] rounded' />
            <div className='h-10 w-40 bg-[#2a2f45] rounded' />
          </div>

          <div className='bg-[#2a2f45] rounded-xl p-6 mb-8 shadow-sm'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className='bg-[#1f2435] rounded-lg h-24' />
              ))}
            </div>
          </div>

          <div className='flex items-center justify-between mt-8 mb-6'>
            <div className='h-6 w-64 bg-[#2a2f45] rounded' />
            <div className='h-10 w-40 bg-[#2a2f45] rounded' />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className='bg-[#2a2f45] rounded-xl p-4 h-64'>
                <div className='h-5 w-40 bg-[#1f2435] rounded mb-4' />
                <div className='h-full w-full bg-[#1f2435] rounded' />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#1a1d29] p-6 w-full'>
      <div className='mx-auto max-w-7xl'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-white text-2xl font-semibold'>
            {t('dashboard.camera_health_overview')}
          </h1>
          <div className='w-58'>
            <FilterDropdown {...healthFilterProps} />
          </div>
        </div>

        {/* Health Cards */}
        <div className='bg-[#2a2f45] rounded-xl p-6 mb-8 shadow-sm'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {[
              {
                status: 'active',
                display: t('dashboard.active_good'),
                count: healthData.active,
                color: '#4CAF50'
              },
              {
                status: 'inactive',
                display: t('dashboard.inactive_concern'),
                count: healthData.inactive,
                color: '#9ca3af'
              },
              {
                status: 'processing',
                display: t('dashboard.processing'),
                count: healthData.processing,
                color: '#f97316'
              },
              {
                status: 'error',
                display: t('dashboard.error_critical'),
                count: healthData.error,
                color: '#F44336'
              }
            ].map((data, i) => (
              <HealthCard
                key={i}
                status={data.status}
                displayStatus={data.display}
                count={data.count}
                color={data.color}
              />
            ))}
          </div>
        </div>

        {/* Analytics Header */}
        <div className='flex items-center justify-between mt-8 mb-6'>
          <h2 className='text-white text-2xl font-semibold'>
            {t('dashboard.analytics_overview')}
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className='flex items-center gap-2 bg-[#3885CC] text-white font-semibold py-2.5 px-5 rounded-full transition-colors'
          >
            <FiPlus size={20} />
            <span>{t('dashboard.add_widget')}</span>
          </button>
        </div>

        {/* Analytics Grid */}
        {activeWidgets.length > 0 ? (
          <ResponsiveGridLayout
            className='layout'
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200 }}
            cols={{ lg: 12 }}
            rowHeight={30}
            onLayoutChange={handleLayoutChangeLocal}
            onDragStop={newLayout => {
              handleLayoutChangeLocal(newLayout)
              saveLayoutToApi(newLayout)
            }}
            onResizeStop={newLayout => {
              handleLayoutChangeLocal(newLayout)
              saveLayoutToApi(newLayout)
            }}
            dragHandleClassName='drag-handle'
            draggableCancel='.no-drag'
            margin={[16, 16]}
          >
            {activeWidgets.map(widget => {
              const data =
                widget.dataKey === 'detectionData'
                  ? detectionData
                  : priorityData
              const total =
                widget.totalKey === 'totalDetection'
                  ? totalDetection
                  : totalAlerts

              // Determine filter props based on widget type
              let filterProps = {}
              if (widget.widget_name === 'detection') {
                filterProps = detectionFilterProps
              } else if (widget.widget_name === 'priority') {
                filterProps = priorityFilterProps
              } else if (widget.widget_name === 'alert_timeline') {
                filterProps = alertTimelineFilterProps
              } else if (widget.widget_name === 'alert_type_breakdown') {
                filterProps = alertTypeBreakdownFilterProps
              } else if (widget.widget_name === 'top_problematic_rois') {
                filterProps = topRoisFilterProps // Only date range, no location/camera
              }

              return (
                <div
                  key={widget.widget_name}
                  className='bg-[#2a2f45] rounded-xl shadow-sm border border-[#2a2f45] hover:border-[#3B3F58] transition-colors h-full flex flex-col'
                >
                  {/* Header - Fixed */}
                  <div className='flex justify-between items-start p-4 border-b border-[#3B3F58] flex-shrink-0'>
                    <div className='flex items-center space-x-3 flex-grow min-w-0'>
                      <div className='drag-handle cursor-move text-gray-400 hover:text-white transition-colors'>
                        <FiMove size={20} />
                      </div>
                      <div className='flex-grow min-w-0'>
                        <h3 className='text-md font-semibold text-white truncate'>
                          {t(widget.titleKey)}
                        </h3>
                      </div>
                    </div>
                    <div className='relative z-50 no-drag flex items-center flex-shrink-0 space-x-2'>
                      <FilterDropdown {...filterProps} />
                      <button
                        onClick={() => removeWidget(widget.widget_name)}
                        className='text-gray-500 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-700'
                        title='Remove Widget'
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Body - Scrollable */}
                  <div className='flex-1 overflow-auto scrollbar-thin mt-5 p-4'>
                    <div className='h-full flex flex-col items-center justify-center min-h-0'>
                      <widget.component
                        title={t(widget.titleKey)}
                        data={data}
                        total={total}
                        tenantId={localStorage.getItem('tenant_id')}
                        isLoading={
                          widget.widget_name === 'alert_timeline'
                            ? isAlertTimelineLoading
                            : widget.widget_name === 'alert_type_breakdown'
                            ? isAlertTypeBreakdownLoading
                            : widget.widget_name === 'top_problematic_rois'
                            ? isTopProblematicRoisLoading
                            : false
                        }
                        {...widget.chartProps}
                      />
                    </div>
                  </div>

                  {/* Footer - Fixed */}
                  <div className='flex justify-center items-center p-3 border-t border-[#3B3F58] bg-[#1f2435] rounded-b-xl flex-shrink-0'>
                    <div className='text-xs text-gray-400'>
                      {widget.dataKey === 'detectionData'
                        ? `Total Detections: ${totalDetection}`
                        : widget.dataKey === 'priorityData'
                        ? `Total Alerts: ${totalAlerts}`
                        : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </ResponsiveGridLayout>
        ) : (
          <div className='bg-[#2a2f45] rounded-xl p-12 text-center flex flex-col justify-center items-center'>
            <p className='text-gray-400 text-lg mb-4'>
              {t('dashboard.no_widgets_yet')}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className='flex items-center gap-2 bg-[#3885CC] text-white font-semibold py-2.5 px-5 rounded-full transition-colors'
            >
              <FiPlus size={20} />
              <span>{t('dashboard.add_first_widget')}</span>
            </button>
          </div>
        )}

        {isModalOpen && (
          <AddWidgetModal
            widgets={WIDGETS.filter(
              w => !activeWidgets.some(aw => aw.widget_name === w.widget_name)
            )}
            onAddWidget={addWidget}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
