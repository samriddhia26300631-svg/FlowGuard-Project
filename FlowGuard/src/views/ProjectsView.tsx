import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';
import { useFlowGuard } from '../context/FlowGuardContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { ProjectStatus } from '../types';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    searchQuery,
    openProjectDetails,
    setIsNewProjectModalOpen,
    updateProjectStatus,
    getCalculatedProjectProgress,
  } = useFlowGuard();

  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredProjects = projects.filter((p) => {
    // Search query check
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owner.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === 'All' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    All: projects.length,
    'On Track': projects.filter((p) => p.status === 'On Track').length,
    'At Risk': projects.filter((p) => p.status === 'At Risk').length,
    Blocked: projects.filter((p) => p.status === 'Blocked').length,
    Review: projects.filter((p) => p.status === 'Review').length,
    Completed: projects.filter((p) => p.status === 'Completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Segmented Status Filter + New Project Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E8E4DD] shadow-2xs overflow-x-auto">
          {(['All', 'On Track', 'At Risk', 'Blocked', 'Review', 'Completed'] as const).map(
            (tab) => {
              const isActive = statusFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#14213D] text-white shadow-xs'
                      : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FAF8F4] text-[#737373] border border-[#E8E4DD]'
                    }`}
                  >
                    {statusCounts[tab]}
                  </span>
                </button>
              );
            }
          )}
        </div>

        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E4DD] bg-[#FAF8F4] text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Owner & Role</th>
                <th className="py-3 px-3">Target Deadline</th>
                <th className="py-3 px-3">Progress</th>
                <th className="py-3 px-3">Budget & Hours</th>
                <th className="py-3 px-3">Scope Protection</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DD] text-xs">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#737373]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <FolderKanban className="w-8 h-8 text-[#737373]/40 mx-auto" />
                      <div className="font-semibold text-[#171717]">No projects found</div>
                      <p className="text-[11px] text-[#737373]">
                        No projects match the current filter or search criteria.
                      </p>
                      <button
                        onClick={() => {
                          setStatusFilter('All');
                        }}
                        className="mt-2 px-3 py-1 text-xs font-semibold text-[#14213D] bg-[#F5F0E8] hover:bg-[#E8E4DD] rounded-md transition-colors"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-[#FAF8F4]/80 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => openProjectDetails(p.id)}
                        className="font-bold text-[#171717] hover:text-[#14213D] cursor-pointer"
                      >
                        {p.name}
                      </div>
                      <div className="text-[11px] text-[#737373] truncate max-w-xs mt-0.5">
                        {p.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap font-medium text-[#171717]">
                      {p.clientName}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="text-[#171717] font-medium">{p.owner}</div>
                      <div className="text-[11px] text-[#737373]">{p.ownerRole}</div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap font-mono tabular-nums text-[#171717]">
                      {p.deadline}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {(() => {
                        const progress = getCalculatedProjectProgress(p.id);
                        return (
                          <div className="w-28">
                            <div className="flex items-center justify-between text-[11px] text-[#737373] mb-1 font-mono tabular-nums">
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#FAF8F4] border border-[#E8E4DD] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  p.status === 'Blocked'
                                    ? 'bg-[#9B1C1C]'
                                    : p.status === 'At Risk'
                                    ? 'bg-[#975A16]'
                                    : 'bg-[#14213D]'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px]">
                      <div className="text-[#171717] font-medium">
                        ${p.spentBudget.toLocaleString()} / ${p.budget.toLocaleString()}
                      </div>
                      <div className="text-[#737373]">
                        {p.spentHours}h / {p.allocatedHours}h logged
                      </div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <StatusBadge status={p.scopeStatus} />
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <select
                        value={p.status}
                        onChange={(e) => updateProjectStatus(p.id, e.target.value as ProjectStatus)}
                        className="text-xs bg-white border border-[#E8E4DD] rounded px-2 py-1 focus:outline-none focus:border-[#14213D] cursor-pointer"
                      >
                        <option value="On Track">On Track</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Review">Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openProjectDetails(p.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#14213D] bg-[#F5F0E8] hover:bg-[#E8E4DD] rounded-md transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
