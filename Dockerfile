# syntax=docker/dockerfile:1

FROM node:lts-buster AS builder
WORKDIR /src
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:lts-buster
WORKDIR /app
COPY package*.json ./

ARG SUNO_COOKIE
ARG BROWSER
RUN if [ -z "$SUNO_COOKIE" ]; then echo "Warning: SUNO_COOKIE is not set"; fi
ENV SUNO_COOKIE=${SUNO_COOKIE}
RUN if [ -z "$BROWSER" ]; then echo "Warning: BROWSER is not set; will use chromium by default"; fi
ENV BROWSER=${BROWSER:-chromium}

RUN npm install --only=production

# This will now download the official Chromium build (build 1148 for Playwright 1.49.0)
RUN npx playwright install chromium

COPY --from=builder /src/.next ./.next
EXPOSE 3000
CMD ["npm", "run", "start"]
