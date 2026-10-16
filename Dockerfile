# Etapa 1: Build de la app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Actualizamos npm para evitar el bug edgesOut
RUN npm install -g npm@latest
# Instalamos omitiendo conflictos estrictos de dependencias
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Etapa 2: Servidor web Nginx ligero
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]