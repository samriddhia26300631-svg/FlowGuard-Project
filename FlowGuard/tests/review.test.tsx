import React from 'react';
import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup, screen, fireEvent } from '@testing-library/react';
import { FlowGuardProvider, useFlowGuard } from '../src/context/FlowGuardContext';
import { ProjectDetailModal } from '../src/components/modals/ProjectDetailModal';
import { ActionCenterView } from '../src/views/ActionCenterView';
vi.mock('../src/data/cloudRepository', () => ({ cloudConfigured:false, connectCloud:vi.fn(), saveCloud:vi.fn() }));
const wrapper = ({children}:{children:React.ReactNode})=><FlowGuardProvider>{children}<ProjectDetailModal/><ActionCenterView/></FlowGuardProvider>;
const base = {id:'review-task',projectId:'p-1',projectName:'Acme FinTech Web App V2',title:'Unique review task',assignee:'Marcus Vance',dueDate:'2030-01-01',status:'To Do' as const,priority:'High' as const,isBlocked:false};
beforeEach(()=>{localStorage.clear();localStorage.setItem('flowguard_v4_store_tasks',JSON.stringify([base]));});
afterEach(()=>{cleanup();vi.useRealTimers()});

it('exposes the existing onboarding and lifecycle gate controls',()=>{
 const h=renderHook(useFlowGuard,{wrapper});
 act(()=>h.result.current.openProjectDetails('p-1'));
 expect(screen.queryByRole('button',{name:/^Onboarding$/i})).not.toBeNull();
});
it('clears the dependency record when a blocked task is completed',()=>{
 const h=renderHook(useFlowGuard,{wrapper});
 act(()=>h.result.current.markTaskBlocked(base.id,'Approval','Client','Client'));
 act(()=>h.result.current.toggleTaskDone(base.id));
 expect(h.result.current.dependencies.filter(d=>d.blockedTask===base.title && d.status==='Active Blocker')).toHaveLength(0);
});
it('creates the dependency record when the task edit form marks a task blocked',()=>{
 const h=renderHook(useFlowGuard,{wrapper});
 act(()=>h.result.current.updateTask(base.id,{isBlocked:true,status:'Blocked',blockerReason:'Approval',blockerParty:'Client',blockerOwner:'Client'}));
 expect(h.result.current.dependencies.some(d=>d.blockedTask===base.title && d.status==='Active Blocker')).toBe(true);
});
it('Rebalance Tasks navigates to Team Workload',()=>{
 const h=renderHook(useFlowGuard,{wrapper});
 act(()=>h.result.current.updateTeamMemberCapacity(h.result.current.team.find(m=>m.name===base.assignee)!.id,1));
 fireEvent.click(screen.getAllByRole('button',{name:'Rebalance Tasks'})[0]);
 expect(h.result.current.activePage).toBe('team-workload');
});
it('prevents selecting Completed when project lifecycle gates are incomplete',()=>{
 const h=renderHook(useFlowGuard,{wrapper});
 act(()=>h.result.current.updateProjectStatus('p-1','Completed'));
 expect(h.result.current.projects.find(p=>p.id==='p-1')!.status).not.toBe('Completed');
});
it('counts only tasks due within the next seven days',()=>{
 const h=renderHook(useFlowGuard,{wrapper});
 expect(h.result.current.tasksDueSoonCount).toBe(0);
});
it('does not classify internal prerequisite blockers as waiting on the client',()=>{
 localStorage.setItem('flowguard_v4_store_tasks',JSON.stringify([{...base,isBlocked:true,status:'Blocked',blockerParty:'Team Member',blockerOwner:'Marcus Vance',blockerReason:'Internal bug'},{...base,id:'downstream',title:'Downstream',dependsOnTaskId:base.id}]));
 const h=renderHook(useFlowGuard,{wrapper});
 expect(h.result.current.smartActionItems.find(a=>a.taskId==='downstream' && a.type==='waiting_prereq')?.category).toBe('Agency Action');
});

it('approves scope, updates budget, converts to one task and preserves approval after remount',()=>{
 const h=renderHook(useFlowGuard,{wrapper});
 const project=h.result.current.projects[0];
 act(()=>h.result.current.createChangeRequest({projectId:project.id,projectName:project.name,title:'Review scope',description:'Extra work',requestedBy:'Client',impactHours:12,impactBudget:200,impactTimelineDays:2,status:'Pending'}));
 const cr=h.result.current.changeRequests[0];
 act(()=>h.result.current.updateChangeRequestStatus(cr.id,'Approved','Reviewer'));
 expect(h.result.current.projects.find(p=>p.id===project.id)?.budget).toBe(project.budget+200);
 act(()=>h.result.current.convertChangeRequestToTask(cr.id));
 const taskId=h.result.current.changeRequests[0].convertedToTaskId;
 expect(h.result.current.tasks.some(t=>t.id===taskId)).toBe(true);
 const count=h.result.current.tasks.length;
 act(()=>h.result.current.convertChangeRequestToTask(cr.id));
 expect(h.result.current.tasks).toHaveLength(count);
 h.unmount();
 const reloaded=renderHook(useFlowGuard,{wrapper});
 expect(reloaded.result.current.changeRequests[0].convertedToTaskId).toBe(taskId);
});
it('fulfills commitments and updates workload after reassignment',()=>{
 const h=renderHook(useFlowGuard,{wrapper});
 const member=h.result.current.team.find(m=>m.name!==base.assignee)!;
 act(()=>h.result.current.reassignTask(base.id,member.name));
 expect(h.result.current.calculatedTeam.find(m=>m.id===member.id)?.activeTasks.map(t=>t.id)).toContain(base.id);
 act(()=>h.result.current.createCommitment({projectId:'p-1',projectName:base.projectName,clientName:'Client',commitment:'Review promise',committedDeadline:'2000-01-01',confidence:'High',slaTerms:'SLA',owner:member.name,status:'Pending'}));
 const id=h.result.current.commitments[0].id;
 expect(h.result.current.smartActionItems.some(a=>a.id===`act-cm-${id}`)).toBe(true);
 act(()=>h.result.current.fulfillCommitment(id));
 expect(h.result.current.smartActionItems.some(a=>a.id===`act-cm-${id}`)).toBe(false);
});
it('saves handover checkbox changes after remount',()=>{
 const h=renderHook(useFlowGuard,{wrapper});
 const gate=h.result.current.handovers[0];
 act(()=>h.result.current.toggleHandoverGate(gate.id,'qaSignoff'));
 h.unmount();
 const reloaded=renderHook(useFlowGuard,{wrapper});
 expect(reloaded.result.current.handovers.find(g=>g.id===gate.id)?.gates.qaSignoff).toBe(!gate.gates.qaSignoff);
});

it('completes onboarding through delivery in the UI and keeps checklist changes after reload',()=>{
 const h=renderHook(useFlowGuard,{wrapper});
 const client=h.result.current.clients[0];
 act(()=>h.result.current.createProject({name:'Lifecycle test',clientId:client.id,clientName:client.name,owner:base.assignee,ownerRole:'Lead',deadline:'2030-01-01',progress:0,status:'On Track',scopeStatus:'Locked',budget:1000,allocatedHours:40,description:'Lifecycle scope'}));
 const project=h.result.current.projects[0];
 act(()=>h.result.current.openProjectDetails(project.id,'onboarding'));
 expect((screen.getByRole('button',{name:'Advance to Planning'}) as HTMLButtonElement).disabled).toBe(true);
 for (const label of ['Requirements documented','Scope confirmed','Required assets received','Kickoff approval received']) {
   const checkbox=screen.getByLabelText(label) as HTMLInputElement;
   if (!checkbox.checked) fireEvent.click(checkbox);
 }
 expect((screen.getByRole('button',{name:'Advance to Planning'}) as HTMLButtonElement).disabled).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'Advance to Planning'}));
 expect(h.result.current.projects[0].stage).toBe('Planning');
 expect((screen.getByRole('button',{name:'Advance to Execution'}) as HTMLButtonElement).disabled).toBe(true);
 act(()=>h.result.current.createTask({...base,projectId:project.id,projectName:project.name}));
 fireEvent.click(screen.getByRole('button',{name:'Advance to Execution'}));
 expect(h.result.current.projects[0].stage).toBe('Execution');
 act(()=>h.result.current.toggleTaskDone(h.result.current.tasks[0].id));
 fireEvent.click(screen.getByRole('button',{name:'Advance to Review'}));
 fireEvent.click(screen.getByRole('button',{name:'Stage Gates & Handover'}));
 fireEvent.click(screen.getByLabelText('Formal review approval recorded'));
 fireEvent.click(screen.getByRole('button',{name:'Advance to Delivery'}));
 expect(h.result.current.projects[0].stage).toBe('Delivery');
 for (const label of ['QA sign-off','Client milestone acceptance','Production assets handed over','Infrastructure transfer verified','Final billing approved','Final deliverables prepared','Documentation prepared','Credentials transferred','Client delivery review completed','Final client acceptance recorded']) {
   const checkbox=screen.getByLabelText(label) as HTMLInputElement;
   if (!checkbox.checked) fireEvent.click(checkbox);
 }
 expect((screen.getByRole('button',{name:'Advance to Completed'}) as HTMLButtonElement).disabled).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'Advance to Completed'}));
 expect(h.result.current.projects[0]).toMatchObject({stage:'Completed',status:'Completed'});
 h.unmount();
 const reloaded=renderHook(useFlowGuard,{wrapper});
 expect(reloaded.result.current.projects.find(p=>p.id===project.id)?.handoverChecklist?.finalClientAcceptance).toBe(true);
 act(()=>reloaded.result.current.updateProjectStatus(project.id,'On Track'));
 expect(reloaded.result.current.projects.find(p=>p.id===project.id)?.stage).toBe('Execution');
});

it('resolves linked dependencies by ID, handles renames/deletion, and preserves manual entries',()=>{
 const h=renderHook(useFlowGuard,{wrapper});
 act(()=>h.result.current.markTaskBlocked(base.id,'Approval','Client','Client'));
 const record=h.result.current.dependencies.find(d=>d.blockedTaskId===base.id)!;
 act(()=>h.result.current.createDependency({...record,id:'manual-independent',source:'manual',blockedTaskId:undefined}));
 act(()=>h.result.current.updateTask(base.id,{title:'Renamed task'}));
 expect(h.result.current.dependencies.find(d=>d.id===record.id)?.blockedTask).toBe('Renamed task');
 act(()=>h.result.current.resolveDependency(record.id));
 expect(h.result.current.tasks[0].isBlocked).toBe(false);
 expect(h.result.current.dependencies.find(d=>d.id==='manual-independent')?.status).toBe('Active Blocker');
 act(()=>h.result.current.markTaskBlocked(base.id,'New issue','Team','Team Member'));
 expect(h.result.current.dependencies.filter(d=>d.blockedTaskId===base.id)).toHaveLength(1);
 act(()=>h.result.current.deleteTask(base.id));
 expect(h.result.current.dependencies.find(d=>d.id===record.id)?.status).toBe('Resolved');
 expect(h.result.current.dependencies.find(d=>d.id==='manual-independent')?.status).toBe('Active Blocker');
});

it('uses a seven-day date window including today and excluding completed tasks',()=>{
 vi.useFakeTimers(); vi.setSystemTime(new Date(2026,9,29,12));
 localStorage.setItem('flowguard_v4_store_tasks',JSON.stringify([
   {...base,id:'yesterday',dueDate:'2026-10-28'}, {...base,id:'today',dueDate:'2026-10-29'},
   {...base,id:'day-seven',dueDate:'2026-11-05'}, {...base,id:'day-eight',dueDate:'2026-11-06'},
   {...base,id:'done',dueDate:'2026-10-30',status:'Completed'},
 ]));
 const h=renderHook(useFlowGuard,{wrapper});
 expect(h.result.current.tasksDueSoonCount).toBe(2);
});

it('migrates unambiguous old generated dependencies without touching manual or ambiguous title records',async()=>{
 const {reconcileDependencies}=await import('../src/data/dependencies');
 const task={...base,isBlocked:true,status:'Blocked' as const,priority:'High' as const,blockerReason:'Approval'};
 const old={id:'legacy',projectId:base.projectId,projectName:base.projectName,blockingTask:'Approval',blockedTask:base.title,blockingOwner:'Client',impactLevel:'Blocker' as const,status:'Active Blocker' as const,notes:'Responsible: Client'};
 const linked=reconcileDependencies([old], [task]);
 expect(linked[0].blockedTaskId).toBe(base.id);
 expect(reconcileDependencies(linked,[{...task,isBlocked:false}])[0].status).toBe('Resolved');
 expect(reconcileDependencies([{...old,source:'manual'}],[task])[0].blockedTaskId).toBeUndefined();
 expect(reconcileDependencies([old],[task,{...task,id:'same-title'}])[0].blockedTaskId).toBeUndefined();
});

it('requires delivery verification and actual overdue commitments before allowing final completion',()=>{
 const h=renderHook(useFlowGuard,{wrapper});
 const project={...h.result.current.projects[0],id:'final-check',stage:'Delivery',status:'On Track',reviewApproved:true,handoverChecklist:{finalDeliverablesPrepared:true,documentationPrepared:true,credentialsTransferred:true,clientReviewCompleted:true,finalClientAcceptance:true}};
 h.unmount();
 localStorage.setItem('flowguard_v4_store_projects',JSON.stringify([project]));
 localStorage.setItem('flowguard_v4_store_tasks',JSON.stringify([{...base,projectId:project.id,status:'Completed'}]));
 localStorage.setItem('flowguard_v4_store_commitments',JSON.stringify([{id:'overdue-promise',projectId:project.id,projectName:project.name,clientName:'Client',commitment:'Late',committedDeadline:'2000-01-01',owner:base.assignee,confidence:'High',slaTerms:'SLA',status:'Pending'}]));
 const next=renderHook(useFlowGuard,{wrapper});
 act(()=>next.result.current.initializeHandover(project.id));
 expect(next.result.current.validateStageTransition(project.id,'Completed').allowed).toBe(false);
 const delivery=next.result.current.handovers.find(d=>d.projectId===project.id)!;
 for (const key of Object.keys(delivery.gates) as (keyof typeof delivery.gates)[]) act(()=>next.result.current.toggleHandoverGate(delivery.id,key));
 expect(next.result.current.validateStageTransition(project.id,'Completed').missingRequirements.join(' ')).toContain('overdue');
 act(()=>next.result.current.fulfillCommitment('overdue-promise'));
 expect(next.result.current.validateStageTransition(project.id,'Completed').allowed).toBe(true);
 act(()=>next.result.current.updateProjectStatus(project.id,'Completed'));
 expect(next.result.current.projects[0].stage).toBe('Completed');
 expect(next.result.current.workflowError).toBe('');
});
