# api-2sem-2025-frontend

Frontend mobile do projeto **Rural CAR**, desenvolvido em **React Native** utilizando o **Expo**.  
Este aplicativo se comunica com dois backends separados: o serviço de autenticação (`auth`) e o serviço de integração com MongoDB (`mongo`).

---

## 📁 Estrutura do projeto

A estrutura geral do frontend segue aproximadamente:

```
api-2sem-2025-frontend/
├── app/
│   ├── assets/
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── lib/
│   ├── scripts/
│   ├── services/
│   └── ...
├── .env.example
├── app.config.ts
├── app.json
├── package.json
└── README.md
```

---

## ✅ Pré-requisitos

Antes de rodar o aplicativo, certifique-se de ter instalado:

- Node.js (versão LTS)
- npm
- Expo CLI (via `npx expo`)
- Expo Go (Android/iOS) — opcional, para testar no celular

---

## ⚙️ Configuração das variáveis de ambiente

1. Entre na pasta principal do projeto:

```
cd app
```

2. Crie o arquivo `.env` baseado no arquivo modelo:

```
cp .env.example .env
```

3. Preencha as variáveis necessárias, como URLs dos backends e chaves externas.

---

## 📦 Instalando dependências

```
npm install
```

---

## ▶️ Executando o projeto

```
npm start
```

Este comando executa o Expo e abre o Dev Tools para rodar no dispositivo, emulador ou navegador.

---

## 🔌 Integração com os Backends

O frontend consome:

### `auth` (porta 5000)
- Autenticação
- Sessões
- JWT

### `mongo` (porta 3001)
- Operações relacionadas ao CAR
- Dados no MongoDB Atlas

As URLs devem ser configuradas no `.env`.

---

## 🛠 Scripts úteis

| Comando | Descrição |
|--------|----------|
| `npm install` | Instala dependências |
| `npm start` | Inicia o Expo |
| `npm run android` | Abre no emulador Android |
| `npm run ios` | Abre no simulador iOS |
| `npm run web` | Executa versão web experimental |

---

## 📱 Testando no dispositivo físico

1. Instale o **Expo Go**.  
2. Execute `npm start`.  
3. Escaneie o QR Code.

---

## ❗ Possíveis problemas

- Variáveis não carregam → Verifique o `.env`.
- Não conecta ao backend → Use o IP da máquina, não `localhost`.
- Expo travando → Delete `node_modules` e rode `npm install`.
