import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { PlusCircle, CreditCard, CheckCircle, Clock, Award, Wallet, Users, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
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

export default function FeeCollection() {
  const { activeBranchId, user } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAssigningFee, setIsAssigningFee]     = useState(false);
  const [assignMode, setAssignMode]             = useState('class'); // 'class' | 'student'

  // Payment modal
  const [paymentModal, setPaymentModal]           = useState(null); // { order, feeRecordId }
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const categoryForm = useForm({ defaultValues: { frequency: 'OneTime' } });
  const assignForm   = useForm();

  /* ── Queries ──────────────────────────────────────────── */
  const { data: categories = [] } = useQuery({
    queryKey: ['feeCategories', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/finance/categories');
      return res.data.data.categories;
    },
    enabled: !!activeBranchId
  });

  const { data: students = [] } = useQuery({
    queryKey: ['allStudents', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/students');
      return res.data.data.students;
    },
    enabled: !!activeBranchId && assignMode === 'student'
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['feeRecords', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return [];
      const res = await api.get('/finance/records');
      return res.data.data.records;
    },
    enabled: !!activeBranchId
  });

  /* ── Mutations ────────────────────────────────────────── */
  const createCategoryMutation = useMutation({
    mutationFn: (data) => api.post('/finance/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['feeCategories', activeBranchId]);
      setIsAddingCategory(false);
      categoryForm.reset({ frequency: 'OneTime' });
      toast.success('Fee category created successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create category.')
  });

  const assignFeeMutation = useMutation({
    mutationFn: (data) => api.post('/finance/assign', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['feeRecords', activeBranchId]);
      setIsAssigningFee(false);
      assignForm.reset();
      const count = res.data.results || 1;
      toast.success(`Fee invoiced to ${count} student(s) successfully!`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to assign fee.')
  });

  const checkoutMutation = useMutation({
    mutationFn: async (feeRecordId) => {
      const res = await api.post('/finance/checkout', { feeRecordId });
      return { ...res.data.data, feeRecordId };
    },
    onSuccess: (data) => setPaymentModal(data),
    onError: (err) => toast.error(err.response?.data?.message || 'Could not initiate checkout.')
  });

  const verifyMutation = useMutation({
    mutationFn: (payload) => api.post('/finance/verify', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['feeRecords', activeBranchId]);
      setPaymentModal(null);
      toast.success('Payment completed and recorded successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Payment verification failed.')
  });

  /* ── Handlers ─────────────────────────────────────────── */
  const handleCategorySubmit = (data) => createCategoryMutation.mutate(data);

  const handleAssignSubmit = (data) => {
    // Send either studentId or class depending on the mode
    const payload = {
      feeCategoryId: data.feeCategoryId,
      dueDate:       data.dueDate,
      ...(assignMode === 'student' ? { studentId: data.studentId } : { class: data.class })
    };
    assignFeeMutation.mutate(payload);
  };

  const handlePayNow = (recordId) => checkoutMutation.mutate(recordId);

  const handlePayment = async () => {
    if (!paymentModal) return;

    if (paymentModal.keyId === 'rzp_test_mockkeyid123') {
      setIsProcessingPayment(true);
      setTimeout(() => {
        setIsProcessingPayment(false);
        verifyMutation.mutate({
          razorpayOrderId:  paymentModal.order.id,
          razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
          razorpaySignature: 'mock_signature'
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

    const record = records.find(r => r._id === paymentModal.feeRecordId);

    const options = {
      key: paymentModal.keyId,
      amount: paymentModal.order.amount,
      currency: paymentModal.order.currency || 'INR',
      name: 'ERP-EDU',
      description: record ? `Fee Payment - ${record.feeCategory?.name}` : 'Fee Payment',
      order_id: paymentModal.order.id,
      handler: function (response) {
        setIsProcessingPayment(false);
        verifyMutation.mutate({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        });
      },
      prefill: {
        name: record ? `${record.student?.firstName} ${record.student?.lastName}` : '',
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

  /* ── Stats ────────────────────────────────────────────── */
  const stats = React.useMemo(() => {
    if (!records.length) return { billed: 0, paid: 0, balance: 0, rate: 0 };
    const billed  = records.reduce((a, r) => a + (r.amount     || 0), 0);
    const paid    = records.reduce((a, r) => a + (r.paidAmount  || 0), 0);
    return { billed, paid, balance: billed - paid, rate: billed > 0 ? Math.round((paid / billed) * 100) : 0 };
  }, [records]);

  if (!activeBranchId) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium">
        Please select a branch to manage fee collections.
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Fee Collections &amp; Billing</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            Create fee categories → Invoice students → Track &amp; collect payments
          </p>
        </div>

        {user?.role !== 'Student' && user?.role !== 'Parent' && (
          <div className="flex gap-2">
            <button
              onClick={() => { setIsAddingCategory(v => !v); setIsAssigningFee(false); }}
              className="px-4 py-2 border border-white/[0.06] hover:bg-white/[0.04] text-xs font-semibold rounded-xl flex items-center gap-1.5"
            >
              <Tag className="h-3.5 w-3.5" /> Add Category
            </button>
            <button
              onClick={() => { setIsAssigningFee(v => !v); setIsAddingCategory(false); }}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5" /> Invoice Student(s)
            </button>
          </div>
        )}
      </div>

      {/* ── Workflow guide (collapsed when forms open) ───── */}
      {!isAddingCategory && !isAssigningFee && user?.role !== 'Student' && (
        <div className="glass-card rounded-2xl p-4 border-gray-200/40 dark:border-white/[0.04] flex flex-wrap gap-4 text-xs text-gray-400 font-semibold">
          <span className="flex items-center gap-1.5"><span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center font-black text-[10px]">1</span> Create a Fee Category (e.g. "Term 1 Tuition" ₹5000)</span>
          <span className="text-gray-600">→</span>
          <span className="flex items-center gap-1.5"><span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center font-black text-[10px]">2</span> Invoice Students by class or individually</span>
          <span className="text-gray-600">→</span>
          <span className="flex items-center gap-1.5"><span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center font-black text-[10px]">3</span> Student pays via their dashboard — status updates here instantly</span>
        </div>
      )}

      {/* ── Stats Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced',    value: `₹${stats.billed}`,    icon: Wallet,      color: 'indigo' },
          { label: 'Total Collected',   value: `₹${stats.paid}`,      icon: CheckCircle, color: 'emerald' },
          { label: 'Outstanding',       value: `₹${stats.balance}`,   icon: Clock,       color: 'rose' },
          { label: 'Collection Rate',   value: `${stats.rate}%`,      icon: Award,       color: 'violet' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex items-center justify-between border-gray-200/40 dark:border-white/[0.04]">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
              <h4 className={`text-lg font-black mt-1 text-${color}-500`}>{value}</h4>
            </div>
            <Icon className={`h-8 w-8 text-${color}-500 bg-${color}-500/10 p-1.5 rounded-xl`} />
          </div>
        ))}
      </div>

      {/* ── Add Fee Category Form ────────────────────────── */}
      {isAddingCategory && (
        <form
          onSubmit={categoryForm.handleSubmit(handleCategorySubmit)}
          className="glass-card rounded-2xl p-6 border-gray-200/40 dark:border-white/[0.04] grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="md:col-span-4 mb-1">
            <h3 className="font-extrabold text-sm text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Tag className="h-4 w-4" /> New Fee Category
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Define a fee type that can be invoiced to students</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Category Name</label>
            <input
              {...categoryForm.register('name', { required: true })}
              placeholder="e.g. Term 1 Tuition Fee"
              className="w-full glass-input"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Amount (₹)</label>
            <input
              {...categoryForm.register('amount', { required: true, valueAsNumber: true })}
              type="number" min="1" placeholder="5000"
              className="w-full glass-input"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Frequency</label>
            <select {...categoryForm.register('frequency')} className="w-full glass-input">
              <option value="OneTime">One Time</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annual">Annual</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={createCategoryMutation.isPending}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
            >
              {createCategoryMutation.isPending ? 'Saving…' : 'Save Category'}
            </button>
            <button type="button" onClick={() => setIsAddingCategory(false)} className="px-3 py-2.5 text-xs text-gray-400 hover:text-white border border-white/[0.06] rounded-xl">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Invoice Students Form ────────────────────────── */}
      {isAssigningFee && (
        <form
          onSubmit={assignForm.handleSubmit(handleAssignSubmit)}
          className="glass-card rounded-2xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-primary uppercase tracking-widest flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Issue Invoice(s)
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Assign a fee to a class or an individual student</p>
            </div>
            {/* Toggle between class/individual */}
            <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setAssignMode('class')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${assignMode === 'class' ? 'bg-primary text-white' : 'text-gray-400'}`}
              >By Class</button>
              <button
                type="button"
                onClick={() => setAssignMode('student')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${assignMode === 'student' ? 'bg-primary text-white' : 'text-gray-400'}`}
              >Individual</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {assignMode === 'class' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Class Name</label>
                <input
                  {...assignForm.register('class', { required: assignMode === 'class' })}
                  placeholder="e.g. Grade 10"
                  className="w-full glass-input"
                />
                <p className="text-[10px] text-gray-500">Must match exactly the class field on student profiles</p>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Select Student</label>
                <select
                  {...assignForm.register('studentId', { required: assignMode === 'student' })}
                  className="w-full glass-input"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.firstName} {s.lastName} ({s.admissionNo}) — {s.class}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Fee Category</label>
              {categories.length === 0 ? (
                <p className="text-xs text-amber-500 font-semibold py-2">No categories yet — create one first ↑</p>
              ) : (
                <select
                  {...assignForm.register('feeCategoryId', { required: true })}
                  className="w-full glass-input"
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name} — ₹{c.amount}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Due Date</label>
              <input
                {...assignForm.register('dueDate', { required: true })}
                type="date"
                className="w-full glass-input"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={assignFeeMutation.isPending || categories.length === 0}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20"
              >
                {assignFeeMutation.isPending ? 'Issuing…' : 'Issue Invoice(s)'}
              </button>
              <button type="button" onClick={() => setIsAssigningFee(false)} className="px-3 py-2.5 text-xs text-gray-400 hover:text-white border border-white/[0.06] rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Fee Records Table ────────────────────────────── */}
      {isLoading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden border-gray-200/40 dark:border-white/[0.04]">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <Wallet className="h-12 w-12 text-primary/20" />
              <p className="font-bold text-gray-500">No invoices yet for this branch.</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Start by creating a <strong>Fee Category</strong>, then click <strong>Invoice Student(s)</strong> to assign it.
                Students will see their fees in their dashboard and can pay online.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-white/[0.03] bg-gray-50/50 dark:bg-white/[0.01]">
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Student</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Fee Category</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Due Date</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Amount</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Paid</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Status</th>
                    <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-xs">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/[0.02]">
                  {records.map((rec) => (
                    <tr key={rec._id} className="hover:bg-gray-100/30 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                          {rec.student?.firstName} {rec.student?.lastName}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                          {rec.student?.admissionNo} • {rec.student?.class}
                        </p>
                      </td>
                      <td className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-xs">{rec.feeCategory?.name}</td>
                      <td className="p-4 text-xs font-semibold text-gray-500">{new Date(rec.dueDate).toLocaleDateString()}</td>
                      <td className="p-4 font-extrabold text-primary text-sm">₹{rec.amount}</td>
                      <td className="p-4 font-semibold text-emerald-500 text-sm">₹{rec.paidAmount || 0}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rec.status === 'Paid'          ? 'bg-emerald-500/10 text-emerald-500' :
                          rec.status === 'PartiallyPaid' ? 'bg-amber-500/10 text-amber-500' :
                                                          'bg-red-500/10 text-red-400'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {rec.status !== 'Paid' ? (
                          <button
                            onClick={() => handlePayNow(rec._id)}
                            disabled={checkoutMutation.isPending}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md hover:scale-[1.01] transition-transform flex items-center gap-1"
                          >
                            <CreditCard className="h-3.5 w-3.5" /> Pay
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Settled
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
      )}

      {/* ── Payment Simulator Modal ──────────────────────── */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border-white/[0.08] shadow-2xl">
            <div className="text-center mb-6">
              <Wallet className="h-12 w-12 text-primary mx-auto mb-3 animate-pulse" />
              <h3 className="text-lg font-bold">Secure Fee Payment</h3>
              <p className="text-xs text-gray-400 mt-1">
                {paymentModal.keyId === 'rzp_test_mockkeyid123' ? 'Simulating Razorpay Payment Gateway' : 'Razorpay Payment Gateway'}
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl space-y-2 mb-6 text-xs">
              <div className="flex justify-between text-gray-400 font-semibold">
                <span>Order ID:</span>
                <span className="text-white font-mono truncate max-w-[180px]">{paymentModal.order.id}</span>
              </div>
              <div className="flex justify-between text-gray-400 font-semibold">
                <span>Amount Due:</span>
                <span className="text-primary font-bold text-sm">₹{paymentModal.order.amount / 100}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePayment}
                disabled={isProcessingPayment || verifyMutation.isPending}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
              >
                {isProcessingPayment || verifyMutation.isPending 
                  ? 'Processing…' 
                  : paymentModal.keyId === 'rzp_test_mockkeyid123' 
                    ? 'Authorize Transaction (Simulated)' 
                    : 'Pay Now with Razorpay'}
              </button>
              <button
                onClick={() => setPaymentModal(null)}
                disabled={isProcessingPayment}
                className="w-full py-2.5 border border-white/[0.06] hover:bg-white/[0.02] text-gray-400 hover:text-white text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
