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

const database = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT || 5432,
    // Tắt hoàn toàn SSL khi ở môi trường phát triển
    ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false} 
        : { require: true},

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// BẮT BUỘC: handle error để app KHÔNG CRASH
database.on('error', (err) => {
    console.error('PostgreSQL Pool Error:', err.message);
});

try {
    const client = await database.connect();
    console.log('Database connected successfully');
    client.release();
} catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
}

export default database;