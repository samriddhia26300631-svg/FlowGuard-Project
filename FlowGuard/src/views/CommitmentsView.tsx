import React, { useState } from 'react';
import {
  CalendarCheck,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User,
  CheckCircle2,
  Edit2,
  Check,
  X,
  Filter,
} from 'lucide-react';
import { useFlowGuard } from '../context/FlowGuardContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Commitment, CommitmentStatus } from '../types';

export const CommitmentsView: React.FC = () => {
  const {
    commitments,
    createCommitment,
    updateCommitment,
    fulfillCommitment,
    projects,
    team,
    searchQuery,
    openProjectDetails,
  } = useFlowGuard();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'due-soon' | 'overdue' | 'fulfilled'>('all');
  const [showNewCommitmentModal, setShowNewCommitmentModal] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);

  // New Commitment Form State
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || '');
  const [newCommitmentText, setNewCommitmentText] = useState('');
  const [newDeadline, setNewDeadline] = useState('2026-11-20');
  const [newConfidence, setNewConfidence] = useState<'High' | 'Medium' | 'Critical Risk'>('High');
  const [newSlaTerms, setNewSlaTerms] = useState('');
  const [newResponsibleMember, setNewResponsibleMember] = useState(team[0]?.name || 'Marcus Vance');
  const [newStatus, setNewStatus] = useState<CommitmentStatus>('Pending');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredCommitments = commitments.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      c.commitment.toLowerCase().includes(q) ||
      c.clientName.toLowerCase().includes(q) ||
      c.projectName.toLowerCase().includes(q) ||
      (c.responsibleMember && c.responsibleMember.toLowerCase().includes(q)) ||
      (c.owner && c.owner.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    const deadline = c.dueDate || c.committedDeadline;
    const isOverdue = c.status === 'Overdue' || (c.status !== 'Fulfilled' && c.status !== 'Delivered' && deadline < todayStr);

    if (activeTab === 'pending') {
      return c.status === 'Pending' || c.status === 'On Schedule';
    }
    if (activeTab === 'due-soon') {
      return c.status === 'Due Soon' || (c.status !== 'Fulfilled' && !isOverdue && deadline >= todayStr);
    }
    if (activeTab === 'overdue') {
      return isOverdue;
    }
    if (activeTab === 'fulfilled') {
      return c.status === 'Fulfilled' || c.status === 'Delivered';
    }
    return true;
  });

  const fulfilledCount = commitments.filter(
    (c) => c.status === 'Fulfilled' || c.status === 'Delivered'
  ).length;

  const overdueCount = commitments.filter((c) => {
    const deadline = c.dueDate || c.committedDeadline;
    return (
      c.status === 'Overdue' ||
      (c.status !== 'Fulfilled' && c.status !== 'Delivered' && deadline < todayStr)
    );
  }).length;

  const pendingCount = commitments.filter(
    (c) => c.status === 'Pending' || c.status === 'On Schedule'
  ).length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommitmentText.trim()) return;

    const targetProj = projects.find((p) => p.id === newProjectId) || projects[0];

    createCommitment({
      clientName: targetProj?.clientName || 'Client Partner',
      projectId: targetProj?.id || 'p-1',
      projectName: targetProj?.name || 'Project Deliverable',
      commitment: newCommitmentText.trim(),
      committedDeadline: newDeadline,
      dueDate: newDeadline,
      confidence: newConfidence,
      slaTerms: newSlaTerms.trim() || 'Contractual SLA milestone deliverable',
      owner: newResponsibleMember,
      responsibleMember: newResponsibleMember,
      status: newStatus,
    });

    setNewCommitmentText('');
    setNewSlaTerms('');
    setShowNewCommitmentModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommitment) return;

    updateCommitment(editingCommitment.id, {
      commitment: editingCommitment.commitment,
      committedDeadline: editingCommitment.committedDeadline,
      dueDate: editingCommitment.committedDeadline,
      responsibleMember: editingCommitment.responsibleMember,
      owner: editingCommitment.responsibleMember,
      confidence: editingCommitment.confidence,
      slaTerms: editingCommitment.slaTerms,
      status: editingCommitment.status,
    });

    setEditingCommitment(null);
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Total Commitments
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#171717] tabular-nums">
              {commitments.length}
            </span>
            <span className="text-xs text-[#737373]">SLA milestones</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Fulfilled Promises
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#1E5631] tabular-nums">
              {fulfilledCount}
            </span>
            <span className="text-xs text-[#737373]">honored successfully</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Overdue Commitments
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-['Manrope'] tabular-nums ${
                overdueCount > 0 ? 'text-[#9B1C1C]' : 'text-[#171717]'
              }`}
            >
              {overdueCount}
            </span>
            <span className="text-xs text-[#737373]">requires escalation</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Pending / On Schedule
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#14213D] tabular-nums">
              {pendingCount}
            </span>
            <span className="text-xs text-[#737373]">under active delivery</span>
          </div>
        </div>
      </div>

      {/* Header bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E8E4DD] shadow-2xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
            }`}
          >
            All ({commitments.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'pending'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'overdue'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
            }`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            onClick={() => setActiveTab('fulfilled')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'fulfilled'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4]'
            }`}
          >
            Fulfilled ({fulfilledCount})
          </button>
        </div>

        <button
          onClick={() => setShowNewCommitmentModal(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log New Commitment</span>
        </button>
      </div>

      {/* Commitments Table */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E4DD] bg-[#FAF8F4] text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
                <th className="py-3 px-4">Deliverable Commitment</th>
                <th className="py-3 px-3">Client & Project</th>
                <th className="py-3 px-3">Committed Date</th>
                <th className="py-3 px-3">Responsible Lead</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DD] text-xs">
              {filteredCommitments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#737373]">
                    No commitments found matching search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCommitments.map((c) => {
                  const deadline = c.dueDate || c.committedDeadline;
                  const isFulfilled = c.status === 'Fulfilled' || c.status === 'Delivered';
                  const isOverdue = !isFulfilled && (c.status === 'Overdue' || deadline < todayStr);
                  const displayStatus: CommitmentStatus = isFulfilled
                    ? 'Fulfilled'
                    : isOverdue
                    ? 'Overdue'
                    : c.status;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-[#FAF8F4]/80 transition-colors ${
                        isOverdue ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-[#171717]">
                          {c.commitment}
                        </div>
                        <div className="text-[11px] text-[#737373] mt-0.5">
                          {c.slaTerms}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-[#171717]">
                          {c.clientName}
                        </div>
                        <div className="text-[11px] text-[#737373]">
                          {c.projectName}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap font-mono tabular-nums text-[#171717]">
                        <span className={isOverdue ? 'text-[#9B1C1C] font-bold' : ''}>
                          {deadline}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap text-[#171717]">
                        <span className="font-medium">{c.responsibleMember || c.owner}</span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusBadge status={displayStatus} />
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        {!isFulfilled ? (
                          <button
                            onClick={() => fulfillCommitment(c.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-[#1E5631] hover:bg-[#164324] rounded-md transition-colors inline-flex items-center gap-1 shadow-2xs"
                            title="Mark commitment fulfilled and clear alert"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Fulfilled</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#1E5631] inline-flex items-center gap-1 px-2 py-0.5 bg-[#DEF7EC] rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            Fulfilled
                          </span>
                        )}

                        <button
                          onClick={() => setEditingCommitment(c)}
                          className="px-2 py-1 text-xs font-medium text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4] border border-[#E8E4DD] rounded-md transition-colors"
                          title="Edit Commitment"
                        >
                          <Edit2 className="w-3 h-3 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Commitment Modal */}
      {showNewCommitmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E8E4DD] shadow-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E4DD] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#171717]">
                  Log Client Commitment (PromiseKeeper)
                </h3>
                <p className="text-xs text-[#737373]">
                  Record SLA promises and assign accountability
                </p>
              </div>
              <button
                onClick={() => setShowNewCommitmentModal(false)}
                className="p-1 rounded-lg text-[#737373] hover:text-[#171717]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Deliverable Commitment <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deliver payment gateway integration test reports"
                  value={newCommitmentText}
                  onChange={(e) => setNewCommitmentText(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Associated Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.clientName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Committed Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Responsible Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newResponsibleMember}
                    onChange={(e) => setNewResponsibleMember(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg"
                  >
                    {team.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as CommitmentStatus)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Due Soon">Due Soon</option>
                    <option value="Overdue">Overdue</option>
                    <option value="On Schedule">On Schedule</option>
                    <option value="Fulfilled">Fulfilled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Confidence Level
                  </label>
                  <select
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg"
                  >
                    <option value="High">High Confidence</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="Critical Risk">Critical Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Contractual Terms / SLA Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Services Agreement §4.2 SLA Milestone clause"
                  value={newSlaTerms}
                  onChange={(e) => setNewSlaTerms(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E4DD]">
                <button
                  type="button"
                  onClick={() => setShowNewCommitmentModal(false)}
                  className="px-3 py-1.5 text-xs text-[#737373] hover:text-[#171717]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg shadow-xs"
                >
                  Save Commitment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Commitment Modal */}
      {editingCommitment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E8E4DD] shadow-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E4DD] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#171717]">
                  Edit Client Commitment
                </h3>
                <p className="text-xs text-[#737373]">
                  Update SLA terms, responsible owner, or target date
                </p>
              </div>
              <button
                onClick={() => setEditingCommitment(null)}
                className="p-1 rounded-lg text-[#737373] hover:text-[#171717]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Commitment Description
                </label>
                <input
                  type="text"
                  value={editingCommitment.commitment}
                  onChange={(e) =>
                    setEditingCommitment({ ...editingCommitment, commitment: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Committed Due Date
                  </label>
                  <input
                    type="date"
                    value={editingCommitment.committedDeadline}
                    onChange={(e) =>
                      setEditingCommitment({ ...editingCommitment, committedDeadline: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Responsible Lead
                  </label>
                  <select
                    value={editingCommitment.responsibleMember || editingCommitment.owner}
                    onChange={(e) =>
                      setEditingCommitment({ ...editingCommitment, responsibleMember: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg"
                  >
                    {team.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Status
                  </label>
                  <select
                    value={editingCommitment.status}
                    onChange={(e) =>
                      setEditingCommitment({
                        ...editingCommitment,
                        status: e.target.value as CommitmentStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Due Soon">Due Soon</option>
                    <option value="Overdue">Overdue</option>
                    <option value="On Schedule">On Schedule</option>
                    <option value="Fulfilled">Fulfilled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Confidence Level
                  </label>
                  <select
                    value={editingCommitment.confidence}
                    onChange={(e) =>
                      setEditingCommitment({
                        ...editingCommitment,
                        confidence: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg"
                  >
                    <option value="High">High Confidence</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="Critical Risk">Critical Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Contractual Terms / SLA Notes
                </label>
                <input
                  type="text"
                  value={editingCommitment.slaTerms}
                  onChange={(e) =>
                    setEditingCommitment({ ...editingCommitment, slaTerms: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E4DD]">
                <button
                  type="button"
                  onClick={() => setEditingCommitment(null)}
                  className="px-3 py-1.5 text-xs text-[#737373] hover:text-[#171717]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
