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
  const ALL_AVAILABLE_WIDGETS = useMemo(() => {
    const kpis = KPI_WIDGETS_CONFIG.map(k => ({
      ...k,
      widget_name: k.id,
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
  const [layout, setLayout] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeWidgets, setActiveWidgets] = useState([])
  const [hasInitialized, setHasInitialized] = useState(false)

  // --- Global Filter State ---
  const [selectedGlobalLocation, setSelectedGlobalLocation] = useState([])

  // --- Section Specific States (Dates init to null) ---
  const [kpiLocation, setKpiLocation] = useState([])
  const [kpiCamera, setKpiCamera] = useState(null)
  const [kpiDateRange, setKpiDateRange] = useState([null, null])

  const [healthLocation, setHealthLocation] = useState([])
  const [healthCamera, setHealthCamera] = useState(null)
  const [healthDateRange, setHealthDateRange] = useState([null, null])

  const [detectionLocation, setDetectionLocation] = useState([])
  const [detectionCamera, setDetectionCamera] = useState(null)
  const [detectionDateRange, setDetectionDateRange] = useState([null, null])

  const [priorityLocation, setPriorityLocation] = useState([])
  const [priorityCamera, setPriorityCamera] = useState(null)
  const [priorityDateRange, setPriorityDateRange] = useState([null, null])

  const [alertTimelineLocation, setAlertTimelineLocation] = useState([])
  const [alertTimelineCamera, setAlertTimelineCamera] = useState(null)
  const [alertTimelineDateRange, setAlertTimelineDateRange] = useState([
    null,
    null
  ])

  const [alertTypeBreakdownLocation, setAlertTypeBreakdownLocation] = useState(
    []
  )
  const [alertTypeBreakdownCamera, setAlertTypeBreakdownCamera] = useState(null)
  const [alertTypeBreakdownDateRange, setAlertTypeBreakdownDateRange] =
    useState([null, null])

  const [topRoisLocation, setTopRoisLocation] = useState([])
  const [topRoisCamera, setTopRoisCamera] = useState(null)
  const [topRoisDateRange, setTopRoisDateRange] = useState([null, null])

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

  // --- Helper: Extract Location IDs ---
  const getLocationIds = useCallback(selectedLocs => {
    if (Array.isArray(selectedLocs) && selectedLocs.length > 0) {
      return selectedLocs.map(l => l.value)
    }
    return null
  }, [])

  // --- Helper: Check if Camera is in Locations (Used in KPI & Client Filter) ---
  const isInLocations = useCallback((cam, selectedLocs) => {
    if (!selectedLocs || selectedLocs.length === 0) return true
    return selectedLocs.some(l => String(l.value) === String(cam.location_id))
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
  const handleChartLayoutChange = useCallback(
    newChartLayout => {
      if (!hasInitialized) return
      const currentKpiItems = layout.filter(item =>
        KPI_WIDGETS_CONFIG.some(k => k.id === item.i)
      )
      const mergedLayout = [...newChartLayout, ...currentKpiItems]
      setLayout(mergedLayout)
      saveLayoutToApi(mergedLayout)
    },
    [layout, hasInitialized, saveLayoutToApi]
  )

  const handleKpiLayoutChange = useCallback(
    newKpiLayout => {
      if (!hasInitialized) return
      const currentChartItems = layout.filter(
        item => !KPI_WIDGETS_CONFIG.some(k => k.id === item.i)
      )
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
        const mappedLayout = widgetConfig.map(item => ({
          i: item.widget_name,
          x: item.x || 0,
          y: item.y || 0,
          w: item.w,
          h: item.h,
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

  // --- Unified Add/Remove Widget ---
   const KPI_COLS = 5
const CHART_COLS = 12

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

    if (isKpi) {
      // KPI placement (same as we discussed earlier)
      const w = 1
      const h = 1

      const kpiItems = layout.filter(item =>
        KPI_WIDGETS_CONFIG.some(k => k.id === item.i)
      )
      const last = kpiItems[kpiItems.length - 1]

      let x = 0
      let y = 0

      if (last) {
        const spaceOnRow = KPI_COLS - (last.x + last.w)
        if (spaceOnRow >= w) {
          x = last.x + last.w
          y = last.y
        } else {
          x = 0
          y = last.y + last.h
        }
      }

      const newLayoutItem = { i: newWidget.widget_name, x, y, w, h, minW: 1, minH: 1 }
      const newLayout = [...layout, newLayoutItem]
      setLayout(newLayout)
      setActiveWidgets(prev => [...prev, newWidget])
      saveLayoutToApi(newLayout)
      setIsModalOpen(false)
      return
    }

    // === Chart widgets placement ===
    const w = 6   // or read from config if you store per-widget width
    const h = 12

    // Only look at chart items (non‑KPI)
    const chartItems = layout.filter(
      item => !KPI_WIDGETS_CONFIG.some(k => k.id === item.i)
    )
    const last = chartItems[chartItems.length - 1]

    let x = 0
    let y = 0

    if (last) {
      const spaceOnRow = CHART_COLS - (last.x + last.w)
      if (spaceOnRow >= w) {
        // put new chart to the right on the same row
        x = last.x + last.w
        y = last.y
      } else {
        // start new row
        x = 0
        y = last.y + last.h
      }
    }

    const newLayoutItem = {
      i: newWidget.widget_name,
      x,
      y,
      w,
      h,
      minW: 3,
      minH: 8
    }

    const newLayout = [...layout, newLayoutItem]
    setLayout(newLayout)
    setActiveWidgets(prev => [...prev, newWidget])
    saveLayoutToApi(newLayout)
    setIsModalOpen(false)
  },
  [activeWidgets, layout, saveLayoutToApi, ALL_AVAILABLE_WIDGETS]
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
    [layout, activeWidgets, saveLayoutToApi]
  )

  // --- Initial API Fetches ---
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

        const locIds = getLocationIds(kpiLocation)
        if (locIds) params.location_ids = locIds

        if (kpiCamera?.value) params.camera_id = kpiCamera.value

        const res = await dispatch(
          fetchOverviewReports({ tenant_id: tenantId, params })
        )
        if (res.payload) {
          const overviewData = res.payload

          // UPDATED: Filter cameras based on kpiLocation/kpiCamera BEFORE counting
          let filteredCameras = cameras
          if (kpiLocation && kpiLocation.length > 0) {
            filteredCameras = filteredCameras.filter(c =>
              isInLocations(c, kpiLocation)
            )
          }
          if (kpiCamera?.value) {
            filteredCameras = filteredCameras.filter(
              c => c.id === kpiCamera.value
            )
          }

          const totalCameras = filteredCameras.length
          const activeCameras = filteredCameras.filter(
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
  }, [
    dispatch,
    kpiLocation,
    kpiCamera,
    kpiDateRange,
    cameras,
    getDateParams,
    getLocationIds,
    isInLocations // Added dependency
  ])

  // --- Widget Data Fetching Hooks ---

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
    const locIds = getLocationIds(detectionLocation)
    if (locIds) queryParams.location_ids = locIds
    if (detectionCamera?.value) queryParams.camera_id = detectionCamera.value
    dispatch(fetchAlerts({ tenantId, queryParams }))
  }, [
    dispatch,
    activeWidgets,
    detectionDateRange,
    detectionLocation,
    detectionCamera,
    getDateParams,
    getLocationIds
  ])

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
    const locIds = getLocationIds(priorityLocation)
    if (locIds) queryParams.location_ids = locIds
    if (priorityCamera?.value) queryParams.camera_id = priorityCamera.value
    dispatch(fetchAlerts({ tenantId, queryParams }))
  }, [
    dispatch,
    activeWidgets,
    priorityDateRange,
    priorityLocation,
    priorityCamera,
    getDateParams,
    getLocationIds
  ])

  useEffect(() => {
    if (!activeWidgets.some(w => w.widget_name === 'alert_timeline')) return
    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return
    const params = {
      tenant_id: tenantId,
      ...getDateParams(alertTimelineDateRange)
    }
    const locIds = getLocationIds(alertTimelineLocation)
    if (locIds) params.location_ids = locIds
    if (alertTimelineCamera?.value) params.camera_id = alertTimelineCamera.value
    dispatch(getAlertTimeline(params))
  }, [
    dispatch,
    activeWidgets,
    alertTimelineDateRange,
    alertTimelineLocation,
    alertTimelineCamera,
    getDateParams,
    getLocationIds
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
    const locIds = getLocationIds(alertTypeBreakdownLocation)
    if (locIds) params.location_ids = locIds
    if (alertTypeBreakdownCamera?.value)
      params.camera_id = alertTypeBreakdownCamera.value
    dispatch(getAlertTypeBreakdown(params))
  }, [
    dispatch,
    activeWidgets,
    alertTypeBreakdownDateRange,
    alertTypeBreakdownLocation,
    alertTypeBreakdownCamera,
    getDateParams,
    getLocationIds
  ])

  useEffect(() => {
    if (!activeWidgets.some(w => w.widget_name === 'top_problematic_rois'))
      return
    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return
    const params = { tenant_id: tenantId, ...getDateParams(topRoisDateRange) }
    const locIds = getLocationIds(topRoisLocation)
    if (locIds) params.location_ids = locIds
    if (topRoisCamera?.value) params.camera_id = topRoisCamera.value
    dispatch(getTopProblematicRois(params))
  }, [
    dispatch,
    activeWidgets,
    topRoisDateRange,
    topRoisLocation,
    topRoisCamera,
    getDateParams,
    getLocationIds
  ])

  // --- Client Side Filtering ---
  useEffect(() => {
    if (cameras.length > 0 && !isCamerasLoading) {
      const filtered = cameras.filter(c => {
        const locMatch = isInLocations(c, healthLocation)
        const camMatch = !healthCamera || c.id === healthCamera.value
        return locMatch && camMatch
      })

      setHealthData({
        active: filtered.filter(c => c.status === 'active').length,
        inactive: filtered.filter(c => c.status === 'inactive').length,
        processing: filtered.filter(c => c.status === 'processing').length,
        error: filtered.filter(c => c.status === 'error').length
      })

      // Client-side aggregations for Detection/Priority
      const detectionDetections = {}
      const detectionFiltered = cameras.filter(
        cam =>
          isInLocations(cam, detectionLocation) &&
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
          isInLocations(cam, priorityLocation) &&
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
    isCamerasLoading,
    isInLocations // Added dependency
  ])

  // --- Props Generators ---
  const locationOptions = locations.map(loc => ({
    value: loc.id || loc._id,
    label: loc.name
  }))

  const getCamOpts = useCallback(
    locFilters =>
      cameras
        .filter(c => {
          if (!locFilters || locFilters.length === 0) return true
          return locFilters.some(l => String(l.value) === String(c.location_id))
        })
        .map(c => ({ value: c.id, label: c.name })),
    [cameras]
  )

  const kpiFilterProps = {
    locationOptions,
    cameraOptions: getCamOpts(kpiLocation),
    selectedLocation: kpiLocation,
    setSelectedLocation: o => {
      setKpiLocation(o || [])
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
      setHealthLocation(o || [])
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
      const generateProps = (
        locState,
        setLocState,
        camState,
        setCamState,
        dateState,
        setDateState
      ) => ({
        ...base,
        cameraOptions: getCamOpts(locState),
        selectedLocation: locState,
        setSelectedLocation: o => {
          setLocState(o || [])
          setCamState(null)
        },
        selectedCamera: camState,
        setSelectedCamera: setCamState,
        setDateRange: setDateState,
        dateRange: dateState
      })

      switch (widgetName) {
        case 'detection':
          return generateProps(
            detectionLocation,
            setDetectionLocation,
            detectionCamera,
            setDetectionCamera,
            detectionDateRange,
            setDetectionDateRange
          )
        case 'priority':
          return generateProps(
            priorityLocation,
            setPriorityLocation,
            priorityCamera,
            setPriorityCamera,
            priorityDateRange,
            setPriorityDateRange
          )
        case 'alert_timeline':
          return generateProps(
            alertTimelineLocation,
            setAlertTimelineLocation,
            alertTimelineCamera,
            setAlertTimelineCamera,
            alertTimelineDateRange,
            setAlertTimelineDateRange
          )
        case 'alert_type_breakdown':
          return generateProps(
            alertTypeBreakdownLocation,
            setAlertTypeBreakdownLocation,
            alertTypeBreakdownCamera,
            setAlertTypeBreakdownCamera,
            alertTypeBreakdownDateRange,
            setAlertTypeBreakdownDateRange
          )
        case 'top_problematic_rois':
          return generateProps(
            topRoisLocation,
            setTopRoisLocation,
            topRoisCamera,
            setTopRoisCamera,
            topRoisDateRange,
            setTopRoisDateRange
          )
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

  // --- LOGIC FOR MULTI-SELECT GLOBAL LOCATION ---

  const applyLocationFilter = useCallback(
    newLocationIds => {
      let locationObjArr = []

      if (newLocationIds && newLocationIds.length > 0) {
        locationObjArr = locations
          .filter(
            l =>
              newLocationIds.includes(String(l.id)) ||
              newLocationIds.includes(String(l._id))
          )
          .map(l => ({ value: l.id || l._id, label: l.name }))
      }

      setSelectedGlobalLocation(locationObjArr)

      setKpiLocation(locationObjArr)
      setKpiCamera(null)

      setHealthLocation(locationObjArr)
      setHealthCamera(null)

      setDetectionLocation(locationObjArr)
      setDetectionCamera(null)

      setPriorityLocation(locationObjArr)
      setPriorityCamera(null)

      setAlertTimelineLocation(locationObjArr)
      setAlertTimelineCamera(null)

      setAlertTypeBreakdownLocation(locationObjArr)
      setAlertTypeBreakdownCamera(null)

      setTopRoisLocation(locationObjArr)
      setTopRoisCamera(null)
    },
    [locations]
  )

  const handleGlobalLocationChange = useCallback(
    selectedOptions => {
      const selected = selectedOptions || []

      if (selected.length === 0) {
        navigate(location.pathname, { replace: true })
      } else {
        const ids = selected.map(opt => opt.value).join(',')
        navigate(`${location.pathname}?locationIds=${ids}`, {
          replace: true
        })
      }
    },
    [navigate, location.pathname]
  )

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const locationIdsParam = searchParams.get('locationIds')

    if (locations.length > 0) {
      if (locationIdsParam) {
        const idsFromUrl = locationIdsParam.split(',')
        const currentIds = selectedGlobalLocation.map(l => String(l.value))

        const isDifferent =
          idsFromUrl.length !== currentIds.length ||
          !idsFromUrl.every(id => currentIds.includes(id))

        if (isDifferent) {
          applyLocationFilter(idsFromUrl)
        }
      } else if (selectedGlobalLocation.length > 0) {
        applyLocationFilter([])
      }
    }
  }, [location.search, locations, selectedGlobalLocation, applyLocationFilter])

  return {
    kpiData,
    healthData,
    detectionData,
    priorityData,
    totalDetection,
    totalAlerts,

    activeWidgets,
    layout,
    ALL_AVAILABLE_WIDGETS,

    layoutLoading,
    hasInitialized,
    isKpiLoading,
    isAlertTimelineLoading,
    isAlertTypeBreakdownLoading,
    isTopProblematicRoisLoading,

    isModalOpen,
    setIsModalOpen,
    addWidget,
    removeWidget,
    handleChartLayoutChange,
    handleKpiLayoutChange,

    t,
    kpiFilterProps,
    healthFilterProps,
    getWidgetProps,

    rawLocations: locations || [],
    rawCameras: cameras || [],
    dashboardLocationOptions: locationOptions,

    selectedGlobalLocation,
    handleGlobalLocationChange
  }
}
