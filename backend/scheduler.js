import db from './config/db.js';

const startScheduler = async () => {
    const redisClient = await db();
    console.log("Scheduler started...");

    setInterval(async () => {
        try {
            const now = Date.now();
            const readyJobs = await redisClient.zRange("delayed", 0, now, { BY: "SCORE" });

            for (const jobId of readyJobs) {
                console.log(`Time to run Job ${jobId}! Moving to main queue...`);
                await redisClient.lPush("queue", jobId);
                await redisClient.zRem("delayed", jobId);
                await redisClient.hSet(`job:${jobId}`, { status: "pending" });
            }
        } catch (error) {
            console.log("Scheduler Error:", error);
        }
    }, 1000);
};

startScheduler();