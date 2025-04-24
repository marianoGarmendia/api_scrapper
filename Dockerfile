FROM mcr.microsoft.com/playwright:v1.51.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# ✅ Instalá los navegadores correctamente con Playwright CLI del sistema
RUN npx playwright install --with-deps

# 🟢 Comando para arrancar el servidor
CMD ["npm", "start"]