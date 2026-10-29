import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useFlowGuard } from '../../context/FlowGuardContext';
import { ProjectStatus, ScopeStatus } from '../../types';

export const NewProjectModal: React.FC = () => {
  const {
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
    clients,
    team,
    createProject,
  } = useFlowGuard();

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [owner, setOwner] = useState(team[0]?.name || '');
  const [ownerRole, setOwnerRole] = useState(team[0]?.role || 'Technical Lead');
  const [deadline, setDeadline] = useState('2026-12-01');
  const [budget, setBudget] = useState('75000');
  const [allocatedHours, setAllocatedHours] = useState('500');
  const [status, setStatus] = useState<ProjectStatus>('On Track');
  const [scopeStatus, setScopeStatus] = useState<ScopeStatus>('Locked');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prompt 4: Progressive Client Onboarding Checklist state
  const [clientContactConfirmed, setClientContactConfirmed] = useState(true);
  const [objectivesDefined, setObjectivesDefined] = useState(true);
  const [requirementsDocumented, setRequirementsDocumented] = useState(false);
  const [scopeConfirmed, setScopeConfirmed] = useState(true);
  const [budgetConfirmed, setBudgetConfirmed] = useState(true);
  const [deadlineAgreed, setDeadlineAgreed] = useState(true);
  const [projectOwnerAssigned, setProjectOwnerAssigned] = useState(true);
  const [requiredAssetsReceived, setRequiredAssetsReceived] = useState(false);
  const [kickoffApprovalReceived, setKickoffApprovalReceived] = useState(false);
  const [showOnboardingSection, setShowOnboardingSection] = useState(true);

  if (!isNewProjectModalOpen) return null;

  const handleOwnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setOwner(selectedName);
    const member = team.find((t) => t.name === selectedName);
    if (member) setOwnerRole(member.role);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Project name is required';
    if (!clientId) newErrors.clientId = 'Please select a client';
    if (!owner) newErrors.owner = 'Project owner is required';
    if (!deadline) newErrors.deadline = 'Target deadline is required';
    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) {
      newErrors.budget = 'Valid numeric budget is required';
    }
    if (!allocatedHours || isNaN(Number(allocatedHours)) || Number(allocatedHours) <= 0) {
      newErrors.allocatedHours = 'Valid numeric hours required';
    }
    if (!description.trim()) newErrors.description = 'Brief project scope description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedClient = clients.find((c) => c.id === clientId);

    createProject({
      name: name.trim(),
      clientId,
      clientName: selectedClient?.name || 'Client',
      owner,
      ownerRole,
      deadline,
      progress: 0,
      status,
      stage: 'Onboarding',
      budget: Number(budget),
      allocatedHours: Number(allocatedHours),
      scopeStatus,
      description: description.trim(),
      onboardingChecklist: {
        clientContactConfirmed,
        objectivesDefined,
        requirementsDocumented,
        scopeConfirmed,
        budgetConfirmed,
        deadlineAgreed,
        projectOwnerAssigned: Boolean(owner && projectOwnerAssigned),
        requiredAssetsReceived,
        kickoffApprovalReceived,
        notes: 'Initial client onboarding checklist configured.',
        updatedAt: new Date().toISOString().split('T')[0],
      },
    });

    // Reset and close
    setName('');
    setDescription('');
    setErrors({});
    setIsNewProjectModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-[#E8E4DD] shadow-lg w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E4DD] bg-[#FAF8F4] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#171717]">
              Create New Project
            </h3>
            <p className="text-xs text-[#737373]">
              Configure contractual scope, timeline, and delivery lead
            </p>
          </div>
          <button
            onClick={() => setIsNewProjectModalOpen(false)}
            className="p-1 rounded-lg text-[#737373] hover:text-[#171717] hover:bg-[#E8E4DD] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Omnichannel Checkout Platform"
              className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                errors.name
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-[#E8E4DD] focus:border-[#14213D] focus:ring-[#14213D]'
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* Client & Owner Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Client Organization <span className="text-red-500">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.tier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Delivery Lead / Owner <span className="text-red-500">*</span>
              </label>
              <select
                value={owner}
                onChange={handleOwnerChange}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D]"
              >
                {team.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline & Budget Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Target Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Budget (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="75000"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D] font-mono"
              />
              {errors.budget && (
                <p className="text-[11px] text-red-600 mt-1">{errors.budget}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Allocated Hours <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={allocatedHours}
                onChange={(e) => setAllocatedHours(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D] font-mono"
              />
              {errors.allocatedHours && (
                <p className="text-[11px] text-red-600 mt-1">{errors.allocatedHours}</p>
              )}
            </div>
          </div>

          {/* Status & Scope Control */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D]"
              >
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Blocked">Blocked</option>
                <option value="Review">Review</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Scope Guard Status
              </label>
              <select
                value={scopeStatus}
                onChange={(e) => setScopeStatus(e.target.value as ScopeStatus)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D]"
              >
                <option value="Locked">Locked (Strict Baseline)</option>
                <option value="Revision Pending">Revision Pending</option>
                <option value="Scope Creep Alert">Scope Creep Alert</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Project Description & Scope Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of deliverables, technical dependencies, and target architecture..."
              className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                errors.description
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-[#E8E4DD] focus:border-[#14213D] focus:ring-[#14213D]'
              }`}
            />
            {errors.description && (
              <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Smart Client Onboarding Checklist */}
          <div className="border border-[#E8E4DD] rounded-xl p-4 bg-[#FAF8F4]/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#14213D]" />
                  Initial Client Onboarding Checklist
                </h4>
                <p className="text-[11px] text-[#737373]">
                  Project starts in Onboarding stage. Complete these gates to unlock Planning.
                </p>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-[#E8E4DD] text-[#14213D]">
                {[
                  clientContactConfirmed,
                  objectivesDefined,
                  requirementsDocumented,
                  scopeConfirmed,
                  budgetConfirmed,
                  deadlineAgreed,
                  projectOwnerAssigned,
                  requiredAssetsReceived,
                  kickoffApprovalReceived,
                ].filter(Boolean).length}/9 Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              <label className="flex items-center gap-2 text-[#171717] cursor-pointer">
                <input
                  type="checkbox"
                  checked={clientContactConfirmed}
                  onChange={(e) => setClientContactConfirmed(e.target.checked)}
                  className="rounded border-[#E8E4DD] text-[#14213D] focus:ring-[#14213D]"
                />
                <span>Client contact confirmed</span>
              </label>
              <label className="flex items-center gap-2 text-[#171717] cursor-pointer">
                <input
                  type="checkbox"
                  checked={objectivesDefined}
                  onChange={(e) => setObjectivesDefined(e.target.checked)}
                  className="rounded border-[#E8E4DD] text-[#14213D] focus:ring-[#14213D]"
                />
                <span>Project objectives defined</span>
              </label>
              <label className="flex items-center gap-2 text-[#171717] cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirementsDocumented}
                  onChange={(e) => setRequirementsDocumented(e.target.checked)}
                  className="rounded border-[#E8E4DD] text-[#14213D] focus:ring-[#14213D]"
                />
                <span>Requirements documented</span>
              </label>
              <label className="flex items-center gap-2 text-[#171717] cursor-pointer">
                <input
                  type="checkbox"
                  checked={scopeConfirmed}
                  onChange={(e) => setScopeConfirmed(e.target.checked)}
                  className="rounded border-[#E8E4DD] text-[#14213D] focus:ring-[#14213D]"
                />
                <span>Scope confirmed</span>
              </label>
              <label className="flex items-center gap-2 text-[#171717] cursor-pointer">
                <input
                  type="checkbox"
                  checked={budgetConfirmed}
                  onChange={(e) => setBudgetConfirmed(e.target.checked)}
                  className="rounded border-[#E8E4DD] text-[#14213D] focus:ring-[#14213D]"
                />
                <span>Budget confirmed</span>
              </label>
              <label className="flex items-center gap-2 text-[#171717] cursor-pointer">
                <input
                  type="checkbox"
                  checked={deadlineAgreed}
                  onChange={(e) => setDeadlineAgreed(e.target.checked)}
                  className="rounded border-[#E8E4DD] text-[#14213D] focus:ring-[#14213D]"
                />
                <span>Deadline agreed</span>
              </label>
              <label className="flex items-center gap-2 text-[#171717] cursor-pointer">
                <input
                  type="checkbox"
                  checked={projectOwnerAssigned}
                  onChange={(e) => setProjectOwnerAssigned(e.target.checked)}
                  className="rounded border-[#E8E4DD] text-[#14213D] focus:ring-[#14213D]"
                />
                <span>Project owner assigned</span>
              </label>
              <label className="flex items-center gap-2 text-[#171717] cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiredAssetsReceived}
                  onChange={(e) => setRequiredAssetsReceived(e.target.checked)}
                  className="rounded border-[#E8E4DD] text-[#14213D] focus:ring-[#14213D]"
                />
                <span>Required client assets received</span>
              </label>
              <label className="flex items-center gap-2 text-[#171717] cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  checked={kickoffApprovalReceived}
                  onChange={(e) => setKickoffApprovalReceived(e.target.checked)}
                  className="rounded border-[#E8E4DD] text-[#14213D] focus:ring-[#14213D]"
                />
                <span>Kickoff approval received</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#E8E4DD] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg transition-colors shadow-xs"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
