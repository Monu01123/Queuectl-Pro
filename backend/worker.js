import db from "./config/db.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startWorker = async () => {
    console.log("Worker is starting...");

    const redisClient = await db();

    while (true) {
        let jobId = null;

        try {
            console.log("Waiting for jobs...");
            const result = await redisClient.brPop(
                ['queue:high', 'queue:normal', 'queue:low', 'queue'],
                0
            );

            if (!result) continue;

            jobId = result.element;
            const lockKey = `lock:${jobId}`;

            // 1. ACQUIRE ATOMIC DISTRIBUTED LOCK (30s TTL)
            const lockAcquired = await redisClient.set(lockKey, process.pid.toString(), {
                NX: true,
                PX: 30000
            });

            if (!lockAcquired) {
                console.warn(`⚠️ [Lock Rejected] PID ${process.pid} skipped Job ${jobId} (Already locked by another worker)`);
                continue;
            }

            console.log(`🔒 [Lock Acquired] PID ${process.pid} processing job ${jobId}`);

            const job = await redisClient.hGetAll(`job:${jobId}`);
            if (!job || Object.keys(job).length === 0) {
                await redisClient.del(lockKey);
                continue;
            }

            // for testing DLQ purpose 
            // throw new Error("Simulated random API failure!");
            // await sleep(2000);

            await redisClient.hSet(`job:${jobId}`, { status: "completed" });
            console.log(`✅ Job ${jobId} completed successfully`);

            // 2. RELEASE LOCK ON SUCCESS
            await redisClient.del(lockKey);

        } catch (error) {
            console.error(`Worker Error on Job ${jobId}:`, error.message);

            if (jobId) {
                // 3. RELEASE LOCK ON ERROR BEFORE RETRY
                await redisClient.del(`lock:${jobId}`);

                const job = await redisClient.hGetAll(`job:${jobId}`);

                const currentAttempts = parseInt(job.attempts || 0) + 1;
                const maxRetries = parseInt(job.maxRetries || 3);

                if (currentAttempts <= maxRetries) {

                    const delaySeconds = Math.pow(2, currentAttempts);
                    const retryTimestamp = Date.now() + (delaySeconds * 1000);

                    await redisClient.hSet(`job:${jobId}`, {
                        attempts: currentAttempts,
                        status: "delayed"
                    });
                    await redisClient.zAdd('delayed', { score: retryTimestamp, value: jobId });
                    console.log(`Job ${jobId} failed. Retry delay ${delaySeconds} seconds (${currentAttempts}/${maxRetries})`);
                } else {
                    await redisClient.hSet(`job:${jobId}`, { status: "failed" });
                    console.log(`Job ${jobId} failed permanently after ${maxRetries} retries`);
                    await redisClient.lPush("dlq", jobId);
                    console.log(`Job ${jobId} added to dead Letter Queue`);
                }
            }
        }
    }
};

startWorker();