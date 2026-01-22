import React, { useMemo } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { FiPlus, FiMapPin } from 'react-icons/fi'

// Hooks
import { useDashboardLogic } from './dashboardhooks/useDashboardLogic'

// Components
import AddWidgetModal from './components/AddWidgetModal'
import DashboardWidget from './components/DashboardWidget'
import KpiSection from './components/KpiSection'

const ResponsiveGridLayout = WidthProvider(Responsive)

export default function DashboardOverview () {
  const {
    // Data & State
    kpiData,
    healthData,
    detectionData,
    priorityData,
    totalDetection,
    totalAlerts,

    activeWidgets,
    layout,
    ALL_AVAILABLE_WIDGETS,

    // Loading & Filters
    layoutLoading,
    hasInitialized,
    isKpiLoading,
    kpiFilterProps,

    // Actions
    isModalOpen,
    setIsModalOpen,
    addWidget,
    removeWidget,

    // Handlers
    handleChartLayoutChange,
    handleKpiLayoutChange,

    // Helpers
    getWidgetProps,
    t,
    rawLocations,
    rawCameras,

    // Global Location
    selectedGlobalLocation,
    handleGlobalLocationChange,
    locations: dashboardLocations
  } = useDashboardLogic()

  // --- 1. SEPARATE WIDGETS ---
  const activeKpiWidgets = useMemo(
    () => activeWidgets.filter(w => w.isKpi),
    [activeWidgets]
  )
  const activeChartWidgets = useMemo(
    () => activeWidgets.filter(w => !w.isKpi),
    [activeWidgets]
  )

  // --- 2. SEPARATE LAYOUTS ---
  // Create specific layout subsets for each grid to avoid "dropping" items on re-render
  const kpiLayout = useMemo(() => {
    const kpiIds = new Set(activeKpiWidgets.map(w => w.widget_name))
    return layout.filter(item => kpiIds.has(item.i))
  }, [layout, activeKpiWidgets])

  const chartLayout = useMemo(() => {
    const chartIds = new Set(activeChartWidgets.map(w => w.widget_name))
    return layout.filter(item => chartIds.has(item.i))
  }, [layout, activeChartWidgets])

  const visibleKpiIds = useMemo(
    () => activeKpiWidgets.map(w => w.widget_name),
    [activeKpiWidgets]
  )

  // --- 3. MODAL DATA ---
  const availableWidgetsForModal = useMemo(() => {
    return ALL_AVAILABLE_WIDGETS.filter(
      w => !activeWidgets.some(aw => aw.widget_name === w.widget_name)
    ).map(w => {
      if (w.isKpi)
        return { ...w, titleKey: w.titleKey, descriptionKey: w.descriptionKey }
      return w
    })
  }, [ALL_AVAILABLE_WIDGETS, activeWidgets])

  const mergedKpiData = {
    ...kpiData,
    activeCameras: healthData?.active ?? 0,
    totalCameras: rawCameras?.length ?? 0
  }

  if (layoutLoading && !hasInitialized) {
    return (
      <div className='min-h-screen bg-[#1a1d29] p-6 w-full'>
        <div className='animate-pulse'>
          <div className='h-8 bg-[#2a2f45] w-48 mb-4' />
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen p-6 w-full'>
      <div className=''>
        {/* === HEADER === */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4'>
          <div>
            <h1 className='text-white text-2xl font-bold'>Dashboard</h1>
          </div>

          <div className='flex items-center bg-[#2a2f45] border border-[#3b4259] rounded-xl px-4 py-2 shadow-lg transition-all hover:border-[#3885CC]'>
            <div className='bg-[#3885CC]/10 p-2 rounded-full mr-3'>
              <FiMapPin className='text-[#3885CC]' size={18} />
            </div>
            <div className='flex flex-col'>
              <span className='text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5'>
                {t('dashboard.location') || 'Location'}
              </span>
              <select
                value={selectedGlobalLocation}
                onChange={handleGlobalLocationChange}
                className='bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer min-w-[140px]'
                style={{ backgroundImage: 'none' }}
              >
                {dashboardLocations.map(loc => (
                  <option
                    key={loc.id}
                    value={loc.id}
                    className='bg-[#2a2f45] text-white'
                  >
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* === KPI SECTION === */}
        <div className='flex items-center justify-between mt-8 mb-6'>
          <h2 className='text-white text-2xl font-semibold'>
            {t('dashboard.analytics_overview')}
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className='flex items-center gap-2 bg-[#3885CC] text-white font-semibold py-2.5 px-5 rounded-full hover:bg-[#2d6ca3]'
          >
            <FiPlus size={20} />
            <span>{t('dashboard.add_widget')}</span>
          </button>
        </div>

        <KpiSection
          kpiData={mergedKpiData}
          isLoading={isKpiLoading}
          filterProps={kpiFilterProps}
          locations={rawLocations}
          cameras={rawCameras}
          visibleWidgets={visibleKpiIds}
          layout={kpiLayout}
          onLayoutChange={handleKpiLayoutChange}
          onRemoveWidget={removeWidget}
        />

        {/* === CHART SECTION === */}
        {activeChartWidgets.length > 0 ? (
          <ResponsiveGridLayout
            className='layout z-40'
            layouts={{ lg: chartLayout }} // Use filtered layout
            breakpoints={{ lg: 1200 }}
            cols={{ lg: 12 }}
            rowHeight={30}
            onLayoutChange={l => handleChartLayoutChange(l)}
            onDragStop={l => handleChartLayoutChange(l)}
            onResizeStop={l => handleChartLayoutChange(l)}
            dragHandleClassName='drag-handle'
            draggableCancel='.no-drag'
            margin={[16, 16]}
          >
            {activeChartWidgets.map(widget => (
              <div key={widget.widget_name}>
                <DashboardWidget
                  title={t(widget.titleKey)}
                  widgetName={widget.widget_name}
                  onRemove={removeWidget}
                  filterProps={getWidgetProps(widget.widget_name)}
                >
                  <widget.component
                    data={
                      widget.dataKey === 'detectionData'
                        ? detectionData
                        : priorityData
                    }
                    total={
                      widget.totalKey === 'totalDetection'
                        ? totalDetection
                        : totalAlerts
                    }
                    tenantId={localStorage.getItem('tenant_id')}
                  />
                </DashboardWidget>
              </div>
            ))}
          </ResponsiveGridLayout>
        ) : (
          <div className='bg-[#2a2f45] rounded-xl p-12 text-center mt-6'>
            <p className='text-gray-400 text-lg mb-4'>
              {t('dashboard.no_widgets_yet')}
            </p>
          </div>
        )}

        {isModalOpen && (
          <AddWidgetModal
            widgets={availableWidgetsForModal}
            onAddWidget={addWidget}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
