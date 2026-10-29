import type { Project, Client, Task, ChangeRequest, TeamMember, Commitment, Dependency, ActionItem, HandoverGate } from '../types';

export interface Workspace {
  projects: Project[]; clients: Client[]; tasks: Task[];
  changeRequests: ChangeRequest[]; team: TeamMember[]; commitments: Commitment[];
  dependencies: Dependency[]; actionItems: ActionItem[]; handovers: HandoverGate[];
}

export const collections = ['projects', 'clients', 'tasks', 'changeRequests', 'team', 'commitments', 'dependencies', 'actionItems', 'handovers'] as const;
const fields: Record<typeof collections[number], { strings: string[]; numbers?: string[]; booleans?: string[] }> = {
  clients: { strings: ['name','industry','contactPerson','email','phone','tier','health','joinedDate'], numbers: ['totalSpend'] },
  projects: { strings: ['name','clientId','clientName','owner','ownerRole','deadline','status','stage','scopeStatus','description'], numbers: ['progress','budget','spentBudget','allocatedHours','spentHours'] },
  tasks: { strings: ['projectId','projectName','title','assignee','dueDate','status','priority'], booleans: ['isBlocked'] },
  changeRequests: { strings: ['projectId','projectName','title','description','requestedBy','dateRequested','status'], numbers: ['impactHours','impactBudget','impactTimelineDays'] },
  team: { strings: ['name','role','avatarInitials','status'], numbers: ['maxWeeklyHours','assignedHours','activeTasksCount'] },
  commitments: { strings: ['clientName','projectId','projectName','commitment','committedDeadline','confidence','slaTerms','owner','status'] },
  dependencies: { strings: ['projectId','projectName','blockingTask','blockedTask','blockingOwner','impactLevel','status','notes'] },
  actionItems: { strings: ['category','title','description','urgency','owner','actionLabel'], booleans: ['resolved'] },
  handovers: { strings: ['projectId','projectName','targetDate','status'], numbers: ['overallReadiness'] },
};
export function validateWorkspace(value: unknown): asserts value is Workspace {
  if (!value || typeof value !== 'object') throw new Error('Invalid workspace');
  for (const key of collections) {
    const rows = (value as Workspace)[key];
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || typeof row.id !== 'string')) {
      throw new Error(`Invalid collection: ${key}`);
    }
    for (const row of rows) {
      for (const [kind, names] of Object.entries(fields[key])) {
        const expected = kind === 'strings' ? 'string' : kind === 'numbers' ? 'number' : 'boolean';
        for (const field of names) {
          const item = (row as unknown as Record<string, unknown>)[field];
          if (typeof item !== expected || (typeof item === 'number' && !Number.isFinite(item))) throw new Error(`Invalid ${key}.${field}`);
        }
      }
      if (key === 'team' && !Array.isArray((row as TeamMember).activeProjects)) throw new Error('Invalid team projects');
      if (key === 'handovers') {
        const gates = (row as HandoverGate).gates;
        if (!gates || ['qaSignoff','clientSignoff','assetHandoff','infrastructureTransfer','finalBillingApproved'].some(k => typeof gates[k as keyof HandoverGate['gates']] !== 'boolean')) throw new Error('Invalid handover gates');
      }
    }
    if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error(`Duplicate IDs: ${key}`);
  }
}

export function exportWorkspace(workspace: Workspace) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = `flowguard-backup-${Date.now()}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
