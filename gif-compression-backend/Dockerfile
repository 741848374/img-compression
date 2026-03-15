# ---- 构建阶段 ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- 运行阶段 ----
FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./
# 只安装生产依赖
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

# 创建上传目录
RUN mkdir -p uploads

EXPOSE 3005

CMD ["node", "dist/main"]
