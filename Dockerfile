FROM mcr.microsoft.com/playwright:v1.51.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx playwright install

CMD ["npm", "start"]
