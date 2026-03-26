require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function makeAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secure-file-sharing');
        console.log('Connected to MongoDB');

        // Update user to admin
        const email = 'mohitbindal106@gmail.com';
        const result = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { isAdmin: true },
            { new: true }
        );

        if (result) {
            console.log('✅ Admin account created successfully!');
            console.log(`Email: ${result.email}`);
            console.log(`Admin Status: ${result.isAdmin}`);
            console.log('\n📝 You can now login with this account and access the admin portal at /admin');
        } else {
            console.log('❌ User not found. Please register first with this email.');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

makeAdmin();
