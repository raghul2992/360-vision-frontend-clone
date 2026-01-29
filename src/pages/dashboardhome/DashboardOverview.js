import React, { useMemo } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import Select, { components } from 'react-select'
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

// --- 1. Custom Checkbox Option ---
const CheckboxOption = props => {
  return (
    <components.Option {...props}>
      <div className='flex items-center gap-2'>
        <input
          type='checkbox'
          checked={props.isSelected}
          onChange={() => null}
          className='w-3 h-3 rounded border-gray-500 text-[#6366F1] focus:ring-0 focus:ring-offset-0 bg-transparent'
        />
        <label>{props.label}</label>
      </div>
    </components.Option>
  )
}

// --- 2. Custom Value Container (The Logic to Hide/Show tags) ---
const CustomValueContainer = ({ children, ...props }) => {
  const { getValue, hasValue } = props
  const selectedCount = getValue().length
  const MAX_DISPLAY_TAGS = 1 // How many tags to show before "+N"

  if (!hasValue) {
    return (
      <components.ValueContainer {...props}>
        {children}
      </components.ValueContainer>
    )
  }

  const [values, input] = children

  if (selectedCount > MAX_DISPLAY_TAGS) {
    return (
      <components.ValueContainer {...props}>
        {/* Render only the first N tags */}
        {values.slice(0, MAX_DISPLAY_TAGS)}

        {/* Render the "+N" Badge */}
        <div className='flex items-center justify-center px-1.5 py-0.5 ml-1 text-[10px] font-medium text-white bg-[#3885CC] rounded'>
          +{selectedCount - MAX_DISPLAY_TAGS}
        </div>

        {/* Keep input for search functionality */}
        {input}
      </components.ValueContainer>
    )
  }

  return (
    <components.ValueContainer {...props}>{children}</components.ValueContainer>
  )
}

// --- 3. Select Styles (Updated to prevent wrapping) ---
const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    color: 'white',
    minHeight: '32px',
    cursor: 'pointer',
    flexWrap: 'nowrap' // Important: prevent wrapping
  }),
  menu: base => ({
    ...base,
    backgroundColor: '#2a2f45',
    color: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #4B5563',
    zIndex: 9999
  }),
  option: (base, { isFocused }) => ({
    ...base,
    backgroundColor: isFocused ? '#3B3F58' : 'transparent',
    color: '#E0E0E0',
    cursor: 'pointer',
    fontSize: '14px'
  }),
  multiValue: base => ({
    ...base,
    backgroundColor: '#3885CC',
    borderRadius: '4px',
    maxWidth: '120px' // Limit individual tag width
  }),
  multiValueLabel: base => ({
    ...base,
    color: '#FFFFFF',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }),
  multiValueRemove: base => ({
    ...base,
    color: '#FFFFFF',
    ':hover': {
      backgroundColor: '#2d6ca3',
      color: '#FFFFFF'
    }
  }),
  singleValue: base => ({ ...base, color: '#FFFFFF' }),
  placeholder: base => ({ ...base, color: '#A5ADC9' }),
  input: base => ({ ...base, color: '#FFFFFF' }),
  // Ensure container doesn't wrap
  valueContainer: base => ({
    ...base,
    flexWrap: 'nowrap',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  })
}

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
    dashboardLocationOptions
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
            <div className='flex flex-col min-w-[200px]'>
              {/* Updated: React-Select with Custom ValueContainer */}
              <Select
                options={dashboardLocationOptions}
                value={selectedGlobalLocation}
                onChange={handleGlobalLocationChange}
                placeholder='All Locations'
                isMulti
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                components={{
                  Option: CheckboxOption,
                  ValueContainer: CustomValueContainer // Injected here
                }}
                styles={selectStyles}
                classNamePrefix='react-select'
              />
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
            layouts={{ lg: chartLayout }}
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
