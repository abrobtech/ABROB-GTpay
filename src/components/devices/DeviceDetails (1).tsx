import { Device } from '@/hooks/useGPSData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Battery, 
  MapPin, 
  Clock, 
  Gauge, 
  Shield, 
  Radio,
  Smartphone,
  User,
  Calendar
} from 'lucide-react';

interface DeviceDetailsProps {
  device: Device | null;
  open: boolean;
  onClose: () => void;
}

export default function DeviceDetails({ device, open, onClose }: DeviceDetailsProps) {
  if (!device) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'offline': return 'secondary';
      case 'maintenance': return 'outline';
      default: return 'secondary';
    }
  };

  const getBatteryColor = (percentage: number) => {
    if (percentage > 50) return 'text-success';
    if (percentage > 20) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5" />
            <span>{device.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Status</span>
                  </div>
                  <Badge variant={getStatusColor(device.status)}>
                    {device.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Battery className="w-4 h-4" />
                    <span className="text-sm">Battery</span>
                  </div>
                  <span className={`font-semibold ${getBatteryColor(device.batteryPercentage)}`}>
                    {device.batteryPercentage}%
                  </span>
                </div>
              </div>
              
              {device.speed !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Gauge className="w-4 h-4" />
                    <span className="text-sm">Current Speed</span>
                  </div>
                  <span className="font-medium">{device.speed} mph</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Information */}
          {(device.latitude && device.longitude) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Location Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Latitude</span>
                    <span className="font-mono text-sm">{device.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Longitude</span>
                    <span className="font-mono text-sm">{device.longitude.toFixed(6)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-sm">IMEI</span>
                  </div>
                  <span className="font-mono text-sm">{device.imei}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Owner</span>
                  </div>
                  <span className="text-sm">{device.owner_id || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Last Seen</span>
                  </div>
                  <span className="text-sm">{new Date(device.lastSeen).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {(device.tamperStatus || device.jammingStatus) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-destructive">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {device.tamperStatus && (
                  <div className="flex items-center space-x-2 text-destructive">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Tamper Alert - Device has been tampered with</span>
                  </div>
                )}
                {device.jammingStatus && (
                  <div className="flex items-center space-x-2 text-warning">
                    <Radio className="w-4 h-4" />
                    <span className="text-sm font-medium">Signal Jamming - GPS signal is being jammed</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}