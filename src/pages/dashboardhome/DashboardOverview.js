import React from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { FiPlus, FiMapPin } from 'react-icons/fi'

// Hooks
import { useDashboardLogic } from './dashboardhooks/useDashboardLogic'

// Components
import AddWidgetModal from './components/AddWidgetModal'
// import KpiSection from './components/KpiSection'
// import HealthSection from './components/HealthSection'
import DashboardWidget from './components/DashboardWidget'

const ResponsiveGridLayout = WidthProvider(Responsive)

export default function DashboardOverview () {
  const {
    // Data
    kpiData,
    healthData,
    detectionData,
    priorityData,
    totalDetection,
    totalAlerts,
    activeWidgets,
    layout,
    WIDGETS,

    // Loading
    layoutLoading,
    hasInitialized,
    isKpiLoading,
    kpiFilterProps,
    isAlertTimelineLoading,
    isAlertTypeBreakdownLoading,
    isTopProblematicRoisLoading,

    // UI & Actions
    isModalOpen,
    setIsModalOpen,
    addWidget,
    removeWidget,
    handleLayoutChange,
    saveLayoutToApi,

    // Helpers
    healthFilterProps,
    getWidgetProps,
    t,

    // Global Filter Props (From Hook)
    locations,
    selectedGlobalLocation,
    handleGlobalLocationChange
  } = useDashboardLogic()

  // Loading Skeleton
  if (layoutLoading && !hasInitialized) {
    return (
      <div className='min-h-screen bg-[#1a1d29] p-6 w-full'>
        <div className='mx-auto max-w-7xl animate-pulse'>
          <div className='flex items-center justify-between mb-8'>
            <div className='h-6 w-64 bg-[#2a2f45] rounded' />
            <div className='h-10 w-40 bg-[#2a2f45] rounded' />
          </div>
          <div className='bg-[#2a2f45] rounded-xl p-6 mb-8 shadow-sm'>
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='bg-[#1f2435] rounded-lg h-24' />
              ))}
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-8'>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className='bg-[#2a2f45] rounded-xl h-64' />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#1a1d29] p-6 w-full'>
      <div className='mx-auto max-w-7xl'>
        {/* === GLOBAL FILTER SECTION === */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4'>
          <div>
            <h1 className='text-white text-2xl font-bold'>Dashboard</h1>
            <p className='text-gray-400 text-sm mt-1'>
              Real-time monitoring and analytics
            </p>
          </div>

          <div className='flex items-center bg-[#2a2f45] border border-[#3b4259] rounded-xl px-4 py-2 shadow-lg transition-all hover:border-[#3885CC]'>
            <div className='bg-[#3885CC]/10 p-2 rounded-full mr-3'>
              <FiMapPin className='text-[#3885CC]' size={18} />
            </div>
            <div className='flex flex-col'>
              {/* <label
                htmlFor='global-location'
                className='text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5'
              >
                Location
              </label> */}
              <select
                id='global-location'
                value={selectedGlobalLocation}
                onChange={handleGlobalLocationChange}
                className='bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer min-w-[80px]'
                style={{ backgroundImage: 'none' }}
              >
                {/* 
                   The hook already provides "All Locations" as the first item 
                   in the 'locations' array, so we just map directly.
                */}
                {locations &&
                  locations.map(loc => (
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
        {/* ================================= */}

        {/* <KpiSection
          kpiData={kpiData}
          isLoading={isKpiLoading}
          filterProps={kpiFilterProps}
        /> */}
        {/* <HealthSection
          healthData={healthData}
          filterProps={healthFilterProps}
        /> */}

        {/* Analytics Header */}
        <div className='flex items-center justify-between mt-8 mb-6'>
          <h2 className='text-white text-2xl font-semibold'>
            {t('dashboard.analytics_overview')}
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className='flex items-center gap-2 bg-[#3885CC] text-white font-semibold py-2.5 px-5 rounded-full transition-colors hover:bg-[#2d6ca3]'
          >
            <FiPlus size={20} />
            <span>{t('dashboard.add_widget')}</span>
          </button>
        </div>

        {/* Grid Layout */}
        {activeWidgets.length > 0 ? (
          <ResponsiveGridLayout
            className='layout'
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200 }}
            cols={{ lg: 12 }}
            rowHeight={30}
            onLayoutChange={handleLayoutChange}
            onDragStop={l => {
              handleLayoutChange(l)
              saveLayoutToApi(l)
            }}
            onResizeStop={l => {
              handleLayoutChange(l)
              saveLayoutToApi(l)
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

              const footerText =
                widget.dataKey === 'detectionData'
                  ? `Total Detections: ${totalDetection}`
                  : widget.dataKey === 'priorityData'
                  ? `Total Alerts: ${totalAlerts}`
                  : ''

              const isLoadingWidget =
                widget.widget_name === 'alert_timeline'
                  ? isAlertTimelineLoading
                  : widget.widget_name === 'alert_type_breakdown'
                  ? isAlertTypeBreakdownLoading
                  : widget.widget_name === 'top_problematic_rois'
                  ? isTopProblematicRoisLoading
                  : false

              return (
                <div key={widget.widget_name}>
                  <DashboardWidget
                    title={t(widget.titleKey)}
                    widgetName={widget.widget_name}
                    onRemove={removeWidget}
                    filterProps={getWidgetProps(widget.widget_name)}
                    footerText={footerText}
                  >
                    <widget.component
                      title={t(widget.titleKey)}
                      data={data}
                      total={total}
                      tenantId={localStorage.getItem('tenant_id')}
                      isLoading={isLoadingWidget}
                      {...widget.chartProps}
                    />
                  </DashboardWidget>
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
