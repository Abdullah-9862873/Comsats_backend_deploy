const mongoose = require('mongoose');
require('dotenv').config();

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Delete all weekly reports
        const WeeklyReport = require('./models/WeeklyReport');
        await WeeklyReport.deleteMany({});
        console.log('✅ Deleted all weekly reports');

        // Delete all weekly report events (if they exist)
        try {
            const WeeklyReportEvent = require('./models/WeeklyReportEvent');
            await WeeklyReportEvent.deleteMany({});
            console.log('✅ Deleted all weekly report events');
        } catch (error) {
            console.log('ℹ️ No WeeklyReportEvent model found');
        }

        console.log('🎉 Database cleanup complete!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
}

cleanup();
