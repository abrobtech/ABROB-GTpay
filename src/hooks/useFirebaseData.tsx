import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database, UID, DEVICE_ID, PATHS } from '@/config/firebase';
import { useAuth } from './useFirebaseAuth';

// ── Types matching real ESP32 RTDB structure ───────────────────────────────────

export interface DeviceData {
  deviceId: string;
  deviceName: string;
  ownerEmail: string;
  location: string;
  batteryLevel: number;
  batteryVoltage: number;
  bootCount: number;
  gpsFix: boolean;
  gpsState: 'active' | 'sleep' | 'off';
  sosTriggered: boolean;
  lowBattery: boolean;
  mode: 'active' | 'config' | 'sleep';
  wakeupReason: 0 | 1 | 2 | 5;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number;
  altitude: number;
  heading: number;
  satellites: number;
  hdop: number;
  fixQuality: 0 | 1 | 2 | 3;
}

export type Device = {
  id: string;           // Firebase key
  name: string;         // deviceName
  imei: string;         // deviceId
  owner_id?: string;
  ownerEmail?: string;
  latitude?: number | null;
  longitude?: number | null;
  speed?: number;
  status?: string;      // derived
  mode?: string;
  gpsFix?: boolean;
  satellites?: number;
  location?: string;
  lowBattery?: boolean;
  sosTriggered?: boolean;
  wakeupReason?: number | null;
  timestamp?: string | null;
  lastSeen?: string;

  // legacy fields kept so existing pages don't break
  batteryLevel?: number | null;
  batteryPercentage?: number;
  batteryVoltage?: number | null;
  bootCount?: number | null;
  created_at?: string | null;
  deviceMode?: number | null;
  tamperStatus?: boolean;
  tamperDetected?: boolean;
  jammingStatus?: boolean;
  sleepDuration?: number | null;

  // new fields mapped from DeviceData
  gpsState?: 'active' | 'sleep' | 'off';
  altitude?: number;
  heading?: number;
  hdop?: number;
  fixQuality?: 0 | 1 | 2 | 3;
};

export type Location = {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number | null;
  heading?: number;
  altitude?: number;
  satellites?: number;
  hdop?: number;
  batteryLevel?: number;
};

export interface Geofence {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy fields kept for UI map/listing compat:
  lat?: number;
  lon?: number;
  enabled?: boolean;
  type?: string;
  device_id?: string;
}

export interface Alert {
  id?: string;
  type: 'sos' | 'geofence' | 'low_battery' | 'tamper';
  message: string;
  latitude: number;
  longitude: number;
  deviceId: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useFirebaseData() {
  const { user } = useAuth();
  const [devices, setDevices]     = useState<Device[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts]       = useState<Alert[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setDevices([]);
      setLocations([]);
      setGeofences([]);
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let devicesLoading = true;
    let geofencesLoading = true;
    let historyLoading = true;
    let alertsLoading = true;

    const checkLoadingFinished = () => {
      if (!devicesLoading && !geofencesLoading && !historyLoading && !alertsLoading) {
        setLoading(false);
      }
    };

    // 1. Subscribe to Device
    const deviceRef = ref(database, PATHS.device);
    const unsubscribeDevice = onValue(
      deviceRef,
      (snapshot) => {
        const d = snapshot.val();
        if (d) {
          const isOnline = d.mode === 'active' || d.gpsFix === true;
          const status = d.mode === 'active' ? 'online' : d.mode || (isOnline ? 'online' : 'offline');

          const deviceItem: Device = {
            id:             DEVICE_ID,
            name:           d.deviceName || DEVICE_ID,
            imei:           d.deviceId || DEVICE_ID,
            ownerEmail:     d.ownerEmail || '',
            owner_id:       user.uid,
            latitude:       d.latitude ?? null,
            longitude:      d.longitude ?? null,
            speed:          d.speed ?? 0,
            gpsFix:         d.gpsFix ?? false,
            satellites:     d.satellites ?? 0,
            location:       d.location ?? '',
            status,
            mode:           d.mode ?? '',
            lastSeen:       d.timestamp || new Date().toISOString(),
            timestamp:      d.timestamp ?? null,
            lowBattery:        d.lowBattery ?? false,
            batteryLevel:      d.batteryLevel ?? 80,
            batteryPercentage: d.batteryLevel ?? 80,
            batteryVoltage:    d.batteryVoltage ?? null,
            sosTriggered:  d.sosTriggered ?? false,
            tamperStatus:  d.sosTriggered ?? false,
            tamperDetected:d.sosTriggered ?? false,
            jammingStatus: false,
            wakeupReason:  d.wakeupReason ?? null,
            bootCount:     d.bootCount ?? null,
            gpsState:      d.gpsState ?? 'off',
            altitude:      d.altitude ?? null,
            heading:       d.heading ?? null,
            hdop:          d.hdop ?? null,
            fixQuality:    d.fixQuality ?? null,
          };
          setDevices([deviceItem]);
        } else {
          setDevices([]);
        }
        devicesLoading = false;
        checkLoadingFinished();
      },
      (err) => {
        console.error('Error fetching device:', err);
        setError(err as Error);
        devicesLoading = false;
        checkLoadingFinished();
      }
    );

    // 2. Subscribe to Geofences
    const geofencesRef = ref(database, PATHS.geofences);
    const unsubscribeGeofences = onValue(
      geofencesRef,
      (snapshot) => {
        const data = snapshot.val();
        const list: Geofence[] = [];
        if (data) {
          Object.keys(data).forEach((gId) => {
            const g = data[gId];
            list.push({
              id:        gId,
              name:      g.name || 'Unnamed',
              latitude:  g.latitude ?? g.lat ?? 0,
              longitude: g.longitude ?? g.lon ?? 0,
              radius:    g.radius || 100,
              active:    g.active ?? g.enabled ?? false,
              createdAt: g.createdAt || g.created_at || new Date().toISOString(),
              updatedAt: g.updatedAt || g.updated_at || new Date().toISOString(),
              lat:       g.latitude ?? g.lat ?? 0,
              lon:       g.longitude ?? g.lon ?? 0,
              enabled:   g.active ?? g.enabled ?? false,
              type:      g.type || 'circle',
              device_id: DEVICE_ID
            });
          });
        }
        setGeofences(list);
        geofencesLoading = false;
        checkLoadingFinished();
      },
      (err) => {
        console.error('Error fetching geofences:', err);
        geofencesLoading = false;
        checkLoadingFinished();
      }
    );

    // 3. Subscribe to History
    const historyRef = ref(database, PATHS.history);
    const unsubscribeHistory = onValue(
      historyRef,
      (snapshot) => {
        const data = snapshot.val();
        const list: Location[] = [];
        if (data) {
          Object.keys(data).forEach((hId) => {
            const h = data[hId];
            list.push({
              id: hId,
              device_id: h.deviceId || DEVICE_ID,
              latitude: h.latitude,
              longitude: h.longitude,
              timestamp: h.timestamp,
              speed: h.speed ?? 0,
              heading: h.heading ?? 0,
              altitude: h.altitude ?? 0,
              satellites: h.satellites ?? 0,
              hdop: h.hdop ?? 0,
              batteryLevel: h.batteryLevel ?? 100
            });
          });
        }
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setLocations(list);
        historyLoading = false;
        checkLoadingFinished();
      },
      (err) => {
        console.error('Error fetching history:', err);
        historyLoading = false;
        checkLoadingFinished();
      }
    );

    // 4. Subscribe to Alerts
    const alertsRef = ref(database, PATHS.alerts);
    const unsubscribeAlerts = onValue(
      alertsRef,
      (snapshot) => {
        const data = snapshot.val();
        const list: Alert[] = [];
        if (data) {
          Object.keys(data).forEach((aId) => {
            const a = data[aId];
            list.push({
              id: aId,
              type: a.type,
              message: a.message,
              latitude: a.latitude,
              longitude: a.longitude,
              deviceId: a.deviceId || DEVICE_ID,
              timestamp: a.timestamp,
              acknowledged: a.acknowledged ?? false,
              acknowledgedAt: a.acknowledgedAt ?? null
            });
          });
        }
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAlerts(list);
        alertsLoading = false;
        checkLoadingFinished();
      },
      (err) => {
        console.error('Error fetching alerts:', err);
        alertsLoading = false;
        checkLoadingFinished();
      }
    );

    return () => {
      off(deviceRef);
      off(geofencesRef);
      off(historyRef);
      off(alertsRef);
      unsubscribeDevice();
      unsubscribeGeofences();
      unsubscribeHistory();
      unsubscribeAlerts();
    };
  }, [user]);

  const refetch = async () => Promise.resolve();

  return { devices, locations, geofences, alerts, loading, error, refetch };
}

