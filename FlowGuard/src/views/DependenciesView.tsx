import React, { useState } from 'react';
import {
  GitFork,
  Plus,
  AlertOctagon,
  CheckCircle,
  ArrowRight,
  User,
  Layers,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useFlowGuard } from '../context/FlowGuardContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Dependency } from '../types';

export const DependenciesView: React.FC = () => {
  const {
    dependencies,
    projects,
    tasks,
    createDependency,
    resolveDependency,
    openProjectDetails,
    searchQuery,
  } = useFlowGuard();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'task-prereqs' | 'resolved'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [blockingTask, setBlockingTask] = useState('');
  const [blockedTask, setBlockedTask] = useState('');
  const [blockingOwner, setBlockingOwner] = useState('');
  const [impactLevel, setImpactLevel] = useState<'Blocker' | 'Warning' | 'Low'>('Blocker');
  const [notes, setNotes] = useState('');

  // Extract all task-to-task dependencies in projects
  const taskPrereqChains = tasks
    .filter((t) => Boolean(t.dependsOnTaskId))
    .map((t) => {
      const prereq = tasks.find((p) => p.id === t.dependsOnTaskId);
      const isPrereqDone = prereq?.status === 'Completed' || prereq?.status === 'Done';
      return {
        id: `prereq-${t.id}`,
        projectId: t.projectId,
        projectName: t.projectName,
        downstreamTask: t,
        prerequisiteTask: prereq,
        isWaiting: !isPrereqDone,
      };
    })
    .filter((chain) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        chain.projectName.toLowerCase().includes(q) ||
        chain.downstreamTask.title.toLowerCase().includes(q) ||
        (chain.prerequisiteTask && chain.prerequisiteTask.title.toLowerCase().includes(q))
      );
    });

  const filteredDeps = dependencies.filter((dep) => {
    const matchesSearch =
      !searchQuery ||
      dep.blockingTask.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dep.blockedTask.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dep.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dep.blockingOwner.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'active') return matchesSearch && dep.status === 'Active Blocker';
    if (activeTab === 'resolved') return matchesSearch && dep.status === 'Resolved';
    return matchesSearch;
  });

  const activeCount = dependencies.filter((d) => d.status === 'Active Blocker').length;
  const waitingTasksCount = taskPrereqChains.filter((c) => c.isWaiting).length;
  const resolvedCount = dependencies.filter((d) => d.status === 'Resolved').length;

  const handleAddDependency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockingTask.trim() || !blockedTask.trim()) return;

    const proj = projects.find((p) => p.id === projectId);
    const newDep: Dependency = {
      id: `dep-${Date.now()}`,
      projectId,
      projectName: proj?.name || 'Project',
      blockingTask: blockingTask.trim(),
      blockedTask: blockedTask.trim(),
      blockingOwner: blockingOwner.trim() || 'Client Point of Contact',
      impactLevel,
      status: 'Active Blocker',
      notes: notes.trim() || 'Logged via dependency matrix.',
    };

    createDependency(newDep);
    setBlockingTask('');
    setBlockedTask('');
    setBlockingOwner('');
    setNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Active Critical Blockers
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#9B1C1C] tabular-nums">
              {activeCount}
            </span>
            <span className="text-xs text-[#737373]">halting delivery</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Tasks Waiting on Prerequisites
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#975A16] tabular-nums">
              {waitingTasksCount}
            </span>
            <span className="text-xs text-[#737373]">downstream tasks held</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Resolved Bottlenecks
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#1E5631] tabular-nums">
              {resolvedCount}
            </span>
            <span className="text-xs text-[#737373]">unblocked this cycle</span>
          </div>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E8E4DD] shadow-2xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
            }`}
          >
            All Chains ({dependencies.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'active'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
            }`}
          >
            Active Blockers ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('task-prereqs')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'task-prereqs'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
            }`}
          >
            Downstream Prerequisites ({taskPrereqChains.length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'resolved'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Blocker Chain</span>
        </button>
      </div>

      {/* Downstream Task Prerequisites Section */}
      {activeTab === 'task-prereqs' ? (
        <div className="space-y-3">
          {taskPrereqChains.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E8E4DD] p-12 text-center text-xs text-[#737373]">
              No downstream prerequisite dependencies logged in tasks.
            </div>
          ) : (
            taskPrereqChains.map((chain) => (
              <div
                key={chain.id}
                className="p-4 rounded-xl border border-[#E8E4DD] bg-white shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#171717]">
                        {chain.projectName}
                      </span>
                      <span className="text-xs text-[#737373]">·</span>
                      {chain.isWaiting ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEF7EC] text-[#975A16] border border-[#FCE2BE]">
                          <Clock className="w-3 h-3" />
                          Waiting on Prerequisite
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EBF5EE] text-[#1E5631] border border-[#CCE8D4]">
                          <CheckCircle className="w-3 h-3" />
                          Prerequisite Cleared
                        </span>
                      )}
                    </div>

                    {/* Chain Visual */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-xs">
                      <div className="p-2 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD]">
                        <span className="text-[10px] text-[#737373] block">Prerequisite:</span>
                        <span className="font-semibold text-[#171717]">
                          {chain.prerequisiteTask ? chain.prerequisiteTask.title : 'External prerequisite'}
                        </span>
                        <span className="text-[10px] text-[#737373] ml-2 font-mono">
                          [{chain.prerequisiteTask?.status || 'Pending'}]
                        </span>
                      </div>

                      <ArrowRight className="w-4 h-4 text-[#737373] hidden sm:block shrink-0" />

                      <div className="p-2 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD]">
                        <span className="text-[10px] text-[#737373] block">Affected Downstream Task:</span>
                        <span className="font-semibold text-[#171717]">
                          {chain.downstreamTask.title}
                        </span>
                        <span className="text-[10px] text-[#737373] ml-2 font-mono">
                          [{chain.downstreamTask.status}]
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => openProjectDetails(chain.projectId)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#14213D] bg-[#F5F0E8] hover:bg-[#E8E4DD] rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <span>Inspect Project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Standard Blocker Chains */
        <div className="space-y-3">
          {filteredDeps.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E8E4DD] p-12 text-center text-xs text-[#737373]">
              No dependencies or blocker chains found.
            </div>
          ) : (
            filteredDeps.map((dep) => {
              const isActive = dep.status === 'Active Blocker';
              return (
                <div
                  key={dep.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-white border-[#F8CACA] shadow-2xs'
                      : 'bg-[#FAF8F4]/60 border-[#E8E4DD]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#737373]">
                          {dep.projectName}
                        </span>
                        <span className="text-xs text-[#737373]">·</span>
                        <StatusBadge status={dep.impactLevel as any} />
                        <StatusBadge status={dep.status} />
                      </div>

                      {/* Blocker Chain Visual */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-xs">
                        <div className="p-2 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD] font-semibold text-[#9B1C1C]">
                          {dep.blockingTask}
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#737373] hidden sm:block shrink-0" />
                        <div className="p-2 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD] font-medium text-[#171717]">
                          {dep.blockedTask}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right text-xs">
                        <span className="text-[11px] text-[#737373] block">Blocker Owner</span>
                        <span className="font-semibold text-[#171717]">{dep.blockingOwner}</span>
                      </div>

                      {isActive && (
                        <button
                          onClick={() => resolveDependency(dep.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#1E5631] bg-[#EBF5EE] hover:bg-[#CCE8D4] border border-[#CCE8D4] rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Unblock</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {dep.notes && (
                    <div className="mt-3 pt-2 border-t border-[#E8E4DD] text-[11px] text-[#737373]">
                      {dep.notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Blocker Chain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E8E4DD] shadow-lg w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-[#171717]">
              Log Blocker Chain & Dependency
            </h3>
            <form onSubmit={handleAddDependency} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#171717] mb-1">
                  Impacted Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8E4DD] rounded-lg"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">
                  Upstream Blocker Task / External Dependency
                </label>
                <input
                  type="text"
                  placeholder="e.g. Awaiting client Legal privacy policy approval"
                  value={blockingTask}
                  onChange={(e) => setBlockingTask(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8E4DD] rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">
                  Downstream Task Halted
                </label>
                <input
                  type="text"
                  placeholder="e.g. Production launch DNS migration"
                  value={blockedTask}
                  onChange={(e) => setBlockedTask(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8E4DD] rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">
                    Responsible Owner to Unblock
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Sterling (Acme)"
                    value={blockingOwner}
                    onChange={(e) => setBlockingOwner(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E8E4DD] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">
                    Impact Severity
                  </label>
                  <select
                    value={impactLevel}
                    onChange={(e) => setImpactLevel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#E8E4DD] rounded-lg"
                  >
                    <option value="Blocker">Blocker (Halts Work)</option>
                    <option value="Warning">Warning (Risk of Delay)</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">
                  Context & Escalation Plan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes on who was notified, next deadline, or workaround..."
                  className="w-full px-3 py-2 bg-white border border-[#E8E4DD] rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-[#737373]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#14213D] rounded-lg shadow-xs"
                >
                  Save Dependency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
