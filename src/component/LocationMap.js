import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useLayoutEffect
} from 'react'
import { GoogleMap, MarkerF, OverlayView } from '@react-google-maps/api'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getLocations } from '../features/locations/locationApiSlice'
import { fetchTenantsUsers } from '../features/userManagement/userApiSlice'
import { MARKER_ICON_PATHS } from '../utils/locationMarkerConstants'
import ButtonComponent from './Button'
import AlertSeverityIcon from './AlertSeverityIcon'

// Map container style
const containerStyle = {
  width: '100%',
  height: '60vh',
  borderRadius: '0.5rem'
}

// Default map center
const defaultCenter = { lat: 20.0, lng: 0.0 }

// Create custom marker icon
const createMarkerIcon = (color, iconType = 'default') => {
  const path = MARKER_ICON_PATHS[iconType] || MARKER_ICON_PATHS.default

  return {
    path,
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 0,
    scale: 1.5,
    anchor: new window.google.maps.Point(10, 25)
  }
}

// Map style
const lightMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c9c9c9' }]
  }
]

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: lightMapStyles
}

// =========================================================================
// CUSTOM POPUP COMPONENT (With Smart Positioning)
// =========================================================================
const CustomPopup = ({
  position,
  location,
  onClose,
  onViewDashboard,
  onViewAlerts,
  onMouseEnter,
  onMouseLeave,
  map // Recieve map instance to calculate boundaries
}) => {
  const containerRef = useRef(null)

  // Initial state: centered above the marker
  const [popupStyle, setPopupStyle] = useState({
    transformX: '-50%',
    transformY: '-100%',
    marginTop: '-15px',
    isFlipped: false // true if popup is below marker
  })

  // useLayoutEffect runs before browser paint - prevents visual jumping
  useLayoutEffect(() => {
    if (!containerRef.current || !map) return

    const calculatePosition = () => {
      const popup = containerRef.current
      const mapDiv = map.getDiv()

      if (!mapDiv) return

      const mapRect = mapDiv.getBoundingClientRect()
      const popupRect = popup.getBoundingClientRect()

      let newTransformX = '-50%'
      let newTransformY = '-100%'
      let newMarginTop = '-15px'
      let isFlipped = false

      // 1. VERTICAL CHECK (Top Edge)
      // If popup top goes outside map top (plus 20px buffer for UI controls)
      if (popupRect.top < mapRect.top + 40) {
        newTransformY = '0%' // Align top of popup to marker anchor
        newMarginTop = '15px' // Push down below marker
        isFlipped = true
      }

      // 2. HORIZONTAL CHECK (Left/Right Edges)
      // Note: We adjust the X transform to shift the box relative to the anchor
      if (popupRect.left < mapRect.left + 10) {
        // Hits left edge -> Shift box to the right
        newTransformX = '-10%'
      } else if (popupRect.right > mapRect.right - 10) {
        // Hits right edge -> Shift box to the left
        newTransformX = '-90%'
      }

      setPopupStyle({
        transformX: newTransformX,
        transformY: newTransformY,
        marginTop: newMarginTop,
        isFlipped
      })
    }

    // Run calculation immediately
    calculatePosition()

    // Optional: Re-calculate on window resize
    window.addEventListener('resize', calculatePosition)
    return () => window.removeEventListener('resize', calculatePosition)
  }, [map, location])

  return (
    <OverlayView position={position} mapPaneName={OverlayView.FLOAT_PANE}>
      <div
        ref={containerRef}
        className='custom-popup-container'
        style={{
          position: 'absolute',
          transform: `translate(${popupStyle.transformX}, ${popupStyle.transformY})`,
          marginTop: popupStyle.marginTop,
          // Apply different animation based on direction
          animation: popupStyle.isFlipped
            ? 'popupSlideDown 0.3s ease-out'
            : 'popupSlideIn 0.3s ease-out',
          pointerEvents: 'auto',
          zIndex: 9999
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className='bg-white rounded-lg shadow-2xl p-4 min-w-[280px] max-w-[320px] border border-gray-200'>
          <button
            onClick={onClose}
            className='absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors'
          >
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </button>

          <div className='flex flex-col items-center'>
            <h3 className='font-bold text-lg mb-1 text-gray-900 text-center pr-6'>
              {location.name}
            </h3>

            {location.recentAlert && (
              <div className='flex flex-col items-center mb-3 p-2'>
                <h4 className='font-extrabold text-xl text-gray-900'>
                  {location.recentAlert.title}
                </h4>
                <p className='text-md text-gray-700 font-semibold mb-2'>
                  {location.recentAlert.time}
                </p>
                <AlertSeverityIcon
                  severity={location.recentAlert.severity}
                  iconColor='text-red-600'
                  textColor='text-red-700'
                />
              </div>
            )}

            <p className='text-sm text-gray-600 mb-3 text-center'>
              {location.address || 'Address not available'}
            </p>

            <div className='w-full space-y-2 mb-3'>
              {location.hasIntimateAlerts && (
                <div className='w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 rounded-lg shadow-md'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <svg
                        className='w-4 h-4'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='font-bold text-xs'>INTIMATE ALERTS</span>
                    </div>
                    <span className='bg-white text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold'>
                      {location.intimateAlertCount}
                    </span>
                  </div>
                  <p className='text-xs mt-1 opacity-90'>
                    Critical alerts requiring immediate attention
                  </p>
                </div>
              )}

              {location.alertCount > 0 ? (
                <div className='w-full bg-red-50 border-2 border-red-300 px-3 py-2 rounded-lg'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <svg
                        className='w-4 h-4 text-red-600'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='font-semibold text-red-700 text-xs'>
                        Active Alerts
                      </span>
                    </div>
                    <span className='bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold'>
                      {location.alertCount}
                    </span>
                  </div>
                  <p className='text-xs text-red-600 mt-1'>
                    Active security alerts
                  </p>
                </div>
              ) : (
                <div className='w-full bg-green-50 border-2 border-green-300 px-3 py-2 rounded-lg'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <svg
                        className='w-4 h-4 text-green-600'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='font-semibold text-green-700 text-xs'>
                        All Clear
                      </span>
                    </div>
                    <span className='bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-bold'>
                      0
                    </span>
                  </div>
                  <p className='text-xs text-green-600 mt-1'>
                    No active alerts
                  </p>
                </div>
              )}
            </div>

            <ButtonComponent
              className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm'
              onClick={() => onViewDashboard(location.id)}
            >
              View Dashboard
            </ButtonComponent>
          </div>
        </div>

        {/* Pointer Arrow - Adjusts position based on flip state */}
        <div
          className='absolute left-1/2 bg-white border-gray-200'
          style={{
            width: '12px',
            height: '12px',
            transform: 'translateX(-50%) rotate(45deg)',
            // If flipped (popup below), arrow goes to top. If normal (popup above), arrow goes to bottom.
            [popupStyle.isFlipped ? 'top' : 'bottom']: '-6px',
            // Adjust borders so the shadow looks correct
            borderBottomWidth: popupStyle.isFlipped ? '0px' : '1px',
            borderRightWidth: '1px',
            borderTopWidth: popupStyle.isFlipped ? '1px' : '0px',
            borderLeftWidth: '0px'
          }}
        ></div>
      </div>
    </OverlayView>
  )
}

// Pulsing alert badge
const PulsingAlertBadge = ({ position, count }) => {
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        className='relative'
        style={{ transform: 'translate(-50%, -100%)', marginTop: '-10px' }}
      >
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='w-8 h-8 bg-orange-500 rounded-full opacity-75 animate-ping absolute'></div>
          <div
            className='w-8 h-8 bg-red-500 rounded-full opacity-75 animate-ping absolute'
            style={{ animationDelay: '0.5s' }}
          ></div>
        </div>
        <div className='relative bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs z-10'>
          {count}
        </div>
      </div>
    </OverlayView>
  )
}

const LocationMap = ({
  isLoaded,
  isSelectionMode = false,
  onLocationSelect,
  initialLat,
  initialLng,
  onPopupOpen,
  readOnly
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { locations } = useSelector(state => state.locationApi)
  const tenantId = localStorage.getItem('tenant_id')

  const [map, setMap] = useState(null)
  const [hoveredMarker, setHoveredMarker] = useState(null)
  const [draggableMarker, setDraggableMarker] = useState(null)
  const [isPopupHovered, setIsPopupHovered] = useState(false)
  const [initialMapState, setInitialMapState] = useState({
    center: defaultCenter,
    zoom: 10
  })

  const closeTimeoutRef = useRef(null)
  const saveTimeoutRef = useRef(null)

  // 2. State to hold assigned location IDs from API
  const [assignedLocationIds, setAssignedLocationIds] = useState([])
  const users = localStorage.getItem('user_id')

  useEffect(() => {
    const savedMapState = localStorage.getItem('locationMapState')
    if (savedMapState && !isSelectionMode) {
      try {
        const { center, zoom } = JSON.parse(savedMapState)
        setInitialMapState({ center, zoom })
      } catch (error) {
        console.error('Error parsing saved map state:', error)
      }
    }
  }, [isSelectionMode])

  useEffect(() => {
    if (tenantId && !isSelectionMode) {
      dispatch(getLocations({ tenantId }))
    }
  }, [tenantId, dispatch, isSelectionMode])

  // 3. Fetch Assigned Locations from API if readOnly
  useEffect(() => {
    if (readOnly && tenantId && users) {
      dispatch(fetchTenantsUsers({ tenant_id: tenantId, user_id: users }))
        .unwrap()
        .then(usersData => {
          console.log('API Response:', usersData)

          // Since the API returns an array (filtered by user_id), we take the first item
          const currentUserData = usersData?.[0]
          console.log('Current User:', currentUserData)

          setAssignedLocationIds(currentUserData?.meta?.assign_locations || [])
        })
        .catch(err => {
          console.error('Failed to fetch user assignments', err)
          setAssignedLocationIds([])
        })
    }
  }, [dispatch, readOnly, tenantId, users])

  useEffect(() => {
    if (isSelectionMode && initialLat && initialLng) {
      const newCenter = {
        lat: parseFloat(initialLat),
        lng: parseFloat(initialLng)
      }
      setInitialMapState({ center: newCenter, zoom: 10 })
      setDraggableMarker(newCenter)
    }
  }, [isSelectionMode, initialLat, initialLng])

  // 4. Filter locations using the API state instead of localStorage
  const augmentedLocations = useMemo(() => {
    if (isSelectionMode) return []

    let visibleLocations = locations

    // If readOnly (viewer), filter by state 'assignedLocationIds'
    if (readOnly) {
      visibleLocations = locations.filter(loc =>
        assignedLocationIds.includes(String(loc.id))
      )
    }
    console.log('visible locations', visibleLocations)

    return visibleLocations
      .filter(loc => loc.lat !== null && loc.lang !== null)
      .map(loc => {
        const alertCount = loc.alert_count || 0
        const intimateAlertCount = loc.intimate_alert_count || 0
        return {
          ...loc,
          alertCount,
          intimateAlertCount,
          hasActiveAlerts: alertCount > 0,
          hasIntimateAlerts: intimateAlertCount > 0,
          coords: { lat: parseFloat(loc.lat), lng: parseFloat(loc.lang) },
          markerIcon: loc.meta?.markerIcon || 'default',
          markerColor: loc.meta?.markerColor || null
        }
      })
  }, [locations, isSelectionMode, readOnly, assignedLocationIds])

  const onLoad = useCallback(
    mapInstance => {
      if (!isSelectionMode && augmentedLocations.length > 0) {
        const savedMapState = localStorage.getItem('locationMapState')
        if (savedMapState) {
          try {
            const { center, zoom } = JSON.parse(savedMapState)
            mapInstance.setCenter(center)
            mapInstance.setZoom(zoom)
          } catch (error) {
            const bounds = new window.google.maps.LatLngBounds()
            augmentedLocations.forEach(loc => bounds.extend(loc.coords))
            mapInstance.fitBounds(bounds)
          }
        } else {
          const bounds = new window.google.maps.LatLngBounds()
          augmentedLocations.forEach(loc => bounds.extend(loc.coords))
          mapInstance.fitBounds(bounds)
        }
      } else if (isSelectionMode && draggableMarker) {
        mapInstance.setCenter(draggableMarker)
        mapInstance.setZoom(10)
      } else {
        mapInstance.setCenter(initialMapState.center)
        mapInstance.setZoom(initialMapState.zoom)
      }
      setMap(mapInstance)

      const saveMapState = () => {
        if (mapInstance && !isSelectionMode) {
          const center = mapInstance.getCenter()
          const zoom = mapInstance.getZoom()
          if (center && zoom) {
            const mapState = {
              center: { lat: center.lat(), lng: center.lng() },
              zoom: zoom
            }
            localStorage.setItem('locationMapState', JSON.stringify(mapState))
          }
        }
      }

      const debouncedSave = () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(saveMapState, 1000)
      }

      window.google.maps.event.addListener(
        mapInstance,
        'center_changed',
        debouncedSave
      )
      window.google.maps.event.addListener(
        mapInstance,
        'zoom_changed',
        debouncedSave
      )
      window.google.maps.event.addListener(
        mapInstance,
        'bounds_changed',
        debouncedSave
      )
      window.google.maps.event.addListener(
        mapInstance,
        'dragend',
        debouncedSave
      )
    },
    [augmentedLocations, isSelectionMode, draggableMarker, initialMapState]
  )

  const onUnmount = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    if (map && !isSelectionMode) {
      const center = map.getCenter()
      const zoom = map.getZoom()
      if (center && zoom) {
        const mapState = {
          center: { lat: center.lat(), lng: center.lng() },
          zoom: zoom
        }
        localStorage.setItem('locationMapState', JSON.stringify(mapState))
      }
    }
    setMap(null)
  }, [map, isSelectionMode])

  const handleMapClick = useCallback(
    e => {
      setHoveredMarker(null)
      setIsPopupHovered(false)
      // Disable map click to move marker if readOnly
      if (isSelectionMode && !readOnly) {
        const newLat = e.latLng.lat()
        const newLng = e.latLng.lng()
        setDraggableMarker({ lat: newLat, lng: newLng })
        if (onLocationSelect) onLocationSelect(newLat, newLng)
      }
    },
    [isSelectionMode, onLocationSelect, readOnly]
  )

  const handleMarkerDragEnd = useCallback(
    e => {
      // Disable marker drag if readOnly
      if (isSelectionMode && !readOnly) {
        const newLat = e.latLng.lat()
        const newLng = e.latLng.lng()
        setDraggableMarker({ lat: newLat, lng: newLng })
        if (onLocationSelect) onLocationSelect(newLat, newLng)
      }
    },
    [isSelectionMode, onLocationSelect, readOnly]
  )

  const handleViewDashboard = id => {
    navigate(`/dashboard?locationId=${id}`)
  }

  const handleViewAlerts = id => {
    navigate(`/alerts`)
  }

  const handleMarkerMouseOver = location => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    setHoveredMarker(location)
    if (onPopupOpen) onPopupOpen(location)
  }

  const handleMarkerMouseOut = () => {
    if (!isPopupHovered) {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = setTimeout(() => {
        setHoveredMarker(null)
      }, 200)
    }
  }

  const handlePopupMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    setIsPopupHovered(true)
  }

  const handlePopupMouseLeave = () => {
    setIsPopupHovered(false)
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredMarker(null)
    }, 200)
  }

  const handlePopupClose = () => {
    setIsPopupHovered(false)
    setHoveredMarker(null)
  }

  if (!isLoaded) {
    return (
      <div className='text-gray-400 w-full h-[60vh] flex items-center justify-center'>
        Loading Map...
      </div>
    )
  }

  return (
    <div className='w-full'>
      {/* Updated Animations including slideDown */}
      <style>{`
        @keyframes popupSlideIn {
          from { opacity: 0; transform: translate(-50%, -90%); }
          to { opacity: 1; transform: translate(-50%, -100%); }
        }
        @keyframes popupSlideDown {
          from { opacity: 0; transform: translate(-50%, 10%); }
          to { opacity: 1; transform: translate(-50%, 0%); }
        }
      `}</style>

      <GoogleMap
        mapContainerStyle={containerStyle}
        onLoad={onLoad}
        onUnmount={onUnmount}
        center={initialMapState.center}
        zoom={initialMapState.zoom}
        options={mapOptions}
        onClick={handleMapClick}
      >
        {!isSelectionMode &&
          augmentedLocations.map(location => {
            const pinColor =
              location.markerColor ??
              (location.hasIntimateAlerts
                ? '#FFA500'
                : location.alertCount > 0
                ? '#FF3333'
                : '#22CC55')

            return (
              <React.Fragment key={location.id}>
                <MarkerF
                  position={location.coords}
                  icon={createMarkerIcon(pinColor, location.markerIcon)}
                  onMouseOver={() => handleMarkerMouseOver(location)}
                  onMouseOut={handleMarkerMouseOut}
                  zIndex={
                    hoveredMarker?.id === location.id
                      ? 1
                      : location.hasIntimateAlerts
                      ? 1
                      : 100
                  }
                />
                {hoveredMarker && hoveredMarker.id === location.id && (
                  <CustomPopup
                    position={location.coords}
                    location={hoveredMarker}
                    map={map} /* IMPORTANT: Pass the map instance here */
                    onClose={handlePopupClose}
                    onViewDashboard={handleViewDashboard}
                    onViewAlerts={handleViewAlerts}
                    onMouseEnter={handlePopupMouseEnter}
                    onMouseLeave={handlePopupMouseLeave}
                  />
                )}
                {location.hasIntimateAlerts && (
                  <PulsingAlertBadge
                    position={location.coords}
                    count={location.intimateAlertCount}
                  />
                )}
              </React.Fragment>
            )
          })}
        {isSelectionMode && draggableMarker && (
          <MarkerF
            position={draggableMarker}
            // Disable draggable property if readOnly
            draggable={!readOnly}
            onDragEnd={handleMarkerDragEnd}
            icon={createMarkerIcon('#3885CC', 'default')}
          />
        )}
      </GoogleMap>
    </div>
  )
}

export default LocationMap
