import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ref, set, push } from 'firebase/database';
import { database } from '@/config/firebase';
import { useAuth } from '@/hooks/useFirebaseAuth';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (device: any) => void;
};

export default function DeviceProvisionModal({ open, onClose, onCreated }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [imei, setImei] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [deviceType, setDeviceType] = useState("vehicle");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});

  useEffect(() => {
    if (!open) {
      // Reset form when closed
      setImei("");
      setDeviceName("");
      setOwnerEmail("");
      setDeviceType("vehicle");
      setErrors({});
      setSubmitting(false);
    }
  }, [open]);

  const validate = () => {
    const e: Record<string,string> = {};
    if (!imei.trim()) e.imei = "IMEI is required";
    // basic IMEI format check: typically 15 digits (allow 14-16 for flexibility)
    if (imei.trim() && !/^\d{14,16}$/.test(imei.trim())) e.imei = "IMEI should be 14-16 digits";
    if (!deviceName.trim()) e.deviceName = "Device name is required";
    // basic email validation (optional)
    if (ownerEmail && !/^\S+@\S+\.\S+$/.test(ownerEmail)) e.ownerEmail = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      // Write directly to Firebase Realtime Database (prototype-friendly)
      const now = new Date().toISOString();

      const deviceData: any = {
        imei: imei.trim() || null,
        name: deviceName.trim(),
        owner_id: user?.uid || null,
        owner_email: ownerEmail.trim() || null,
        type: deviceType,
        latitude: null,
        longitude: null,
        batteryPercentage: 100,
        speed: 0,
        status: 'offline',
        tamperStatus: false,
        jammingStatus: false,
        lastSeen: now,
        created_at: now,
      };

      // Optimistic UI: create a provisional id and notify parent immediately
      let provisionalId = imei.trim() || `provisional-${Date.now()}`;
      onCreated?.({ id: provisionalId, ...deviceData });

      let deviceId: string | null = null;
      if (imei.trim()) {
        deviceId = imei.trim();
        await set(ref(database, `devices/${deviceId}`), deviceData);
      } else {
        const pushRef = push(ref(database, 'devices'));
        deviceId = pushRef.key;
        await set(pushRef, deviceData);
      }

      // If provisionalId was used, parent will already have shown it; we could update it
      // but for a prototype we'll rely on the DB update and the existing listener to reconcile.
      toast({ title: 'Device provisioned', description: 'Device was successfully added.' });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: err?.message || "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose()} />
      <div className="relative w-full max-w-2xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Add New Device</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="imei">IMEI</Label>
                <Input id="imei" value={imei} onChange={(e) => setImei(e.target.value)} />
                {errors.imei && <div className="text-sm text-red-600 mt-1">{errors.imei}</div>}
              </div>

              <div>
                <Label htmlFor="deviceName">Device Name</Label>
                <Input id="deviceName" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
                {errors.deviceName && <div className="text-sm text-red-600 mt-1">{errors.deviceName}</div>}
              </div>

              <div>
                <Label htmlFor="ownerEmail">Owner Email (optional)</Label>
                <Input id="ownerEmail" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
                {errors.ownerEmail && <div className="text-sm text-red-600 mt-1">{errors.ownerEmail}</div>}
              </div>

              <div>
                <Label htmlFor="deviceType">Device Type</Label>
                <select
                  id="deviceType"
                  className="w-full p-2 border rounded-md"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                >
                  <option value="vehicle">Vehicle Tracker</option>
                  <option value="personal">Personal Tracker</option>
                  <option value="asset">Asset Tracker</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Provisioning..." : "Provision Device"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
