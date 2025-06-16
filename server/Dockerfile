FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG MODE=production
ENV NODE_ENV $MODE

EXPOSE 3000

CMD [ "sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm run start; else npm run start; fi" ]
