import { useState, useCallback } from 'react'

interface LocationData {
  latitude: number | null
  longitude: number | null
  address: string
  loading: boolean
  error: string | null
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData>({
    latitude: null,
    longitude: null,
    address: '',
    loading: false,
    error: null,
  })

  const getCurrentLocation = useCallback(async (): Promise<LocationData> => {
    setLocation(prev => ({ ...prev, loading: true, error: null }))

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by your browser'
        setLocation(prev => ({ ...prev, loading: false, error }))
        reject(new Error(error))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          try {
            // Reverse geocode using Google Maps API
            const address = await reverseGeocode(latitude, longitude)
            
            const locationData: LocationData = {
              latitude,
              longitude,
              address,
              loading: false,
              error: null,
            }
            
            setLocation(locationData)
            resolve(locationData)
          } catch (error: any) {
            const errorMsg = error.message || 'Failed to get address'
            setLocation(prev => ({
              ...prev,
              latitude,
              longitude,
              address: `${latitude}, ${longitude}`,
              loading: false,
              error: errorMsg,
            }))
            resolve({
              latitude,
              longitude,
              address: `${latitude}, ${longitude}`,
              loading: false,
              error: errorMsg,
            })
          }
        },
        (error) => {
          const errorMsg = error.message || 'Failed to get location'
          setLocation(prev => ({ ...prev, loading: false, error: errorMsg }))
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }, [])

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || typeof (window as any).google === 'undefined' || !(window as any).google.maps || !(window as any).google.maps.Geocoder) {
        // Fallback to API call if Google Maps not loaded
        fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyCX5KEm1rEGxp05USWcE2XwUlh9KiVnhVs`
        )
          .then(res => res.json())
          .then(data => {
            if (data.results && data.results.length > 0) {
              resolve(data.results[0].formatted_address)
            } else {
              reject(new Error('No address found'))
            }
          })
          .catch(reject)
        return
      }

      const geocoder = new (window as any).google.maps.Geocoder()
      const latlng = { lat, lng }

      geocoder.geocode({ location: latlng }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address)
        } else {
          reject(new Error('Geocoding failed: ' + status))
        }
      })
    })
  }

  const setAddress = useCallback((address: string) => {
    setLocation(prev => ({ ...prev, address }))
  }, [])

  const setCoordinates = useCallback(async (lat: number, lng: number) => {
    setLocation(prev => ({ ...prev, loading: true }))
    try {
      const address = await reverseGeocode(lat, lng)
      setLocation({
        latitude: lat,
        longitude: lng,
        address,
        loading: false,
        error: null,
      })
    } catch (error: any) {
      setLocation(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        address: `${lat}, ${lng}`,
        loading: false,
        error: error.message,
      }))
    }
  }, [])

  return {
    location,
    getCurrentLocation,
    setAddress,
    setCoordinates,
  }
}
