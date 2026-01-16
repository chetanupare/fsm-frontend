import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { publicAPI } from '../lib/api'

interface ThemeColors {
  primary: string
  secondary: string
  appName: string
  logoUrl: string | null
}

interface ThemeState {
  colors: ThemeColors
  isLoading: boolean
  isInitialized: boolean
  fetchColors: () => Promise<void>
  setColors: (colors: ThemeColors) => void
}

const defaultColors: ThemeColors = {
  primary: '#3B82F6', // blue-600
  secondary: '#1E40AF', // blue-800
  appName: 'FCM',
  logoUrl: null,
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      colors: defaultColors,
      isLoading: false,
      isInitialized: false,
      fetchColors: async () => {
        if (get().isInitialized) return
        
        set({ isLoading: true })
        try {
          const response = await publicAPI.getWhiteLabel()
          const data = response.data
          
          const colors: ThemeColors = {
            primary: data.primary_color || defaultColors.primary,
            secondary: data.secondary_color || defaultColors.secondary,
            appName: data.app_name || defaultColors.appName,
            logoUrl: data.logo_url || null,
          }
          
          set({ colors, isLoading: false, isInitialized: true })
          
          // Apply colors to CSS variables
          applyThemeColors(colors)
        } catch (error) {
          console.error('Failed to fetch theme colors:', error)
          // Use default colors on error
          set({ colors: defaultColors, isLoading: false, isInitialized: true })
          applyThemeColors(defaultColors)
        }
      },
      setColors: (colors: ThemeColors) => {
        set({ colors, isInitialized: true })
        applyThemeColors(colors)
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ colors: state.colors, isInitialized: state.isInitialized }),
    }
  )
)

// Apply theme colors to CSS variables
function applyThemeColors(colors: ThemeColors) {
  const root = document.documentElement
  
  // Set CSS variables
  root.style.setProperty('--color-primary', colors.primary)
  root.style.setProperty('--color-secondary', colors.secondary)
  
  // Convert hex to RGB for opacity variants
  const primaryRgb = hexToRgb(colors.primary)
  const secondaryRgb = hexToRgb(colors.secondary)
  
  if (primaryRgb) {
    root.style.setProperty('--color-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`)
  }
  if (secondaryRgb) {
    root.style.setProperty('--color-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`)
  }
  
  // Update theme color meta tag for PWA
  const themeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', colors.primary)
  }
  
  // Update PWA manifest theme color if available
  if ('serviceWorker' in navigator && 'getManifest' in navigator) {
    // Manifest is updated via service worker registration
    // The theme color is already set in the meta tag which PWA uses
  }
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

// Initialize theme on module load
if (typeof window !== 'undefined') {
  const store = useThemeStore.getState()
  if (!store.isInitialized) {
    store.fetchColors()
  } else {
    // Apply cached colors immediately
    applyThemeColors(store.colors)
  }
}
