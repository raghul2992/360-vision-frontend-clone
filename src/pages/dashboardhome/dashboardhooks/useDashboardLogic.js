import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import format from 'date-fns/format'
import { useTranslation } from 'react-i18next'

// API Slices
import { getCameras } from '../../../features/cameras/cameraApiSlice'
import { getLocations } from '../../../features/locations/locationApiSlice'
import { fetchAlerts } from '../../../features/alert/alertSlice'
import {
  getTenant,
  updateWidgetLayout,
  getAlertTimeline,
  getAlertTypeBreakdown,
  getTopProblematicRois
} from '../../../features/widgets/widgetApiSlice'
import { fetchOverviewReports } from '../../../features/reports/reportsApiSlice'

// Configs
import { WIDGETS as CHART_WIDGETS } from '../config/widgetConfig'
import { KPI_WIDGETS_CONFIG } from '../config/KpiConfig'

export const useDashboardLogic = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  // --- 1. MERGE CONFIGURATIONS ---
  // Create a unified list of all possible widgets (KPIs + Charts)
  const ALL_AVAILABLE_WIDGETS = useMemo(() => {
    const kpis = KPI_WIDGETS_CONFIG.map(k => ({
      ...k,
      widget_name: k.id, // Normalize ID field to match charts
      isKpi: true
    }))
    return [...CHART_WIDGETS, ...kpis]
  }, [])

  // --- Selectors ---
  const { locations = [] } = useSelector(state => state.locationApi || {})
  const { cameras = [], isLoading: isCamerasLoading } = useSelector(
    state => state.cameraApi || {}
  )
  const {
    tenant = null,
    isLoading: layoutLoading,
    isAlertTimelineLoading,
    isAlertTypeBreakdownLoading,
    isTopProblematicRoisLoading
  } = useSelector(state => state.widgetApi || {})

  // --- Local UI State ---
  const [layout, setLayout] = useState([]) // Master layout (contains both types)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeWidgets, setActiveWidgets] = useState([]) // Stores BOTH types
  const [hasInitialized, setHasInitialized] = useState(false)

  // --- Global Filter State ---
  const today = new Date()
  const [selectedGlobalLocation, setSelectedGlobalLocation] = useState('all')

  // --- Section Specific States ---
  const [kpiLocation, setKpiLocation] = useState(null)
  const [kpiCamera, setKpiCamera] = useState(null)
  const [kpiDateRange, setKpiDateRange] = useState([today, today])

  const [healthLocation, setHealthLocation] = useState(null)
  const [healthCamera, setHealthCamera] = useState(null)
  const [healthDateRange, setHealthDateRange] = useState([today, today])

  const [detectionLocation, setDetectionLocation] = useState(null)
  const [detectionCamera, setDetectionCamera] = useState(null)
  const [detectionDateRange, setDetectionDateRange] = useState([today, today])

  const [priorityLocation, setPriorityLocation] = useState(null)
  const [priorityCamera, setPriorityCamera] = useState(null)
  const [priorityDateRange, setPriorityDateRange] = useState([today, today])

  const [alertTimelineLocation, setAlertTimelineLocation] = useState(null)
  const [alertTimelineCamera, setAlertTimelineCamera] = useState(null)
  const [alertTimelineDateRange, setAlertTimelineDateRange] = useState(null)

  const [alertTypeBreakdownLocation, setAlertTypeBreakdownLocation] =
    useState(null)
  const [alertTypeBreakdownCamera, setAlertTypeBreakdownCamera] = useState(null)
  const [alertTypeBreakdownDateRange, setAlertTypeBreakdownDateRange] =
    useState(null)

  const [topRoisLocation, setTopRoisLocation] = useState(null)
  const [topRoisCamera, setTopRoisCamera] = useState(null)
  const [topRoisDateRange, setTopRoisDateRange] = useState(null)

  // --- Data State ---
  const [kpiData, setKpiData] = useState({
    alertsCount: 0,
    mostFrequent: { detection_type: '-', count: 0 },
    busiestHour: null,
    avgDwell: { average_dwell_time: '0m 0s' },
    safetyViolations: 0,
    peakDetectionHour: null,
    totalCameras: 0,
    activeCameras: 0,
    detectionEfficiency: '0%',
    avgResponseTime: '0m'
  })
  const [isKpiLoading, setIsKpiLoading] = useState(false)

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

  // Refs
  const hasRequestedTenant = useRef(false)
  const hasRequestedLocations = useRef(false)
  const hasRequestedCameras = useRef(false)
  const lastSavedLayoutRef = useRef(null)

  // --- Helper: Format Dates ---
  const getDateParams = useCallback(dateRange => {
    const [start, end] = dateRange || []
    if (start && end && !isNaN(start) && !isNaN(end)) {
      return {
        created_after: format(start, "yyyy-MM-dd'T'00:00:00"),
        created_before: format(end, "yyyy-MM-dd'T'23:59:59")
      }
    }
    return {}
  }, [])

  const refreshTenantData = useCallback(() => {
    const tenantId = localStorage.getItem('tenant_id')
    if (tenantId) {
      hasRequestedTenant.current = false
      dispatch(getTenant({ tenant_id: tenantId, skip: 0, limit: 10 }))
    }
  }, [dispatch])

  // --- API Save Logic ---
  const saveLayoutToApi = useCallback(
    layoutToSave => {
      if (!hasInitialized) return
      const tenantId = localStorage.getItem('tenant_id')
      if (!tenantId) {
        console.warn('Cannot save layout: Missing Tenant ID')
        return
      }

      // Avoid duplicate API calls
      if (
        JSON.stringify(lastSavedLayoutRef.current) ===
        JSON.stringify(layoutToSave)
      )
        return

      lastSavedLayoutRef.current = layoutToSave

      const apiLayout = layoutToSave.map(item => ({
        widget_name: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH
      }))

      dispatch(updateWidgetLayout({ tenantId, layout: apiLayout }))
        .unwrap()
        .then(() => refreshTenantData())
        .catch(error => console.error('Failed to save layout:', error))
    },
    [dispatch, hasInitialized, refreshTenantData]
  )

  // --- SPLIT LAYOUT HANDLERS ---

  // 1. Chart Layout Change: Updates Charts, preserves existing KPI positions
  const handleChartLayoutChange = useCallback(
    newChartLayout => {
      if (!hasInitialized) return

      // Find items in current layout that are KPIs
      const currentKpiItems = layout.filter(item =>
        KPI_WIDGETS_CONFIG.some(k => k.id === item.i)
      )

      // Merge new chart positions with existing KPI positions
      const mergedLayout = [...newChartLayout, ...currentKpiItems]

      setLayout(mergedLayout)
      saveLayoutToApi(mergedLayout)
    },
    [layout, hasInitialized, saveLayoutToApi]
  )

  // 2. KPI Layout Change: Updates KPIs, preserves existing Chart positions
  const handleKpiLayoutChange = useCallback(
    newKpiLayout => {
      if (!hasInitialized) return

      // Find items in current layout that are Charts
      const currentChartItems = layout.filter(
        item => !KPI_WIDGETS_CONFIG.some(k => k.id === item.i)
      )

      // Merge new KPI positions with existing Chart positions
      const mergedLayout = [...newKpiLayout, ...currentChartItems]

      setLayout(mergedLayout)
      saveLayoutToApi(mergedLayout)
    },
    [layout, hasInitialized, saveLayoutToApi]
  )

  // --- Initial Load Logic ---
  useEffect(() => {
    if (!layoutLoading && tenant && !hasInitialized) {
      const widgetConfig = tenant?.meta?.widget_config || []

      if (widgetConfig.length > 0) {
        // Map backend config to Layout format
        const mappedLayout = widgetConfig.map(item => ({
          i: item.widget_name,
          x: item.x || 0,
          y: item.y || 0,
          w: item.w,
          h: item.h,
          // If KPI, set min 1x1, else 3x8
          minW: KPI_WIDGETS_CONFIG.some(k => k.id === item.widget_name) ? 1 : 3,
          minH: KPI_WIDGETS_CONFIG.some(k => k.id === item.widget_name) ? 1 : 8
        }))

        setLayout(mappedLayout)
        const activeNames = new Set(widgetConfig.map(item => item.widget_name))
        const active = ALL_AVAILABLE_WIDGETS.filter(w =>
          activeNames.has(w.widget_name)
        )
        setActiveWidgets(active)
        lastSavedLayoutRef.current = mappedLayout
      } else {
        setLayout([])
        setActiveWidgets([])
        lastSavedLayoutRef.current = []
      }
      setHasInitialized(true)
    }
  }, [tenant, layoutLoading, hasInitialized, ALL_AVAILABLE_WIDGETS])

  // --- Unified Add Widget ---
  const addWidget = useCallback(
    widgetName => {
      const newWidget = ALL_AVAILABLE_WIDGETS.find(
        w => w.widget_name === widgetName
      )

      if (!newWidget || activeWidgets.some(w => w.widget_name === widgetName)) {
        setIsModalOpen(false)
        return
      }

      const isKpi = newWidget.isKpi

      const newLayoutItem = {
        i: newWidget.widget_name,
        // Append to end. 'Infinity' forces grid-layout to place it at the bottom.
        x: 0,
        y: Infinity,
        w: isKpi ? 1 : 6,
        h: isKpi ? 1 : 12,
        minW: isKpi ? 1 : 3,
        minH: isKpi ? 1 : 8
      }

      const newLayout = [...layout, newLayoutItem]

      setLayout(newLayout)
      setActiveWidgets(prev => [...prev, newWidget])
      saveLayoutToApi(newLayout)
      setIsModalOpen(false)
    },
    [activeWidgets, layout, saveLayoutToApi, ALL_AVAILABLE_WIDGETS]
  )

  // --- Unified Remove Widget ---
  const removeWidget = useCallback(
    widgetName => {
      const newLayout = layout.filter(item => item.i !== widgetName)
      const newActiveWidgets = activeWidgets.filter(
        w => w.widget_name !== widgetName
      )

      setLayout(newLayout)
      setActiveWidgets(newActiveWidgets)
      saveLayoutToApi(newLayout)
    },
    [layout, activeWidgets, saveLayoutToApi]
  )

  // --- Initial API Fetches (Tenant, Locations, Cameras) ---
  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id')
    if (tenantId && !hasRequestedTenant.current) {
      hasRequestedTenant.current = true
      dispatch(getTenant({ tenant_id: tenantId, skip: 0, limit: 10 }))
    }
  }, [dispatch])

  useEffect(() => {
    const tenant_id = localStorage.getItem('tenant_id')
    if (tenant_id && !hasRequestedLocations.current) {
      hasRequestedLocations.current = true
      dispatch(getLocations({ tenantId: tenant_id }))
    }
  }, [dispatch])

  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id')
    if (tenantId && !hasRequestedCameras.current) {
      hasRequestedCameras.current = true
      dispatch(getCameras({ tenantId, skip: 0, limit: 10 }))
    }
  }, [dispatch])

  // --- KPI Data Fetching ---
  useEffect(() => {
    const fetchKpiData = async () => {
      const tenantId = localStorage.getItem('tenant_id')
      if (!tenantId) return
      setIsKpiLoading(true)
      try {
        const params = { ...getDateParams(kpiDateRange) }
        if (kpiLocation?.value) params.location_id = kpiLocation.value
        if (kpiCamera?.value) params.camera_id = kpiCamera.value

        const res = await dispatch(
          fetchOverviewReports({ tenant_id: tenantId, params })
        )
        if (res.payload) {
          const overviewData = res.payload
          const totalCameras = cameras.length
          const activeCameras = cameras.filter(
            c => c.status === 'active'
          ).length
          const detectionEfficiency =
            totalCameras > 0
              ? `${Math.round((activeCameras / totalCameras) * 100)}%`
              : '0%'

          let dwellTime = '0m 0s'
          if (overviewData.avgDwell?.average_dwell_time) {
            const dwellSeconds = parseInt(
              overviewData.avgDwell.average_dwell_time
            )
            if (!isNaN(dwellSeconds))
              dwellTime = `${Math.floor(dwellSeconds / 60)}m ${
                dwellSeconds % 60
              }s`
          }

          setKpiData({
            alertsCount: overviewData.alertsCount?.count || 0,
            mostFrequent: {
              detection_type:
                overviewData.mostFrequent?.detection_type?.replace(/_/g, ' ') ||
                '-',
              count: overviewData.mostFrequent?.count || 0
            },
            busiestHour: overviewData.busiestHour || null,
            avgDwell: { average_dwell_time: dwellTime },
            safetyViolations: overviewData.safetyViolations?.count || 0,
            peakDetectionHour: overviewData.peakDetectionHour || null,
            totalCameras,
            activeCameras,
            detectionEfficiency,
            avgResponseTime: '2m 30s'
          })
        }
      } catch (error) {
        console.error('Failed to fetch KPI:', error)
      } finally {
        setIsKpiLoading(false)
      }
    }
    fetchKpiData()
  }, [dispatch, kpiLocation, kpiCamera, kpiDateRange, cameras, getDateParams])

  // --- Widget Data Fetching ---

  // Detection Chart
  useEffect(() => {
    if (!activeWidgets.some(w => w.widget_name === 'detection')) return
    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return
    const queryParams = {
      type: 'event_alert',
      skip: 0,
      limit: 10,
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
    detectionCamera,
    getDateParams
  ])

  // Priority Chart
  useEffect(() => {
    if (!activeWidgets.some(w => w.widget_name === 'priority')) return
    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return
    const queryParams = {
      type: 'event_alert',
      skip: 0,
      limit: 10,
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
    priorityCamera,
    getDateParams
  ])

  // Alert Timeline
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
    alertTimelineCamera,
    getDateParams
  ])

  // Alert Type Breakdown
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
    alertTypeBreakdownCamera,
    getDateParams
  ])

  // Top Problematic ROIs
  useEffect(() => {
    if (!activeWidgets.some(w => w.widget_name === 'top_problematic_rois'))
      return
    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return
    const params = { tenant_id: tenantId, ...getDateParams(topRoisDateRange) }
    if (topRoisLocation?.value) params.location_id = topRoisLocation.value
    if (topRoisCamera?.value) params.camera_id = topRoisCamera.value
    dispatch(getTopProblematicRois(params))
  }, [
    dispatch,
    activeWidgets,
    topRoisDateRange,
    topRoisLocation,
    topRoisCamera,
    getDateParams
  ])

  // --- Client Side Filtering (Health, Detection Local Aggregation) ---
  useEffect(() => {
    if (cameras.length > 0 && !isCamerasLoading) {
      // Health Data
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

      // Detection Data Aggregation
      const detectionDetections = {}
      const detectionFiltered = cameras.filter(
        cam =>
          (!detectionLocation || cam.location_id === detectionLocation.value) &&
          (!detectionCamera || cam.id === detectionCamera.value)
      )
      detectionFiltered.forEach(cam =>
        cam.rois?.forEach(roi => {
          if (roi.detection_type)
            detectionDetections[roi.detection_type] =
              (detectionDetections[roi.detection_type] || 0) + 1
        })
      )
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

      // Priority Data Aggregation
      const priorityPriorities = {}
      const priorityFiltered = cameras.filter(
        cam =>
          (!priorityLocation || cam.location_id === priorityLocation.value) &&
          (!priorityCamera || cam.id === priorityCamera.value)
      )
      priorityFiltered.forEach(cam =>
        cam.rois?.forEach(roi => {
          if (roi.alert_priority)
            priorityPriorities[roi.alert_priority] =
              (priorityPriorities[roi.alert_priority] || 0) + 1
        })
      )
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
    healthLocation,
    healthCamera,
    detectionLocation,
    detectionCamera,
    priorityLocation,
    priorityCamera,
    isCamerasLoading
  ])

  // --- Props Generators ---
  const locationOptions = locations.map(loc => ({
    value: loc.id || loc._id,
    label: loc.name
  }))
  const getCamOpts = useCallback(
    locFilter =>
      cameras
        .filter(c => !locFilter || c.location_id === locFilter.value)
        .map(c => ({ value: c.id, label: c.name })),
    [cameras]
  )

  const kpiFilterProps = {
    locationOptions,
    cameraOptions: getCamOpts(kpiLocation),
    selectedLocation: kpiLocation,
    setSelectedLocation: o => {
      setKpiLocation(o)
      setKpiCamera(null)
    },
    selectedCamera: kpiCamera,
    setSelectedCamera: setKpiCamera,
    setDateRange: setKpiDateRange,
    dateRange: kpiDateRange
  }

  const healthFilterProps = {
    locationOptions,
    cameraOptions: getCamOpts(healthLocation),
    selectedLocation: healthLocation,
    setSelectedLocation: o => {
      setHealthLocation(o)
      setHealthCamera(null)
    },
    selectedCamera: healthCamera,
    setSelectedCamera: setHealthCamera,
    setDateRange: setHealthDateRange,
    dateRange: healthDateRange
  }

  const getWidgetProps = useCallback(
    widgetName => {
      const base = { locationOptions }
      switch (widgetName) {
        case 'detection':
          return {
            ...base,
            cameraOptions: getCamOpts(detectionLocation),
            selectedLocation: detectionLocation,
            setSelectedLocation: o => {
              setDetectionLocation(o)
              setDetectionCamera(null)
            },
            selectedCamera: detectionCamera,
            setSelectedCamera: setDetectionCamera,
            setDateRange: setDetectionDateRange,
            dateRange: detectionDateRange
          }
        case 'priority':
          return {
            ...base,
            cameraOptions: getCamOpts(priorityLocation),
            selectedLocation: priorityLocation,
            setSelectedLocation: o => {
              setPriorityLocation(o)
              setPriorityCamera(null)
            },
            selectedCamera: priorityCamera,
            setSelectedCamera: setPriorityCamera,
            setDateRange: setPriorityDateRange,
            dateRange: priorityDateRange
          }
        case 'alert_timeline':
          return {
            ...base,
            cameraOptions: getCamOpts(alertTimelineLocation),
            selectedLocation: alertTimelineLocation,
            setSelectedLocation: o => {
              setAlertTimelineLocation(o)
              setAlertTimelineCamera(null)
            },
            selectedCamera: alertTimelineCamera,
            setSelectedCamera: setAlertTimelineCamera,
            setDateRange: setAlertTimelineDateRange,
            dateRange: alertTimelineDateRange
          }
        case 'alert_type_breakdown':
          return {
            ...base,
            cameraOptions: getCamOpts(alertTypeBreakdownLocation),
            selectedLocation: alertTypeBreakdownLocation,
            setSelectedLocation: o => {
              setAlertTypeBreakdownLocation(o)
              setAlertTypeBreakdownCamera(null)
            },
            selectedCamera: alertTypeBreakdownCamera,
            setSelectedCamera: setAlertTypeBreakdownCamera,
            setDateRange: setAlertTypeBreakdownDateRange,
            dateRange: alertTypeBreakdownDateRange
          }
        case 'top_problematic_rois':
          return {
            ...base,
            cameraOptions: getCamOpts(topRoisLocation),
            selectedLocation: topRoisLocation,
            setSelectedLocation: o => {
              setTopRoisLocation(o)
              setTopRoisCamera(null)
            },
            selectedCamera: topRoisCamera,
            setSelectedCamera: setTopRoisCamera,
            setDateRange: setTopRoisDateRange,
            dateRange: topRoisDateRange
          }
        default:
          return {}
      }
    },
    [
      locationOptions,
      getCamOpts,
      detectionLocation,
      detectionCamera,
      detectionDateRange,
      priorityLocation,
      priorityCamera,
      priorityDateRange,
      alertTimelineLocation,
      alertTimelineCamera,
      alertTimelineDateRange,
      alertTypeBreakdownLocation,
      alertTypeBreakdownCamera,
      alertTypeBreakdownDateRange,
      topRoisLocation,
      topRoisCamera,
      topRoisDateRange
    ]
  )

  // --- Logic for Global Location application ---
  const applyLocationFilter = useCallback(
    newLocationId => {
      setSelectedGlobalLocation(newLocationId)
      let locationObj = null
      if (newLocationId && newLocationId !== 'all') {
        const loc = locations.find(
          l =>
            String(l.id) === String(newLocationId) ||
            String(l._id) === String(newLocationId)
        )
        if (loc) locationObj = { value: loc.id || loc._id, label: loc.name }
      }
      // Apply to all local states
      setKpiLocation(locationObj)
      setKpiCamera(null)
      setHealthLocation(locationObj)
      setHealthCamera(null)
      setDetectionLocation(locationObj)
      setDetectionCamera(null)
      setPriorityLocation(locationObj)
      setPriorityCamera(null)
      setAlertTimelineLocation(locationObj)
      setAlertTimelineCamera(null)
      setAlertTypeBreakdownLocation(locationObj)
      setAlertTypeBreakdownCamera(null)
      setTopRoisLocation(locationObj)
      setTopRoisCamera(null)
    },
    [locations]
  )

  const handleGlobalLocationChange = useCallback(
    e => {
      const newLocationId = e.target.value
      if (newLocationId === 'all')
        navigate(location.pathname, { replace: true })
      else
        navigate(`${location.pathname}?locationId=${newLocationId}`, {
          replace: true
        })
    },
    [navigate, location.pathname]
  )

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const incomingId = searchParams.get('locationId') || 'all'
    if (locations.length > 0 || incomingId === 'all') {
      if (String(incomingId) !== String(selectedGlobalLocation))
        applyLocationFilter(incomingId)
    }
  }, [location.search, locations, selectedGlobalLocation, applyLocationFilter])

  // --- EXPORT ---
  return {
    kpiData,
    healthData,
    detectionData,
    priorityData,
    totalDetection,
    totalAlerts,

    // Unified State & Config
    activeWidgets,
    layout,
    ALL_AVAILABLE_WIDGETS,

    // Loading State
    layoutLoading,
    hasInitialized,
    isKpiLoading,
    isAlertTimelineLoading,
    isAlertTypeBreakdownLoading,
    isTopProblematicRoisLoading,

    // UI State
    isModalOpen,
    setIsModalOpen,

    // Unified Actions
    addWidget,
    removeWidget,

    // Split Layout Handlers (Crucial for preventing grid conflicts)
    handleChartLayoutChange,
    handleKpiLayoutChange,

    // Helpers
    t,
    kpiFilterProps,
    healthFilterProps,
    getWidgetProps,

    // Raw Data & Locations
    rawLocations: locations || [],
    rawCameras: cameras || [],
    locations: [
      { id: 'all', name: t('dashboard.all_locations') || 'All Locations' },
      ...(locations || []).map(l => ({ id: l.id || l._id, name: l.name }))
    ],

    // Global Location Filter
    selectedGlobalLocation,
    handleGlobalLocationChange
  }
}
