import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@citbif.com' },
    update: {},
    create: {
      fullName: 'CITBIF Admin',
      email: 'admin@citbif.com',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      profileComplete: true,
      isEmailVerified: true,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create demo enterprise user
  const demoPasswordHash = await bcrypt.hash('demo123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      fullName: 'Demo Startup Founder',
      email: 'demo@example.com',
      username: 'demo',
      passwordHash: demoPasswordHash,
      role: 'ENTERPRISE',
      profileComplete: true,
      isEmailVerified: true,
    },
  });
  console.log('✅ Created demo user:', demoUser.email);

  // Create demo startup
  const demoStartup = await prisma.startup.upsert({
    where: { id: 'demo-startup-1' },
    update: {},
    create: {
      id: 'demo-startup-1',
      userId: demoUser.id,
      name: 'AI Healthcare Solutions',
      founder: 'Demo Startup Founder',
      sector: 'Healthcare Technology',
      type: 'INNOVATION',
      trlLevel: 5,
      email: 'demo@example.com',
      status: 'ACTIVE',
      applicationStatus: 'APPROVED',
      description: 'Revolutionary AI-powered healthcare diagnostic platform',
      website: 'https://aihealthcare.demo',
      linkedinProfile: 'https://linkedin.com/company/ai-healthcare',
      teamSize: 8,
      foundedYear: 2023,
      location: 'Bangalore, India',
      coFounderNames: ['Co-founder 1', 'Co-founder 2'],
      fundingStage: 'Series A',
      alreadyFunded: true,
      fundingAmount: 2000000,
      fundingSource: 'Venture Capital',
      milestones: [
        {
          id: '1',
          name: 'MVP Development',
          description: 'Complete minimum viable product',
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'completed',
          completedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
        {
          id: '2',
          name: 'Beta Testing',
          description: 'Launch beta version with select customers',
          targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: 'current',
        },
        {
          id: '3',
          name: 'Market Launch',
          description: 'Official product launch',
          targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          status: 'pending',
        },
      ],
    },
  });
  console.log('✅ Created demo startup:', demoStartup.name);

  // Create sample mentors
  const mentors = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Senior Tech Advisor',
      email: 'sarah.johnson@example.com',
      experience: '15+ years in healthcare technology',
      bio: 'Former CTO at major healthcare tech company, specializes in AI and machine learning applications in healthcare.',
      phoneNumber: '+91-9876543210',
      expertise: ['Healthcare Technology', 'AI/ML', 'Product Strategy'],
      sectors: ['Healthcare', 'Biotech', 'AI'],
      rating: 4.8,
    },
    {
      name: 'Rajesh Kumar',
      role: 'Startup Mentor',
      email: 'rajesh.kumar@example.com',
      experience: '12+ years in startup ecosystem',
      bio: 'Serial entrepreneur and investor with expertise in scaling technology startups from idea to IPO.',
      phoneNumber: '+91-9876543211',
      expertise: ['Startup Strategy', 'Fundraising', 'Business Development'],
      sectors: ['Technology', 'Fintech', 'E-commerce'],
      rating: 4.9,
    },
  ];

  for (const mentorData of mentors) {
    const mentor = await prisma.mentor.upsert({
      where: { email: mentorData.email },
      update: {},
      create: mentorData,
    });
    console.log('✅ Created mentor:', mentor.name);
  }

  // Create sample investors
  const investors = [
    {
      name: 'Michael Chen',
      firm: 'TechVentures Capital',
      email: 'michael@techventures.com',
      phoneNumber: '+91-9876543212',
      investmentRange: '$500K - $5M',
      focusAreas: ['Healthcare Tech', 'AI/ML', 'Fintech'],
      backgroundSummary: 'Partner at TechVentures with 10+ years experience in early-stage healthcare and AI investments.',
      position: 'Partner',
    },
    {
      name: 'Priya Sharma',
      firm: 'Innovation Fund',
      email: 'priya@innovationfund.com',
      phoneNumber: '+91-9876543213',
      investmentRange: '$1M - $10M',
      focusAreas: ['B2B SaaS', 'Enterprise Tech', 'AI'],
      backgroundSummary: 'Senior Investment Manager focusing on B2B technology solutions and enterprise software.',
      position: 'Senior Investment Manager',
    },
  ];

  for (const investorData of investors) {
    const investor = await prisma.investor.upsert({
      where: { email: investorData.email },
      update: {},
      create: investorData,
    });
    console.log('✅ Created investor:', investor.name);
  }

  // Create sample events
  const events = [
    {
      userId: admin.id,
      title: 'Startup Pitch Day',
      description: 'Monthly pitch event where startups present to investors and mentors',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      time: '14:00',
      location: 'CITBIF Auditorium',
      category: 'Pitch',
      status: 'published',
    },
    {
      userId: admin.id,
      title: 'AI in Healthcare Masterclass',
      description: 'Expert-led session on leveraging AI technologies in healthcare solutions',
      date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      time: '10:00',
      location: 'Virtual Event',
      category: 'Workshop',
      status: 'published',
    },
  ];

  for (const eventData of events) {
    const event = await prisma.event.create({
      data: eventData,
    });
    console.log('✅ Created event:', event.title);
  }

  // Create sample documents
  const sampleDoc = await prisma.documentRef.create({
    data: {
      ownerId: demoUser.id,
      name: 'Business Plan',
      type: 'pdf',
      size: 1024000,
      description: 'Comprehensive business plan for AI Healthcare Solutions',
      category: 'startup',
      isPublic: false,
      originalName: 'business-plan.pdf',
      mimeType: 'application/pdf',
      tags: ['business', 'plan', 'startup'],
    },
  });
  console.log('✅ Created sample document:', sampleDoc.name);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('👑 Admin: admin@citbif.com / admin123');
  console.log('🚀 Demo User: demo@example.com / demo123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });