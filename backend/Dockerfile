FROM node:18-alpine
WORKDIR /app
# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.0.0 --activate
COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod
COPY . .
RUN pnpm run build
CMD ["node", "dist/main.js"]
