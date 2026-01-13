import pkg from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

// Thiết lập đường dẫn tuyệt đối đến file config.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../config/config.env') });

// Kiểm tra lỗi nạp biến (Debug)
console.log("--- Kiểm tra biến môi trường ---");
console.log("DB_HOST:", process.env.PGHOST || "Trống");
console.log("DB_USER:", process.env.PGUSER || "Trống");
console.log("DB_PASS:", process.env.PGPASSWORD ? "Đã có" : "Trống");
console.log("NODE_ENV:", process.env.NODE_ENV || "Trống");
console.log("-------------------------------");

class Database {
    static instance;

    constructor() {
        if (Database.instance) {
            return Database.instance;
        }

        // Tạo ID ngẫu nhiên để demo
        this.id = Math.random().toString(36).substring(2, 9);
        console.log('Creating new Database instance, id =', this.id);

        console.log('Initializing PostgreSQL Pool...');

        this.pool = new Pool({
            id: this.id,
            host: process.env.PGHOST,
            database: process.env.PGDATABASE,
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            port: process.env.PGPORT || 5432,
            ssl: process.env.NODE_ENV === 'production'
                ? { rejectUnauthorized: false }
                : { require: true },
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 20000,
        });

        this.pool.on('error', (err) => {
            console.error('PostgreSQL Pool Error:', err.message);
        });

        Database.instance = this;
    }

    async connect() {
        const client = await this.pool.connect();
        console.log('Database connected successfully');
        client.release();
    }

    getPool() {
        return this.pool;
    }
}

const database = new Database();
await database.connect();

export default database.getPool();