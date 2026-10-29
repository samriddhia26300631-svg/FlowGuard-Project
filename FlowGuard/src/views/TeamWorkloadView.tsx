import React, { useState } from 'react';
import {
  Users2,
  Clock,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRightLeft,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useFlowGuard } from '../context/FlowGuardContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const TeamWorkloadView: React.FC = () => {
  const {
    calculatedTeam,
    updateTeamMemberCapacity,
    reassignTask,
    searchQuery,
    openProjectDetails,
  } = useFlowGuard();

  const [editingCapacityId, setEditingCapacityId] = useState<string | null>(null);
  const [capacityInput, setCapacityInput] = useState<string>('40');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const filteredTeam = calculatedTeam.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      m.status.toLowerCase().includes(q)
    );
  });

  const totalAssignedHours = calculatedTeam.reduce((s, m) => s + m.estimatedActiveHours, 0);
  const totalMaxCapacity = calculatedTeam.reduce((s, m) => s + m.maxWeeklyHours, 0);
  const overallUtilization = totalMaxCapacity > 0 ? Math.round((totalAssignedHours / totalMaxCapacity) * 100) : 0;
  const overloadedCount = calculatedTeam.filter((m) => m.status === 'Overloaded').length;

  const handleStartEditCapacity = (id: string, currentCap: number) => {
    setEditingCapacityId(id);
    setCapacityInput(String(currentCap));
  };

  const handleSaveCapacity = (id: string) => {
    const val = parseInt(capacityInput, 10);
    if (!isNaN(val) && val > 0 && val <= 100) {
      updateTeamMemberCapacity(id, val);
    }
    setEditingCapacityId(null);
  };

  return (
    <div className="space-y-6">
      {/* Workload Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Total Agency Utilization
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#171717] tabular-nums">
              {overallUtilization}%
            </span>
            <span className="text-xs text-[#737373]">
              {totalAssignedHours}h active / {totalMaxCapacity}h cap
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Overloaded Engineers
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-['Manrope'] tabular-nums ${
                overloadedCount > 0 ? 'text-[#9B1C1C]' : 'text-[#171717]'
              }`}
            >
              {overloadedCount}
            </span>
            <span className="text-xs text-[#737373]">exceeding 100% weekly limit</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Available Capacity
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#1E5631] tabular-nums">
              {Math.max(0, totalMaxCapacity - totalAssignedHours)}h
            </span>
            <span className="text-xs text-[#737373]">buffer for sprint spikes</span>
          </div>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTeam.map((member) => {
          const isOverloaded = member.status === 'Overloaded';
          const isAtCap = member.status === 'At Capacity';
          const isEditing = editingCapacityId === member.id;
          const isExpanded = expandedMemberId === member.id;

          return (
            <div
              key={member.id}
              className={`bg-white rounded-xl border p-5 shadow-2xs space-y-4 transition-all ${
                isOverloaded
                  ? 'border-[#F8CACA] ring-1 ring-[#F8CACA]'
                  : 'border-[#E8E4DD]'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#14213D] text-white flex items-center justify-center font-bold text-xs tracking-wider">
                    {member.avatarInitials}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#171717]">
                      {member.name}
                    </h3>
                    <p className="text-xs text-[#737373]">{member.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={member.status} />
                </div>
              </div>

              {/* Capacity Progress Bar & Controls */}
              <div className="space-y-2 bg-[#FAF8F4] p-3 rounded-lg border border-[#E8E4DD]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#737373] font-medium">Weekly Capacity</span>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="10"
                        max="80"
                        value={capacityInput}
                        onChange={(e) => setCapacityInput(e.target.value)}
                        className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-[#14213D] rounded text-right"
                      />
                      <span className="text-[11px] text-[#737373]">h/wk</span>
                      <button
                        onClick={() => handleSaveCapacity(member.id)}
                        className="p-1 rounded bg-[#14213D] text-white hover:bg-[#0B132B]"
                        title="Save Capacity"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingCapacityId(null)}
                        className="p-1 rounded bg-[#E8E4DD] text-[#737373] hover:text-[#171717]"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          isOverloaded
                            ? 'text-[#9B1C1C]'
                            : isAtCap
                            ? 'text-[#975A16]'
                            : 'text-[#171717]'
                        }`}
                      >
                        {member.estimatedActiveHours}h / {member.maxWeeklyHours}h ({member.utilizationPercent}%)
                      </span>
                      <button
                        onClick={() => handleStartEditCapacity(member.id, member.maxWeeklyHours)}
                        className="p-1 rounded text-[#737373] hover:text-[#14213D] hover:bg-white transition-colors"
                        title="Edit Weekly Capacity"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="w-full h-2 bg-white border border-[#E8E4DD] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOverloaded
                        ? 'bg-[#9B1C1C]'
                        : isAtCap
                        ? 'bg-[#975A16]'
                        : 'bg-[#14213D]'
                    }`}
                    style={{ width: `${Math.min(100, member.utilizationPercent)}%` }}
                  />
                </div>

                {isOverloaded && (
                  <div className="text-[11px] font-medium text-[#9B1C1C] flex items-center gap-1 pt-0.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Overloaded by {member.estimatedActiveHours - member.maxWeeklyHours}h. Reassign tasks below to balance workload.</span>
                  </div>
                )}
              </div>

              {/* Metrics row: Available capacity & issue badges */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD]">
                  <span className="text-[10px] text-[#737373] block uppercase tracking-wider">Remaining Buffer</span>
                  <span className="font-mono font-bold text-[#171717]">
                    {member.availableCapacity}h
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD]">
                  <span className="text-[10px] text-[#737373] block uppercase tracking-wider">Active Tasks</span>
                  <span className="font-mono font-bold text-[#171717]">
                    {member.activeTasksCount}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD]">
                  <span className="text-[10px] text-[#737373] block uppercase tracking-wider">Bottlenecks</span>
                  <span
                    className={`font-mono font-bold ${
                      member.blockedCount > 0 || member.overdueCount > 0
                        ? 'text-[#9B1C1C]'
                        : 'text-[#1E5631]'
                    }`}
                  >
                    {member.blockedCount} blk · {member.overdueCount} ovd
                  </span>
                </div>
              </div>

              {/* Active Projects Tags */}
              <div>
                <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">
                  Assigned Deliverables ({member.activeProjects.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {member.activeProjects.map((proj) => (
                    <span
                      key={proj}
                      className="text-xs px-2.5 py-1 rounded-md bg-[#FAF8F4] text-[#171717] border border-[#E8E4DD]"
                    >
                      {proj}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assigned Active Tasks & Quick Reassignment */}
              <div className="pt-2 border-t border-[#E8E4DD]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#171717]">
                    Active Assigned Tasks ({member.activeTasks.length})
                  </span>
                  <button
                    onClick={() =>
                      setExpandedMemberId(isExpanded ? null : member.id)
                    }
                    className="text-xs text-[#14213D] hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>{isExpanded ? 'Hide Tasks' : 'Manage Tasks & Reassign'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="space-y-2 mt-2">
                    {member.activeTasks.length === 0 ? (
                      <p className="text-xs text-[#737373] italic py-2">
                        No active tasks currently assigned.
                      </p>
                    ) : (
                      member.activeTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 rounded-lg border border-[#E8E4DD] bg-[#FAF8F4] space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-[#171717]">
                                {t.title}
                              </div>
                              <div className="text-[11px] text-[#737373]">
                                {t.projectName} · Due: {t.dueDate}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-mono text-[11px] font-bold text-[#14213D] bg-white px-2 py-0.5 rounded border border-[#E8E4DD]">
                                {t.estimatedHours || 8}h
                              </span>
                              <StatusBadge status={t.status} />
                            </div>
                          </div>

                          {/* Quick Reassign Controls */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E8E4DD]/60">
                            <span className="text-[11px] text-[#737373] flex items-center gap-1">
                              <ArrowRightLeft className="w-3 h-3" />
                              Reassign to:
                            </span>
                            <select
                              value={member.name}
                              onChange={(e) => {
                                const newAssignee = e.target.value;
                                if (newAssignee !== member.name) {
                                  reassignTask(t.id, newAssignee);
                                }
                              }}
                              className="px-2 py-1 text-xs bg-white border border-[#E8E4DD] rounded-md text-[#171717] focus:outline-none focus:border-[#14213D]"
                            >
                              <option value={member.name} disabled>
                                Current: {member.name}
                              </option>
                              {calculatedTeam
                                .filter((m) => m.name !== member.name)
                                .map((m) => (
                                  <option key={m.id} value={m.name}>
                                    {m.name} ({m.availableCapacity}h free, {m.utilizationPercent}%)
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
