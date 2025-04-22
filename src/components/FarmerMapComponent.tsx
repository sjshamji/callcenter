'use client';

import React, { useRef, useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
(() => {
  if (typeof window !== 'undefined') {
    // Fix Leaflet's icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }
})();

interface FarmerMapComponentProps {
  farmersData: Array<{
    latitude: number;
    longitude: number;
    region: string;
    "Farmer ID"?: string;
    "Farmer Name"?: string;
    "Farm Size (Acres)"?: number;
    [key: string]: any;
  }>;
  onSelectFarmer: (farmer: any) => void;
}

export default function FarmerMapComponent({ 
  farmersData, 
  onSelectFarmer 
}: FarmerMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const leafletMapRef = useRef<L.Map | null>(null);
  
  // Initialize the map when the component mounts
  useEffect(() => {
    if (!mapRef.current) return;
    
    // If map already exists, clean it up first
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }
    
    // Create the map
    const map = L.map(mapRef.current).setView([0.0236, 37.9062], 6);
    
    // Add the tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add markers for each farmer
    farmersData.forEach((farmer) => {
      const color = farmer.region === 'Northern' ? '#ef4444' : 
                   farmer.region === 'Central' ? '#3b82f6' : '#10b981';
      
      const circleMarker = L.circleMarker([farmer.latitude, farmer.longitude], {
        radius: 6,
        fillColor: color,
        color: 'white',
        weight: 1,
        fillOpacity: 0.8
      }).addTo(map);
      
      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'p-2 min-w-[200px]';
      popupContent.innerHTML = `
        <h3 class="font-medium text-base mb-1">${farmer["Farmer Name"] || "Unknown Farmer"}</h3>
        <div class="text-sm mb-2">
          <span class="inline-block w-2 h-2 rounded-full mr-1" style="background-color: ${color}"></span>
          <span class="text-gray-600">${farmer.region} Region</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p class="text-gray-500">Farmer ID</p>
            <p class="font-medium">${farmer["Farmer ID"] || "Unknown"}</p>
          </div>
          <div>
            <p class="text-gray-500">Farm Size</p>
            <p class="font-medium">${farmer["Farm Size (Acres)"] || 0} acres</p>
          </div>
        </div>
      `;
      
      // Bind the popup to the marker
      circleMarker.bindPopup(popupContent);
      
      // Add click event to select the farmer
      circleMarker.on('click', () => {
        onSelectFarmer(farmer);
      });
    });
    
    // Store the map reference
    leafletMapRef.current = map;
    setIsLoading(false);
    
    // Clean up when the component unmounts
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [farmersData, onSelectFarmer]);
  
  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="mt-2 text-sm text-gray-600">Loading map...</span>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="h-full w-full"
      />
    </>
  );
} 