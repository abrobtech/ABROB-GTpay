import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ref, push, set } from 'firebase/database';
import { database, UID } from '@/config/firebase';
import { MAPTILER_KEY } from '@/config/map';
import { useAuth } from '@/hooks/useFirebaseAuth';


type Props = {
  open: boolean;
  onClose: () => void;
  devices: any[];
};

// Helper: generate circle coordinates around center (lat, lon) with radius meters
function createCircleCoords(center: [number, number], radiusMeters: number, points = 64) {
  const [lat1, lon1] = center.map(c => c * Math.PI / 180);
  const coords: [number, number][] = [];
  const R = 6378137; // Earth radius in meters
  const d = radiusMeters;
  for (let i = 0; i < points; i++) {
    const brng = (i * 360 / points) * Math.PI / 180;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) + Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
    const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1), Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2));
    coords.push([lon2 * 180 / Math.PI, lat2 * 180 / Math.PI]);
  }
  // close polygon
  coords.push(coords[0]);
  return coords;
}

export default function GeofenceModal({ open, onClose, devices }: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitializing, setMapInitializing] = useState(false);
  const [shape, setShape] = useState<'circle' | 'polygon'>('circle');
  const [name, setName] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(devices?.[0]?.id || null);
  const [onEnter, setOnEnter] = useState('alert');
  const [onExit, setOnExit] = useState('alert');
  const [circleCenter, setCircleCenter] = useState<[number, number] | null>(null); // [lat, lon]
  const [circleRadius, setCircleRadius] = useState<number>(500); // meters
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const { user } = useAuth();
  // runtime token input removed; prefer env vars or src/config/map.ts for dev

  // Mapbox token only set when provided (via VITE_MAPBOX_TOKEN). We don't prompt at runtime.
  if (import.meta.env.VITE_MAPBOX_TOKEN) {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
  }

  useEffect(() => {
    if (!open) return;
    if (mapRef.current) {
      // modal reopened — ensure map repaints and resizes to avoid blink while modal animates
      setMapLoaded(true);
      try {
        mapRef.current.resize();
        requestAnimationFrame(() => { if (mapRef.current && mapRef.current.resize) mapRef.current.resize(); });
      } catch (e) {}
      return;
    }

    if (!mapContainer.current) return;
    // Choose style URL: prefer Mapbox, then MapTiler (if key present), otherwise a public MapLibre demo style
    const styleUrl = import.meta.env.VITE_MAPBOX_TOKEN
      ? 'mapbox://styles/mapbox/streets-v11'
      : (import.meta.env.VITE_MAPTILER_KEY
        ? 'https://api.maptiler.com/maps/streets/style.json?key=' + import.meta.env.VITE_MAPTILER_KEY
        : (MAPTILER_KEY ? 'https://api.maptiler.com/maps/streets/style.json?key=' + MAPTILER_KEY : 'https://demotiles.maplibre.org/style.json'));

    // compute initial center: prefer first device with valid coords (not 0,0)
    const firstDevice = devices.find((d: any) => d.latitude != null && d.longitude != null && !(Number(d.latitude) === 0 && Number(d.longitude) === 0));
    const initialCenter: [number, number] = firstDevice ? [firstDevice.longitude, firstDevice.latitude] : [0, 20];

    // wait until the container is visible (has layout) before creating the map to avoid blink
    setMapInitializing(true);
    let waited = 0;
    const pollInterval = 50;
    const maxWait = 1000; // ms
    const waitForVisible = (resolve: any) => {
      const el = mapContainer.current as HTMLDivElement | null;
      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) return resolve(true);
      if (waited >= maxWait) return resolve(false);
      waited += pollInterval;
      setTimeout(() => waitForVisible(resolve), pollInterval);
    };
    let createTimer: any = null;
    const startWhenReady = () => {
      createTimer = setTimeout(() => {
        mapRef.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: styleUrl,
          center: initialCenter,
          zoom: firstDevice ? 12 : 2
        });

        mapRef.current.on('load', () => {
          // initialize draw control
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: { polygon: true, trash: true },
          defaultMode: 'simple_select'
        });
        mapRef.current.addControl(draw);

        // add empty source/layers for non-draw shapes (circle/polygon preview if used)
        if (!mapRef.current.getSource('draw-shape')) {
          mapRef.current.addSource('draw-shape', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        }
        try { if (!mapRef.current.getLayer('preview-fill')) mapRef.current.addLayer({ id: 'preview-fill', type: 'fill', source: 'draw-shape', paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.2 } }); } catch(e) {}
        try { if (!mapRef.current.getLayer('preview-line')) mapRef.current.addLayer({ id: 'preview-line', type: 'line', source: 'draw-shape', paint: { 'line-color': '#2563eb', 'line-width': 2 } }); } catch(e) {}

        // add device markers and manage them on the map
        (mapRef.current as any)._deviceMarkers = (mapRef.current as any)._deviceMarkers || [];
        (mapRef.current as any)._deviceMarkers.forEach((m: any) => m.remove && m.remove());
        (mapRef.current as any)._deviceMarkers = [];
        devices.forEach((d: any) => {
          if (d.latitude != null && d.longitude != null && !(Number(d.latitude) === 0 && Number(d.longitude) === 0)) {
            const el = document.createElement('div');
            el.style.width = '10px'; el.style.height = '10px'; el.style.borderRadius = '50%'; el.style.background = '#0ea5e9'; el.title = d.name || '';
            const marker = new mapboxgl.Marker(el).setLngLat([d.longitude, d.latitude]).setPopup(new mapboxgl.Popup({ offset: 10 }).setText(d.name)).addTo(mapRef.current);
            (mapRef.current as any)._deviceMarkers.push(marker);
          }
        });

        // ensure the map sizes correctly inside the modal
        setTimeout(() => mapRef.current && mapRef.current.resize && mapRef.current.resize(), 100);

        // store draw control for later use
        (mapRef.current as any)._draw = draw;

  // re-add sources/layers & markers whenever the style changes (style change removes custom layers)
        const onStyleData = () => {
          try { if (!mapRef.current.getSource('draw-shape')) mapRef.current.addSource('draw-shape', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }); } catch(e) {}
          try { if (!mapRef.current.getLayer('preview-fill')) mapRef.current.addLayer({ id: 'preview-fill', type: 'fill', source: 'draw-shape', paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.2 } }); } catch(e) {}
          try { if (!mapRef.current.getLayer('preview-line')) mapRef.current.addLayer({ id: 'preview-line', type: 'line', source: 'draw-shape', paint: { 'line-color': '#2563eb', 'line-width': 2 } }); } catch(e) {}
          try {
            (mapRef.current as any)._deviceMarkers = (mapRef.current as any)._deviceMarkers || [];
            (mapRef.current as any)._deviceMarkers.forEach((m: any) => m.remove && m.remove());
            (mapRef.current as any)._deviceMarkers = [];
            devices.forEach((d: any) => {
              if (d.latitude != null && d.longitude != null && !(Number(d.latitude) === 0 && Number(d.longitude) === 0)) {
                const el = document.createElement('div'); el.style.width = '10px'; el.style.height = '10px'; el.style.borderRadius = '50%'; el.style.background = '#0ea5e9'; el.title = d.name || '';
                const marker = new mapboxgl.Marker(el).setLngLat([d.longitude, d.latitude]).setPopup(new mapboxgl.Popup({ offset: 10 }).setText(d.name)).addTo(mapRef.current);
                (mapRef.current as any)._deviceMarkers.push(marker);
              }
            });
          } catch(e) {}
        };

        // once map is fully idle, hide the initializing overlay
        const onIdle = () => {
          setMapLoaded(true);
          setMapInitializing(false);
          try { mapRef.current.off('idle', onIdle); } catch (e) {}
        };
        mapRef.current.on('idle', onIdle);
        mapRef.current.on('styledata', onStyleData);
      });
      }, 60);
    };
    new Promise(waitForVisible).then((ok) => { if (ok) startWhenReady(); else startWhenReady(); });

    return () => {
      try { clearTimeout(createTimer); } catch (e) {}
      if (mapRef.current) {
        try { mapRef.current.off && mapRef.current.off('styledata'); } catch (e) {}
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const map = mapRef.current;
    // click handler for drawing
      const onMapClick = (e: any) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      if (shape === 'circle') {
        setCircleCenter([lat, lng]);
        // update source
        const coords = createCircleCoords([lat, lng], circleRadius);
        const geo = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } }] };
        let src: any = null;
        try { src = map.getSource('draw-shape'); } catch (err) { src = null; }
        if (!src) {
          map.addSource('draw-shape', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          src = map.getSource('draw-shape');
        }
        src.setData(geo);
        map.flyTo({ center: [lng, lat], zoom: 14 });
      } else {
  // polygon: add point (use explicit tuple typing to satisfy TS)
  const pt: [number, number] = [lng, lat];
  const pts: [number, number][] = [...polygonPoints, pt];
  setPolygonPoints(pts);
        const poly = pts.length >= 2 ? [ [...pts, pts[0]] ] : [];
        const geo = { type: 'FeatureCollection', features: poly.length ? [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: poly } }] : [] };
        let src: any = null;
        try { src = map.getSource('draw-shape'); } catch (err) { src = null; }
        if (!src) {
          map.addSource('draw-shape', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          src = map.getSource('draw-shape');
        }
        src.setData(geo);
      }
    };

    map.on('click', onMapClick);
    return () => map.off('click', onMapClick);
  }, [mapLoaded, shape, polygonPoints, circleRadius]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    if (shape !== 'circle' || !circleCenter) return;
    const map = mapRef.current;
    const coords = createCircleCoords([circleCenter[0], circleCenter[1]], circleRadius);
    const geo = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } }] };
    let src: any = null;
    try { src = map.getSource('draw-shape'); } catch (err) { src = null; }
    if (!src) {
      map.addSource('draw-shape', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      src = map.getSource('draw-shape');
    }
    src.setData(geo);
  }, [circleRadius, circleCenter, mapLoaded, shape]);

  const handleClear = () => {
    setPolygonPoints([]);
    setCircleCenter(null);
    if (mapRef.current) {
      try {
        const s = mapRef.current.getSource('draw-shape');
        if (s) s.setData({ type: 'FeatureCollection', features: [] });
      } catch (err) {
        try { mapRef.current.addSource('draw-shape', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }); } catch (e) {}
      }
    }
  };

  // ensure map resizes when modal opens / when map object is ready (fixes invisible tiles inside modal)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (mapRef.current && mapRef.current.resize) mapRef.current.resize();
    }, 150);
    return () => clearTimeout(t);
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    // assemble geofence data
    const now = new Date().toISOString();
    let lat = 0;
    let lon = 0;

    if (shape === 'circle' && circleCenter) {
      lat = circleCenter[0];
      lon = circleCenter[1];
    } else if (shape === 'polygon' && polygonPoints.length > 0) {
      // average the points to get a center lat/lon
      const sum = polygonPoints.reduce((acc, p) => [acc[0] + p[1], acc[1] + p[0]], [0, 0]);
      lat = sum[0] / polygonPoints.length;
      lon = sum[1] / polygonPoints.length;
    }

    const data = {
      name: name.trim(),
      latitude: lat,
      longitude: lon,
      radius: shape === 'circle' ? circleRadius : 500,
      active: true,
      createdAt: now,
      updatedAt: now
    };

    try {
      const pushRef = push(ref(database, `geofences/${UID}`));
      await set(pushRef, data);
      // success
      onClose();
    } catch (err) {
      console.error('Failed to save geofence', err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose()} />
      <div className="relative w-full max-w-5xl p-4">
        <Card>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Geofence Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Device</Label>
                <select className="w-full p-2 border rounded-md" value={selectedDevice ?? ''} onChange={(e) => setSelectedDevice(e.target.value)}>
                  <option value="">Select device</option>
                  {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Shape</Label>
                <select className="w-full p-2 border rounded-md" value={shape} onChange={(e) => setShape(e.target.value as any)}>
                  <option value="circle">Circle</option>
                  <option value="polygon">Polygon</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <div className="h-48 border rounded-md overflow-hidden" ref={mapContainer} />
              {mapInitializing && !mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <div className="text-sm">Loading map…</div>
                </div>
              )}
            </div>

            {shape === 'circle' && (
              <div className="flex items-center space-x-4">
                <div>
                  <Label>Radius (meters)</Label>
                  <Input type="number" value={circleRadius} onChange={(e:any) => setCircleRadius(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Center</Label>
                  <div className="text-sm">{circleCenter ? `${circleCenter[0].toFixed(5)}, ${circleCenter[1].toFixed(5)}` : 'Click on map to set center'}</div>
                </div>
              </div>
            )}

            {shape === 'polygon' && (
              <div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => handleClear()}>Clear</Button>
                  <div className="text-sm text-muted-foreground">Click on the map to add polygon points. Need at least 3 points.</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>On Enter Action</Label>
                <select className="w-full p-2 border rounded-md" value={onEnter} onChange={(e) => setOnEnter(e.target.value)}>
                  <option value="alert">Send Alert</option>
                  <option value="notify">Send Notification</option>
                  <option value="log">Log Event</option>
                </select>
              </div>
              <div>
                <Label>On Exit Action</Label>
                <select className="w-full p-2 border rounded-md" value={onExit} onChange={(e) => setOnExit(e.target.value)}>
                  <option value="alert">Send Alert</option>
                  <option value="notify">Send Notification</option>
                  <option value="log">Log Event</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onClose()}>Cancel</Button>
              <Button onClick={() => handleSave()} disabled={!name || !selectedDevice}>Save Geofence</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
