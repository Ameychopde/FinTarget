# Node.js Task Queue with Rate Limiting

## Overview

This project is a Node.js application that implements a task queue with rate limiting and user registration. It uses Redis for task queuing and file-based logging for task completion. The application is designed to handle a high number of tasks efficiently by leveraging a multi-core setup with clustering.

## Features

- **User Registration:** Register new users with a unique user ID and username.
- **Rate Limiting:** Enforce rate limits on tasks (1 task per second and 20 tasks per minute per user).
- **Task Queuing:** Use Redis-backed queueing to manage and process tasks asynchronously.
- **Task Logging:** Log task completion to a file (`task.log`).
- **Clustering:** Utilize Node.js clustering to take advantage of multi-core systems.

## Technologies

- Node.js
- Express
- Bull (Redis-based queueing)
- Redis
- Rate-Limiter-Flexible
- Cluster Module

## Setup and Installation

### Prerequisites

- Node.js (v16 or later)
- Redis server

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/your-repository.git
   cd your-repository
   ```
   
2. **Install dependencies:**
   ```bash
   npm install
   npm start 
   ```

## Endpoints


1. ** Register a User: **
   URL: /api/v1/register
   Method: POST

   
2. ** Submit a Task: **
   URL: /api/v1/task
   Method: POST
   

