import mongoose from 'mongoose';
import User from '../src/model/users.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const TEST_USERS = [
    {
        username: 'test_moderator',
        email: 'moderator@test.com',
        password: 'ModeratorPass123!',
        role: 'moderator',
    },
    {
        username: 'test_user',
        email: 'user@test.com',
        password: 'UserPass123!',
        role: 'user',
    },
];

async function seedTestUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to database');

        for (const userData of TEST_USERS) {
            const existingUser = await User.findOne({ email: userData.email });

            if (existingUser) {
                console.log(`User ${userData.username} already exists`);
                const hashedPassword = await bcrypt.hash(userData.password, 10);

                // Use updateOne to bypass mongoose validation on the hashed password
                await User.updateOne(
                    { _id: existingUser._id },
                    {
                        $set: {
                            password: hashedPassword,
                            role: userData.role
                        }
                    }
                );
                console.log(`Updated user ${userData.username}`);
            } else {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                // Create user but bypass validation if needed, or ensure model allows hashed passwords
                // Ideally, validation should only run on plain text password before hashing
                // But since we are seeding, we can use direct collection access or disable validation

                // Better approach: Create instance, set properties, save with validateModifiedOnly: true
                // Or just use the model if validation allows it.
                // The error suggests validation runs on the hashed value which fails complexity rules.

                // Let's use direct collection access to bypass mongoose validation for seeding
                await mongoose.connection.collection('users').insertOne({
                    ...userData,
                    password: hashedPassword,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    __v: 0
                });
                console.log(`Created user ${userData.username}`);
            }
        }


        console.log('Test users seeded successfully');
    } catch (error) {
        console.error('Error seeding test users:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

seedTestUsers();
