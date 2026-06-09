import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { 
  Users, UserCheck, ShieldAlert, CreditCard, 
  PlusCircle, Sparkles, TrendingUp, BookOpen,
  GraduationCap, Calendar, Clock, Award, CheckCircle, 
  AlertCircle, BookOpenCheck, CalendarDays, Wallet,
  User as UserIcon, Bell, ClipboardList, Info, ChevronRight,
  TrendingDown
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';
import { useToast } from '../lib/toast';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/* ─── HIGH FIDELITY STUDENT MOCK DATA ──────────────────────────── */
const MOCK_STUDENT_TEACHERS = [
  { firstName: 'David', lastName: 'Miller' },
  { firstName: 'Sarah', lastName: 'Connor' },
  { firstName: 'Emily', lastName: 'Watson' },
  { firstName: 'Jane', lastName: 'Doe' },
  { firstName: 'Alan', lastName: 'Turing' }
];

const MOCK_STUDENT_TIMETABLE = [
  {
    dayOfWeek: 'Monday',
    periods: [
      { subject: 'Mathematics', startTime: '09:00', endTime: '09:45', roomNo: 'Room 201', teacher: MOCK_STUDENT_TEACHERS[0] },
      { subject: 'Science', startTime: '10:00', endTime: '10:45', roomNo: 'Lab A', teacher: MOCK_STUDENT_TEACHERS[1] },
      { subject: 'English', startTime: '11:00', endTime: '11:45', roomNo: 'Room 304', teacher: MOCK_STUDENT_TEACHERS[2] }
    ]
  },
  {
    dayOfWeek: 'Tuesday',
    periods: [
      { subject: 'Social Studies', startTime: '09:00', endTime: '09:45', roomNo: 'Room 102', teacher: MOCK_STUDENT_TEACHERS[3] },
      { subject: 'Mathematics', startTime: '10:00', endTime: '10:45', roomNo: 'Room 201', teacher: MOCK_STUDENT_TEACHERS[0] }
    ]
  },
  {
    dayOfWeek: 'Wednesday',
    periods: [
      { subject: 'Science', startTime: '09:00', endTime: '09:45', roomNo: 'Lab A', teacher: MOCK_STUDENT_TEACHERS[1] },
      { subject: 'English', startTime: '10:00', endTime: '10:45', roomNo: 'Room 304', teacher: MOCK_STUDENT_TEACHERS[2] }
    ]
  },
  {
    dayOfWeek: 'Thursday',
    periods: [
      { subject: 'Social Studies', startTime: '09:00', endTime: '09:45', roomNo: 'Room 102', teacher: MOCK_STUDENT_TEACHERS[3] },
      { subject: 'Computer Science', startTime: '10:00', endTime: '10:45', roomNo: 'Lab B', teacher: MOCK_STUDENT_TEACHERS[4] }
    ]
  },
  {
    dayOfWeek: 'Friday',
    periods: [
      { subject: 'Mathematics', startTime: '09:00', endTime: '09:45', roomNo: 'Room 201', teacher: MOCK_STUDENT_TEACHERS[0] },
      { subject: 'Science', startTime: '10:00', endTime: '10:45', roomNo: 'Lab A', teacher: MOCK_STUDENT_TEACHERS[1] }
    ]
  }
];

const MOCK_STUDENT_RESULTS = [
  {
    exam: { name: 'Mid-Term Examination 2026' },
    percentage: 88.33,
    grade: 'A',
    marksObtained: [
      { subject: 'Mathematics', marks: 92 },
      { subject: 'Science', marks: 85 },
      { subject: 'English', marks: 88 }
    ]
  },
  {
    exam: { name: 'Quarterly Assessment 2026' },
    percentage: 91.67,
    grade: 'A+',
    marksObtained: [
      { subject: 'Mathematics', marks: 95 },
      { subject: 'Science', marks: 90 },
      { subject: 'English', marks: 90 }
    ]
  }
];

const MOCK_STUDENT_EXAMS = [
  {
    _id: 'mock_exam_1',
    name: 'Final Term Examinations 2026',
    term: 'Second Term',
    startDate: '2026-06-20',
    endDate: '2026-06-27',
    schedules: [
      { subject: 'Mathematics', date: '2026-06-20', maxMarks: 100, passingMarks: 35 },
      { subject: 'Science', date: '2026-06-22', maxMarks: 100, passingMarks: 35 },
      { subject: 'English', date: '2026-06-25', maxMarks: 100, passingMarks: 35 }
    ]
  }
];

const MOCK_STUDENT_ATTENDANCE = [
  { date: '2026-06-05', status: 'Present' },
  { date: '2026-06-04', status: 'Present' },
  { date: '2026-06-03', status: 'Late', remarks: 'School bus was delayed' },
  { date: '2026-06-02', status: 'Present' },
  { date: '2026-06-01', status: 'Present' },
  { date: '2026-05-29', status: 'Absent', remarks: 'High fever, submitted sick leave' },
  { date: '2026-05-28', status: 'Present' },
  { date: '2026-05-27', status: 'Present' }
];

const MOCK_ANNOUNCEMENTS = [
  { title: 'Annual Science Fair 2026', content: 'Registrations are open for the annual science fair. Submit project ideas by June 12th.', date: 'June 5, 2026', tag: 'Academic' },
  { title: 'School Timings Revision', content: 'Starting next week, morning assembly begins at 08:15 AM sharp due to summer weather.', date: 'June 3, 2026', tag: 'Important' }
];

/* ─── STUDENT DASHBOARD COMPONENT ──────────────────────────────── */
function StudentDashboard({ user }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'academics', 'attendance', 'fees'
  
  // Payment Modal simulation
  const [paymentModalData, setPaymentModalData] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [localFees, setLocalFees] = useState([]);

  // 1. Fetch Student Profile
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      const res = await api.get('/students/profile');
      return res.data.data.student;
    }
  });

  const studentId = profileData?._id;
  const studentClass = profileData?.class || 'Grade 10';
  const studentSection = profileData?.section || 'Section A';

  // 2. Fetch Fee Records - server auto-resolves the student from the auth token,
  // so we don't need to pass studentId. This avoids branch-context mismatches.
  const { data: feesData, isLoading: feesLoading } = useQuery({
    queryKey: ['studentFees', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      // No ?studentId param — server resolves student from req.user._id directly
      const res = await api.get('/finance/records');
      return res.data.data.records;
    },
    enabled: !!studentId
  });

  // 3. Fetch Results
  const { data: resultsData } = useQuery({
    queryKey: ['studentResults', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const res = await api.get('/academics/results', { params: { studentId } });
      return res.data.data.results;
    },
    enabled: !!studentId
  });

  // 4. Fetch Timetable
  const { data: timetableData } = useQuery({
    queryKey: ['studentTimetable', studentClass, studentSection],
    queryFn: async () => {
      const res = await api.get('/academics/timetable', {
        params: { class: studentClass, section: studentSection }
      });
      return res.data.data.timetables;
    }
  });

  // 5. Fetch Attendance Reports
  const { data: attendanceData } = useQuery({
    queryKey: ['studentAttendance', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const res = await api.get('/academics/attendance', { params: { studentId } });
      return res.data.data.records;
    },
    enabled: !!studentId
  });

  // Sync localFees from server data. Never fall back to mock data for real students —
  // if feesData is empty it means no fees have been assigned yet (show empty state).
  useEffect(() => {
    if (feesData !== undefined) {
      setLocalFees(feesData || []);
    }
  }, [feesData]);


  // Payment triggers
  const triggerCheckoutMutation = useMutation({
    mutationFn: async (feeRecordId) => {
      // All fee records are real DB records — always go through the real checkout API
      const res = await api.post('/finance/checkout', { feeRecordId });
      return { ...res.data.data, feeRecordId };
    },
    onSuccess: (data) => {
      setPaymentModalData(data);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error initializing checkout.');
    }
  });

  const completePaymentMutation = useMutation({
    mutationFn: async (payload) => {
      // Only skip the real API call if this is a purely local mock record (ID starts with 'mock_').
      // Real DB fee records must always call /finance/verify so the payment is persisted
      // and visible in the institution's fee collection dashboard.
      if (payload.isMockRecord) {
        return { status: 'success', mockPayload: payload };
      }
      return await api.post('/finance/verify', payload);
    },
    onSuccess: () => {
      const recordId = paymentModalData.feeRecordId;
      
      // Update local UI state optimistically
      setLocalFees(prev => prev.map(f => {
        if (f._id === recordId) {
          return { ...f, paidAmount: f.amount, status: 'Paid' };
        }
        return f;
      }));

      // Always refetch fee records from server to stay in sync with institution dashboard
      queryClient.invalidateQueries(['studentFees']);
      
      setPaymentModalData(null);
      toast.success('Fee payment verified and settled successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Payment verification failed.');
    }
  });

  const handlePayNow = (id) => {
    triggerCheckoutMutation.mutate(id);
  };

  const handlePayment = async () => {
    if (!paymentModalData) return;
    const isMockRecord = paymentModalData.feeRecordId?.startsWith('mock_');

    if (paymentModalData.keyId === 'rzp_test_mockkeyid123' || isMockRecord) {
      setIsProcessingPayment(true);
      setTimeout(() => {
        setIsProcessingPayment(false);
        completePaymentMutation.mutate({
          razorpayOrderId: paymentModalData.order.id,
          razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
          razorpaySignature: 'mock_signature',
          isMockRecord
        });
      }, 1500);
      return;
    }

    setIsProcessingPayment(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setIsProcessingPayment(false);
      toast.error('Razorpay SDK failed to load. Please try again.');
      return;
    }

    const feeRecord = localFees.find(f => f._id === paymentModalData.feeRecordId);

    const options = {
      key: paymentModalData.keyId,
      amount: paymentModalData.order.amount,
      currency: paymentModalData.order.currency || 'INR',
      name: 'ERP-EDU',
      description: feeRecord ? `Fee Payment - ${feeRecord.feeCategory?.name}` : 'Fee Payment',
      order_id: paymentModalData.order.id,
      handler: function (response) {
        setIsProcessingPayment(false);
        completePaymentMutation.mutate({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          isMockRecord: false
        });
      },
      prefill: {
        name: profileData ? `${profileData.firstName} ${profileData.lastName}` : '',
        email: user?.email || '',
        contact: ''
      },
      theme: {
        color: '#6366f1'
      },
      modal: {
        ondismiss: function () {
          setIsProcessingPayment(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Resolve active displays or fallbacks
  const timetable = timetableData && timetableData.length > 0 ? timetableData : MOCK_STUDENT_TIMETABLE;
  const results = resultsData && resultsData.length > 0 ? resultsData : MOCK_STUDENT_RESULTS;
  const attendanceLogs = attendanceData && attendanceData.length > 0 ? attendanceData : MOCK_STUDENT_ATTENDANCE;

  // Compute stats
  const totalPeriods = timetable.reduce((acc, curr) => acc + (curr.periods?.length || 0), 0);
  
  const attendanceRate = React.useMemo(() => {
    if (attendanceLogs.length === 0) return 95;
    const presentCount = attendanceLogs.filter(l => l.status === 'Present' || l.status === 'Late').length;
    return parseFloat(((presentCount / attendanceLogs.length) * 100).toFixed(1));
  }, [attendanceLogs]);

  const outstandingFees = localFees.reduce((acc, curr) => {
    if (curr.status !== 'Paid') {
      return acc + (curr.amount - curr.paidAmount);
    }
    return acc;
  }, 0);

  const averageGrade = React.useMemo(() => {
    if (results.length === 0) return 'A';
    const percentSum = results.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const avg = percentSum / results.length;
    if (avg >= 90) return 'A+';
    if (avg >= 80) return 'A';
    if (avg >= 70) return 'B';
    if (avg >= 60) return 'C';
    return 'D';
  }, [results]);

  if (loadingProfile) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Header & Branch / Context */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden border-gray-200/40 dark:border-white/[0.04] bg-gradient-to-r from-primary/10 via-indigo-500/5 to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary">Student Workspace</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2 mt-2">
            Welcome back, {profileData?.firstName || user?.name || user?.email.split('@')[0]} <Sparkles className="h-5 w-5 text-amber-500" />
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Logged in at {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Profile summary header */}
        <div className="flex items-center gap-3 bg-white/40 dark:bg-white/[0.02] border border-gray-300/40 dark:border-white/[0.08] px-4 py-2.5 rounded-2xl">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white font-extrabold text-lg">
            {(profileData?.firstName?.[0] || user?.email[0]).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-black text-gray-900 dark:text-white">{profileData?.firstName} {profileData?.lastName}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase">{profileData?.class} • {profileData?.section}</p>
          </div>
        </div>
      </div>

      {/* Main Tab bar */}
      <div className="flex bg-white/40 dark:bg-white/[0.02] border border-gray-200/40 dark:border-white/[0.06] rounded-xl p-1 self-start w-fit">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${activeTab === 'overview' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-200'}`}
        >
          <Info className="h-3.5 w-3.5" />
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('academics')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${activeTab === 'academics' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-200'}`}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          Academics
        </button>
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${activeTab === 'attendance' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-200'}`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Attendance
        </button>
        <button 
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${activeTab === 'fees' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-200'}`}
        >
          <Wallet className="h-3.5 w-3.5" />
          Fees & Billing
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border-gray-200/40 dark:border-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">Attendance</span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><UserCheck className="h-5 w-5" /></div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold">{attendanceRate}%</h3>
                <p className="text-[10px] text-emerald-500 mt-1 font-semibold">Good Standing</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border-gray-200/40 dark:border-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">Average Grade</span>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500"><Award className="h-5 w-5" /></div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold">{averageGrade}</h3>
                <p className="text-[10px] text-gray-400 mt-1 font-semibold">Term Cumulative</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border-gray-200/40 dark:border-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">Fees Due</span>
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500"><Wallet className="h-5 w-5" /></div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold">₹{outstandingFees}</h3>
                <p className="text-[10px] text-rose-400 mt-1 font-semibold">{outstandingFees > 0 ? 'Payment Required' : 'All Settled ✓'}</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border-gray-200/40 dark:border-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">Class periods</span>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500"><BookOpen className="h-5 w-5" /></div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold">{totalPeriods} / week</h3>
                <p className="text-[10px] text-gray-400 mt-1 font-semibold">{studentClass} timetable</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4">
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider text-primary flex items-center gap-1.5">
                <UserIcon className="h-4 w-4" /> Personal Information
              </h4>
              
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between border-b border-gray-200/40 dark:border-white/[0.02] pb-2">
                  <span className="text-gray-400 font-semibold">Admission Number</span>
                  <span className="font-bold">{profileData?.admissionNo}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/40 dark:border-white/[0.02] pb-2">
                  <span className="text-gray-400 font-semibold">Roll Number</span>
                  <span className="font-bold">{profileData?.rollNo}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/40 dark:border-white/[0.02] pb-2">
                  <span className="text-gray-400 font-semibold">Class Group</span>
                  <span className="font-bold">{profileData?.class}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/40 dark:border-white/[0.02] pb-2">
                  <span className="text-gray-400 font-semibold">Section Name</span>
                  <span className="font-bold">{profileData?.section}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/40 dark:border-white/[0.02] pb-2">
                  <span className="text-gray-400 font-semibold">Date of Birth</span>
                  <span className="font-bold">{new Date(profileData?.dateOfBirth).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/40 dark:border-white/[0.02] pb-2">
                  <span className="text-gray-400 font-semibold">Gender</span>
                  <span className="font-bold">{profileData?.gender}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/40 dark:border-white/[0.02] pb-2">
                  <span className="text-gray-400 font-semibold">Contact Email</span>
                  <span className="font-bold truncate max-w-[150px]">{profileData?.user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold">Status</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold uppercase tracking-wider text-[10px]">
                    {profileData?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4">
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Bell className="h-4 w-4" /> Campus Noticeboard
              </h4>

              <div className="space-y-3 pt-2">
                {MOCK_ANNOUNCEMENTS.map((ann, idx) => (
                  <div key={idx} className="bg-white/40 dark:bg-white/[0.01] border border-gray-300/20 dark:border-white/[0.04] p-4 rounded-2xl flex flex-col gap-1.5 transition-colors duration-150 hover:bg-white/50 dark:hover:bg-white/[0.02]">
                    <div className="flex justify-between items-center gap-4">
                      <span className="font-extrabold text-sm text-gray-900 dark:text-white">{ann.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${ann.tag === 'Important' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>{ann.tag}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{ann.content}</p>
                    <span className="text-[10px] text-gray-400 font-medium self-end mt-1">{ann.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'academics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-extrabold text-sm uppercase text-primary tracking-widest px-1">Daily Timetable Grid</h4>
            
            <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                const daySchedule = timetable.find(t => t.dayOfWeek.toLowerCase() === day.toLowerCase());
                return (
                  <div key={day} className="glass-card rounded-2xl p-4 border-gray-200/40 dark:border-white/[0.04] flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-24 flex-shrink-0">
                      <span className="font-black text-xs text-primary uppercase tracking-widest">{day}</span>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2.5">
                      {!daySchedule || daySchedule.periods.length === 0 ? (
                        <span className="text-xs text-gray-400 font-semibold italic py-1">No classes scheduled.</span>
                      ) : (
                        daySchedule.periods.map((p, idx) => (
                          <div key={idx} className="bg-white/50 dark:bg-white/[0.02] border border-gray-200/40 dark:border-white/[0.05] rounded-xl p-3 text-xs w-44 space-y-1.5">
                            <p className="font-black text-gray-900 dark:text-white truncate">{p.subject}</p>
                            <p className="font-semibold text-gray-400">{p.startTime} - {p.endTime}</p>
                            <div className="flex justify-between items-center text-[10px] font-black text-primary/80 border-t border-white/[0.02] pt-1">
                              <span>{p.roomNo || 'N/A'}</span>
                              <span className="truncate max-w-[90px]">{p.teacher?.firstName} {p.teacher?.lastName}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4">
              <h4 className="font-extrabold text-sm uppercase text-primary tracking-widest flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> Exam Schedules
              </h4>

              <div className="space-y-3 pt-2">
                {MOCK_STUDENT_EXAMS.map((ex, idx) => (
                  <div key={idx} className="bg-white/40 dark:bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl space-y-3">
                    <div>
                      <p className="font-black text-xs text-gray-900 dark:text-white">{ex.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{ex.term} • {studentClass}</p>
                    </div>

                    <div className="space-y-2.5 border-t border-white/[0.03] pt-2">
                      {ex.schedules.map((sch, schIdx) => (
                        <div key={schIdx} className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold block">{sch.subject}</span>
                            <span className="text-[10px] text-gray-400">{new Date(sch.date).toLocaleDateString()}</span>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-400">Max: {sch.maxMarks}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4">
              <h4 className="font-extrabold text-sm uppercase text-primary tracking-widest flex items-center gap-1.5">
                <BookOpenCheck className="h-4 w-4" /> Performance Reports
              </h4>

              <div className="space-y-4 pt-2">
                {results.map((res, idx) => (
                  <div key={idx} className="space-y-3 bg-white/40 dark:bg-white/[0.01] p-4 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-extrabold text-xs">{res.exam?.name}</p>
                        <p className="text-[9px] text-gray-400 font-semibold">{res.percentage}% • Grade {res.grade}</p>
                      </div>
                      <span className="text-sm font-black text-primary">{res.grade}</span>
                    </div>

                    <div className="space-y-2 border-t border-white/[0.03] pt-2">
                      {res.marksObtained.map((m, mIdx) => (
                        <div key={mIdx} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-gray-400">
                            <span>{m.subject}</span>
                            <span>{m.marks}/100</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-white/[0.03] h-1 rounded-full overflow-hidden">
                            <div className="bg-primary h-full" style={{ width: `${m.marks}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-6 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-sm uppercase text-primary tracking-widest">Attendance Status</h4>
              <p className="text-xs text-gray-400 mt-1">Summary of class presence during the semester</p>
            </div>

            <div className="h-56 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Present', value: attendanceLogs.filter(l => l.status === 'Present' || l.status === 'Late').length },
                      { name: 'Absent', value: attendanceLogs.filter(l => l.status === 'Absent').length }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-gray-900 dark:text-white">{attendanceRate}%</span>
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">Average</span>
              </div>
            </div>

            <div className="flex justify-around items-center pt-4 border-t border-white/[0.03] text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Present/Late: {attendanceLogs.filter(l => l.status === 'Present' || l.status === 'Late').length} days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span>Absent: {attendanceLogs.filter(l => l.status === 'Absent').length} days</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4">
            <h4 className="font-extrabold text-sm uppercase text-primary tracking-widest">Attendance Logs</h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                    <th className="p-3 font-extrabold text-gray-400 uppercase">Date</th>
                    <th className="p-3 font-extrabold text-gray-400 uppercase">Status</th>
                    <th className="p-3 font-extrabold text-gray-400 uppercase">Remarks/Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {attendanceLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01]">
                      <td className="p-3 font-bold text-gray-900 dark:text-white">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          log.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' :
                          log.status === 'Late' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400 font-semibold italic">{log.remarks || 'No remarks logged.'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-gray-200/40 dark:border-white/[0.04]">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Outstanding Balance</p>
                <h4 className="text-xl font-black mt-1 text-rose-500">₹{outstandingFees}</h4>
              </div>
              <Wallet className="h-8 w-8 text-rose-500 bg-rose-500/10 p-1.5 rounded-xl" />
            </div>

            <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-gray-200/40 dark:border-white/[0.04]">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total Settled</p>
                <h4 className="text-xl font-black text-emerald-500 mt-1">₹{localFees.filter(f => f.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0)}</h4>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500 bg-emerald-500/10 p-1.5 rounded-xl" />
            </div>

            <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-gray-200/40 dark:border-white/[0.04]">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Academic Year Period</p>
                <h4 className="text-sm font-extrabold mt-1">June 2026 - May 2027</h4>
              </div>
              <Calendar className="h-8 w-8 text-primary bg-primary/10 p-1.5 rounded-xl" />
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden border-gray-200/40 dark:border-white/[0.04] p-6 space-y-4">
            <h4 className="font-extrabold text-sm uppercase text-primary tracking-widest px-1">Billed Invoices</h4>
            
            {feesLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : localFees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <CheckCircle className="h-10 w-10 text-emerald-500/40" />
                <p className="text-sm font-bold text-gray-500">No fee invoices assigned yet.</p>
                <p className="text-xs text-gray-400">Your institution will post invoices here when fees are due.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                      <th className="p-4 font-black text-gray-400 uppercase">Fee Description</th>
                      <th className="p-4 font-black text-gray-400 uppercase">Due Date</th>
                      <th className="p-4 font-black text-gray-400 uppercase">Amount</th>
                      <th className="p-4 font-black text-gray-400 uppercase">Paid</th>
                      <th className="p-4 font-black text-gray-400 uppercase">Status</th>
                      <th className="p-4 font-black text-gray-400 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {localFees.map((fee) => (
                      <tr key={fee._id} className="hover:bg-white/[0.01]">
                        <td className="p-4 font-black text-gray-900 dark:text-white">
                          {fee.feeCategory?.name}
                        </td>
                        <td className="p-4 font-bold text-gray-400">{new Date(fee.dueDate).toLocaleDateString()}</td>
                        <td className="p-4 font-black text-primary">₹{fee.amount}</td>
                        <td className="p-4 font-semibold text-emerald-500">₹{fee.paidAmount || 0}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            fee.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' :
                            fee.status === 'PartiallyPaid' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-rose-500/10 text-rose-400'
                          }`}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {fee.status !== 'Paid' ? (
                            <button
                              onClick={() => handlePayNow(fee._id)}
                              disabled={triggerCheckoutMutation.isPending}
                              className="ml-auto px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg transition-transform hover:scale-[1.01] flex items-center gap-1.5"
                            >
                              <CreditCard className="h-3.5 w-3.5" /> Pay Now
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-bold flex items-center gap-1 justify-end">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Paid and Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {paymentModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl shadow-2xl relative bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-white/[0.08]">
            <div className="text-center mb-6">
              <Wallet className="h-12 w-12 text-primary mx-auto mb-3 animate-pulse" />
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Secure Fee Checkout</h3>
              <p className="text-xs text-gray-400 mt-1">
                {paymentModalData.keyId === 'rzp_test_mockkeyid123' || paymentModalData.feeRecordId?.startsWith('mock_')
                  ? 'Simulating Online Razorpay Gateway'
                  : 'Online Razorpay Gateway'}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.04] p-4 rounded-xl space-y-2 mb-6 text-xs">
              <div className="flex justify-between text-gray-400 font-bold">
                <span>Order ID:</span>
                <span className="text-gray-900 dark:text-white font-mono">{paymentModalData.order.id}</span>
              </div>
              <div className="flex justify-between text-gray-400 font-bold">
                <span>Amount to Pay:</span>
                <span className="text-primary font-black text-sm">₹{paymentModalData.order.amount / 100}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePayment}
                disabled={isProcessingPayment}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
              >
                {isProcessingPayment 
                  ? 'Processing gateway...' 
                  : paymentModalData.keyId === 'rzp_test_mockkeyid123' || paymentModalData.feeRecordId?.startsWith('mock_')
                    ? 'Authorize Transaction (Simulated)'
                    : 'Pay Now with Razorpay'}
              </button>
              
              <button
                onClick={() => setPaymentModalData(null)}
                disabled={isProcessingPayment}
                className="w-full py-2.5 border border-gray-200 dark:border-white/[0.06] hover:bg-gray-100 dark:hover:bg-white/[0.02] text-gray-500 dark:text-gray-400 text-xs font-bold rounded-xl"
              >
                Cancel Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, activeBranchId } = useAuthStore();
  const toast = useToast();

  // Student Dashboard View
  if (user?.role === 'Student') {
    return <StudentDashboard user={user} />;
  }

  // Fetch branches (checking if any branch is created)
  const { data: branchesData, refetch: refetchBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data.data.branches;
    },
    enabled: user?.role !== 'Student'
  });

  // Fetch leads summary
  const { data: leadsData } = useQuery({
    queryKey: ['leads', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/crm');
      return res.data.data.leads;
    },
    enabled: !!activeBranchId && user?.role !== 'Student'
  });

  // Fetch students summary
  const { data: studentsData } = useQuery({
    queryKey: ['students', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/students');
      return res.data.data.students;
    },
    enabled: !!activeBranchId && user?.role !== 'Student'
  });

  // Handle bootstrap creation of a branch if empty
  const handleCreateDemoBranch = async () => {
    try {
      await api.post('/branches', {
        name: 'Main Campus',
        code: 'MC01',
        contact: {
          email: 'maincampus@erpedu.com',
          phone: '9876543210'
        },
        settings: {
          academicYearStart: new Date('2026-06-01'),
          academicYearEnd: new Date('2027-05-31')
        }
      });
      toast.success('Branch created successfully! Refreshing account...');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating demo branch');
    }
  };

  const hasBranches = branchesData && branchesData.length > 0;

  if (user?.role === 'SuperAdmin' && !hasBranches) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-white/50 dark:bg-white/[0.01] rounded-3xl border border-gray-200/50 dark:border-white/[0.04] backdrop-blur-md">
        <Sparkles className="h-16 w-16 text-primary mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">Welcome, SuperAdmin!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
          To get started with the Education ERP Platform, you need to create your first school branch or campus.
        </p>
        <button
          onClick={handleCreateDemoBranch}
          className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] flex items-center gap-2"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          Onboard First Demo Branch
        </button>
      </div>
    );
  }

  // Mock analytical data for charts
  const feeStats = [
    { name: 'Jan', collected: 4000, projected: 2400 },
    { name: 'Feb', collected: 3000, projected: 1398 },
    { name: 'Mar', collected: 9800, projected: 2000 },
    { name: 'Apr', collected: 2780, projected: 3908 },
    { name: 'May', collected: 1890, projected: 4800 },
    { name: 'Jun', collected: 2390, projected: 3800 }
  ];

  const attendanceStats = [
    { name: 'Mon', attendance: 95 },
    { name: 'Tue', attendance: 92 },
    { name: 'Wed', attendance: 88 },
    { name: 'Thu', attendance: 94 },
    { name: 'Fri', attendance: 96 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome Message Card */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden border-gray-200/40 dark:border-white/[0.04] bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          Hello, {user?.email.split('@')[0]} <Sparkles className="h-5 w-5 text-amber-500" />
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here is your educational portal summary. Switch branches from the sidebar to load context.
        </p>
      </div>

      {/* Numerical Quick Stats Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card rounded-2xl p-5 border-gray-200/40 dark:border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Students Onboarded</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500"><Users className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold">{studentsData?.length || 0}</h3>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Active in selected branch</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-gray-200/40 dark:border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Admission Leads</span>
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500"><ShieldAlert className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold">{leadsData?.length || 0}</h3>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">New inquiries received</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-gray-200/40 dark:border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Average Attendance</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><UserCheck className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold">94.5%</h3>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Daily student attendance average</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-gray-200/40 dark:border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Collection Rate</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500"><CreditCard className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold">87.2%</h3>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Term fee billing collection</p>
          </div>
        </div>

      </div>

      {/* Interactive Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Fee Collections (AreaChart) */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">Fee Collections Overview</h4>
              <p className="text-xs text-gray-400 font-medium">Financial collection vs projections monthly</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <TrendingUp className="h-3 w-3" /> +14.2%
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feeStats}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="collected" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Weekly Attendance (BarChart) */}
        <div className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04]">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Weekly Class Attendance</h4>
            <p className="text-xs text-gray-400 font-medium">Average attendance rate percentage</p>
          </div>

          <div className="h-72 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceStats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} domain={[50, 100]} />
                <Tooltip contentStyle={{ background: '#111827', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="attendance" fill="#10b981" radius={[8, 8, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
