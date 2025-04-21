FROM mcr.microsoft.com/playwright:v1.52.0-noble

# 2. Directorio de trabajo
WORKDIR /app

# 3. Instalar dependencias del proyecto
COPY package*.json ./
RUN npm ci

# 4. Copiar el resto del código
COPY . .

# 5. Exponer el puerto si necesitas API HTTP (opcional)
# EXPOSE 3000

# 6. Ejecutar tu scraper / servidor
CMD ["node", "dist/mapped_cars.js"]
