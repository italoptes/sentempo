# Etapa 1: build
FROM node:22-alpine AS construtor

WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline
COPY . .
RUN npm run build

# Etapa 2: servidor estático via Nginx
FROM nginx:alpine AS producao

# Remove configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia arquivos do build
COPY --from=construtor /app/dist /usr/share/nginx/html

# Copia configuração customizada (fallback SPA)
COPY nginx.conf /etc/nginx/conf.d/sentempo.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
