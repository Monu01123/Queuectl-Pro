import express, { json } from 'express';
import db from './config/db.js'


const server = express();
const PORT = 3000;

server.use(express.json());
const redisClient = await db();

server.post("/jobs", async (req, res) => {
    const { command, data, delay } = req.body;
    if (!command || !data) {
        return res.status(400).json({ message: "Command and data are required" });
    }

    const jobId = Date.now().toString();

    if (delay) {
        const executedAt = Date.now() + (delay * 1000);
        await redisClient.hSet(`job:${jobId}`, { status: 'delayed' });
        await redisClient.zAdd('delayed', { score: executedAt, value: jobId });
    }
    else {
        await redisClient.hSet(`job:${jobId}`, {
            id: jobId,
            command: command,
            data: JSON.stringify(data),
            status: 'pending',
            attempts: 0,
            maxRetries: 3
        })
        await redisClient.lPush('queue', jobId);
    }
    return res.status(201).json({ jobId, message: "Job added to queue" });
})

server.get("/jobs/:id", async (req, res) => {
    const id = req.params.id;
    const job = await redisClient.hGetAll(`job:${id}`);

    if (Object.keys(job).length === 0) {
        return res.status(404).json({ message: "Job not found" });
    }
    return res.status(200).json(job);
})

server.get("/dlq", async (req, res) => {
    const dlqJobs = await redisClient.lRange("dlq", 0, -1);
    return res.status(200).json(dlqJobs);
})


server.listen(PORT, () => {
    console.log("server is running on PORT ", PORT);
})
