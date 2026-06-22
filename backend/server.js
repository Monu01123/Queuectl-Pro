import express from 'express';
import db from './config/db.js'


const server = express();
const PORT = 3000;

server.use(express.json());
db();
server.get("/", (req, res) => {
    return res.status(200).json({ message: "Server is running" });
})

server.listen(PORT, () => {
    console.log("server is running on PORT ", PORT);
})
