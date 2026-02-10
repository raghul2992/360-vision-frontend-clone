import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { GoogleMap, MarkerF, Autocomplete } from '@react-google-maps/api'
import tzlookup from 'tz-lookup'
import {
  PREDEFINED_COLORS,
  MARKER_ICON_PATHS,
  MARKER_ICON_TYPES
} from '../utils/locationMarkerConstants'
import {
  createLocation,
  updateLocation
} from '../features/locations/locationApiSlice'
import ButtonComponent from './Button'
import { IoCloseOutline } from 'react-icons/io5'

import SearchableSelect from "./SearchableSelect";


const ICON_LABELS = {
  default: 'location.pin.default',
  store: 'location.pin.store',
  gas_station: 'location.pin.gas_station',
  office: 'location.pin.office',
  factory: 'location.pin.factory'
}

const getMarkerIcon = (markerColor, iconType = 'default') => {
  const path = MARKER_ICON_PATHS[iconType] || MARKER_ICON_PATHS.default
  const scale = iconType === 'default' ? 2 : 1.5

  return {
    path: path,
    fillColor: markerColor,
    fillOpacity: 1,
    strokeWeight: 0,
    scale: scale
  }
}

const containerStyle = {
  width: '100%',
  height: '220px',
  borderRadius: '0.75rem'
}

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

const defaultCenter = { lat: -22.9068, lng: -43.1729 }

const LocationFormModal = ({ isOpen, onClose, locationToEdit, isLoaded }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const tenantId = localStorage.getItem('tenant_id')
  const isLoading = useSelector(state => state.locationApi.isLoading)

  const searchAutoRef = useRef(null)
  const isEditing = !!locationToEdit

  var allTimezones = useMemo(() => Intl.supportedValuesOf('timeZone'), []);
  allTimezones = allTimezones.map((t) => { return {"id": t, "name": t}});

  const [formState, setFormState] = useState({
    name: locationToEdit?.name || '',
    address: locationToEdit?.address || '',
    status: locationToEdit?.status || 'active',
    lat: locationToEdit?.lat || '',
    lng: locationToEdit?.lng || '',
    timezone:
      locationToEdit?.meta?.timezone ||
      locationToEdit?.timezone ||
      'Asia/Calcutta',
    markerColor: locationToEdit?.meta?.markerColor || '#3885CC',
    markerIcon: locationToEdit?.meta?.markerIcon || 'default'
  })

  const [markerPosition, setMarkerPosition] = useState(
    locationToEdit?.lat && (locationToEdit?.lng || locationToEdit?.lang)
      ? {
          lat: parseFloat(locationToEdit.lat),
          lng: parseFloat(locationToEdit.lng || locationToEdit.lang)
        }
      : defaultCenter
  )

  useEffect(() => {
    const initialLng = locationToEdit?.lng || locationToEdit?.lang || ''
    const initialTimezone =
      locationToEdit?.meta?.timezone ||
      locationToEdit?.timezone ||
      'Asia/Calcutta'

    setFormState({
      name: locationToEdit?.name || '',
      address: locationToEdit?.address || '',
      status: locationToEdit?.status || 'active',
      lat: locationToEdit?.lat || '',
      lng: initialLng,
      timezone: initialTimezone,
      markerColor: locationToEdit?.meta?.markerColor || '#3885CC',
      markerIcon: locationToEdit?.meta?.markerIcon || 'default'
    })

    if (locationToEdit?.lat && initialLng) {
      setMarkerPosition({
        lat: parseFloat(locationToEdit.lat),
        lng: parseFloat(initialLng)
      })
    } else {
      setMarkerPosition(defaultCenter)
    }
  }, [locationToEdit, isOpen])

  // GET TIMEZONE USING TZ-LOOKUP (NO GOOGLE API)
  const setTimezoneForCoords = (lat, lng) => {
    try {
      const timezone = tzlookup(lat, lng)
      setFormState(prev => ({ ...prev, timezone }))
    } catch (e) {
      console.error('tz-lookup failed:', e)
    }
  }

  // MAP CLICK
  const handleMapClick = useCallback(event => {
    const lat = event.latLng.lat()
    const lng = event.latLng.lng()

    setMarkerPosition({ lat, lng })

    setFormState(prev => ({
      ...prev,
      lat: lat.toString(),
      lng: lng.toString()
    }))

    setTimezoneForCoords(lat, lng)
  }, [])

  // AUTOCOMPLETE PLACE SELECTION
  const handlePlaceSelection = async place => {
    if (!place || !place.geometry) return

    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()

    setMarkerPosition({ lat, lng })

    setFormState(prev => ({
      ...prev,
      name: place.name || prev.name,
      address: place.formatted_address || prev.address,
      lat: lat.toString(),
      lng: lng.toString()
    }))

    setTimezoneForCoords(lat, lng)
  }

  const onSearchPlaceChanged = async () => {
    const ac = searchAutoRef.current
    if (!ac) return

    const place = ac.getPlace()
    if (!place) return

    await handlePlaceSelection(place)
  }

  const handleChange = e => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const buildUpdatePayload = () => {
    const payload = {}
    const editable = [
      'name',
      'address',
      'status',
      'lat',
      'lng',
      'timezone',
      'markerColor',
      'markerIcon'
    ]

    let meta = {}

    editable.forEach(key => {
      const val = formState[key]
      if (!val) return

      if (key === 'lat') payload.lat = parseFloat(val)
      else if (key === 'lng') payload.lang = parseFloat(val)
      else if (key === 'timezone') meta.timezone = val
      else if (key === 'markerColor') meta.markerColor = val
      else if (key === 'markerIcon') meta.markerIcon = val
      else payload[key] = val
    })

    if (Object.keys(meta).length > 0) payload.meta = meta

    payload.status = formState.status
    return payload
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (
      !isEditing &&
      (!formState.name 
        // ||
        // !formState.address ||
        // !formState.lat ||
        // !formState.lng
      )
    ) {
      toast.error(t('location.validation.required_fields'))
      return
    }

    try {
      if (isEditing) {
        const payload = buildUpdatePayload()

        if (Object.keys(payload).length === 0) {
          toast.info(t('location.update.no_changes'))
          onClose()
          return
        }

        await dispatch(
          updateLocation({
            tenantId,
            locationId: locationToEdit.id,
            locationData: payload
          })
        ).unwrap()

        toast.success(t('location.update.success'))
      } else {
        const payload = {
          name: formState.name,
          address: formState.address,
          status: 'active',
          lat: parseFloat(formState.lat),
          lang: parseFloat(formState.lng),
          meta: {
            timezone: formState.timezone,
            markerColor: formState.markerColor,
            markerIcon: formState.markerIcon
          },
          tenant_id: parseInt(tenantId)
        }

        await dispatch(
          createLocation({ tenantId, locationData: payload })
        ).unwrap()

        toast.success(t('location.create.success'))
      }

      onClose()
    } catch (err) {
      toast.error(err)
      console.error(err)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4'>
      <div className='bg-[#2A2B36] w-full max-w-[900px] rounded-xl shadow-2xl max-h-[90vh]'>
        {/* HEADER */}
        <div className='flex justify-between items-center px-6 py-4 border-b border-[#2f303a] sticky top-0 bg-[#1c1c24] z-10'>
          <h2 className='text-xl font-semibold text-white'>
            {isEditing ? t('location.modal.edit') : t('location.modal.create')}
          </h2>
          <button onClick={onClose} className='text-gray-400 hover:text-white'>
            <IoCloseOutline size={26} />
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className='p-6 space-y-5 max-h-[80vh]'
        >
          {/* MAP */}
          {/* <div>
            <label className='text-gray-300 mb-2 block text-sm'>
              {t('location.form.select_coordinates')}
            </label>
            <div className='rounded-xl overflow-hidden border border-[#2f303a]'>
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={markerPosition}
                  zoom={12}
                  onClick={handleMapClick}
                  options={mapOptions}
                >
                  <MarkerF
                    position={markerPosition}
                    options={{
                      icon: getMarkerIcon(
                        formState.markerColor,
                        formState.markerIcon
                      )
                    }}
                  />
                </GoogleMap>
              ) : (
                <div
                  style={containerStyle}
                  className='flex items-center justify-center text-gray-400'
                >
                  {t('location.map.loading')}
                </div>
              )}
            </div>
          </div> */}

          {/* MARKER CUSTOMIZATION */}
          {/* <div className='space-y-4'>
            <div>
              <label className='text-gray-300 text-sm mb-2 block'>
                {t('location.form.marker_color')}
              </label>
              <div className='flex flex-wrap gap-3'>
                {PREDEFINED_COLORS.map(color => (
                  <button
                    type='button'
                    key={color}
                    onClick={() =>
                      setFormState(prev => ({ ...prev, markerColor: color }))
                    }
                    className={`w-8 h-8 rounded-full transition-all duration-150 border-2 ${
                      formState.markerColor === color
                        ? 'border-white ring-2 ring-offset-2 ring-white/50'
                        : 'border-transparent hover:ring-1 hover:ring-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                  ></button>
                ))}
              </div>
            </div> */}

            {/* MARKER ICON */}
            {/* <div>
              <label className='text-gray-300 text-sm mb-2 block'>
                {t('location.form.marker_icon')}
              </label>
              <div className='flex flex-wrap gap-3'>
                {MARKER_ICON_TYPES.map(iconType => (
                  <button
                    type='button'
                    key={iconType}
                    onClick={() =>
                      setFormState(prev => ({ ...prev, markerIcon: iconType }))
                    }
                    className={`p-2 rounded-lg border-2 flex items-center gap-2 text-sm capitalize ${
                      formState.markerIcon === iconType
                        ? 'bg-[#3A3B47] border-[#3885CC] text-white'
                        : 'bg-[#1f2029] border-transparent text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div
                      className='w-4 h-4'
                      style={{
                        maskImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='${MARKER_ICON_PATHS[iconType]}' fill='black'/></svg>")`,
                        maskRepeat: 'no-repeat',
                        maskSize: 'contain',
                        backgroundColor: formState.markerColor
                      }}
                    />
                    {t(ICON_LABELS[iconType])}
                  </button>
                ))}
              </div>
            </div>
          </div> */}

          {/* AUTOCOMPLETE */}
          {/* <div>
            <label className='text-gray-300 text-sm mb-2 block'>
              {t('location.form.search_location')}
            </label>
            <Autocomplete
              onLoad={ac => (searchAutoRef.current = ac)}
              onPlaceChanged={onSearchPlaceChanged}
            >
              <input
                placeholder={t('location.form.search_placeholder')}
                className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 text-sm'
              />
            </Autocomplete>
          </div> */}

          {/* NAME */}
          <div>
            <label className='text-gray-300 text-sm mb-2 block'>
              {t('location.form.name')}
            </label>
            <input
              name='name'
              value={formState.name}
              onChange={handleChange}
              className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 text-white text-sm'
              required
            />
          </div>

          {/* ADDRESS */}
          {/* <div>
            <label className='text-gray-300 text-sm mb-2 block'>
              {t('location.form.address')}
            </label>
            <input
              name='address'
              value={formState.address}
              onChange={handleChange}
              className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 text-white text-sm'
              required
            />
          </div> */}

          {/* LAT / LNG */}
          {/* <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='text-gray-300 text-sm mb-2 block'>
                {t('location.form.latitude')}
              </label>
              <input
                name='lat'
                value={formState.lat}
                onChange={handleChange}
                className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 text-white text-sm'
                required={!isEditing}
              />
            </div>

            <div>
              <label className='text-gray-300 text-sm mb-2 block'>
                {t('location.form.longitude')}
              </label>
              <input
                name='lng'
                value={formState.lng}
                onChange={handleChange}
                className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 text-white text-sm'
                required={!isEditing}
              />
            </div>
          </div> */}

          {/* TIMEZONE (AUTOFILLED BY tz-lookup) */}
          {/* <div>
            <label className='text-gray-300 text-sm mb-2 block'>
              {t('location.form.timezone')}
            </label>
            <input
              name='timezone'
              value={formState.timezone}
              onChange={handleChange}
              className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 text-white text-sm'
              required
            />
          </div> */}

          <div>
            <label className='text-gray-300 text-sm mb-2 block'>
              {t('location.form.timezone')}
            </label>
            <div className="relative">
              <SearchableSelect
                options={allTimezones}
                value={formState.timezone}
                name='timezone'
                onChange={handleChange}
                required
              />
            </div>
            
          </div>

          {/* SUBMIT */}
          <ButtonComponent
            type='submit'
            disabled={isLoading}
            className='w-full bg-[#3885CC] hover:bg-[#2a6da8] text-white py-3 rounded-full font-semibold'
          >
            {isLoading
              ? t('common.saving')
              : isEditing
              ? t('location.action.update')
              : t('location.action.create')}
          </ButtonComponent>
        </form>
      </div>
    </div>
  )
}

export default LocationFormModal
