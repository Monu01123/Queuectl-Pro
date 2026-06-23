import express, { json } from 'express';
import db from './config/db.js'


const server = express();
const PORT = 3000;

server.use(express.json());
const redisClient = await db();

server.post("/jobs", async (req, res) => {
    const { command, data } = req.body;
    if (!command || !data) {
        return res.status(400).json({ message: "Command and data are required" });
    }
    const jobId = Date.now().toString();
    await redisClient.hSet(`job:${jobId}`, {
        id: jobId,
        command: command,
        data: JSON.stringify(data),
        status: 'pending'
    })
    await redisClient.lPush('queue', jobId);
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


server.listen(PORT, () => {
    console.log("server is running on PORT ", PORT);
})
