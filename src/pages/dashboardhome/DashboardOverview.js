import React, { useMemo } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import Select, { components } from 'react-select'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { bgcolors, textcolors, borderstyles, colors } from '../../theme'
import { PlusIcon, MapPinIcon, ChevronDownIcon } from '../../icons'

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
          className={`w-3 h-3 rounded ${borderstyles.checkboxBorder} ${textcolors.indigo} focus:ring-0 focus:ring-offset-0 bg-transparent`}
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
        <div className={`flex items-center justify-center px-1.5 py-0.5 ml-1 text-[10px] font-medium text-white ${bgcolors.primary} rounded`}>
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

// --- 3. Custom Dropdown Indicator with smooth rotation ---
const DropdownIndicator = props => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDownIcon
        size={16}
        style={{
          color: colors.textDim,
          transform: props.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s ease'
        }}
      />
    </components.DropdownIndicator>
  )
}

// --- 4. Select Styles (Updated to prevent wrapping) ---
const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    color: colors.text,
    minHeight: '32px',
    cursor: 'pointer',
    flexWrap: 'nowrap' // Important: prevent wrapping
  }),
  menu: base => ({
    ...base,
    backgroundColor: colors.panel,
    color: colors.text,
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    zIndex: 9999,
    width: '280px',
    left: '-62px',
    marginTop: '15px'
  }),
  menuList: base => ({
    ...base,
    padding: '4px'
  }),
  option: (base, { isFocused }) => ({
    ...base,
    backgroundColor: isFocused ? colors.bg2 : 'transparent',
    color: colors.text,
    cursor: 'pointer',
    fontSize: '14px'
  }),
  multiValue: base => ({
    ...base,
    backgroundColor: colors.primary,
    borderRadius: '4px',
    maxWidth: '120px' // Limit individual tag width
  }),
  multiValueLabel: base => ({
    ...base,
    color: colors.panel,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }),
  multiValueRemove: base => ({
    ...base,
    color: colors.panel,
    ':hover': {
      backgroundColor: colors.accentDark,
      color: '#FFFFFF'
    }
  }),
  singleValue: base => ({ ...base, color: colors.text }),
  placeholder: base => ({ ...base, color: colors.textDim }),
  input: base => ({ ...base, color: colors.text }),
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
      <div className={`min-h-screen ${bgcolors.white} p-6 w-full`}>
        <div className='mx-auto max-w-7xl animate-pulse'>
          <div className='flex items-center justify-between mb-8'>
            <div className='h-6 w-64 bg-gray-200 rounded' />
            <div className='h-10 w-40 bg-gray-200 rounded' />
          </div>
          <div className='bg-gray-200 rounded-xl p-6 mb-8 shadow-sm'>
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='bg-gray-100 rounded-lg h-24' />
              ))}
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-8'>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className='bg-gray-200 rounded-xl h-64' />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={` ${bgcolors.surface} min-h-screen p-4 sm:p-6 w-full`}>
      <div className='mx-auto'>
        {/* === GLOBAL FILTER SECTION === */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4'>
          <div>
            <h1 className={`${textcolors.dark} text-3xl font-bold`}>Dashboard</h1>
            <p className={`${textcolors.dim} text-sm mt-1`}>
              Real-time monitoring and analytics
            </p>
          </div>

          <div className={`flex items-center ${bgcolors.white} ${borderstyles.light} rounded-xl px-4 py-2 shadow-sm transition-all ${borderstyles.hoverAccentStrong} w-full sm:w-[280px]`}>
            <div className={`${bgcolors.primaryFaint} p-2 rounded-full mr-3 flex-shrink-0`}>
              <MapPinIcon className={textcolors.primary} size={18} />
            </div>
            <div className='flex-1 min-w-0'>
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
                  ValueContainer: CustomValueContainer,
                  DropdownIndicator
                }}
                styles={selectStyles}
                classNamePrefix='react-select'
              />
            </div>
          </div>
        </div>

        {/* === KPI SECTION === */}
        <div className='flex flex-wrap items-center justify-between gap-3 mt-8 mb-6'>
          <h2 className={`${textcolors.dark} text-2xl font-bold`}>
            {t('dashboard.analytics_overview')}
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center gap-2 ${bgcolors.primary} text-white font-semibold py-2.5 px-5 rounded-full ${bgcolors.primaryHover} transition-colors shadow-sm`}
          >
            <PlusIcon size={20} />
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
          selectedGlobalLocation={selectedGlobalLocation}
        />

        {/* === CHART SECTION === */}
        {activeChartWidgets.length > 0 ? (
          <>
            {/* Mobile: simple vertical stack, no drag/resize */}
            <div className='md:hidden flex flex-col gap-4 mt-4'>
              {activeChartWidgets.map(widget => (
                <div key={widget.widget_name} className='h-[380px]'>
                  <DashboardWidget
                    title={t(widget.titleKey)}
                    widgetName={widget.widget_name}
                    onRemove={removeWidget}
                    filterProps={getWidgetProps(widget.widget_name)}
                    infoText={widget.infoKey ? t(widget.infoKey) : undefined}
                  >
                    <widget.component
                      data={widget.dataKey === 'detectionData' ? detectionData : priorityData}
                      total={widget.totalKey === 'totalDetection' ? totalDetection : totalAlerts}
                      tenantId={localStorage.getItem('tenant_id')}
                    />
                  </DashboardWidget>
                </div>
              ))}
            </div>

            {/* Desktop: draggable/resizable grid */}
            <div className='hidden md:block'>
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
                      infoText={widget.infoKey ? t(widget.infoKey) : undefined}
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
            </div>
          </>
        ) : (
          <div className={`${bgcolors.white} rounded-2xl ${borderstyles.light} p-12 text-center mt-6`}>
            <p className={`${textcolors.muted} text-lg mb-4`}>
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
