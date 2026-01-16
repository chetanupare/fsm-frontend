import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { 
  Home, 
  Calendar, 
  MapPin, 
  Briefcase, 
  LogOut, 
  Menu,
  X,
  User
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Layout = () => {
  const { user, logout } = useAuthStore()
  const { colors } = useThemeStore()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const customerNav = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/booking', label: 'Book', icon: Calendar },
    { path: '/tracking', label: 'Track', icon: MapPin },
  ]

  const technicianNav = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/jobs', label: 'Jobs', icon: Briefcase },
  ]

  const navItems = user?.role === 'customer' ? customerNav : technicianNav
  const isCustomer = user?.role === 'customer'

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Mobile Header - App Bar Style */}
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-200 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold" style={{ color: `var(--color-primary)` }}>
            {colors.appName}
          </h1>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:left-0 md:top-0 md:h-full md:w-64 md:bg-white md:border-r md:border-slate-200 md:z-40">
        <div className="flex flex-col h-full p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: `var(--color-primary)` }}>
              {colors.appName}
            </h1>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-slate-50">
            <p className="font-semibold text-slate-800">{user?.name}</p>
            <p className="text-sm text-slate-600 capitalize">{user?.role}</p>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary-gradient text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all mt-auto"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 bg-white z-50 shadow-2xl md:hidden"
            >
              <div className="flex flex-col h-full p-6">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-xl font-bold" style={{ color: `var(--color-primary)` }}>
                    {colors.appName}
                  </h1>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-primary-gradient flex items-center justify-center text-white font-bold text-lg">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{user?.name}</p>
                      <p className="text-sm text-slate-600 capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>

                <nav className="flex-1 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-primary-gradient text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>

                <button
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all mt-auto"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="md:ml-64">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation Bar - Mobile Only */}
      {(isCustomer || user?.role === 'technician') && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 md:hidden safe-area-inset-bottom shadow-lg">
          <div className="flex items-center justify-around px-2 py-2">
            {(user?.role === 'customer' ? customerNav : technicianNav).map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[70px] ${
                    isActive
                      ? 'text-primary'
                      : 'text-slate-500'
                  }`}
                >
                  <div className={`p-2 rounded-full transition-all ${
                    isActive ? 'bg-primary/10' : ''
                  }`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}

export default Layout
