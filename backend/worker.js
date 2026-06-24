import db from "./config/db.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startWorker = async () => {
    console.log("Worker is starting...");

    const redisClient = await db();

    while (true) {
        let jobId = null;

        try {
            console.log("Waiting for jobs...");
            const result = await redisClient.brPop("queue", 0);
            if (!result) continue;

            jobId = result.element;
            console.log(`Processing job ${jobId}`);


            const job = await redisClient.hGetAll(`job:${jobId}`);
            if (!job || Object.keys(job).length === 0) {
                continue;
            }

            // for testing DLQ purpose 
            // throw new Error("Simulated random API failure!");


            await sleep(2000);

            await redisClient.hSet(`job:${jobId}`, { status: "completed" });
            console.log(`Job ${jobId} completed`);

        } catch (error) {
            console.error(`Worker Error on Job ${jobId}:`, error.message);

            if (jobId) {
                const job = await redisClient.hGetAll(`job:${jobId}`);

                const currentAttempts = parseInt(job.attempts || 0) + 1;
                const maxRetries = parseInt(job.maxRetries || 3);

                if (currentAttempts <= maxRetries) {
                    await redisClient.hSet(`job:${jobId}`, {
                        attempts: currentAttempts,
                        status: "pending"
                    });
                    await redisClient.lPush("queue", jobId);
                    console.log(`Job ${jobId} failed. Retrying... (${currentAttempts}/${maxRetries})`);
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