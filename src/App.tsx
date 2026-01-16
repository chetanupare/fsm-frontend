import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CustomerDashboard from './pages/customer/Dashboard'
import CustomerBooking from './pages/customer/Booking'
import CustomerTracking from './pages/customer/Tracking'
import TechnicianDashboard from './pages/technician/Dashboard'
import TechnicianJobs from './pages/technician/Jobs'
import TechnicianJobDetail from './pages/technician/JobDetail'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={
            user?.role === 'customer' ? <CustomerDashboard /> :
            user?.role === 'technician' ? <TechnicianDashboard /> :
            <Navigate to="/login" />
          } />
          
          {user?.role === 'customer' && (
            <>
              <Route path="/booking" element={<CustomerBooking />} />
              <Route path="/tracking" element={<CustomerTracking />} />
            </>
          )}
          
          {user?.role === 'technician' && (
            <>
              <Route path="/jobs" element={<TechnicianJobs />} />
              <Route path="/jobs/:id" element={<TechnicianJobDetail />} />
            </>
          )}
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
