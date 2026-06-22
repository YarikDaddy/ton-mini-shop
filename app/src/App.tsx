import { useState } from 'react'
import {
  TonConnectButton,
  useTonAddress,
  useTonWallet,
  useTonConnectUI,
  CHAIN,
} from '@tonconnect/ui-react'
import { beginCell } from '@ton/core'
import { PRODUCTS, type Product } from './products'
import './App.css'

function App() {
  const tg = window.Telegram?.WebApp
  const insideTelegram = Boolean(tg?.initData)

  const walletAddress = useTonAddress()
  const wallet = useTonWallet()
  const isConnected = Boolean(walletAddress)

  const [tonConnectUI] = useTonConnectUI()
  // status хранит код товара, который сейчас оплачивается, и текст состояния
  const [status, setStatus] = useState('')

  const connectedNetwork =
    wallet?.account.chain === CHAIN.TESTNET
      ? 'testnet ✅'
      : wallet?.account.chain === CHAIN.MAINNET
        ? 'MAINNET ⚠️'
        : '—'

  async function buy(product: Product) {
    setStatus(`⏳ Оплата «${product.name}»…`)
    try {
      // Метка заказа: что купили + кому выдать (Telegram ID покупателя).
      // По ней бот на 5c поймёт заказ, читая комментарий из блокчейна.
      const userId = tg?.initDataUnsafe.user?.id ?? 0
      const comment = `o:${product.id}:${userId}`

      // Собираем тело-комментарий: 32 нулевых бита (код "просто текст") + сам текст.
      // toBoc() даёт бинарь, кошелёк ждёт его как base64 в поле payload.
      const payload = beginCell()
        .storeUint(0, 32)
        .storeStringTail(comment)
        .endCell()
        .toBoc()
        .toString('base64')

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            // В реальном магазине здесь адрес ПРОДАВЦА (константа).
            // Для теста шлём на свой же адрес — деньги возвращаются тебе.
            address: walletAddress,
            amount: tonToNano(product.price), // сумма именно этого товара, в нанотонах
            payload, // прицепляем метку заказа к платежу
          },
        ],
      })
      setStatus(`✅ Оплачено: «${product.name}». Метка: ${comment}`)
    } catch (e) {
      const err = e as Error
      setStatus(`❌ Не прошло: ${err.message || err.name || 'неизвестная ошибка'}`)
    }
  }

  return (
    <main className="screen">
      <h1 className="title">TON Mini-Shop</h1>
      <p className="subtitle">Этап 4 — магазин</p>

      <div className={`badge ${insideTelegram ? 'badge--ok' : 'badge--warn'}`}>
        {insideTelegram ? '✅ Внутри Telegram' : '🌐 Браузер'}
      </div>

      <TonConnectButton />

      {!isConnected ? (
        <p className="hint">Подключи кошелёк, чтобы покупать.</p>
      ) : (
        <>
          <div className="card">
            <Row label="Кошелёк" value={wallet?.device.appName} />
            <Row label="Адрес" value={shortAddress(walletAddress)} />
            <Row label="Сеть" value={connectedNetwork} />
          </div>

          {/* Рисуем карточку под каждый товар из массива PRODUCTS */}
          <div className="shop">
            {PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} onBuy={buy} />
            ))}
          </div>

          {status && <p className="status">{status}</p>}
        </>
      )}

      <p className="footnote">Дальше (Этап 5): бот проверяет оплату on-chain и выдаёт товар.</p>
    </main>
  )
}

function ProductCard({
  product,
  onBuy,
}: {
  product: Product
  onBuy: (p: Product) => void
}) {
  return (
    <div className="product">
      <div className="product__emoji">{product.emoji}</div>
      <div className="product__info">
        <div className="product__name">{product.name}</div>
        <div className="product__desc">{product.description}</div>
      </div>
      <button className="product__buy" onClick={() => onBuy(product)}>
        {product.price} TON
      </button>
    </div>
  )
}

// 1 TON = 1_000_000_000 нанотон. Кошелёк принимает сумму ТОЛЬКО в нанотонах, строкой.
function tonToNano(ton: number): string {
  return BigInt(Math.round(ton * 1e9)).toString()
}

// Укорачиваем адрес для вывода: EQAb...x7Qd
function shortAddress(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="row">
      <span className="row__label">{label}</span>
      <span className="row__value">{value ?? '—'}</span>
    </div>
  )
}

export default App
