import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useDeviceAlerts, formatAlertTime } from '@/hooks/useDeviceAlerts';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Bell, 
  Settings, 
  LogOut, 
  User,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Battery,
  Route,
  Zap
} from 'lucide-react';

interface HeaderProps {
  onAlertsClick?: () => void;
}

export default function Header({ onAlertsClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { alerts, loading, markAsRead, markAllAsRead } = useDeviceAlerts(10);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ABROB-GT</h1>
              <p className="text-xs text-muted-foreground">AI-powered GPS tracking</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {alerts.length > 99 ? '99+' : alerts.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Badge variant="secondary" className="text-xs">
                  {alerts.length} new
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading alerts...
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No new alerts
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <DropdownMenuItem 
                      key={alert.id} 
                      className="flex items-start space-x-3 p-3"
                      onClick={() => markAsRead(alert.id)}
                    >
                      <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-100' : 
                        alert.severity === 'warning' ? 'bg-amber-100' : 'bg-accent'
                      }`}>
                        {alert.type === 'tamper' && (
                          <Zap className="w-4 h-4 text-destructive" />
                        )}
                        {alert.type === 'geofence' && (
                          <MapPin className="w-4 h-4 text-destructive" />
                        )}
                        {alert.type === 'battery' && (
                          <Battery className="w-4 h-4 text-amber-500" />
                        )}
                        {alert.type === 'route' && (
                          <Route className="w-4 h-4 text-secondary" />
                        )}
                        {alert.type === 'other' && (
                          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {alert.message}
                          </p>
                          <Badge variant={
                            alert.severity === 'critical' ? 'destructive' : 
                            alert.severity === 'warning' ? 'default' : 'secondary'
                          } className="text-[10px] h-4 px-1">
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.deviceName} • {formatAlertTime(alert.timestamp)}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  markAllAsRead();
                  if (onAlertsClick) onAlertsClick();
                }} 
                className="text-center justify-center"
              >
                View all alerts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">User Preferences</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted p-2 rounded-md">
                        <p className="font-medium">Account Type</p>
                        <p className="text-muted-foreground">{user?.email?.includes('admin') ? 'Administrator' : 'Standard User'}</p>
                      </div>
                      <div className="bg-muted p-2 rounded-md">
                        <p className="font-medium">Last Login</p>
                        <p className="text-muted-foreground">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">App Settings</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Dark Mode</span>
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        Toggle
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Notifications</span>
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        {alerts.length > 0 ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback className="gradient-primary text-white font-semibold">
                    {user?.email ? getInitials(user.email) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}