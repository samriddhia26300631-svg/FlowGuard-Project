import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  ArrowRight,
  ShieldAlert,
  Flame,
  User,
  GitFork,
  ExternalLink,
} from 'lucide-react';
import { useFlowGuard } from '../context/FlowGuardContext';
import { ActionCategory, SmartActionItem } from '../types';

export const ActionCenterView: React.FC = () => {
  const {
    smartActionItems,
    resolveTaskBlocker,
    fulfillCommitment,
    openProjectDetails,
    setActivePage,
    searchQuery,
  } = useFlowGuard();

  const [categoryFilter, setCategoryFilter] = useState<'All' | ActionCategory>('All');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Urgent' | 'High' | 'Medium'>('All');

  const filteredItems = smartActionItems.filter((item) => {
    if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
    if (severityFilter !== 'All' && item.severity !== severityFilter) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.owner.toLowerCase().includes(q) ||
      (item.projectName && item.projectName.toLowerCase().includes(q))
    );
  });

  const agencyCount = smartActionItems.filter((i) => i.category === 'Agency Action').length;
  const clientCount = smartActionItems.filter((i) => i.category === 'Waiting on Client').length;
  const externalCount = smartActionItems.filter((i) => i.category === 'External Dependencies').length;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Urgent':
        return 'text-[#9B1C1C] bg-[#FDF2F2] border-[#F8CACA]';
      case 'High':
        return 'text-[#975A16] bg-[#FEF7EC] border-[#FCE2BE]';
      default:
        return 'text-[#14213D] bg-[#F0F4FA] border-[#D6E0F0]';
    }
  };

  const getCategoryBadge = (cat: ActionCategory) => {
    switch (cat) {
      case 'Waiting on Client':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'External Dependencies':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Agency Action':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  const handleActionClick = (item: SmartActionItem) => {
    if (item.type === 'overloaded_member') {
      setActivePage('team-workload');
    } else if (item.type === 'missing_onboarding' && item.projectId) {
      openProjectDetails(item.projectId, 'onboarding');
    } else if ((item.type === 'gate_blocked' || item.type === 'delivery_incomplete') && item.projectId) {
      openProjectDetails(item.projectId, 'gates');
    } else if (item.type === 'blocked_task' && item.taskId) {
      resolveTaskBlocker(item.taskId, 'In Progress');
    } else if (item.type === 'pending_approval') {
      setActivePage('scope-control');
    } else if (item.type === 'overdue_commitment') {
      setActivePage('commitments');
    } else if (item.projectId) {
      openProjectDetails(item.projectId);
    }
  };

  return (
    <div className="space-y-6">
      {/* 3 Live Action Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setCategoryFilter('Agency Action')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            categoryFilter === 'Agency Action'
              ? 'bg-white border-[#14213D] ring-1 ring-[#14213D]'
              : 'bg-white border-[#E8E4DD] hover:border-[#14213D]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#737373]">
              Agency Action
            </span>
            <Flame className="w-4 h-4 text-[#14213D]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#14213D] tabular-nums">
              {agencyCount}
            </span>
            <span className="text-xs text-[#737373]">internal team actions</span>
          </div>
        </div>

        <div
          onClick={() => setCategoryFilter('Waiting on Client')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            categoryFilter === 'Waiting on Client'
              ? 'bg-white border-[#975A16] ring-1 ring-[#975A16]'
              : 'bg-white border-[#E8E4DD] hover:border-[#975A16]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#737373]">
              Waiting on Client
            </span>
            <Clock className="w-4 h-4 text-[#975A16]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#975A16] tabular-nums">
              {clientCount}
            </span>
            <span className="text-xs text-[#737373]">client blockers & sign-offs</span>
          </div>
        </div>

        <div
          onClick={() => setCategoryFilter('External Dependencies')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            categoryFilter === 'External Dependencies'
              ? 'bg-white border-[#9B1C1C] ring-1 ring-[#9B1C1C]'
              : 'bg-white border-[#E8E4DD] hover:border-[#9B1C1C]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#737373]">
              External Dependencies
            </span>
            <GitFork className="w-4 h-4 text-[#9B1C1C]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#9B1C1C] tabular-nums">
              {externalCount}
            </span>
            <span className="text-xs text-[#737373]">third-party blockers</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E8E4DD] shadow-2xs overflow-x-auto">
          {(['All', 'Agency Action', 'Waiting on Client', 'External Dependencies'] as const).map(
            (cat) => {
              const isActive = categoryFilter === cat;
              const count =
                cat === 'All'
                  ? smartActionItems.length
                  : cat === 'Agency Action'
                  ? agencyCount
                  : cat === 'Waiting on Client'
                  ? clientCount
                  : externalCount;

              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#14213D] text-white shadow-xs'
                      : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FAF8F4] text-[#737373] border border-[#E8E4DD]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            }
          )}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#737373]">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="px-2 py-1 bg-white border border-[#E8E4DD] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#14213D]"
          >
            <option value="All">All Severities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Smart Action Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] p-12 text-center text-xs text-[#737373]">
            All clear! No operational bottlenecks match this filter. Everything is moving on schedule.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                item.severity === 'Urgent'
                  ? 'bg-white border-[#F8CACA] shadow-2xs'
                  : 'bg-white border-[#E8E4DD] shadow-2xs'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  {/* Category & Severity & Project header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${getSeverityBadge(
                        item.severity
                      )}`}
                    >
                      {item.severity}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getCategoryBadge(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>
                    {item.projectName && (
                      <span className="text-xs font-semibold text-[#171717]">
                        {item.projectName}
                      </span>
                    )}
                    <span className="text-xs text-[#737373]">·</span>
                    <span className="text-xs text-[#737373] flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>Owner: <strong>{item.owner}</strong></span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#171717]">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#737373] leading-relaxed">
                    {item.description}
                  </p>

                  {/* Reason & Recommended Next Action Box */}
                  <div className="mt-2 p-2.5 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-[#737373] block font-medium">Root Cause:</span>
                      <span className="text-[#171717] font-medium">{item.reason}</span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[11px] text-[#737373] block font-medium">Next Action:</span>
                      <span className="text-[#14213D] font-semibold">{item.recommendedAction}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  {item.type === 'overdue_commitment' && item.id.startsWith('act-cm-') && (
                    <button
                      onClick={() => fulfillCommitment(item.id.replace('act-cm-', ''))}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1E5631] hover:bg-[#164324] rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Fulfilled</span>
                    </button>
                  )}

                  {item.projectId && (
                    <button
                      onClick={() => openProjectDetails(item.projectId!)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#14213D] bg-[#F5F0E8] hover:bg-[#E8E4DD] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>Project Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleActionClick(item)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg transition-colors shadow-xs"
                  >
                    {item.actionLabel}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
