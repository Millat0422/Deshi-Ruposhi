// Create a new admin OR promote an existing account to admin.
//
//   npm run create-admin -- you@example.com "StrongPass123" "Your Name"
//   npm run create-admin -- existing@user.com           (promotes an existing user)
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';

const [emailArg, password, ...nameParts] = process.argv.slice(2);
const email = emailArg?.toLowerCase().trim();
const name = nameParts.join(' ') || 'ORiXA Admin';

const run = async () => {
  if (!email) {
    console.log('Usage: npm run create-admin -- <email> [password] [name]');
    process.exit(1);
  }

  await connectDB();
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = 'admin';
    existing.isActive = true;
    if (password) existing.password = password;
    await existing.save();
    console.log(`[admin] ${email} is now an admin${password ? ' (password updated)' : ''}`);
  } else {
    if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      console.log('[admin] New admins need a password of 8+ characters with a letter and a number.');
      await disconnectDB();
      process.exit(1);
    }
    await User.create({ name, email, password, role: 'admin' });
    console.log(`[admin] Admin account created for ${email}`);
  }

  await disconnectDB();
};

run().catch(async (error) => {
  console.error('[admin] Failed:', error.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
