import cron from 'node-cron';
import database from '../database/db.js';

const initJobs = () => {
    // Chạy vào 00:00 mỗi ngày
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('--- Đang tiến hành dọn dẹp nhật ký hoạt động trên 30 ngày ---');
            
            const query = "DELETE FROM audit_log WHERE timestamp < NOW() - INTERVAL '30 days'";
            const result = await database.query(query);
            
            console.log(`Daily audit log cleanup completed. Đã xóa ${result.rowCount} bản ghi cũ.`);
        } catch (error) {
            console.error('Lỗi khi thực hiện dọn dẹp nhật ký tự động:', error);
        }
    });

    console.log('--- Tất cả tác vụ lập lịch đã được khởi tạo ---');
};

export default initJobs;