import React from 'react';
import { SystemProvider, useSystem } from './context/SystemContext';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import { ToastContainer } from './components/ToastContainer';
import { DashboardView } from './views/DashboardView';
import { LiveMonitoringView } from './views/LiveMonitoringView';
import { SimulationControlView } from './views/SimulationControlView';
import { PotholeMapView } from './views/PotholeMapView';
import { DetectionHistoryView } from './views/DetectionHistoryView';
import { AnalyticsView } from './views/AnalyticsView';
import { SystemStatusView } from './views/SystemStatusView';

const MainContent: React.FC = () => {
  const { activeTab } = useSystem();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'live' && <LiveMonitoringView />}
      {activeTab === 'simulation' && <SimulationControlView />}
      {activeTab === 'map' && <PotholeMapView />}
      {activeTab === 'history' && <DetectionHistoryView />}
      {activeTab === 'analytics' && <AnalyticsView />}
      {activeTab === 'status' && <SystemStatusView />}
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <SystemProvider>
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
        <Header />
        <TabNavigation />
        <div className="flex-1">
          <MainContent />
        </div>
        <ToastContainer />
      </div>
    </SystemProvider>
  );
};

export default App;
