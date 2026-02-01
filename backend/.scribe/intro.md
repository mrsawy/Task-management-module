# Introduction

Task Management Module API - A comprehensive REST API for managing tasks, users, roles, and permissions with JWT authentication.

<aside>
    <strong>Base URL</strong>: <code>http://localhost</code>
</aside>

    This documentation aims to provide all the information you need to work with our Task Management API.

    ## Authentication

    This API uses JWT (JSON Web Token) authentication. Most endpoints require authentication.

    1. **Sign up** or **Login** via `/api/auth/signup` or `/api/auth/login` to get your JWT token
    2. Include the token in the `Authorization` header as `Bearer {token}` for authenticated requests

    ## Endpoints Overview

    - **Authentication**: Sign up, login, logout, and refresh tokens
    - **Tasks**: Create, read, update, delete tasks with dependencies and workflow statuses
    - **Users**: Manage users (Manager role only) with role assignment
    - **Roles & Permissions**: Role-based access control system

    <aside>As you scroll, you'll see code examples for working with the API in different programming languages in the dark area to the right (or as part of the content on mobile).
    You can switch the language used with the tabs at the top right (or from the nav menu at the top left on mobile).</aside>

