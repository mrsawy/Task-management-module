# Task Management Module

A full-stack task management system built with Laravel and React, featuring real-time notifications via Laravel Reverb WebSockets.

## 📊 Database Schema (ERD)

The application uses a relational database with the following main entities and relationships:

### Entity Relationship Diagram

![Database ERD](https://drive.google.com/uc?export=view&id=1TBBYTaPEujlj0n86o2iiP7ecejCqK_xd)
*Entity Relationship Diagram showing the database structure and relationships*

[View Full Size](https://drive.google.com/file/d/1TBBYTaPEujlj0n86o2iiP7ecejCqK_xd/view?usp=sharing)

### Main Entities
- **Users**: System users with authentication and role assignment
- **Roles**: User roles (Manager, Worker)
- **Permissions**: Granular permissions for tasks and users
- **Tasks**: Task items with workflow status, priority, and dependencies
- **Task Dependencies**: Many-to-many relationship for task dependencies

### Relationships
- **User ↔ Role**: Many-to-One (Users belong to a Role)
- **Role ↔ Permission**: Many-to-Many (Roles have multiple Permissions via `role_permissions` pivot table)
- **User ↔ Task**: One-to-Many (Users can create/be assigned multiple Tasks)
- **Task ↔ Task**: Many-to-Many (Tasks can depend on other Tasks via `task_dependencies` pivot table)
- **User ↔ User**: Self-referential (Users can create other Users via `created_by_id`)

### Generate ERD

The project includes the [Laravel ER Diagram Generator](https://github.com/beyondcode/laravel-er-diagram-generator) package for visualizing the database schema.

#### Generate Text ERD:
```bash
cd backend
php artisan generate:erd --text-output erd.txt
```

#### Generate Visual ERD (requires GraphViz):
1. Install GraphViz:
   - **Windows**: Download from [GraphViz website](https://graphviz.org/download/) or use `winget install Graphviz.Graphviz`
   - **macOS**: `brew install graphviz`
   - **Linux**: `sudo apt-get install graphviz` or `sudo yum install graphviz`

2. Generate the diagram:
```bash
cd backend
php artisan generate:erd erd.png --format=png
```

> **Note**: A text-based ERD (`erd.txt`) in GraphViz DOT format is already generated in the `backend/` directory. You can convert it to an image using online tools like [Graphviz Online](https://dreampuf.github.io/GraphvizOnline/) or by installing GraphViz locally.

## 📸 Screenshots

### Dark Mode
![Task Manager - Dark Mode](https://drive.google.com/uc?export=view&id=1SCUHGVLeU9PrMIyGSnioOmmwYJJtNHoi)
*Modern dark theme with card-based task layout and filtering options*

### Light Mode
![Task Manager - Light Mode](https://drive.google.com/uc?export=view&id=1kOmCF3vm6NSdbWU-ixwbYAQKJ4BSTo9E)
*Clean light theme with full task management capabilities*

### Kanban Board
![Kanban Board](https://drive.google.com/uc?export=view&id=1djaZAWTU4p0f2n03B_tEtlwpaH1aPWxn)
*Interactive Kanban board with drag-and-drop task management across workflow statuses (To-Do, In Progress, Review, Done)*

[View Full Size](https://drive.google.com/file/d/1djaZAWTU4p0f2n03B_tEtlwpaH1aPWxn/view?usp=sharing)

### Users Management
![Users Management](https://drive.google.com/uc?export=view&id=1S7QGO_mOhdzNMDpW_kz-WSwRRNQ43627)
*Comprehensive user management interface with role assignment and permission control*

[View Full Size](https://drive.google.com/file/d/1S7QGO_mOhdzNMDpW_kz-WSwRRNQ43627/view?usp=sharing)

## 📋 Features

### Task Management
- **Task Creation & Assignment**: Users can create tasks for themselves or assign them to other users
- **Kanban Board**: Interactive drag-and-drop Kanban board with workflow statuses (To-Do, In Progress, Review, Done)
- **Task Dependencies**: Define task dependencies and dependents to manage task relationships
- **Task Filtering**: Filter by status, priority, and due date
- **Task Statistics**: Dashboard with total, completed, due today, and overdue task counts
- **Priority Levels**: Low, Medium, and High priority assignment
- **Workflow Status Management**: Track tasks through To-Do, In Progress, Review, and Done statuses
- **Dependency Validation**: Prevents marking tasks as "Done" if dependencies are incomplete

### User Management
- **User CRUD Operations**: Create, read, update, and delete users (Manager role only)
- **User Assignment**: Assign tasks to specific users with user selection dropdown
- **User Tracking**: Track which user created each user account
- **User Profiles**: View user details including assigned tasks and role information

### Roles & Permissions (RBAC)
- **Role-Based Access Control**: Comprehensive RBAC system with roles and permissions
- **Predefined Roles**: Manager and Worker roles with appropriate permissions
- **Granular Permissions**: Fine-grained permissions for tasks and users (create, update, delete, view_all, view_assigned, assign, update_status)
- **Permission Middleware**: Route-level and controller-level permission checks
- **Dynamic UI**: Navigation items and features shown/hidden based on user permissions

### Real-time Features
- **Real-time Notifications**: Instant task assignment notifications via Laravel Reverb WebSockets
- **Live Updates**: Real-time task status updates across all connected clients
- **WebSocket Support**: Optional WebSocket connection (can be disabled via environment variable)

### Additional Features
- **Modular Architecture**: Backend designed with modular structure for scalability
- **Queue Jobs**: Asynchronous WhatsApp notifications via queue workers
- **Multi-module Support**: Built with HR, ERP, and task management modules in mind
- **Dark/Light Mode**: Beautiful UI with theme switching support
- **Optimistic Updates**: Smooth UI updates with optimistic rendering in Kanban board

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
- **shadcn/ui**: Modern UI component library
- **Tailwind CSS**: Utility-first CSS framework

## 👥 Users, Roles & Permissions

### User Management
The system includes a comprehensive user management system where managers can:
- **Create Users**: Add new users to the system with role assignment
- **Update Users**: Modify user information including name, email, and role
- **Delete Users**: Remove users from the system (with proper permission checks)
- **View All Users**: List all users in the system with their roles and details
- **Track Creation**: See which manager created each user account

### Role System
The application uses a role-based access control (RBAC) system:

#### Roles
- **Manager**: Full access to create, update, assign tasks, and manage users
- **Worker**: Limited access to view assigned tasks and update task status

#### Permissions
Permissions are organized by subject and action:

**Task Permissions:**
- `tasks.create` - Create new tasks
- `tasks.update` - Update task details
- `tasks.assign` - Assign tasks to users
- `tasks.view_all` - View all tasks in the system
- `tasks.view_assigned` - View only assigned tasks
- `tasks.update_status` - Update task workflow status

**User Permissions:**
- `users.create` - Create new users
- `users.update` - Update user information
- `users.delete` - Delete users
- `users.view_all` - View all users

### Permission Checks
- **Route Level**: Middleware checks permissions before allowing access
- **Controller Level**: Additional permission validation in controllers
- **UI Level**: Navigation items and buttons shown/hidden based on permissions

## 📊 Kanban Board

The Kanban board provides an intuitive drag-and-drop interface for managing tasks:

### Workflow Statuses
Tasks flow through four distinct statuses:
1. **To-Do**: Newly created tasks awaiting work
2. **In Progress**: Tasks currently being worked on
3. **Review**: Tasks completed and awaiting review
4. **Done**: Tasks fully completed and approved

### Features
- **Drag & Drop**: Smooth drag-and-drop between columns to update task status
- **Optimistic Updates**: Instant UI updates with server synchronization
- **Error Handling**: Automatic rollback if status update fails (e.g., incomplete dependencies)
- **Task Cards**: Compact task cards showing title, priority, due date, and assignee
- **Quick Actions**: View and Edit buttons on each task card
- **Dependency Validation**: Prevents moving tasks to "Done" if dependencies are incomplete

### Status Update Rules
- **Managers**: Can update any task field including status
- **Workers**: Can only update task status (if they have `tasks.update_status` permission)
- **Dependency Check**: Tasks cannot be marked as "Done" if their dependencies are not completed

## 📡 Real-time Features

When the Laravel Reverb server is running, users receive:
- Instant notifications when assigned to tasks
- Real-time updates on task status changes
- Live collaboration features

> **Note**: WebSocket connection can be disabled by setting `VITE_REVERB_ENABLED=false` in the frontend environment variables.

## 🐳 Docker Configuration

The `docker-compose.yml` orchestrates all services in a containerized environment:

### Services Included:
- **MySQL 8.0**: Database server with persistent volume storage
- **Laravel Backend**: PHP-FPM with Nginx, includes Reverb WebSocket server
- **React Frontend**: Vite development server with hot module replacement
- **Shared Volumes**: Frontend build artifacts mounted to backend for seamless integration

### Quick Start with Docker:
```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Rebuild containers
docker-compose up --build

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Docker Features:
- **Health Checks**: MySQL container includes health monitoring
- **Network Isolation**: All services communicate via dedicated bridge network
- **Volume Persistence**: Database data persists across container restarts
- **Environment Variables**: Pre-configured with all necessary Laravel and Reverb settings
- **Auto-migrations**: Backend automatically runs migrations on startup

## 📝 Important Notes

1. **Reverb Server**: Always ensure the Reverb server is running (`php artisan reverb:start`) for real-time notifications
2. **Queue Workers**: Run queue workers for WhatsApp notifications and background jobs
3. **Database**: MySQL is required for the backend
4. **Package Manager**: The frontend uses pnpm, not npm or yarn
5. **Docker Networking**: When using Docker, services communicate via internal network (backend accessible at `http://backend:8000` from frontend container)

## 🎨 UI Components

The frontend uses **shadcn/ui** - a collection of beautifully designed, accessible, and customizable React components built with Radix UI and Tailwind CSS.

### Featured Components:
- Form elements with validation
- Dialog and modal systems
- Data tables with sorting and filtering
- Toast notifications
- Command palette
- Dropdown menus and popovers

All components are:
- ✅ Fully accessible (ARIA compliant)
- ✅ Customizable with Tailwind
- ✅ Dark mode ready
- ✅ Type-safe with TypeScript

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the MIT License.

## 🔗 Links

- **Backend**: Laravel-based REST API
- **Frontend**: React with Vite

---

Built with ❤️ using Laravel & React
