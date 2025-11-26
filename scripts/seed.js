#!/usr/bin/env node

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';

// Load environment variables
config();

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Import User model
import('../src/model/users.js').then(async ({ default: User }) => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;

        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        // Connect to database
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Configuration from environment variables
        const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
        const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'admin_user';
        const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'AdminPassword123!';

        // Check if admin already exists
        const existingAdmin = await User.findOne({
            $or: [
                { email: ADMIN_EMAIL },
                { username: ADMIN_USERNAME }
            ]
        });

        if (existingAdmin) {
            console.log('✓ Admin user already exists. Skipping seed.');
            console.log(`  Email: ${existingAdmin.email}`);
            console.log(`  Username: ${existingAdmin.username}`);
            console.log(`  Role: ${existingAdmin.role}`);
            await mongoose.connection.close();
            process.exit(0);
        }

        // Create admin user
        console.log('Creating admin user...');
        const adminUser = new User({
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin',
            isActive: true,
            isLocked: false,
        });

        await adminUser.save();
        console.log('✓ Admin user created successfully');
        console.log(`  Email: ${ADMIN_EMAIL}`);
        console.log(`  Username: ${ADMIN_USERNAME}`);
        console.log(`  Role: admin`);
        console.log('');
        console.log('⚠  Please change the admin password after first login!');

        // Close connection
        await mongoose.connection.close();
        console.log('✓ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('✗ Seed script error:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
});
