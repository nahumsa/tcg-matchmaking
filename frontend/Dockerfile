# Build stage
FROM node:22-slim AS build

WORKDIR /app/frontend

# Copy dependency files
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY frontend/ ./

# Build the application
ARG VITE_API_URL
ARG VITE_WS_URL
RUN VITE_API_URL=$VITE_API_URL VITE_WS_URL=$VITE_WS_URL npm run build

# Serve stage
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to nginx
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
