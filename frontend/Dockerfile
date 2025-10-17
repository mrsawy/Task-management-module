FROM node:24-alpine AS frontend

WORKDIR /app

RUN npm install -g pnpm

# Copy package files first
COPY package.json pnpm-lock.yaml* ./

# Install dependencies in the container
RUN pnpm install --frozen-lockfile

# Copy source code in a way that preserves node_modules
# Copy everything except node_modules
COPY --chown=node:node package.json pnpm-lock.yaml* ./
COPY --chown=node:node public ./public/
COPY --chown=node:node src ./src/
COPY --chown=node:node index.html ./
COPY --chown=node:node vite.config.ts tsconfig*.json ./
COPY --chown=node:node components.json eslint.config.js ./
COPY --chown=node:node *.d.ts ./

# Build the application
RUN npm run build
