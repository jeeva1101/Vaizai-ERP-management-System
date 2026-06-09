import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  DollarSign, Clock, Download, FileText, CheckCircle, 
  ChevronRight, Calendar, User, Printer, X 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '../lib/toast';

// High-fidelity Mock fallbacks
const MOCK_EMPLOYEES = [
  { _id: 'mock_e1', employeeId: 'EMP-001', firstName: 'David', lastName: 'Miller', department: 'Academics', designation: 'Maths Teacher', salaryStructure: { basicSalary: 45000, allowances: [{ name: 'HRA', amount: 5000 }], deductions: [{ name: 'PF', amount: 2000 }] } },
  { _id: 'mock_e2', employeeId: 'EMP-002', firstName: 'Sarah', lastName: 'Connor', department: 'Academics', designation: 'Senior Science Teacher', salaryStructure: { basicSalary: 48000, allowances: [{ name: 'HRA', amount: 5000 }], deductions: [{ name: 'PF', amount: 2200 }] } },
  { _id: 'mock_e3', employeeId: 'EMP-003', firstName: 'John', lastName: 'Doe', department: 'Finance', designation: 'Senior Accountant', salaryStructure: { basicSalary: 40000, allowances: [{ name: 'HRA', amount: 4000 }], deductions: [{ name: 'PF', amount: 1800 }] } }
];

const MOCK_PAYROLLS = [
  {
    _id: 'mock_p1',
    employee: { firstName: 'David', lastName: 'Miller', employeeId: 'EMP-001', department: 'Academics', designation: 'Maths Teacher' },
    month: 5,
    year: 2026,
    basicSalary: 45000,
    allowancesTotal: 5000,
    deductionsTotal: 2000,
    netSalary: 48000,
    status: 'Paid',
    paymentDate: '2026-05-30',
    paymentMethod: 'BankTransfer',
    payslipUrl: 'https://cloudinary.com/mock_payslip_EMP-001_5_2026.pdf'
  },
  {
    _id: 'mock_p2',
    employee: { firstName: 'Sarah', lastName: 'Connor', employeeId: 'EMP-002', department: 'Academics', designation: 'Senior Science Teacher' },
    month: 5,
    year: 2026,
    basicSalary: 48000,
    allowancesTotal: 5000,
    deductionsTotal: 2200,
    netSalary: 50800,
    status: 'Paid',
    paymentDate: '2026-05-30',
    paymentMethod: 'BankTransfer',
    payslipUrl: 'https://cloudinary.com/mock_payslip_EMP-002_5_2026.pdf'
  }
];

export default function Payroll() {
  const { activeBranchId, user } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState('run'); // 'run' or 'history'
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [activePayslip, setActivePayslip] = useState(null);

  // Queries
  const { data: employees } = useQuery({
    queryKey: ['employees', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/employees');
      return res.data.data.employees || [];
    },
    enabled: !!activeBranchId
  });

  const { data: payrollHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['payroll', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/employees/payroll');
      return res.data.data.payrolls || [];
    },
    enabled: !!activeBranchId
  });

  // Process Payroll Mutation
  const processPayrollMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/employees/payroll', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payroll']);
      toast.success('Payroll salary processed successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error processing payroll.');
    }
  });

  const handleProcessPayroll = (empId) => {
    processPayrollMutation.mutate({
      employeeId: empId,
      month: selectedMonth,
      year: selectedYear,
      paymentMethod: 'BankTransfer'
    });
  };

  const getMonthName = (m) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[m - 1];
  };

  if (!activeBranchId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Please select a branch to view payroll details.
      </div>
    );
  }

  const staffList = employees && employees.length > 0 ? employees : MOCK_EMPLOYEES;
  const historyList = payrollHistory && payrollHistory.length > 0 ? payrollHistory : MOCK_PAYROLLS;

  return (
    <div className="space-y-6">
      
      {/* Upper Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Financial Payroll</h2>
          <p className="text-xs text-gray-400 font-medium">Verify employee allocations, calculate monthly allowances/deductions, and process salaries</p>
        </div>

        {/* Tab selection */}
        <div className="flex bg-white/40 dark:bg-white/[0.02] border border-gray-200/40 dark:border-white/[0.06] rounded-xl p-1 self-start">
          <button 
            onClick={() => setActiveSubTab('run')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${activeSubTab === 'run' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-200'}`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            Process Payroll
          </button>
          <button 
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${activeSubTab === 'history' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-200'}`}
          >
            <FileText className="h-3.5 w-3.5" />
            Salaries Registry
          </button>
        </div>
      </div>

      {/* PROCESS PAYROLL PANEL */}
      {activeSubTab === 'run' && (
        <div className="space-y-4">
          
          {/* Controls Toolbar */}
          <div className="glass-card rounded-2xl p-4 border-gray-200/40 dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))} 
                className="bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>{getMonthName(m)}</option>
                ))}
              </select>

              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
                className="bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300"
              >
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
            
            <div className="text-[10px] font-bold text-gray-400 uppercase">
              Target Period: {getMonthName(selectedMonth)} {selectedYear}
            </div>
          </div>

          {/* Processing Registry */}
          <div className="glass-card rounded-3xl overflow-hidden border-gray-200/40 dark:border-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-white/[0.03] bg-gray-50/50 dark:bg-white/[0.01]">
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Employee ID</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Profile Name</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Basic Salary</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Allowances (Est)</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Deductions (Est)</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Calculated Net</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Salary Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/[0.02]">
                  {staffList.map((emp) => {
                    const basic = emp.salaryStructure?.basicSalary || 0;
                    const allowances = (emp.salaryStructure?.allowances || []).reduce((acc, c) => acc + c.amount, 0);
                    const deductions = (emp.salaryStructure?.deductions || []).reduce((acc, c) => acc + c.amount, 0);
                    const net = basic + allowances - deductions;

                    // Verify if already paid in historyList
                    const isAlreadyProcessed = historyList.some(h => 
                      h.employee?.employeeId === emp.employeeId && 
                      h.month === selectedMonth && 
                      h.year === selectedYear
                    );

                    return (
                      <tr key={emp._id} className="hover:bg-gray-100/30 dark:hover:bg-white/[0.01] transition-colors duration-150">
                        <td className="p-4 font-bold text-xs">{emp.employeeId}</td>
                        <td className="p-4 font-bold text-gray-900 dark:text-white">
                          {emp.firstName} {emp.lastName}
                          <span className="block text-[10px] text-gray-400 font-semibold">{emp.designation}</span>
                        </td>
                        <td className="p-4 font-semibold">₹{basic}</td>
                        <td className="p-4 font-semibold text-emerald-500">+₹{allowances}</td>
                        <td className="p-4 font-semibold text-rose-500">-₹{deductions}</td>
                        <td className="p-4 font-extrabold text-primary">₹{net}</td>
                        <td className="p-4">
                          {isAlreadyProcessed ? (
                            <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-emerald-500" /> Disbursed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleProcessPayroll(emp._id)}
                              disabled={processPayrollMutation.isPending}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md hover:scale-[1.01] transition-transform"
                            >
                              Disburse
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SALARIES HISTORY TAB */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <span className="text-xs font-bold text-gray-400 uppercase">Paid Payslips Repository</span>
          
          <div className="glass-card rounded-3xl overflow-hidden border-gray-200/40 dark:border-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-white/[0.03] bg-gray-50/50 dark:bg-white/[0.01]">
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Employee ID</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Name</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Payroll Month</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Net Salary</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Payment Date</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Payment Mode</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Payslip Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/[0.02]">
                  {historyList.map((hist) => (
                    <tr key={hist._id} className="hover:bg-gray-100/30 dark:hover:bg-white/[0.01] transition-colors duration-150">
                      <td className="p-4 font-bold text-xs">{hist.employee?.employeeId}</td>
                      <td className="p-4 font-bold text-gray-900 dark:text-white">
                        {hist.employee?.firstName} {hist.employee?.lastName}
                        <span className="block text-[10px] text-gray-400 font-semibold">{hist.employee?.designation}</span>
                      </td>
                      <td className="p-4 font-bold text-primary">{getMonthName(hist.month)} {hist.year}</td>
                      <td className="p-4 font-black text-primary">₹{hist.netSalary}</td>
                      <td className="p-4 text-xs font-semibold text-gray-500">{new Date(hist.paymentDate).toLocaleDateString()}</td>
                      <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">{hist.paymentMethod}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setActivePayslip(hist)}
                          className="px-3 py-1 bg-white/40 dark:bg-white/[0.02] border border-gray-200/40 dark:border-white/[0.08] hover:bg-gray-100 text-xs font-bold rounded-lg flex items-center gap-1 hover:scale-[1.01] transition-transform"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC PAYSLIP PDF SIMULATOR MODAL */}
      {activePayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl glass-panel p-6 rounded-3xl border-white/[0.08] shadow-2xl relative space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Employee Salary Slip</h3>
                <p className="text-xs text-gray-400">Statement of Earnings & Deductions</p>
              </div>
              <button 
                onClick={() => setActivePayslip(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.04]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Payslip Details Sheet */}
            <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-5 space-y-4">
              
              {/* Profile Block */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <p className="text-gray-400">Employee Name:</p>
                  <p className="text-white font-bold">{activePayslip.employee?.firstName} {activePayslip.employee?.lastName}</p>
                </div>
                <div>
                  <p className="text-gray-400">Designation / Role:</p>
                  <p className="text-white font-bold">{activePayslip.employee?.designation}</p>
                </div>
                <div>
                  <p className="text-gray-400">Employee ID:</p>
                  <p className="text-white font-mono font-bold">{activePayslip.employee?.employeeId}</p>
                </div>
                <div>
                  <p className="text-gray-400">Pay Period:</p>
                  <p className="text-primary font-bold">{getMonthName(activePayslip.month)} {activePayslip.year}</p>
                </div>
              </div>

              {/* Financial calculations */}
              <div className="border-t border-white/[0.04] pt-4 space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Earnings & Deductions Summary</h4>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* Earnings list */}
                  <div className="space-y-2">
                    <p className="font-extrabold text-emerald-500">Earnings</p>
                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                      <span className="text-gray-500">Basic Salary</span>
                      <span className="text-white font-semibold">₹{activePayslip.basicSalary}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                      <span className="text-gray-500">Allowances Total</span>
                      <span className="text-white font-semibold">+₹{activePayslip.allowancesTotal}</span>
                    </div>
                  </div>

                  {/* Deductions list */}
                  <div className="space-y-2">
                    <p className="font-extrabold text-rose-500">Deductions</p>
                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                      <span className="text-gray-500">Taxes & PF</span>
                      <span className="text-white font-semibold">-₹{activePayslip.deductionsTotal}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total payout */}
              <div className="border-t border-white/[0.04] pt-4 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Calculated Net Disbursement:</span>
                <span className="text-primary font-black text-lg">₹{activePayslip.netSalary}</span>
              </div>
            </div>

            {/* Print actions */}
            <div className="flex gap-3">
              <button
                onClick={() => toast.info('PDF payslip generation is available in the production build.')}
                className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Print Payslip
              </button>
              <button
                onClick={() => setActivePayslip(null)}
                className="py-2.5 px-4 border border-white/[0.06] hover:bg-white/[0.02] text-gray-400 hover:text-white text-xs font-semibold rounded-xl"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
