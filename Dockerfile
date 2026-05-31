FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY packages/core/package.json packages/core/
COPY packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm --filter @graphql-guard/core build && pnpm --filter @graphql-guard/web build

FROM nginx:alpine
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK CMD wget -q --spider http://localhost/ || exit 1
