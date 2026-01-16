import axios from 'axios'

// API Base URL - Update via VITE_API_URL environment variable
// Default: https://aqua-falcon-493970.hostingersite.com/api
// Note: /docs/api is the Scramble API documentation, not the actual API endpoint
// The actual API endpoints are at /api (Laravel default)
const API_URL = import.meta.env.VITE_API_URL || 'https://aqua-falcon-493970.hostingersite.com/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
  register: (data: any) =>
    api.post('/register', data),
  logout: () =>
    api.post('/logout'),
  me: () =>
    api.get('/me'),
}

// Customer API
export const customerAPI = {
  createBooking: (data: any) =>
    api.post('/customer/bookings', data),
  getDevices: () =>
    api.get('/customer/devices'),
  getTickets: () =>
    api.get('/customer/tickets'),
  trackTicket: (ticketId: number) =>
    api.get(`/customer/tickets/${ticketId}/track`),
  getServiceHistory: () =>
    api.get('/customer/service-history'),
  getServiceHistoryByTicket: (ticketId: number) =>
    api.get(`/customer/service-history/${ticketId}`),
  submitRating: (jobId: number, data: any) =>
    api.post(`/customer/jobs/${jobId}/ratings`, data),
  getRating: (jobId: number) =>
    api.get(`/customer/jobs/${jobId}/ratings`),
  updateRating: (jobId: number, data: any) =>
    api.put(`/customer/jobs/${jobId}/ratings`, data),
}

// Technician API
export const technicianAPI = {
  getStatus: () =>
    api.get('/technician/status'),
  updateStatus: (status: string) =>
    api.put('/technician/status', { status }),
  updateLocation: (lat: number, lng: number) =>
    api.put('/technician/location', { latitude: lat, longitude: lng }),
  getOfferedJobs: () =>
    api.get('/technician/jobs/offered'),
  getAssignedJobs: () =>
    api.get('/technician/jobs/assigned'),
  acceptJob: (id: number) =>
    api.post(`/technician/jobs/${id}/accept`),
  rejectJob: (id: number) =>
    api.post(`/technician/jobs/${id}/reject`),
  getJob: (id: number) =>
    api.get(`/technician/jobs/${id}`),
  generateQuote: (id: number, data: any) =>
    api.post(`/technician/jobs/${id}/generate-quote`, data),
  signContract: (id: number) =>
    api.post(`/technician/jobs/${id}/sign-contract`),
  updateJobStatus: (id: number, status: string) =>
    api.put(`/technician/jobs/${id}/status`, { status }),
  updateJobEta: (id: number, etaMinutes: number) =>
    api.put(`/technician/jobs/${id}/eta`, { eta_minutes: etaMinutes }),
  uploadAfterPhoto: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('photo', file)
    return api.post(`/technician/jobs/${id}/after-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getChecklist: (jobId: number) =>
    api.get(`/technician/jobs/${jobId}/checklist`),
  completeChecklistItem: (jobId: number, checklistId: number) =>
    api.post(`/technician/jobs/${jobId}/checklist/${checklistId}/complete`),
  markOnHold: (jobId: number, reason: string) =>
    api.post(`/technician/jobs/${jobId}/on-hold`, { reason }),
}

// Public API (no auth required)
export const publicAPI = {
  getWhiteLabel: () =>
    api.get('/settings/white-label'),
  getDeviceTypes: () =>
    api.get('/device-types'),
  getDeviceBrands: (deviceType?: string) =>
    api.get('/device-brands', { params: deviceType ? { device_type: deviceType } : {} }),
  getDeviceModels: (deviceType: string, brand: string) =>
    api.get('/device-models', { params: { device_type: deviceType, brand } }),
  getAllDevices: () =>
    api.get('/devices/all'),
}

// Admin API
export const adminAPI = {
  getDashboard: () =>
    api.get('/admin/dashboard'),
  getTriage: () =>
    api.get('/admin/triage'),
  assignTriage: (ticketId: number, technicianId: number) =>
    api.post(`/admin/triage/${ticketId}/assign`, { technician_id: technicianId }),
  rejectTriage: (ticketId: number) =>
    api.post(`/admin/triage/${ticketId}/reject`),
  getServices: () =>
    api.get('/admin/services'),
  createService: (data: any) =>
    api.post('/admin/services', data),
  updateService: (id: number, data: any) =>
    api.put(`/admin/services/${id}`, data),
  deleteService: (id: number) =>
    api.delete(`/admin/services/${id}`),
  getTechnicians: () =>
    api.get('/admin/technicians'),
  getTechnicianRevenue: (id: number) =>
    api.get(`/admin/technicians/${id}/revenue`),
  getMap: () =>
    api.get('/admin/map'),
  getWhiteLabel: () =>
    api.get('/admin/settings/white-label'),
  updateWhiteLabel: (data: any) =>
    api.put('/admin/settings/white-label', data),
  // AMC
  getAmcContracts: (params?: any) => api.get('/admin/amc', { params }),
  createAmcContract: (data: any) => api.post('/admin/amc', data),
  getAmcContract: (id: number) => api.get(`/admin/amc/${id}`),
  updateAmcContract: (id: number, data: any) => api.put(`/admin/amc/${id}`, data),
  recordAmcVisit: (id: number) => api.post(`/admin/amc/${id}/visit`),
  getExpiringAmc: () => api.get('/admin/amc/expiring-soon'),
  // Expenses
  getExpenses: (params?: any) => api.get('/admin/expenses', { params }),
  createExpense: (data: any) => api.post('/admin/expenses', data),
  getExpense: (id: number) => api.get(`/admin/expenses/${id}`),
  approveExpense: (id: number) => api.post(`/admin/expenses/${id}/approve`),
  rejectExpense: (id: number, reason: string) => api.post(`/admin/expenses/${id}/reject`, { rejection_reason: reason }),
  markExpenseReimbursed: (id: number) => api.post(`/admin/expenses/${id}/reimbursed`),
  // Permissions
  getPermissions: (params?: any) => api.get('/admin/permissions', { params }),
  createPermission: (data: any) => api.post('/admin/permissions', data),
  getRolePermissions: (role: string) => api.get('/admin/permissions/role', { params: { role } }),
  assignRolePermission: (role: string, permissionId: number) => api.post('/admin/permissions/role/assign', { role, permission_id: permissionId }),
  removeRolePermission: (role: string, permissionId: number) => api.delete('/admin/permissions/role/remove', { data: { role, permission_id: permissionId } }),
  getUserPermissions: (userId: number) => api.get(`/admin/permissions/user/${userId}`),
  assignUserPermission: (userId: number, permissionId: number, granted: boolean = true) => api.post('/admin/permissions/user/assign', { user_id: userId, permission_id: permissionId, granted }),
  removeUserPermission: (userId: number, permissionId: number) => api.delete('/admin/permissions/user/remove', { data: { user_id: userId, permission_id: permissionId } }),
  // Invoices
  getInvoices: (params?: any) => api.get('/admin/invoices', { params }),
  createInvoice: (data: any) => api.post('/admin/invoices', data),
  createInvoiceFromQuote: (quoteId: number) => api.post(`/admin/invoices/from-quote/${quoteId}`),
  getInvoice: (id: number) => api.get(`/admin/invoices/${id}`),
  updateInvoice: (id: number, data: any) => api.put(`/admin/invoices/${id}`, data),
  sendInvoice: (id: number) => api.post(`/admin/invoices/${id}/send`),
  recordInvoicePayment: (id: number, amount: number) => api.post(`/admin/invoices/${id}/payment`, { amount }),
  // Tasks
  getTasks: (params?: any) => api.get('/admin/tasks', { params }),
  createTask: (data: any) => api.post('/admin/tasks', data),
  getTask: (id: number) => api.get(`/admin/tasks/${id}`),
  updateTask: (id: number, data: any) => api.put(`/admin/tasks/${id}`, data),
  startTask: (id: number) => api.post(`/admin/tasks/${id}/start`),
  completeTask: (id: number, data?: any) => api.post(`/admin/tasks/${id}/complete`, data),
  // POS
  getPosTransactions: (params?: any) => api.get('/admin/pos', { params }),
  createPosTransaction: (data: any) => api.post('/admin/pos', data),
  getPosTransaction: (id: number) => api.get(`/admin/pos/${id}`),
  scanBarcode: (barcode: string) => api.post('/admin/pos/scan', { barcode }),
  // Delivery OTP
  generateOtp: (jobId: number, data: any) => api.post(`/admin/delivery-otp/${jobId}/generate`, data),
  verifyOtp: (otp: string, jobId: number, verifiedBy?: string) => api.post('/admin/delivery-otp/verify', { otp, job_id: jobId, verified_by: verifiedBy }),
  getOtpsByJob: (jobId: number) => api.get(`/admin/delivery-otp/job/${jobId}`),
  // Digital Signature
  createSignature: (data: any) => api.post('/admin/signatures', data),
  getSignature: (id: number) => api.get(`/admin/signatures/${id}`),
  getSignaturesByDocument: (params: any) => api.get('/admin/signatures', { params }),
  verifySignature: (id: number) => api.get(`/admin/signatures/${id}/verify`),
  // Leads
  getLeads: (params?: any) => api.get('/admin/leads', { params }),
  createLead: (data: any) => api.post('/admin/leads', data),
  getLead: (id: number) => api.get(`/admin/leads/${id}`),
  updateLead: (id: number, data: any) => api.put(`/admin/leads/${id}`, data),
  convertLeadToCustomer: (id: number, createTicket: boolean = false) => api.post(`/admin/leads/${id}/convert`, { create_ticket: createTicket }),
  // Outsource
  getVendors: (params?: any) => api.get('/admin/outsource/vendors', { params }),
  createVendor: (data: any) => api.post('/admin/outsource/vendors', data),
  updateVendor: (id: number, data: any) => api.put(`/admin/outsource/vendors/${id}`, data),
  getOutsourceRequests: (params?: any) => api.get('/admin/outsource/requests', { params }),
  createOutsourceRequest: (data: any) => api.post('/admin/outsource/requests', data),
  updateOutsourceRequest: (id: number, data: any) => api.put(`/admin/outsource/requests/${id}`, data),
  // Data Recovery
  getDataRecoveryJobs: (params?: any) => api.get('/admin/data-recovery', { params }),
  createDataRecoveryJob: (data: any) => api.post('/admin/data-recovery', data),
  getDataRecoveryJob: (id: number) => api.get(`/admin/data-recovery/${id}`),
  updateDataRecoveryJob: (id: number, data: any) => api.put(`/admin/data-recovery/${id}`, data),
  // Suppliers
  getSuppliers: (params?: any) => api.get('/admin/suppliers', { params }),
  createSupplier: (data: any) => api.post('/admin/suppliers', data),
  getSupplier: (id: number) => api.get(`/admin/suppliers/${id}`),
  updateSupplier: (id: number, data: any) => api.put(`/admin/suppliers/${id}`, data),
  // Purchase Orders
  getPurchaseOrders: (params?: any) => api.get('/admin/purchase-orders', { params }),
  createPurchaseOrder: (data: any) => api.post('/admin/purchase-orders', data),
  getPurchaseOrder: (id: number) => api.get(`/admin/purchase-orders/${id}`),
  updatePurchaseOrder: (id: number, data: any) => api.put(`/admin/purchase-orders/${id}`, data),
  sendPurchaseOrder: (id: number) => api.post(`/admin/purchase-orders/${id}/send`),
  // Locations
  getLocations: (params?: any) => api.get('/admin/locations', { params }),
  createLocation: (data: any) => api.post('/admin/locations', data),
  getLocation: (id: number) => api.get(`/admin/locations/${id}`),
  updateLocation: (id: number, data: any) => api.put(`/admin/locations/${id}`, data),
  // Technician Performance
  getTechnicianPerformance: (params?: any) => api.get('/admin/technician-performance', { params }),
  calculatePerformance: (technicianId: number, periodStart: string, periodEnd: string) => api.post(`/admin/technician-performance/${technicianId}/calculate`, { period_start: periodStart, period_end: periodEnd }),
  getPerformance: (id: number) => api.get(`/admin/technician-performance/${id}`),
  // Integrations
  getIntegrations: (params?: any) => api.get('/admin/integrations', { params }),
  createIntegration: (data: any) => api.post('/admin/integrations', data),
  getIntegration: (id: number) => api.get(`/admin/integrations/${id}`),
  updateIntegration: (id: number, data: any) => api.put(`/admin/integrations/${id}`, data),
  syncIntegration: (id: number) => api.post(`/admin/integrations/${id}/sync`),
  // Branding
  getBranding: () => api.get('/admin/branding'),
  createBranding: (data: any) => api.post('/admin/branding', data),
  updateBranding: (data: any) => api.put('/admin/branding', data),
  // Inventory
  getInventory: (params?: any) => api.get('/admin/inventory', { params }),
  createInventoryItem: (data: any) => api.post('/admin/inventory', data),
  getInventoryItem: (id: number) => api.get(`/admin/inventory/${id}`),
  updateInventoryItem: (id: number, data: any) => api.put(`/admin/inventory/${id}`, data),
  adjustStock: (id: number, quantity: number, type: 'add' | 'subtract' | 'set', reason?: string) => api.post(`/admin/inventory/${id}/adjust`, { quantity, type, reason }),
  getReorderAlerts: () => api.get('/admin/inventory/reorder-alerts'),
  scanBarcodeInventory: (barcode: string) => api.post('/admin/inventory/scan', { barcode }),
  // Device Images
  uploadDeviceImages: (ticketId: number, images: File[], imageType?: string) => {
    const formData = new FormData()
    images.forEach((img, idx) => formData.append(`images[${idx}]`, img))
    if (imageType) formData.append('image_type', imageType)
    return api.post(`/admin/tickets/${ticketId}/device-images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteDeviceImage: (ticketId: number, imagePath: string) => api.delete(`/admin/tickets/${ticketId}/device-images`, { data: { image_path: imagePath } }),
}
