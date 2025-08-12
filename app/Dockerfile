FROM node:22

WORKDIR /app

COPY package*.json ./
# RUN npm install
RUN npm install --legacy-peer-deps

COPY . .

ARG MODE=production
ENV NODE_ENV=$MODE

RUN if [ "$NODE_ENV" = "production" ]; then \
      npm run build --configuration production && \
      npm install -g http-server; \
    fi

EXPOSE 4200
EXPOSE 3000

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then http-server dist/es_frontend -p 3000; else ng serve --host 0.0.0.0 --port 4200; fi"]
