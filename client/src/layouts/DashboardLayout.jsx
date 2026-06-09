import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { 
  LayoutDashboard, Users, UserCheck, CreditCard, 
  BookOpen, Calendar, DollarSign, LogOut,
  MapPin, Settings, ShieldAlert, Award, ChevronDown
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout, activeBranchId, setActiveBranchId } = useAuthStore();
  const { initTheme } = useThemeStore();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => { initTheme(); }, []);

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard',        path: '/',         icon: LayoutDashboard, roles: ['SuperAdmin','Admin','Principal','Teacher','Student','Parent','Accountant','HR'] },
    { name: 'CRM Leads',        path: '/crm',      icon: ShieldAlert,     roles: ['SuperAdmin','Admin','Principal','HR'] },
    { name: 'Students',         path: '/students', icon: Users,           roles: ['SuperAdmin','Admin','Principal','Teacher','Accountant','HR'] },
    { name: 'Attendance',       path: '/attendance',icon: UserCheck,      roles: ['SuperAdmin','Admin','Principal','Teacher'] },
    { name: 'Fee Collection',   path: '/fees',     icon: CreditCard,      roles: ['SuperAdmin','Admin','Accountant','Student','Parent'] },
    { name: 'Academics',        path: '/academics',icon: BookOpen,        roles: ['SuperAdmin','Admin','Principal','Teacher','Student','Parent'] },
    { name: 'Staff Management', path: '/staff',    icon: Award,           roles: ['SuperAdmin','Admin','Principal','HR'] },
    { name: 'Payroll & Salaries',path: '/payroll', icon: DollarSign,      roles: ['SuperAdmin','Admin','Accountant','HR'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    /*
     * Root: full viewport height, no overflow — the page itself NEVER scrolls.
     * Sidebar and main content each carry their own independent scroll containers.
     */
    <div className="h-screen overflow-hidden flex text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      {/*
       * The aside itself is a fixed-height flex column with 3 zones:
       *   [TOP]    Logo + Branch selector  — never scrolls
       *   [MIDDLE] Nav links               — scrolls independently via sidebar-scroll
       *   [BOTTOM] Settings / User / Logout— never scrolls
       */}
      <aside className="w-64 flex-shrink-0 glass-panel m-4 mr-0 rounded-2xl flex-col justify-between hidden md:flex border-gray-200/40 dark:border-white/[0.04] overflow-hidden">

        {/* ── TOP: Logo + Branch selector (fixed, never scrolls) ── */}
        <div className="flex-shrink-0 p-4">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
              E
            </div>
            <div>
              <span className="font-bold tracking-tight text-lg text-gray-900 dark:text-white">ERP-EDU</span>
              <span className="text-[10px] block font-semibold text-primary/70 uppercase">Enterprise SaaS</span>
            </div>
          </div>

          {/* Branch Selector */}
          {user?.role !== 'Student' && user?.role !== 'Parent' && user?.branches && user.branches.length > 0 && (
            <div className="mb-2 px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 mb-1.5">Active Branch</p>
              <div className="relative flex items-center rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/20 hover:border-primary/40 transition-colors duration-200">
                <MapPin className="absolute left-3 h-3.5 w-3.5 text-primary flex-shrink-0 pointer-events-none" />
                <select
                  value={activeBranchId || ''}
                  onChange={(e) => setActiveBranchId(e.target.value)}
                  className="w-full pl-8 pr-7 py-2.5 bg-transparent text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none border-none cursor-pointer appearance-none focus:ring-0"
                >
                  {user.branches.map(b => (
                    <option key={b._id || b} value={b._id || b} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                      {b.name || 'Unnamed Branch'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-primary pointer-events-none flex-shrink-0" />
              </div>
            </div>
          )}
        </div>

        {/* ── MIDDLE: Nav links — scrolls independently ─────── */}
        <nav className="flex-1 sidebar-scroll px-4 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 mb-2">Navigation</p>
          <div className="space-y-1">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── BOTTOM: Settings / User / Logout (fixed, never scrolls) ── */}
        <div className="flex-shrink-0 p-4 pt-0 border-t border-gray-200/50 dark:border-white/[0.04]">
          <div className="pt-3 space-y-1">
            {/* Settings Link */}
            <Link
              to="/settings"
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                location.pathname === '/settings'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              Settings
            </Link>

            <div className="border-t border-gray-200/50 dark:border-white/[0.04] my-2" />

            {/* User Account */}
            <div className="flex items-center gap-3 px-3 py-1">
              <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-bold text-sm text-primary flex-shrink-0">
                {user?.email[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate text-gray-900 dark:text-white">{user?.email}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{user?.role}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ────────────────────────────────── */}
      {/*
       * flex-1 means it takes all remaining width.
       * h-full + overflow-hidden keeps it inside the viewport.
       * The inner <main> is the actual independent scroll container.
       */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden p-4">
        <main className="flex-1 main-scroll rounded-2xl">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
