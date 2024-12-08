FROM node:current
WORKDIR /app

# Instalación de dependencias
COPY bot/package*.json ./
RUN npm install --only=production
COPY bot/ .

# Script de inicio
COPY init.sh .
RUN chmod +x init.sh

# Puerto de expuesto
EXPOSE 3000

# Inicio de la aplicación
ENTRYPOINT ["./init.sh"]