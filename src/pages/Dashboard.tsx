import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useFirebaseData, Device } from '@/hooks/useFirebaseData';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Map from '@/components/dashboard/Map';
import DevicesSidebar from '@/components/dashboard/DevicesSidebar';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Battery, Shield, MapPin } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { devices, locations, loading, refetch } = useFirebaseData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [devicesSidebarCollapsed, setDevicesSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0]);
    }
  }, [devices, selectedDevice]);

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
  };

  // refresh every 60s to ensure latest data (RTDB listeners also update in realtime)
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      refetch && refetch().catch((e) => console.error('refetch error', e));
    }, 60_000);
    return () => clearInterval(id);
  }, [user, refetch]);


  const getAlertsCount = () => {
    return devices.filter(device => 
      device.tamperStatus || 
      device.jammingStatus || 
      device.batteryPercentage < 20
    ).length;
  };

  const handleAlertsClick = () => {
    navigate('/alerts');
  };

  const handleNavigation = (itemId: string) => {
    setActiveView(itemId);
    navigate(`/${itemId === 'dashboard' ? '' : itemId}`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header 
        alertsCount={getAlertsCount()} 
        onAlertsClick={handleAlertsClick}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeItem={activeView}
          onItemClick={handleNavigation}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="flex-1 flex">
          <DevicesSidebar
            devices={devices}
            selectedDevice={selectedDevice}
            onDeviceSelect={handleDeviceSelect}
            collapsed={devicesSidebarCollapsed}
            onToggleCollapse={() => setDevicesSidebarCollapsed(!devicesSidebarCollapsed)}
          />
          
          <div className="flex-1 flex flex-col">
            {/* Dashboard Stats */}
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Dashboard Overview</h1>
                <p className="text-muted-foreground mt-2">Monitor your fleet and devices in real-time</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{devices.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {devices.filter(d => d.status === 'online').length} online
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{getAlertsCount()}</div>
                    <p className="text-xs text-muted-foreground">Require attention</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Battery</CardTitle>
                    <Battery className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">
                      {devices.filter(d => d.batteryPercentage < 20).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Below 20%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tracking</CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {devices.filter(d => d.latitude && d.longitude).length}
                    </div>
                    <p className="text-xs text-muted-foreground">GPS enabled</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Alerts</CardTitle>
                  <CardDescription>Latest alerts and incidents from your devices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {devices
                      .filter(device => device.tamperStatus || device.jammingStatus || device.batteryPercentage < 20)
                      .slice(0, 3)
                      .map(device => (
                        <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-destructive rounded-full" />
                            <div>
                              <p className="font-medium">{device.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {device.tamperStatus && "Tamper detected"}
                                {device.jammingStatus && "Signal jamming"}
                                {device.batteryPercentage < 20 && `Low battery: ${device.batteryPercentage}%`}
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive">Alert</Badge>
                        </div>
                      ))}
                    {devices.filter(device => device.tamperStatus || device.jammingStatus || device.batteryPercentage < 20).length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No active alerts</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map Section with device dropdown */}
            <div className="flex-1 min-h-[400px] relative">
              <div className="absolute top-4 right-4 z-10 w-64">
                <select 
                  className="w-full p-2 rounded-md border border-input bg-background text-sm shadow-sm transition-colors focus:ring-1 focus:ring-ring"
                  value={selectedDevice?.id || ''}
                  onChange={(e) => {
                    const device = devices.find(d => d.id === e.target.value);
                    if (device) handleDeviceSelect(device);
                  }}
                >
                  <option value="" disabled>Select a device</option>
                  {devices.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.name} {device.status === 'online' ? '(Online)' : '(Offline)'}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedDevice ? (
                <Map
                  devices={[selectedDevice].filter(d => d.latitude && d.longitude)}
                  selectedDevice={selectedDevice}
                  onDeviceSelect={handleDeviceSelect}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p className="mb-2">No device selected</p>
                    <p className="text-sm">Please select a device from the dropdown or Devices panel to view its location on the map.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}