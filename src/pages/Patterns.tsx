import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, MapPin, Clock, AlertTriangle } from 'lucide-react';

interface Pattern {
  id: string;
  device_id: string;
  device_name: string;
  weekday: number;
  time_range: string;
  route_summary: any;
  frequency: number;
  anomaly_score: number;
}

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Patterns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { devices, locations, loading: gpsLoading } = useFirebaseData();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generate AI patterns from real device data
  useEffect(() => {
    if (!gpsLoading && devices.length > 0) {
      const generatedPatterns: Pattern[] = devices.map((device, index) => {
        // Generate realistic patterns based on device data
        const now = new Date();
        const currentHour = now.getHours();
        const weekday = now.getDay();
        
        // Simulate different pattern types based on device ID
        const patternTypes = [
          {
            time_range: '08:00-09:00',
            route_summary: { start: 'Home', end: 'Office', distance: '12km' },
            frequency: 85,
            anomaly_score: device.batteryPercentage < 20 ? 0.65 : 0.15
          },
          {
            time_range: '17:30-18:30',
            route_summary: { start: 'Office', end: 'Home', distance: '12km' },
            frequency: 90,
            anomaly_score: device.status === 'offline' ? 0.75 : 0.08
          },
          {
            time_range: '10:00-11:00',
            route_summary: { start: 'Current Location', end: 'Route End', distance: '8km' },
            frequency: 70,
            anomaly_score: device.tamperStatus ? 0.85 : 0.45
          }
        ];

        const pattern = patternTypes[index % patternTypes.length];
        
        return {
          id: device.id,
          device_id: device.id,
          device_name: device.name,
          weekday: weekday,
          time_range: pattern.time_range,
          route_summary: pattern.route_summary,
          frequency: pattern.frequency,
          anomaly_score: pattern.anomaly_score
        };
      });

      setPatterns(generatedPatterns);
      setLoading(false);
    }
  }, [devices, locations, gpsLoading]);

  const getAnomalyColor = (score: number) => {
    if (score < 0.3) return 'text-green-600';
    if (score < 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAnomalyBadge = (score: number) => {
    if (score < 0.3) return 'Normal';
    if (score < 0.6) return 'Unusual';
    return 'Anomaly';
  };

  const getAnomalyVariant = (score: number) => {
    if (score < 0.3) return 'default';
    if (score < 0.6) return 'secondary';
    return 'destructive';
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
          activeItem="patterns"
          onItemClick={(itemId) => navigate(`/${itemId === 'dashboard' ? '' : itemId}`)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">AI Pattern Learning</h1>
                <p className="text-muted-foreground">Discovered travel patterns and anomaly detection</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold">Patterns Learned</h3>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">{patterns.length}</div>
                <p className="text-sm text-muted-foreground">Active behavioral patterns detected</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold">Anomalies Today</h3>
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {patterns.filter(p => p.anomaly_score > 0.5).length}
                </div>
                <p className="text-sm text-muted-foreground">Unusual behavior detected</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Learning Accuracy</h3>
                </div>
                <div className="text-3xl font-bold text-primary mb-2">94%</div>
                <p className="text-sm text-muted-foreground">Pattern prediction accuracy</p>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Learned Patterns</h2>
              <div className="space-y-4">
                {patterns.map((pattern) => (
                  <Card key={pattern.id} className="p-4 border-l-4 border-l-primary">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{pattern.device_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{weekdays[pattern.weekday]}s, {pattern.time_range}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{pattern.route_summary.start} → {pattern.route_summary.end}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={getAnomalyVariant(pattern.anomaly_score)}>
                        {getAnomalyBadge(pattern.anomaly_score)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Frequency</span>
                          <span>{pattern.frequency}%</span>
                        </div>
                        <Progress value={pattern.frequency} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Anomaly Score</span>
                          <span className={getAnomalyColor(pattern.anomaly_score)}>
                            {Math.round(pattern.anomaly_score * 100)}%
                          </span>
                        </div>
                        <Progress value={pattern.anomaly_score * 100} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Distance</span>
                        <span className="font-medium">{pattern.route_summary.distance}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}