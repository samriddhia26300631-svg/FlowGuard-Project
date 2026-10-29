import React from 'react';
import {
  FolderKanban,
  Clock,
  AlertTriangle,
  FileCheck2,
  ChevronRight,
  ArrowRight,
  Calendar,
  User,
} from 'lucide-react';
import { useFlowGuard } from '../context/FlowGuardContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const OverviewView: React.FC = () => {
  const {
    projects,
    tasks,
    smartActionItems,
    searchQuery,
    openProjectDetails,
    setActivePage,
    resolveTaskBlocker,
    getCalculatedProjectProgress,
    activeProjectsCount,
    tasksDueSoonCount,
    blockedTasksCount,
    pendingApprovalsCount,
  } = useFlowGuard();

  // Filter projects by search query
  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.owner.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  });

  // Active projects for the main table (excluding Completed)
  const activeProjects = filteredProjects.filter((p) => p.status !== 'Completed');

  // Active uncompleted priority action items from smartActionItems
  const pendingActions = smartActionItems;

  // Upcoming deadlines (projects and high priority tasks sorted by date)
  const upcomingDeadlines = [
    ...projects
      .filter((p) => p.status !== 'Completed')
      .map((p) => ({
        id: `p-${p.id}`,
        name: p.name,
        type: 'Project Deliverable' as const,
        client: p.clientName,
        deadline: p.deadline,
        owner: p.owner,
        status: p.status,
        projectId: p.id,
      })),
    ...tasks
      .filter((t) => t.status !== 'Done' && t.status !== 'Completed')
      .map((t) => ({
        id: `t-${t.id}`,
        name: t.title,
        type: 'Key Milestone Task' as const,
        client: t.projectName,
        deadline: t.dueDate,
        owner: t.assignee,
        status: t.status,
        projectId: t.projectId,
      })),
  ]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'Immediate':
        return 'text-[#9B1C1C] bg-[#FDF2F2] border-[#F8CACA]';
      case 'Today':
        return 'text-[#975A16] bg-[#FEF7EC] border-[#FCE2BE]';
      default:
        return 'text-[#55524B] bg-[#F2EFE9] border-[#E2DDD3]';
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Compact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => setActivePage('projects')}
          className="bg-white p-4 rounded-xl border border-[#E8E4DD] hover:border-[#14213D]/40 transition-colors cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#737373]">
              Active Projects
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] flex items-center justify-center text-[#14213D]">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#171717] tabular-nums">
              {activeProjectsCount}
            </span>
            <span className="text-xs text-[#737373]">
              of {projects.length} contracted
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => setActivePage('commitments')}
          className="bg-white p-4 rounded-xl border border-[#E8E4DD] hover:border-[#14213D]/40 transition-colors cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#737373]">
              Tasks Due Soon
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] flex items-center justify-center text-[#14213D]">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#171717] tabular-nums">
              {tasksDueSoonCount}
            </span>
            <span className="text-xs text-[#737373]">within 7 days</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => setActivePage('action-center')}
          className="bg-white p-4 rounded-xl border border-[#E8E4DD] hover:border-[#9B1C1C]/40 transition-colors cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#737373]">
              Blocked Tasks
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FDF2F2] flex items-center justify-center text-[#9B1C1C]">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#9B1C1C] tabular-nums">
              {blockedTasksCount}
            </span>
            <span className="text-xs text-[#737373]">requires unblocking</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => setActivePage('scope-control')}
          className="bg-white p-4 rounded-xl border border-[#E8E4DD] hover:border-[#14213D]/40 transition-colors cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#737373]">
              Pending Approvals
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] flex items-center justify-center text-[#14213D]">
              <FileCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#171717] tabular-nums">
              {pendingApprovalsCount}
            </span>
            <span className="text-xs text-[#737373]">scope change reviews</span>
          </div>
        </div>
      </div>

      {/* Two-Column Core Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Active Projects Table (approx 7.5 cols / 12) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#E8E4DD] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#E8E4DD] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#171717]">
                Active Projects
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Current deliveries, delivery pace, and blockers
              </p>
            </div>
            <button
              onClick={() => setActivePage('projects')}
              className="text-xs font-medium text-[#14213D] hover:underline flex items-center gap-1"
            >
              <span>View all projects</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E4DD] bg-[#FAF8F4] text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Deadline</th>
                  <th className="py-2.5 px-3">Progress</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DD] text-xs">
                {activeProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#737373]">
                      No active projects match your search query.
                    </td>
                  </tr>
                ) : (
                  activeProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-[#FAF8F4]/80 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#171717]">
                          {project.name}
                        </div>
                        <div className="text-[11px] text-[#737373] truncate max-w-xs">
                          {project.description}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#171717] font-medium whitespace-nowrap">
                        {project.clientName}
                      </td>
                      <td className="py-3 px-3 text-[#737373] whitespace-nowrap">
                        {project.owner}
                      </td>
                      <td className="py-3 px-3 text-[#737373] font-mono tabular-nums whitespace-nowrap">
                        {project.deadline}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {(() => {
                          const prog = getCalculatedProjectProgress(project.id);
                          return (
                            <div className="w-24">
                              <div className="flex items-center justify-between text-[11px] text-[#737373] mb-1 font-mono tabular-nums">
                                <span>{prog}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#FAF8F4] border border-[#E8E4DD] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    project.status === 'Blocked'
                                      ? 'bg-[#9B1C1C]'
                                      : project.status === 'At Risk'
                                      ? 'bg-[#975A16]'
                                      : 'bg-[#14213D]'
                                  }`}
                                  style={{ width: `${prog}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openProjectDetails(project.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#14213D] bg-[#F5F0E8] hover:bg-[#E8E4DD] rounded-md transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Priority Actions (approx 4.5 cols / 12) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#E8E4DD] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#E8E4DD] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#171717]">
                Priority Actions
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Blockers and risks requiring intervention
              </p>
            </div>
            <button
              onClick={() => setActivePage('action-center')}
              className="text-xs font-medium text-[#14213D] hover:underline"
            >
              Action Center
            </button>
          </div>

          <div className="p-4 space-y-3">
            {pendingActions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#737373]">
                All priority actions have been addressed. Operations are nominal.
              </div>
            ) : (
              pendingActions.slice(0, 4).map((action) => (
                <div
                  key={action.id}
                  className="p-3 rounded-lg border border-[#E8E4DD] bg-[#FAF8F4] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${getUrgencyBadge(
                        action.severity
                      )}`}
                    >
                      {action.severity}
                    </span>
                    <span className="text-[11px] text-[#737373]">
                      Owner: {action.owner}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-[#171717] leading-snug">
                      {action.title}
                    </h4>
                    <p className="text-[11px] text-[#737373] mt-1 leading-normal">
                      {action.description}
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    {action.projectId ? (
                      <button
                        onClick={() => openProjectDetails(action.projectId!)}
                        className="text-[11px] text-[#14213D] font-medium hover:underline flex items-center gap-1"
                      >
                        <span>Inspect Project</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#737373]">
                        Global Operational Alert
                      </span>
                    )}

                    <button
                      onClick={() => {
                        if (action.type === 'blocked_task' && action.taskId) {
                          resolveTaskBlocker(action.taskId, 'In Progress');
                        } else if (action.projectId) {
                          openProjectDetails(action.projectId);
                        } else {
                          setActivePage('action-center');
                        }
                      }}
                      className="px-2 py-0.5 text-[11px] font-medium bg-white border border-[#E8E4DD] text-[#171717] hover:bg-[#F5F0E8] rounded transition-colors"
                    >
                      {action.actionLabel || 'Resolve'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Compact Upcoming Deadlines List */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#E8E4DD] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#171717]">
              Upcoming Deadlines
            </h2>
            <p className="text-xs text-[#737373] mt-0.5">
              Deliverables and contract milestones scheduled across projects
            </p>
          </div>
          <button
            onClick={() => setActivePage('commitments')}
            className="text-xs font-medium text-[#14213D] hover:underline flex items-center gap-1"
          >
            <span>View commitments</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-[#E8E4DD]">
          {upcomingDeadlines.map((item) => (
            <div
              key={item.id}
              className="p-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F4] transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD] flex items-center justify-center text-[#14213D] shrink-0">
                  <Calendar className="w-4 h-4 text-[#737373]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#171717]">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-[#737373] flex items-center gap-2 mt-0.5">
                    <span>{item.client}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.type}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 sm:justify-end">
                <div className="flex items-center gap-1.5 text-xs text-[#737373]">
                  <User className="w-3.5 h-3.5" />
                  <span>{item.owner}</span>
                </div>

                <div className="text-xs font-mono font-medium text-[#171717] tabular-nums bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#E8E4DD]">
                  {item.deadline}
                </div>

                <StatusBadge status={item.status} />

                <button
                  onClick={() => openProjectDetails(item.projectId)}
                  className="text-xs font-medium text-[#14213D] hover:underline"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
