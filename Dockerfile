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

ARG SUNO_COOKIE
ARG BROWSER
RUN if [ -z "$SUNO_COOKIE" ]; then echo "Warning: SUNO_COOKIE is not set"; fi
ENV SUNO_COOKIE=${SUNO_COOKIE}
RUN if [ -z "$BROWSER" ]; then echo "Warning: BROWSER is not set; will use chromium by default"; fi
ENV BROWSER=${BROWSER:-chromium}

RUN npm install --only=production

# Install Chromium via Playwright
RUN npx playwright install chromium

# Create the symlink for the missing binary reference:
RUN mkdir -p /root/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux && \
    ln -s /root/.cache/ms-playwright/chromium_headless_shell-1155/chrome-linux/headless_shell \
          /root/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell

COPY --from=builder /src/.next ./.next
EXPOSE 3000
CMD ["npm", "run", "start"]
