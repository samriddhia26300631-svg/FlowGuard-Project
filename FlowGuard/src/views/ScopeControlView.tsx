import React, { useState } from 'react';
import {
  Scale,
  Plus,
  Check,
  X,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useFlowGuard } from '../context/FlowGuardContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const ScopeControlView: React.FC = () => {
  const {
    changeRequests,
    updateChangeRequestStatus,
    convertChangeRequestToTask,
    team,
    tasks,
    setIsNewChangeRequestModalOpen,
    searchQuery,
  } = useFlowGuard();

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedAssignees, setSelectedAssignees] = useState<Record<string, string>>({});

  const isPending = (status: string) => status === 'Pending Approval' || status === 'Pending';

  const filteredRequests = changeRequests.filter((cr) => {
    const matchesSearch =
      !searchQuery ||
      cr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cr.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cr.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'pending') return matchesSearch && isPending(cr.status);
    if (activeFilter === 'approved') return matchesSearch && cr.status === 'Approved';
    if (activeFilter === 'rejected') return matchesSearch && cr.status === 'Rejected';
    return matchesSearch;
  });

  const pendingCount = changeRequests.filter((cr) => isPending(cr.status)).length;
  const totalPendingBudget = changeRequests
    .filter((cr) => isPending(cr.status))
    .reduce((sum, cr) => sum + cr.impactBudget, 0);
  const totalPendingHours = changeRequests
    .filter((cr) => isPending(cr.status))
    .reduce((sum, cr) => sum + cr.impactHours, 0);
  const approvedCount = changeRequests.filter((cr) => cr.status === 'Approved').length;

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Pending Scope Requests
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#171717] tabular-nums">
              {pendingCount}
            </span>
            <span className="text-xs text-[#737373]">awaiting review</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Pending Budget Expansion
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#171717] tabular-nums">
              +${totalPendingBudget.toLocaleString()}
            </span>
            <span className="text-xs text-[#737373]">billable potential</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Pending Capacity Required
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#171717] tabular-nums">
              +{totalPendingHours}h
            </span>
            <span className="text-xs text-[#737373]">engineering workload</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Approved Scope Additions
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#1E5631] tabular-nums">
              {approvedCount}
            </span>
            <span className="text-xs text-[#737373]">formalized into MSAs</span>
          </div>
        </div>
      </div>

      {/* Action Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E8E4DD] shadow-2xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === 'all'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
            }`}
          >
            All Requests ({changeRequests.length})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === 'pending'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('approved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === 'approved'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === 'rejected'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
            }`}
          >
            Rejected
          </button>
        </div>

        <button
          onClick={() => setIsNewChangeRequestModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Change Request</span>
        </button>
      </div>

      {/* Change Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] p-12 text-center text-[#737373] text-xs">
            No change requests found matching criteria.
          </div>
        ) : (
          filteredRequests.map((cr) => (
            <div
              key={cr.id}
              className="bg-white rounded-xl border border-[#E8E4DD] p-5 shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#171717]">
                      {cr.title}
                    </span>
                    <StatusBadge status={cr.status} />
                  </div>
                  <div className="text-xs text-[#737373] mt-0.5">
                    Project: <span className="font-medium text-[#171717]">{cr.projectName}</span> · Requested by {cr.requestedBy} on {cr.dateRequested}
                  </div>
                </div>

                {isPending(cr.status) ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateChangeRequestStatus(cr.id, 'Rejected', 'Delivery Lead')}
                      className="px-3 py-1.5 text-xs font-semibold text-[#9B1C1C] bg-[#FDF2F2] hover:bg-[#F8CACA] border border-[#F8CACA] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => updateChangeRequestStatus(cr.id, 'Approved', 'Delivery Lead')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1E5631] hover:bg-[#164324] rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve (+${cr.impactBudget.toLocaleString()})</span>
                    </button>
                  </div>
                ) : cr.status === 'Approved' ? (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {cr.convertedToTaskId ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E5631] bg-[#DEF7EC] border border-[#BCF0DA] rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Converted to Project Task</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedAssignees[cr.id] || team[0]?.name || ''}
                          onChange={(e) =>
                            setSelectedAssignees((prev) => ({
                              ...prev,
                              [cr.id]: e.target.value,
                            }))
                          }
                          className="px-2.5 py-1.5 text-xs bg-[#FAF8F4] border border-[#E8E4DD] rounded-lg text-[#171717] focus:outline-none focus:border-[#14213D]"
                        >
                          {team.map((m) => (
                            <option key={m.id} value={m.name}>
                              Assign: {m.name} ({m.role.split(' ')[0]})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            convertChangeRequestToTask(
                              cr.id,
                              selectedAssignees[cr.id] || team[0]?.name
                            )
                          }
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Convert to Task</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-[#737373] shrink-0">
                    Reviewed by {cr.reviewedBy || 'Delivery Lead'}
                  </div>
                )}
              </div>

              <p className="text-xs text-[#737373] bg-[#FAF8F4] p-3 rounded-lg border border-[#E8E4DD] leading-relaxed">
                {cr.description}
              </p>

              {/* Impact Breakdown */}
              <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
                <div className="p-2.5 rounded-lg border border-[#E8E4DD] bg-white">
                  <span className="text-[11px] text-[#737373] block">Capacity Impact</span>
                  <span className="font-mono font-bold text-[#171717] text-sm">
                    +{cr.impactHours} hours
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-[#E8E4DD] bg-white">
                  <span className="text-[11px] text-[#737373] block">Budget Adjustment</span>
                  <span className="font-mono font-bold text-[#171717] text-sm">
                    +${cr.impactBudget.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-[#E8E4DD] bg-white">
                  <span className="text-[11px] text-[#737373] block">Timeline Slippage</span>
                  <span className="font-mono font-bold text-[#171717] text-sm">
                    +{cr.impactTimelineDays} days
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
