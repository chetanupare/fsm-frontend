import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Wrench, AlertCircle, CheckCircle, Navigation, Loader } from 'lucide-react'
import { customerAPI, publicAPI } from '../../lib/api'
import { useLocation } from '../../hooks/useLocation'
import { format } from 'date-fns'

const CustomerBooking = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    device_type: '',
    brand: '',
    model: '',
    issue_description: '',
    address: '',
    latitude: '',
    longitude: '',
    preferred_date: '',
    preferred_time: '',
  })

  const { location, getCurrentLocation, setAddress } = useLocation()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // Fetch device types
  const { data: deviceTypesData } = useQuery({
    queryKey: ['device-types'],
    queryFn: () => publicAPI.getDeviceTypes().then(res => res.data),
  })

  // Fetch brands when device type is selected
  const { data: brandsData } = useQuery({
    queryKey: ['device-brands', formData.device_type],
    queryFn: () => publicAPI.getDeviceBrands(formData.device_type).then(res => res.data),
    enabled: !!formData.device_type,
  })

  // Fetch models when device type and brand are selected
  const { data: modelsData } = useQuery({
    queryKey: ['device-models', formData.device_type, formData.brand],
    queryFn: () => publicAPI.getDeviceModels(formData.device_type, formData.brand).then(res => res.data),
    enabled: !!formData.device_type && !!formData.brand,
  })

  // Reset brand and model when device type changes
  useEffect(() => {
    if (formData.device_type) {
      setFormData(prev => ({ ...prev, brand: '', model: '' }))
    }
  }, [formData.device_type])

  // Reset model when brand changes
  useEffect(() => {
    if (formData.brand) {
      setFormData(prev => ({ ...prev, model: '' }))
    }
  }, [formData.brand])

  // Update form data when location changes
  useEffect(() => {
    if (location.address) {
      setFormData(prev => ({
        ...prev,
        address: location.address,
        latitude: location.latitude?.toString() || '',
        longitude: location.longitude?.toString() || '',
      }))
    }
  }, [location])

  // Initialize map when location is available
  useEffect(() => {
    if (location.latitude && location.longitude && mapRef.current && typeof google !== 'undefined') {
      const position = { lat: location.latitude, lng: location.longitude }

      if (typeof (window as any).google === 'undefined' || !(window as any).google.maps) {
        return
      }

      const google = (window as any).google.maps

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.Map(mapRef.current, {
          center: position,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
        })
      } else {
        mapInstanceRef.current.setCenter(position)
      }

      if (!markerRef.current) {
        markerRef.current = new google.Marker({
          position,
          map: mapInstanceRef.current,
          draggable: true,
          title: 'Service Location',
        })

        markerRef.current.addListener('dragend', (e: any) => {
          const newLat = e.latLng.lat()
          const newLng = e.latLng.lng()
          setAddress('') // Clear address, will be geocoded
          setFormData(prev => ({
            ...prev,
            latitude: newLat.toString(),
            longitude: newLng.toString(),
          }))
          // Reverse geocode new position
          if (typeof (window as any).google !== 'undefined' && (window as any).google.maps && (window as any).google.maps.Geocoder) {
            const geocoder = new (window as any).google.maps.Geocoder()
            geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results: any, status: any) => {
              if (status === 'OK' && results && results[0]) {
                setAddress(results[0].formatted_address)
              }
            })
          }
        })
      } else {
        markerRef.current.setPosition(position)
      }
    }
  }, [location.latitude, location.longitude, setAddress])

  const handleGetLocation = async () => {
    try {
      await getCurrentLocation()
    } catch (error: any) {
      console.error('Location error:', error)
    }
  }

  const bookingMutation = useMutation({
    mutationFn: (data: any) => customerAPI.createBooking(data),
    onSuccess: () => {
      navigate('/')
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    bookingMutation.mutate(formData)
  }

  return (
    <div className="pb-4 md:pb-8">
      <div className="bg-white border-b border-slate-200 mb-4 md:mb-6 md:bg-transparent md:border-0">
        <div className="px-4 py-4 md:px-0">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Book Service</h1>
          <p className="text-sm text-slate-600 mt-1 md:text-base">Fill in the details to request a service</p>
        </div>
      </div>
      
      <div className="px-4 md:px-0 space-y-4 md:space-y-6 md:max-w-4xl md:mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6 md:mb-8 px-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-sm md:text-base ${
                s <= step
                  ? 'bg-primary-gradient text-white shadow-md'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {s < step ? <CheckCircle className="w-4 h-4 md:w-6 md:h-6" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-1 mx-1 md:mx-2 rounded-full ${
                  s < step ? 'bg-primary-gradient' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Step 1: Device Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 md:text-xl">
              <Wrench className="w-5 h-5 md:w-6 md:h-6" />
              Device Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Device Type
              </label>
              <select
                name="device_type"
                value={formData.device_type}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select device type</option>
                {deviceTypesData?.device_types?.map((type: any) => (
                  <option key={type.id} value={type.slug}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Brand
                </label>
                {formData.device_type ? (
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={!brandsData}
                  >
                    <option value="">Select brand</option>
                    {brandsData?.brands?.map((brand: any) => (
                      <option key={brand.id} value={brand.slug}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Select device type first"
                    disabled
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Model
                </label>
                {formData.device_type && formData.brand ? (
                  <select
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="input-field"
                    disabled={!modelsData}
                  >
                    <option value="">Select model (optional)</option>
                    {modelsData?.models?.map((model: any) => (
                      <option key={model.id} value={model.slug}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="input-field"
                    placeholder={formData.device_type && formData.brand ? "Loading models..." : "Select brand first"}
                    disabled={!formData.device_type || !formData.brand}
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Issue Description
              </label>
              <textarea
                name="issue_description"
                value={formData.issue_description}
                onChange={handleChange}
                className="input-field min-h-[120px]"
                placeholder="Describe the issue you're experiencing..."
                required
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-primary w-full md:w-auto"
            >
              Next: Location & Time
            </button>
          </div>
        )}

        {/* Step 2: Location & Time */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 md:text-xl">
              <MapPin className="w-5 h-5 md:w-6 md:h-6" />
              Location & Preferred Time
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Service Address
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={location.loading}
                    className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                  >
                    {location.loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        Use My Location
                      </>
                    )}
                  </button>
                  {location.latitude && location.longitude && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 px-3 py-2 bg-slate-50 rounded-lg">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>
                
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field min-h-[100px]"
                  placeholder="Enter your full address or use 'Use My Location' button..."
                  required
                />

                {location.error && (
                  <p className="text-sm text-red-600">{location.error}</p>
                )}

                {/* Map Preview */}
                {location.latitude && location.longitude && (
                  <div className="mt-3">
                    <div
                      ref={mapRef}
                      className="w-full h-64 rounded-xl border border-slate-200 overflow-hidden"
                      style={{ minHeight: '256px' }}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Drag the marker to adjust your location
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Preferred Date
                </label>
                <input
                  type="date"
                  name="preferred_date"
                  value={formData.preferred_date}
                  onChange={handleChange}
                  className="input-field"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preferred Time
                </label>
                <select
                  name="preferred_time"
                  value={formData.preferred_time}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select time</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-primary flex-1"
              >
                Review & Submit
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 md:text-xl">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
              Review & Confirm
            </h2>

            <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm text-slate-600">Device</p>
                <p className="font-semibold text-slate-800">
                  {formData.brand} {formData.device_type} {formData.model && `- ${formData.model}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Issue</p>
                <p className="font-semibold text-slate-800">{formData.issue_description}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Address</p>
                <p className="font-semibold text-slate-800">{formData.address}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Preferred Time</p>
                <p className="font-semibold text-slate-800">
                  {formData.preferred_date && format(new Date(formData.preferred_date), 'MMM dd, yyyy')} at {formData.preferred_time}
                </p>
              </div>
            </div>

            {bookingMutation.isError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {bookingMutation.error?.message || 'Failed to create booking'}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={bookingMutation.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {bookingMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Booking
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
      </div>
    </div>
  )
}

export default CustomerBooking
