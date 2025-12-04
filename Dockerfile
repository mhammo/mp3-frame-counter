FROM node:24-alpine

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy only package files first (better caching)
COPY pnpm-lock.yaml ./
COPY package.json ./

# Install dependencies
RUN pnpm install --prod

# Copy source code
COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["node", ".dist/start.js"]