import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Clock, User, Phone, CheckCircle, Upload, Navigation, FileText } from 'lucide-react'
import { technicianAPI } from '../../lib/api'
import { format } from 'date-fns'
import { useState } from 'react'

const TechnicianJobDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { data: jobData, isLoading } = useQuery({
    queryKey: ['technician-job', id],
    queryFn: () => technicianAPI.getJob(Number(id)).then(res => res.data),
  })

  const job = jobData?.job || jobData

  const { data: checklistData } = useQuery({
    queryKey: ['technician-checklist', id],
    queryFn: () => technicianAPI.getChecklist(Number(id)).then(res => res.data),
    enabled: !!job,
  })

  const checklist = checklistData?.checklists || checklistData || []

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

  const statusColors: Record<string, string> = {
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
    completed: 'bg-green-100 text-green-800 border-green-200',
    released: 'bg-slate-100 text-slate-800 border-slate-200',
  }

  const statusLabels: Record<string, string> = {
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
  }

  const currentStatus = job.status || 'accepted'
  const nextStatuses: Record<string, string[]> = {
    accepted: ['en_route', 'component_pickup'],
    en_route: ['arrived'],
    component_pickup: ['arrived'],
    arrived: ['diagnosing'],
    diagnosing: ['quoted', 'repairing'],
    quoted: ['signed_contract'],
    signed_contract: ['repairing'],
    repairing: ['quality_check', 'waiting_parts'],
    waiting_parts: ['repairing'],
    quality_check: ['waiting_payment', 'completed'],
    waiting_payment: ['completed'],
  }

  const quickActions = nextStatuses[currentStatus] || []

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
            <p className="text-xs text-slate-600 truncate">{device.brand} {device.device_type}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
            statusColors[currentStatus] || 'bg-slate-100 text-slate-800 border-slate-200'
          }`}>
            {statusLabels[currentStatus] || currentStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="px-4 md:px-0 space-y-3 md:space-y-4 md:max-w-4xl md:mx-auto pt-3 md:pt-6">

      {/* Quick Actions Bar - Most Important */}
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
          {ticket.latitude && ticket.longitude && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${ticket.latitude},${ticket.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold text-sm active:scale-95 transition-all"
            >
              <Navigation className="w-4 h-4" />
              Navigate
            </a>
          )}
        </div>
      </div>

      {/* Customer Contact - Compact */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 md:p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-900 text-sm">{customer.name || 'Customer'}</span>
          </div>
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
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
      </div>

      {/* Location - Compact */}
      {ticket.address && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 md:p-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">{ticket.address}</p>
              {ticket.latitude && ticket.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${ticket.latitude},${ticket.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 font-medium mt-1 inline-block"
                >
                  Open in Maps →
                </a>
              )}
            </div>
          </div>
          {ticket.preferred_date && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-600">
                {format(new Date(ticket.preferred_date), 'MMM dd, yyyy')} {ticket.preferred_time && `at ${ticket.preferred_time}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quick Status Update */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 md:p-4">
        <label className="block text-xs font-semibold text-slate-700 mb-2">Update Status</label>
        <select
          value={currentStatus}
          onChange={(e) => updateStatusMutation.mutate({ id: job.id, status: e.target.value })}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          disabled={updateStatusMutation.isPending}
        >
          <option value="accepted">Accepted</option>
          <option value="en_route">On My Way</option>
          <option value="component_pickup">Component Pickup</option>
          <option value="arrived">Reached</option>
          <option value="diagnosing">Diagnosed</option>
          <option value="quoted">Quoted</option>
          <option value="signed_contract">Signed Contract</option>
          <option value="repairing">Fixing</option>
          <option value="waiting_parts">Waiting for Parts</option>
          <option value="quality_check">Quality Check</option>
          <option value="waiting_payment">Waiting for Payment</option>
          <option value="completed">Completed</option>
        </select>
        {updateStatusMutation.isPending && (
          <p className="text-xs text-slate-500 mt-1.5">Updating...</p>
        )}
        {quickActions.length > 0 && (
          <div className="flex gap-2 mt-2">
            {quickActions.map((status) => (
              <button
                key={status}
                onClick={() => updateStatusMutation.mutate({ id: job.id, status })}
                disabled={updateStatusMutation.isPending}
                className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50"
              >
                {statusLabels[status] || status.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Issue Description - Compact */}
      {ticket.issue_description && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-semibold text-slate-700">Issue</h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{ticket.issue_description}</p>
        </div>
      )}

      {/* Checklist - Compact */}
      {checklist && checklist.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 md:p-4">
          <h3 className="text-xs font-semibold text-slate-700 mb-3">Checklist ({checklist.filter((item: any) => item.is_completed || item.completed).length}/{checklist.length})</h3>
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

      </div>
    </div>
  )
}

export default TechnicianJobDetail
