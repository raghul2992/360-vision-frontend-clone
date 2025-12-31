import { useState, useEffect, useCallback, useRef } from 'react'
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

// Config
import { WIDGETS } from '../config/widgetConfig'

export const useDashboardLogic = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

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
  const [layout, setLayout] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeWidgets, setActiveWidgets] = useState([])
  const [hasInitialized, setHasInitialized] = useState(false)

  const today = new Date()

  // --- GLOBAL FILTER STATE ---
  const [selectedGlobalLocation, setSelectedGlobalLocation] = useState('all')

  // --- SECTION SPECIFIC STATES ---
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
      dispatch(getTenant({ tenant_id: tenantId, skip: 0, limit: 100 }))
    }
  }, [dispatch])

  // =========================================================
  //  SHARED: Logic to Apply Filter to All Sections
  // =========================================================
  const applyLocationFilter = useCallback(
    newLocationId => {
      // 1. Set the global string ID for the dropdown
      setSelectedGlobalLocation(newLocationId)

      let locationObj = null

      // 2. Find the full location object (if not 'all')
      if (newLocationId && newLocationId !== 'all') {
        const loc = locations.find(
          l =>
            String(l.id) === String(newLocationId) ||
            String(l._id) === String(newLocationId)
        )

        if (loc) {
          locationObj = { value: loc.id || loc._id, label: loc.name }
        }
      }

      // 3. Update all individual section states
      // If locationObj is null (because 'all' was selected), these will reset to show all data
      setKpiLocation(locationObj)
      setKpiCamera(null) // Reset camera when location changes

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
    },
    [locations]
  )

  // =========================================================
  //  1. HANDLE MANUAL CHANGE (Dropdown)
  // =========================================================
  const handleGlobalLocationChange = useCallback(
    e => {
      const newLocationId = e.target.value

      // Update URL search params
      const searchParams = new URLSearchParams(location.search)

      if (newLocationId === 'all') {
        searchParams.delete('locationId')
      } else {
        searchParams.set('locationId', newLocationId)
      }

      // Navigate to the new URL.
      // The useEffect below will detect this change and call applyLocationFilter.
      navigate(
        { pathname: location.pathname, search: searchParams.toString() },
        { replace: true }
      )
    },
    [location.pathname, location.search, navigate]
  )

  // =========================================================
  //  2. LISTEN FOR URL QUERY PARAMETERS
  // =========================================================
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    // If param exists, use it. If not, default to 'all'.
    const incomingId = searchParams.get('locationId') || 'all'

    // We only apply logic if we have locations loaded (to find the matching object)
    // and if the incoming ID is different from what is currently selected.
    if (locations.length > 0) {
      if (String(incomingId) !== String(selectedGlobalLocation)) {
        applyLocationFilter(incomingId)
      }
    }
  }, [location.search, locations, selectedGlobalLocation, applyLocationFilter])

  // --- Initial Fetches ---
  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id')
    if (tenantId && !hasRequestedTenant.current) {
      hasRequestedTenant.current = true
      dispatch(getTenant({ tenant_id: tenantId, skip: 0, limit: 100 }))
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
      dispatch(getCameras({ tenantId, skip: 0, limit: 100 }))
    }
  }, [dispatch])

  // --- Layout Management ---
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
        setActiveWidgets(WIDGETS.filter(w => activeNames.has(w.widget_name)))
        lastSavedLayoutRef.current = mappedLayout
      } else {
        setLayout([])
        setActiveWidgets([])
        lastSavedLayoutRef.current = []
      }
      setHasInitialized(true)
    }
  }, [tenant, layoutLoading, hasInitialized])

  useEffect(() => {
    const activeNames = new Set(layout.map(item => item.i))
    setActiveWidgets(WIDGETS.filter(w => activeNames.has(w.widget_name)))
  }, [layout])

  const saveLayoutToApi = useCallback(
    layoutToSave => {
      if (!hasInitialized) return
      const tenantId = localStorage.getItem('tenant_id')
      if (!tenantId) return
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
        h: item.h
      }))

      dispatch(updateWidgetLayout({ tenantId, layout: apiLayout }))
        .unwrap()
        .then(() => refreshTenantData())
        .catch(error => console.error('Failed to save layout:', error))
    },
    [dispatch, hasInitialized, refreshTenantData]
  )

  const addWidget = useCallback(
    widgetName => {
      const newWidget = WIDGETS.find(w => w.widget_name === widgetName)
      if (!newWidget || activeWidgets.some(w => w.widget_name === widgetName)) {
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
      setActiveWidgets(prev => [...prev, newWidget])
      saveLayoutToApi(newLayout)
      setIsModalOpen(false)
    },
    [activeWidgets, layout, saveLayoutToApi]
  )

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
    [activeWidgets, layout, saveLayoutToApi]
  )

  const handleLayoutChange = useCallback(newLayout => setLayout(newLayout), [])

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

  // --- Widget Fetching ---
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
    detectionCamera,
    getDateParams
  ])

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
    priorityCamera,
    getDateParams
  ])

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
    dispatch(getTopProblematicRois(params))
  }, [dispatch, activeWidgets, topRoisDateRange, getDateParams])

  // --- Client Side Filtering ---
  useEffect(() => {
    if (cameras.length > 0 && !isCamerasLoading) {
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
            locationOptions: [],
            cameraOptions: [],
            selectedLocation: null,
            setSelectedLocation: () => {},
            selectedCamera: null,
            setSelectedCamera: () => {},
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
      topRoisDateRange
    ]
  )

  return {
    kpiData,
    healthData,
    detectionData,
    priorityData,
    totalDetection,
    totalAlerts,
    activeWidgets,
    layout,
    WIDGETS,
    locations: [
      { id: 'all', name: t('dashboard.all_locations') || 'All Locations' },
      ...(locations || []).map(l => ({ id: l.id || l._id, name: l.name }))
    ],
    layoutLoading,
    hasInitialized,
    isKpiLoading,
    isAlertTimelineLoading,
    isAlertTypeBreakdownLoading,
    isTopProblematicRoisLoading,
    isModalOpen,
    setIsModalOpen,
    selectedGlobalLocation,
    handleGlobalLocationChange,
    addWidget,
    removeWidget,
    handleLayoutChange,
    saveLayoutToApi,
    kpiFilterProps,
    healthFilterProps,
    getWidgetProps,
    t
  }
}
