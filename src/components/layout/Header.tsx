import TopNav from './TopNav';
import { useDeviceAlerts } from '@/hooks/useDeviceAlerts';

interface HeaderProps {
  alertsCount?: number;
  onAlertsClick?: () => void;
}

export default function Header({ onAlertsClick: _onAlertsClick }: HeaderProps) {
  const { alerts } = useDeviceAlerts(10);
  return <TopNav alertCount={alerts.length} />;
}
