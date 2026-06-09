import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  Users, UserPlus, FileText, Check, X, 
  Trash2, Mail, Phone, Calendar, DollarSign 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '../lib/toast';

// High-fidelity Mock data for fallbacks
const MOCK_EMPLOYEES = [
  {
    _id: 'mock_e1',
    employeeId: 'EMP-001',
    firstName: 'David',
    lastName: 'Miller',
    phone: '9876543211',
    joiningDate: '2025-08-01',
    department: 'Academics',
    designation: 'Maths Teacher',
    status: 'Active',
    salaryStructure: { basicSalary: 45000 },
    user: { email: 'david.miller@erpedu.com' }
  },
  {
    _id: 'mock_e2',
    employeeId: 'EMP-002',
    firstName: 'Sarah',
    lastName: 'Connor',
    phone: '9876543212',
    joiningDate: '2025-09-15',
    department: 'Academics',
    designation: 'Senior Science Teacher',
    status: 'Active',
    salaryStructure: { basicSalary: 48000 },
    user: { email: 'sarah.connor@erpedu.com' }
  },
  {
    _id: 'mock_e3',
    employeeId: 'EMP-003',
    firstName: 'John',
    lastName: 'Doe',
    phone: '9876543213',
    joiningDate: '2025-10-01',
    department: 'Finance',
    designation: 'Senior Accountant',
    status: 'Active',
    salaryStructure: { basicSalary: 40000 },
    user: { email: 'john.doe@erpedu.com' }
  }
];

const MOCK_LEAVES = [
  {
    _id: 'mock_l1',
    employee: { firstName: 'Sarah', lastName: 'Connor', employeeId: 'EMP-002', department: 'Academics' },
    leaveType: 'Sick',
    startDate: '2026-06-10',
    endDate: '2026-06-12',
    reason: 'Medical checkup and rest',
    status: 'Pending'
  },
  {
    _id: 'mock_l2',
    employee: { firstName: 'David', lastName: 'Miller', employeeId: 'EMP-001', department: 'Academics' },
    leaveType: 'Casual',
    startDate: '2026-06-18',
    endDate: '2026-06-19',
    reason: 'Family event out of city',
    status: 'Pending'
  }
];

export default function StaffManagement() {
  const { activeBranchId, user } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState('directory'); // 'directory' or 'leaves'
  
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isRequestingLeave, setIsRequestingLeave] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [reviewComment, setReviewComment] = useState('');

  const onboardForm = useForm();
  const leaveForm = useForm();

  // Queries
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/employees');
      return res.data.data.employees || [];
    },
    enabled: !!activeBranchId
  });

  const { data: leaves, isLoading: loadingLeaves } = useQuery({
    queryKey: ['leaves', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/employees/leaves');
      return res.data.data.leaves || [];
    },
    enabled: !!activeBranchId
  });

  // Mutations
  const registerEmployeeMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/employees', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      setIsAddingStaff(false);
      onboardForm.reset();
      toast.success('Employee successfully onboarded and system account created!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error registering employee.');
    }
  });

  const requestLeaveMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/employees/leaves', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leaves']);
      setIsRequestingLeave(false);
      leaveForm.reset();
      toast.success('Leave request submitted for review!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error requesting leave.');
    }
  });

  const reviewLeaveMutation = useMutation({
    mutationFn: async ({ id, status, comments }) => {
      return await api.put(`/employees/leaves/${id}/approve`, { status, comments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leaves']);
      setSelectedLeaveId(null);
      setReviewComment('');
      toast.success('Leave application decision recorded.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error updating leave request.');
    }
  });

  const handleOnboard = (data) => {
    registerEmployeeMutation.mutate({
      ...data,
      joiningDate: new Date()
    });
  };

  const handleRequestLeave = (data) => {
    requestLeaveMutation.mutate(data);
  };

  const handleReviewLeave = (id, status) => {
    reviewLeaveMutation.mutate({ id, status, comments: reviewComment });
  };

  if (!activeBranchId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Please select a branch to manage employees.
      </div>
    );
  }

  const activeEmployees = employees && employees.length > 0 ? employees : MOCK_EMPLOYEES;
  const activeLeaves = leaves && leaves.length > 0 ? leaves : MOCK_LEAVES;

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-xs text-gray-400 font-medium">Onboard, directory search, configure payroll frameworks, and manage staff leave records</p>
        </div>

        {/* Tab selection */}
        <div className="flex bg-white/40 dark:bg-white/[0.02] border border-gray-200/40 dark:border-white/[0.06] rounded-xl p-1 self-start">
          <button 
            onClick={() => setActiveSubTab('directory')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${activeSubTab === 'directory' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-200'}`}
          >
            <Users className="h-3.5 w-3.5" />
            Staff Directory
          </button>
          <button 
            onClick={() => setActiveSubTab('leaves')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${activeSubTab === 'leaves' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-200'}`}
          >
            <FileText className="h-3.5 w-3.5" />
            Leave Registry
          </button>
        </div>
      </div>

      {/* STAFF DIRECTORY PANEL */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs font-bold text-gray-400 uppercase">Branch Employees Directory</span>
            
            {user?.role !== 'Teacher' && user?.role !== 'Accountant' && (
              <button
                onClick={() => setIsAddingStaff(!isAddingStaff)}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1.5"
              >
                <UserPlus className="h-4 w-4" />
                {isAddingStaff ? 'Cancel' : 'Onboard Employee'}
              </button>
            )}
          </div>

          {/* Onboard form modal */}
          {isAddingStaff && (
            <form onSubmit={onboardForm.handleSubmit(handleOnboard)} className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-6">
              <h3 className="font-bold text-sm text-primary uppercase tracking-wide">1. Employee Personal Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">First Name</label>
                  <input {...onboardForm.register('firstName', { required: true })} placeholder="David" className="w-full glass-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Last Name</label>
                  <input {...onboardForm.register('lastName', { required: true })} placeholder="Miller" className="w-full glass-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Employee ID</label>
                  <input {...onboardForm.register('employeeId', { required: true })} placeholder="EMP-2026-01" className="w-full glass-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Contact Phone</label>
                  <input {...onboardForm.register('phone', { required: true })} placeholder="9876543211" className="w-full glass-input" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">System Account Email</label>
                  <input {...onboardForm.register('email', { required: true })} type="email" placeholder="david.miller@erpedu.com" className="w-full glass-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">System Account Password</label>
                  <input {...onboardForm.register('password', { required: true })} type="password" placeholder="••••••••" className="w-full glass-input" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Role Type</label>
                  <select {...onboardForm.register('role', { required: true })} className="w-full bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                    <option value="Teacher">Teacher</option>
                    <option value="HR">HR</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Principal">Principal</option>
                  </select>
                </div>
              </div>

              <h3 className="font-bold text-sm text-primary uppercase tracking-wide">2. Allocation & Compensation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Department</label>
                  <select {...onboardForm.register('department', { required: true })} className="w-full bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                    <option value="Academics">Academics</option>
                    <option value="Administration">Administration</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Designation</label>
                  <input {...onboardForm.register('designation', { required: true })} placeholder="Maths Teacher" className="w-full glass-input" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Basic Monthly Salary (INR)</label>
                  <input {...onboardForm.register('basicSalary', { required: true, valueAsNumber: true })} type="number" placeholder="45000" className="w-full glass-input" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200/50 dark:border-white/[0.03] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingStaff(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/[0.06] hover:bg-white/[0.02] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerEmployeeMutation.isPending}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/10"
                >
                  {registerEmployeeMutation.isPending ? 'Onboarding...' : 'Onboard Profile'}
                </button>
              </div>
            </form>
          )}

          {/* Directory Grid/Table */}
          <div className="glass-card rounded-3xl overflow-hidden border-gray-200/40 dark:border-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-white/[0.03] bg-gray-50/50 dark:bg-white/[0.01]">
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Employee ID</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Name</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Department</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Designation</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Contacts</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Salary Band</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/[0.02]">
                  {activeEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-gray-100/30 dark:hover:bg-white/[0.01] transition-colors duration-150">
                      <td className="p-4 font-bold text-xs">{emp.employeeId}</td>
                      <td className="p-4 font-bold text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</td>
                      <td className="p-4 font-bold text-primary">{emp.department}</td>
                      <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">{emp.designation}</td>
                      <td className="p-4 text-xs font-semibold text-gray-500 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" /> {emp.user?.email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" /> {emp.phone}
                        </div>
                      </td>
                      <td className="p-4 font-extrabold text-primary">₹{emp.salaryStructure?.basicSalary}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE REGISTRY PANEL */}
      {activeSubTab === 'leaves' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submit leave request (visible to staff roles) */}
          <div className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Request Leave</h3>
            </div>
            
            <form onSubmit={leaveForm.handleSubmit(handleRequestLeave)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Leave Category</label>
                <select {...leaveForm.register('leaveType', { required: true })} className="w-full bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl px-4 py-2 text-xs">
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Earned">Earned Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Start Date</label>
                  <input {...leaveForm.register('startDate', { required: true })} type="date" className="w-full glass-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">End Date</label>
                  <input {...leaveForm.register('endDate', { required: true })} type="date" className="w-full glass-input" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Justification / Reason</label>
                <textarea {...leaveForm.register('reason', { required: true })} placeholder="State details here..." rows="3" className="w-full glass-input py-2" />
              </div>

              <button
                type="submit"
                disabled={requestLeaveMutation.isPending}
                className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg"
              >
                {requestLeaveMutation.isPending ? 'Sending...' : 'Submit Application'}
              </button>
            </form>
          </div>

          {/* Pending leave list (visible to admins/HR for review) */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-xs font-bold text-gray-400 uppercase block">Pending Leave Requests</span>
            
            <div className="space-y-3">
              {activeLeaves.map((leave) => (
                <div key={leave._id} className="glass-card rounded-2xl p-5 border-gray-200/40 dark:border-white/[0.04] flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-extrabold text-sm">{leave.employee?.firstName} {leave.employee?.lastName}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">{leave.employee?.department} • ID: {leave.employee?.employeeId}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}</span>
                      <span className="font-bold text-primary uppercase">[{leave.leaveType}]</span>
                    </div>

                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white/30 dark:bg-white/[0.01] p-2.5 rounded-lg border border-white/[0.04]">
                      <span className="text-[9px] font-bold uppercase text-gray-400 block mb-0.5">Reason:</span>
                      {leave.reason}
                    </p>
                  </div>

                  {/* Approve/Reject controllers (visible to managers) */}
                  {leave.status === 'Pending' && (
                    <div className="flex flex-col justify-between items-end gap-3 md:w-56 flex-shrink-0">
                      {selectedLeaveId === leave._id ? (
                        <div className="w-full space-y-2">
                          <input 
                            type="text" 
                            placeholder="Add comments..." 
                            value={reviewComment} 
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="w-full pl-3 pr-2 py-1.5 bg-white/50 dark:bg-white/[0.01] border border-gray-200/40 dark:border-white/[0.08] rounded-xl text-xs outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReviewLeave(leave._id, 'Approved')}
                              disabled={reviewLeaveMutation.isPending}
                              className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewLeave(leave._id, 'Rejected')}
                              disabled={reviewLeaveMutation.isPending}
                              className="flex-1 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setSelectedLeaveId(leave._id)}
                          className="px-3.5 py-1.5 bg-indigo-600/10 text-indigo-400 font-bold text-xs rounded-xl hover:bg-indigo-600/20"
                        >
                          Review Request
                        </button>
                      )}

                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold uppercase tracking-wider rounded">
                        {leave.status}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
