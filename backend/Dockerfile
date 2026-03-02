FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y iputils-ping && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .

# 플래그 생성
RUN echo "hackahoy{Byp455_7h3_CuR53d_F1l73r_w17h_Sk1ll}" > /flag.txt

USER node
EXPOSE 5000
CMD ["node", "server.js"]