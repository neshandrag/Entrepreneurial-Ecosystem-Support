import mongoose from 'mongoose';
import { User } from '../models/User';
import { config } from '../config/env';

const seedAdminUser = async () => {
  try {
    console.log('🌱 Starting admin user seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('📦 Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('👤 Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminUser = new User({
      fullName: 'CITBIF Administrator',
      email: config.admin.email,
      username: 'admin',
      password: config.admin.password,
      role: 'admin',
      profileComplete: true,
      isEmailVerified: true,
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email:', adminUser.email);
    console.log('🔐 Password:', config.admin.password);
    console.log('🎯 Role:', adminUser.role);

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the seeder
seedAdminUser();