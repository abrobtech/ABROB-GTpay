import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import DeviceDetails from '@/components/devices/DeviceDetails';
import DeviceTracking from '@/components/devices/DeviceTracking';
import DeviceProvisionModal from '@/components/devices/DeviceProvisionModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Battery, Shield, Radio, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Devices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { devices, loading } = useFirebaseData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.imei.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getBatteryColor = (percentage: number) => {
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleViewDetails = (device: any) => {
    setSelectedDevice(device);
    setShowDetails(true);
  };

  const handleTrackLive = (device: any) => {
    setSelectedDevice(device);
    setShowTracking(true);
  };

  const handleCreated = (device: any) => {
    // Called after successful creation in modal.
    // Optionally: refresh device list, navigate, or show toast.
    // If your useGPSData hook supports refresh, call it here.
    toast({ title: "Device created", description: "Device was provisioned successfully." });
    // Example: navigate('/devices') or refresh data depending on your data flow.
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header alertsCount={0} onAlertsClick={() => {}} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeItem="devices"
          onItemClick={(itemId) => navigate(`/${itemId === 'dashboard' ? '' : itemId}`)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-foreground">Devices</h1>
              <Button onClick={() => setShowProvisionModal(true)}>Add Device</Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDevices.map((device) => (
                <Card key={device.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{device.name}</h3>
                      <p className="text-sm text-muted-foreground">{device.imei}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">Status</span>
                      </div>
                      <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                        {device.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Battery className="w-4 h-4" />
                        <span className="text-sm">Battery</span>
                      </div>
                      <span className={`font-semibold ${getBatteryColor(device.batteryPercentage)}`}>
                        {device.batteryPercentage ?? '—'}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm">Tamper</span>
                      </div>
                      <span className="font-medium text-sm">{device.tamperDetected ? 'Yes' : (device.tamperStatus ? 'Possible' : 'No')}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">Speed</span>
                      </div>
                      <span className="font-medium">{device.speed ?? 0} km/h</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleViewDetails(device)}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleTrackLive(device)}
                    >
                      Track Live
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DeviceDetails
        device={selectedDevice}
        open={showDetails}
        onClose={() => setShowDetails(false)}
      />

      <DeviceTracking
        device={selectedDevice}
        open={showTracking}
        onClose={() => setShowTracking(false)}
      />

      <DeviceProvisionModal
        open={showProvisionModal}
        onClose={() => setShowProvisionModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
