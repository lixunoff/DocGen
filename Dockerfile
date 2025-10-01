FROM ghcr.io/puppeteer/puppeteer:23.1.0

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]