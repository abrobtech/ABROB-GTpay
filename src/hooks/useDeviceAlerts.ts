import { useState, useEffect } from 'react';

// Mock data for alerts since we don't have direct Firebase access
export interface DeviceAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  type: 'geofence' | 'tamper' | 'battery' | 'route' | 'other';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  read: boolean;
}

// Mock alerts data
const mockAlerts: DeviceAlert[] = [
  {
    id: '1',
    deviceId: 'GT-001',
    deviceName: 'Truck 1',
    type: 'geofence',
    severity: 'critical',
    message: 'Geofence breach detected for Truck 1',
    timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    read: false
  },
  {
    id: '2',
    deviceId: 'GT-002',
    deviceName: 'Truck 2',
    type: 'tamper',
    severity: 'critical',
    message: 'Tamper detected on Truck 2',
    timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    read: false
  },
  {
    id: '3',
    deviceId: 'GT-003',
    deviceName: 'Truck 3',
    type: 'battery',
    severity: 'warning',
    message: 'Low battery (15%) on Truck 3',
    timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    read: false
  },
  {
    id: '4',
    deviceId: 'GT-004',
    deviceName: 'Truck 4',
    type: 'route',
    severity: 'info',
    message: 'Route pattern alert for Truck 4',
    timestamp: new Date(Date.now() - 60 * 60000), // 1 hour ago
    read: false
  }
];

export function useDeviceAlerts(limitCount = 10) {
  const [alerts, setAlerts] = useState<DeviceAlert[]>(mockAlerts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to mark an alert as read
  const markAsRead = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  // Function to mark all alerts as read
  const markAllAsRead = () => {
    setAlerts(alerts.map(alert => ({ ...alert, read: true })));
  };

  return { alerts, loading, error, markAsRead, markAllAsRead };
}

// Helper function to format timestamp to relative time
export function formatAlertTime(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return timestamp.toLocaleDateString();
}