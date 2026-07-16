const db = require('./db');

let schemaReady;

async function createSchema() {
    // Enable foreign keys
    await db.runAsync('PRAGMA foreign_keys = ON');

    // Create contacts table
    await db.runAsync(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            language TEXT DEFAULT 'english',
            service TEXT NOT NULL,
            status TEXT DEFAULT 'other',
            message TEXT,
            contacted INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create clients table
    await db.runAsync(`
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            is_temp_password INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
        )
    `);

    // Create cases table
    await db.runAsync(`
        CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            contact_id INTEGER NULL,
            service_type TEXT NOT NULL,
            status TEXT DEFAULT 'submitted',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
            FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
        )
    `);

    // Create trigger for updated_at
    await db.runAsync(`
        CREATE TRIGGER IF NOT EXISTS cases_updated_at
        AFTER UPDATE ON cases
        FOR EACH ROW
        BEGIN
            UPDATE cases SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
    `);

    // Create case_updates table
    await db.runAsync(`
        CREATE TABLE IF NOT EXISTS case_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL,
            old_status TEXT,
            new_status TEXT NOT NULL,
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
        )
    `);

    // Create case_messages table
    await db.runAsync(`
        CREATE TABLE IF NOT EXISTS case_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL,
            sender_type TEXT CHECK(sender_type IN ('client', 'admin')) NOT NULL,
            content TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
        )
    `);

    // Create users table (for admin login)
    await db.runAsync(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ All tables created successfully!');
}

function ensureSchema() {
    if (!schemaReady) {
        schemaReady = createSchema().catch((error) => {
            schemaReady = null;
            throw error;
        });
    }

    return schemaReady;
}

module.exports = { ensureSchema };