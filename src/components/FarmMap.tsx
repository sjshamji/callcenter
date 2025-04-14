'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Define the Farmer interface to match our data structure
interface Farmer {
  "Farmer ID": string
  "Farmer Name"?: string
  "Location"?: string
  "GPS Coordinates"?: string
  "Farm Size (Acres)"?: number
}

interface FarmMapProps {
  farmers: Farmer[]
}

// Parse GPS coordinates from string format like "(-0.09, 34.76)"
const parseCoordinates = (coordsString?: string): [number, number] | null => {
  if (!coordsString) return null
  
  try {
    // Extract numbers from the string using regex
    const matches = coordsString.match(/-?\d+\.\d+/g)
    if (!matches || matches.length < 2) return null
    
    return [parseFloat(matches[0]), parseFloat(matches[1])]
  } catch (e) {
    console.error('Error parsing coordinates:', coordsString, e)
    return null
  }
}

const FarmMap = ({ farmers }: FarmMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    
    // Initialize the map if it hasn't been created yet
    if (!mapInstanceRef.current) {
      // Create map centered on Kenya (approximate)
      const map = L.map(mapRef.current, {
        zoomControl: false,  // Remove zoom controls for minimalist look
        attributionControl: false // Remove attribution for cleaner look
      }).setView([-0.2, 34.5], 8)
      
      // Add a minimalist CartoDB Positron tile layer (light, clean design)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map)
      
      // Add minimal zoom control to bottom right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map)
      
      // Add small attribution in bottom left
      L.control.attribution({
        position: 'bottomleft',
        prefix: ''
      }).addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>').addTo(map)
      
      mapInstanceRef.current = map
    }
    
    // Add markers for each farmer with valid coordinates
    const markers: L.Layer[] = []
    farmers.forEach(farmer => {
      const coords = parseCoordinates(farmer["GPS Coordinates"])
      if (coords) {
        // Use a simple circle marker instead of an icon
        const marker = L.circleMarker([coords[0], coords[1]], { 
          radius: 6, 
          fillColor: '#000',  // Black dot
          color: '#fff',      // White border
          weight: 1.5,        // Border width
          opacity: 1,
          fillOpacity: 0.9
        })
        
        // Add popup with farmer info
        marker.bindPopup(`
          <div class="text-center">
            <strong>${farmer["Farmer Name"] || 'Unnamed Farmer'}</strong><br>
            <span>${farmer["Farmer ID"]}</span><br>
            <span>${farmer["Location"] || 'Unknown Location'}</span><br>
            ${farmer["Farm Size (Acres)"] ? `<span>${farmer["Farm Size (Acres)"]} acres</span>` : ''}
          </div>
        `)
        
        marker.addTo(mapInstanceRef.current!)
        markers.push(marker)
      }
    })
    
    // If we have markers, fit the map bounds to include all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers)
      mapInstanceRef.current!.fitBounds(group.getBounds(), { padding: [50, 50] })
    }
    
    // Cleanup function
    return () => {
      // Only cleanup markers, not the entire map
      markers.forEach(marker => {
        marker.remove()
      })
    }
  }, [farmers])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div ref={mapRef} className="h-full w-full" />
}

export default FarmMap 