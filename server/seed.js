/**
 * ERP-EDU Demo Seed Script
 * ========================
 * Creates one demo account for every role in the system, plus a demo branch.
 *
 * Usage:
 *   node seed.js          → seed all demo data
 *   node seed.js --clean  → wipe all demo users + branch then re-seed
 *
 * All demo accounts use password:  Demo@12345
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Branch = require('./models/Branch');

/* ─── Demo Data ───────────────────────────────────────────────── */

const DEMO_PASSWORD = 'Demo@12345';

const DEMO_BRANCH = {
  name: 'Main Campus',
  code: 'MC01',
  contact: {
    email: 'maincampus@erpedu.com',
    phone: '9876543210',
    website: 'https://maincampus.erpedu.com',
  },
  address: {
    street: '12 School Lane',
    city: 'Chennai',
    state: 'Tamil Nadu',
    zipCode: '600001',
    country: 'India',
  },
  settings: {
    academicYearStart: new Date('2026-06-01'),
    academicYearEnd: new Date('2027-05-31'),
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  },
  isActive: true,
};

const buildDemoUsers = (branchId) => [
  {
    email: 'superadmin@erpedu.com',
    password: DEMO_PASSWORD,
    role: 'SuperAdmin',
    isEmailVerified: true,
    isActive: true,
    branches: [],           // SuperAdmin has access to ALL branches
    activeBranch: null,
  },
  {
    email: 'admin@erpedu.com',
    password: DEMO_PASSWORD,
    role: 'Admin',
    isEmailVerified: true,
    isActive: true,
    branches: [branchId],
    activeBranch: branchId,
  },
  {
    email: 'principal@erpedu.com',
    password: DEMO_PASSWORD,
    role: 'Principal',
    isEmailVerified: true,
    isActive: true,
    branches: [branchId],
    activeBranch: branchId,
  },
  {
    email: 'hr@erpedu.com',
    password: DEMO_PASSWORD,
    role: 'HR',
    isEmailVerified: true,
    isActive: true,
    branches: [branchId],
    activeBranch: branchId,
  },
  {
    email: 'teacher@erpedu.com',
    password: DEMO_PASSWORD,
    role: 'Teacher',
    isEmailVerified: true,
    isActive: true,
    branches: [branchId],
    activeBranch: branchId,
  },
  {
    email: 'accountant@erpedu.com',
    password: DEMO_PASSWORD,
    role: 'Accountant',
    isEmailVerified: true,
    isActive: true,
    branches: [branchId],
    activeBranch: branchId,
  },
  {
    email: 'student@erpedu.com',
    password: DEMO_PASSWORD,
    role: 'Student',
    isEmailVerified: true,
    isActive: true,
    branches: [branchId],
    activeBranch: branchId,
  },
  {
    email: 'parent@erpedu.com',
    password: DEMO_PASSWORD,
    role: 'Parent',
    isEmailVerified: true,
    isActive: true,
    branches: [branchId],
    activeBranch: branchId,
  },
];

/* ─── Helpers ─────────────────────────────────────────────────── */

const clean = process.argv.includes('--clean');

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');
}

async function clearDemoData() {
  const emails = [
    'superadmin@erpedu.com',
    'admin@erpedu.com',
    'principal@erpedu.com',
    'hr@erpedu.com',
    'teacher@erpedu.com',
    'accountant@erpedu.com',
    'student@erpedu.com',
    'parent@erpedu.com',
  ];
  const deleted = await User.deleteMany({ email: { $in: emails } });
  await Branch.deleteOne({ code: 'MC01' });
  console.log(`🗑️  Cleared ${deleted.deletedCount} demo users and demo branch`);
}

/* ─── Main Seed ───────────────────────────────────────────────── */

async function seed() {
  await connectDB();

  if (clean) {
    await clearDemoData();
    console.log('');
  }

  // 1) Create or find the demo branch
  let branch = await Branch.findOne({ code: 'MC01' });
  if (branch) {
    console.log(`ℹ️  Branch "Main Campus (MC01)" already exists — skipping creation`);
  } else {
    branch = await Branch.create(DEMO_BRANCH);
    console.log(`🏫 Created branch: ${branch.name} (${branch.code}) — ID: ${branch._id}`);
  }

  // 2) Seed users
  const demoUsers = buildDemoUsers(branch._id);
  const results = [];

  for (const userData of demoUsers) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      results.push({ role: userData.role, email: userData.email, status: 'already exists' });
      continue;
    }
    const user = await User.create(userData);
    results.push({ role: user.role, email: user.email, status: 'created ✅' });
  }

  // 3) Print summary table
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  ERP-EDU Demo Accounts Summary');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`  ${'Role'.padEnd(14)} ${'Email'.padEnd(30)} Status`);
  console.log('  ' + '─'.repeat(60));
  results.forEach(({ role, email, status }) => {
    console.log(`  ${role.padEnd(14)} ${email.padEnd(30)} ${status}`);
  });
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`\n  🔑 All accounts use password: ${DEMO_PASSWORD}`);
  console.log('  🌐 Login at:  http://localhost:5173/login');
  console.log('══════════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('✅ Done — MongoDB disconnected');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
