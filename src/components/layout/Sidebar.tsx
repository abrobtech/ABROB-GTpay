interface SidebarProps {
  collapsed?: boolean;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  onToggleCollapse?: () => void;
}

export default function Sidebar(_props: SidebarProps) {
  return null;
}
