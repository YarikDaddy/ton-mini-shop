# TON Mini-Shop 🛒

A **Telegram Mini App store on The Open Network (TON)**: a customer connects their wallet, buys a digital product, pays in TON — and a bot **verifies the payment on-chain** and **auto-delivers** the product in chat.

Built as a real, end-to-end demonstration of accepting crypto payments inside Telegram.

> ⚙️ Stack: React + TypeScript + Vite · TON Connect · @ton/core · grammY (Node) · tonapi.io

---

## ✨ What it does

- **Opens inside Telegram** as a Mini App (no install, 950M+ potential users)
- **Connects a TON wallet** via TON Connect (Tonkeeper & others)
- **Accepts payments** — each product has its own price; the user confirms in their wallet
- **Tags each order on-chain** with a comment (`product + buyer`) so payments are identifiable
- **Verifies payment on-chain** — the bot trusts the blockchain, not the frontend
- **Auto-delivers** the product to the buyer in their Telegram chat

## 🧩 How it works

```
Customer (Telegram Mini App)
        │  1. Connect wallet (TON Connect)
        │  2. Tap "Buy" → sign payment in wallet
        ▼
   TON blockchain  ──  payment carries an order tag:  o:<productId>:<telegramUserId>
        ▲
        │  3. Bot polls incoming transactions (tonapi.io, every 10s)
        │  4. Reads the comment, checks the amount
        │  5. Delivers the product to the buyer
   Bot backend (grammY, Node)
```

Two safeguards in the bot:
- **No double delivery** — processed transaction hashes are remembered.
- **No delivery for old payments** — only transactions received after startup are honored.

## 🗂 Project structure

```
ton-mini-shop/
├── app/        # Telegram Mini App frontend (React + Vite + TS)
│   └── src/
│       ├── App.tsx        # UI, wallet connect, payment with order tag
│       └── products.ts    # catalog (data-driven)
└── bot/        # Bot backend (grammY)
    ├── index.js           # /start + on-chain payment poller & delivery
    └── products.js        # catalog (id, price, delivered content)
```

## 🚀 Run locally

**Frontend**
```bash
cd app
npm install
npm run dev        # local dev
npm run build      # production build
```
Deploy the `app/` folder to any static host (e.g. Vercel) and set the URL as your bot's Menu Button in @BotFather.

**Bot**
```bash
cd bot
npm install
cp .env.example .env      # then fill BOT_TOKEN and MERCHANT_ADDRESS
npm start
```

## 🔐 Notes

- The bot token lives only in `bot/.env` (git-ignored) — never in the frontend.
- TON Connect never exposes the user's private keys; payments are signed inside the wallet.
- Tested live on mainnet with micro-amounts.

## 👤 Author

Built by **[@YarikDaddy](https://github.com/YarikDaddy)** — building in public on [X / @DaddyYarik](https://x.com/DaddyYarik).

Open to small paid tasks: Telegram Mini Apps & TON integrations, paid in TON/USDT.
