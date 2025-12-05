# Imagem base com Node
FROM node:20-alpine3.21

# Atualiza pacotes do sistema
RUN apk upgrade --no-cache

# Opcional: algumas libs úteis em ambiente de dev
RUN apk add --no-cache bash

# Diretório de trabalho dentro do container
WORKDIR /usr/src/app

# instalar túnel necessário
RUN npm install -g @expo/ngrok@^4.1.0

# Copia apenas arquivos de dependência primeiro (melhora cache)
COPY package*.json ./

# Instala dependências (dev + prod, já que é ambiente de desenvolvimento)
RUN npm install

# Copia o restante do código do app
COPY . .

# Variáveis de ambiente para o Expo em container
ENV NODE_ENV=development \
    EXPO_NO_INTERACTIVE=0 \
    EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Portas usadas pelo Expo / Metro / DevTools
EXPOSE 8081 8082 19000 19001 19002

# Comando padrão: iniciar o Expo
# O "-- --host 0.0.0.0" é passado como argumento pro "expo start"
CMD ["npm", "start", "--", "--host", "lan"]
