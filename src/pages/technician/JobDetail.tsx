import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Clock, User, Phone, CheckCircle, Upload, Navigation, FileText, MessageCircle, AlertCircle, X } from 'lucide-react'
import { technicianAPI } from '../../lib/api'
import { format } from 'date-fns'
import { useState, useEffect, useRef } from 'react'

const TechnicianJobDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)
  const [showEtaModal, setShowEtaModal] = useState(false)
  const [manualEtaMinutes, setManualEtaMinutes] = useState(30)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<{ technician?: google.maps.Marker; customer?: google.maps.Marker }>({})

  const { data: jobData, isLoading } = useQuery({
    queryKey: ['technician-job', id],
    queryFn: () => technicianAPI.getJob(Number(id)).then(res => res.data),
    refetchInterval: (data: any) => {
      // Poll every 30 seconds if job is en_route
      const job = data?.job || data
      return job?.status === 'en_route' ? 30000 : false
    },
  })

  const job = jobData?.job || jobData

  const { data: checklistData } = useQuery({
    queryKey: ['technician-checklist', id],
    queryFn: () => technicianAPI.getChecklist(Number(id)).then(res => res.data),
    enabled: !!job && job.status !== 'offered',
  })

  const checklist = checklistData?.checklists || checklistData || []

  const acceptMutation = useMutation({
    mutationFn: () => technicianAPI.acceptJob(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-job', id] })
      queryClient.invalidateQueries({ queryKey: ['technician-jobs-assigned'] })
      queryClient.invalidateQueries({ queryKey: ['technician-jobs-offered'] })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      technicianAPI.updateJobStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-job', id] })
      queryClient.invalidateQueries({ queryKey: ['technician-jobs-assigned'] })
    },
  })

  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) => technicianAPI.uploadAfterPhoto(Number(id), file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-job', id] })
      setSelectedFile(null)
    },
  })

  const completeChecklistMutation = useMutation({
    mutationFn: (checklistId: number) =>
      technicianAPI.completeChecklistItem(Number(id), checklistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-checklist', id] })
    },
  })

  const updateEtaMutation = useMutation({
    mutationFn: (etaMinutes: number) => technicianAPI.updateJobEta(Number(id), etaMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-job', id] })
      setShowEtaModal(false)
    },
  })

  // Initialize map when en_route
  useEffect(() => {
    const job = jobData?.job || jobData
    const isEnRouteStatus = job?.status === 'en_route'
    
    if (isEnRouteStatus && jobData && mapRef.current && window.google && window.google.maps) {
      const locations = jobData.locations
      
      if (locations?.technician && locations?.customer) {
        // Initialize map
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            zoom: 12,
            center: {
              lat: locations.technician.latitude,
              lng: locations.technician.longitude,
            },
            mapTypeControl: true,
            streetViewControl: false,
          })

          // Add technician marker
          markersRef.current.technician = new window.google.maps.Marker({
            position: {
              lat: locations.technician.latitude,
              lng: locations.technician.longitude,
            },
            map: mapInstanceRef.current,
            title: 'Your Location',
          } as any)

          // Add customer marker
          markersRef.current.customer = new window.google.maps.Marker({
            position: {
              lat: locations.customer.latitude,
              lng: locations.customer.longitude,
            },
            map: mapInstanceRef.current,
            title: 'Customer Location',
          } as any)

          // Draw route if DirectionsService is available
          try {
            const directionsService = new (window.google.maps as any).DirectionsService()
            const directionsRenderer = new (window.google.maps as any).DirectionsRenderer({
              map: mapInstanceRef.current,
              suppressMarkers: true,
            })

            directionsService.route(
              {
                origin: { lat: locations.technician.latitude, lng: locations.technician.longitude },
                destination: { lat: locations.customer.latitude, lng: locations.customer.longitude },
                travelMode: (window.google.maps as any).TravelMode?.DRIVING || 'DRIVING',
              },
              (result: any, status: any) => {
                if (status === 'OK' && directionsRenderer) {
                  directionsRenderer.setDirections(result)
                }
              }
            )
          } catch (e) {
            // Directions service not available, skip route drawing
          }

          // Fit bounds to show both markers
          try {
            const bounds = new (window.google.maps as any).LatLngBounds()
            bounds.extend({ lat: locations.technician.latitude, lng: locations.technician.longitude })
            bounds.extend({ lat: locations.customer.latitude, lng: locations.customer.longitude })
            if (mapInstanceRef.current && (mapInstanceRef.current as any).fitBounds) {
              (mapInstanceRef.current as any).fitBounds(bounds)
            }
          } catch (e) {
            // LatLngBounds not available, skip bounds fitting
          }
        } else {
          // Update technician marker position
          if (markersRef.current.technician) {
            markersRef.current.technician.setPosition({
              lat: locations.technician.latitude,
              lng: locations.technician.longitude,
            })
          }
        }
      }
    }

    // Cleanup
    return () => {
      if (markersRef.current.technician && (markersRef.current.technician as any).setMap) {
        (markersRef.current.technician as any).setMap(null)
      }
      if (markersRef.current.customer && (markersRef.current.customer as any).setMap) {
        (markersRef.current.customer as any).setMap(null)
      }
    }
  }, [jobData])

  // Show ETA modal if no automatic ETA after 2 seconds
  useEffect(() => {
    const job = jobData?.job || jobData
    const isEnRouteStatus = job?.status === 'en_route'
    
    if (isEnRouteStatus && jobData) {
      const eta = jobData.eta
      
      if (!eta) {
        const timer = setTimeout(() => {
          setShowEtaModal(true)
        }, 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [jobData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-slate-600 text-sm">Job not found</p>
      </div>
    )
  }

  const ticket = job.ticket || {}
  const customer = ticket.customer || {}
  const device = ticket.device || {}
  const currentStatus = job.status || 'offered'

  // Progressive reveal based on status
  const isOffered = currentStatus === 'offered'
  const isAccepted = currentStatus === 'accepted'
  const isEnRoute = currentStatus === 'en_route'
  const isComponentPickup = currentStatus === 'component_pickup'
  const isArrived = currentStatus === 'arrived'
  const isInProgress = ['diagnosing', 'quoted', 'signed_contract', 'repairing', 'waiting_parts', 'quality_check'].includes(currentStatus)
  const isWaitingPayment = currentStatus === 'waiting_payment'
  const isCompleted = ['completed', 'released'].includes(currentStatus)

  // WhatsApp link
  const whatsappLink = customer.phone 
    ? `https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`
    : null

  // Get location link
  const locationLink = ticket.latitude && ticket.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${ticket.latitude},${ticket.longitude}`
    : null

  return (
    <div className="pb-20 md:pb-8">
      {/* Mobile Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 md:static md:border-0">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900">Job #{job.id}</h1>
            {!isOffered && (
              <p className="text-xs text-slate-600 truncate">{device.brand} {device.device_type}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-0 space-y-3 md:space-y-4 md:max-w-4xl md:mx-auto pt-3 md:pt-6">

      {/* OFFERED STATE - Minimal View */}
      {isOffered && (
        <>
          {/* Device Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {device.brand} {device.device_type}
              </h2>
              <p className="text-sm text-slate-600">Repair Request</p>
            </div>

            {/* Issue Description */}
            {ticket.issue_description && (
              <div className="mb-4 pt-4 border-t border-slate-200">
                <h3 className="text-xs font-semibold text-slate-700 mb-2">Issue Description</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">
                  {ticket.issue_description}
                </p>
              </div>
            )}

            {/* Timing */}
            {ticket.preferred_date && (
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 pt-4 border-t border-slate-200">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>
                  {format(new Date(ticket.preferred_date), 'MMM dd, yyyy')} 
                  {ticket.preferred_time && ` at ${ticket.preferred_time}`}
                </span>
              </div>
            )}

            {/* Having Issue Button */}
            <button
              onClick={() => {
                // Navigate to support or show issue modal
                if (window.confirm('Need help? Contact support or reject this job offer.')) {
                  navigate('/dashboard')
                }
              }}
              className="w-full mb-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Having an issue?
            </button>

            {/* Accept Button - Big CTA */}
            <button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
            >
              {acceptMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Accepting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Accept Job</span>
                </div>
              )}
            </button>
          </div>
        </>
      )}

      {/* ACCEPTED STATE - Reveal Customer Info */}
      {isAccepted && (
        <>
          {/* Device Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {device.brand} {device.device_type}
            </h2>
            {ticket.issue_description && (
              <p className="text-sm text-slate-600 mt-2">{ticket.issue_description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-2">
            {/* Get Location */}
            {locationLink && (
              <a
                href={locationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 active:scale-95 transition-all"
              >
                <Navigation className="w-4 h-4" />
                Get Location
              </a>
            )}

            {/* Customer Details Toggle */}
            <button
              onClick={() => setShowCustomerDetails(!showCustomerDetails)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-200 active:scale-95 transition-all"
            >
              <User className="w-4 h-4" />
              {showCustomerDetails ? 'Hide' : 'Show'} Customer Details
            </button>

            {/* Customer Details Panel */}
            {showCustomerDetails && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-200">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Name</p>
                  <p className="text-sm font-medium text-slate-900">{customer.name || 'N/A'}</p>
                </div>
                {customer.phone && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Phone</p>
                    <a href={`tel:${customer.phone}`} className="text-sm font-medium text-blue-600">
                      {customer.phone}
                    </a>
                  </div>
                )}
                {customer.email && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <a href={`mailto:${customer.email}`} className="text-sm font-medium text-blue-600">
                      {customer.email}
                    </a>
                  </div>
                )}
                {ticket.address && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Address</p>
                    <p className="text-sm font-medium text-slate-900">{ticket.address}</p>
                  </div>
                )}
              </div>
            )}

            {/* Call & WhatsApp Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {customer.phone && (
                <>
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 active:scale-95 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  )}
                </>
              )}
            </div>
          </div>

          {/* On My Way Button - Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:static md:border-0 md:bg-transparent md:p-0 md:mt-4">
            <button
              onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'en_route' })}
              disabled={updateStatusMutation.isPending}
              className="w-full px-6 py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20"
            >
              {updateStatusMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Navigation className="w-5 h-5" />
                  <span>On My Way</span>
                </div>
              )}
            </button>
          </div>
        </>
      )}

      {/* EN ROUTE / COMPONENT PICKUP / ARRIVED / IN PROGRESS STATES */}
      {(isEnRoute || isComponentPickup || isArrived || isInProgress || isWaitingPayment || isCompleted) && (
        <>
          {/* Device Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {device.brand} {device.device_type}
            </h2>
            {ticket.issue_description && (
              <p className="text-sm text-slate-600 mt-2">{ticket.issue_description}</p>
            )}
          </div>

          {/* Map & ETA - Only for en_route */}
          {isEnRoute && jobData && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              {/* ETA Display */}
              {jobData.eta && (
                <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-90 mb-1">Estimated Arrival</p>
                      <p className="text-2xl font-bold">{jobData.eta.eta_text}</p>
                      {jobData.eta.arrival_window_text && (
                        <p className="text-xs opacity-90 mt-1">
                          Window: {jobData.eta.arrival_window_text}
                        </p>
                      )}
                    </div>
                    <Clock className="w-12 h-12 opacity-20" />
                  </div>
                  {jobData.eta.distance_km && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-xs opacity-90">
                        Distance: {jobData.eta.distance_km.toFixed(1)} km
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Map */}
              <div className="relative" style={{ height: '300px' }}>
                <div ref={mapRef} className="w-full h-full" />
                {!jobData.locations && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                    <p className="text-slate-500 text-sm">Loading map...</p>
                  </div>
                )}
              </div>

              {/* Manual ETA Button */}
              {!jobData.eta && (
                <div className="p-4 border-t border-slate-200">
                  <button
                    onClick={() => setShowEtaModal(true)}
                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold text-sm hover:bg-yellow-600 active:scale-95 transition-all"
                  >
                    Set ETA Manually
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 md:p-4">
            <div className="grid grid-cols-2 gap-2">
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm active:scale-95 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  Call Customer
                </a>
              )}
              {locationLink && (
                <a
                  href={locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold text-sm active:scale-95 transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  Navigate
                </a>
              )}
            </div>
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full mt-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 active:scale-95 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Customer
              </a>
            )}
          </div>

          {/* Customer Contact */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-900 text-sm">{customer.name || 'Customer'}</span>
              </div>
            </div>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="text-sm text-blue-600 font-medium block">
                {customer.phone}
              </a>
            )}
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="text-xs text-slate-600 block mt-1">
                {customer.email}
              </a>
            )}
            {ticket.address && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-700">{ticket.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Update - Progressive */}
          {!isCompleted && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 md:p-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Update Status</label>
              {isEnRoute && (
                <div className="space-y-2">
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'arrived' })}
                    disabled={updateStatusMutation.isPending}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    I've Arrived
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'component_pickup' })}
                    disabled={updateStatusMutation.isPending}
                    className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg font-semibold text-sm hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Component Pickup (Optional)
                  </button>
                </div>
              )}
              {isComponentPickup && (
                <button
                  onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'arrived' })}
                  disabled={updateStatusMutation.isPending}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  Arrived at Customer
                </button>
              )}
              {isArrived && (
                <button
                  onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'diagnosing' })}
                  disabled={updateStatusMutation.isPending}
                  className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg font-semibold text-sm hover:bg-yellow-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  Start Diagnosing
                </button>
              )}
              {isInProgress && (
                <select
                  value={currentStatus}
                  onChange={(e) => updateStatusMutation.mutate({ id: job.id, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  disabled={updateStatusMutation.isPending}
                >
                  <option value="diagnosing">Diagnosing</option>
                  <option value="quoted">Quoted</option>
                  <option value="signed_contract">Signed Contract</option>
                  <option value="repairing">Repairing</option>
                  <option value="waiting_parts">Waiting for Parts</option>
                  <option value="quality_check">Quality Check</option>
                  <option value="waiting_payment">Waiting for Payment</option>
                  <option value="completed">Completed</option>
                </select>
              )}
            </div>
          )}

          {/* Issue Description */}
          {ticket.issue_description && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-semibold text-slate-700">Issue</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{ticket.issue_description}</p>
            </div>
          )}

          {/* Checklist */}
          {checklist && checklist.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 md:p-4">
              <h3 className="text-xs font-semibold text-slate-700 mb-3">
                Checklist ({checklist.filter((item: any) => item.is_completed || item.completed).length}/{checklist.length})
              </h3>
              <div className="space-y-2">
                {checklist.map((item: any) => {
                  const isCompleted = item.is_completed || item.completed
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg ${
                        isCompleted ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isCompleted ? 'text-green-800 line-through' : 'text-slate-900'}`}>
                            {item.name || item.task}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>
                      {!isCompleted && (
                        <button
                          onClick={() => completeChecklistMutation.mutate(item.id)}
                          disabled={completeChecklistMutation.isPending}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Additional Actions - Collapsible */}
          <details className="bg-white rounded-xl shadow-sm border border-slate-100">
            <summary className="px-3 py-3 md:px-4 md:py-4 cursor-pointer text-sm font-semibold text-slate-700 list-none">
              <div className="flex items-center justify-between">
                <span>More Actions</span>
                <span className="text-xs text-slate-500">▼</span>
              </div>
            </summary>
            <div className="px-3 pb-3 md:px-4 md:pb-4 space-y-3 border-t border-slate-100 pt-3">
              {/* Upload After Photo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Upload Photo</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {selectedFile && (
                    <button
                      onClick={() => uploadPhotoMutation.mutate(selectedFile)}
                      disabled={uploadPhotoMutation.isPending}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {uploadPhotoMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload
                        </>
                      )}
                    </button>
                  )}
                </div>
                {selectedFile && (
                  <p className="text-xs text-slate-500 mt-1.5">Selected: {selectedFile.name}</p>
                )}
              </div>
            </div>
          </details>
        </>
      )}

      </div>

      {/* Manual ETA Modal */}
      {showEtaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Set Estimated Arrival Time</h3>
              <button
                onClick={() => setShowEtaModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Unable to calculate ETA automatically. Please set your estimated arrival time manually.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Estimated Time (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={manualEtaMinutes}
                onChange={(e) => setManualEtaMinutes(parseInt(e.target.value) || 30)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="30"
              />
              <p className="text-xs text-slate-500 mt-1">
                Estimated arrival: {format(new Date(Date.now() + manualEtaMinutes * 60000), 'h:mm a')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEtaModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateEtaMutation.mutate(manualEtaMinutes)}
                disabled={updateEtaMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {updateEtaMutation.isPending ? 'Setting...' : 'Set ETA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TechnicianJobDetail
