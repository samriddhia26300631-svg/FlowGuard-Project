import type { Dependency, Task } from '../types';

// Only adopt old records marked as app-generated, with one unambiguous task.
// Free-text/manual records remain independent and are never deleted.
export function reconcileDependencies(records: Dependency[], tasks: Task[]): Dependency[] {
  const linked = records.map(record => {
    if (record.blockedTaskId || record.source === 'manual' || !record.notes.startsWith('Responsible:')) return record;
    const matches = tasks.filter(t => t.projectId === record.projectId && t.title === record.blockedTask);
    return matches.length === 1 ? { ...record, source: 'task_blocker' as const, blockedTaskId: matches[0].id } : record;
  });
  const seen = new Set<string>();
  const result = linked.map(record => {
    if (!record.blockedTaskId || record.source === 'manual') return record;
    const task = tasks.find(t => t.id === record.blockedTaskId && t.projectId === record.projectId);
    const active = task?.isBlocked && task.status !== 'Completed' && task.status !== 'Done';
    const primary = !seen.has(record.blockedTaskId);
    seen.add(record.blockedTaskId);
    return {
      ...record, source: 'task_blocker' as const,
      ...(task ? { projectName: task.projectName, blockedTask: task.title } : {}),
      ...(active ? { blockingTask: task.blockerReason || 'Unresolved dependency', blockingOwner: task.blockerOwner || task.assignee } : {}),
      status: active && primary ? 'Active Blocker' as const : 'Resolved' as const,
    };
  });
  for (const task of tasks) {
    if (!task.isBlocked || task.status === 'Completed' || task.status === 'Done' || seen.has(task.id)) continue;
    result.push({ id: `task-blocker-${task.id}`, source: 'task_blocker', blockedTaskId: task.id,
      projectId: task.projectId, projectName: task.projectName,
      blockingTask: task.blockerReason || 'Unresolved dependency', blockedTask: task.title,
      blockingOwner: task.blockerOwner || task.assignee, impactLevel: 'Blocker',
      status: 'Active Blocker', notes: `Responsible: ${task.blockerParty || 'Client'}` });
  }
  return result;
}
