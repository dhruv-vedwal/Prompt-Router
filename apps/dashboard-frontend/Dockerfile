# Stage 1: Build
FROM oven/bun:latest as build
WORKDIR /usr/src/app

ARG API_URL=http://localhost:3000
ARG ROUTER_API_URL=http://localhost:4000
ENV API_URL=$API_URL
ENV ROUTER_API_URL=$ROUTER_API_URL

COPY . .
RUN bun install

# Build the frontend using the custom build script
WORKDIR /usr/src/app/apps/dashboard-frontend
RUN bun run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy built files
COPY --from=build /usr/src/app/apps/dashboard-frontend/dist /usr/share/nginx/html
# Copy custom nginx config for SPA routing
COPY apps/dashboard-frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
