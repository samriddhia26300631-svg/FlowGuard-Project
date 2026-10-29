import React from 'react';
import {
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  Clock,
  ArrowRight,
  FileCheck,
  Server,
  PackageCheck,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { useFlowGuard } from '../context/FlowGuardContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { HandoverGate } from '../types';

export const HandoverView: React.FC = () => {
  const {
    handovers,
    toggleHandoverGate,
    openProjectDetails,
    searchQuery,
  } = useFlowGuard();

  const filteredHandovers = handovers.filter((h) => {
    if (!searchQuery) return true;
    return h.projectName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const readyCount = handovers.filter((h) => h.status === 'Ready for Delivery').length;
  const blockedCount = handovers.filter((h) => h.status === 'Blocked by QA').length;
  const pendingCount = handovers.filter((h) => h.status === 'Pending Gates').length;

  const gateDefinitions: Array<{
    key: keyof HandoverGate['gates'];
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      key: 'qaSignoff',
      label: 'QA Regression Sign-Off',
      description: 'Zero unresolved blockers or critical bugs in acceptance suite',
      icon: CheckCircle2,
    },
    {
      key: 'clientSignoff',
      label: 'Client Milestone Acceptance',
      description: 'Formal written client sign-off on deliverable checklist',
      icon: UserCheck,
    },
    {
      key: 'assetHandoff',
      label: 'Production Asset Bundle',
      description: 'Figma libraries, source code, and design tokens exported',
      icon: PackageCheck,
    },
    {
      key: 'infrastructureTransfer',
      label: 'Cloud & DNS Infrastructure Transfer',
      description: 'Production credentials, SSL certificates, and ownership handed over',
      icon: Server,
    },
    {
      key: 'finalBillingApproved',
      label: 'Milestone Invoicing Cleared',
      description: 'Retainer or milestone payment verified by agency accounting',
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Ready for Final Rollout
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#1E5631] tabular-nums">
              {readyCount}
            </span>
            <span className="text-xs text-[#737373]">all quality gates cleared</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Pending Stage Gates
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#975A16] tabular-nums">
              {pendingCount}
            </span>
            <span className="text-xs text-[#737373]">deliverables in verification</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DD] shadow-2xs">
          <div className="text-xs font-medium text-[#737373]">
            Blocked by Quality Gate
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Manrope'] text-[#9B1C1C] tabular-nums">
              {blockedCount}
            </span>
            <span className="text-xs text-[#737373]">cannot progress to production</span>
          </div>
        </div>
      </div>

      {/* Philosophy banner */}
      <div className="p-4 rounded-xl border border-[#E8E4DD] bg-white flex items-start gap-3 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-[#14213D] shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-[#171717]">
            FlowGuard Delivery Invariant:
          </span>{' '}
          <span className="text-[#737373]">
            Project completion requires completed work, resolved scope and commitments, all five delivery verification gates, and the handover records in Project Details.
          </span>
        </div>
      </div>

      {/* Projects Handover Checklist */}
      <div className="space-y-4">
        {filteredHandovers.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] p-12 text-center text-xs text-[#737373]">
            No projects found matching filter.
          </div>
        ) : (
          filteredHandovers.map((handover) => {
            return (
              <div
                key={handover.id}
                className="bg-white rounded-xl border border-[#E8E4DD] p-5 shadow-2xs space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#171717]">
                        {handover.projectName}
                      </h3>
                      <StatusBadge status={handover.status} />
                    </div>
                    <div className="text-xs text-[#737373] mt-0.5">
                      Target Handover Date: <span className="font-mono text-[#171717]">{handover.targetDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Overall Readiness Indicator */}
                    <div className="text-right">
                      <span className="text-[11px] text-[#737373] block">
                        Gate Readiness
                      </span>
                      <span className="font-mono font-bold text-sm text-[#171717] tabular-nums">
                        {handover.overallReadiness}%
                      </span>
                    </div>

                    <button
                      onClick={() => openProjectDetails(handover.projectId, 'gates')}
                      className="px-3 py-1.5 text-xs font-semibold text-[#14213D] bg-[#F5F0E8] hover:bg-[#E8E4DD] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>Project Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Readiness Meter */}
                <div className="w-full h-2 bg-[#FAF8F4] border border-[#E8E4DD] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      handover.overallReadiness === 100
                        ? 'bg-[#1E5631]'
                        : handover.overallReadiness >= 75
                        ? 'bg-[#14213D]'
                        : 'bg-[#975A16]'
                    }`}
                    style={{ width: `${handover.overallReadiness}%` }}
                  />
                </div>

                {/* 5 Quality Gates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                  {gateDefinitions.map((gate) => {
                    const isPassed = handover.gates[gate.key];
                    const Icon = gate.icon;
                    return (
                      <div
                        key={gate.key}
                        onClick={() => toggleHandoverGate(handover.id, gate.key)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer select-none flex flex-col justify-between ${
                          isPassed
                            ? 'bg-[#EBF5EE]/50 border-[#CCE8D4] text-[#1E5631]'
                            : 'bg-[#FAF8F4] border-[#E8E4DD] text-[#737373] hover:border-[#14213D]/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <Icon className={`w-4 h-4 ${isPassed ? 'text-[#1E5631]' : 'text-[#737373]'}`} />
                            <input
                              type="checkbox"
                              checked={isPassed}
                              onChange={() => {}} // handled by wrapper click
                              className="rounded text-[#14213D] focus:ring-0 cursor-pointer pointer-events-none"
                            />
                          </div>
                          <div className={`text-xs font-bold leading-tight ${isPassed ? 'text-[#171717]' : 'text-[#171717]'}`}>
                            {gate.label}
                          </div>
                          <p className="text-[10px] text-[#737373] mt-1 line-clamp-2">
                            {gate.description}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-black/5 text-[10px] font-semibold">
                          {isPassed ? 'Passed ✓' : 'Click to Verify'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
