FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
# zona horaria opcional
ENV TZ=America/Argentina/Buenos_Aires
CMD ["npm","start"]
