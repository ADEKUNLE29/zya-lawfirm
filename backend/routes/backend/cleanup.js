const db = require('./database');

async function cleanup() {
    try {
        console.log('🔍 Checking for duplicate admin accounts...');

        const users = await db.allAsync('SELECT * FROM users ORDER BY id');
        console.log(`Found ${users.length} user(s):`);
        users.forEach(u => console.log(`  - ID ${u.id}: ${u.username} (created: ${u.created_at})`));

        if (users.length > 1) {
            const keepId = users[0].id;
            console.log(`\n🗑️  Removing duplicate admins, keeping ID ${keepId}...`);
            await db.runAsync('DELETE FROM users WHERE id != ?', [keepId]);
            console.log('✅ Cleanup complete!');
        } else {
            console.log('✅ No duplicates found.');
        }

        const remaining = await db.allAsync('SELECT * FROM users');
        console.log(`\n📊 Total users now: ${remaining.length}`);

    } catch (err) {
        console.error('❌ Cleanup error:', err.message);
    }
}

cleanup();