import React, { useState, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import KpiWidget from './kpistatswidgets'
import { KPI_WIDGETS_CONFIG } from '../config/KpiConfig'
import { fetchOverviewReports } from '../../../features/reports/reportsApiSlice'
import { Responsive, WidthProvider } from 'react-grid-layout'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

const KpiSection = ({
  kpiData,
  isLoading,
  visibleWidgets = [],
  layout = [],
  onLayoutChange,
  onRemoveWidget,
  locations = [],
  cameras = []
}) => {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  // Internal data fetching state
  const [widgetFilters, setWidgetFilters] = useState({})
  const [specificWidgetData, setSpecificWidgetData] = useState({})
  const [loadingWidgets, setLoadingWidgets] = useState({})

  // --- HELPER: Extract Location IDs (Handles Array or Single) ---
  const getLocationIds = selectedLocs => {
    if (Array.isArray(selectedLocs) && selectedLocs.length > 0) {
      return selectedLocs.map(l => l.value)
    }
    if (selectedLocs && selectedLocs.value) {
      return [selectedLocs.value]
    }
    return null
  }

  // --- HELPER: Format Date for API ---
  const getDateParams = dateRange => {
    const [start, end] = dateRange || []
    if (start && end && !isNaN(start) && !isNaN(end)) {
      return {
        created_after: format(start, "yyyy-MM-dd'T'00:00:00"),
        created_before: format(end, "yyyy-MM-dd'T'23:59:59")
      }
    }
    return {}
  }

  // --- ACTION: Fetch Data for a Single Widget ---
  const fetchSingleWidgetData = async (widgetId, filters) => {
    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return

    const params = { ...getDateParams(filters.dateRange) }

    // Updated: Handle multiple location IDs
    const locIds = getLocationIds(filters.selectedLocation)
    if (locIds) {
      params.location_ids = locIds
    }

    if (filters.selectedCamera?.value) {
      params.camera_id = filters.selectedCamera.value
    }

    setLoadingWidgets(prev => ({ ...prev, [widgetId]: true }))

    try {
      const res = await dispatch(
        fetchOverviewReports({ tenant_id: tenantId, params })
      )
      if (res.payload) {
        const overviewData = res.payload
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

        const formattedData = {
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
          detectionEfficiency: '0%',
          avgResponseTime: '2m 30s'
        }
        setSpecificWidgetData(prev => ({ ...prev, [widgetId]: formattedData }))
      }
    } catch (err) {
      console.error(`Failed to fetch data for widget ${widgetId}`, err)
    } finally {
      setLoadingWidgets(prev => ({ ...prev, [widgetId]: false }))
    }
  }

  // --- EVENT: Handle Filter Change ---
  const updateWidgetFilter = (widgetId, key, value) => {
    setWidgetFilters(prev => {
      const current = prev[widgetId] || {}
      let newFilters = { ...current }
      if (key === 'selectedLocation') {
        newFilters = {
          ...newFilters,
          selectedLocation: value,
          selectedCamera: null // Reset camera when locations change
        }
      } else {
        newFilters = { ...newFilters, [key]: value }
      }
      fetchSingleWidgetData(widgetId, newFilters)
      return { ...prev, [widgetId]: newFilters }
    })
  }

  // --- HELPER: Get Data for Rendering ---
  const getWidgetData = widgetId => {
    const filters = widgetFilters[widgetId]

    // Check if there are ACTUAL local filters active
    const hasLocalFilters =
      filters &&
      ((filters.selectedLocation && filters.selectedLocation.length > 0) ||
        filters.selectedCamera ||
        (filters.dateRange && filters.dateRange[0]))

    // Start with either specific data (if filtered locally) or global data (if no local filters)
    let displayData =
      hasLocalFilters && specificWidgetData[widgetId]
        ? { ...specificWidgetData[widgetId] }
        : { ...kpiData } // Trust the parent data if no local filters

    // Recalculate Active Cameras / Efficiency based on Local Selection ONLY if local filters exist
    if (hasLocalFilters && cameras.length > 0) {
      let filteredCameras = [...cameras]

      const locIds = getLocationIds(filters?.selectedLocation)
      if (locIds) {
        filteredCameras = filteredCameras.filter(c =>
          locIds.includes(c.location_id)
        )
      }

      if (filters?.selectedCamera?.value) {
        filteredCameras = filteredCameras.filter(
          c => c.id === filters.selectedCamera.value
        )
      }

      displayData.activeCameras = filteredCameras.filter(
        c => c.status === 'active'
      ).length
      displayData.totalCameras = filteredCameras.length

      const eff =
        displayData.totalCameras > 0
          ? Math.round(
              (displayData.activeCameras / displayData.totalCameras) * 100
            )
          : 0
      displayData.detectionEfficiency = `${eff}%`
    }
    return displayData
  }

  // --- HELPER: Get Cameras matching ANY selected location ---
  const getLocalCameraOptions = selectedLocs => {
    if (!cameras) return []

    // Updated: Handle multiple locations
    const locIds = getLocationIds(selectedLocs)

    // If no location selected locally, show nothing (to avoid confusion with global list)
    if (!locIds) return []

    return cameras
      .filter(c => locIds.includes(c.location_id))
      .map(c => ({ value: c.id, label: c.name }))
  }

  // Filter active widget configs
  const activeWidgets = useMemo(
    () => KPI_WIDGETS_CONFIG.filter(w => visibleWidgets.includes(w.id)),
    [visibleWidgets]
  )

  // Generate fallback layout
  const displayLayout = useMemo(() => {
    if (layout && layout.length > 0) return layout
    return activeWidgets.map((w, i) => ({
      i: w.id,
      x: i % 5,
      y: Math.floor(i / 5),
      w: 1,
      h: 1
    }))
  }, [layout, activeWidgets])

  const globalLocationOptions = useMemo(
    () => locations.map(l => ({ value: l.id || l._id, label: l.name })),
    [locations]
  )

  if (isLoading)
    return <div className='h-[140px] bg-[#212332] animate-pulse rounded' />
  if (activeWidgets.length === 0) return null

  return (
    <div className='mb-8'>
      <ResponsiveGridLayout
        layouts={{ lg: displayLayout }}
        breakpoints={{ lg: 996, md: 768, xxs: 0 }}
        cols={{ lg: 5, md: 2, xxs: 1 }}
        rowHeight={140}
        margin={[16, 16]}
        isDraggable={true}
        isResizable={false}
        draggableHandle='.drag-handle'
        onLayoutChange={l => onLayoutChange && onLayoutChange(l)}
      >
        {activeWidgets.map(widget => {
          const widgetFilter = widgetFilters[widget.id] || {}
          const isWidgetLoading = loadingWidgets[widget.id]
          const finalData = getWidgetData(widget.id)

          // Get cameras based on the multi-location selection
          const specificCameraOptions = getLocalCameraOptions(
            widgetFilter.selectedLocation
          )

          const specificFilterProps = {
            locationOptions: globalLocationOptions,
            cameraOptions: specificCameraOptions,
            selectedLocation: widgetFilter.selectedLocation || [], // Default to empty array for multi
            selectedCamera: widgetFilter.selectedCamera || null,
            dateRange: widgetFilter.dateRange || [null, null],
            setSelectedLocation: val =>
              updateWidgetFilter(widget.id, 'selectedLocation', val),
            setSelectedCamera: val =>
              updateWidgetFilter(widget.id, 'selectedCamera', val),
            setDateRange: val =>
              updateWidgetFilter(widget.id, 'dateRange', val),
            isMinimal: true
          }

          return (
            <div key={widget.id} className='relative overflow-visible !z-auto'>
              <div className='h-full relative'>
                {isWidgetLoading && (
                  <div className='absolute inset-0 bg-[#212332]/80 z-20 flex items-center justify-center rounded-lg backdrop-blur-sm'>
                    <div className='w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin'></div>
                  </div>
                )}
                <KpiWidget
                  title={t(widget.titleKey)}
                  value={widget.getValue(finalData)}
                  subText={widget.getSubText(finalData, t)}
                  subIcon={widget.subIcon}
                  subClass={widget.subClass}
                  onRemove={() => onRemoveWidget(widget.id)}
                  filterProps={specificFilterProps}
                />
              </div>
            </div>
          )
        })}
      </ResponsiveGridLayout>
    </div>
  )
}

export default KpiSection
