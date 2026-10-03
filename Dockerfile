FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY index.html styles.css app.js env.mjs database.mjs providers.mjs server.mjs README.md .env.example ./
ENV HOST=0.0.0.0 PORT=4173 NDRIVE_SECRETS_FILE=/app/data/provider-secrets.json
EXPOSE 4173
CMD ["npm", "start"]
