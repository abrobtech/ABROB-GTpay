import { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { Device } from '@/hooks/useGPSData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Battery, 
  Gauge, 
  Clock,
  Shield,
  Radio,
  Maximize2
} from 'lucide-react';

interface DeviceTrackingProps {
  device: Device | null;
  open: boolean;
  onClose: () => void;
}

export default function DeviceTracking({ device, open, onClose }: DeviceTrackingProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const marker = useRef<maptilersdk.Marker | null>(null);
  // Replace 'YOUR_MAPTILER_API_KEY_HERE' with your actual MapTiler API key
  const MAPTILER_API_KEY = 'tBvtabTNxhFc7RfCBn1T';
  const [isFullscreen, setIsFullscreen] = useState(false);

  const initializeMap = async () => {
    if (!mapContainer.current || !MAPTILER_API_KEY || !device) {
      console.error('Missing required data:', { 
        mapContainer: !!mapContainer.current, 
        MAPTILER_API_KEY: !!MAPTILER_API_KEY, 
        device: !!device 
      });
      return;
    }

    try {
      console.log('Initializing MapTiler with device:', device);
      maptilersdk.config.apiKey = MAPTILER_API_KEY;

      // Use device location data
      const lat = device.latitude;
      const lng = device.longitude;
      
      const center: [number, number] = lat && lng 
        ? [lng, lat]
        : [-74.0060, 40.7128];

      console.log('Map center:', center);

      map.current = new maptilersdk.Map({
        container: mapContainer.current,
        style: maptilersdk.MapStyle.STREETS,
        center: center,
        zoom: 15,
      });

      // Wait for map to load before creating marker
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        if (lat && lng) {
          createDeviceMarker();
        }
      });

    } catch (error) {
      console.error('Error loading MapTiler:', error);
      // Show user-friendly error message
      alert('Failed to initialize map. Please check your MapTiler API key and try again.');
    }
  };

  const createDeviceMarker = () => {
    if (!map.current || !device || !device.latitude || !device.longitude) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Create custom marker element
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundColor = getMarkerColor();
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid #ffffff';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

    marker.current = new maptilersdk.Marker({ element: el })
      .setLngLat([device.longitude, device.latitude] as [number, number])
      .addTo(map.current);

    // Create popup content
    const popupContent = `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; font-weight: bold;">${device.name}</h3>
        <p><strong>Status:</strong> <span style="color: ${getStatusColor()}">${device.status}</span></p>
        <p><strong>Battery:</strong> ${device.batteryPercentage}%</p>
        <p><strong>Speed:</strong> ${device.speed || 0} mph</p>
        <p><strong>Last Update:</strong> ${new Date(device.lastSeen).toLocaleString()}</p>
        ${device.tamperStatus ? '<p style="color: red;"><strong>⚠️ Tamper Alert</strong></p>' : ''}
        ${device.jammingStatus ? '<p style="color: orange;"><strong>📡 Signal Jamming</strong></p>' : ''}
      </div>
    `;

    const popup = new maptilersdk.Popup({ offset: 25 })
      .setHTML(popupContent);

    marker.current.setPopup(popup);
    
    // Auto-open popup for real-time tracking
    popup.addTo(map.current);
  };

  const getMarkerColor = () => {
    if (!device) return '#6b7280';
    if (device.tamperStatus || device.jammingStatus) return '#ef4444';
    switch (device.status) {
      case 'online': return '#10b981';
      case 'offline': return '#6b7280';
      case 'maintenance': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusColor = () => {
    if (!device) return '#6b7280';
    if (device.tamperStatus || device.jammingStatus) return '#ef4444';
    switch (device.status) {
      case 'online': return '#10b981';
      case 'offline': return '#6b7280';
      case 'maintenance': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getBatteryColor = (percentage: number) => {
    if (percentage > 50) return 'text-success';
    if (percentage > 20) return 'text-warning';
    return 'text-destructive';
  };

  // Update marker position when device data changes
  useEffect(() => {
    if (map.current && device && device.latitude && device.longitude) {
      createDeviceMarker();
      map.current.setCenter([device.longitude, device.latitude] as [number, number]);
    }
  }, [device]);

  // Initialize map when dialog opens
  useEffect(() => {
    if (open && device) {
      const timer = setTimeout(() => initializeMap(), 100);
      return () => clearTimeout(timer);
    }
  }, [open, device]);

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={isFullscreen ? "sm:max-w-[95vw] sm:max-h-[95vh]" : "sm:max-w-6xl"}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Navigation className="w-5 h-5" />
              <span>Live Tracking - {device.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device Status Bar */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                  {device.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Battery className={`w-4 h-4 ${getBatteryColor(device.batteryPercentage)}`} />
                <span className={`font-medium ${getBatteryColor(device.batteryPercentage)}`}>
                  {device.batteryPercentage}%
                </span>
              </div>
              {device.speed !== undefined && (
                <div className="flex items-center space-x-2">
                  <Gauge className="w-4 h-4" />
                  <span className="font-medium">{device.speed} mph</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{new Date(device.lastSeen).toLocaleString()}</span>
              </div>
            </div>
            
            {(device.tamperStatus || device.jammingStatus) && (
              <div className="flex items-center space-x-4">
                {device.tamperStatus && (
                  <div className="flex items-center space-x-1 text-destructive">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Tamper</span>
                  </div>
                )}
                {device.jammingStatus && (
                  <div className="flex items-center space-x-1 text-warning">
                    <Radio className="w-4 h-4" />
                    <span className="text-sm font-medium">Jamming</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Map Container */}
          <div 
            ref={mapContainer} 
            className={`w-full rounded-lg border ${isFullscreen ? 'h-[75vh]' : 'h-96'}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
