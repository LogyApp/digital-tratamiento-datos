# Usar imagen oficial de Node.js
FROM node:18-slim

# Instalar dependencias necesarias para Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el código de la aplicación
COPY . .

# Crear directorio para templates si no existe
RUN mkdir -p Funcionalidad/tratamiento_datos_func/templates

# Copiar templates desde Interfaz
COPY Interfaz/tratamiento_datos/templates/* Funcionalidad/tratamiento_datos_func/templates/
COPY Interfaz/tratamiento_datos/assets/* Interfaz/tratamiento_datos/assets/

# Establecer variable de entorno para Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV NODE_ENV=production

# Exponer puerto
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["node", "server.js"]