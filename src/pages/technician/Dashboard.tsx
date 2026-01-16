import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Briefcase, Clock, CheckCircle, AlertCircle, MapPin, ToggleLeft, ToggleRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { technicianAPI } from '../../lib/api'
import { useState } from 'react'

const TechnicianDashboard = () => {
  const queryClient = useQueryClient()
  const [isToggling, setIsToggling] = useState(false)

  const { data: status } = useQuery({
    queryKey: ['technician-status'],
    queryFn: () => technicianAPI.getStatus().then(res => res.data),
  })

  const { data: jobsData } = useQuery({
    queryKey: ['technician-jobs-offered'],
    queryFn: () => technicianAPI.getOfferedJobs().then(res => res.data),
  })

  const jobs = jobsData?.jobs || []

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => technicianAPI.updateStatus(newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-status'] })
      setIsToggling(false)
    },
    onError: () => {
      setIsToggling(false)
    },
  })

  const handleToggleStatus = () => {
    if (isToggling) return
    setIsToggling(true)
    const newStatus = status?.status === 'on_duty' ? 'off_duty' : 'on_duty'
    updateStatusMutation.mutate(newStatus)
  }

  return (
    <div className="pb-4 md:pb-8">
      {/* Mobile Header */}
      <div className="bg-white border-b border-slate-200 mb-4 md:mb-6 md:bg-transparent md:border-0">
        <div className="px-4 py-4 md:px-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Dashboard</h1>
              <p className="text-sm text-slate-600 mt-1 md:text-base">Manage your jobs and status</p>
            </div>
            <button
              onClick={handleToggleStatus}
              disabled={isToggling || updateStatusMutation.isPending}
              className={`md:hidden flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-sm transition-all ${
                status?.status === 'on_duty' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-slate-100 text-slate-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isToggling || updateStatusMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : status?.status === 'on_duty' ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              {status?.status === 'on_duty' ? 'On' : 'Off'}
            </button>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-slate-600">Status:</span>
            <button
              onClick={handleToggleStatus}
              disabled={isToggling || updateStatusMutation.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all ${
                status?.status === 'on_duty' 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isToggling || updateStatusMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : status?.status === 'on_duty' ? (
                <ToggleRight className="w-5 h-5" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
              {status?.status === 'on_duty' ? 'On Duty' : 'Off Duty'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-0 space-y-4 md:space-y-6">

      {/* Stats Cards - Mobile App Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex flex-col">
            <p className="text-blue-100 text-xs mb-1">New Offers</p>
            <p className="text-2xl font-bold">{jobs?.length || 0}</p>
            <Briefcase className="w-8 h-8 opacity-80 mt-2" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex flex-col">
            <p className="text-purple-100 text-xs mb-1">In Progress</p>
            <p className="text-2xl font-bold">0</p>
            <Clock className="w-8 h-8 opacity-80 mt-2" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex flex-col">
            <p className="text-green-100 text-xs mb-1">Completed</p>
            <p className="text-2xl font-bold">0</p>
            <CheckCircle className="w-8 h-8 opacity-80 mt-2" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex flex-col">
            <p className="text-orange-100 text-xs mb-1">On Hold</p>
            <p className="text-2xl font-bold">0</p>
            <AlertCircle className="w-8 h-8 opacity-80 mt-2" />
          </div>
        </div>
      </div>

      {/* Job Offers - Mobile App Style */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 md:text-xl">New Job Offers</h2>
          <Link to="/jobs" className="text-sm font-medium" style={{ color: `var(--color-primary)` }}>
            View All
          </Link>
        </div>

        {jobs && jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job: any) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="block p-3 bg-slate-50 rounded-xl border border-slate-200 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900">#{job.id}</p>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                        New
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      {job.ticket?.device?.brand} {job.ticket?.device?.device_type}
                    </p>
                    {job.ticket?.address && (
                      <p className="text-xs text-slate-600 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.ticket.address}
                      </p>
                    )}
                  </div>
                  <Briefcase className="w-5 h-5 text-slate-400 ml-2 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 text-sm">No new job offers at the moment</p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

export default TechnicianDashboard
