const db = require('./db');

let schemaReady;

async function createSchema() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            firstName VARCHAR(100) NOT NULL,
            lastName VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            language VARCHAR(20) DEFAULT 'english',
            service VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'other',
            message TEXT,
            contacted TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            contact_id INT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(30),
            is_temp_password TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_clients_contact (contact_id),
            FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS cases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            client_id INT NOT NULL,
            contact_id INT NULL,
            service_type VARCHAR(80) NOT NULL,
            status VARCHAR(50) DEFAULT 'submitted',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_cases_client (client_id),
            INDEX idx_cases_contact (contact_id),
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
            FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS case_updates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            case_id INT NOT NULL,
            old_status VARCHAR(50),
            new_status VARCHAR(50) NOT NULL,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_case_updates_case (case_id),
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS case_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            case_id INT NOT NULL,
            sender_type ENUM('client', 'admin') NOT NULL,
            content TEXT NOT NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_case_messages_case (case_id),
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
        )
    `);
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
