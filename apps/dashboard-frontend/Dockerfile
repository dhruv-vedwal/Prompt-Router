# Stage 1: Build
FROM oven/bun:1.2.5 AS build
WORKDIR /usr/src/app

ARG API_URL
ARG ROUTER_API_URL
ENV API_URL=$API_URL
ENV ROUTER_API_URL=$ROUTER_API_URL

RUN test -n "$API_URL" || (echo "API_URL build-arg is required" && exit 1)
RUN test -n "$ROUTER_API_URL" || (echo "ROUTER_API_URL build-arg is required" && exit 1)

COPY . .
RUN bun install

WORKDIR /usr/src/app/apps/dashboard-frontend
RUN bun run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /usr/src/app/apps/dashboard-frontend/dist /usr/share/nginx/html
COPY apps/dashboard-frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
