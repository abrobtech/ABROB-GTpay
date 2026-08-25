import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  LayoutDashboard,
  MapPin,
  Smartphone,
  Brain,
  AlertTriangle,
  Shield,
  History,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  active?: boolean;
}

interface SidebarProps {
  collapsed?: boolean;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  collapsed = false,
  activeItem = 'dashboard',
  onItemClick,
  onToggleCollapse
}: SidebarProps) {
  const { profile } = useUserProfile();

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      active: activeItem === 'dashboard'
    },
    {
      id: 'devices',
      label: 'Devices',
      icon: <Smartphone className="w-5 h-5" />,
      badge: 5,
      active: activeItem === 'devices'
    },
    {
      id: 'patterns',
      label: 'AI Patterns',
      icon: <Brain className="w-5 h-5" />,
      badge: 3,
      active: activeItem === 'patterns'
    },
    {
      id: 'alerts',
      label: 'Alerts & Incidents',
      icon: <AlertTriangle className="w-5 h-5" />,
      badge: 12,
      active: activeItem === 'alerts'
    },
    {
      id: 'geofences',
      label: 'Geofences & Rules',
      icon: <Shield className="w-5 h-5" />,
      active: activeItem === 'geofences'
    },
    {
      id: 'history',
      label: 'History & Playback',
      icon: <History className="w-5 h-5" />,
      active: activeItem === 'history'
    }
  ];

  // Administration link: only for admins
  if (profile && profile.role === 'admin') {
    sidebarItems.push({
      id: 'admin',
      label: 'Administration',
      icon: <Users className="w-5 h-5" />,
      active: activeItem === 'admin'
    });
  }

  return (
    <aside
      className={cn(
        "bg-card border-r border-border h-full transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse Toggle */}
      <div className="p-4 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "transition-all duration-200",
            collapsed ? "w-8 h-8 p-0 mx-auto" : "w-full justify-start"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-1">
        {sidebarItems.map((item) => (
          <Button
            key={item.id}
            variant={item.active ? "default" : "ghost"}
            size="sm"
            onClick={() => onItemClick?.(item.id)}
            className={cn(
              "transition-all duration-200 justify-start",
              collapsed ? "w-12 h-12 p-0 mx-auto" : "w-full",
              item.active && "gradient-primary text-white shadow-glow"
            )}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant={item.active ? "secondary" : "default"}
                      className="text-xs h-5 min-w-[20px] px-1.5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </Button>
        ))}
      </nav>

      {/* Status indicator */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-muted-foreground">System Online</span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
            <MapPin className="w-3 h-3" />
            <span>5 devices connected</span>
          </div>
        </div>
      )}
    </aside>
  );
}