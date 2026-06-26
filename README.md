# ⚡ QueueCTL Pro

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Redis](https://img.shields.io/badge/Redis-Upstash%20/%20Local-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**An enterprise-grade, distributed background job processing queue and real-time monitoring dashboard built from scratch.**

[Key Features](#-engineering-highlights) • [System Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [API Reference](#-api-reference)

</div>

---

## 📖 Overview

**QueueCTL Pro** is a fault-tolerant asynchronous job orchestration platform designed to handle heavy background workloads (such as email dispatching, video encoding, and webhook processing) without blocking synchronous HTTP request threads. 

By leveraging **Redis Lists and Sorted Sets** for in-memory broker state and **Node.js Hardware Clustering** for multi-core worker execution, QueueCTL Pro achieves sub-millisecond task enqueueing and strict priority execution.

---

## 🚀 Engineering Highlights

### 1. Decoupled Asynchronous Enqueueing
HTTP REST requests (`POST /jobs`) instantly persist payload metadata to Redis Hashes and push job IDs to broker queues. This decouples client response times from actual background execution time.

### 2. Multi-Core Worker Clustering (`cluster.js`)
Default Node.js applications run on a single CPU thread. QueueCTL Pro utilizes the native Node.js `cluster` module to detect hardware CPU limits and fork independent worker processes across **100% of physical cores**, featuring built-in process self-healing.

### 3. Strict Priority Stratification
Jobs are categorized into isolated Redis lists (`queue:high`, `queue:normal`, `queue:low`). Workers consume tasks via atomic blocking pops (`BRPOP`), guaranteeing VIP urgent payloads skip standard backlogs.

### 4. Delayed Execution Scheduler (`scheduler.js`)
Scheduled tasks (`"delay": 60`) are promoted to a Redis Sorted Set (`ZADD`) scored by target execution UNIX timestamps. A dedicated daemon polls ripe tasks (`ZRANGE`) and promotes them to active queues.

### 5. Exponential Backoff & Dead Letter Queue (DLQ)
Failing background tasks automatically retry up to 3 times. To protect third-party rate-limited APIs, retry intervals multiply exponentially ($2^1s, 2^2s, 2^3s$). Permanently failing jobs are quarantined in an isolated Dead Letter Queue (`dlq`) for inspection.

### 6. Real-Time Glassmorphism Dashboard
A modern **React + Vite SPA** styled with dark-mode glassmorphism. It polls broker metrics (`GET /stats`) every second to display live job velocity and provides an interactive UI form to dispatch custom tasks.

---

## 🏛 System Architecture

```mermaid
graph TD
    Client[Web Client / API Form] -->|POST /jobs| API[Express API Gateway]
    API -->|HMSET Job Metadata| Redis[(Redis Broker)]
    API -->|LPUSH Instant Job| QueueList[Redis Priority Lists]
    API -->|ZADD Delayed Job| DelayedSet[Redis Sorted Set]
    
    subDaemon[Scheduler Daemon] -->|ZRANGE / Ripe Check| DelayedSet
    subDaemon -->|LPUSH Promoted Job| QueueList
    
    subWorkers[Multi-Core Worker Cluster] -->|BRPOP Atomic Dequeue| QueueList
    subWorkers -->|Success / Completed| Redis
    subWorkers -->|Failure / Retry Delay| DelayedSet
    subWorkers -->|Max Retries Exceeded| DLQ[Dead Letter Queue]
```

---

## 📦 Getting Started

### Option A: 1-Click Production Boot (Docker Compose)
*Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.*

1. Clone the repository:
   ```bash
   git clone https://github.com/Monu01123/Queuectl-Pro.git
   cd Queuectl-Pro
   ```
2. Boot the full-stack container ecosystem:
   ```bash
   docker compose up --build -d
   ```
3. Access the services:
   - **Web Dashboard:** [http://localhost](http://localhost) (Port 80)
   - **Express API:** [http://localhost:3000](http://localhost:3000)

---

### Option B: Local Development Setup

1. **Configure Backend Environment:**
   Create `backend/.env` and insert your Redis connection URI:
   ```env
   REDIS_URI=rediss://default:your_token@your_upstash_domain.upstash.io:6379
   PORT=3000
   ```

2. **Launch Services (in 4 separate terminals):**
   ```bash
   # Terminal 1: API Gateway
   cd backend && npm install && npm start

   # Terminal 2: Scheduler Daemon
   cd backend && node scheduler.js

   # Terminal 3: Multi-Core Worker Cluster
   cd backend && node cluster.js

   # Terminal 4: React Dashboard
   cd frontend && npm install && npm run dev
   ```
3. Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔌 API Reference

### Dispatch Background Job
`POST /jobs`

```json
// Request Body
{
  "command": "generate-report",
  "data": { "userId": 8841, "format": "pdf" },
  "priority": "high",
  "delay": 10
}
```

### Fetch Queue Metrics
`GET /stats`

```json
// Response
{
  "queue": 4,
  "dlq": 1,
  "delayed": 2
}
```

### Inspect Dead Letter Queue
`GET /dlq`

Returns an array of permanently failed Job IDs quarantined for manual triage.

---

## 👨‍💻 Author

**Monu**  
*Master of Computer Applications (MCA), Class of 2026*  

- GitHub: [@Monu01123](https://github.com/Monu01123)
