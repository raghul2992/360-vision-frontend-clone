import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { GoogleMap, MarkerF, OverlayView } from '@react-google-maps/api'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getLocations } from '../features/locations/locationApiSlice'
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

// Static info icon at bottom of marker - always visible
const StaticInfoIcon = ({ position }) => {
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        className='pointer-events-none'
        style={{
          transform: 'translate(-50%, 0%)',
          marginTop: '5px'
        }}
      >
        {/* Static info icon - no animation, always visible at bottom of marker */}
        <div className='bg-blue-500 rounded-full p-1 shadow-lg border-2 border-white'>
          <svg
            className='w-4 h-4 text-white'
            fill='currentColor'
            viewBox='0 0 20 20'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
              clipRule='evenodd'
            />
          </svg>
        </div>
      </div>
    </OverlayView>
  )
}

// Custom Popup Component - only shows on hover
const CustomPopup = ({
  position,
  location,
  onClose,
  onViewDashboard,
  onViewAlerts,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        className='custom-popup-container'
        style={{
          position: 'absolute',
          transform: 'translate(-50%, -100%)',
          marginTop: '-15px',
          animation: 'popupSlideIn 0.3s ease-out',
          pointerEvents: 'auto'
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Popup bubble */}
        <div className='bg-white rounded-lg shadow-2xl p-4 min-w-[280px] max-w-[320px] border border-gray-200'>
          {/* Close button */}
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

          {/* Content */}
          <div className='flex flex-col items-center'>
            <h3 className='font-bold text-lg mb-1 text-gray-900 text-center pr-6'>
              {location.name}
            </h3>

            {/* Specific Alert Display */}
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

            {/* Alert Status Display */}
            <div className='w-full space-y-2 mb-3'>
              {/* Intimate Alert Banner */}
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

              {/* General Alerts Status */}
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

        {/* Popup arrow/tail */}
        <div
          className='absolute left-1/2 bg-white border-b border-r border-gray-200'
          style={{
            width: '12px',
            height: '12px',
            transform: 'translateX(-50%) rotate(45deg)',
            bottom: '-6px'
          }}
        ></div>
      </div>
    </OverlayView>
  )
}

// Pulsing alert badge component for markers with intimate alerts
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
        {/* Pulsing rings */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='w-8 h-8 bg-orange-500 rounded-full opacity-75 animate-ping absolute'></div>
          <div
            className='w-8 h-8 bg-red-500 rounded-full opacity-75 animate-ping absolute'
            style={{ animationDelay: '0.5s' }}
          ></div>
        </div>
        {/* Alert badge */}
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
  onPopupOpen
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { locations } = useSelector(state => state.locationApi)
  const { user } = useSelector(state => state.auth)
  const tenantId = user?.tenantId

  const [map, setMap] = useState(null)
  const [hoveredMarker, setHoveredMarker] = useState(null)
  const [draggableMarker, setDraggableMarker] = useState(null)
  const [isPopupHovered, setIsPopupHovered] = useState(false)

  // State to track initial map position and zoom from localStorage
  const [initialMapState, setInitialMapState] = useState({
    center: defaultCenter,
    zoom: 10
  })

  const closeTimeoutRef = useRef(null)
  const saveTimeoutRef = useRef(null)

  // Load saved map state from localStorage on component mount
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

  // Prepare map locations for display mode
  const augmentedLocations = useMemo(() => {
    if (isSelectionMode) return []
    return locations
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
          coords: {
            lat: parseFloat(loc.lat),
            lng: parseFloat(loc.lang)
          },
          markerIcon: loc.meta?.markerIcon || 'default',
          markerColor: loc.meta?.markerColor || null
        }
      })
  }, [locations, isSelectionMode])

  const onLoad = useCallback(
    mapInstance => {
      if (!isSelectionMode && augmentedLocations.length > 0) {
        // Check if we have saved state, otherwise fit to bounds
        const savedMapState = localStorage.getItem('locationMapState')
        if (savedMapState) {
          try {
            const { center, zoom } = JSON.parse(savedMapState)
            mapInstance.setCenter(center)
            mapInstance.setZoom(zoom)
          } catch (error) {
            // If saved state is invalid, fit to bounds
            const bounds = new window.google.maps.LatLngBounds()
            augmentedLocations.forEach(loc => bounds.extend(loc.coords))
            mapInstance.fitBounds(bounds)

            // Save the initial bounds state
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
        } else {
          // No saved state, fit to bounds
          const bounds = new window.google.maps.LatLngBounds()
          augmentedLocations.forEach(loc => bounds.extend(loc.coords))
          mapInstance.fitBounds(bounds)

          // Save the initial bounds state
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
      } else if (isSelectionMode && draggableMarker) {
        mapInstance.setCenter(draggableMarker)
        mapInstance.setZoom(10)
      } else {
        mapInstance.setCenter(initialMapState.center)
        mapInstance.setZoom(initialMapState.zoom)
      }
      setMap(mapInstance)

      // Add event listeners for map changes with debouncing
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

      // Set up event listeners with debouncing
      const debouncedSave = () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(saveMapState, 1000)
      }

      // Add listeners without updating React state
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
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Save final map state
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
      // Close popup when clicking on map
      setHoveredMarker(null)
      setIsPopupHovered(false)

      if (isSelectionMode) {
        const newLat = e.latLng.lat()
        const newLng = e.latLng.lng()
        setDraggableMarker({ lat: newLat, lng: newLng })
        if (onLocationSelect) {
          onLocationSelect(newLat, newLng)
        }
      }
    },
    [isSelectionMode, onLocationSelect]
  )

  const handleMarkerDragEnd = useCallback(
    e => {
      if (isSelectionMode) {
        const newLat = e.latLng.lat()
        const newLng = e.latLng.lng()
        setDraggableMarker({ lat: newLat, lng: newLng })
        if (onLocationSelect) {
          onLocationSelect(newLat, newLng)
        }
      }
    },
    [isSelectionMode, onLocationSelect]
  )

  const handleViewDashboard = id => {
    navigate(`/dashboard`)
  }

  const handleViewAlerts = id => {
    navigate(`/alerts`)
  }

  const handleMarkerMouseOver = location => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    setHoveredMarker(location)
    if (onPopupOpen) {
      onPopupOpen(location)
    }
  }

  const handleMarkerMouseOut = () => {
    // Only close if not hovering over popup
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
      {/* Add custom CSS for popup animation only */}
      <style>{`
        @keyframes popupSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -90%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%);
          }
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
                      ? 2000
                      : location.hasIntimateAlerts
                      ? 1000
                      : 100
                  }
                />

                {/* Custom Popup - ONLY ON HOVER */}
                {hoveredMarker && hoveredMarker.id === location.id && (
                  <CustomPopup
                    position={location.coords}
                    location={hoveredMarker}
                    onClose={handlePopupClose}
                    onViewDashboard={handleViewDashboard}
                    onViewAlerts={handleViewAlerts}
                    onMouseEnter={handlePopupMouseEnter}
                    onMouseLeave={handlePopupMouseLeave}
                  />
                )}

                {/* Pulsing badge for intimate alerts */}
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
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
            icon={createMarkerIcon('#3885CC', 'default')}
          />
        )}
      </GoogleMap>
    </div>
  )
}

export default LocationMap
