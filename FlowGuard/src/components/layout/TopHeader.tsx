import React from 'react';
import { Search, Plus, UserPlus } from 'lucide-react';
import { useFlowGuard } from '../../context/FlowGuardContext';
import { PageId } from '../../types';

const PAGE_META: Record<PageId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Overview',
    subtitle: "A clear view of your agency's work",
  },
  projects: {
    title: 'Projects',
    subtitle: 'Manage client deliverables, active blockers, and progress',
  },
  clients: {
    title: 'Clients',
    subtitle: 'Client directory, contractual engagements, and health status',
  },
  'scope-control': {
    title: 'Scope Control',
    subtitle: 'Review change requests and protect project margins from creep',
  },
  'team-workload': {
    title: 'Team Workload',
    subtitle: 'Monitor team capacity, assignment balance, and commitments',
  },
  commitments: {
    title: 'Commitments',
    subtitle: 'Track contractual milestones and signed client deliverables',
  },
  dependencies: {
    title: 'Dependencies',
    subtitle: 'Identify blocking chains and unblock critical path workflows',
  },
  'action-center': {
    title: 'Action Center',
    subtitle: 'Prioritized operational issues requiring immediate resolution',
  },
  handover: {
    title: 'Handover',
    subtitle: 'Delivery readiness quality gates to prevent incomplete rollouts',
  },
};

export const TopHeader: React.FC = () => {
  const {
    activePage,
    searchQuery,
    setSearchQuery,
    setIsNewProjectModalOpen,
    setIsNewClientModalOpen,
  } = useFlowGuard();

  const currentMeta = PAGE_META[activePage] || PAGE_META.overview;

  return (
    <header className="h-20 shrink-0 border-b border-[#E8E4DD] bg-[#FAF8F4] px-8 flex items-center justify-between gap-6">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl font-bold text-[#171717] tracking-tight">
          {currentMeta.title}
        </h1>
        <p className="text-xs text-[#737373] mt-0.5">
          {currentMeta.subtitle}
        </p>
      </div>

      {/* Actions & Search */}
      <div className="flex items-center gap-3">
        {/* Compact Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, tasks, clients..."
            className="w-64 pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E8E4DD] rounded-lg text-[#171717] placeholder-[#737373] focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D] transition-all"
          />
        </div>

        {/* Action Buttons */}
        {activePage === 'clients' && (
          <button
            onClick={() => setIsNewClientModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#E8E4DD] text-[#171717] hover:bg-[#FAF8F4] rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Client</span>
          </button>
        )}

        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg transition-colors shadow-xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>
    </header>
  );
};
