import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Sliders,
  MapPin,
  History,
  BarChart3,
  Cpu,
} from 'lucide-react';
import { useSystem, NavigationTab } from '../context/SystemContext';

interface TabItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export const TabNavigation: React.FC = () => {
  const { activeTab, setActiveTab, potholeEvents } = useSystem();

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring', icon: Radio },
    { id: 'simulation', label: 'Simulation Controls', icon: Sliders },
    { id: 'map', label: 'Pothole Map', icon: MapPin },
    {
      id: 'history',
      label: 'Detection History',
      icon: History,
      badge: potholeEvents.length,
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'status', label: 'System Status', icon: Cpu },
  ];

  return (
    <nav className="bg-[#0b0f19] border-b border-slate-800/80 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-200'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
