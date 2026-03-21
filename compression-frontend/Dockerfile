# ---- 构建阶段 ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- 运行阶段（nginx 静态托管）----
FROM nginx:alpine AS runner

# 复制构建产物
COPY --from=builder /app/build /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
