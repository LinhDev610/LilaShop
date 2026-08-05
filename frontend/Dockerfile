# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency files
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies using yarn if lock file exists, otherwise npm
RUN if [ -f yarn.lock ]; then yarn install; else npm install; fi

# Copy all project files and build
COPY . .
RUN if [ -f yarn.lock ]; then yarn build; else npm run build; fi

# Stage 2: Serve the React application using Nginx
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration for React Router Support
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
