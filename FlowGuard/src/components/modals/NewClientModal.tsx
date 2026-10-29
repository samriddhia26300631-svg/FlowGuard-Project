import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useFlowGuard } from '../../context/FlowGuardContext';
import { ClientTier, ClientHealth } from '../../types';

export const NewClientModal: React.FC = () => {
  const { isNewClientModalOpen, setIsNewClientModalOpen, createClient } = useFlowGuard();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tier, setTier] = useState<ClientTier>('Growth');
  const [health, setHealth] = useState<ClientHealth>('Healthy');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isNewClientModalOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Client company name is required';
    if (!industry.trim()) newErrors.industry = 'Industry is required';
    if (!contactPerson.trim()) newErrors.contactPerson = 'Primary contact name is required';
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid corporate email';
    }
    if (!phone.trim()) newErrors.phone = 'Contact phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    createClient({
      name: name.trim(),
      industry: industry.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      tier,
      health,
    });

    // Reset and close
    setName('');
    setIndustry('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setErrors({});
    setIsNewClientModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-[#E8E4DD] shadow-lg w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E4DD] bg-[#FAF8F4] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#171717]">
              Add Client Account
            </h3>
            <p className="text-xs text-[#737373]">
              Register client organization and operational contact points
            </p>
          </div>
          <button
            onClick={() => setIsNewClientModalOpen(false)}
            className="p-1 rounded-lg text-[#737373] hover:text-[#171717] hover:bg-[#E8E4DD] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Helix Robotics Inc."
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

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Industry Vertical <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Industrial Automation & Robotics"
              className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                errors.industry
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-[#E8E4DD] focus:border-[#14213D] focus:ring-[#14213D]'
              }`}
            />
            {errors.industry && (
              <p className="text-[11px] text-red-600 mt-1">{errors.industry}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Primary Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Rachel Foster"
                className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                  errors.contactPerson
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-[#E8E4DD] focus:border-[#14213D] focus:ring-[#14213D]'
                }`}
              />
              {errors.contactPerson && (
                <p className="text-[11px] text-red-600 mt-1">{errors.contactPerson}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="r.foster@helixrobotics.com"
                className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                  errors.email
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-[#E8E4DD] focus:border-[#14213D] focus:ring-[#14213D]'
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 762-9901"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D]"
              />
              {errors.phone && (
                <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Client Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as ClientTier)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D]"
              >
                <option value="Enterprise">Enterprise</option>
                <option value="Growth">Growth</option>
                <option value="Retainer">Retainer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Account Health
              </label>
              <select
                value={health}
                onChange={(e) => setHealth(e.target.value as ClientHealth)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D]"
              >
                <option value="Healthy">Healthy</option>
                <option value="Needs Attention">Needs Attention</option>
                <option value="At Risk">At Risk</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#E8E4DD] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewClientModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F4] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#0B132B] rounded-lg transition-colors shadow-xs"
            >
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
