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

  // Демо-режим (?demo=1): рисуем магазин «как будто кошелёк уже подключён»,
  // без реального TON Connect. Зачем: чтобы зритель/клиент по ссылке сразу видел
  // товары, а не пустой экран «подключи кошелёк». Покупка в демо ничего не шлёт.
  // ?demo=paid — сразу показать финальный экран «оплачено» (для скринов/витрины).
  const demoParam = new URLSearchParams(window.location.search).get('demo')
  const isDemo = demoParam !== null
  const isConnected = Boolean(walletAddress) || isDemo

  const [tonConnectUI] = useTonConnectUI()
  const [status, setStatus] = useState(
    demoParam === 'paid'
      ? '✅ Оплачено: «E-book: TON for beginners». Товар придёт в этот бот — проверь чат с ним. 📩'
      : '',
  )
  // id товара, который сейчас оплачивается (или null) — чтобы блокировать кнопки
  const [pendingId, setPendingId] = useState<string | null>(null)

  const connectedNetwork =
    wallet?.account.chain === CHAIN.TESTNET
      ? 'testnet ✅'
      : wallet?.account.chain === CHAIN.MAINNET
        ? 'MAINNET ⚠️'
        : '—'

  async function buy(product: Product) {
    setStatus(`⏳ Оплата «${product.name}»…`)
    setPendingId(product.id) // блокируем кнопки на время оплаты

    // В демо-режиме реальной транзакции нет — имитируем успешную оплату,
    // чтобы показать финальное состояние «оплачено → товар выдаст бот».
    if (isDemo) {
      setTimeout(() => {
        setStatus(`✅ Оплачено: «${product.name}». Товар придёт в этот бот — проверь чат с ним. 📩`)
        setPendingId(null)
      }, 900)
      return
    }

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
      // Платёж ушёл. Без Telegram (userId=0) бот не сможет написать первым.
      if (!userId) {
        setStatus(`✅ Оплачено: «${product.name}». ⚠️ Открой магазин через Telegram, чтобы бот выдал товар.`)
        return
      }

      // Просим бэкенд проверить оплату on-chain и выдать товар. Платёж попадает
      // в сеть за несколько секунд, поэтому опрашиваем /api/verify с повтором.
      setStatus(`✅ Оплачено: «${product.name}». Проверяю платёж и выдаю товар…`)
      const delivered = await pollVerify(product.id, userId)
      setStatus(
        delivered
          ? `🎁 Готово! «${product.name}» отправлен в чат с ботом. 📩`
          : `✅ Оплачено: «${product.name}». Бот выдаст товар, как только платёж попадёт в сеть — проверь чат. 📩`,
      )
    } catch (e) {
      const err = e as Error
      setStatus(`❌ Не прошло: ${err.message || err.name || 'неизвестная ошибка'}`)
    } finally {
      setPendingId(null) // разблокируем кнопки в любом случае
    }
  }

  return (
    <main className="screen">
      <h1 className="title">TON Mini-Shop</h1>
      <p className="subtitle">Цифровые товары · оплата в TON</p>

      <div className={`badge ${isDemo || insideTelegram ? 'badge--ok' : 'badge--warn'}`}>
        {isDemo ? '🎬 Демо' : insideTelegram ? '✅ Внутри Telegram' : '🌐 Браузер'}
      </div>

      {!isDemo && <TonConnectButton />}

      {!isConnected ? (
        <p className="hint">Подключи кошелёк, чтобы покупать.</p>
      ) : (
        <>
          <div className="card">
            <Row label="Кошелёк" value={isDemo ? 'Tonkeeper' : wallet?.device.appName} />
            <Row label="Адрес" value={isDemo ? 'EQAb...x7Qd' : shortAddress(walletAddress)} />
            <Row label="Сеть" value={isDemo ? 'mainnet' : connectedNetwork} />
          </div>

          {/* Рисуем карточку под каждый товар из массива PRODUCTS */}
          <div className="shop">
            {PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuy={buy}
                disabled={pendingId !== null} // пока идёт любая оплата — все кнопки заблокированы
                loading={pendingId === product.id} // на этой карточке показываем «…»
              />
            ))}
          </div>

          {status && <p className="status">{status}</p>}
        </>
      )}

      <p className="footnote">Оплата проверяется on-chain — бот выдаёт товар автоматически.</p>
    </main>
  )
}

function ProductCard({
  product,
  onBuy,
  disabled,
  loading,
}: {
  product: Product
  onBuy: (p: Product) => void
  disabled: boolean
  loading: boolean
}) {
  return (
    <div className="product">
      <div className="product__emoji">{product.emoji}</div>
      <div className="product__info">
        <div className="product__name">{product.name}</div>
        <div className="product__desc">{product.description}</div>
      </div>
      <button
        className="product__buy"
        onClick={() => onBuy(product)}
        disabled={disabled}
      >
        {loading ? '…' : `${product.price} TON`}
      </button>
    </div>
  )
}

// 1 TON = 1_000_000_000 нанотон. Кошелёк принимает сумму ТОЛЬКО в нанотонах, строкой.
function tonToNano(ton: number): string {
  return BigInt(Math.round(ton * 1e9)).toString()
}

// Опрашивает serverless-функцию /api/verify, пока она не подтвердит выдачу товара.
// Платёж появляется в блокчейне за несколько секунд → даём до ~8 попыток по 3.5с.
async function pollVerify(productId: string, userId: number): Promise<boolean> {
  for (let i = 0; i < 8; i++) {
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId, userId }),
      })
      const data = await res.json()
      if (data.delivered) return true
    } catch {
      // сеть моргнула — просто пробуем на следующей итерации
    }
    await new Promise((r) => setTimeout(r, 3500))
  }
  return false
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
