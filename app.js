const express = require('express');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const Queue = require('bull');
const fs = require('fs');
const cluster = require('cluster');
const os = require('os');

// Number of CPU cores
const numCPUs = os.cpus().length;

// Initialize task queue with Redis configuration
const taskQueue = new Queue('taskQueue', {
    redis: { host: '127.0.0.1', port: 6379 } // Redis server configuration
});

// In-memory storage for registered users
const users = {};

// Task function that logs to a file
const task = async (user_id) => {
    const log = `${user_id} - task completed at - ${new Date().toISOString()}\n`;
    try {
        fs.appendFileSync('task.log', log);
        console.log(log);
    } catch (err) {
        console.error('Error writing to log file', err);
    }
};

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
    points: 20, // 20 tasks per minute
    duration: 60, // per minute
    blockDuration: 0, // No blocking, just queue tasks
});

const app = express();
app.use(express.json());

// Route to register a new user
app.post('/api/v1/register', (req, res) => {
    const { user_id, username } = req.body;

    if (!user_id || !username) {
        return res.status(400).json({ message: 'User ID and username are required.' });
    }

    if (users[user_id]) {
        return res.status(400).json({ message: 'User ID already registered.' });
    }

    // Register the user
    users[user_id] = { username };
    res.status(201).json({ message: 'User registered successfully.' });
});

// Route to handle task submission
app.post('/api/v1/task', async (req, res) => {
    const { user_id } = req.body;

    if (!users[user_id]) {
        console.error(`User not registered: ${user_id}`);
        return res.status(401).json({ message: 'User not registered. Please register first.' });
    }

    try {
        console.log(`Consuming rate limit for user: ${user_id}`);
        await rateLimiter.consume(user_id, 1);

        console.log(`Adding task to queue for user: ${user_id}`);
        await taskQueue.add({ user_id });
        res.status(200).json({ message: 'Task added to the queue' });
    } catch (err) {
        console.error('Rate limit exceeded or other error:', err);

        if (err.msBeforeNext) {
            console.log(`Rate limit exceeded. Queuing task for user: ${user_id}`);
            await taskQueue.add({ user_id });
            res.status(429).json({ message: 'Rate limit exceeded. Task queued.' });
        } else {
            res.status(500).json({ message: 'An error occurred.' });
        }
    }
});

// Task processing from the queue
taskQueue.process(async (job) => {
    try {
        const { user_id } = job.data;
        await task(user_id);
        console.log(`Task processed for user: ${user_id}`);
    } catch (error) {
        console.error('Error processing task:', error);
    }
});

// Error handling for the queue
taskQueue.on('error', (error) => {
    console.error('Queue error:', error);
});

// Cluster setup for multi-core processing
if (cluster.isMaster) {
    console.log('Master process started');
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });
} else {
    app.listen(3000, () => {
        console.log(`Worker ${process.pid} started`);
    });
}
