import React from 'react';
import { useFlowGuard } from '../../context/FlowGuardContext';
import type { OnboardingChecklist, HandoverChecklist, HandoverGate } from '../../types';

const onboarding: [keyof OnboardingChecklist, string][] = [
  ['clientContactConfirmed', 'Client contact confirmed'], ['objectivesDefined', 'Objectives defined'],
  ['requirementsDocumented', 'Requirements documented'], ['scopeConfirmed', 'Scope confirmed'],
  ['budgetConfirmed', 'Budget confirmed'], ['deadlineAgreed', 'Deadline agreed'],
  ['projectOwnerAssigned', 'Project owner assigned'], ['requiredAssetsReceived', 'Required assets received'],
  ['kickoffApprovalReceived', 'Kickoff approval received'],
];
const handover: [keyof HandoverChecklist, string][] = [
  ['finalDeliverablesPrepared', 'Final deliverables prepared'], ['documentationPrepared', 'Documentation prepared'],
  ['credentialsTransferred', 'Credentials transferred'], ['clientReviewCompleted', 'Client delivery review completed'],
  ['finalClientAcceptance', 'Final client acceptance recorded'],
];
const verification: [keyof HandoverGate['gates'], string][] = [
  ['qaSignoff', 'QA sign-off'], ['clientSignoff', 'Client milestone acceptance'], ['assetHandoff', 'Production assets handed over'],
  ['infrastructureTransfer', 'Infrastructure transfer verified'], ['finalBillingApproved', 'Final billing approved'],
];
export function LifecyclePanel({ projectId, section }: { projectId: string; section: 'onboarding' | 'gates' }) {
  const { projects, handovers, updateOnboardingChecklist, updateHandoverChecklist, setProjectReviewApproved,
    initializeHandover, toggleHandoverGate, getProjectReadinessScore, advanceProjectStage } = useFlowGuard();
  const project = projects.find(p => p.id === projectId);
  const [error, setError] = React.useState('');
  if (!project) return null;
  const readiness = getProjectReadinessScore(projectId);
  const delivery = handovers.find(h => h.projectId === projectId);
  const completed = project.stage === 'Completed';
  const advance = () => {
    if (!readiness.nextStage) return;
    const result = advanceProjectStage(projectId, readiness.nextStage);
    setError(result.success ? '' : result.missingRequirements?.join(' ') || result.error || 'Unable to advance');
  };
  const checklist = (label: string, checked: boolean, change: () => void) => <label key={label} className="flex items-center gap-3 p-2 rounded border border-[#E8E4DD] bg-white text-xs cursor-pointer">
    <input type="checkbox" checked={checked} onChange={change} disabled={completed} />{label}
  </label>;
  return <section className="space-y-4 text-sm">
    <div className="rounded-lg border border-[#E8E4DD] bg-[#FAF8F4] p-4 space-y-2">
      <h3 className="font-semibold">Stage: {project.stage}</h3>
      <p>Readiness for {readiness.nextStage || 'completed lifecycle'}: {readiness.score}% — {readiness.label}</p>
      {readiness.nextStage && <button className="px-3 py-2 bg-[#14213D] text-white rounded disabled:opacity-40" disabled={readiness.missingRequirements.length > 0} onClick={advance}>Advance to {readiness.nextStage}</button>}
      {readiness.missingRequirements.length > 0 && <div><p className="font-semibold">Before you can advance:</p><ul className="list-disc pl-5">{readiness.missingRequirements.map(item => <li key={item}>{item}</li>)}</ul></div>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </div>
    {section === 'onboarding' ? <>
      <h3 className="font-semibold">Client onboarding checklist</h3>
      <div className="grid sm:grid-cols-2 gap-2">{onboarding.map(([key, label]) => checklist(label, Boolean(project.onboardingChecklist?.[key]), () => updateOnboardingChecklist(projectId, { [key]: !project.onboardingChecklist?.[key] })))}</div>
      <label className="block text-xs">Onboarding notes<textarea className="block border rounded w-full p-2 mt-1" value={project.onboardingChecklist?.notes || ''} disabled={completed} onChange={e => updateOnboardingChecklist(projectId, { notes: e.target.value })} /></label>
    </> : <>
      <h3 className="font-semibold">Review approval</h3>
      {checklist('Formal review approval recorded', Boolean(project.reviewApproved), () => setProjectReviewApproved(projectId, !project.reviewApproved))}
      <h3 className="font-semibold">Delivery verification</h3>
      <p className="text-xs text-[#737373]">These are the same five checks shown on the Handover page.</p>
      {delivery ? <div className="grid sm:grid-cols-2 gap-2">{verification.map(([key, label]) => checklist(label, delivery.gates[key], () => toggleHandoverGate(delivery.id, key)))}</div> : <button className="underline" onClick={() => initializeHandover(projectId)}>Initialize delivery checklist</button>}
      <h3 className="font-semibold">Handover records</h3>
      <p className="text-xs text-[#737373]">Record the supporting documentation and acceptance separately. Billing approval does not imply client acceptance.</p>
      <div className="grid sm:grid-cols-2 gap-2">{handover.map(([key, label]) => checklist(label, Boolean(project.handoverChecklist?.[key]), () => updateHandoverChecklist(projectId, { [key]: !project.handoverChecklist?.[key] })))}</div>
      <label className="block text-xs">Handover notes<textarea className="block border rounded w-full p-2 mt-1" value={project.handoverChecklist?.notes || ''} disabled={completed} onChange={e => updateHandoverChecklist(projectId, { notes: e.target.value })} /></label>
    </>}
  </section>;
}
