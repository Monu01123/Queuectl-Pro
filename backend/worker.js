import db from "./config/db.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startWorker = async () => {
    console.log("Worker is starting...");

    const redisClient = await db();

    while (true) {
        try {
            console.log("Waiting for jobs...");

            const result = await redisClient.brPop("queue", 0);

            if (!result) continue;

            const jobId = result.element;

            console.log(`Processing job ${jobId}`);

            await redisClient.hSet(`job:${jobId}`, {
                status: "processing",
            });

            const job = await redisClient.hGetAll(`job:${jobId}`);

            if (!job || Object.keys(job).length === 0) {
                console.log(`Job ${jobId} not found`);
                continue;
            }

            const { command, data } = job;

            console.log(`Executing command: ${command}`);
            console.log(`Data: ${data}`);

            await sleep(5000);

            await redisClient.hSet(`job:${jobId}`, {
                status: "completed",
            });

            console.log(`Job ${jobId} completed`);
        } catch (error) {
            console.error("Worker Error:", error);
        }
    }
};

startWorker();