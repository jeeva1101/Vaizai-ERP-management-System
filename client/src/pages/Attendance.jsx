import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  UserCheck, UserX, Clock, Calendar, CheckCircle2, 
  Search, ShieldAlert, FileDown, TrendingUp, Users 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useToast } from '../lib/toast';

// High-fidelity Mock Students as fallback
const MOCK_STUDENTS = [
  { _id: 'mock_s1', firstName: 'Aarav', lastName: 'Sharma', rollNo: '1', admissionNo: 'ADM-2026-001', class: 'Grade 10', section: 'Section A' },
  { _id: 'mock_s2', firstName: 'Ananya', lastName: 'Iyer', rollNo: '2', admissionNo: 'ADM-2026-002', class: 'Grade 10', section: 'Section A' },
  { _id: 'mock_s3', firstName: 'Kabir', lastName: 'Verma', rollNo: '3', admissionNo: 'ADM-2026-003', class: 'Grade 10', section: 'Section A' },
  { _id: 'mock_s4', firstName: 'Diya', lastName: 'Patel', rollNo: '4', admissionNo: 'ADM-2026-004', class: 'Grade 10', section: 'Section A' },
  { _id: 'mock_s5', firstName: 'Rohan', lastName: 'Gupta', rollNo: '5', admissionNo: 'ADM-2026-005', class: 'Grade 10', section: 'Section A' },
  { _id: 'mock_s6', firstName: 'Sai', lastName: 'Reddy', rollNo: '6', admissionNo: 'ADM-2026-006', class: 'Grade 10', section: 'Section A' },
  { _id: 'mock_s7', firstName: 'Meera', lastName: 'Nair', rollNo: '7', admissionNo: 'ADM-2026-007', class: 'Grade 10', section: 'Section A' }
];

// Mock historical stats for Recharts
const MOCK_ANALYTICS = [
  { name: 'Mon', Present: 95, Absent: 3, Late: 2 },
  { name: 'Tue', Present: 92, Absent: 5, Late: 3 },
  { name: 'Wed', Present: 97, Absent: 1, Late: 2 },
  { name: 'Thu', Present: 89, Absent: 7, Late: 4 },
  { name: 'Fri', Present: 94, Absent: 2, Late: 4 }
];

export default function Attendance() {
  const { activeBranchId } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('register'); // 'register' or 'reports'
  
  // Local state for attendance records before saving
  const [localRecords, setLocalRecords] = useState({});

  // 1. Fetch branch students to populate register
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/students');
      return res.data.data.students || [];
    },
    enabled: !!activeBranchId
  });

  // Filter students based on class, section, and search query
  const filteredStudents = (students && students.length > 0 ? students : MOCK_STUDENTS).filter(s => {
    const matchesClass = s.class?.toLowerCase() === selectedClass.toLowerCase() &&
                         s.section?.toLowerCase() === selectedSection.toLowerCase();
    const matchesSearch = searchQuery === '' || 
                          `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.admissionNo?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Initialize/reset attendance local state when active class or filtered list changes
  useEffect(() => {
    const initialRecords = {};
    filteredStudents.forEach(s => {
      initialRecords[s._id] = {
        studentId: s._id,
        status: 'Present',
        remarks: '',
        lateMinutes: 0
      };
    });
    setLocalRecords(initialRecords);
  }, [selectedClass, selectedSection, students]);

  // 2. Query saved attendance for date
  const { data: savedReport, isLoading: loadingReport } = useQuery({
    queryKey: ['attendance', activeBranchId, selectedDate],
    queryFn: async () => {
      if (!activeBranchId) return null;
      const res = await api.get('/academics/attendance', {
        params: { startDate: selectedDate, endDate: selectedDate }
      });
      return res.data.data.records || [];
    },
    enabled: !!activeBranchId && !!selectedDate
  });

  // Check if we already have saved attendance in DB for today, merge with local state
  useEffect(() => {
    if (savedReport && savedReport.length > 0) {
      const updatedRecords = { ...localRecords };
      savedReport.forEach(rec => {
        if (rec.student) {
          updatedRecords[rec.student] = {
            studentId: rec.student,
            status: rec.status,
            remarks: rec.remarks || '',
            lateMinutes: rec.lateMinutes || 0
          };
        }
      });
      setLocalRecords(updatedRecords);
    }
  }, [savedReport]);

  // 3. Mark/Save Attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/academics/attendance', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance', activeBranchId, selectedDate]);
      toast.success('Attendance register updated successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit attendance.');
    }
  });

  const handleStatusChange = (studentId, status) => {
    setLocalRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRecordMetaChange = (studentId, field, value) => {
    setLocalRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    const recordsArray = Object.values(localRecords);
    if (recordsArray.length === 0) {
      toast.warning('No students to mark in the current filter.');
      return;
    }
    markAttendanceMutation.mutate({
      date: selectedDate,
      records: recordsArray
    });
  };

  // Stats calculators
  const stats = React.useMemo(() => {
    const list = Object.values(localRecords);
    const total = list.length;
    const present = list.filter(r => r.status === 'Present').length;
    const absent = list.filter(r => r.status === 'Absent').length;
    const late = list.filter(r => r.status === 'Late').length;
    const halfDay = list.filter(r => r.status === 'HalfDay').length;
    
    return {
      total,
      present,
      absent,
      late,
      halfDay,
      rate: total > 0 ? Math.round((present / total) * 100) : 100
    };
  }, [localRecords]);

  // Export to CSV helper
  const handleExportCSV = () => {
    const list = filteredStudents.map(s => {
      const record = localRecords[s._id] || {};
      return {
        'Admission ID': s.admissionNo,
        'Roll No': s.rollNo,
        'Student Name': `${s.firstName} ${s.lastName}`,
        'Class': s.class,
        'Section': s.section,
        'Status': record.status || 'Present',
        'Remarks': record.remarks || ''
      };
    });

    const headers = Object.keys(list[0] || {}).join(',');
    const rows = list.map(item => Object.values(item).map(v => `"${v}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${selectedClass}_${selectedSection}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!activeBranchId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Please select a branch to view attendance registries.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Attendance Register</h2>
          <p className="text-xs text-gray-400 font-medium">Record daily student attendance, manage excused absentees, and view statistics</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white/40 dark:bg-white/[0.02] border border-gray-200/40 dark:border-white/[0.06] rounded-xl p-1 self-start">
          <button 
            onClick={() => setActiveTab('register')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === 'register' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            Mark Attendance
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === 'reports' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            Analytics & Reports
          </button>
        </div>
      </div>

      {activeTab === 'register' ? (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-gray-200/40 dark:border-white/[0.04]">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Class Total</p>
                <h4 className="text-lg font-black mt-1">{stats.total}</h4>
              </div>
              <Users className="h-8 w-8 text-indigo-500 bg-indigo-500/10 p-1.5 rounded-xl" />
            </div>
            
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-gray-200/40 dark:border-white/[0.04]">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Present</p>
                <h4 className="text-lg font-black text-emerald-500 mt-1">{stats.present}</h4>
              </div>
              <UserCheck className="h-8 w-8 text-emerald-500 bg-emerald-500/10 p-1.5 rounded-xl" />
            </div>

            <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-gray-200/40 dark:border-white/[0.04]">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Absent</p>
                <h4 className="text-lg font-black text-rose-500 mt-1">{stats.absent}</h4>
              </div>
              <UserX className="h-8 w-8 text-rose-500 bg-rose-500/10 p-1.5 rounded-xl" />
            </div>

            <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-gray-200/40 dark:border-white/[0.04]">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Late Arrivals</p>
                <h4 className="text-lg font-black text-amber-500 mt-1">{stats.late}</h4>
              </div>
              <Clock className="h-8 w-8 text-amber-500 bg-amber-500/10 p-1.5 rounded-xl" />
            </div>

            <div className="glass-card rounded-2xl p-4 col-span-2 md:col-span-1 flex items-center justify-between border-gray-200/40 dark:border-white/[0.04]">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Attendance Rate</p>
                <h4 className="text-lg font-black text-primary mt-1">{stats.rate}%</h4>
              </div>
              <TrendingUp className="h-8 w-8 text-primary bg-primary/10 p-1.5 rounded-xl" />
            </div>
          </div>

          {/* Filtering & Actions Panel */}
          <div className="glass-card rounded-2xl p-4 border-gray-200/40 dark:border-white/[0.04] flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Select */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase block">Class</label>
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)} 
                  className="bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 font-semibold outline-none"
                >
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 8">Grade 8</option>
                </select>
              </div>

              {/* Section Select */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase block">Section</label>
                <select 
                  value={selectedSection} 
                  onChange={(e) => setSelectedSection(e.target.value)} 
                  className="bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 font-semibold outline-none"
                >
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                </select>
              </div>

              {/* Date Selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase block">Date</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 font-semibold outline-none"
                />
              </div>

              {/* Search Registry */}
              <div className="space-y-1 w-full sm:w-48">
                <label className="text-[9px] font-bold text-gray-400 uppercase block">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search registry..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save & Download Buttons */}
            <div className="flex gap-2 self-end">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 border border-white/[0.06] hover:bg-white/[0.02] text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <FileDown className="h-3.5 w-3.5" />
                Export CSV
              </button>
              <button
                onClick={handleSave}
                disabled={markAttendanceMutation.isPending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/10 flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {markAttendanceMutation.isPending ? 'Saving Registry...' : 'Submit Register'}
              </button>
            </div>
          </div>

          {/* Student Grid Register */}
          <div className="glass-card rounded-3xl overflow-hidden border-gray-200/40 dark:border-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-white/[0.03] bg-gray-50/50 dark:bg-white/[0.01]">
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Roll No</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Admission No</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Student Name</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs text-center">Status Action</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Late Minutes</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Remarks / Exceptions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/[0.02]">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500 font-medium">
                        No students enrolled in this section.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const record = localRecords[student._id] || { status: 'Present', remarks: '', lateMinutes: 0 };
                      return (
                        <tr key={student._id} className="hover:bg-gray-100/30 dark:hover:bg-white/[0.01] transition-colors duration-150">
                          <td className="p-4 font-semibold text-gray-500">{student.rollNo}</td>
                          <td className="p-4 font-bold text-xs">{student.admissionNo}</td>
                          <td className="p-4 font-bold text-gray-900 dark:text-white">{student.firstName} {student.lastName}</td>
                          
                          {/* Attendance Status Radios */}
                          <td className="p-4">
                            <div className="flex justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student._id, 'Present')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                                  record.status === 'Present' 
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                    : 'bg-white/40 dark:bg-white/[0.02] text-gray-500 hover:text-emerald-500'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student._id, 'Absent')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                                  record.status === 'Absent' 
                                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                                    : 'bg-white/40 dark:bg-white/[0.02] text-gray-500 hover:text-rose-500'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student._id, 'Late')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                                  record.status === 'Late' 
                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                                    : 'bg-white/40 dark:bg-white/[0.02] text-gray-500 hover:text-amber-500'
                                }`}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student._id, 'HalfDay')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                                  record.status === 'HalfDay' 
                                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                                    : 'bg-white/40 dark:bg-white/[0.02] text-gray-500 hover:text-blue-500'
                                }`}
                              >
                                Half Day
                              </button>
                            </div>
                          </td>

                          {/* Late Minutes Input */}
                          <td className="p-4">
                            <input
                              type="number"
                              disabled={record.status !== 'Late'}
                              value={record.lateMinutes || ''}
                              onChange={(e) => handleRecordMetaChange(student._id, 'lateMinutes', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="w-16 text-center py-1 bg-white/50 dark:bg-white/[0.01] border border-gray-200/40 dark:border-white/[0.08] rounded-lg text-xs outline-none disabled:opacity-40"
                            />
                          </td>

                          {/* Remarks Input */}
                          <td className="p-4">
                            <input
                              type="text"
                              value={record.remarks || ''}
                              onChange={(e) => handleRecordMetaChange(student._id, 'remarks', e.target.value)}
                              placeholder="e.g. Doctor appointment"
                              className="w-full pl-3 pr-2 py-1 bg-white/50 dark:bg-white/[0.01] border border-gray-200/40 dark:border-white/[0.08] rounded-lg text-xs outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Analytics Reports View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Visual Analytics Chart */}
            <div className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] md:col-span-2 space-y-4">
              <div>
                <h3 className="font-bold text-sm">Weekly Attendance Ratio</h3>
                <p className="text-[10px] text-gray-400">Aggregated daily logs for the past week</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_ANALYTICS} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.03)" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} domain={[80, 100]} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="Present" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPresent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Rules Card */}
            <div className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-primary">Attendance Rules</h3>
              <ul className="space-y-3.5 text-xs font-semibold text-gray-500 dark:text-gray-300">
                <li className="flex gap-2">
                  <span className="h-5 w-5 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center font-bold text-[10px]">1</span>
                  <span>Daily check-in closes strictly by 9:00 AM. Any check-ins after 9:15 AM will automatically flag as "Late".</span>
                </li>
                <li className="flex gap-2">
                  <span className="h-5 w-5 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center font-bold text-[10px]">2</span>
                  <span>Teachers must record comments for any student marked as "Absent" to update parent dashboards.</span>
                </li>
                <li className="flex gap-2">
                  <span className="h-5 w-5 bg-rose-500/10 text-rose-500 rounded-lg flex items-center justify-center font-bold text-[10px]">3</span>
                  <span>Three consecutive unexcused absences trigger automated warnings to the respective branch administrators.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
