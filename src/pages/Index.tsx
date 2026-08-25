import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  Bell,
  ChevronDown,
  Command,
  Cpu,
  Gauge,
  Layers3,
  MapPin,
  Menu,
  MoreHorizontal,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

const trendData = [
  { day: 'Mon', online: 38, alerts: 8 },
  { day: 'Tue', online: 46, alerts: 6 },
  { day: 'Wed', online: 43, alerts: 11 },
  { day: 'Thu', online: 58, alerts: 5 },
  { day: 'Fri', online: 54, alerts: 9 },
  { day: 'Sat', online: 68, alerts: 4 },
  { day: 'Sun', online: 76, alerts: 3 },
];

const activity = [
  { icon: Radio, title: 'Tracker GT-204 synced', detail: 'North sector · 2 min ago', tone: 'cyan' },
  { icon: ShieldCheck, title: 'Perimeter secured', detail: 'Lagos HQ · 8 min ago', tone: 'violet' },
  { icon: Bell, title: 'Battery threshold reached', detail: 'Vehicle 18 · 16 min ago', tone: 'amber' },
];

function MetricCard({ label, value, change, icon: Icon, tone }: { label: string; value: string; change: string; icon: typeof Activity; tone: 'cyan' | 'violet' | 'green' | 'amber' }) {
  return (
    <div className="glass-card group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <div className={`metric-glow metric-${tone}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-emerald-300"><ArrowUpRight className="h-3.5 w-3.5" />{change}</p>
        </div>
        <div className={`metric-icon metric-icon-${tone}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

export default function Index() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [range, setRange] = useState('7 days');
  const chartTotal = useMemo(() => trendData.reduce((sum, item) => sum + item.online, 0), []);

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-slate-100">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="dashboard-shell relative mx-auto flex min-h-screen max-w-[1600px]">
        <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-white/[0.08] bg-[#080c1d]/95 p-5 backdrop-blur-2xl transition-transform duration-300 lg:relative lg:translate-x-0 lg:bg-[#080c1d]/65`}>
          <div className="flex items-center justify-between px-2">
            <Link to="/" className="flex items-center gap-3">
              <span className="brand-mark"><Sparkles className="h-5 w-5" /></span>
              <span><span className="block text-sm font-bold tracking-[0.22em] text-white">ABROB</span><span className="block text-[10px] font-medium tracking-[0.28em] text-cyan-300">COMMAND</span></span>
            </Link>
            <button className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
          </div>

          <div className="mt-10 flex flex-1 flex-col">
            <p className="sidebar-label">Workspace</p>
            <nav className="mt-3 space-y-1">
              <Link to="/" className="nav-item nav-item-active"><Layers3 className="h-[18px] w-[18px]" />Overview<span className="nav-pulse" /></Link>
              <Link to="/devices" className="nav-item"><Cpu className="h-[18px] w-[18px]" />Devices<span className="nav-count">24</span></Link>
              <Link to="/patterns" className="nav-item"><Activity className="h-[18px] w-[18px]" />Patterns</Link>
              <Link to="/alerts" className="nav-item"><Bell className="h-[18px] w-[18px]" />Alerts<span className="nav-count nav-count-alert">3</span></Link>
              <Link to="/geofences" className="nav-item"><MapPin className="h-[18px] w-[18px]" />Geofences</Link>
            </nav>
            <p className="sidebar-label mt-9">System</p>
            <nav className="mt-3 space-y-1">
              <Link to="/history" className="nav-item"><Gauge className="h-[18px] w-[18px]" />Analytics</Link>
              <Link to="/settings" className="nav-item"><Zap className="h-[18px] w-[18px]" />Automations</Link>
            </nav>
            <div className="mt-auto rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 p-4">
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold text-cyan-100"><span className="live-dot" />Live network</span><span className="text-[10px] text-slate-400">v2.4.0</span></div>
              <p className="mt-3 text-xs leading-5 text-slate-400">All systems are operating within optimal parameters.</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[86%] rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" /></div>
              <p className="mt-2 text-[10px] text-slate-500">86% network health</p>
            </div>
          </div>
        </aside>

        {mobileOpen && <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

        <main className="min-w-0 flex-1 px-4 pb-8 sm:px-7 lg:px-10">
          <header className="flex h-[82px] items-center justify-between border-b border-white/[0.07]">
            <div className="flex items-center gap-3"><button className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-300 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Mission control</p><h1 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">Good morning, Abdullahi <span className="hidden sm:inline">— here's your network pulse.</span></h1></div></div>
            <div className="flex items-center gap-2 sm:gap-4"><button className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-400 sm:flex"><Search className="h-4 w-4" />Search <kbd className="ml-4 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">⌘ K</kbd></button><button className="relative rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-300 hover:bg-white/10" aria-label="Notifications"><Bell className="h-[18px] w-[18px]" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" /></button><button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 pr-3"><span className="avatar-ring">AA</span><span className="hidden text-xs font-medium text-white sm:block">Admin</span><ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 sm:block" /></button></div>
          </header>

          <section className="relative mt-8 overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-[#111b3b]/90 via-[#10132d]/90 to-[#1d1238]/80 p-6 shadow-2xl shadow-cyan-950/30 sm:p-8">
            <div className="hero-grid" /><div className="relative z-10 max-w-xl"><div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200"><span className="live-dot" />Intelligence layer active</div><h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-4xl">Your fleet is moving<br /><span className="gradient-text">with precision.</span></h2><p className="mt-4 max-w-md text-sm leading-6 text-slate-400">Real-time visibility across every device, route, and perimeter — orchestrated from one intelligent command center.</p><div className="mt-6 flex flex-wrap gap-3"><Link to="/dashboard" className="glow-button"><Command className="h-4 w-4" />Enter dashboard</Link><button className="ghost-button"><Wifi className="h-4 w-4" />View live map</button></div></div><div className="hero-orb"><div className="orb-ring orb-ring-one" /><div className="orb-ring orb-ring-two" /><div className="orb-core"><Radio className="h-8 w-8 text-cyan-200" /></div><span className="orb-label orb-label-top">24 online</span><span className="orb-label orb-label-right">99.2% uptime</span><span className="orb-label orb-label-bottom">3 zones active</span></div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Active devices" value="24 / 28" change="+12.8% this week" icon={Cpu} tone="cyan" /><MetricCard label="Network uptime" value="99.2%" change="+0.4% this week" icon={Wifi} tone="green" /><MetricCard label="Active geofences" value="08" change="+2 new zones" icon={MapPin} tone="violet" /><MetricCard label="Open alerts" value="03" change="-28.4% this week" icon={Bell} tone="amber" /></section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
            <div className="glass-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="section-kicker">Network activity</span><span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">+18.6%</span></div><h3 className="mt-2 text-lg font-semibold text-white">Device pulse</h3><p className="mt-1 text-xs text-slate-500">Average active devices · {chartTotal} signals this week</p></div><button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300">{range}<ChevronDown className="h-3.5 w-3.5" /></button></div><div className="mt-6 h-[230px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{ top: 10, right: 4, left: -24, bottom: 0 }}><defs><linearGradient id="onlineGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.32} /><stop offset="100%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(148,163,184,0.09)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} /><Tooltip contentStyle={{ background: '#0b1025', border: '1px solid rgba(103,232,249,.2)', borderRadius: 12, color: '#fff', fontSize: 12 }} /><Area type="monotone" dataKey="online" stroke="#67e8f9" strokeWidth={2.5} fill="url(#onlineGradient)" dot={false} activeDot={{ r: 5, strokeWidth: 3, stroke: '#0b1025', fill: '#67e8f9' }} /></AreaChart></ResponsiveContainer></div><div className="mt-3 flex items-center gap-5 text-[11px] text-slate-500"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300" />Online devices</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-400" />Signal integrity</span></div></div>
            <div className="glass-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><span className="section-kicker">Coverage</span><h3 className="mt-2 text-lg font-semibold text-white">Zone performance</h3></div><button className="rounded-lg p-2 text-slate-500 hover:bg-white/10 hover:text-white" aria-label="More options"><MoreHorizontal className="h-5 w-5" /></button></div><div className="mt-5 h-[185px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={trendData} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}><CartesianGrid vertical={false} stroke="rgba(148,163,184,0.07)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={8} /><Tooltip cursor={{ fill: 'rgba(103,232,249,.05)' }} contentStyle={{ background: '#0b1025', border: '1px solid rgba(167,139,250,.2)', borderRadius: 12, color: '#fff', fontSize: 12 }} /><Bar dataKey="alerts" fill="#a78bfa" radius={[4, 4, 0, 0]} barSize={13} /></BarChart></ResponsiveContainer></div><div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4"><div><p className="text-2xl font-semibold text-white">92.8%</p><p className="mt-1 text-[11px] text-slate-500">Average zone coverage</p></div><div className="rounded-xl bg-violet-400/10 px-3 py-2 text-right"><p className="text-xs font-semibold text-violet-300">Optimal</p><p className="mt-1 text-[10px] text-slate-500">All zones stable</p></div></div></div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]"><div className="glass-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><span className="section-kicker">Live feed</span><h3 className="mt-2 text-lg font-semibold text-white">Latest activity</h3></div><button className="text-xs font-medium text-cyan-300 hover:text-cyan-200">View all <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button></div><div className="mt-5 space-y-4">{activity.map(({ icon: Icon, title, detail, tone }) => <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"><div className={`activity-icon activity-${tone}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-200">{title}</p><p className="mt-1 text-[11px] text-slate-500">{detail}</p></div><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" /></div>)}</div></div><div className="glass-card flex items-center gap-5 p-5 sm:p-6"><div className="radar-visual"><div className="radar-sweep" /><div className="radar-point radar-point-a" /><div className="radar-point radar-point-b" /><div className="radar-point radar-point-c" /></div><div><span className="section-kicker">Signal intelligence</span><h3 className="mt-2 text-lg font-semibold text-white">Everything in sync.</h3><p className="mt-2 text-xs leading-5 text-slate-500">Your devices are reporting healthy telemetry across all monitored sectors.</p><div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-300"><span className="live-dot" />Realtime monitoring active</div></div></div></section>
        </main>
      </div>
    </div>
  );
}
