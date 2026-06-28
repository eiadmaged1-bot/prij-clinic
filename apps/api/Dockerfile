# Example API container. Build from repository root:
# docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build:api

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 3001
CMD ["npm", "run", "start:api"]
