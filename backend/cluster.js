import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;

  console.log(`==================================================`);
  console.log(`🚀 QueueCTL Pro - Master Cluster Controller`);
  console.log(`👑 Primary Process PID: ${process.pid}`);
  console.log(`⚡ Detected ${numCPUs} Hardware CPU Cores.`);
  console.log(`==================================================\n`);

  // Fork a worker thread for every available CPU core
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    console.log(`[Forking] Booted CPU Core Worker PID: ${worker.process.pid}`);
  }

  // Self-Healing Process Manager: If any worker crashes out of memory or gets killed, restart it!
  cluster.on('exit', (worker, code, signal) => {
    console.log(`\n⚠️ [CRASH] Worker PID ${worker.process.pid} terminated (Signal: ${signal || code}).`);
    console.log(`🔄 [Healing] Spinning up immediate replacement worker...`);
    const newWorker = cluster.fork();
    console.log(`✅ [Restored] Replacement Worker PID: ${newWorker.process.pid}\n`);
  });

} else {
  // Child processes import and run the Redis queue polling loop
  import('./worker.js');
}
