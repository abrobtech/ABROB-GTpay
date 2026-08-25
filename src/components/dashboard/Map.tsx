import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { Device } from '@/hooks/useGPSData';

interface MapProps {
  devices: Device[];
  selectedDevice?: Device | null;
  onDeviceSelect?: (device: Device) => void;
}

// Configure the token through Vite environment variables; never commit secrets.
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function Map({ devices, selectedDevice, onDeviceSelect }: MapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      setIsLoading(true);
      
      // Use Mapbox style directly
      const style = 'mapbox://styles/mapbox/streets-v11';

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style,
        center: [0, 0],
        zoom: 2,
        attributionControl: true,
      });

      map.addControl(new mapboxgl.NavigationControl());
      map.addControl(new mapboxgl.FullscreenControl());
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }));

      map.on('load', () => {
        setIsLoading(false);
      });

      mapRef.current = map;
    }

    return () => {
      // Keep map mounted for performance; remove if you want full cleanup
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // remove previous markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    devices.forEach((device) => {
      if (!device.latitude || !device.longitude) return;

      const el = document.createElement('div');
      el.className = 'rounded-full border-2 shadow-md transition-all duration-300';
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.background = device.tamperStatus || device.jammingStatus ? '#ef4444' : (device.status === 'online' ? '#10b981' : '#6b7280');
      el.style.border = '2px solid #fff';

      const popup = new mapboxgl.Popup({ 
        offset: 12,
        closeButton: false,
        className: 'custom-popup'
      }).setHTML(`
        <div class="p-2">
          <strong class="text-sm">${device.name}</strong>
          <div class="text-xs mt-1">Battery: ${device.batteryPercentage ?? 'N/A'}%</div>
          <div class="text-xs">Status: ${device.status}</div>
          ${device.tamperStatus ? '<div class="text-xs text-red-500 font-bold">⚠️ Tamper Alert</div>' : ''}
          ${device.jammingStatus ? '<div class="text-xs text-orange-500 font-bold">⚠️ Jamming Alert</div>' : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker({ 
        element: el,
        anchor: 'center',
      })
        .setLngLat([device.longitude, device.latitude])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener('click', () => onDeviceSelect?.(device));
      markersRef.current[device.id] = marker;
    });
  }, [devices, onDeviceSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedDevice || !selectedDevice.latitude || !selectedDevice.longitude) return;
    
    // Smooth transition to selected device
    map.flyTo({ 
      center: [selectedDevice.longitude, selectedDevice.latitude], 
      zoom: 15,
      essential: true,
      duration: 1000,
      padding: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    // Open popup for selected device
    const marker = markersRef.current[selectedDevice.id];
    if (marker) {
      marker.togglePopup();
    }
  }, [selectedDevice]);

  if (!devices || devices.length === 0) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No device locations available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-medium">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}