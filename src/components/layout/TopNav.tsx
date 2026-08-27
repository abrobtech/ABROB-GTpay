import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Radio, Settings, X } from 'lucide-react';
import { useAuth } from '@/hooks/useFirebaseAuth';
import ThemeToggle from './ThemeToggle';

const links = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Devices', path: '/devices' },
  { label: 'AI Patterns', path: '/patterns' },
  { label: 'Alerts', path: '/alerts' },
  { label: 'Geofences', path: '/geofences' },
  { label: 'History', path: '/history' },
];

export default function TopNav({ alertCount = 0 }: { alertCount?: number }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const displayName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Operator';

  const signOut = async () => { await logout(); navigate('/'); };

  return <header className="topnav-wrap"><div className="topnav"><Link to={user ? '/dashboard' : '/'} className="flex shrink-0 items-center gap-2.5"><span className="brand-mark overflow-hidden"><img src="/GTpay_logo.png" alt="ABROB-GTpay logo" className="h-full w-full object-contain" /></span><span><span className="block text-[13px] font-bold tracking-[0.2em] text-white">ABROB</span><span className="block text-[9px] font-medium tracking-[0.25em] text-cyan-300">COMMAND</span></span></Link><nav className="topnav-links">{links.map((link) => <Link key={link.path} to={link.path} className={`topnav-link ${location.pathname === link.path || (link.path === '/dashboard' && location.pathname === '/') ? 'topnav-link-active' : ''}`}>{link.label}{link.label === 'Alerts' && alertCount > 0 && <span className="topnav-alert-count">{alertCount}</span>}</Link>)}</nav><div className="ml-auto flex items-center gap-2"><div className="network-status"><span className="live-dot" /> <span className="hidden sm:inline">System online</span></div><ThemeToggle /><button className="relative rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-300 transition hover:border-cyan-300/30 hover:bg-white/10" aria-label="Open alerts" onClick={() => navigate('/alerts')}><Bell className="h-[17px] w-[17px]" />{alertCount > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />}</button>{user && <div className="relative hidden md:block"><button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 pr-2.5 transition hover:bg-white/[0.08]" onClick={() => setOpen(!open)}><span className="avatar-ring">{displayName.slice(0, 2).toUpperCase()}</span><span className="max-w-[90px] truncate text-xs font-medium text-white">{displayName}</span><ChevronDown className="h-3.5 w-3.5 text-slate-500" /></button>{open && <div className="topnav-menu"><button onClick={() => navigate('/profile')}><Settings className="h-3.5 w-3.5" />Profile</button><button onClick={() => void signOut()}><LogOut className="h-3.5 w-3.5" />Sign out</button></div>}</div>}<button className="topnav-mobile-button rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-300 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div></div>{open && <div className="topnav-mobile-panel lg:hidden">{user && <div className="mb-2 flex items-center gap-3 border-b border-white/[0.07] px-3 pb-4"><span className="avatar-ring">{displayName.slice(0, 2).toUpperCase()}</span><div><p className="text-sm font-medium text-white">{displayName}</p><p className="text-[11px] text-slate-500">Command operator</p></div></div>}{links.map((link) => <Link key={link.path} to={link.path} onClick={() => setOpen(false)} className={`topnav-mobile-link ${location.pathname === link.path ? 'topnav-link-active' : ''}`}><Radio className="h-4 w-4" />{link.label}</Link>)}<button className="topnav-mobile-link" onClick={() => void signOut()}><LogOut className="h-4 w-4" />Sign out</button></div>}</header>;
}
