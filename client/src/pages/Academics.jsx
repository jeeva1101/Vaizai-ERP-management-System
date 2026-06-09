import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  BookOpen, Calendar, Award, PlusCircle, Trash2, 
  ChevronRight, Save, Printer, ArrowRight 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '../lib/toast';

// High-fidelity Mock data for fallbacks
const MOCK_TEACHERS = [
  { _id: 'mock_t1', firstName: 'Sarah', lastName: 'Connor', designation: 'Senior Science Teacher' },
  { _id: 'mock_t2', firstName: 'David', lastName: 'Miller', designation: 'Maths Teacher' },
  { _id: 'mock_t3', firstName: 'Emily', lastName: 'Watson', designation: 'English Teacher' }
];

const MOCK_TIMETABLES = [
  {
    dayOfWeek: 'Monday',
    periods: [
      { subject: 'Mathematics', startTime: '09:00', endTime: '09:45', roomNo: 'Room 201', teacher: { firstName: 'David', lastName: 'Miller' } },
      { subject: 'Science', startTime: '10:00', endTime: '10:45', roomNo: 'Lab A', teacher: { firstName: 'Sarah', lastName: 'Connor' } },
      { subject: 'English Literature', startTime: '11:00', endTime: '11:45', roomNo: 'Room 304', teacher: { firstName: 'Emily', lastName: 'Watson' } }
    ]
  },
  {
    dayOfWeek: 'Wednesday',
    periods: [
      { subject: 'History', startTime: '09:00', endTime: '09:45', roomNo: 'Room 102', teacher: { firstName: 'Jane', lastName: 'Doe' } },
      { subject: 'Mathematics', startTime: '10:00', endTime: '10:45', roomNo: 'Room 201', teacher: { firstName: 'David', lastName: 'Miller' } }
    ]
  }
];

const MOCK_EXAMS = [
  {
    _id: 'mock_e1',
    name: 'Mid-Term Examination 2026',
    term: 'First Term',
    class: 'Grade 10',
    startDate: '2026-09-15',
    endDate: '2026-09-22',
    schedules: [
      { subject: 'Mathematics', date: '2026-09-15', maxMarks: 100, passingMarks: 35 },
      { subject: 'Science', date: '2026-09-17', maxMarks: 100, passingMarks: 35 },
      { subject: 'English', date: '2026-09-20', maxMarks: 100, passingMarks: 35 }
    ]
  }
];

const MOCK_RESULTS = [
  {
    _id: 'mock_r1',
    student: { firstName: 'Aarav', lastName: 'Sharma', rollNo: '1' },
    exam: { name: 'Mid-Term Examination 2026' },
    percentage: 88.33,
    grade: 'A',
    marksObtained: [
      { subject: 'Mathematics', marks: 92 },
      { subject: 'Science', marks: 85 },
      { subject: 'English', marks: 88 }
    ]
  }
];

export default function Academics() {
  const { activeBranchId, user } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState('timetable'); // 'timetable', 'exams', 'results'
  
  // Selection filters
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [selectedExamId, setSelectedExamId] = useState('');

  // Forms
  const periodForm = useForm();
  const examForm = useForm();
  const resultsForm = useForm();

  // Dynamic schedules array inside exam form
  const [examSchedules, setExamSchedules] = useState([]);
  const [tempSchedule, setTempSchedule] = useState({ subject: '', date: '', maxMarks: 100, passingMarks: 35 });

  // 1. Fetch Teachers for scheduling dropdowns
  const { data: teachers } = useQuery({
    queryKey: ['teachers', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/employees', { params: { department: 'Academics' } });
      return res.data.data.employees || [];
    },
    enabled: !!activeBranchId
  });

  const availableTeachers = teachers && teachers.length > 0 ? teachers.map(e => ({
    _id: e._id,
    name: `${e.firstName} ${e.lastName}`,
    designation: e.designation
  })) : MOCK_TEACHERS.map(e => ({
    _id: e._id,
    name: `${e.firstName} ${e.lastName}`,
    designation: e.designation
  }));

  // 2. Fetch timetables
  const { data: timetables, isLoading: loadingTimetables } = useQuery({
    queryKey: ['timetable', activeBranchId, selectedClass, selectedSection],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/academics/timetable', {
        params: { class: selectedClass, section: selectedSection }
      });
      return res.data.data.timetables || [];
    },
    enabled: !!activeBranchId
  });

  // 3. Fetch exams
  const { data: exams, isLoading: loadingExams } = useQuery({
    queryKey: ['exams', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/academics/exams');
      return res.data.data.exams || [];
    },
    enabled: !!activeBranchId
  });

  // 4. Fetch results
  const { data: results, isLoading: loadingResults } = useQuery({
    queryKey: ['results', activeBranchId, selectedExamId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const params = {};
      if (selectedExamId) params.examId = selectedExamId;
      const res = await api.get('/academics/results', { params });
      return res.data.data.results || [];
    },
    enabled: !!activeBranchId
  });

  // Timetable Create/Update Period Mutation
  const saveTimetableMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/academics/timetable', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['timetable']);
      periodForm.reset();
      toast.success('Timetable period successfully registered!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error updating timetable.');
    }
  });

  // Create Exam Mutation
  const createExamMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/academics/exams', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['exams']);
      examForm.reset();
      setExamSchedules([]);
      toast.success('Exam schedule created successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error creating exam.');
    }
  });

  // Publish Results Mutation
  const publishResultsMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/academics/results', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['results']);
      resultsForm.reset();
      toast.success('Student exam results published successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error publishing results.');
    }
  });

  const handleAddPeriod = (data) => {
    // We look up existing days timetable
    const existingDay = (timetables || []).find(t => t.dayOfWeek === data.dayOfWeek);
    const periods = existingDay ? [...existingDay.periods] : [];
    
    periods.push({
      subject: data.subject,
      teacher: data.teacherId,
      startTime: data.startTime,
      endTime: data.endTime,
      roomNo: data.roomNo
    });

    saveTimetableMutation.mutate({
      class: selectedClass,
      section: selectedSection,
      dayOfWeek: data.dayOfWeek,
      periods
    });
  };

  const handleAddTempSchedule = () => {
    if (!tempSchedule.subject || !tempSchedule.date) return;
    setExamSchedules([...examSchedules, tempSchedule]);
    setTempSchedule({ subject: '', date: '', maxMarks: 100, passingMarks: 35 });
  };

  const handleCreateExam = (data) => {
    if (examSchedules.length === 0) {
      toast.warning('Please add at least one subject to the exam schedule.');
      return;
    }
    createExamMutation.mutate({
      ...data,
      schedules: examSchedules
    });
  };

  const handlePublishResults = (data) => {
    // Format marks array from standard fields
    const subjects = ['Mathematics', 'Science', 'English'];
    const marksObtained = subjects.map(sub => ({
      subject: sub,
      marks: parseFloat(data[sub]) || 0
    }));

    publishResultsMutation.mutate({
      studentId: data.studentId,
      examId: data.examId,
      marksObtained
    });
  };

  if (!activeBranchId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Please select a branch to view academic settings.
      </div>
    );
  }

  const activeTimetables = timetables && timetables.length > 0 ? timetables : MOCK_TIMETABLES;
  const activeExams = exams && exams.length > 0 ? exams : MOCK_EXAMS;
  const activeResults = results && results.length > 0 ? results : MOCK_RESULTS;

  return (
    <div className="space-y-6">
      
      {/* Upper Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Academic Panel</h2>
          <p className="text-xs text-gray-400 font-medium">Coordinate school curriculum timetables, exam structures, and student report card records</p>
        </div>

        {/* Tab selection */}
        <div className="flex bg-white/40 dark:bg-white/[0.02] border border-gray-200/40 dark:border-white/[0.06] rounded-xl p-1 self-start">
          <button 
            onClick={() => setActiveSubTab('timetable')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${activeSubTab === 'timetable' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-200'}`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Timetable Grid
          </button>
          <button 
            onClick={() => setActiveSubTab('exams')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${activeSubTab === 'exams' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-200'}`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Exam Planner
          </button>
          <button 
            onClick={() => setActiveSubTab('results')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${activeSubTab === 'results' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-200'}`}
          >
            <Award className="h-3.5 w-3.5" />
            Marks & Grading
          </button>
        </div>
      </div>

      {/* TIMETABLE VIEW */}
      {activeSubTab === 'timetable' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creator/Form Panel */}
          {user?.role !== 'Student' && user?.role !== 'Parent' && (
            <div className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4 h-fit">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Add Timetable Slot</h3>
              
              <form onSubmit={periodForm.handleSubmit(handleAddPeriod)} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Day</label>
                  <select {...periodForm.register('dayOfWeek', { required: true })} className="w-full bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl px-4 py-2 text-xs">
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Subject Name</label>
                  <input {...periodForm.register('subject', { required: true })} placeholder="Physics Q1" className="w-full glass-input" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Assign Instructor</label>
                  <select {...periodForm.register('teacherId', { required: true })} className="w-full bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl px-4 py-2 text-xs">
                    <option value="">-- Choose Instructor --</option>
                    {availableTeachers.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.designation})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Start Time</label>
                    <input {...periodForm.register('startTime', { required: true })} type="time" className="w-full glass-input" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">End Time</label>
                    <input {...periodForm.register('endTime', { required: true })} type="time" className="w-full glass-input" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Room/Location</label>
                  <input {...periodForm.register('roomNo')} placeholder="Lab C" className="w-full glass-input" />
                </div>

                <button
                  type="submit"
                  disabled={saveTimetableMutation.isPending}
                  className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
                >
                  {saveTimetableMutation.isPending ? 'Saving Period...' : 'Add Slot to Grid'}
                </button>
              </form>
            </div>
          )}

          {/* Timetable Display Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter toolbar */}
            <div className="glass-card rounded-2xl p-4 border-gray-200/40 dark:border-white/[0.04] flex items-center justify-between">
              <div className="flex gap-3">
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)} 
                  className="bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300"
                >
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 9">Grade 9</option>
                </select>
                
                <select 
                  value={selectedSection} 
                  onChange={(e) => setSelectedSection(e.target.value)} 
                  className="bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300"
                >
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                </select>
              </div>

              <div className="text-[10px] font-bold text-gray-400 uppercase">Timetable Registry</div>
            </div>

            {/* Grid Schedule */}
            <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                const daySchedule = activeTimetables.find(t => t.dayOfWeek.toLowerCase() === day.toLowerCase());
                return (
                  <div key={day} className="glass-card rounded-2xl p-4 border-gray-200/40 dark:border-white/[0.04] flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-24 flex-shrink-0">
                      <span className="font-extrabold text-sm text-primary uppercase">{day}</span>
                    </div>
                    
                    <div className="flex-1 flex flex-wrap gap-2.5">
                      {!daySchedule || daySchedule.periods.length === 0 ? (
                        <span className="text-xs text-gray-400 font-medium italic">No periods scheduled for {day}.</span>
                      ) : (
                        daySchedule.periods.map((period, idx) => (
                          <div key={idx} className="bg-white/50 dark:bg-white/[0.02] border border-gray-200/40 dark:border-white/[0.05] rounded-xl p-3 text-xs w-44 space-y-1 relative">
                            <p className="font-black text-gray-900 dark:text-white truncate">{period.subject}</p>
                            <p className="font-semibold text-gray-500">{period.startTime} - {period.endTime}</p>
                            <div className="flex justify-between items-center text-[10px] font-bold text-primary/80 pt-1">
                              <span>{period.roomNo || 'N/A'}</span>
                              <span className="truncate max-w-[90px]">{period.teacher?.firstName} {period.teacher?.lastName}</span>
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
        </div>
      )}

      {/* EXAMS TAB */}
      {activeSubTab === 'exams' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Exam Panel */}
          {user?.role !== 'Student' && user?.role !== 'Parent' && (
            <div className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4 h-fit">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Schedule Examination</h3>
              
              <form onSubmit={examForm.handleSubmit(handleCreateExam)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Exam Name</label>
                  <input {...examForm.register('name', { required: true })} placeholder="Final Term 2026" className="w-full glass-input" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Term</label>
                    <input {...examForm.register('term', { required: true })} placeholder="First Term" className="w-full glass-input" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Target Class</label>
                    <input {...examForm.register('class', { required: true })} placeholder="Grade 10" className="w-full glass-input" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Start Date</label>
                    <input {...examForm.register('startDate', { required: true })} type="date" className="w-full glass-input" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">End Date</label>
                    <input {...examForm.register('endDate', { required: true })} type="date" className="w-full glass-input" />
                  </div>
                </div>

                {/* Sub-schedules entry */}
                <div className="border-t border-gray-200/50 dark:border-white/[0.03] pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-primary">1. Subjects Schedule</h4>
                  
                  {examSchedules.map((s, idx) => (
                    <div key={idx} className="bg-white/40 dark:bg-white/[0.02] p-2.5 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold">{s.subject}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">{s.date} (₹{s.maxMarks} max)</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setExamSchedules(examSchedules.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:bg-red-500/10 p-1 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <div className="bg-white/40 dark:bg-white/[0.01] p-3 rounded-2xl border border-white/[0.04] space-y-2.5">
                    <input 
                      type="text" 
                      placeholder="Subject, e.g. Mathematics" 
                      value={tempSchedule.subject} 
                      onChange={(e) => setTempSchedule({...tempSchedule, subject: e.target.value})}
                      className="w-full glass-input py-1.5"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="date" 
                        value={tempSchedule.date} 
                        onChange={(e) => setTempSchedule({...tempSchedule, date: e.target.value})}
                        className="w-full glass-input py-1.5"
                      />
                      <button 
                        type="button" 
                        onClick={handleAddTempSchedule}
                        className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold text-xs rounded-xl"
                      >
                        + Add Subject
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createExamMutation.isPending}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  {createExamMutation.isPending ? 'Publishing Plan...' : 'Publish Exam Schedule'}
                </button>
              </form>
            </div>
          )}

          {/* Exam Schedules List */}
          <div className="lg:col-span-2 space-y-4">
            {activeExams.map((exam) => (
              <div key={exam._id} className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-white/[0.03] pb-3">
                  <div>
                    <h4 className="font-extrabold text-base text-gray-900 dark:text-white">{exam.name}</h4>
                    <p className="text-xs text-gray-400 font-semibold">{exam.term} • {exam.class}</p>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-extrabold rounded-lg">
                    {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Exam Papers Schedule</h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {exam.schedules.map((schedule, idx) => (
                      <div key={idx} className="bg-white/50 dark:bg-white/[0.02] border border-gray-200/40 dark:border-white/[0.05] rounded-2xl p-4 space-y-2.5">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <p className="font-black text-sm text-gray-900 dark:text-white">{schedule.subject}</p>
                          <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{new Date(schedule.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-primary/80 pt-1.5 border-t border-white/[0.03]">
                          <span>Max Marks: {schedule.maxMarks}</span>
                          <span>Pass: {schedule.passingMarks}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESULTS / GRADING TAB */}
      {activeSubTab === 'results' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Marks Input Panel (Teachers) */}
          {user?.role !== 'Student' && user?.role !== 'Parent' && (
            <div className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4 h-fit">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Enter Student Marks</h3>
              
              <form onSubmit={resultsForm.handleSubmit(handlePublishResults)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Exam Target</label>
                  <select {...resultsForm.register('examId', { required: true })} className="w-full bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl px-4 py-2 text-xs">
                    <option value="">-- Choose Exam --</option>
                    {activeExams.map(ex => (
                      <option key={ex._id} value={ex._id}>{ex.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Student Registration ID</label>
                  <input {...resultsForm.register('studentId', { required: true })} placeholder="MongoDB Student ObjectID" className="w-full glass-input" />
                </div>

                <div className="border-t border-gray-200/50 dark:border-white/[0.03] pt-4 space-y-3.5">
                  <h4 className="text-xs font-bold text-primary">Subject Marks (out of 100)</h4>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center gap-4 text-xs font-bold">
                      <label className="text-gray-500">Mathematics</label>
                      <input {...resultsForm.register('Mathematics', { required: true })} type="number" placeholder="85" className="w-20 glass-input py-1 text-center" />
                    </div>
                    <div className="flex justify-between items-center gap-4 text-xs font-bold">
                      <label className="text-gray-500">Science</label>
                      <input {...resultsForm.register('Science', { required: true })} type="number" placeholder="82" className="w-20 glass-input py-1 text-center" />
                    </div>
                    <div className="flex justify-between items-center gap-4 text-xs font-bold">
                      <label className="text-gray-500">English</label>
                      <input {...resultsForm.register('English', { required: true })} type="number" placeholder="90" className="w-20 glass-input py-1 text-center" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={publishResultsMutation.isPending}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  {publishResultsMutation.isPending ? 'Publishing Report...' : 'Publish Report Card'}
                </button>
              </form>
            </div>
          )}

          {/* Results Board Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-2xl p-4 border-gray-200/40 dark:border-white/[0.04] flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-gray-400">Published Marksheets</h4>
              
              <select 
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="bg-white/40 dark:bg-white/[0.01] border border-gray-300/40 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300"
              >
                <option value="">All Exams</option>
                {activeExams.map(ex => (
                  <option key={ex._id} value={ex._id}>{ex.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeResults.map((res, idx) => (
                <div key={idx} className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-white/[0.03] pb-3">
                    <div>
                      <p className="font-extrabold text-sm text-gray-900 dark:text-white">{res.student?.firstName} {res.student?.lastName}</p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{res.exam?.name}</p>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-lg font-black text-primary block">{res.grade}</span>
                      <span className="text-[10px] text-gray-400 font-bold block">{res.percentage}%</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {res.marksObtained.map((mark, subIdx) => (
                      <div key={subIdx} className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-gray-300">
                        <span>{mark.subject}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-white/[0.02] rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${mark.marks}%` }} />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white w-6 text-right">{mark.marks}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.03]">
                    <button 
                      onClick={() => toast.info('Print report card is available in the production build.')}
                      className="p-1.5 rounded-lg hover:bg-white/[0.04] text-gray-400 hover:text-white"
                      title="Print Report Card"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
