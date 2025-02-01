# syntax=docker/dockerfile:1

### Build Stage
FROM node:lts-buster AS builder
WORKDIR /src
COPY package*.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

### Final Stage
FROM node:lts-buster
WORKDIR /app

# Install OS dependencies required by Playwright/Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxkbcommon0 \
    libasound2 \
    libatspi2.0-0 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json package-lock.json ./

ARG SUNO_COOKIE
ARG BROWSER
RUN if [ -z "$SUNO_COOKIE" ]; then echo "Warning: SUNO_COOKIE is not set"; fi
ENV SUNO_COOKIE=${SUNO_COOKIE}
RUN if [ -z "$BROWSER" ]; then echo "Warning: BROWSER is not set; will use chromium by default"; fi
ENV BROWSER=${BROWSER:-chromium}

# Install production dependencies (should install playwright@1.49.0 as per package.json)
RUN npm install --only=production

# Instead of using npx, run the locally installed playwright binary:
RUN ./node_modules/.bin/playwright install chromium

COPY --from=builder /src/.next ./.next
EXPOSE 3000
CMD ["npm", "run", "start"]
