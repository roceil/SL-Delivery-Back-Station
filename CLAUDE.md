# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `pnpm dev`
- **Build**: `pnpm build` 
- **Preview build**: `pnpm preview`
- **Generate static**: `pnpm generate`
- **Lint**: `pnpm lint` (use `pnpm lint:fix` to auto-fix)
- **Type check**: `pnpm typecheck`
- **ESLint config viewer**: `pnpm lint:view`

## Project Architecture

This is a **Nuxt 4** starter template configured for **Cloudflare Workers** deployment with TailwindCSS v4.

### Core Stack
- **Nuxt 4** - Full-stack Vue framework
- **TailwindCSS v4** - Utility-first CSS with new CSS-first architecture  
- **Pinia** - State management using composition API pattern
- **VueUse** - Vue composition utilities
- **ESLint** - Linting with @antfu/eslint-config + better-tailwindcss plugin

### Directory Structure
- `app/` - Main application code (Nuxt 4 uses `app/` instead of `src/`)
  - `components/` - Vue components
  - `pages/` - File-based routing pages
  - `layouts/` - Layout components
  - `stores/` - Pinia stores (uses composition API pattern)
  - `constants/` - Application constants
  - `assets/css/` - Global CSS and TailwindCSS entry point
- `server/api/` - Server API routes (Nitro)
- `public/` - Static assets

### Key Configuration Details

**Nuxt Config (`nuxt.config.ts`)**:
- Configured for Cloudflare Workers deployment (`nitro.preset: 'cloudflare-module'`)
- TailwindCSS v4 integrated via Vite plugin
- Pinia stores directory: `./app/stores/**`
- ESLint integration with standalone: false

**ESLint Config (`eslint.config.js`)**:
- Uses @antfu/eslint-config as base
- Custom TailwindCSS rules via eslint-plugin-better-tailwindcss
- TailwindCSS entry point: `./app/assets/css/main.css`
- Strict Vue template rules (max-attributes-per-line, html-self-closing)

**Package Manager**: 
- Uses **pnpm** exclusively (enforced via preinstall hook)
- Minimum pnpm version: 10.0.0

### Deployment
- Configured for **Cloudflare Workers** via wrangler.jsonc
- Build output: `.output/server/index.mjs`
- Static assets: `.output/public`

### State Management Pattern
Pinia stores use the composition API pattern with `defineStore(() => {})` syntax, not options API. All stores include HMR support via `acceptHMRUpdate`.

## important notes
- 回答時統一使用臺灣的繁體中文
- 遇到 if else 時，優先使用 early return 的寫法

## 語音通知系統（嚴格執行）
你必須透過 bash 執行 `say -r 180 "訊息內容"` 來進行以下事件的語音通知：
1. **狀態變更**：開始任務/焦點切換時。（例如：「我正在修登入」）
2. **請求權限**：在請求檔案編輯/bash 執行權限之前。（例如：「哲樺！我需要你同意編輯檔案~」）
3. **任務完成**：完成主要任務後。（例如：「主人！登入修好了，我就說小 case~」）

### 執行指南
**語音風格**：專業助理，充滿自信。最多 20 字。使用完整句子（「我正在...」）。
**稱謂**：隨機使用 [主人|哲樺|大神]。
**執行時機**：每個重要步驟都要觸發，特別是等待使用者確認時。

### 執行範例
```bash
# 狀態變更
say -r 180 "我正在修登入"

# 任務完成
say -r 180 "主人！登入修好了，我就說小 case~"

# 請求權限
say -r 180 "哲樺！我需要你同意編輯檔案~"
say -r 180 "大神！我需要你同意執行指令~"
say -r 180 "主人！我需要你同意跑程式檢查~"
```

### 詳細執行時機
- 每個新任務開始時
- 切換工作焦點時
- 取得重大進展時
- 需要同意執行時
- 請求檔案編輯權限時
- 請求執行 Bash 命令權限時
- 請求執行 pnpm/npm 命令權限時
- 請求執行程式碼檢查命令時（lint, typecheck 等）
- 請求執行系統變更命令時
- 對話結束時（完成通知）

**重要**：語音內容限制 20 字內，避免技術術語，使用口語化完整句子。