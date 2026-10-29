import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Scale,
  Users2,
  CalendarCheck,
  GitFork,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { useFlowGuard } from '../../context/FlowGuardContext';
import { PageId } from '../../types';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    actionCenterCount,
    pendingApprovalsCount,
    resetToDemoData,
  } = useFlowGuard();

  const navGroups: NavGroup[] = [
    {
      label: 'WORKSPACE',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'clients', label: 'Clients', icon: Building2 },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        {
          id: 'scope-control',
          label: 'Scope Control',
          icon: Scale,
          badgeCount: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        },
        { id: 'team-workload', label: 'Team Workload', icon: Users2 },
        { id: 'commitments', label: 'Commitments', icon: CalendarCheck },
      ],
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { id: 'dependencies', label: 'Dependencies', icon: GitFork },
        {
          id: 'action-center',
          label: 'Action Center',
          icon: AlertCircle,
          badgeCount: actionCenterCount > 0 ? actionCenterCount : undefined,
        },
      ],
    },
    {
      label: 'DELIVERY',
      items: [
        { id: 'handover', label: 'Handover', icon: CheckCircle2 },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#14213D] flex flex-col justify-between select-none border-r border-[#0B132B]">
      {/* Brand Wordmark */}
      <div>
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-white font-bold text-lg tracking-tight font-['Manrope'] leading-none">
              FlowGuard
            </div>
            <div className="text-[10px] uppercase tracking-wider text-white/50 font-medium mt-1">
              Agency Operations
            </div>
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav className="p-4 space-y-6 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                {group.label}
              </div>
              <div className="space-y-0.5 mt-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-white/15 text-white shadow-xs'
                          : 'text-white/70 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-white' : 'text-white/60'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {typeof item.badgeCount === 'number' && (
                        <span
                          className={`text-[11px] font-semibold px-1.5 py-0.2 rounded font-mono tabular-nums ${
                            isActive
                              ? 'bg-white text-[#14213D]'
                              : 'bg-white/20 text-white'
                          }`}
                        >
                          {item.badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / Account / Reset Demo */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="px-3 py-2.5 rounded-lg bg-[#0B132B]/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Apex Studio HQ</div>
            <div className="text-[11px] text-white/50">Pro Agency Tier</div>
          </div>
          <button
            onClick={() => { if (window.confirm('Reset this workspace to sample data? If cloud is connected, the reset will also be saved online. Export a backup first.')) resetToDemoData(); }}
            title="Reset data to initial demo state"
            className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
