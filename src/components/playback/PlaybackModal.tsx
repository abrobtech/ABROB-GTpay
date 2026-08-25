import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Play, Pause } from 'lucide-react';
import { database, UID } from '@/config/firebase';
import { ref, onValue } from 'firebase/database';
import mapboxgl from 'mapbox-gl';

type Props = {
  open: boolean;
  onClose: () => void;
  deviceId: string;
  dateISO: string; // YYYY-MM-DD
};

export default function PlaybackModal({ open, onClose, deviceId, dateISO }: Props) {
  const [points, setPoints] = useState<Array<{lat:number, lon:number, ts:number}>>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [speed, setSpeed] = useState(1);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const markerRef = React.useRef<mapboxgl.Marker | null>(null);

  // load locations for that device (simple filter by date prefix)
  useEffect(() => {
    if (!deviceId || !dateISO) return;
    const locRef = ref(database, `history/${UID}/${deviceId}`);
    const unsub = onValue(locRef, (snap) => {
      const val = snap.val();
      const list: any[] = [];
      if (val) {
        Object.keys(val).forEach((k) => {
          const l = val[k];
          const tsStr = l.timestamp || l.ts || new Date().toISOString();
          if (!tsStr || !tsStr.startsWith) return;
          if (tsStr.startsWith(dateISO)) {
            list.push({ lat: l.lat ?? l.latitude, lon: l.lon ?? l.longitude, ts: new Date(tsStr).getTime() });
          }
        });
      }
      list.sort((a,b)=> new Date(a.ts).getTime() - new Date(b.ts).getTime());
      setPoints(list);
      setPos(0);
    });
    return () => unsub();
  }, [deviceId, dateISO]);

  useEffect(()=>{
  if (!open) return;
    // lightweight map init
    const container = document.getElementById('playback-map');
    if (!container) return;
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({ container, style: 'https://demotiles.maplibre.org/style.json', center: [0,0], zoom: 2 });
    } else {
      try { mapRef.current.resize(); } catch(e){}
    }
    return () => {
      try { mapRef.current?.remove(); mapRef.current = null; } catch(e){}
    }
  }, [open]);

  useEffect(()=>{
    if (!mapRef.current) return;
  if (points.length===0) return;
    // fit bounds
  const coords = points.map(p=>[p.lon,p.lat] as [number,number]);
  const first = coords[0] as [number, number];
  const bounds = new mapboxgl.LngLatBounds(first, first);
  coords.forEach((c) => bounds.extend(c));
  mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 15 });
    // marker
    if (!markerRef.current) {
      const el = document.createElement('div'); el.style.width='12px'; el.style.height='12px'; el.style.borderRadius='50%'; el.style.background='#0ea5e9';
      markerRef.current = new mapboxgl.Marker(el).setLngLat([coords[0][0], coords[0][1]]).addTo(mapRef.current);
    }
  }, [points]);

  // playback loop
  useEffect(()=>{
    if (!isPlaying) return;
    if (points.length===0) return;
    const id = setInterval(()=>{
      setPos(p=>{
        const nxt = Math.min(points.length-1, p+1);
        const pnt = points[nxt];
        if (pnt && markerRef.current) markerRef.current.setLngLat([pnt.lon, pnt.lat]);
        if (pnt && mapRef.current) mapRef.current.panTo([pnt.lon, pnt.lat]);
        if (nxt===points.length-1) setIsPlaying(false);
        return nxt;
      });
    }, Math.max(200, 1000 / speed));
    return ()=>clearInterval(id);
  }, [isPlaying, points, speed]);

  const timeRange = useMemo(()=>{
    if (points.length===0) return [0,0];
    const start = points[0].ts;
    const end = points[points.length-1].ts;
    return [start, end];
  }, [points]);

  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) onClose(); }}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Playback — {dateISO}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div id="playback-map" className="h-64 w-full bg-gray-100" />
          <div className="flex items-center space-x-2">
            <Button onClick={()=>setIsPlaying(p=>!p)}>{isPlaying ? <Pause /> : <Play />}</Button>
            <div className="flex-1">
              <Slider value={[pos]} min={0} max={Math.max(0, points.length-1)} onValueChange={(v)=>setPos(Math.floor(v[0]))} />
            </div>
            <select value={speed} onChange={(e)=>setSpeed(Number(e.target.value))} className="p-2 border rounded">
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
