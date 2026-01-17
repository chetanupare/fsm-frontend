import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Clock, User, Phone, CheckCircle, AlertCircle, Loader, Calendar, ArrowLeft, Navigation } from 'lucide-react'
import { customerAPI } from '../../lib/api'
import { format } from 'date-fns'
import Map from '../../components/Map'

const CustomerTracking = () => {
  const [searchParams] = useSearchParams()
  const ticketId = searchParams.get('ticket')

  const { data: ticketsData, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['customer-tickets'],
    queryFn: () => customerAPI.getTickets().then(res => res.data),
  })

  const tickets = ticketsData?.tickets || []

  const { data: tracking, isLoading: isLoadingTracking } = useQuery({
    queryKey: ['track-ticket', ticketId],
    queryFn: () => customerAPI.trackTicket(Number(ticketId)).then(res => res.data),
    enabled: !!ticketId,
    refetchInterval: (query) => {
      // Auto-refresh every 2 minutes if technician is en route
      const data = query.state.data as any;
      if (data?.job?.status === 'en_route' || data?.job?.status === 'component_pickup') {
        return 120000 // 2 minutes
      }
      return false
    },
  })

  const isLoading = isLoadingTickets || isLoadingTracking

  const statusColors: Record<string, string> = {
    pending_triage: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    triage: 'bg-blue-100 text-blue-800 border-blue-200',
    assigned: 'bg-purple-100 text-purple-800 border-purple-200',
    accepted: 'bg-blue-100 text-blue-800 border-blue-200',
    en_route: 'bg-purple-100 text-purple-800 border-purple-200',
    component_pickup: 'bg-violet-100 text-violet-800 border-violet-200',
    arrived: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    diagnosing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    quoted: 'bg-teal-100 text-teal-800 border-teal-200',
    signed_contract: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    repairing: 'bg-orange-100 text-orange-800 border-orange-200',
    waiting_parts: 'bg-amber-100 text-amber-800 border-amber-200',
    quality_check: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    waiting_payment: 'bg-pink-100 text-pink-800 border-pink-200',
    in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    released: 'bg-slate-100 text-slate-800 border-slate-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  }

  const statusIcons: Record<string, any> = {
    pending_triage: AlertCircle,
    triage: Loader,
    assigned: User,
    accepted: User,
    en_route: Clock,
    component_pickup: Clock,
    arrived: MapPin,
    diagnosing: AlertCircle,
    quoted: CheckCircle,
    signed_contract: CheckCircle,
    repairing: Clock,
    waiting_parts: Clock,
    quality_check: CheckCircle,
    waiting_payment: Clock,
    in_progress: Clock,
    completed: CheckCircle,
    released: CheckCircle,
    cancelled: AlertCircle,
  }

  const statusLabels: Record<string, string> = {
    pending_triage: 'Pending Review',
    triage: 'In Review',
    assigned: 'Assigned',
    accepted: 'Accepted',
    en_route: 'On The Way',
    component_pickup: 'Getting Parts',
    arrived: 'Arrived',
    diagnosing: 'Diagnosing',
    quoted: 'Quoted',
    signed_contract: 'Contract Signed',
    repairing: 'Repairing',
    waiting_parts: 'Waiting for Parts',
    quality_check: 'Quality Check',
    waiting_payment: 'Awaiting Payment',
    in_progress: 'In Progress',
    completed: 'Completed',
    released: 'Released',
    cancelled: 'Cancelled',
  }

  if (!ticketId) {
    // Show list of tickets
    return (
      <div className="pb-4 md:pb-8">
        <div className="bg-white border-b border-slate-200 mb-4 md:mb-6 md:bg-transparent md:border-0">
          <div className="px-4 py-4 md:px-0">
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">My Service Requests</h1>
            <p className="text-sm text-slate-600 mt-1 md:text-base">Track all your service tickets</p>
          </div>
        </div>
        
        <div className="px-4 md:px-0 space-y-3 md:space-y-4 md:max-w-4xl md:mx-auto">
        {isLoadingTickets ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-shimmer h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
        ) : tickets && tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((ticket: any) => (
              <Link
                key={ticket.id}
                to={`/tracking?ticket=${ticket.id}`}
                className="block bg-white rounded-xl shadow-sm border border-slate-100 p-3 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-base font-bold text-slate-900">#{ticket.id}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                        statusColors[ticket.status as string] || statusColors.pending_triage
                      }`}>
                        {statusLabels[ticket.status as string] || ticket.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">{ticket.device}</p>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-1.5">
                      {ticket.issue}
                    </p>
                    {ticket.technician && (
                      <p className="text-xs text-slate-600 mb-1">
                        <strong>Tech:</strong> {ticket.technician.name}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <MapPin className="w-5 h-5 text-slate-400 ml-2 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-4 text-sm">No service requests yet</p>
            <Link to="/booking" className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
              <Calendar className="w-4 h-4" />
              Book a Service
            </Link>
          </div>
        )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!tracking) {
    return (
      <div className="text-center py-12 px-4">
        <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
        <p className="text-slate-600 text-sm">Ticket not found</p>
      </div>
    )
  }

  const StatusIcon = statusIcons[tracking.status as keyof typeof statusIcons] || AlertCircle

  return (
    <div className="pb-4 md:pb-8">
      {/* Mobile Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 md:static md:border-0">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900">Ticket #{tracking.id}</h1>
            <p className="text-xs text-slate-600 truncate">{tracking.device || 'Service Request'}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
            statusColors[tracking.status as string] || statusColors.pending_triage
          }`}>
            {statusLabels[tracking.status as string] || tracking.status?.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="px-4 md:px-0 space-y-3 md:space-y-4 md:max-w-4xl md:mx-auto pt-3 md:pt-6">

      {/* Status Card - Most Important */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${statusColors[tracking.status as string] || statusColors.pending_triage}`}>
            <StatusIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-600 mb-0.5">Current Status</p>
            <h2 className="text-lg font-bold text-slate-900">
              {statusLabels[tracking.status as string] || tracking.status?.replace('_', ' ')}
            </h2>
          </div>
        </div>
        {tracking.technician && (
          <div className="pt-3 border-t border-blue-200">
            <p className="text-xs text-slate-600 mb-1">Technician</p>
            <p className="text-sm font-semibold text-slate-900">{tracking.technician.name}</p>
          </div>
        )}
        {/* ETA Display */}
        {tracking.eta && (
          <div className="pt-3 border-t border-blue-200 mt-3">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-slate-600">Estimated Arrival</p>
            </div>
            <p className="text-sm font-bold text-blue-700">{tracking.eta.arrival_window || tracking.eta.eta_text}</p>
            {tracking.eta.distance_km && (
              <p className="text-xs text-slate-500 mt-1">{tracking.eta.distance_km} km away</p>
            )}
          </div>
        )}
      </div>

      {/* Real-time Map - Show when technician is en route or arrived */}
      {(tracking.job?.status === 'en_route' || tracking.job?.status === 'component_pickup' || tracking.job?.status === 'arrived') && tracking.technician?.location && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-700">Live Location</h3>
          </div>
          <Map
            center={{
              lat: tracking.technician.location.lat,
              lng: tracking.technician.location.lng
            }}
            markers={[
              {
                position: {
                  lat: tracking.technician.location.lat,
                  lng: tracking.technician.location.lng
                },
                title: `${tracking.technician.name} - ${statusLabels[tracking.job.status as string] || tracking.job.status}`,
                icon: tracking.job.status === 'arrived'
                  ? 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#10B981" stroke="white" stroke-width="3"/>
                      <path d="M14 20l4 4 8-8" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  `)
                  : 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="white" stroke-width="3"/>
                      <path d="M20 10v10l6 4" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  `)
              },
              // Add customer location if available
              tracking.customer_location ? {
                position: {
                  lat: tracking.customer_location.lat,
                  lng: tracking.customer_location.lng
                },
                title: 'Your Location',
                icon: 'data:image/svg+xml;base64,' + btoa(`
                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#EF4444" stroke="white" stroke-width="3"/>
                    <circle cx="20" cy="16" r="5" fill="white"/>
                  </svg>
                `)
              } : null
            ].filter(Boolean)}
            className="rounded-lg"
          />
          <p className="text-xs text-slate-500 mt-2 text-center">
            {tracking.job.status === 'arrived'
              ? `${tracking.technician.name} has arrived at your location`
              : `Tracking ${tracking.technician.name} in real-time`}
          </p>
        </div>
      )}

      {/* Quick Contact - If Technician Available */}
      {tracking.technician && tracking.technician.phone && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-600">Contact Technician</p>
                <p className="text-sm font-semibold text-slate-900">{tracking.technician.name}</p>
              </div>
            </div>
            <a
              href={`tel:${tracking.technician.phone}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          </div>
        </div>
      )}

      {/* Timeline - Compact */}
      {tracking.timeline && tracking.timeline.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 md:p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Timeline</h3>
          <div className="space-y-3">
            {tracking.timeline.map((event: any, index: number) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center pt-0.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    index === 0 ? 'bg-blue-600' : 'bg-slate-300'
                  }`} />
                  {index < tracking.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-slate-200 mt-1.5" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {statusLabels[event.status as string] || event.status?.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {event.created_at && format(new Date(event.created_at), 'MMM dd, HH:mm')}
                  </p>
                  {event.note && (
                    <p className="text-xs text-slate-500 mt-1.5">{event.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Details - Compact */}
      <details className="bg-white rounded-xl shadow-sm border border-slate-100">
        <summary className="px-3 py-3 cursor-pointer text-sm font-semibold text-slate-700 list-none">
          <div className="flex items-center justify-between">
            <span>Job Details</span>
            <span className="text-xs text-slate-500">▼</span>
          </div>
        </summary>
        <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-3">
          {tracking.device && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600 font-medium w-20">Device:</span>
              <span className="text-slate-900">{tracking.device}</span>
            </div>
          )}
          {tracking.issue && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-slate-600 font-medium w-20">Issue:</span>
              <span className="text-slate-900 flex-1">{tracking.issue}</span>
            </div>
          )}
          {tracking.address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <span className="text-slate-900 flex-1">{tracking.address}</span>
            </div>
          )}
          {tracking.created_at && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">
                Created: {format(new Date(tracking.created_at), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
          )}
        </div>
      </details>

      </div>
    </div>
  )
}

export default CustomerTracking
