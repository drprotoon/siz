# Estágio de build
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.js ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Copiar código fonte
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY api/ ./api/
COPY scripts/ ./scripts/
COPY public/ ./public/

# Instalar dependências
RUN npm ci

# Compilar o projeto
RUN npm run build:prod

# Estágio de produção
FROM node:18-alpine AS production

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos compilados do estágio de build
COPY --from=builder /app/dist ./dist

# Instalar apenas dependências de produção
WORKDIR /app/dist
RUN npm ci --omit=dev

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=5000

# Expor porta
EXPOSE 5000

# Iniciar o servidor
CMD ["npm", "start"]
