# Task Management Module

A full-stack task management system built with Laravel and React, featuring real-time notifications via Laravel Reverb WebSockets.

## 🌐 Live Demo

**[https://task-management-module.hadefah.com/](https://task-management-module.hadefah.com/)**

## 📋 Features

- **Task Creation & Assignment**: Users can create tasks for themselves or assign them to other users
- **Real-time Notifications**: Instant task assignment notifications via Laravel Reverb WebSockets
- **Modular Architecture**: Backend designed with modular structure for scalability
- **Queue Jobs**: Asynchronous WhatsApp notifications via queue workers
- **Multi-module Support**: Built with HR, ERP, and task management modules in mind

## 🏗️ Project Structure

```
task-management-module/
├── backend/          # Laravel API
├── frontend/         # React application
└── docker-compose.yml
```

## 🚀 Getting Started

### Prerequisites

- PHP 8.1+
- Composer
- Node.js 18+
- pnpm
- MySQL
- Docker & Docker Compose (optional)

### Option 1: Running with Docker (Recommended)

The easiest way to run the entire project:

```bash
docker-compose up
```

This will start:
- Backend API (Laravel)
- Frontend (React with Vite)
- MySQL Database
- Laravel Reverb WebSocket Server
- Queue Workers

### Option 2: Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
composer install
```

3. Configure environment:
```bash
cp .env.example .env
php artisan key:generate
```

4. Update `.env` with your database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=task_management
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

5. Run migrations:
```bash
php artisan migrate
```

6. Start the development server:
```bash
php artisan serve
```

7. **Start Laravel Reverb (Important!):**
```bash
php artisan reverb:start
```
> **Note**: The Reverb WebSocket server must be running for real-time notifications to work. This enables instant task assignment alerts to users.

8. Start the queue worker (for WhatsApp notifications):
```bash
php artisan queue:work
```

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies using pnpm:
```bash
pnpm install
```

3. Configure environment:
```bash
cp .env.example .env
```

4. Update `.env` with your backend API URL:
```env
VITE_API_URL=http://localhost:8000/api
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
```

5. Start the development server:
```bash
pnpm dev
```

The frontend will be available at `http://localhost:5173`

## 🔧 Backend Architecture

The backend follows a **modular architecture** designed for scalability and maintainability:

### Modules
- **HR Module**: Human resources management features
- **ERP Module**: Enterprise resource planning integration
- **Tasks Module**: Core task management functionality
- **Notifications Module**: WhatsApp and real-time notifications

### Key Technologies
- **Laravel**: RESTful API framework
- **Laravel Reverb**: WebSocket server for real-time communication
- **Queue Jobs**: Asynchronous processing for notifications
- **MySQL**: Primary database

## 🎨 Frontend Stack

- **React**: UI library
- **Vite**: Build tool and development server
- **pnpm**: Package manager

## 📡 Real-time Features

When the Laravel Reverb server is running, users receive:
- Instant notifications when assigned to tasks
- Real-time updates on task status changes
- Live collaboration features

## 🐳 Docker Configuration

The `docker-compose.yml` includes:
- Laravel application container
- React development server
- MySQL database
- Redis (for queues and broadcasting)
- Laravel Reverb WebSocket server

## 📝 Important Notes

1. **Reverb Server**: Always ensure the Reverb server is running (`php artisan reverb:start`) for real-time notifications
2. **Queue Workers**: Run queue workers for WhatsApp notifications and background jobs
3. **Database**: MySQL is required for the backend
4. **Package Manager**: The frontend uses pnpm, not npm or yarn

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the MIT License.

## 🔗 Links

- **Live Application**: [https://task-management-module.hadefah.com/](https://task-management-module.hadefah.com/)
- **Backend**: Laravel-based REST API
- **Frontend**: React with Vite

---

Built with ❤️ using Laravel & React
