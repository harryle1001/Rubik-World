# Railway / Fly.io / máy chủ bất kỳ có Docker. Dữ liệu (SQLite) ở /data → gắn volume vào /data.
# Hoặc đặt DATABASE_URL (Postgres) thì không cần volume.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY client ./client
COPY server ./server
RUN mkdir -p /data && chown -R node:node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/index.js"]
