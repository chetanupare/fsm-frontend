import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Briefcase, MapPin, Clock, CheckCircle, X, User, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { technicianAPI } from '../../lib/api'
import { format } from 'date-fns'

const TechnicianJobs = () => {
  const queryClient = useQueryClient()


  const { data: assignedJobsData, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ['technician-jobs-assigned'],
    queryFn: () => technicianAPI.getAssignedJobs().then(res => res.data),
  })

  const { data: offeredJobsData, isLoading: isLoadingOffered } = useQuery({
    queryKey: ['technician-jobs-offered'],
    queryFn: () => technicianAPI.getOfferedJobs().then(res => res.data),
  })

  const isLoading = isLoadingOffered || isLoadingAssigned
  const assignedJobs = assignedJobsData?.jobs || []
  const offeredJobs = offeredJobsData?.jobs || []
  
  // Sort assigned jobs: active statuses first, then by updated_at
  const sortedAssignedJobs = [...assignedJobs].sort((a: any, b: any) => {
    const priorityOrder: Record<string, number> = {
      'accepted': 1,
      'en_route': 2,
      'component_pickup': 3,
      'arrived': 4,
      'diagnosing': 5,
      'quoted': 6,
      'signed_contract': 7,
      'repairing': 8,
      'waiting_parts': 9,
      'quality_check': 10,
      'waiting_payment': 11,
    }
    const aPriority = priorityOrder[a.status] || 99
    const bPriority = priorityOrder[b.status] || 99
    if (aPriority !== bPriority) return aPriority - bPriority
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  const acceptMutation = useMutation({
    mutationFn: (id: number) => technicianAPI.acceptJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-jobs-offered'] })
      queryClient.invalidateQueries({ queryKey: ['technician-jobs-assigned'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) => technicianAPI.rejectJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-jobs-offered'] })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-shimmer h-32 bg-slate-200 rounded-xl" />
        ))}
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    offered: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    en_route: 'bg-purple-100 text-purple-800',
    component_pickup: 'bg-violet-100 text-violet-800',
    arrived: 'bg-indigo-100 text-indigo-800',
    diagnosing: 'bg-yellow-100 text-yellow-800',
    quoted: 'bg-teal-100 text-teal-800',
    signed_contract: 'bg-emerald-100 text-emerald-800',
    repairing: 'bg-orange-100 text-orange-800',
    waiting_parts: 'bg-amber-100 text-amber-800',
    quality_check: 'bg-cyan-100 text-cyan-800',
    waiting_payment: 'bg-pink-100 text-pink-800',
    completed: 'bg-green-100 text-green-800',
    released: 'bg-slate-100 text-slate-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-red-100 text-red-800',
    cannot_repair: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    offered: 'Offered',
    accepted: 'Accepted',
    en_route: 'On My Way',
    component_pickup: 'Component Pickup',
    arrived: 'Reached',
    diagnosing: 'Diagnosed',
    quoted: 'Quoted',
    signed_contract: 'Signed Contract',
    repairing: 'Fixing',
    waiting_parts: 'Waiting for Parts',
    quality_check: 'Quality Check',
    waiting_payment: 'Waiting for Payment',
    completed: 'Completed',
    released: 'Released',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    cannot_repair: 'Cannot Repair',
  }

  return (
    <div className="pb-4 md:pb-8">
      {/* Mobile Header */}
      <div className="bg-white border-b border-slate-200 mb-4 md:mb-6 md:bg-transparent md:border-0">
        <div className="px-4 py-4 md:px-0">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">My Jobs</h1>
          <p className="text-sm text-slate-600 mt-1 md:text-base">Active jobs that need your attention</p>
        </div>
      </div>

      <div className="px-4 md:px-0 space-y-4 md:space-y-6">

      {/* Assigned Jobs Section */}
      {isLoadingAssigned ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-shimmer h-40 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : sortedAssignedJobs && sortedAssignedJobs.length > 0 ? (
        <div className="space-y-3">
          {sortedAssignedJobs.map((job: any) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 active:scale-[0.98] transition-transform border-l-4"
              style={{
                borderLeftColor: 
                  job.status === 'accepted' || job.status === 'en_route' ? '#3B82F6' :
                  job.status === 'arrived' || job.status === 'diagnosing' ? '#8B5CF6' :
                  job.status === 'repairing' ? '#F59E0B' :
                  job.status === 'waiting_payment' ? '#EC4899' :
                  '#10B981'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">#{job.id}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      statusColors[job.status] || 'bg-slate-100 text-slate-800'
                    }`}>
                      {statusLabels[job.status] || job.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 mb-2">
                    {job.device || 'Device info unavailable'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {job.customer && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="font-medium text-slate-900 flex-1 truncate">{job.customer.name}</span>
                    {job.customer.phone && (
                      <a 
                        href={`tel:${job.customer.phone}`}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        Call
                      </a>
                    )}
                  </div>
                )}
                {job.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-medium truncate">{job.address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {job.latitude && job.longitude && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 font-medium hover:underline"
                          >
                            🗺️ Navigate
                          </a>
                        )}
                        {job.priority === 'high' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-semibold">
                            ⚠️ High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {job.preferred_date && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>
                      {format(new Date(job.preferred_date), 'MMM dd, yyyy')} {job.preferred_time && `at ${job.preferred_time}`}
                    </span>
                  </div>
                )}
              </div>

              {job.issue && (
                <p className="text-sm text-slate-700 mb-3 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                  {job.issue}
                </p>
              )}

              <div className="flex gap-2">
                <Link
                  to={`/jobs/${job.id}`}
                  className="btn-primary flex-1 text-center text-sm py-2.5"
                >
                  View Details
                </Link>
                {job.status === 'accepted' && (
                  <button
                    onClick={() => {
                      if (window.confirm('Start your journey to the customer location?')) {
                        window.location.href = `/jobs/${job.id}`
                      }
                    }}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 active:scale-95 transition-all font-semibold text-sm"
                  >
                    Start
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-sm">No assigned jobs at the moment</p>
        </div>
      )}

      {/* Job Offers Section */}
      <div className="mt-8 md:mt-12">
        <h2 className="text-xl font-bold text-slate-900 mb-1 md:text-2xl">Job Offers</h2>
        <p className="text-sm text-slate-600 md:text-base">Accept or reject new job offers</p>
      </div>

      {isLoadingOffered ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-shimmer h-40 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : offeredJobs && offeredJobs.length > 0 ? (
        <div className="space-y-3">
          {offeredJobs.map((job: any) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 active:scale-[0.98] transition-transform border-l-4 border-l-yellow-500"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">#{job.id}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                      New Offer
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 mb-2">
                    {job.ticket?.device?.brand} {job.ticket?.device?.device_type} {job.device ? `(${job.device})` : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {job.ticket?.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-900 font-medium truncate">{job.ticket.address}</span>
                  </div>
                )}
                {job.ticket?.preferred_date && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>
                      {format(new Date(job.ticket.preferred_date), 'MMM dd, yyyy')} at {job.ticket.preferred_time}
                    </span>
                  </div>
                )}
                {job.deadline && (
                  <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    <span>Deadline: {format(new Date(job.deadline), 'MMM dd, HH:mm')}</span>
                  </div>
                )}
              </div>

              {job.ticket?.issue_description && (
                <p className="text-sm text-slate-700 mb-3 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                  {job.ticket.issue_description}
                </p>
              )}
              {job.issue && !job.ticket?.issue_description && (
                <p className="text-sm text-slate-700 mb-3 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                  {job.issue}
                </p>
              )}

              <div className="flex gap-2">
                <Link
                  to={`/jobs/${job.id}`}
                  className="btn-secondary flex-1 text-center text-sm py-2.5"
                >
                  Details
                </Link>
                <button
                  onClick={() => acceptMutation.mutate(job.id)}
                  disabled={acceptMutation.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
                >
                  {acceptMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </>
                  )}
                </button>
                <button
                  onClick={() => rejectMutation.mutate(job.id)}
                  disabled={rejectMutation.isPending}
                  className="px-4 py-2.5 rounded-xl border-2 border-red-600 text-red-600 hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-sm">No job offers available at the moment</p>
        </div>
      )}
      </div>
    </div>
  )
}

export default TechnicianJobs
