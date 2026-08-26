import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'abrob-theme';

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const light = saved === 'light';
    setIsLight(light);
    document.documentElement.classList.toggle('light', light);
  }, []);

  const toggleTheme = () => {
    const nextLight = !isLight;
    setIsLight(nextLight);
    document.documentElement.classList.toggle('light', nextLight);
    window.localStorage.setItem(STORAGE_KEY, nextLight ? 'light' : 'dark');
  };

  return <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'} title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}><span className={`theme-toggle-thumb ${isLight ? 'theme-toggle-thumb-light' : ''}`}>{isLight ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}</span><span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:inline">{isLight ? 'Light' : 'Dark'}</span></button>;
}
