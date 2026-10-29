import { reconcileDependencies } from '../data/dependencies';
import { useCloudPersistence } from './useCloudPersistence';
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  PageId,
  Project,
  Client,
  Task,
  ChangeRequest,
  TeamMember,
  Commitment,
  Dependency,
  ActionItem,
  SmartActionItem,
  BlockerParty,
  HandoverGate,
  ProjectStatus,
  ProjectStage,
  OnboardingChecklist,
  HandoverChecklist,
  StageGateValidation,
  ProjectReadiness,
  TaskStatus,
  CommitmentStatus,
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_CHANGE_REQUESTS,
  INITIAL_TEAM,
  INITIAL_COMMITMENTS,
  INITIAL_DEPENDENCIES,
  INITIAL_ACTION_ITEMS,
  INITIAL_HANDOVERS,
} from '../data/initialData';

const STORAGE_KEY = 'flowguard_v4_store';

export interface CalculatedTeamMember extends TeamMember {
  estimatedActiveHours: number;
  availableCapacity: number;
  utilizationPercent: number;
  overdueCount: number;
  blockedCount: number;
  activeTasks: Task[];
}

interface FlowGuardContextType {
  persistence: ReturnType<typeof useCloudPersistence>;
  localSaveError: string;
  workflowError: string;

  activePage: PageId;
  setActivePage: (page: PageId) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Modals & Navigation
  selectedProjectId: string | null;
  openProjectDetails: (id: string, tab?: 'tasks' | 'onboarding' | 'gates') => void;
  projectDetailTab: 'tasks' | 'onboarding' | 'gates';
  closeProjectDetails: () => void;
  isNewProjectModalOpen: boolean;
  setIsNewProjectModalOpen: (open: boolean) => void;
  isNewClientModalOpen: boolean;
  setIsNewClientModalOpen: (open: boolean) => void;
  isNewTaskModalOpen: boolean;
  setIsNewTaskModalOpen: (open: boolean) => void;
  isNewChangeRequestModalOpen: boolean;
  setIsNewChangeRequestModalOpen: (open: boolean) => void;

  // Data collections
  projects: Project[];
  clients: Client[];
  tasks: Task[];
  changeRequests: ChangeRequest[];
  team: TeamMember[];
  calculatedTeam: CalculatedTeamMember[];
  commitments: Commitment[];
  dependencies: Dependency[];
  actionItems: ActionItem[];
  smartActionItems: SmartActionItem[];
  handovers: HandoverGate[];

  // Mutators
  createProject: (data: Omit<Project, 'id' | 'spentBudget' | 'spentHours' | 'stage'> & { stage?: ProjectStage }) => void;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => void;
  updateProjectProgress: (projectId: string, progress: number) => void;
  createClient: (data: Omit<Client, 'id' | 'totalSpend' | 'joinedDate'>) => void;
  
  // Task Management
  createTask: (data: Omit<Task, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  reassignTask: (taskId: string, newAssignee: string) => void;
  toggleTaskDone: (taskId: string) => void;
  markTaskBlocked: (taskId: string, reason: string, owner: string, party: BlockerParty) => void;
  resolveTaskBlocker: (taskId: string, newStatus?: TaskStatus) => void;
  toggleTaskBlocked: (taskId: string, reason?: string, blockerOwner?: string, party?: BlockerParty) => void;

  // Dependency helpers
  wouldCreateCycle: (taskId: string, prereqId: string) => boolean;
  getPrerequisiteStatus: (task: Task) => { isWaiting: boolean; prereqTask?: Task };
  getDownstreamTasks: (taskId: string) => Task[];
  getCalculatedProjectProgress: (projectId: string) => number;

  // Scope Control Operations
  createChangeRequest: (data: Omit<ChangeRequest, 'id' | 'dateRequested'>) => void;
  updateChangeRequestStatus: (id: string, status: 'Approved' | 'Rejected' | 'Pending', reviewer: string) => void;
  convertChangeRequestToTask: (changeRequestId: string, assignee?: string) => void;

  // Team Workload Operations
  updateTeamMemberCapacity: (memberId: string, maxWeeklyHours: number) => void;

  // Commitments Operations
  createCommitment: (data: Omit<Commitment, 'id'>) => void;
  updateCommitment: (id: string, updates: Partial<Commitment>) => void;
  fulfillCommitment: (id: string) => void;

  // Prompt 4: Smart Client Onboarding, Stage Gates, Readiness, Handover
  updateOnboardingChecklist: (projectId: string, updates: Partial<OnboardingChecklist>) => void;
  updateHandoverChecklist: (projectId: string, updates: Partial<HandoverChecklist>) => void;
  setProjectReviewApproved: (projectId: string, approved: boolean) => void;
  validateStageTransition: (projectId: string, targetStage: ProjectStage) => StageGateValidation;
  advanceProjectStage: (projectId: string, targetStage: ProjectStage) => { success: boolean; error?: string; missingRequirements?: string[] };
  getProjectReadinessScore: (projectId: string) => ProjectReadiness;

  resolveActionItem: (id: string) => void;
  initializeHandover: (projectId: string) => void;
  toggleHandoverGate: (handoverId: string, gateKey: keyof HandoverGate['gates']) => void;
  createDependency: (data: Dependency) => void;
  resolveDependency: (id: string) => void;
  resetToDemoData: () => void;

  // Calculated Metrics
  activeProjectsCount: number;
  tasksDueSoonCount: number;
  blockedTasksCount: number;
  pendingApprovalsCount: number;
  actionCenterCount: number;
}

const FlowGuardContext = createContext<FlowGuardContextType | undefined>(undefined);

export const FlowGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Capture raw legacy values before existing initialization/migration can change them.
  useState(() => {
    try {
      if (!localStorage.getItem('flowguard_pre_cloud_backup')) {
        const raw: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && /^flowguard_v[1-4]_store_/.test(key)) raw[key] = localStorage.getItem(key)!;
        }
        localStorage.setItem('flowguard_pre_cloud_backup', JSON.stringify(raw));
      }
    } catch { /* The visible persistence warning handles unavailable storage. */ }
    return true;
  });
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [workflowError, setWorkflowError] = useState('');
  const [projectDetailTab, setProjectDetailTab] = useState<'tasks' | 'onboarding' | 'gates'>('tasks');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewChangeRequestModalOpen, setIsNewChangeRequestModalOpen] = useState(false);

  const migrateProject = (p: Project): Project => {
    const stage: ProjectStage =
      p.stage ||
      (p.status === 'Completed' ? 'Completed' : p.status === 'Review' ? 'Review' : 'Execution');
    const defaultOnboarding: OnboardingChecklist = {
      clientContactConfirmed: true,
      objectivesDefined: true,
      requirementsDocumented: true,
      scopeConfirmed: true,
      budgetConfirmed: true,
      deadlineAgreed: true,
      projectOwnerAssigned: Boolean(p.owner),
      requiredAssetsReceived: stage !== 'Onboarding',
      kickoffApprovalReceived: stage !== 'Onboarding',
      notes: 'Onboarding records initialized.',
      updatedAt: '2026-10-01',
    };
    const defaultHandover: HandoverChecklist = {
      finalDeliverablesPrepared: stage === 'Completed',
      documentationPrepared: stage === 'Completed',
      credentialsTransferred: stage === 'Completed',
      clientReviewCompleted: stage === 'Completed' || stage === 'Delivery' || Boolean(p.reviewApproved),
      finalClientAcceptance: stage === 'Completed',
      notes: 'Handover records initialized.',
      updatedAt: '2026-10-15',
    };

    return {
      ...p,
      stage,
      onboardingChecklist: p.onboardingChecklist ? { ...defaultOnboarding, ...p.onboardingChecklist } : defaultOnboarding,
      handoverChecklist: p.handoverChecklist ? { ...defaultHandover, ...p.handoverChecklist } : defaultHandover,
      reviewApproved: p.reviewApproved ?? (stage === 'Delivery' || stage === 'Completed'),
    };
  };

  // Initialize from LocalStorage or Defaults
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved =
        localStorage.getItem(`${STORAGE_KEY}_projects`) ||
        localStorage.getItem('flowguard_v3_store_projects') ||
        localStorage.getItem('flowguard_v2_store_projects') ||
        localStorage.getItem('flowguard_v1_store_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        const migrated = parsed.map(migrateProject);
        return migrated;
      }
      return INITIAL_PROJECTS.map(migrateProject);
    } catch {
      return INITIAL_PROJECTS.map(migrateProject);
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_clients`) || localStorage.getItem('flowguard_v3_store_clients') || localStorage.getItem('flowguard_v2_store_clients') || localStorage.getItem('flowguard_v1_store_clients');
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`) || localStorage.getItem('flowguard_v3_store_tasks') || localStorage.getItem('flowguard_v2_store_tasks') || localStorage.getItem('flowguard_v1_store_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure estimatedHours is populated
        return parsed.map((t: Task) => ({
          ...t,
          estimatedHours: t.estimatedHours ?? 8,
        }));
      }
      return INITIAL_TASKS.map((t) => ({ ...t, estimatedHours: t.estimatedHours ?? 8 }));
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_change_requests`) || localStorage.getItem('flowguard_v3_store_change_requests') || localStorage.getItem('flowguard_v2_store_change_requests') || localStorage.getItem('flowguard_v1_store_change_requests');
      return saved ? JSON.parse(saved) : INITIAL_CHANGE_REQUESTS;
    } catch {
      return INITIAL_CHANGE_REQUESTS;
    }
  });

  const [team, setTeam] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_team`) || localStorage.getItem('flowguard_v3_store_team') || localStorage.getItem('flowguard_v2_store_team') || localStorage.getItem('flowguard_v1_store_team');
      return saved ? JSON.parse(saved) : INITIAL_TEAM;
    } catch {
      return INITIAL_TEAM;
    }
  });

  const [commitments, setCommitments] = useState<Commitment[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_commitments`) || localStorage.getItem('flowguard_v3_store_commitments') || localStorage.getItem('flowguard_v2_store_commitments') || localStorage.getItem('flowguard_v1_store_commitments');
      return saved ? JSON.parse(saved) : INITIAL_COMMITMENTS;
    } catch {
      return INITIAL_COMMITMENTS;
    }
  });

  const [storedDependencies, setDependencies] = useState<Dependency[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_dependencies`) || localStorage.getItem('flowguard_v3_store_dependencies') || localStorage.getItem('flowguard_v2_store_dependencies') || localStorage.getItem('flowguard_v1_store_dependencies');
      return saved ? JSON.parse(saved) : INITIAL_DEPENDENCIES;
    } catch {
      return INITIAL_DEPENDENCIES;
    }
  });

  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_action_items`) || localStorage.getItem('flowguard_v3_store_action_items') || localStorage.getItem('flowguard_v2_store_action_items') || localStorage.getItem('flowguard_v1_store_action_items');
      return saved ? JSON.parse(saved) : INITIAL_ACTION_ITEMS;
    } catch {
      return INITIAL_ACTION_ITEMS;
    }
  });

  const [handovers, setHandovers] = useState<HandoverGate[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_handovers`) || localStorage.getItem('flowguard_v3_store_handovers') || localStorage.getItem('flowguard_v2_store_handovers') || localStorage.getItem('flowguard_v1_store_handovers');
      return saved ? JSON.parse(saved) : INITIAL_HANDOVERS;
    } catch {
      return INITIAL_HANDOVERS;
    }
  });

  const dependencies = useMemo(() => reconcileDependencies(storedDependencies, tasks), [storedDependencies, tasks]);

  // Retain generated records as resolved history after their task is unblocked/deleted.
  useEffect(() => {
    setDependencies(previous => JSON.stringify(previous) === JSON.stringify(dependencies) ? previous : dependencies);
  }, [dependencies]);

  const [localSaveError, setLocalSaveError] = useState('');
  const persistence = useCloudPersistence(
    { projects, clients, tasks, changeRequests, team, commitments, dependencies, actionItems, handovers },
    value => {
      setProjects(value.projects); setClients(value.clients); setTasks(value.tasks);
      setChangeRequests(value.changeRequests); setTeam(value.team); setCommitments(value.commitments);
      setDependencies(value.dependencies); setActionItems(value.actionItems); setHandovers(value.handovers);
    }
  );

  // Persist whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_projects`, JSON.stringify(projects));
      localStorage.setItem(`${STORAGE_KEY}_clients`, JSON.stringify(clients));
      localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
      localStorage.setItem(`${STORAGE_KEY}_change_requests`, JSON.stringify(changeRequests));
      localStorage.setItem(`${STORAGE_KEY}_team`, JSON.stringify(team));
      localStorage.setItem(`${STORAGE_KEY}_commitments`, JSON.stringify(commitments));
      localStorage.setItem(`${STORAGE_KEY}_dependencies`, JSON.stringify(dependencies));
      localStorage.setItem(`${STORAGE_KEY}_action_items`, JSON.stringify(actionItems));
      localStorage.setItem(`${STORAGE_KEY}_handovers`, JSON.stringify(handovers));
      setLocalSaveError('');
    } catch (e) {
      setLocalSaveError('Browser save failed. Export a backup before closing this page.');
      console.warn('LocalStorage save failed:', e);
    }
  }, [projects, clients, tasks, changeRequests, team, commitments, dependencies, actionItems, handovers]);

  // Dynamic progress calculation: derive project progress from actual completed tasks
  const getCalculatedProjectProgress = (projectId: string): number => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    if (projectTasks.length === 0) {
      const p = projects.find((proj) => proj.id === projectId);
      return p ? p.progress : 0;
    }
    const completedCount = projectTasks.filter(
      (t) => t.status === 'Completed' || t.status === 'Done'
    ).length;
    return Math.round((completedCount / projectTasks.length) * 100);
  };

  // Dynamic Workload Calculation from real assigned active tasks
  const calculatedTeam = useMemo<CalculatedTeamMember[]>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return team.map((member) => {
      const memberTasks = tasks.filter((t) => t.assignee === member.name);
      const activeTasks = memberTasks.filter(
        (t) => t.status !== 'Completed' && t.status !== 'Done'
      );
      const estimatedActiveHours = activeTasks.reduce(
        (sum, t) => sum + (t.estimatedHours || 8),
        0
      );
      const capacity = member.maxWeeklyHours || 40;
      const utilizationPercent = Math.round((estimatedActiveHours / capacity) * 100);
      const availableCapacity = Math.max(0, capacity - estimatedActiveHours);
      const overdueCount = activeTasks.filter((t) => t.dueDate < todayStr).length;
      const blockedCount = activeTasks.filter((t) => t.isBlocked).length;
      const status: 'Optimal' | 'At Capacity' | 'Overloaded' =
        utilizationPercent > 100
          ? 'Overloaded'
          : utilizationPercent >= 85
          ? 'At Capacity'
          : 'Optimal';

      const activeProjects = Array.from(new Set(activeTasks.map((t) => t.projectName)));

      return {
        ...member,
        assignedHours: estimatedActiveHours,
        activeTasksCount: activeTasks.length,
        estimatedActiveHours,
        availableCapacity,
        utilizationPercent,
        overdueCount,
        blockedCount,
        status,
        activeProjects: activeProjects.length > 0 ? activeProjects : member.activeProjects,
        activeTasks,
      };
    });
  }, [team, tasks]);

  // Dependency Helpers
  const wouldCreateCycle = (taskId: string, prereqId: string): boolean => {
    if (taskId === prereqId) return true;
    let curr = tasks.find((t) => t.id === prereqId);
    const visited = new Set<string>();
    while (curr && curr.dependsOnTaskId) {
      if (curr.dependsOnTaskId === taskId) return true;
      if (visited.has(curr.dependsOnTaskId)) break;
      visited.add(curr.dependsOnTaskId);
      curr = tasks.find((t) => t.id === curr!.dependsOnTaskId);
    }
    return false;
  };

  const getPrerequisiteStatus = (task: Task): { isWaiting: boolean; prereqTask?: Task } => {
    if (!task.dependsOnTaskId) return { isWaiting: false };
    const prereq = tasks.find((t) => t.id === task.dependsOnTaskId);
    if (!prereq) return { isWaiting: false };
    const isPrereqDone = prereq.status === 'Completed' || prereq.status === 'Done';
    return { isWaiting: !isPrereqDone, prereqTask: prereq };
  };

  const getDownstreamTasks = (taskId: string): Task[] => {
    return tasks.filter((t) => t.dependsOnTaskId === taskId);
  };

  // Prompt 4: Stage Gate & Readiness Invariants
  const validateStageTransition = (projectId: string, targetStage: ProjectStage): StageGateValidation => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      return {
        allowed: false,
        currentStage: 'Onboarding',
        targetStage,
        missingRequirements: ['Project not found'],
        metRequirements: [],
      };
    }

    const STAGES: ProjectStage[] = ['Onboarding', 'Planning', 'Execution', 'Review', 'Delivery', 'Completed'];
    const currIdx = STAGES.indexOf(project.stage);
    const targetIdx = STAGES.indexOf(targetStage);

    if (targetIdx !== currIdx + 1) {
      return {
        allowed: false,
        currentStage: project.stage,
        targetStage,
        missingRequirements: [`Transitions must advance stage-by-stage (${project.stage} → ${STAGES[currIdx + 1] || 'None'}).`],
        metRequirements: [],
      };
    }

    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    const missingRequirements: string[] = [];
    const metRequirements: string[] = [];

    // Stage Gate 1: Onboarding -> Planning
    if (project.stage === 'Onboarding' && targetStage === 'Planning') {
      const ob = project.onboardingChecklist;
      if (!ob) {
        missingRequirements.push('Onboarding checklist is not initialized.');
      } else {
        if (ob.clientContactConfirmed) metRequirements.push('Client contact confirmed');
        else missingRequirements.push('Client contact confirmation required');

        if (ob.objectivesDefined) metRequirements.push('Project objectives defined');
        else missingRequirements.push('Project objectives must be defined');

        if (ob.requirementsDocumented) metRequirements.push('Project requirements documented');
        else missingRequirements.push('Project requirements documentation required');

        if (ob.scopeConfirmed) metRequirements.push('Scope confirmed');
        else missingRequirements.push('Scope confirmation required');

        if (ob.budgetConfirmed) metRequirements.push('Budget confirmed');
        else missingRequirements.push('Commercial budget confirmation required');

        if (ob.deadlineAgreed) metRequirements.push('Target deadline agreed');
        else missingRequirements.push('Delivery deadline agreement required');

        if (ob.projectOwnerAssigned && project.owner) metRequirements.push(`Project owner assigned (${project.owner})`);
        else missingRequirements.push('Project owner must be assigned');

        if (ob.requiredAssetsReceived) metRequirements.push('Required client assets received');
        else missingRequirements.push('Required client brand assets & access pending');

        if (ob.kickoffApprovalReceived) metRequirements.push('Kickoff approval received');
        else missingRequirements.push('Kickoff meeting and formal sign-off required');
      }
    }

    // Stage Gate 2: Planning -> Execution
    else if (project.stage === 'Planning' && targetStage === 'Execution') {
      if (project.owner && project.owner.trim()) {
        metRequirements.push(`Project owner assigned (${project.owner})`);
      } else {
        missingRequirements.push('Project owner must be designated before execution.');
      }

      if (project.description && project.description.trim() && project.scopeStatus !== 'Scope Creep Alert') {
        metRequirements.push('Project contractual scope confirmed');
      } else {
        if (!project.description?.trim()) missingRequirements.push('Project scope description must be documented.');
        if (project.scopeStatus === 'Scope Creep Alert') missingRequirements.push('Unresolved scope creep alert must be resolved.');
      }

      if (projectTasks.length >= 1) {
        metRequirements.push(`Initial task plan defined (${projectTasks.length} task${projectTasks.length > 1 ? 's' : ''})`);
      } else {
        missingRequirements.push('At least one task must be created to begin execution.');
      }
    }

    // Stage Gate 3: Execution -> Review
    else if (project.stage === 'Execution' && targetStage === 'Review') {
      if (projectTasks.length === 0) {
        missingRequirements.push('Project has no tasks defined.');
      } else {
        const completedTasks = projectTasks.filter((t) => t.status === 'Completed' || t.status === 'Done');
        const incompleteCount = projectTasks.length - completedTasks.length;
        if (incompleteCount === 0) {
          metRequirements.push(`All ${projectTasks.length} project tasks completed`);
        } else {
          missingRequirements.push(`${incompleteCount} of ${projectTasks.length} tasks remain incomplete.`);
        }
      }

      const blockedTasks = projectTasks.filter((t) => t.isBlocked);
      if (blockedTasks.length === 0) {
        metRequirements.push('Zero unresolved critical blockers');
      } else {
        missingRequirements.push(`${blockedTasks.length} task${blockedTasks.length > 1 ? 's' : ''} currently marked Blocked.`);
      }
    }

    // Stage Gate 4: Review -> Delivery
    else if (project.stage === 'Review' && targetStage === 'Delivery') {
      const hasReviewApproval = Boolean(project.reviewApproved || project.handoverChecklist?.clientReviewCompleted);
      if (hasReviewApproval) {
        metRequirements.push('Formal review approval and client milestone recorded');
      } else {
        missingRequirements.push('Formal review approval must be recorded by client stakeholder.');
      }

      const blockedTasks = projectTasks.filter((t) => t.isBlocked);
      if (blockedTasks.length === 0) {
        metRequirements.push('Zero active blockers');
      } else {
        missingRequirements.push(`${blockedTasks.length} unresolved task blocker(s) present.`);
      }
    }

    // Stage Gate 5: Delivery -> Completed
    else if (project.stage === 'Delivery' && targetStage === 'Completed') {
      // 4 Automated Checks:
      const completedTasks = projectTasks.filter((t) => t.status === 'Completed' || t.status === 'Done');
      if (projectTasks.length > 0 && completedTasks.length === projectTasks.length) {
        metRequirements.push('All project tasks completed');
      } else {
        missingRequirements.push('All project tasks must be in Completed/Done status.');
      }

      const blockedTasks = projectTasks.filter((t) => t.isBlocked);
      if (blockedTasks.length === 0) {
        metRequirements.push('Zero unresolved critical blockers');
      } else {
        missingRequirements.push(`${blockedTasks.length} unresolved task blocker(s) remaining.`);
      }

      const pendingCRs = changeRequests.filter((cr) => cr.projectId === projectId && (cr.status === 'Pending' || cr.status === 'Pending Approval'));
      if (pendingCRs.length === 0) {
        metRequirements.push('All scope change requests accounted for (0 pending)');
      } else {
        missingRequirements.push(`${pendingCRs.length} scope change request(s) pending approval.`);
      }

      const overdueCommitments = commitments.filter(cm => cm.projectId === projectId && cm.status !== 'Fulfilled' && cm.status !== 'Delivered' && (cm.status === 'Overdue' || cm.status === 'At Risk' || (cm.dueDate || cm.committedDeadline) < new Date().toLocaleDateString('en-CA')));
      if (overdueCommitments.length === 0) {
        metRequirements.push('All client commitments fulfilled or verified');
      } else {
        missingRequirements.push(`${overdueCommitments.length} client commitment(s) overdue or at risk.`);
      }

      const delivery = handovers.find(h => h.projectId === projectId);
      if (delivery && Object.values(delivery.gates).every(Boolean)) metRequirements.push('All five delivery verification gates passed');
      else missingRequirements.push('All five delivery verification gates must be confirmed in Handover.');

      // 5 Manual Confirmations:
      const hc = project.handoverChecklist;
      if (hc?.finalDeliverablesPrepared) metRequirements.push('Final deliverables prepared & QA sign-off');
      else missingRequirements.push('Final deliverables and QA sign-off confirmation required');

      if (hc?.documentationPrepared) metRequirements.push('Technical & user documentation prepared');
      else missingRequirements.push('Technical & user documentation preparation required');

      if (hc?.credentialsTransferred) metRequirements.push('Credentials & cloud infrastructure transferred');
      else missingRequirements.push('Credentials & cloud access transfer required');

      if (hc?.clientReviewCompleted) metRequirements.push('Client delivery review session completed');
      else missingRequirements.push('Client delivery review session confirmation required');

      if (hc?.finalClientAcceptance) metRequirements.push('Final written client acceptance recorded');
      else missingRequirements.push('Final written client acceptance sign-off required');
    }

    return {
      allowed: missingRequirements.length === 0,
      currentStage: project.stage,
      targetStage,
      missingRequirements,
      metRequirements,
    };
  };

  const getProjectReadinessScore = (projectId: string): ProjectReadiness => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      return {
        score: 0,
        label: 'Project Not Found',
        currentStage: 'Onboarding',
        nextStage: null,
        metCount: 0,
        totalCount: 0,
        missingRequirements: [],
        metRequirements: [],
      };
    }

    const STAGES: ProjectStage[] = ['Onboarding', 'Planning', 'Execution', 'Review', 'Delivery', 'Completed'];
    const currIdx = STAGES.indexOf(project.stage);
    const nextStage = currIdx < STAGES.length - 1 ? STAGES[currIdx + 1] : null;

    if (project.stage === 'Completed' || !nextStage) {
      return {
        score: 100,
        label: 'Delivered & Completed',
        currentStage: 'Completed',
        nextStage: null,
        metCount: 10,
        totalCount: 10,
        missingRequirements: [],
        metRequirements: ['All lifecycle stages and quality gates verified'],
      };
    }

    const validation = validateStageTransition(projectId, nextStage);
    const totalCount = validation.metRequirements.length + validation.missingRequirements.length;
    const metCount = validation.metRequirements.length;
    const score = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

    let label = '';
    if (project.stage === 'Onboarding') {
      label = score === 100 ? 'Ready for Planning' : `${validation.missingRequirements.length} Onboarding Items Missing`;
    } else if (project.stage === 'Planning') {
      label = score === 100 ? 'Ready for Execution' : `${validation.missingRequirements.length} Gate Criteria Remaining`;
    } else if (project.stage === 'Execution') {
      const hasBlockers = tasks.some((t) => t.projectId === projectId && t.isBlocked);
      label = score === 100 ? 'Ready for Review' : hasBlockers ? 'Blocked by Unresolved Tasks' : `${validation.missingRequirements.length} Task Gates Incomplete`;
    } else if (project.stage === 'Review') {
      label = score === 100 ? 'Ready for Delivery' : validation.missingRequirements.some((m) => m.includes('Blocker')) ? 'Blocked by QA Issues' : 'Awaiting Review Approval';
    } else if (project.stage === 'Delivery') {
      label = score === 100 ? 'Ready for Handover' : `${validation.missingRequirements.length} Handover Checks Pending`;
    }

    return {
      score,
      label,
      currentStage: project.stage,
      nextStage,
      metCount,
      totalCount,
      missingRequirements: validation.missingRequirements,
      metRequirements: validation.metRequirements,
    };
  };

  const advanceProjectStage = (projectId: string, targetStage: ProjectStage) => {
    const validation = validateStageTransition(projectId, targetStage);
    if (!validation.allowed) {
      return {
        success: false,
        error: 'Mandatory stage gate requirements are not satisfied.',
        missingRequirements: validation.missingRequirements,
      };
    }

    setWorkflowError('');
    const todayStr = new Date().toISOString().split('T')[0];
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const transitions = p.stageTransitions || [];
          return {
            ...p,
            stage: targetStage,
            status: targetStage === 'Completed' ? 'Completed' : p.status === 'Completed' ? 'On Track' : p.status,
            progress: targetStage === 'Completed' ? 100 : p.progress,
            stageTransitions: [...transitions, { stage: targetStage, date: todayStr }],
          };
        }
        return p;
      })
    );

    return { success: true };
  };

  const updateOnboardingChecklist = (projectId: string, updates: Partial<OnboardingChecklist>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const existing = p.onboardingChecklist || {
            clientContactConfirmed: false,
            objectivesDefined: false,
            requirementsDocumented: false,
            scopeConfirmed: false,
            budgetConfirmed: false,
            deadlineAgreed: false,
            projectOwnerAssigned: Boolean(p.owner),
            requiredAssetsReceived: false,
            kickoffApprovalReceived: false,
          };
          return {
            ...p,
            onboardingChecklist: {
              ...existing,
              ...updates,
              updatedAt: new Date().toISOString().split('T')[0],
            },
          };
        }
        return p;
      })
    );
  };

  const updateHandoverChecklist = (projectId: string, updates: Partial<HandoverChecklist>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const existing = p.handoverChecklist || {
            finalDeliverablesPrepared: false,
            documentationPrepared: false,
            credentialsTransferred: false,
            clientReviewCompleted: false,
            finalClientAcceptance: false,
          };
          return {
            ...p,
            handoverChecklist: {
              ...existing,
              ...updates,
              updatedAt: new Date().toISOString().split('T')[0],
            },
          };
        }
        return p;
      })
    );
  };

  const setProjectReviewApproved = (projectId: string, approved: boolean) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            reviewApproved: approved,
            reviewApprovedDate: approved ? new Date().toISOString().split('T')[0] : undefined,
            handoverChecklist: p.handoverChecklist
              ? {
                  ...p.handoverChecklist,
                  clientReviewCompleted: approved,
                }
              : undefined,
          };
        }
        return p;
      })
    );
  };

  // Smart Action Center Generator from actual live application data
  const smartActionItems = useMemo<SmartActionItem[]>(() => {
    const items: SmartActionItem[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Explicitly Blocked Tasks
    tasks.forEach((t) => {
      const isDone = t.status === 'Completed' || t.status === 'Done';
      if (t.isBlocked && !isDone) {
        let category: SmartActionItem['category'] = 'Waiting on Client';
        if (t.blockerParty === 'Team Member') category = 'Agency Action';
        else if (t.blockerParty === 'External') category = 'External Dependencies';
        else category = 'Waiting on Client';

        items.push({
          id: `act-blocker-${t.id}`,
          type: 'blocked_task',
          category,
          severity: t.priority === 'Urgent' ? 'Urgent' : 'High',
          title: `Blocked: ${t.title}`,
          description: t.blockerReason || 'Work is blocked by an unresolved dependency.',
          projectId: t.projectId,
          projectName: t.projectName,
          taskId: t.id,
          owner: t.blockerOwner || (t.blockerParty === 'Client' ? 'Client POC' : t.assignee),
          reason: t.blockerReason || 'Unresolved blocker',
          recommendedAction:
            category === 'Waiting on Client'
              ? 'Escalate request to client lead'
              : category === 'External Dependencies'
              ? 'Follow up on external dependency'
              : 'Reassign or unblock internal dependency',
          actionLabel: 'Resolve Blocker',
        });
      }
    });

    // 2. Tasks Waiting on Incomplete Prerequisites (not already marked blocked)
    tasks.forEach((t) => {
      const isDone = t.status === 'Completed' || t.status === 'Done';
      if (!isDone && !t.isBlocked && t.dependsOnTaskId) {
        const prereq = tasks.find((p) => p.id === t.dependsOnTaskId);
        if (prereq && prereq.status !== 'Completed' && prereq.status !== 'Done') {
          items.push({
            id: `act-prereq-${t.id}`,
            type: 'waiting_prereq',
            category: !prereq.isBlocked || prereq.blockerParty === 'Team Member' ? 'Agency Action' : prereq.blockerParty === 'External' ? 'External Dependencies' : 'Waiting on Client',
            severity: t.priority === 'Urgent' ? 'Urgent' : 'Medium',
            title: `Waiting on Prerequisite: ${t.title}`,
            description: `Dependent on incomplete task "${prereq.title}" (${prereq.assignee}, Due: ${prereq.dueDate}).`,
            projectId: t.projectId,
            projectName: t.projectName,
            taskId: t.id,
            owner: prereq.assignee,
            reason: `Prerequisite "${prereq.title}" is in status "${prereq.status}".`,
            recommendedAction: `Expedite "${prereq.title}" to unlock downstream work.`,
            actionLabel: 'Inspect Task',
          });
        }
      }
    });

    // 3. Pending Scope Approvals (Change Requests)
    changeRequests.forEach((cr) => {
      if (cr.status === 'Pending' || cr.status === 'Pending Approval') {
        items.push({
          id: `act-cr-${cr.id}`,
          type: 'pending_approval',
          category: 'Waiting on Client',
          severity: 'High',
          title: `Scope Sign-Off: ${cr.title}`,
          description: `Change request for ${cr.projectName} (+${cr.impactHours}h, $${cr.impactBudget.toLocaleString()}) awaits review.`,
          projectId: cr.projectId,
          projectName: cr.projectName,
          owner: cr.requestedBy,
          reason: 'Scope expansion approval pending',
          recommendedAction: 'Obtain formal written client sign-off or reject scope addition.',
          actionLabel: 'Review Scope',
        });
      }
    });

    // 4. Overdue Tasks
    tasks.forEach((t) => {
      const isDone = t.status === 'Completed' || t.status === 'Done';
      if (!isDone && !t.isBlocked && t.dueDate < todayStr) {
        items.push({
          id: `act-overdue-${t.id}`,
          type: 'overdue_task',
          category: 'Agency Action',
          severity: 'High',
          title: `Overdue Task: ${t.title}`,
          description: `Scheduled for delivery on ${t.dueDate} but remains in ${t.status}.`,
          projectId: t.projectId,
          projectName: t.projectName,
          taskId: t.id,
          owner: t.assignee,
          reason: `Target due date (${t.dueDate}) has passed.`,
          recommendedAction: 'Reassign or renegotiate deliverable schedule.',
          actionLabel: 'Update Task',
        });
      }
    });

    // 5. Overdue / At-Risk Client Commitments
    commitments.forEach((cm) => {
      const isOverdue = cm.status === 'Overdue' || (cm.status !== 'Fulfilled' && cm.status !== 'Delivered' && cm.committedDeadline < todayStr);
      if (cm.status === 'At Risk' || isOverdue) {
        items.push({
          id: `act-cm-${cm.id}`,
          type: 'overdue_commitment',
          category: cm.confidence === 'Critical Risk' ? 'Agency Action' : 'Waiting on Client',
          severity: 'Urgent',
          title: `SLA Commitment: ${cm.commitment}`,
          description: `Contractual delivery for ${cm.clientName} (${cm.committedDeadline}) is ${isOverdue ? 'Overdue' : 'At Risk'}.`,
          projectId: cm.projectId,
          projectName: cm.projectName,
          owner: cm.responsibleMember || cm.owner,
          reason: cm.slaTerms || 'Contract SLA milestone commitment',
          recommendedAction: isOverdue ? 'Expedite delivery or notify client of adjustment.' : 'Engage client executive sponsor on milestone remediation.',
          actionLabel: 'View Commitment',
        });
      }
    });

    // 6. Overloaded Team Members (Workload > 100%)
    calculatedTeam.forEach((member) => {
      if (member.utilizationPercent > 100) {
        items.push({
          id: `act-overload-${member.id}`,
          type: 'overloaded_member',
          category: 'Agency Action',
          severity: 'Urgent',
          title: `Capacity Strain: ${member.name} (${member.utilizationPercent}%)`,
          description: `${member.name} is assigned ${member.estimatedActiveHours}h across ${member.activeTasksCount} active tasks against a weekly limit of ${member.maxWeeklyHours}h.`,
          owner: member.name,
          reason: `${member.estimatedActiveHours - member.maxWeeklyHours}h in excess of weekly threshold.`,
          recommendedAction: 'Rebalance tasks in Team Workload to prevent delivery slippage.',
          actionLabel: 'Rebalance Tasks',
        });
      }
    });

    // 7. Smart Client Onboarding Incomplete Alerts
    projects.forEach((p) => {
      if (p.stage === 'Onboarding') {
        const readiness = getProjectReadinessScore(p.id);
        if (readiness.missingRequirements.length > 0) {
          items.push({
            id: `act-onboarding-${p.id}`,
            type: 'missing_onboarding',
            category: 'Waiting on Client',
            severity: readiness.missingRequirements.length > 2 ? 'High' : 'Medium',
            title: `Onboarding Incomplete: ${p.name}`,
            description: `${readiness.missingRequirements.length} requirements missing before Planning (${readiness.missingRequirements.slice(0, 2).join(', ')}${readiness.missingRequirements.length > 2 ? '...' : ''}).`,
            projectId: p.id,
            projectName: p.name,
            owner: p.owner,
            reason: 'Mandatory onboarding checklist incomplete',
            recommendedAction: 'Verify client assets, scope confirmation, and kickoff approval.',
            actionLabel: 'Complete Onboarding',
          });
        }
      }
    });

    // 8. Workflow Gate Blocked Alerts
    projects.forEach((p) => {
      if (p.stage === 'Review' && !p.reviewApproved) {
        items.push({
          id: `act-gate-review-${p.id}`,
          type: 'gate_blocked',
          category: 'Waiting on Client',
          severity: 'High',
          title: `Review Approval Gate: ${p.name}`,
          description: 'Project deliverables are pending client stakeholder milestone review and formal sign-off.',
          projectId: p.id,
          projectName: p.name,
          owner: p.owner,
          reason: 'Review stage gate approval required before Delivery',
          recommendedAction: 'Record client review sign-off in Project Details or Handover.',
          actionLabel: 'Verify Review Gate',
        });
      }
    });

    // 9. Delivery Handover Checks Pending Alerts
    projects.forEach((p) => {
      if (p.stage === 'Delivery') {
        const readiness = getProjectReadinessScore(p.id);
        if (readiness.missingRequirements.length > 0) {
          items.push({
            id: `act-delivery-${p.id}`,
            type: 'delivery_incomplete',
            category: 'Agency Action',
            severity: 'Urgent',
            title: `HandoffGuard Incomplete: ${p.name}`,
            description: `${readiness.missingRequirements.length} delivery checks pending before final client release.`,
            projectId: p.id,
            projectName: p.name,
            owner: p.owner,
            reason: 'Delivery invariant: all delivery and handover checks must pass',
            recommendedAction: 'Complete pending quality checks and manual verifications in HandoffGuard.',
            actionLabel: 'Review Handover',
          });
        }
      }
    });

    return items;
  }, [tasks, changeRequests, commitments, calculatedTeam, projects, handovers]);

  // Derived metrics
  const activeProjectsCount = useMemo(() => {
    return projects.filter((p) => p.status !== 'Completed').length;
  }, [projects]);

  const tasksDueSoonCount = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const limit = new Date(); limit.setDate(limit.getDate() + 7);
    const end = limit.toLocaleDateString('en-CA');
    return tasks.filter(t => t.status !== 'Completed' && t.status !== 'Done' && t.dueDate >= today && t.dueDate <= end).length;
  }, [tasks]);

  const blockedTasksCount = useMemo(() => {
    return tasks.filter((t) => t.isBlocked && t.status !== 'Completed' && t.status !== 'Done').length;
  }, [tasks]);

  const pendingApprovalsCount = useMemo(() => {
    return changeRequests.filter((cr) => cr.status === 'Pending' || cr.status === 'Pending Approval').length;
  }, [changeRequests]);

  const actionCenterCount = smartActionItems.length;

  const openProjectDetails = (id: string, tab: 'tasks' | 'onboarding' | 'gates' = 'tasks') => {
    setWorkflowError(''); setProjectDetailTab(tab);
    setSelectedProjectId(id);
  };

  const closeProjectDetails = () => {
    setSelectedProjectId(null);
  };

  const createProject = (data: Omit<Project, 'id' | 'spentBudget' | 'spentHours' | 'stage'> & { stage?: ProjectStage }) => {
    const newId = `p-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const newProj: Project = {
      ...data,
      id: newId,
      status: data.status === 'Completed' ? 'On Track' : data.status,
      spentBudget: 0,
      spentHours: 0,
      stage: data.stage || 'Onboarding',
      onboardingChecklist: data.onboardingChecklist || {
        clientContactConfirmed: true,
        objectivesDefined: true,
        requirementsDocumented: false,
        scopeConfirmed: false,
        budgetConfirmed: true,
        deadlineAgreed: true,
        projectOwnerAssigned: Boolean(data.owner),
        requiredAssetsReceived: false,
        kickoffApprovalReceived: false,
        notes: 'Initial client onboarding created.',
        updatedAt: todayStr,
      },
      handoverChecklist: data.handoverChecklist || {
        finalDeliverablesPrepared: false,
        documentationPrepared: false,
        credentialsTransferred: false,
        clientReviewCompleted: false,
        finalClientAcceptance: false,
        notes: 'Handover verification in progress.',
        updatedAt: todayStr,
      },
      stageTransitions: [
        { stage: data.stage || 'Onboarding', date: todayStr }
      ],
    };
    setProjects((prev) => [newProj, ...prev]);

    const newHandover: HandoverGate = {
      id: `h-${Date.now()}`,
      projectId: newId,
      projectName: newProj.name,
      targetDate: newProj.deadline,
      overallReadiness: 0,
      gates: {
        qaSignoff: false,
        clientSignoff: false,
        assetHandoff: false,
        infrastructureTransfer: false,
        finalBillingApproved: false,
      },
      status: 'Pending Gates',
    };
    setHandovers((prev) => [...prev, newHandover]);
  };

  const updateProjectStatus = (projectId: string, status: ProjectStatus) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    if (status === 'Completed' && project.stage !== 'Completed') {
      const result = advanceProjectStage(projectId, 'Completed');
      setWorkflowError(result.success ? '' : `Cannot complete project: ${result.missingRequirements?.join(' ') || result.error}`);
      return;
    }
    if (project.stage === 'Completed' && status !== 'Completed') {
      const stage: ProjectStage = status === 'Review' ? 'Review' : 'Execution';
      setProjects(previous => previous.map(p => p.id === projectId ? { ...p, status, stage,
        stageTransitions: [...(p.stageTransitions || []), { stage, date: new Date().toISOString().split('T')[0] }] } : p));
      setWorkflowError(''); return;
    }
    setWorkflowError('');
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status } : p))
    );
  };

  const updateProjectProgress = (projectId: string, progress: number) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, progress } : p))
    );
  };

  const createClient = (data: Omit<Client, 'id' | 'totalSpend' | 'joinedDate'>) => {
    const newClient: Client = {
      ...data,
      id: `c-${Date.now()}`,
      totalSpend: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setClients((prev) => [newClient, ...prev]);
  };

  // Task Management
  const createTask = (data: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...data,
      id: `t-${Date.now()}`,
      estimatedHours: data.estimatedHours ?? 8,
      progress: data.progress ?? (data.status === 'Completed' || data.status === 'Done' ? 100 : 0),
    };
    setTasks((prev) => [newTask, ...prev]);

  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, ...updates };
          if (updated.status === 'Completed' || updated.status === 'Done') {
            updated.isBlocked = false;
            updated.progress = 100;
          } else if (updated.status === 'Blocked') {
            updated.isBlocked = true;
          }
          if (!updated.isBlocked) {
            updated.blockerReason = undefined; updated.blockerOwner = undefined;
            updated.blockerParty = undefined; updated.blockedSince = undefined;
          } else updated.blockedSince ??= new Date().toISOString().split('T')[0];
          return updated;
        }
        return t;
      })
    );
  };

  const reassignTask = (taskId: string, newAssignee: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignee: newAssignee } : t))
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev
        .filter((t) => t.id !== taskId)
        .map((t) => (t.dependsOnTaskId === taskId ? { ...t, dependsOnTaskId: undefined } : t))
    );
  };

  const toggleTaskDone = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isNowDone = t.status !== 'Completed' && t.status !== 'Done';
          return {
            ...t,
            status: isNowDone ? 'Completed' : 'In Progress',
            progress: isNowDone ? 100 : 50,
            isBlocked: isNowDone ? false : t.isBlocked,
          };
        }
        return t;
      })
    );
  };

  const markTaskBlocked = (
    taskId: string,
    reason: string,
    owner: string,
    party: BlockerParty
  ) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'Blocked',
            isBlocked: true,
            blockerReason: reason,
            blockerOwner: owner,
            blockerParty: party,
            blockedSince: new Date().toISOString().split('T')[0],
          };
        }
        return t;
      })
    );

  };

  const resolveTaskBlocker = (taskId: string, newStatus: TaskStatus = 'In Progress') => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: newStatus,
            isBlocked: false,
            blockerReason: undefined,
            blockerOwner: undefined,
            blockerParty: undefined,
            blockedSince: undefined,
          };
        }
        return t;
      })
    );

  };

  const toggleTaskBlocked = (
    taskId: string,
    reason?: string,
    blockerOwner?: string,
    party?: BlockerParty
  ) => {
    const t = tasks.find((task) => task.id === taskId);
    if (!t) return;
    if (t.isBlocked) {
      resolveTaskBlocker(taskId, 'In Progress');
    } else {
      markTaskBlocked(
        taskId,
        reason || 'Work paused pending external input',
        blockerOwner || 'Client Lead',
        party || 'Client'
      );
    }
  };

  // Scope Control
  const createChangeRequest = (data: Omit<ChangeRequest, 'id' | 'dateRequested'>) => {
    const newCR: ChangeRequest = {
      ...data,
      id: `cr-${Date.now()}`,
      dateRequested: new Date().toISOString().split('T')[0],
      status: 'Pending',
    };
    setChangeRequests((prev) => [newCR, ...prev]);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === data.projectId ? { ...p, scopeStatus: 'Scope Creep Alert' } : p
      )
    );
  };

  const updateChangeRequestStatus = (
    id: string,
    status: 'Approved' | 'Rejected' | 'Pending',
    reviewer: string
  ) => {
    setChangeRequests((prev) =>
      prev.map((cr) => {
        if (cr.id === id) {
          return {
            ...cr,
            status,
            reviewedBy: reviewer,
            approvalDate: status === 'Approved' ? new Date().toISOString().split('T')[0] : cr.approvalDate,
          };
        }
        return cr;
      })
    );

    const targetCR = changeRequests.find((cr) => cr.id === id);
    if (targetCR && status === 'Approved') {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetCR.projectId) {
            return {
              ...p,
              allocatedHours: p.allocatedHours + targetCR.impactHours,
              budget: p.budget + targetCR.impactBudget,
              scopeStatus: 'Locked',
            };
          }
          return p;
        })
      );
    } else if (targetCR && status === 'Rejected') {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetCR.projectId) {
            return { ...p, scopeStatus: 'Locked' };
          }
          return p;
        })
      );
    }
  };

  const convertChangeRequestToTask = (changeRequestId: string, assignee?: string) => {
    const cr = changeRequests.find((c) => c.id === changeRequestId);
    if (!cr) return;
    if (cr.convertedToTaskId) {
      // Prevent duplicate conversion
      return;
    }

    const targetProj = projects.find((p) => p.id === cr.projectId);
    const chosenAssignee = assignee || team[0]?.name || 'Marcus Vance';

    const newTask: Task = {
      id: `t-cr-${Date.now()}`,
      projectId: cr.projectId,
      projectName: cr.projectName,
      title: `[Scope] ${cr.title}`,
      assignee: chosenAssignee,
      dueDate: targetProj?.deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'To Do',
      progress: 0,
      estimatedHours: cr.impactHours,
      isBlocked: false,
      priority: 'High',
    };

    setTasks((prev) => [newTask, ...prev]);

    // Update Change Request record to remember converted task ID
    setChangeRequests((prev) =>
      prev.map((c) => (c.id === changeRequestId ? { ...c, convertedToTaskId: newTask.id } : c))
    );
  };

  // Team Workload
  const updateTeamMemberCapacity = (memberId: string, maxWeeklyHours: number) => {
    setTeam((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, maxWeeklyHours } : m))
    );
  };

  // Commitments
  const createCommitment = (data: Omit<Commitment, 'id'>) => {
    const newEntry: Commitment = {
      ...data,
      id: `cm-${Date.now()}`,
    };
    setCommitments((prev) => [newEntry, ...prev]);
  };

  const updateCommitment = (id: string, updates: Partial<Commitment>) => {
    setCommitments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const fulfillCommitment = (id: string) => {
    setCommitments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'Fulfilled' } : c))
    );
  };

  const resolveActionItem = (id: string) => {
    if (id.startsWith('act-blocker-')) {
      const taskId = id.replace('act-blocker-', '');
      resolveTaskBlocker(taskId);
      return;
    }
    if (id.startsWith('act-cm-')) {
      const cmId = id.replace('act-cm-', '');
      fulfillCommitment(cmId);
      return;
    }
    setActionItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a))
    );
  };

  const createDependency = (data: Dependency) => setDependencies(prev => [{ ...data, source: 'manual' }, ...prev]);

  const resolveDependency = (id: string) => {
    const record = dependencies.find(d => d.id === id);
    if (record?.blockedTaskId && record.source === 'task_blocker') resolveTaskBlocker(record.blockedTaskId);
    setDependencies((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'Resolved' } : d))
    );
  };

  const initializeHandover = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    setHandovers(previous => previous.some(h => h.projectId === projectId) ? previous : [...previous, {
      id: `handover-${projectId}`, projectId, projectName: project.name, targetDate: project.deadline,
      overallReadiness: 0, status: 'Pending Gates',
      gates: { qaSignoff: false, clientSignoff: false, assetHandoff: false, infrastructureTransfer: false, finalBillingApproved: false },
    }]);
  };

  const toggleHandoverGate = (
    handoverId: string,
    gateKey: keyof HandoverGate['gates']
  ) => {
    setHandovers((prev) =>
      prev.map((h) => {
        if (h.id === handoverId) {
          const updatedGates = {
            ...h.gates,
            [gateKey]: !h.gates[gateKey],
          };
          const totalGates = Object.keys(updatedGates).length;
          const passedGates = Object.values(updatedGates).filter(Boolean).length;
          const readiness = Math.round((passedGates / totalGates) * 100);
          
          let newStatus: HandoverGate['status'] = 'Pending Gates';
          if (!updatedGates.qaSignoff) {
            newStatus = 'Blocked by QA';
          } else if (readiness === 100) {
            newStatus = 'Ready for Delivery';
          }

          return {
            ...h,
            gates: updatedGates,
            overallReadiness: readiness,
            status: newStatus,
          };
        }
        return h;
      })
    );
  };

  const resetToDemoData = () => {
    setProjects(INITIAL_PROJECTS);
    setClients(INITIAL_CLIENTS);
    setTasks(INITIAL_TASKS.map((t) => ({ ...t, estimatedHours: t.estimatedHours ?? 8 })));
    setChangeRequests(INITIAL_CHANGE_REQUESTS);
    setTeam(INITIAL_TEAM);
    setCommitments(INITIAL_COMMITMENTS);
    setDependencies(INITIAL_DEPENDENCIES);
    setActionItems(INITIAL_ACTION_ITEMS);
    setHandovers(INITIAL_HANDOVERS);
    // Keep authentication, legacy records, and pre-migration backups intact.
  };

  return (
    <FlowGuardContext.Provider
      value={{
        persistence, localSaveError, workflowError, projectDetailTab,
        activePage,
        setActivePage,
        searchQuery,
        setSearchQuery,
        selectedProjectId,
        openProjectDetails,
        closeProjectDetails,
        isNewProjectModalOpen,
        setIsNewProjectModalOpen,
        isNewClientModalOpen,
        setIsNewClientModalOpen,
        isNewTaskModalOpen,
        setIsNewTaskModalOpen,
        isNewChangeRequestModalOpen,
        setIsNewChangeRequestModalOpen,
        projects,
        clients,
        tasks,
        changeRequests,
        team,
        calculatedTeam,
        commitments,
        dependencies,
        actionItems,
        smartActionItems,
        handovers,
        createProject,
        updateProjectStatus,
        updateProjectProgress,
        createClient,
        createTask,
        updateTask,
        deleteTask,
        reassignTask,
        toggleTaskDone,
        markTaskBlocked,
        resolveTaskBlocker,
        toggleTaskBlocked,
        wouldCreateCycle,
        getPrerequisiteStatus,
        getDownstreamTasks,
        getCalculatedProjectProgress,
        createChangeRequest,
        updateChangeRequestStatus,
        convertChangeRequestToTask,
        updateTeamMemberCapacity,
        createCommitment,
        updateCommitment,
        fulfillCommitment,
        updateOnboardingChecklist,
        updateHandoverChecklist,
        setProjectReviewApproved,
        validateStageTransition,
        advanceProjectStage,
        getProjectReadinessScore,
        resolveActionItem,
        initializeHandover,
        toggleHandoverGate,
        createDependency,
        resolveDependency,
        resetToDemoData,
        activeProjectsCount,
        tasksDueSoonCount,
        blockedTasksCount,
        pendingApprovalsCount,
        actionCenterCount,
      }}
    >
      {children}
    </FlowGuardContext.Provider>
  );
};

export const useFlowGuard = () => {
  const context = useContext(FlowGuardContext);
  if (!context) {
    throw new Error('useFlowGuard must be used within a FlowGuardProvider');
  }
  return context;
};
