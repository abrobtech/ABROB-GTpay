import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MapPin, Plus, Edit, Trash2, Shield } from 'lucide-react';
import GeofenceModal from '@/components/geofences/GeofenceModal';
import { ref, update, remove } from 'firebase/database';
import { database, UID } from '@/config/firebase';

interface Geofence {
  id: string;
  name: string;
  owner_id: string;
  polygon: any;
  active: boolean;
  on_enter: string;
  on_exit: string;
  created_at: string;
  device_count: number;
}

export default function Geofences() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { devices, geofences: firebaseGeofences, loading: gpsLoading } = useFirebaseData();
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    on_enter: 'alert',
    on_exit: 'alert'
  });

  // Map Firebase geofences to UI format
  useEffect(() => {
    if (!gpsLoading && user) {
      if (firebaseGeofences.length > 0) {
        // Use real geofences from Firebase
        const mappedGeofences: Geofence[] = firebaseGeofences.map((fg) => ({
          id: fg.id,
          name: fg.name,
          owner_id: user.uid,
          polygon: {
            type: fg.type,
            coordinates: [[fg.lat + 0.001, fg.lon + 0.001], [fg.lat + 0.001, fg.lon - 0.001], [fg.lat - 0.001, fg.lon - 0.001], [fg.lat - 0.001, fg.lon + 0.001]],
            radius: fg.radius
          },
          active: fg.enabled,
          on_enter: 'alert',
          on_exit: 'notify',
          created_at: new Date().toISOString(),
          device_count: devices.filter(d => d.id === fg.device_id).length || 1
        }));
        setGeofences(mappedGeofences);
      } else {
        // Generate sample geofences if no Firebase data
        const generatedGeofences: Geofence[] = [
          {
            id: '1',
            name: 'Home Zone',
            owner_id: user.uid,
            polygon: { type: 'polygon', coordinates: [[0, 0]] },
            active: true,
            on_enter: 'notify',
            on_exit: 'alert',
            created_at: new Date().toISOString(),
            device_count: devices.filter(d => d.status === 'online').length
          }
        ];
        
        // Add device-specific geofences if devices exist
        if (devices.length > 0) {
          devices.forEach((device, index) => {
            if (index < 2) {
              generatedGeofences.push({
                id: `device_zone_${device.id}`,
                name: `${device.name} Safe Zone`,
                owner_id: user.uid,
                polygon: { type: 'polygon', coordinates: [[device.latitude || 0, device.longitude || 0]] },
                active: device.status === 'online',
                on_enter: 'log',
                on_exit: 'alert',
                created_at: new Date(Date.now() - (index * 172800000)).toISOString(),
                device_count: 1
              });
            }
          });
        }
        
        setGeofences(generatedGeofences);
      }
      setLoading(false);
    }
  }, [devices, firebaseGeofences, gpsLoading, user]);

  const handleToggleActive = async (geofenceId: string) => {
    const geo = geofences.find(g => g.id === geofenceId);
    if (!geo) return;
    try {
      await update(ref(database, `geofences/${UID}/${geofenceId}`), {
        active: !geo.active,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to toggle geofence active state", e);
    }
  };

  const handleDeleteGeofence = async (geofenceId: string) => {
    try {
      await remove(ref(database, `geofences/${UID}/${geofenceId}`));
    } catch (e) {
      console.error("Failed to delete geofence", e);
    }
  };

  const handleCreateGeofence = () => {
    const newGeo: Geofence = {
      id: Date.now().toString(),
      name: newGeofence.name,
      owner_id: user?.uid || '',
      polygon: { type: 'polygon', coordinates: [[0, 0]] },
      active: true,
      on_enter: newGeofence.on_enter,
      on_exit: newGeofence.on_exit,
      created_at: new Date().toISOString(),
      device_count: 0
    };
    
    setGeofences(prev => [newGeo, ...prev]);
    setNewGeofence({ name: '', on_enter: 'alert', on_exit: 'alert' });
    setShowCreateForm(false);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'alert': return 'text-red-600';
      case 'notify': return 'text-yellow-600';
      case 'log': return 'text-primary';
      default: return 'text-gray-600';
    }
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
          activeItem="geofences"
          onItemClick={(itemId) => navigate(`/${itemId === 'dashboard' ? '' : itemId}`)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Geofences & Rules</h1>
                  <p className="text-muted-foreground">Create virtual boundaries and automated responses</p>
                </div>
              </div>
              
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Geofence
              </Button>
            </div>

            <GeofenceModal open={showCreateForm} onClose={() => setShowCreateForm(false)} devices={devices} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {geofences.map((geofence) => (
                <Card key={geofence.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${geofence.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <MapPin className={`w-5 h-5 ${geofence.active ? 'text-green-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{geofence.name}</h3>
                        <Badge variant={geofence.active ? 'default' : 'secondary'}>
                          {geofence.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    
                    <Switch
                      checked={geofence.active}
                      onCheckedChange={() => handleToggleActive(geofence.id)}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Devices</span>
                      <span className="font-medium">{geofence.device_count}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">On Enter</span>
                      <span className={`font-medium capitalize ${getActionColor(geofence.on_enter)}`}>
                        {geofence.on_enter}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">On Exit</span>
                      <span className={`font-medium capitalize ${getActionColor(geofence.on_exit)}`}>
                        {geofence.on_exit}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(geofence.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteGeofence(geofence.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {geofences.length === 0 && (
              <Card className="p-12 text-center">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Geofences Created</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first geofence to set up virtual boundaries and automated responses.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Geofence
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}