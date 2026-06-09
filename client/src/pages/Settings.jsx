import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, ACCENT_COLORS } from '../store/themeStore';
import {
  Sun, Moon, Bell, Shield, User, Globe, Monitor,
  Lock, Mail, Phone, Building2, Palette, Save,
  Eye, EyeOff, Check, ChevronRight, Languages,
  Volume2, Database, Trash2, Download
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuthStore();
  const { theme, toggleTheme, accentColor, setAccentColor } = useThemeStore();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    displayName: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    phone: '',
    organization: 'ERP-EDU School',
    timezone: 'Asia/Kolkata',
    language: 'en',
  });

  // Notification prefs
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    feeReminders: true,
    attendanceAlerts: false,
    systemUpdates: true,
    weeklyReport: true,
  });

  // Security state
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // UI state
  const [activeSection, setActiveSection] = useState('appearance');
  const [savedBadge, setSavedBadge] = useState(false);

  const handleSave = () => {
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2500);
  };

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-card rounded-3xl p-6 border-gray-200/40 dark:border-white/[0.04] bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account preferences, appearance, and system configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Section Nav */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-3 border-gray-200/40 dark:border-white/[0.04] sticky top-4">
            <nav className="space-y-1">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeSection === id
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${activeSection === id ? 'opacity-100' : 'opacity-30'}`} />
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Right: Content Panel */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── APPEARANCE ─────────────────────────────── */}
          {activeSection === 'appearance' && (
            <div className="glass-card rounded-2xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Appearance</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Customize how ERP-EDU looks for you.</p>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.05]">
                <div className="flex items-center gap-3">
                  {theme === 'dark'
                    ? <Moon className="h-5 w-5 text-indigo-400" />
                    : <Sun className="h-5 w-5 text-amber-500" />
                  }
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {theme === 'dark' ? 'Premium dark theme is active' : 'Light theme is active'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                    theme === 'dark' ? 'bg-primary' : 'bg-gray-300'
                  }`}
                  aria-label="Toggle theme"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Theme Quick Pick */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Color Theme</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Dark', bg: 'bg-gray-900', text: 'text-white', ring: theme === 'dark' },
                    { label: 'Light', bg: 'bg-white border border-gray-200', text: 'text-gray-900', ring: theme === 'light' },
                    { label: 'System', bg: 'bg-gradient-to-br from-gray-900 to-white', text: 'text-white', ring: false },
                  ].map((t) => (
                    <button
                      key={t.label}
                      onClick={() => {
                        if (t.label === 'Dark' && theme !== 'dark') toggleTheme();
                        if (t.label === 'Light' && theme !== 'light') toggleTheme();
                      }}
                      className={`p-4 rounded-xl ${t.bg} flex flex-col items-center gap-2 transition-all duration-200 ${
                        t.ring ? 'ring-2 ring-primary ring-offset-2 ring-offset-transparent' : 'hover:scale-[1.02]'
                      }`}
                    >
                      <Monitor className={`h-5 w-5 ${t.text}`} />
                      <span className={`text-xs font-semibold ${t.text}`}>{t.label}</span>
                      {t.ring && <Check className="h-3 w-3 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Accent Color</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {Object.entries(ACCENT_COLORS).map(([name, { tw, hex }]) => {
                    const isActive = accentColor === name;
                    return (
                      <button
                        key={name}
                        title={name}
                        onClick={() => setAccentColor(name)}
                        style={{ backgroundColor: hex }}
                        className={`relative h-8 w-8 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none ${
                          isActive
                            ? 'ring-2 ring-offset-2 ring-offset-transparent scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        aria-label={name}
                      >
                        {isActive && (
                          <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto drop-shadow" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Active: <span className="font-semibold text-gray-900 dark:text-white">{accentColor}</span> — changes apply instantly across the entire app.
                </p>
              </div>


            </div>
          )}

          {/* ── PROFILE ─────────────────────────────── */}
          {activeSection === 'profile' && (
            <div className="glass-card rounded-2xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Profile Information</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update your personal details and preferences.</p>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/20">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.email}</p>
                  <p className="text-xs text-primary font-medium mt-0.5">{user?.role}</p>
                  <button className="mt-2 text-xs text-primary font-semibold hover:underline">Change Avatar</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Display Name', key: 'displayName', icon: User, type: 'text' },
                  { label: 'Email Address', key: 'email', icon: Mail, type: 'email' },
                  { label: 'Phone Number', key: 'phone', icon: Phone, type: 'tel', placeholder: '+91 00000 00000' },
                  { label: 'Organization', key: 'organization', icon: Building2, type: 'text' },
                ].map(({ label, key, icon: Icon, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={type}
                        value={profileForm[key]}
                        placeholder={placeholder || ''}
                        onChange={(e) => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Timezone</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={profileForm.timezone}
                      onChange={(e) => setProfileForm(f => ({ ...f, timezone: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Language</label>
                  <div className="relative">
                    <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={profileForm.language}
                      onChange={(e) => setProfileForm(f => ({ ...f, language: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none"
                    >
                      <option value="en">English</option>
                      <option value="ta">Tamil</option>
                      <option value="hi">Hindi</option>
                      <option value="te">Telugu</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
              >
                {savedBadge ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {savedBadge ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ── NOTIFICATIONS ─────────────────────────── */}
          {activeSection === 'notifications' && (
            <div className="glass-card rounded-2xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Notification Preferences</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Control which alerts and updates you receive.</p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive important updates via email', icon: Mail },
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push alerts for real-time updates', icon: Bell },
                  { key: 'feeReminders', label: 'Fee Due Reminders', desc: 'Notify students & parents before fee deadlines', icon: CreditCardIcon },
                  { key: 'attendanceAlerts', label: 'Attendance Alerts', desc: 'Alert parents when attendance drops below threshold', icon: Bell },
                  { key: 'systemUpdates', label: 'System Updates', desc: 'Platform releases and maintenance windows', icon: Monitor },
                  { key: 'weeklyReport', label: 'Weekly Report', desc: 'Automated summary of school performance', icon: Database },
                ].map(({ key, label, desc, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.05]">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${notifications[key] ? 'bg-primary/10 text-primary' : 'bg-gray-200 dark:bg-white/[0.04] text-gray-400'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                        notifications[key] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                        notifications[key] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
              >
                {savedBadge ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {savedBadge ? 'Saved!' : 'Save Preferences'}
              </button>
            </div>
          )}

          {/* ── SECURITY ─────────────────────────────── */}
          {activeSection === 'security' && (
            <div className="glass-card rounded-2xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Security & Privacy</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Keep your account safe and manage privacy settings.</p>
              </div>

              {/* Change Password */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Change Password</p>
                <div className="space-y-3">
                  {[
                    { label: 'Current Password', key: 'currentPassword', show: showCurrentPass, toggle: () => setShowCurrentPass(s => !s) },
                    { label: 'New Password', key: 'newPassword', show: showNewPass, toggle: () => setShowNewPass(s => !s) },
                    { label: 'Confirm New Password', key: 'confirmPassword', show: showNewPass, toggle: () => setShowNewPass(s => !s) },
                  ].map(({ label, key, show, toggle }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type={show ? 'text' : 'password'}
                          value={passwordForm[key]}
                          onChange={(e) => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                        />
                        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSave}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
                >
                  <Shield className="h-4 w-4" />
                  Update Password
                </button>
              </div>

              {/* Two-Factor Auth */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add an extra layer of security to your account</p>
                  </div>
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">Coming Soon</span>
                </div>
              </div>

              {/* Active Sessions */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Active Sessions</p>
                <div className="space-y-2">
                  {[
                    { device: 'Chrome on Windows', location: 'Chennai, India', current: true, time: 'Active now' },
                    { device: 'Safari on iPhone', location: 'Mumbai, India', current: false, time: '2 hours ago' },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.05]">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${session.current ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{session.device}</p>
                          <p className="text-[10px] text-gray-500">{session.location} · {session.time}</p>
                        </div>
                      </div>
                      {session.current
                        ? <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">This device</span>
                        : <button className="text-xs font-semibold text-red-500 hover:underline">Revoke</button>
                      }
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SYSTEM ─────────────────────────────── */}
          {activeSection === 'system' && (
            <div className="glass-card rounded-2xl p-6 border-gray-200/40 dark:border-white/[0.04] space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">System Preferences</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Control data, cache, and application settings.</p>
              </div>

              {/* System Info */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">System Information</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Platform', value: 'ERP-EDU Enterprise' },
                    { label: 'Version', value: 'v1.0.0' },
                    { label: 'Your Role', value: user?.role || '—' },
                    { label: 'Logged in as', value: user?.email || '—' },
                    { label: 'Environment', value: 'Production' },
                    { label: 'API Status', value: '🟢 Operational' },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.05]">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase">{label}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Sound Effects</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Play sounds for alerts and notifications</p>
                  </div>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors duration-300">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 translate-x-6" />
                </button>
              </div>

              {/* Data Management */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Data & Storage</p>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors text-left">
                    <Download className="h-4 w-4 text-primary" />
                    Export My Data (CSV)
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors text-left">
                    <Database className="h-4 w-4 text-indigo-400" />
                    Clear Local Cache
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-red-500 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors text-left">
                    <Trash2 className="h-4 w-4" />
                    Delete Account (Irreversible)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Inline icon for CreditCard in notification section
function CreditCardIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
