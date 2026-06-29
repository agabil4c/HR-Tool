# Stage 1: Build React frontend
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Clean install dependencies
RUN npm ci

# Copy project files
COPY . .

# Set Vite env to empty so the apiClient defaults to relative endpoints (behind nginx)
ENV VITE_API_BASE_URL=""

# Build the production bundle
RUN npm run build

# Stage 2: Production server
FROM nginx:alpine

# Remove default nginx website configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
