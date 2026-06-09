import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { PlusCircle, Search, UserPlus, Users, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '../lib/toast';

export default function StudentList() {
  const { activeBranchId } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { register, handleSubmit, reset } = useForm();

  // Fetch Students query
  const { data: students, isLoading } = useQuery({
    queryKey: ['students', activeBranchId, searchQuery],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/students', { params: { search: searchQuery } });
      return res.data.data.students;
    },
    enabled: !!activeBranchId
  });

  // Create Student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/students/register', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setIsAddingStudent(false);
      reset();
      toast.success('Student onboarded successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error registering student.');
    }
  });

  const onSubmit = (data) => {
    createStudentMutation.mutate(data);
  };

  if (!activeBranchId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Please select a branch to view students.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Student Directory</h2>
          <p className="text-xs text-gray-400 font-medium">Onboard, manage profiles, classes, sections, and parent relationships</p>
        </div>
        <button
          onClick={() => setIsAddingStudent(!isAddingStudent)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1.5 transition-transform hover:scale-[1.01]"
        >
          <UserPlus className="h-4 w-4" />
          {isAddingStudent ? 'Cancel' : 'Onboard Student'}
        </button>
      </div>

      {/* Onboarding Form */}
      {isAddingStudent && (
        <form onSubmit={handleSubmit(onSubmit)} className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-6">
          <h3 className="font-bold text-sm text-primary uppercase tracking-wide">1. Student Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">First Name</label>
              <input {...register('firstName', { required: true })} placeholder="John" className="w-full glass-input" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Last Name</label>
              <input {...register('lastName', { required: true })} placeholder="Doe" className="w-full glass-input" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Admission No</label>
              <input {...register('admissionNo', { required: true })} placeholder="ADM-2026-001" className="w-full glass-input" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Roll No</label>
              <input {...register('rollNo', { required: true })} placeholder="10" className="w-full glass-input" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address (Auth)</label>
              <input {...register('email', { required: true })} type="email" placeholder="john.doe@school.com" className="w-full glass-input" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Account Password</label>
              <input {...register('password', { required: true })} type="password" placeholder="••••••••" className="w-full glass-input" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Class Allocation</label>
              <input {...register('class', { required: true })} placeholder="Grade 10" className="w-full glass-input" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Section Allocation</label>
              <input {...register('section', { required: true })} placeholder="Section A" className="w-full glass-input" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Date Of Birth</label>
              <input {...register('dateOfBirth', { required: true })} type="date" className="w-full glass-input" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Gender</label>
              <select {...register('gender', { required: true })} className="w-full bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <h3 className="font-bold text-sm text-primary uppercase tracking-wide">2. Parent / Guardian Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Parent First Name</label>
              <input {...register('parentFirstName')} placeholder="Arthur" className="w-full glass-input" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Parent Last Name</label>
              <input {...register('parentLastName')} placeholder="Doe" className="w-full glass-input" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Parent Phone</label>
              <input {...register('parentPhone')} placeholder="9876543210" className="w-full glass-input" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Parent Email (Auth)</label>
              <input {...register('parentEmail')} type="email" placeholder="arthur.doe@school.com" className="w-full glass-input" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200/50 dark:border-white/[0.03] flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddingStudent(false)}
              className="px-5 py-2.5 rounded-xl border border-white/[0.06] hover:bg-white/[0.02] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStudentMutation.isPending}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/10"
            >
              {createStudentMutation.isPending ? 'Onboarding...' : 'Onboard Student Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Directory Table Grid */}
      <div className="space-y-4">
        
        {/* Search Toolbar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, admission ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-white/50 dark:bg-white/[0.02] border border-gray-200/40 dark:border-white/[0.06] rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Table */}
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
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Admission ID</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Roll No</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Name</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Class</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Parent</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/[0.02]">
                  {students?.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500 font-medium">No students registered in this branch directory.</td>
                    </tr>
                  ) : (
                    students?.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-100/30 dark:hover:bg-white/[0.01] transition-colors duration-150">
                        <td className="p-4 font-bold">{student.admissionNo}</td>
                        <td className="p-4 font-semibold text-gray-500">{student.rollNo}</td>
                        <td className="p-4 font-bold text-gray-900 dark:text-white">{student.firstName} {student.lastName}</td>
                        <td className="p-4 font-bold text-primary">{student.class} - {student.section}</td>
                        <td className="p-4 font-medium text-gray-600 dark:text-gray-300">
                          {student.parent ? `${student.parent.firstName} ${student.parent.lastName}` : 'N/A'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            student.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
