import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { PlusCircle, ShieldAlert, CheckCircle, RefreshCcw, PhoneCall } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function CrmLeads() {
  const { activeBranchId } = useAuthStore();
  const queryClient = useQueryClient();
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [followUpNotes, setFollowUpNotes] = useState('');

  const { register, handleSubmit, reset } = useForm();

  // Fetch Leads query
  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['leads', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/crm');
      return res.data.data.leads;
    },
    enabled: !!activeBranchId
  });

  // Create Lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/crm', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      setIsAddingLead(false);
      reset();
    }
  });

  // Add Follow Up mutation
  const addFollowUpMutation = useMutation({
    mutationFn: async ({ id, notes }) => {
      return await api.post(`/crm/${id}/followup`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      setSelectedLead(null);
      setFollowUpNotes('');
    }
  });

  const onSubmit = (data) => {
    createLeadMutation.mutate(data);
  };

  const handleAddFollowUp = (id) => {
    if (!followUpNotes) return;
    addFollowUpMutation.mutate({ id, notes: followUpNotes });
  };

  if (!activeBranchId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Please select a branch to view CRM leads.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Admission Leads & Inquiries</h2>
          <p className="text-xs text-gray-400 font-medium">Track new inquiries, record conversations, and monitor conversion rates</p>
        </div>
        <button
          onClick={() => setIsAddingLead(!isAddingLead)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1.5 transition-transform hover:scale-[1.01]"
        >
          <PlusCircle className="h-4 w-4" />
          {isAddingLead ? 'Cancel' : 'New Lead'}
        </button>
      </div>

      {isAddingLead && (
        <form onSubmit={handleSubmit(onSubmit)} className="glass-card rounded-2xl p-6 border-gray-200/40 dark:border-white/[0.04] grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase">Student Name</label>
            <input {...register('studentName', { required: true })} placeholder="John Doe" className="w-full glass-input" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase">Parent Name</label>
            <input {...register('parentName', { required: true })} placeholder="Jane Doe" className="w-full glass-input" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase">Phone No</label>
            <input {...register('phone', { required: true })} placeholder="9876543210" className="w-full glass-input" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase">Email</label>
            <input {...register('email')} placeholder="parent@school.com" className="w-full glass-input" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase">Grade Applied</label>
            <input {...register('gradeApplied', { required: true })} placeholder="Grade 10" className="w-full glass-input" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase">Source</label>
            <select {...register('source')} className="w-full bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none">
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="WalkIn">Walk In</option>
              <option value="SocialMedia">Social Media</option>
            </select>
          </div>
          <div className="md:col-span-3 pt-2">
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-transform hover:scale-[1.01]">
              Save Lead Details
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden border-gray-200/40 dark:border-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200/50 dark:border-white/[0.03] bg-gray-50/50 dark:bg-white/[0.01]">
                  <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Student</th>
                  <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Parent</th>
                  <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Contact</th>
                  <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Grade</th>
                  <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Status</th>
                  <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/30 dark:divide-white/[0.02]">
                {leads?.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500 font-medium">No leads registered. Add your first inquiry!</td>
                  </tr>
                ) : (
                  leads?.map((lead) => (
                    <React.Fragment key={lead._id}>
                      <tr className="hover:bg-gray-100/30 dark:hover:bg-white/[0.01] transition-colors duration-150">
                        <td className="p-4 font-bold">{lead.studentName}</td>
                        <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">{lead.parentName}</td>
                        <td className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400">{lead.phone}</td>
                        <td className="p-4 text-xs font-bold text-primary">{lead.gradeApplied}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            lead.status === 'New' ? 'bg-blue-500/10 text-blue-500' :
                            lead.status === 'FollowUp' ? 'bg-amber-500/10 text-amber-500' :
                            lead.status === 'Admitted' ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-4 flex items-center gap-2">
                          <button
                            onClick={() => setSelectedLead(selectedLead === lead._id ? null : lead._id)}
                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.04] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors"
                            title="Log Call / Follow Up"
                          >
                            <PhoneCall className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                      {selectedLead === lead._id && (
                        <tr className="bg-gray-50/50 dark:bg-white/[0.01]">
                          <td colSpan="6" className="p-4 border-t border-gray-200/50 dark:border-white/[0.03]">
                            <div className="max-w-lg space-y-3 p-4 glass-card rounded-2xl">
                              <h5 className="text-xs font-bold uppercase text-gray-400">Follow-up History</h5>
                              {lead.followUps.length === 0 ? (
                                <p className="text-xs text-gray-500">No contact history recorded yet.</p>
                              ) : (
                                <ul className="space-y-1.5 max-h-24 overflow-y-auto">
                                  {lead.followUps.map((fu, idx) => (
                                    <li key={idx} className="text-xs">
                                      <span className="font-bold text-primary mr-1.5">{new Date(fu.date).toLocaleDateString()}</span>
                                      <span className="text-gray-600 dark:text-gray-300 font-medium">{fu.notes}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <div className="flex gap-2 pt-2">
                                <input
                                  type="text"
                                  placeholder="Log conversation details..."
                                  value={followUpNotes}
                                  onChange={(e) => setFollowUpNotes(e.target.value)}
                                  className="flex-1 glass-input py-1.5"
                                />
                                <button
                                  onClick={() => handleAddFollowUp(lead._id)}
                                  className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover shadow-md"
                                >
                                  Save Logs
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
