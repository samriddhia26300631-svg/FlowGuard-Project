import { LifecyclePanel } from '../common/LifecyclePanel';
import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Edit2,
  Trash2,
  ChevronDown,
  LayoutList,
  KanbanSquare,
  ArrowRight,
  ShieldAlert,
  GitFork,
  CheckCircle2,
  ShieldCheck,
  ListChecks,
  Sparkles,
  ArrowUpRight,
  FileCheck,
  Info,
} from 'lucide-react';
import { useFlowGuard } from '../../context/FlowGuardContext';
import { StatusBadge } from '../common/StatusBadge';
import { ProjectStatus, ProjectStage, TaskPriority, TaskStatus, BlockerParty, Task } from '../../types';

export const ProjectDetailModal: React.FC = () => {
  const {
    selectedProjectId,
    projectDetailTab,
    closeProjectDetails,
    projects,
    tasks,
    changeRequests,
    updateProjectStatus,
    toggleTaskDone,
    createTask,
    updateTask,
    deleteTask,
    markTaskBlocked,
    resolveTaskBlocker,
    wouldCreateCycle,
    getPrerequisiteStatus,
    getCalculatedProjectProgress,
    team,
  } = useFlowGuard();

  const project = projects.find((p) => p.id === selectedProjectId);

  const [activeTab, setActiveTab] = useState<'tasks' | 'onboarding' | 'gates' | 'scope' | 'info'>(
    project?.stage === 'Onboarding' ? 'onboarding' : 'tasks'
  );
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  
  // Task Creation / Editing form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(team[0]?.name || 'Marcus Vance');
  const [taskDueDate, setTaskDueDate] = useState('2026-11-10');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('High');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('To Do');
  const [taskProgress, setTaskProgress] = useState<number>(0);
  const [taskPrereqId, setTaskPrereqId] = useState<string>('');
  const [taskEstimatedHours, setTaskEstimatedHours] = useState<number>(8);
  
  // Blocker fields
  const [isTaskBlocked, setIsTaskBlocked] = useState(false);
  const [blockerReason, setBlockerReason] = useState('');
  const [blockerParty, setBlockerParty] = useState<BlockerParty>('Client');
  const [blockerOwner, setBlockerOwner] = useState('');
  const [formError, setFormError] = useState('');

  // Quick Blocker Prompt Modal state
  const [blockingPromptTaskId, setBlockingPromptTaskId] = useState<string | null>(null);
  const [quickReason, setQuickReason] = useState('');
  const [quickParty, setQuickParty] = useState<BlockerParty>('Client');
  const [quickOwner, setQuickOwner] = useState('');
  const [quickError, setQuickError] = useState('');

  useEffect(() => {
    setActiveTab(projectDetailTab); setShowTaskForm(false); setBlockingPromptTaskId(null);
  }, [selectedProjectId, projectDetailTab]);

  if (!selectedProjectId || !project) return null;

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectCRs = changeRequests.filter((cr) => cr.projectId === project.id);
  
  // Derived project progress from completed tasks
  const derivedProgress = getCalculatedProjectProgress(project.id);
  const completedTasksCount = projectTasks.filter(
    (t) => t.status === 'Completed' || t.status === 'Done'
  ).length;

  const openNewTaskForm = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskAssignee(team[0]?.name || 'Marcus Vance');
    setTaskDueDate('2026-11-10');
    setTaskPriority('High');
    setTaskStatus('To Do');
    setTaskProgress(0);
    setTaskPrereqId('');
    setTaskEstimatedHours(8);
    setIsTaskBlocked(false);
    setBlockerReason('');
    setBlockerParty('Client');
    setBlockerOwner(project.clientName || 'Client Lead');
    setFormError('');
    setShowTaskForm(true);
  };

  const openEditTaskForm = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskAssignee(task.assignee);
    setTaskDueDate(task.dueDate);
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskProgress(task.progress ?? (task.status === 'Completed' || task.status === 'Done' ? 100 : 0));
    setTaskPrereqId(task.dependsOnTaskId || '');
    setTaskEstimatedHours(task.estimatedHours || 8);
    setIsTaskBlocked(task.isBlocked);
    setBlockerReason(task.blockerReason || '');
    setBlockerParty(task.blockerParty || 'Client');
    setBlockerOwner(task.blockerOwner || '');
    setFormError('');
    setShowTaskForm(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setFormError('Task title is required.');
      return;
    }

    if (isTaskBlocked) {
      if (!blockerReason.trim()) {
        setFormError('Blocker reason is required when task is blocked.');
        return;
      }
      if (!blockerOwner.trim()) {
        setFormError('Blocker responsible party owner is required.');
        return;
      }
    }

    // Dependency cycle check
    if (taskPrereqId && editingTaskId && wouldCreateCycle(editingTaskId, taskPrereqId)) {
      setFormError('Circular dependency detected! A task cannot depend on itself or its own dependents.');
      return;
    }

    const effectiveStatus: TaskStatus = isTaskBlocked
      ? 'Blocked'
      : taskStatus === 'Blocked'
      ? 'In Progress'
      : taskStatus;

    if (editingTaskId) {
      updateTask(editingTaskId, {
        title: taskTitle.trim(),
        assignee: taskAssignee,
        dueDate: taskDueDate,
        priority: taskPriority,
        status: effectiveStatus,
        progress: effectiveStatus === 'Completed' || effectiveStatus === 'Done' ? 100 : taskProgress,
        dependsOnTaskId: taskPrereqId || undefined,
        estimatedHours: taskEstimatedHours || 8,
        isBlocked: isTaskBlocked,
        blockerReason: isTaskBlocked ? blockerReason.trim() : undefined,
        blockerParty: isTaskBlocked ? blockerParty : undefined,
        blockerOwner: isTaskBlocked ? blockerOwner.trim() : undefined,
      });
    } else {
      createTask({
        projectId: project.id,
        projectName: project.name,
        title: taskTitle.trim(),
        assignee: taskAssignee,
        dueDate: taskDueDate,
        priority: taskPriority,
        status: effectiveStatus,
        progress: effectiveStatus === 'Completed' || effectiveStatus === 'Done' ? 100 : taskProgress,
        dependsOnTaskId: taskPrereqId || undefined,
        estimatedHours: taskEstimatedHours || 8,
        isBlocked: isTaskBlocked,
        blockerReason: isTaskBlocked ? blockerReason.trim() : undefined,
        blockerParty: isTaskBlocked ? blockerParty : undefined,
        blockerOwner: isTaskBlocked ? blockerOwner.trim() : undefined,
      });
    }

    setShowTaskForm(false);
  };

  const handleQuickBlockerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockingPromptTaskId) return;
    if (!quickReason.trim()) {
      setQuickError('Please specify the blocker reason.');
      return;
    }
    if (!quickOwner.trim()) {
      setQuickError('Please identify the responsible party or owner.');
      return;
    }

    markTaskBlocked(blockingPromptTaskId, quickReason.trim(), quickOwner.trim(), quickParty);
    setBlockingPromptTaskId(null);
    setQuickReason('');
    setQuickOwner('');
    setQuickError('');
  };

  // Kanban status columns
  const kanbanColumns: Array<{ id: TaskStatus; label: string; count: number }> = [
    { id: 'To Do', label: 'To Do', count: projectTasks.filter((t) => t.status === 'To Do' || t.status === 'Todo').length },
    { id: 'In Progress', label: 'In Progress', count: projectTasks.filter((t) => t.status === 'In Progress').length },
    { id: 'Review', label: 'Review', count: projectTasks.filter((t) => t.status === 'Review' || t.status === 'In Review').length },
    { id: 'Blocked', label: 'Blocked', count: projectTasks.filter((t) => t.status === 'Blocked' || t.isBlocked).length },
    { id: 'Completed', label: 'Completed', count: projectTasks.filter((t) => t.status === 'Completed' || t.status === 'Done').length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-[#E8E4DD] shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-[#E8E4DD] bg-[#FAF8F4] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#737373]">
                {project.clientName}
              </span>
              <span className="text-xs text-[#737373]">·</span>
              <StatusBadge status={project.scopeStatus} />
            </div>
            <h2 className="text-lg font-bold text-[#171717] font-['Manrope']">
              {project.name}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={project.status}
                onChange={(e) => updateProjectStatus(project.id, e.target.value as ProjectStatus)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold bg-white border border-[#E8E4DD] rounded-lg text-[#171717] focus:outline-none focus:border-[#14213D] cursor-pointer"
              >
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Blocked">Blocked</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#737373] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={closeProjectDetails}
              className="p-1.5 rounded-lg text-[#737373] hover:text-[#171717] hover:bg-[#E8E4DD] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stat Ribbon & Derived Progress */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#E8E4DD] bg-white divide-x divide-[#E8E4DD] text-xs">
          <div className="p-3 px-4">
            <div className="text-[11px] text-[#737373]">Delivery Lead</div>
            <div className="font-semibold text-[#171717] mt-0.5 truncate">
              {project.owner}
            </div>
          </div>
          <div className="p-3 px-4">
            <div className="text-[11px] text-[#737373]">Deadline</div>
            <div className="font-mono font-medium text-[#171717] mt-0.5">
              {project.deadline}
            </div>
          </div>
          <div className="p-3 px-4">
            <div className="text-[11px] text-[#737373]">Derived Task Progress</div>
            <div className="font-mono font-semibold text-[#14213D] mt-0.5 flex items-center gap-1.5">
              <span className="tabular-nums">{derivedProgress}%</span>
              <span className="text-[10px] text-[#737373] font-normal">
                ({completedTasksCount}/{projectTasks.length} done)
              </span>
            </div>
          </div>
          <div className="p-3 px-4">
            <div className="text-[11px] text-[#737373]">Hours Logged</div>
            <div className="font-mono font-medium text-[#171717] mt-0.5">
              {project.spentHours}h / {project.allocatedHours}h
            </div>
          </div>
        </div>

        {/* Derived Progress Bar */}
        <div className="px-6 py-2.5 bg-[#FAF8F4]/60 border-b border-[#E8E4DD] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#737373]">Project Completion:</span>
            <span className="font-mono font-bold text-[#14213D]">{derivedProgress}%</span>
          </div>
          <div className="w-64 h-2 bg-white border border-[#E8E4DD] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                derivedProgress === 100
                  ? 'bg-[#1E5631]'
                  : project.status === 'Blocked'
                  ? 'bg-[#9B1C1C]'
                  : 'bg-[#14213D]'
              }`}
              style={{ width: `${derivedProgress}%` }}
            />
          </div>
        </div>

        {/* Tab & View Mode Navigation */}
        <div className="px-6 pt-3 border-b border-[#E8E4DD] bg-white flex items-center justify-between gap-4">
          <div className="flex gap-4 text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'tasks'
                  ? 'border-[#14213D] text-[#14213D] font-bold'
                  : 'border-transparent text-[#737373] hover:text-[#171717]'
              }`}
            >
              <span>Tasks & Blockers</span>
              <span className="text-[10px] bg-[#FAF8F4] px-1.5 py-0.5 rounded border border-[#E8E4DD] font-mono">
                {projectTasks.length}
              </span>
            </button>
            {(['onboarding', 'gates'] as const).map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2.5 border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-[#14213D] text-[#14213D] font-bold' : 'border-transparent text-[#737373]'}`}>{tab === 'onboarding' ? 'Onboarding' : 'Stage Gates & Handover'}</button>)}
            <button
              onClick={() => setActiveTab('scope')}
              className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'scope'
                  ? 'border-[#14213D] text-[#14213D] font-bold'
                  : 'border-transparent text-[#737373] hover:text-[#171717]'
              }`}
            >
              <span>Scope & Change Requests</span>
              <span className="text-[10px] bg-[#FAF8F4] px-1.5 py-0.5 rounded border border-[#E8E4DD] font-mono">
                {projectCRs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeTab === 'info'
                  ? 'border-[#14213D] text-[#14213D] font-bold'
                  : 'border-transparent text-[#737373] hover:text-[#171717]'
              }`}
            >
              Contractual Scope
            </button>
          </div>

          {activeTab === 'tasks' && (
            <div className="flex items-center gap-2 pb-2">
              {/* View Toggle */}
              <div className="flex items-center p-0.5 bg-[#FAF8F4] border border-[#E8E4DD] rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  title="List View"
                  className={`p-1 rounded text-xs transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-[#14213D] shadow-2xs font-semibold'
                      : 'text-[#737373] hover:text-[#171717]'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  title="Kanban View"
                  className={`p-1 rounded text-xs transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white text-[#14213D] shadow-2xs font-semibold'
                      : 'text-[#737373] hover:text-[#171717]'
                  }`}
                >
                  <KanbanSquare className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={openNewTaskForm}
                className="px-2.5 py-1 text-xs font-semibold bg-[#14213D] text-white hover:bg-[#0B132B] rounded-md transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* Task Form Modal / Inline Section */}
              {showTaskForm && (
                <form
                  onSubmit={handleSaveTask}
                  className="p-4 bg-[#FAF8F4] rounded-xl border border-[#E8E4DD] space-y-3.5 text-xs shadow-2xs mb-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#171717]">
                      {editingTaskId ? 'Edit Deliverable Task' : 'Create Deliverable Task'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTaskForm(false)}
                      className="text-[#737373] hover:text-[#171717]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {formError && (
                    <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-[#171717] mb-1">
                      Task Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ingest SAML 2.0 assertions and test SSO token handshake"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[#737373] mb-0.5">Assignee</label>
                      <select
                        value={taskAssignee}
                        onChange={(e) => setTaskAssignee(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-[#E8E4DD] rounded-lg"
                      >
                        {team.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#737373] mb-0.5">Due Date</label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-[#E8E4DD] rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[#737373] mb-0.5">Est. Hours</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={taskEstimatedHours}
                        onChange={(e) => setTaskEstimatedHours(Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-white border border-[#E8E4DD] rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[#737373] mb-0.5">Priority</label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                        className="w-full px-2 py-1.5 bg-white border border-[#E8E4DD] rounded-lg"
                      >
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#737373] mb-0.5">Status</label>
                      <select
                        value={taskStatus}
                        onChange={(e) => {
                          const val = e.target.value as TaskStatus;
                          setTaskStatus(val);
                          if (val === 'Blocked') setIsTaskBlocked(true);
                          else if (val === 'Completed') {
                            setIsTaskBlocked(false);
                            setTaskProgress(100);
                          }
                        }}
                        className="w-full px-2 py-1.5 bg-white border border-[#E8E4DD] rounded-lg"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {/* Task Progress & Prerequisite Dependency */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-[#171717]">
                          Task Progress: <span className="font-mono">{taskProgress}%</span>
                        </label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={taskProgress}
                        onChange={(e) => setTaskProgress(Number(e.target.value))}
                        className="w-full accent-[#14213D] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#171717] mb-1">
                        Prerequisite Dependency (Wait on Task)
                      </label>
                      <select
                        value={taskPrereqId}
                        onChange={(e) => setTaskPrereqId(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-[#E8E4DD] rounded-lg"
                      >
                        <option value="">No Prerequisite (Starts Immediately)</option>
                        {projectTasks
                          .filter((t) => t.id !== editingTaskId)
                          .map((t) => {
                            const isCyclic = editingTaskId ? wouldCreateCycle(editingTaskId, t.id) : false;
                            return (
                              <option key={t.id} value={t.id} disabled={isCyclic}>
                                {t.title} {isCyclic ? '(Circular - Disabled)' : `[${t.status}]`}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </div>

                  {/* Explicit Blocker Ownership Section */}
                  <div className="p-3 bg-white rounded-lg border border-[#E8E4DD] space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#171717]">
                      <input
                        type="checkbox"
                        checked={isTaskBlocked}
                        onChange={(e) => setIsTaskBlocked(e.target.checked)}
                        className="rounded text-[#9B1C1C] focus:ring-0"
                      />
                      <span className={isTaskBlocked ? 'text-[#9B1C1C]' : 'text-[#171717]'}>
                        Mark Task as Blocked (Halts Progress)
                      </span>
                    </label>

                    {isTaskBlocked && (
                      <div className="space-y-2 pt-1 border-t border-[#E8E4DD]">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#9B1C1C] mb-1">
                            Blocker Reason <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Awaiting client Infosec to provision SAML metadata endpoint"
                            value={blockerReason}
                            onChange={(e) => setBlockerReason(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-red-300 rounded focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#737373] mb-0.5">
                              Responsible Party <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={blockerParty}
                              onChange={(e) => setBlockerParty(e.target.value as BlockerParty)}
                              className="w-full px-2 py-1 text-xs border border-[#E8E4DD] rounded"
                            >
                              <option value="Client">Client</option>
                              <option value="Team Member">Team Member</option>
                              <option value="External">External</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#737373] mb-0.5">
                              Responsible Person / Contact <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Sarah Sterling (Acme)"
                              value={blockerOwner}
                              onChange={(e) => setBlockerOwner(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-[#E8E4DD] rounded"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowTaskForm(false)}
                      className="px-3 py-1.5 text-xs text-[#737373] hover:text-[#171717]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded-md shadow-xs"
                    >
                      {editingTaskId ? 'Save Task Updates' : 'Add Task'}
                    </button>
                  </div>
                </form>
              )}

              {/* LIST VIEW */}
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {projectTasks.length === 0 ? (
                    <div className="py-10 text-center text-xs text-[#737373]">
                      No tasks created for this project yet. Click &quot;New Task&quot; above to add deliverables.
                    </div>
                  ) : (
                    projectTasks.map((t) => {
                      const isDone = t.status === 'Completed' || t.status === 'Done';
                      const { isWaiting, prereqTask } = getPrerequisiteStatus(t);

                      return (
                        <div
                          key={t.id}
                          className={`p-3.5 rounded-lg border transition-all ${
                            t.isBlocked
                              ? 'bg-[#FDF2F2]/60 border-[#F8CACA]'
                              : isDone
                              ? 'bg-[#FAF8F4]/50 border-[#E8E4DD] opacity-80'
                              : 'bg-white border-[#E8E4DD] hover:border-[#14213D]/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => toggleTaskDone(t.id)}
                                className="mt-1 rounded text-[#14213D] focus:ring-0 cursor-pointer"
                              />

                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`text-xs font-bold ${
                                      isDone
                                        ? 'line-through text-[#737373]'
                                        : 'text-[#171717]'
                                    }`}
                                  >
                                    {t.title}
                                  </span>

                                  {/* Prerequisite Waiting Indicator */}
                                  {isWaiting && prereqTask && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FEF7EC] text-[#975A16] border border-[#FCE2BE]">
                                      <Clock className="w-3 h-3" />
                                      <span>Waiting on: {prereqTask.title}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-[#737373] flex flex-wrap items-center gap-2">
                                  <span className="flex items-center gap-1 text-[#171717]">
                                    <User className="w-3 h-3 text-[#737373]" />
                                    <span>{t.assignee}</span>
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums">Due {t.dueDate}</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono">Progress: {t.progress ?? (isDone ? 100 : 0)}%</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={t.priority} />
                              <StatusBadge status={t.status} />

                              {/* Blocker Action */}
                              {!isDone && (
                                t.isBlocked ? (
                                  <button
                                    onClick={() => resolveTaskBlocker(t.id, 'In Progress')}
                                    className="px-2.5 py-1 text-xs font-semibold rounded bg-white text-[#1E5631] border border-[#CCE8D4] hover:bg-[#EBF5EE] transition-colors"
                                  >
                                    Resolve Blocker
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setBlockingPromptTaskId(t.id);
                                      setQuickReason('');
                                      setQuickOwner(project.clientName || 'Client Lead');
                                      setQuickParty('Client');
                                      setQuickError('');
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold rounded bg-white text-[#9B1C1C] border border-[#F8CACA] hover:bg-[#FDF2F2] transition-colors"
                                  >
                                    Flag Blocker
                                  </button>
                                )
                              )}

                              {/* Edit & Delete Actions */}
                              <button
                                onClick={() => openEditTaskForm(t)}
                                className="p-1 rounded text-[#737373] hover:text-[#14213D] hover:bg-[#FAF8F4]"
                                title="Edit Task"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteTask(t.id)}
                                className="p-1 rounded text-[#737373] hover:text-[#9B1C1C] hover:bg-red-50"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Blocker Callout Ribbon */}
                          {t.isBlocked && (
                            <div className="mt-2.5 p-2.5 rounded bg-white border border-[#F8CACA] text-xs text-[#9B1C1C] flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold">Blocker: </span>
                                  <span>{t.blockerReason || 'Unspecified blocker'}</span>
                                  <div className="text-[11px] text-[#737373] mt-0.5 flex items-center gap-2">
                                    <span>Responsible: <strong className="text-[#171717]">{t.blockerParty || 'Client'}</strong></span>
                                    <span>·</span>
                                    <span>Owner: <strong className="text-[#171717]">{t.blockerOwner || 'Client Lead'}</strong></span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => resolveTaskBlocker(t.id, 'In Progress')}
                                className="px-2 py-0.5 text-[11px] font-semibold bg-[#EBF5EE] text-[#1E5631] border border-[#CCE8D4] rounded hover:bg-[#CCE8D4] shrink-0"
                              >
                                Mark Resolved
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* KANBAN VIEW */}
              {viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start overflow-x-auto pb-4">
                  {kanbanColumns.map((col) => {
                    const colTasks = projectTasks.filter((t) => {
                      if (col.id === 'Blocked') return t.isBlocked || t.status === 'Blocked';
                      if (col.id === 'Completed') return t.status === 'Completed' || t.status === 'Done';
                      if (col.id === 'To Do') return (t.status === 'To Do' || t.status === 'Todo') && !t.isBlocked;
                      if (col.id === 'Review') return (t.status === 'Review' || t.status === 'In Review') && !t.isBlocked;
                      return t.status === 'In Progress' && !t.isBlocked;
                    });

                    return (
                      <div
                        key={col.id}
                        className="bg-[#FAF8F4] p-2.5 rounded-xl border border-[#E8E4DD] space-y-2.5 min-w-[160px]"
                      >
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold text-[#171717]">
                            {col.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-[#E8E4DD] text-[#737373]">
                            {colTasks.length}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {colTasks.map((t) => {
                            const { isWaiting, prereqTask } = getPrerequisiteStatus(t);
                            return (
                              <div
                                key={t.id}
                                className="bg-white p-2.5 rounded-lg border border-[#E8E4DD] shadow-2xs space-y-2 text-xs"
                              >
                                <div className="font-semibold text-[#171717] leading-snug">
                                  {t.title}
                                </div>

                                {isWaiting && prereqTask && (
                                  <div className="text-[10px] text-[#975A16] bg-[#FEF7EC] p-1 rounded border border-[#FCE2BE]">
                                    Waiting on: {prereqTask.title}
                                  </div>
                                )}

                                {t.isBlocked && (
                                  <div className="text-[10px] text-[#9B1C1C] bg-[#FDF2F2] p-1 rounded border border-[#F8CACA]">
                                    Blocker: {t.blockerParty || 'Client'} ({t.blockerOwner})
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-[11px] text-[#737373] pt-1 border-t border-[#E8E4DD]">
                                  <span>{t.assignee}</span>
                                  <span className="font-mono text-[10px]">Due {t.dueDate}</span>
                                </div>

                                {/* Status quick selector in Kanban */}
                                <div className="pt-1 flex items-center justify-between">
                                  <select
                                    value={t.status}
                                    onChange={(e) => {
                                      const next = e.target.value as TaskStatus;
                                      if (next === 'Blocked') {
                                        setBlockingPromptTaskId(t.id);
                                        setQuickReason('');
                                        setQuickOwner(project.clientName || 'Client Lead');
                                        setQuickParty('Client');
                                      } else {
                                        updateTask(t.id, { status: next, isBlocked: false });
                                      }
                                    }}
                                    className="text-[10px] bg-[#FAF8F4] border border-[#E8E4DD] rounded px-1.5 py-0.5"
                                  >
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Review">Review</option>
                                    <option value="Blocked">Blocked</option>
                                    <option value="Completed">Completed</option>
                                  </select>

                                  <button
                                    onClick={() => openEditTaskForm(t)}
                                    className="text-[#737373] hover:text-[#14213D] p-0.5"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {(activeTab === 'onboarding' || activeTab === 'gates') && <LifecyclePanel key={`${project.id}-${activeTab}`} projectId={project.id} section={activeTab} />}

          {activeTab === 'scope' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
                    Change Requests & Creep Protection
                  </h4>
                  <p className="text-[11px] text-[#737373]">
                    Requests impacting delivery commitments require formal client sign-off
                  </p>
                </div>
              </div>

              {projectCRs.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#737373]">
                  No change requests have been filed for this project. Scope is strictly locked.
                </div>
              ) : (
                <div className="space-y-3">
                  {projectCRs.map((cr) => (
                    <div
                      key={cr.id}
                      className="p-4 rounded-lg border border-[#E8E4DD] bg-[#FAF8F4] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-xs text-[#171717]">
                          {cr.title}
                        </div>
                        <StatusBadge status={cr.status} />
                      </div>
                      <p className="text-xs text-[#737373]">
                        {cr.description}
                      </p>
                      <div className="pt-2 border-t border-[#E8E4DD] flex flex-wrap items-center justify-between text-[11px] text-[#737373] gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-medium text-[#171717]">
                            +{cr.impactHours} hours
                          </span>
                          <span className="font-mono font-medium text-[#171717]">
                            +${cr.impactBudget.toLocaleString()}
                          </span>
                          <span className="font-mono font-medium text-[#171717]">
                            +{cr.impactTimelineDays} days
                          </span>
                        </div>
                        <div>Requested by {cr.requestedBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-[#171717] mb-1">Scope Description</h4>
                <p className="text-[#737373] leading-relaxed bg-[#FAF8F4] p-3 rounded-lg border border-[#E8E4DD]">
                  {project.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD]">
                  <div className="text-[11px] text-[#737373] mb-1">Contract Allocation</div>
                  <div className="font-bold text-[#171717] font-mono text-sm">
                    {project.allocatedHours} Hours
                  </div>
                  <div className="text-[11px] text-[#737373] mt-1">
                    Burn rate: {Math.round((project.spentHours / project.allocatedHours) * 100)}% utilized
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD]">
                  <div className="text-[11px] text-[#737373] mb-1">Contract Value</div>
                  <div className="font-bold text-[#171717] font-mono text-sm">
                    ${project.budget.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#737373] mt-1">
                    Burned: ${project.spentBudget.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Blocker Prompt Modal */}
        {blockingPromptTaskId && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-xl border border-[#F8CACA] shadow-xl w-full max-w-md p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#9B1C1C] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Flag Task Blocker
                </span>
                <button
                  type="button"
                  onClick={() => setBlockingPromptTaskId(null)}
                  className="text-[#737373] hover:text-[#171717]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {quickError && (
                <div className="p-2 rounded bg-red-50 text-red-700 text-xs">
                  {quickError}
                </div>
              )}

              <form onSubmit={handleQuickBlockerSubmit} className="space-y-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">
                    Blocker Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Awaiting client API keys or staging endpoint"
                    value={quickReason}
                    onChange={(e) => setQuickReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#E8E4DD] rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[#171717] mb-1">
                      Responsible Party <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={quickParty}
                      onChange={(e) => setQuickParty(e.target.value as BlockerParty)}
                      className="w-full px-2 py-1.5 border border-[#E8E4DD] rounded-lg"
                    >
                      <option value="Client">Client</option>
                      <option value="Team Member">Team Member</option>
                      <option value="External">External</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#171717] mb-1">
                      Responsible Owner <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Sterling"
                      value={quickOwner}
                      onChange={(e) => setQuickOwner(e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#E8E4DD] rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E4DD]">
                  <button
                    type="button"
                    onClick={() => setBlockingPromptTaskId(null)}
                    className="px-3 py-1.5 text-xs text-[#737373]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-[#9B1C1C] text-white rounded-lg shadow-xs"
                  >
                    Confirm Blocker
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E8E4DD] bg-[#FAF8F4] flex justify-end">
          <button
            onClick={closeProjectDetails}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
