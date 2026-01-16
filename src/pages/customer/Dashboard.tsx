import { useQuery } from '@tanstack/react-query'
import { Calendar, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { customerAPI } from '../../lib/api'
import { format } from 'date-fns'

const CustomerDashboard = () => {
  const { data: devices, isLoading: isLoadingDevices } = useQuery({
    queryKey: ['customer-devices'],
    queryFn: () => customerAPI.getDevices().then(res => res.data),
  })

  const { data: ticketsData, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['customer-tickets'],
    queryFn: () => customerAPI.getTickets().then(res => res.data),
  })

  const tickets = ticketsData?.tickets || []
  const activeTickets = tickets.filter((t: any) => !['completed', 'cancelled'].includes(t.status))
  const completedTickets = tickets.filter((t: any) => t.status === 'completed')
  const pendingTickets = tickets.filter((t: any) => ['pending_triage', 'triage', 'assigned'].includes(t.status))

  return (
    <div className="pb-4 md:pb-8">
      {/* Header - Mobile App Style */}
      <div className="bg-white border-b border-slate-200 mb-4 md:mb-6 md:bg-transparent md:border-0">
        <div className="px-4 py-4 md:px-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Dashboard</h1>
              <p className="text-sm text-slate-600 mt-1 md:text-base">Manage your service requests</p>
            </div>
            <Link 
              to="/booking" 
              className="md:hidden p-3 rounded-full bg-primary-gradient text-white shadow-lg active:scale-95 transition-transform"
            >
              <Calendar className="w-6 h-6" />
            </Link>
          </div>
          <Link 
            to="/booking" 
            className="hidden md:inline-flex btn-primary items-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Book New Service
          </Link>
        </div>
      </div>

      <div className="px-4 md:px-0 space-y-4 md:space-y-6">
      {/* Stats Cards - Mobile App Style */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-3 md:gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex flex-col">
            <p className="text-blue-100 text-xs mb-1">Active</p>
            <p className="text-2xl font-bold">{activeTickets.length}</p>
            <Clock className="w-8 h-8 opacity-80 mt-2" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex flex-col">
            <p className="text-green-100 text-xs mb-1">Done</p>
            <p className="text-2xl font-bold">{completedTickets.length}</p>
            <CheckCircle className="w-8 h-8 opacity-80 mt-2" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex flex-col">
            <p className="text-orange-100 text-xs mb-1">Pending</p>
            <p className="text-2xl font-bold">{pendingTickets.length}</p>
            <AlertCircle className="w-8 h-8 opacity-80 mt-2" />
          </div>
        </div>
      </div>

      {/* My Devices - Mobile App Style */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 md:text-xl">My Devices</h2>
        
        {isLoadingDevices ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-shimmer h-20 bg-slate-200 rounded-xl" />
            ))}
          </div>
        ) : devices && devices.length > 0 ? (
          <div className="space-y-3">
            {devices.map((device: any) => (
              <Link
                key={device.id}
                to={`/tracking?device=${device.id}`}
                className="block p-4 bg-slate-50 rounded-xl border border-slate-200 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{device.brand} {device.device_type}</p>
                    <p className="text-sm text-slate-600 mt-1">Model: {device.model || 'N/A'}</p>
                  </div>
                  <div className="ml-3 p-2 rounded-full bg-primary/10">
                    <MapPin className="w-5 h-5" style={{ color: `var(--color-primary)` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-4 text-sm">No devices registered yet</p>
            <Link to="/booking" className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
              <Calendar className="w-4 h-4" />
              Book Service
            </Link>
          </div>
        )}
      </div>

      {/* Recent Tickets - Mobile App Style */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 md:text-xl">Recent Requests</h2>
          <Link to="/tracking" className="text-sm font-medium" style={{ color: `var(--color-primary)` }}>
            View All
          </Link>
        </div>
        
        {isLoadingTickets ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-shimmer h-20 bg-slate-200 rounded-xl" />
            ))}
          </div>
        ) : tickets && tickets.length > 0 ? (
          <div className="space-y-2">
            {tickets.slice(0, 5).map((ticket: any) => (
              <Link
                key={ticket.id}
                to={`/tracking?ticket=${ticket.id}`}
                className="block p-4 bg-slate-50 rounded-xl border border-slate-200 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-slate-900">#{ticket.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        ticket.status === 'completed' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        ['pending_triage', 'triage', 'assigned'].includes(ticket.status) ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {ticket.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">{ticket.device}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <Clock className="w-5 h-5 text-slate-400 ml-2 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">No service requests yet</p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

export default CustomerDashboard
