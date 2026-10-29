export type PageId =
  | 'overview'
  | 'projects'
  | 'clients'
  | 'scope-control'
  | 'team-workload'
  | 'commitments'
  | 'dependencies'
  | 'action-center'
  | 'handover';

export type ProjectStatus = 'On Track' | 'At Risk' | 'Blocked' | 'Review' | 'Completed';
export type ProjectStage =
  | 'Onboarding'
  | 'Planning'
  | 'Execution'
  | 'Review'
  | 'Delivery'
  | 'Completed';

export type ScopeStatus = 'Locked' | 'Revision Pending' | 'Scope Creep Alert';
export type ClientTier = 'Enterprise' | 'Growth' | 'Retainer';
export type ClientHealth = 'Healthy' | 'Needs Attention' | 'At Risk';
export type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type TaskStatus =
  | 'To Do'
  | 'In Progress'
  | 'Review'
  | 'Blocked'
  | 'Completed'
  | 'Todo'
  | 'Done'
  | 'In Review';

export type BlockerParty = 'Client' | 'Team Member' | 'External';

export interface OnboardingChecklist {
  clientContactConfirmed: boolean;
  objectivesDefined: boolean;
  requirementsDocumented: boolean;
  scopeConfirmed: boolean;
  budgetConfirmed: boolean;
  deadlineAgreed: boolean;
  projectOwnerAssigned: boolean;
  requiredAssetsReceived: boolean;
  kickoffApprovalReceived: boolean;
  notes?: string;
  updatedAt?: string;
}

export interface HandoverChecklist {
  finalDeliverablesPrepared: boolean;
  documentationPrepared: boolean;
  credentialsTransferred: boolean;
  clientReviewCompleted: boolean;
  finalClientAcceptance: boolean;
  notes?: string;
  updatedAt?: string;
}

export interface StageGateValidation {
  allowed: boolean;
  currentStage: ProjectStage;
  targetStage: ProjectStage;
  missingRequirements: string[];
  metRequirements: string[];
}

export interface ProjectReadiness {
  score: number;
  label: string;
  currentStage: ProjectStage;
  nextStage: ProjectStage | null;
  metCount: number;
  totalCount: number;
  missingRequirements: string[];
  metRequirements: string[];
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  owner: string;
  ownerRole: string;
  deadline: string; // YYYY-MM-DD
  progress: number; // 0 - 100
  status: ProjectStatus;
  stage: ProjectStage;
  stageTransitions?: { stage: ProjectStage; date: string }[];
  onboardingChecklist?: OnboardingChecklist;
  handoverChecklist?: HandoverChecklist;
  reviewApproved?: boolean;
  reviewApprovedDate?: string;
  budget: number;
  spentBudget: number;
  allocatedHours: number;
  spentHours: number;
  scopeStatus: ScopeStatus;
  description: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  tier: ClientTier;
  health: ClientHealth;
  totalSpend: number;
  joinedDate: string;
}

export interface Task {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  progress?: number; // 0 - 100
  estimatedHours?: number;
  isBlocked: boolean;
  blockerReason?: string;
  blockerOwner?: string;
  blockerParty?: BlockerParty;
  blockedSince?: string;
  priority: TaskPriority;
  dependsOnTaskId?: string;
}

export interface ChangeRequest {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  requestedBy: string;
  dateRequested: string;
  impactHours: number;
  impactBudget: number;
  impactTimelineDays: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Pending Approval';
  reviewedBy?: string;
  approvalDate?: string;
  convertedToTaskId?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  maxWeeklyHours: number;
  assignedHours: number;
  activeTasksCount: number;
  activeProjects: string[];
  status: 'Optimal' | 'At Capacity' | 'Overloaded';
}

export type CommitmentStatus =
  | 'Pending'
  | 'Due Soon'
  | 'Overdue'
  | 'Fulfilled'
  | 'On Schedule'
  | 'At Risk'
  | 'Delivered';

export interface Commitment {
  id: string;
  clientName: string;
  projectId: string;
  projectName: string;
  commitment: string;
  committedDeadline: string;
  dueDate?: string;
  confidence: 'High' | 'Medium' | 'Critical Risk';
  slaTerms: string;
  owner: string;
  responsibleMember?: string;
  status: CommitmentStatus;
}

export interface Dependency {
  source?: 'task_blocker' | 'manual';
  blockedTaskId?: string;
  id: string;
  projectId: string;
  projectName: string;
  blockingTask: string;
  blockedTask: string;
  blockingOwner: string;
  impactLevel: 'Blocker' | 'Warning' | 'Low';
  status: 'Active Blocker' | 'Resolved';
  notes: string;
}

export type ActionCategory = 'Agency Action' | 'Waiting on Client' | 'External Dependencies';

export interface SmartActionItem {
  id: string;
  type:
    | 'blocked_task'
    | 'waiting_prereq'
    | 'overdue_task'
    | 'pending_approval'
    | 'overdue_commitment'
    | 'overloaded_member'
    | 'missing_onboarding'
    | 'gate_blocked'
    | 'delivery_incomplete';
  category: ActionCategory;
  severity: 'Urgent' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  owner: string;
  reason: string;
  recommendedAction: string;
  actionLabel: string;
}

export interface ActionItem {
  id: string;
  category: 'Blocker' | 'Approval Overdue' | 'Capacity Strain' | 'Scope Alert';
  title: string;
  description: string;
  urgency: 'Immediate' | 'Today' | 'This Week';
  targetProjectId?: string;
  owner: string;
  resolved: boolean;
  actionLabel: string;
}

export interface HandoverGate {
  id: string;
  projectId: string;
  projectName: string;
  targetDate: string;
  overallReadiness: number; // 0 - 100
  gates: {
    qaSignoff: boolean;
    clientSignoff: boolean;
    assetHandoff: boolean;
    infrastructureTransfer: boolean;
    finalBillingApproved: boolean;
  };
  status: 'Ready for Delivery' | 'Pending Gates' | 'Blocked by QA';
}
