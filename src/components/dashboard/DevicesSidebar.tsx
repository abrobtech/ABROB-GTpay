import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Device } from '@/hooks/useGPSData';
import { 
  Battery, 
  MapPin, 
  Shield, 
  AlertTriangle, 
  Search,
  ChevronRight,
  Zap,
  Radio,
  Lock,
  Share2
} from 'lucide-react';

interface DevicesSidebarProps {
  devices: Device[];
  selectedDevice: Device | null;
  onDeviceSelect: (device: Device) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function DevicesSidebar({ 
  devices, 
  selectedDevice, 
  onDeviceSelect,
  collapsed = false,
  onToggleCollapse 
}: DevicesSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.imei.includes(searchTerm)
  );

  const getStatusColor = (device: Device) => {
    if (device.tamperStatus || device.jammingStatus) return 'destructive';
    switch (device.status) {
      case 'online': return 'default';
      case 'offline': return 'secondary';
      case 'maintenance': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (device: Device) => {
    if (device.tamperStatus) return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (device.jammingStatus) return <Radio className="w-4 h-4 text-warning" />;
    return <MapPin className="w-4 h-4 text-primary" />;
  };

  const getBatteryColor = (percentage: number) => {
    if (percentage > 50) return 'text-success';
    if (percentage > 20) return 'text-warning';
    return 'text-destructive';
  };

  if (collapsed) {
    return (
      <div className="w-16 bg-card border-r h-full flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-10 h-10 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        {filteredDevices.slice(0, 3).map((device) => (
          <Button
            key={device.id}
            variant={selectedDevice?.id === device.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onDeviceSelect(device)}
            className="w-10 h-10 p-0 relative"
          >
            {getStatusIcon(device)}
            {(device.tamperStatus || device.jammingStatus) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
            )}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" />
            Devices
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-8 h-8 p-0"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </Button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="space-y-2 p-4">
            {filteredDevices.map((device) => (
              <Card
                key={device.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDevice?.id === device.id 
                    ? 'ring-2 ring-primary shadow-lg' 
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => onDeviceSelect(device)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(device)}
                        <h3 className="font-semibold truncate">{device.name}</h3>
                      </div>
                      <Badge variant={getStatusColor(device)} className="text-xs">
                        {device.status}
                      </Badge>
                    </div>

                    {/* Status indicators */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Battery className={`w-4 h-4 ${getBatteryColor(device.batteryPercentage)}`} />
                        <span className={getBatteryColor(device.batteryPercentage)}>
                          {device.batteryPercentage}%
                        </span>
                      </div>
                      {device.speed !== undefined && (
                        <div className="flex items-center space-x-1">
                          <Zap className="w-4 h-4 text-muted-foreground" />
                          <span>{device.speed} mph</span>
                        </div>
                      )}
                    </div>

                    {/* Alerts */}
                    {(device.tamperStatus || device.jammingStatus) && (
                      <div className="space-y-1">
                        {device.tamperStatus && (
                          <div className="flex items-center space-x-2 text-destructive text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Tamper detected</span>
                          </div>
                        )}
                        {device.jammingStatus && (
                          <div className="flex items-center space-x-2 text-warning text-xs">
                            <Radio className="w-3 h-3" />
                            <span>Signal jamming</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Last seen */}
                    <div className="text-xs text-muted-foreground">
                      Last seen: {new Date(device.lastSeen).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Selected Device Actions */}
        {selectedDevice && (
          <>
            <Separator />
            <div className="p-4 space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Decoy
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Lock
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  SOS
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Share2 className="w-3 h-3 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}