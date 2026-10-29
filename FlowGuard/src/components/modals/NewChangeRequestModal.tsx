import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useFlowGuard } from '../../context/FlowGuardContext';

export const NewChangeRequestModal: React.FC = () => {
  const {
    isNewChangeRequestModalOpen,
    setIsNewChangeRequestModalOpen,
    projects,
    createChangeRequest,
  } = useFlowGuard();

  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [impactHours, setImpactHours] = useState('24');
  const [impactBudget, setImpactBudget] = useState('3600');
  const [impactTimelineDays, setImpactTimelineDays] = useState('3');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isNewChangeRequestModalOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!requestedBy.trim()) newErrors.requestedBy = 'Requester name is required';
    if (!impactHours || isNaN(Number(impactHours))) newErrors.impactHours = 'Valid hours required';
    if (!impactBudget || isNaN(Number(impactBudget))) newErrors.impactBudget = 'Valid budget required';
    if (!impactTimelineDays || isNaN(Number(impactTimelineDays))) newErrors.impactTimelineDays = 'Valid days required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const targetProject = projects.find((p) => p.id === projectId);

    createChangeRequest({
      projectId,
      projectName: targetProject?.name || 'Project',
      title: title.trim(),
      description: description.trim(),
      requestedBy: requestedBy.trim(),
      impactHours: Number(impactHours),
      impactBudget: Number(impactBudget),
      impactTimelineDays: Number(impactTimelineDays),
      status: 'Pending Approval',
    });

    setTitle('');
    setDescription('');
    setRequestedBy('');
    setErrors({});
    setIsNewChangeRequestModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-[#E8E4DD] shadow-lg w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E4DD] bg-[#FAF8F4] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#171717]">
              Submit Scope Change Request
            </h3>
            <p className="text-xs text-[#737373]">
              Quantify budget and schedule impact before approving client requests
            </p>
          </div>
          <button
            onClick={() => setIsNewChangeRequestModalOpen(false)}
            className="p-1 rounded-lg text-[#737373] hover:text-[#171717] hover:bg-[#E8E4DD] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Impacted Project <span className="text-red-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.clientName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Change Request Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Add Apple Pay & Google Pay direct SDK checkout"
              className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                errors.title
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-[#E8E4DD] focus:border-[#14213D] focus:ring-[#14213D]'
              }`}
            />
            {errors.title && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Requested By <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
              placeholder="e.g. Sarah Sterling (Acme Global VP)"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D]"
            />
            {errors.requestedBy && (
              <p className="text-[11px] text-red-600 mt-1">{errors.requestedBy}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Hours Impact
              </label>
              <input
                type="number"
                value={impactHours}
                onChange={(e) => setImpactHours(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Budget Impact ($)
              </label>
              <input
                type="number"
                value={impactBudget}
                onChange={(e) => setImpactBudget(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Delay Days
              </label>
              <input
                type="number"
                value={impactTimelineDays}
                onChange={(e) => setImpactTimelineDays(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Technical Description & Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the required architecture modifications and why it falls outside the original MSA scope..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D]"
            />
            {errors.description && (
              <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          <div className="pt-3 border-t border-[#E8E4DD] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewChangeRequestModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg transition-colors shadow-xs"
            >
              Log Change Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
