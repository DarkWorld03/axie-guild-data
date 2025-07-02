# Usamos una imagen ligera de Node.js
FROM node:18-slim

# Instalamos Chromium y dependencias necesarias para Puppeteer
RUN apt-get update && \
    apt-get install -y \
        chromium \
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgbm1 \
        libgcc1 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        lsb-release \
        xdg-utils \
        wget \
        ca-certificates \
        --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos todos los archivos del proyecto al contenedor
COPY . .

# Instalamos dependencias
RUN npm install

# Configuramos variable para que Puppeteer use Chromium instalado
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Ambiente de producción
ENV NODE_ENV=production

# Comando para iniciar la app
CMD ["node", "server.js"]
