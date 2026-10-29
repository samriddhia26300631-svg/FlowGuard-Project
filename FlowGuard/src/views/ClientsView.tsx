import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Phone,
  User,
  Plus,
  ArrowRight,
  Briefcase,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useFlowGuard } from '../context/FlowGuardContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const ClientsView: React.FC = () => {
  const {
    clients,
    projects,
    searchQuery,
    setIsNewClientModalOpen,
    openProjectDetails,
  } = useFlowGuard();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const filteredClients = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.tier.toLowerCase().includes(q)
    );
  });

  const activeClient = selectedClientId
    ? clients.find((c) => c.id === selectedClientId)
    : filteredClients[0] || null;

  const clientProjects = activeClient
    ? projects.filter((p) => p.clientId === activeClient.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header bar with New Client */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#171717]">
            Client Accounts Directory
          </h2>
          <p className="text-xs text-[#737373]">
            {clients.length} active client organizations under contract
          </p>
        </div>
        <button
          onClick={() => setIsNewClientModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Client</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Clients List */}
        <div className="lg:col-span-7 space-y-3">
          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E8E4DD] p-12 text-center text-[#737373] text-xs">
              No clients match your search.
            </div>
          ) : (
            filteredClients.map((client) => {
              const activeCount = projects.filter(
                (p) => p.clientId === client.id && p.status !== 'Completed'
              ).length;
              const isSelected = activeClient?.id === client.id;

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#14213D] shadow-xs ring-1 ring-[#14213D]'
                      : 'bg-white border-[#E8E4DD] hover:border-[#14213D]/40 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#171717]">
                          {client.name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-[#FAF8F4] text-[#737373] border border-[#E8E4DD]">
                          {client.tier}
                        </span>
                      </div>
                      <div className="text-xs text-[#737373]">
                        {client.industry}
                      </div>
                    </div>
                    <StatusBadge status={client.health} />
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#E8E4DD] flex flex-wrap items-center justify-between text-xs text-[#737373] gap-2">
                    <div className="flex items-center gap-1.5 text-[#171717]">
                      <User className="w-3.5 h-3.5 text-[#737373]" />
                      <span>{client.contactPerson}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono tabular-nums text-[11px]">
                      <span>{activeCount} Active Deliverables</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#171717]">
                        ${client.totalSpend.toLocaleString()} Total Contracted
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Client Profile & Projects */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E8E4DD] shadow-2xs overflow-hidden sticky top-6">
          {activeClient ? (
            <div>
              <div className="p-5 border-b border-[#E8E4DD] bg-[#FAF8F4]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#737373]">
                    Client Account Profile
                  </span>
                  <StatusBadge status={activeClient.health} />
                </div>
                <h3 className="text-base font-bold text-[#171717] mt-1 font-['Manrope']">
                  {activeClient.name}
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  {activeClient.industry}
                </p>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* Contact Points */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
                    Operational Contact
                  </div>
                  <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD] space-y-1.5">
                    <div className="font-semibold text-[#171717] flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#737373]" />
                      <span>{activeClient.contactPerson}</span>
                    </div>
                    <div className="text-[11px] text-[#737373] flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#737373]" />
                      <a
                        href={`mailto:${activeClient.email}`}
                        className="hover:underline text-[#14213D]"
                      >
                        {activeClient.email}
                      </a>
                    </div>
                    <div className="text-[11px] text-[#737373] flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#737373]" />
                      <span>{activeClient.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD]">
                    <div className="text-[11px] text-[#737373]">Account Tier</div>
                    <div className="font-bold text-[#171717] mt-0.5">
                      {activeClient.tier}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#E8E4DD]">
                    <div className="text-[11px] text-[#737373]">Lifetime Value</div>
                    <div className="font-bold text-[#171717] font-mono mt-0.5">
                      ${activeClient.totalSpend.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Engaged Projects */}
                <div>
                  <div className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                    Contracted Projects ({clientProjects.length})
                  </div>
                  <div className="space-y-2">
                    {clientProjects.length === 0 ? (
                      <div className="text-xs text-[#737373] py-3 text-center">
                        No active projects currently attached to this client.
                      </div>
                    ) : (
                      clientProjects.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-lg border border-[#E8E4DD] bg-white hover:bg-[#FAF8F4] transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-xs text-[#171717]">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-[#737373] mt-0.5">
                              Due {p.deadline} · {p.progress}% Complete
                            </div>
                          </div>
                          <button
                            onClick={() => openProjectDetails(p.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-[#14213D] bg-[#F5F0E8] hover:bg-[#E8E4DD] rounded transition-colors"
                          >
                            Inspect
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#737373]">
              Select a client to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
