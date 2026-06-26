import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [stats, setStats] = useState({ queue: 0, dlq: 0, delayed: 0 });

  const [form, setForm] = useState({
    command: 'send-email',
    data: '{"user": "monu_mca"}',
    delay: 0,
    priority: 'normal'
  });


  useEffect(() => {
    // 1. Create a function called fetchStats that makes a GET request to http://localhost:3000/stats
    // 2. Parse the JSON response and update state using setStats(data)
    // 3. Set up a setInterval to run fetchStats every 1000ms
    // 4. Return a cleanup function: () => clearInterval(interval)

    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:3000/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Backend offline");
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      await fetch("http://localhost:3000/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: form.command,
          data: JSON.parse(form.data || '{}'),
          delay: Number(form.delay) > 0 ? Number(form.delay) : undefined,
          priority: form.priority
        })
      });
    } catch (err) {
      alert("Invalid JSON data or server error");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>⚡ QueueCTL Pro Dashboard</h1>
      </div>

      <div className="metrics-grid">
        <div className="glass-card">
          <div className="card-title">Pending Jobs</div>
          <div className="card-value blue">{stats.queue}</div>
        </div>

        <div className="glass-card">
          <div className="card-title">Delayed Jobs</div>
          <div className="card-value purple">{stats.delayed}</div>
        </div>

        <div className="glass-card">
          <div className="card-title">Dead Letter Queue (Failed)</div>
          <div className="card-value red">{stats.dlq}</div>
        </div>
      </div>

      <div className="form-card">
        <div className="form-title">🚀 Dispatch Background Job</div>

        <form onSubmit={handleDispatch}>
          <div className="form-grid">
            <div className="form-group">
              <label>Command Name</label>
              <input
                className="form-input"
                value={form.command}
                onChange={e => setForm({ ...form, command: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Data Payload (JSON)</label>
              <input
                className="form-input"
                value={form.data}
                onChange={e => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Delay (Seconds)</label>
              <input
                type="number"
                className="form-input"
                value={form.delay}
                onChange={e => setForm({ ...form, delay: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Priority Level</label>
              <select
                className="form-input"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
              >
                <option value="high">🔴 High (VIP)</option>
                <option value="normal">🔵 Normal</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

          </div>
          <button type="submit" className="submit-btn">
            + Enqueue Job
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
