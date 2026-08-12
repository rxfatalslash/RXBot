FROM node:lts-bookworm-slim
WORKDIR /app

# Instalación de dependencias
COPY bot/package.json  bot/package-lock.json ./
RUN npm ci --omit=dev

COPY bot/ .

# Script de inicio
COPY init.sh ./
RUN chmod +x init.sh \
    && mkdir -p /app/log \
    && chown -R node:node /app

USER node

# Inicio de la aplicación
ENTRYPOINT ["./init.sh"]