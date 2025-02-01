# syntax=docker/dockerfile:1

FROM node:lts-alpine AS builder
WORKDIR /src
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./

# Optional: Warn if SUNO_COOKIE or BROWSER are not set, then set environment variables.
ARG SUNO_COOKIE
ARG BROWSER
RUN if [ -z "$SUNO_COOKIE" ]; then echo "Warning: SUNO_COOKIE is not set"; fi
ENV SUNO_COOKIE=${SUNO_COOKIE}
RUN if [ -z "$BROWSER" ]; then echo "Warning: BROWSER is not set; will use chromium by default"; fi
ENV BROWSER=${BROWSER:-chromium}

# Install production dependencies
RUN npm install --only=production

# Install the Chromium browser via Playwright
RUN npx playwright install chromium

# Create a symbolic link so that references to build 1148 point to build 1155
RUN ln -s /root/.cache/ms-playwright/chromium_headless_shell-1155 /root/.cache/ms-playwright/chromium_headless_shell-1148

# Copy built files from the builder stage
COPY --from=builder /src/.next ./.next

EXPOSE 3000
CMD ["npm", "run", "start"]
