# ========================================
# Stage 1: 依賴安裝階段
# ========================================
FROM node:22-alpine AS deps

# 安裝 pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

# 複製套件管理檔案
COPY package.json pnpm-lock.yaml ./

# 安裝依賴（包含 dev dependencies 用於建置）
RUN pnpm install --frozen-lockfile

# ========================================
# Stage 2: 建置階段
# ========================================
FROM node:22-alpine AS builder

# 安裝 pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

# 從依賴階段複製 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 複製所有專案檔案
COPY . .

# 建置 Nuxt 應用程式
RUN pnpm build

# ========================================
# Stage 3: 生產執行階段
# ========================================
FROM node:22-alpine AS runner

# 安裝 pnpm（生產環境只需要執行）
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

# 建立 node 使用者以提高安全性
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxt

# 從建置階段複製必要檔案
COPY --from=builder --chown=nuxt:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxt:nodejs /app/package.json ./package.json

# 切換到非 root 使用者
USER nuxt

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# 暴露 Cloud Run 預設端口
EXPOSE 8080

# 啟動 Nuxt 應用程式
CMD ["node", ".output/server/index.mjs"]
