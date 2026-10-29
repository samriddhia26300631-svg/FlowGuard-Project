import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup, render } from '@testing-library/react';
import { FlowGuardProvider, useFlowGuard } from '../src/context/FlowGuardContext';
import App from '../src/App';
import { OverviewView } from '../src/views/OverviewView';
import { ProjectsView } from '../src/views/ProjectsView';
import { ClientsView } from '../src/views/ClientsView';
import { ScopeControlView } from '../src/views/ScopeControlView';
import { TeamWorkloadView } from '../src/views/TeamWorkloadView';
import { CommitmentsView } from '../src/views/CommitmentsView';
import { DependenciesView } from '../src/views/DependenciesView';
import { ActionCenterView } from '../src/views/ActionCenterView';
import { HandoverView } from '../src/views/HandoverView';
import { validateWorkspace } from '../src/data/workspace';
import { connectCloud, saveCloud } from '../src/data/cloudRepository';
vi.mock('../src/data/cloudRepository', () => ({ cloudConfigured: true, connectCloud: vi.fn(), saveCloud: vi.fn() }));
const wrapper = ({ children }: { children: React.ReactNode }) => <FlowGuardProvider>{children}</FlowGuardProvider>;
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

it('creates linked client/project/tasks; blocker, dependencies and Action Center stay connected after refresh', () => {
  const hook = renderHook(useFlowGuard, { wrapper });
  act(() => hook.result.current.createClient({ name:'Test client', industry:'Tech', contactPerson:'Sam', email:'sam@example.com', phone:'123', tier:'Growth', health:'Healthy' }));
  const client = hook.result.current.clients[0];
  act(() => hook.result.current.createProject({ name:'Test project', clientId:client.id, clientName:client.name, owner:'Sam', ownerRole:'Lead', deadline:'2027-01-01', progress:0, status:'On Track', scopeStatus:'Locked', budget:100, allocatedHours:10, description:'Test' }));
  const project = hook.result.current.projects[0];
  expect(hook.result.current.handovers.some(h => h.projectId === project.id)).toBe(true);
  act(() => hook.result.current.createTask({ projectId:project.id, projectName:project.name, title:'Design approval', assignee:'Sam', dueDate:'2027-01-01', status:'To Do', priority:'High', isBlocked:false }));
  const first = hook.result.current.tasks[0];
  // Distinct timestamps reflect separate user submissions.
  vi.spyOn(Date, 'now').mockReturnValue(Date.now()+100);
  act(() => hook.result.current.createTask({ projectId:project.id, projectName:project.name, title:'Development', assignee:'Sam', dueDate:'2027-01-02', status:'To Do', priority:'High', isBlocked:false, dependsOnTaskId:first.id }));
  const second = hook.result.current.tasks[0];
  expect(hook.result.current.getPrerequisiteStatus(second).isWaiting).toBe(true);
  expect(hook.result.current.wouldCreateCycle(first.id, second.id)).toBe(true);
  act(() => hook.result.current.markTaskBlocked(first.id, 'Awaiting approval', 'Client contact', 'Client'));
  expect(hook.result.current.smartActionItems.some(a => a.type==='blocked_task' && a.taskId===first.id)).toBe(true);
  expect(hook.result.current.dependencies.some(d => d.blockedTask===first.title && d.status==='Active Blocker')).toBe(true);
  act(() => hook.result.current.resolveActionItem(`act-blocker-${first.id}`));
  expect(hook.result.current.tasks.find(t=>t.id===first.id)?.isBlocked).toBe(false);
  expect(hook.result.current.dependencies.find(d=>d.blockedTask===first.title)?.status).toBe('Resolved');
  act(() => hook.result.current.toggleTaskDone(first.id));
  expect(hook.result.current.getPrerequisiteStatus(second).isWaiting).toBe(false);
  act(() => hook.result.current.createDependency({ id:'manual-dep', projectId:project.id, projectName:project.name, blockingTask:'Assets', blockedTask:'Development', blockingOwner:'Client', impactLevel:'Blocker', status:'Active Blocker', notes:'' }));
  hook.unmount();
  const reloaded = renderHook(useFlowGuard, { wrapper });
  expect(reloaded.result.current.clients[0].name).toBe('Test client');
  expect(reloaded.result.current.projects[0].id).toBe(project.id);
  expect(reloaded.result.current.tasks.find(t=>t.id===second.id)?.dependsOnTaskId).toBe(first.id);
  expect(reloaded.result.current.dependencies.some(d=>d.id==='manual-dep')).toBe(true);
});

it('renders all nine pages without dropping features', () => {
  const hook = renderHook(useFlowGuard, { wrapper });
  expect(hook.result.current.projects.length).toBeGreaterThan(0);
  const app = render(<App />);
  expect(app.container.textContent).toContain('FlowGuard');
  app.unmount();
  for (const View of [OverviewView, ProjectsView, ClientsView, ScopeControlView, TeamWorkloadView, CommitmentsView, DependenciesView, ActionCenterView, HandoverView]) {
    const page = render(<FlowGuardProvider><View /></FlowGuardProvider>);
    expect(page.container.textContent?.length).toBeGreaterThan(20);
    page.unmount();
  }
});

it('migrates local workspace only on connect; cloud failure preserves local edits and retry saves them', async () => {
  vi.useFakeTimers();
  vi.mocked(connectCloud).mockResolvedValue({ owner:'user-a', record:null });
  vi.mocked(saveCloud).mockResolvedValue(1);
  const hook = renderHook(useFlowGuard, { wrapper });
  const c = hook.result.current;
  expect(() => validateWorkspace({ clients:c.clients, projects:c.projects, tasks:c.tasks, changeRequests:c.changeRequests, team:c.team, commitments:c.commitments, dependencies:c.dependencies, actionItems:c.actionItems, handovers:c.handovers })).not.toThrow();
  expect(connectCloud).not.toHaveBeenCalled();
  await act(async () => { await hook.result.current.persistence.connect(); });
  expect(saveCloud).toHaveBeenCalledWith('user-a', null, expect.objectContaining({ clients:expect.any(Array), tasks:expect.any(Array) }));
  vi.mocked(saveCloud).mockRejectedValueOnce(new Error('Network unavailable'));
  act(() => hook.result.current.updateTeamMemberCapacity(hook.result.current.team[0].id, 25));
  await act(async () => { await vi.advanceTimersByTimeAsync(700); });
  expect(hook.result.current.persistence.error).toContain('Network unavailable');
  expect(JSON.parse(localStorage.getItem('flowguard_v4_store_team')!)[0].maxWeeklyHours).toBe(25);
  vi.mocked(saveCloud).mockResolvedValue(2);
  act(() => hook.result.current.persistence.retry());
  await act(async () => { await vi.advanceTimersByTimeAsync(700); });
  expect(hook.result.current.persistence.status).toBe('Saved to PostgreSQL');
});

it('loads existing cloud data without uploading local defaults and backs up browser state', async () => {
  const hook = renderHook(useFlowGuard, { wrapper });
  const c = hook.result.current;
  const data = { clients:c.clients, projects:c.projects, tasks:c.tasks, changeRequests:c.changeRequests, team:c.team, commitments:c.commitments, dependencies:c.dependencies, actionItems:c.actionItems, handovers:c.handovers };
  vi.mocked(connectCloud).mockResolvedValue({ owner:'user-a', record:{ owner_id:'user-a', revision:4, data:{ ...data, clients:[] } } });
  await act(async () => { await hook.result.current.persistence.connect(); });
  expect(hook.result.current.clients).toEqual([]);
  expect(saveCloud).not.toHaveBeenCalled();
  expect(Object.keys(localStorage).some(k=>k.startsWith('flowguard_backup_'))).toBe(true);
});

it('reset retains auth and migration backup', () => {
  localStorage.setItem('sb-session-test','keep');
  localStorage.setItem('flowguard_v3_store_clients', JSON.stringify([]));
  const hook = renderHook(useFlowGuard, { wrapper });
  expect(hook.result.current.clients).toEqual([]);
  expect(localStorage.getItem('flowguard_pre_cloud_backup')).toContain('flowguard_v3_store_clients');
  act(() => hook.result.current.resetToDemoData());
  expect(localStorage.getItem('sb-session-test')).toBe('keep');
  expect(localStorage.getItem('flowguard_pre_cloud_backup')).not.toBeNull();
});

it('retains local workspace when cloud connection fails', async () => {
  vi.mocked(connectCloud).mockRejectedValue(new Error('Anonymous sign-ins disabled'));
  const hook = renderHook(useFlowGuard, { wrapper });
  const original = hook.result.current.tasks;
  await act(async () => { await hook.result.current.persistence.connect(); });
  expect(hook.result.current.tasks).toBe(original);
  expect(hook.result.current.persistence.connected).toBe(false);
  expect(hook.result.current.persistence.error).toContain('Anonymous sign-ins disabled');
  expect(saveCloud).not.toHaveBeenCalled();
});

it('serializes saves and drains edits made during an in-flight request', async () => {
  vi.useFakeTimers();
  vi.mocked(connectCloud).mockResolvedValue({ owner:'user-a', record:null });
  vi.mocked(saveCloud).mockResolvedValueOnce(1);
  const hook = renderHook(useFlowGuard, { wrapper });
  await act(async () => { await hook.result.current.persistence.connect(); });
  let finish!: (revision:number)=>void;
  vi.mocked(saveCloud).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve})).mockResolvedValue(3);
  const id = hook.result.current.team[0].id;
  act(()=>hook.result.current.updateTeamMemberCapacity(id,21));
  await act(async()=>{await vi.advanceTimersByTimeAsync(700)});
  act(()=>hook.result.current.updateTeamMemberCapacity(id,22));
  await act(async()=>{await vi.advanceTimersByTimeAsync(700)});
  expect(saveCloud).toHaveBeenCalledTimes(2);
  await act(async()=>{finish(2)});
  await act(async()=>{await vi.advanceTimersByTimeAsync(700)});
  expect(saveCloud).toHaveBeenLastCalledWith('user-a',2,expect.objectContaining({team:expect.arrayContaining([expect.objectContaining({id,maxWeeklyHours:22})])}));
});
