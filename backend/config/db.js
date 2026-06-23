import { createClient } from 'redis';
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const db = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Database connected successfully!");

        const redisClient = createClient({
            url: process.env.REDIS_URI
        });

        redisClient.on('error', (err) => console.log('Redis Client Error', err));
        await redisClient.connect();
        console.log("Redis connected successfully!");

        return redisClient;
    } catch (error) {
        console.log("Error:", error);
    }
}

export default db;
