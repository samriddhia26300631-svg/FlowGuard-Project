import React from 'react';
import { FlowGuardProvider, useFlowGuard } from './context/FlowGuardContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { OverviewView } from './views/OverviewView';
import { ProjectsView } from './views/ProjectsView';
import { ClientsView } from './views/ClientsView';
import { ScopeControlView } from './views/ScopeControlView';
import { TeamWorkloadView } from './views/TeamWorkloadView';
import { CommitmentsView } from './views/CommitmentsView';
import { DependenciesView } from './views/DependenciesView';
import { ActionCenterView } from './views/ActionCenterView';
import { HandoverView } from './views/HandoverView';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { NewClientModal } from './components/modals/NewClientModal';
import { ProjectDetailModal } from './components/modals/ProjectDetailModal';
import { NewChangeRequestModal } from './components/modals/NewChangeRequestModal';

const AppContent: React.FC = () => {
  const { activePage, persistence, localSaveError, workflowError } = useFlowGuard();

  const renderActiveView = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewView />;
      case 'projects':
        return <ProjectsView />;
      case 'clients':
        return <ClientsView />;
      case 'scope-control':
        return <ScopeControlView />;
      case 'team-workload':
        return <TeamWorkloadView />;
      case 'commitments':
        return <CommitmentsView />;
      case 'dependencies':
        return <DependenciesView />;
      case 'action-center':
        return <ActionCenterView />;
      case 'handover':
        return <HandoverView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F0E8] text-[#171717] font-['Inter',sans-serif]">
      {/* Fixed Deep Navy Sidebar */}
      <Sidebar />

      {/* Main Workspace Canvas */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <TopHeader />
        <div className="px-6 py-2 bg-white border-b text-sm" role="status" aria-live="polite">
          <span>{persistence.status}</span>
          {workflowError && <p role="alert" className="text-red-700">{workflowError}</p>}
          {!persistence.connected && <button className="ml-4 underline" disabled={persistence.busy || !persistence.cloudConfigured} onClick={persistence.connect}>Connect cloud / migrate local data</button>}
          <button className="ml-4 underline" onClick={persistence.exportBackup}>Export backup</button>
          {persistence.connected && persistence.error && <button className="ml-4 underline" onClick={persistence.retry}>Retry save</button>}
          {!persistence.connected && <label className="ml-4 underline cursor-pointer">Restore backup
            <input aria-label="Restore workspace backup" className="hidden" type="file" accept="application/json,.json" disabled={persistence.busy} onChange={e => { const file = e.target.files?.[0]; if (file) void persistence.importBackup(file); e.target.value = ''; }} />
          </label>}
          {!persistence.connected && persistence.cloudConfigured && <p className="text-gray-500">Connect loads your saved cloud workspace, or uploads this workspace if none exists. A browser backup is retained first.</p>}
          {!persistence.cloudConfigured && <span className="ml-4 text-gray-500">Cloud not configured</span>}
          {(persistence.error || localSaveError) && <p role="alert" className="text-red-700">{persistence.error} {localSaveError}</p>}
        </div>
        {persistence.busy && <div className="fixed inset-0 z-[100] bg-white/90 flex items-center justify-center" role="alert">Connecting to Supabase. Your local workspace is backed up…</div>}

        {/* Viewport Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Central Dialog Modals */}
      <NewProjectModal />
      <NewClientModal />
      <ProjectDetailModal />
      <NewChangeRequestModal />
    </div>
  );
};

export default function App() {
  return (
    <FlowGuardProvider>
      <AppContent />
    </FlowGuardProvider>
  );
}
