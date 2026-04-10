FROM node:20-alpine AS builder
WORKDIR /app
COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/
COPY package.json ./
RUN cd client && npm install
RUN cd server && npm install --production
COPY client/ ./client/
RUN cd client && npx vite build

FROM node:20-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm install --production
COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist
COPY package.json ./
EXPOSE 3001 3002
ENV NODE_ENV=production
CMD ["node", "server/index.js"]
