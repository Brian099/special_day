"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initDatabase = initDatabase;
const sql_js_1 = __importDefault(require("sql.js"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbPath = process.env.DATABASE_PATH || path_1.default.join(__dirname, '../../data.db');
const dbDir = path_1.default.dirname(dbPath);
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
let SQL = null;
let dbInstance = null;
let saveTimer = null;
function persistDb() {
    if (!dbInstance)
        return;
    try {
        const data = dbInstance.export();
        fs_1.default.writeFileSync(dbPath, Buffer.from(data));
    }
    catch (err) {
        console.error('[DB] Failed to save database to disk:', err);
    }
}
// Immediate save for critical actions or process exit
process.on('exit', () => persistDb());
process.on('SIGINT', () => { persistDb(); process.exit(0); });
process.on('SIGTERM', () => { persistDb(); process.exit(0); });
exports.db = {
    exec(sql) {
        if (!dbInstance)
            throw new Error('Database not initialized yet');
        dbInstance.exec(sql);
        persistDb();
    },
    pragma(_sql) {
        // Memory database pragmas
    },
    prepare(sql) {
        return {
            get(...params) {
                if (!dbInstance)
                    throw new Error('Database not initialized yet');
                const stmt = dbInstance.prepare(sql);
                try {
                    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
                    stmt.bind(flatParams);
                    if (stmt.step()) {
                        return stmt.getAsObject();
                    }
                    return undefined;
                }
                finally {
                    stmt.free();
                }
            },
            all(...params) {
                if (!dbInstance)
                    throw new Error('Database not initialized yet');
                const stmt = dbInstance.prepare(sql);
                const results = [];
                try {
                    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
                    stmt.bind(flatParams);
                    while (stmt.step()) {
                        results.push(stmt.getAsObject());
                    }
                    return results;
                }
                finally {
                    stmt.free();
                }
            },
            run(...params) {
                if (!dbInstance)
                    throw new Error('Database not initialized yet');
                const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
                dbInstance.run(sql, flatParams);
                persistDb();
                return { changes: 1 };
            }
        };
    }
};
async function initDatabase() {
    if (!SQL) {
        SQL = await (0, sql_js_1.default)();
    }
    if (fs_1.default.existsSync(dbPath)) {
        try {
            const fileBuffer = fs_1.default.readFileSync(dbPath);
            dbInstance = new SQL.Database(fileBuffer);
            console.log(`[DB] Loaded existing database from: ${dbPath}`);
        }
        catch (e) {
            console.warn('[DB] Failed to parse existing db file, creating new:', e);
            dbInstance = new SQL.Database();
        }
    }
    else {
        dbInstance = new SQL.Database();
        console.log(`[DB] Created new database at: ${dbPath}`);
    }
    exports.db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      fn_uid TEXT UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'calendar',
      color TEXT DEFAULT '#FF416C',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category_id TEXT,
      title TEXT NOT NULL,
      target_date TEXT NOT NULL,
      calendar_type TEXT DEFAULT 'solar',
      is_leap_month INTEGER DEFAULT 0,
      repeat_type TEXT DEFAULT 'none',
      repeat_interval INTEGER DEFAULT 1,
      repeat_weekdays TEXT,
      direction TEXT DEFAULT 'countdown',
      cover_image TEXT,
      top_pinned INTEGER DEFAULT 0,
      archived INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      remind_time TEXT DEFAULT '09:00',
      advance_days INTEGER DEFAULT 0,
      notify_channels TEXT DEFAULT '["web"]',
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      theme_mode TEXT DEFAULT 'system',
      default_calendar_type TEXT DEFAULT 'solar',
      webhook_url TEXT,
      webhook_type TEXT DEFAULT 'generic',
      smtp_host TEXT,
      smtp_port INTEGER DEFAULT 465,
      smtp_user TEXT,
      smtp_pass TEXT,
      smtp_from TEXT,
      smtp_secure INTEGER DEFAULT 1,
      email_recipient TEXT,
      email_enabled INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id, archived, top_pinned);
    CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_event ON reminders(event_id);
  `);
    // Migrate user_settings columns if upgrading existing db
    const columnsToAdd = [
        { name: 'smtp_host', type: 'TEXT' },
        { name: 'smtp_port', type: 'INTEGER DEFAULT 465' },
        { name: 'smtp_user', type: 'TEXT' },
        { name: 'smtp_pass', type: 'TEXT' },
        { name: 'smtp_from', type: 'TEXT' },
        { name: 'smtp_secure', type: 'INTEGER DEFAULT 1' },
        { name: 'email_recipient', type: 'TEXT' },
        { name: 'email_enabled', type: 'INTEGER DEFAULT 0' }
    ];
    for (const col of columnsToAdd) {
        try {
            exports.db.exec(`ALTER TABLE user_settings ADD COLUMN ${col.name} ${col.type};`);
        }
        catch {
            // Column already exists, ignore
        }
    }
}
