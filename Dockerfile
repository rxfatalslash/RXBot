FROM node:current
WORKDIR /app

# Instalación de dependencias
COPY bot/package*.json ./
RUN npm install --only=production
COPY bot/ .

# Puerto de expuesto
EXPOSE 3000

# Inicio de la aplicación
CMD ["node", "index.js"]