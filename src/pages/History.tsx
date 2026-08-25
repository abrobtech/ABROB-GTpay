import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Download, Calendar as CalendarIcon, History as HistoryIcon } from 'lucide-react';
import { format } from 'date-fns';
import PlaybackModal from '@/components/playback/PlaybackModal';
import mapboxgl from 'mapbox-gl';
import { database, UID } from '@/config/firebase';
import { ref as dbRef, onValue, off } from 'firebase/database';
import { MAPTILER_KEY } from '@/config/map';

interface Trip {
  id: string;
  device_id: string;
  device_name: string;
  start_time: string;
  end_time: string;
  duration: number;
  distance: number;
  start_location: string;
  end_location: string;
  max_speed: number;
  avg_speed: number;
}

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { devices, locations, loading: gpsLoading } = useFirebaseData();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const routePointsRef = useRef<Array<{lat:number,lon:number,ts:number}>>([]);
  const routeMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]); // YYYY-MM-DD
  const [playbackOpen, setPlaybackOpen] = useState(false);
  const [playbackDate, setPlaybackDate] = useState<string>('');

  // Generate trip history from real GPS data
  useEffect(() => {
    // Build trips from real locations (group by device and date)
    if (gpsLoading) return;

    // locations: Location[] from useFirebaseData with device_id, latitude, longitude, timestamp
    if (!locations || locations.length === 0) {
      setTrips([]);
      setLoading(false);
      return;
    }

    // helper: haversine distance in km
    const toRad = (v: number) => v * Math.PI / 180;
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // group locations by device_id and date (YYYY-MM-DD)
    const groups = new Map<string, Array<{lat:number, lon:number, ts:number, speed?:number}>>();
    locations.forEach((l: any) => {
      if (!l.device_id || l.latitude == null || l.longitude == null || !l.timestamp) return;
      const dateKey = new Date(l.timestamp).toISOString().slice(0,10);
      const key = `${l.device_id}::${dateKey}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ lat: Number(l.latitude), lon: Number(l.longitude), ts: new Date(l.timestamp).getTime(), speed: l.speed ?? l.speedKmH ?? undefined });
    });

    const built: Trip[] = [];
    groups.forEach((pts, key) => {
      if (!pts || pts.length === 0) return;
      pts.sort((a,b) => a.ts - b.ts);
      const [deviceId] = key.split('::');
      const device = devices.find(d => d.id === deviceId);
      const start = pts[0].ts;
      const end = pts[pts.length-1].ts;
      const durationMinutes = Math.max(0, Math.round((end - start) / 60000));

      // compute distance by summing segments
      let distanceKm = 0;
      let maxSpeed = 0;
      pts.forEach((p, i) => {
        if (p.speed && p.speed > maxSpeed) maxSpeed = p.speed;
        if (i === 0) return;
        const prev = pts[i-1];
        distanceKm += haversine(prev.lat, prev.lon, p.lat, p.lon);
      });

      const avgSpeed = durationMinutes > 0 ? Math.round((distanceKm / (durationMinutes / 60)) * 10) / 10 : 0;

      built.push({
        id: `${deviceId}-${new Date(pts[0].ts).toISOString().slice(0,10)}`,
        device_id: deviceId,
        device_name: device?.name || deviceId,
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
        duration: durationMinutes,
        distance: Math.round(distanceKm * 10) / 10,
        start_location: `Location (${pts[0].lat.toFixed(4)}, ${pts[0].lon.toFixed(4)})`,
        end_location: `Location (${pts[pts.length-1].lat.toFixed(4)}, ${pts[pts.length-1].lon.toFixed(4)})`,
        max_speed: Math.round(maxSpeed),
        avg_speed: Math.round(avgSpeed),
      });
    });

    // sort trips by start time descending
    built.sort((a,b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    setTrips(built);
    setLoading(false);
  }, [devices, locations, gpsLoading]);

  // derive available dates from locations for selected device
  useEffect(()=>{
    if (!locations || locations.length===0) { setAvailableDates([]); return; }
    const dates = new Set<string>();
    locations.forEach(l=>{
      const d = new Date(l.timestamp).toISOString().slice(0,10);
      dates.add(d);
    });
    const sorted = Array.from(dates).sort((a,b)=>b.localeCompare(a));
    setAvailableDates(sorted);
  }, [locations]);

  // Initialize playback map and build route points when selectedTrip changes
  useEffect(() => {
    if (!selectedTrip) return;
    // reset playback state for new trip
    setCurrentTime(0);
    setIsPlaying(false);

    // set up a RTDB listener for locations for this device
    const locRef = dbRef(database, `history/${UID}/${selectedTrip.device_id}`);
    const unsub = onValue(locRef, (snap) => {
      const val = snap.val();
      const list: any[] = [];
      const startTs = new Date(selectedTrip.start_time).getTime();
      const endTs = new Date(selectedTrip.end_time).getTime();

      if (val) {
        if (Array.isArray(val)) {
          val.forEach((l:any) => {
            const ts = l.timestamp || l.ts || new Date().toISOString();
            if (!ts) return;
            if (!ts.startsWith) return;
            const tms = new Date(ts).getTime();
            if (tms >= startTs && tms <= endTs) {
              list.push({ lat: l.lat ?? l.latitude, lon: l.lon ?? l.longitude, ts: tms });
            }
          });
        } else {
          Object.keys(val).forEach((k) => {
            const l = val[k];
            const ts = l.timestamp || l.ts || new Date().toISOString();
            const tms = new Date(ts).getTime();
            if (tms >= startTs && tms <= endTs) {
              list.push({ lat: l.lat ?? l.latitude, lon: l.lon ?? l.longitude, ts: tms });
            }
          });
        }
      }

      list.sort((a,b) => a.ts - b.ts);
      routePointsRef.current = list;

      // initialize map per latest points
      // clean up existing map
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch(e) { /* ignore */ }
        mapRef.current = null;
      }

      const pts = list;
      const map = new mapboxgl.Map({
        container: 'history-playback-map',
        style: MAPTILER_KEY ? `https://api.maptiler.com/maps/basic/style.json?key=${MAPTILER_KEY}` : 'https://demotiles.maplibre.org/style.json',
        center: pts.length ? [pts[0].lon, pts[0].lat] : [0,0],
        zoom: pts.length ? 12 : 1
      });
      mapRef.current = map;

      map.on('load', () => {
        if (pts.length) {
          const coords = pts.map(p => [p.lon, p.lat]);
          if (map.getLayer && map.getLayer('route-line')) {
            try { map.removeLayer('route-line'); } catch(e){}
          }
          if (map.getSource && map.getSource('route')) {
            try { map.removeSource('route'); } catch(e){}
          }

          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: coords }
            }
          });

          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            paint: { 'line-color': '#3b82f6', 'line-width': 4 }
          });

          if (routeMarkerRef.current) {
            routeMarkerRef.current.remove();
            routeMarkerRef.current = null;
          }

          const el = document.createElement('div');
          el.className = 'rounded-full bg-primary';
          el.style.width = '16px';
          el.style.height = '16px';
          el.style.boxShadow = '0 0 6px rgba(0,0,0,0.3)';

          const marker = new mapboxgl.Marker({ element: el }).setLngLat([pts[0].lon, pts[0].lat]).addTo(map);
          routeMarkerRef.current = marker;

          const first = coords[0] as [number, number];
          const bounds = new mapboxgl.LngLatBounds(first, first);
          coords.forEach((c:any) => bounds.extend(c as [number, number]));
          map.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 500 });
        }
      });
    });

    return () => {
      try { off(locRef); } catch(e) {}
      try { unsub(); } catch(e) {}
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch(e) {}
        mapRef.current = null;
      }
      if (routeMarkerRef.current) {
        try { routeMarkerRef.current.remove(); } catch(e) {}
        routeMarkerRef.current = null;
      }
    };

    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch(e) {}
        mapRef.current = null;
      }
      if (routeMarkerRef.current) {
        try { routeMarkerRef.current.remove(); } catch(e) {}
        routeMarkerRef.current = null;
      }
    };
  }, [selectedTrip, locations, MAPTILER_KEY]);

  // Playback timer: advance currentTime while playing
  useEffect(() => {
    if (!isPlaying || !selectedTrip) return;
    const tickMs = 1000 / Math.max(0.1, playbackSpeed);
    const interval = setInterval(() => {
      setCurrentTime((t) => {
        const max = selectedTrip.duration * 60;
        if (t >= max) {
          setIsPlaying(false);
          return max;
        }
        return Math.min(max, t + 1);
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, selectedTrip]);

  // Update marker position when currentTime changes
  useEffect(() => {
    if (!selectedTrip || !routeMarkerRef.current || routePointsRef.current.length === 0) return;
    const pts = routePointsRef.current;
    const startTs = pts[0].ts;
    const targetTs = startTs + currentTime * 1000;

    // find nearest point index
    let idx = pts.findIndex(p => p.ts >= targetTs);
    if (idx === -1) idx = pts.length - 1;
    if (idx <= 0) idx = 0;

    const p = pts[idx];
    if (p) {
      try { routeMarkerRef.current.setLngLat([p.lon, p.lat]); } catch(e) {}
    }
  }, [currentTime, selectedTrip]);

  // Create device options for dropdown
  const deviceOptions = [
    { id: 'all', name: 'All Devices' },
    ...devices.map(device => ({ id: device.id, name: device.name }))
  ];

  const filteredTrips = trips.filter(trip => 
    selectedDevice === 'all' || trip.device_id === selectedDevice
  );

  const handlePlaybackToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleExport = (format: string) => {
    // Export functionality would be implemented here
    console.log(`Exporting in ${format} format`);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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
          activeItem="history"
          onItemClick={(itemId) => navigate(`/${itemId === 'dashboard' ? '' : itemId}`)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="flex-1 flex">
          {/* Trip History Sidebar */}
          <div className="w-80 border-r bg-background p-4 overflow-auto">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <HistoryIcon className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Trip History</h2>
              </div>

              <div className="space-y-3">
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceOptions.map(device => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div>
                  <Label className="block text-sm mb-1">Available Dates</Label>
                  <select className="w-full p-2 border rounded-md" value={playbackDate} onChange={(e)=>{ setPlaybackDate(e.target.value); if(e.target.value) setPlaybackOpen(true); }}>

            <PlaybackModal open={playbackOpen} onClose={()=>setPlaybackOpen(false)} deviceId={selectedDevice === 'all' ? devices[0]?.id ?? '' : selectedDevice} dateISO={playbackDate} />
                    <option value="">Select date</option>
                    {availableDates.map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString()}</option>)}
                  </select>
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                {filteredTrips.map((trip) => (
                  <Card 
                    key={trip.id} 
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedTrip?.id === trip.id ? 'ring-2 ring-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedTrip(trip)}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{trip.device_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(trip.duration)}
                        </span>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">From:</span>
                          <span className="truncate ml-2">{trip.start_location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">To:</span>
                          <span className="truncate ml-2">{trip.end_location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Distance:</span>
                          <span>{trip.distance} km</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {new Date(trip.start_time).toLocaleTimeString()} - {new Date(trip.end_time).toLocaleTimeString()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {selectedTrip ? (
              <>
                {/* Map Area */}
                <div className="flex-1 relative bg-muted">
                  <div className="absolute inset-0">
                    <div id="history-playback-map" className="w-full h-full" />
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="border-t bg-background p-4">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {/* Timeline Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{new Date(selectedTrip.start_time).toLocaleTimeString()}</span>
                        <span>{new Date(selectedTrip.end_time).toLocaleTimeString()}</span>
                      </div>
                      <Slider
                        value={[currentTime]}
                        onValueChange={(value) => setCurrentTime(value[0])}
                        max={selectedTrip.duration * 60}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center space-x-4">
                      <Button variant="outline" size="sm">
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handlePlaybackToggle}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <SkipForward className="w-4 h-4" />
                      </Button>

                      <Select value={playbackSpeed.toString()} onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">0.5x</SelectItem>
                          <SelectItem value="1">1x</SelectItem>
                          <SelectItem value="2">2x</SelectItem>
                          <SelectItem value="4">4x</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                      </Button>
                      
                      <Button variant="outline" size="sm" onClick={() => handleExport('kml')}>
                        <Download className="w-4 h-4 mr-2" />
                        KML
                      </Button>
                    </div>

                    {/* Trip Stats */}
                    <div className="grid grid-cols-4 gap-4 text-center text-sm">
                      <div>
                        <div className="font-semibold">{selectedTrip.distance} km</div>
                        <div className="text-muted-foreground">Distance</div>
                      </div>
                      <div>
                        <div className="font-semibold">{formatDuration(selectedTrip.duration)}</div>
                        <div className="text-muted-foreground">Duration</div>
                      </div>
                      <div>
                        <div className="font-semibold">{selectedTrip.avg_speed} km/h</div>
                        <div className="text-muted-foreground">Avg Speed</div>
                      </div>
                      <div>
                        <div className="font-semibold">{selectedTrip.max_speed} km/h</div>
                        <div className="text-muted-foreground">Max Speed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <HistoryIcon className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Select a Trip</h3>
                    <p className="text-muted-foreground">
                      Choose a trip from the sidebar to view route playback and details
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}