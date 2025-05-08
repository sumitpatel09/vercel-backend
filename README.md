# Task Manager Backend

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the `backend` directory with the following variables:
   ```
   MONGO_URI=mongodb://localhost:27017/taskmanagerdb
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   ```

3. Start the server:
   ```
   npm run dev
   ```

## Features

- User registration and login with JWT authentication.
- Task CRUD operations with assignment and notifications.
- Notification system for task assignments.
- Secure password hashing and protected routes.

## API Endpoints

- `POST /api/auth/register` - Register a new user.
- `POST /api/auth/login` - Login and get JWT token.
- `GET /api/tasks` - Get tasks assigned to or created by the user.
- `POST /api/tasks` - Create a new task.
- `GET /api/tasks/:id` - Get task details.
- `PUT /api/tasks/:id` - Update a task.
- `DELETE /api/tasks/:id` - Delete a task.
- `GET /api/notifications` - Get unread notifications.
- `PUT /api/notifications/:id/read` - Mark notification as read.
