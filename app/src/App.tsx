import { useState } from 'react'
import {
  TonConnectButton,
  useTonAddress,
  useTonWallet,
  useTonConnectUI,
  CHAIN,
} from '@tonconnect/ui-react'
import './App.css'

function App() {
  const tg = window.Telegram?.WebApp
  const insideTelegram = Boolean(tg?.initData)

  const walletAddress = useTonAddress()
  const wallet = useTonWallet()
  const isConnected = Boolean(walletAddress)

  // useTonConnectUI() даёт объект, через который аппа просит кошелёк подписать транзу.
  const [tonConnectUI] = useTonConnectUI()
  const [status, setStatus] = useState('')

  // TON Connect сам отдаёт сырой адрес и сеть кошелька — без сторонних библиотек.
  // Сырой адрес (0:hex) удобно сверять с эксплорером (там 0:d6b...e6e74).
  const rawAddress = wallet?.account.address ?? ''
  // chain: '-239' = mainnet, '-3' = testnet. Прямой тест нашей теории про сеть.
  const connectedNetwork =
    wallet?.account.chain === CHAIN.TESTNET
      ? 'testnet ✅'
      : wallet?.account.chain === CHAIN.MAINNET
        ? 'MAINNET ⚠️'
        : '—'

  async function handlePay() {
    setStatus('⏳ Открываю кошелёк…')
    try {
      await tonConnectUI.sendTransaction({
        // действует 5 минут — потом запрос протухнет
        validUntil: Math.floor(Date.now() / 1000) + 300,
        // сеть не хардкодим — используется та, на которой подключён кошелёк
        messages: [
          {
            address: walletAddress, // получатель — твой же адрес (тестируем безопасно)
            amount: tonToNano(0.01), // 0.01 TON в НАНОтонах (строкой)
          },
        ],
      })
      // Сюда попадаем, когда юзер ПОДПИСАЛ. Сеть ещё может подтверждать.
      setStatus('✅ Отправлено в сеть. Подтверждение on-chain проверим на Этапе 5.')
    } catch (e) {
      // sendTransaction бросает ошибку, если юзер отменил или что-то пошло не так.
      // Показываем реальную причину — так проще отлаживать и понятнее юзеру.
      const err = e as Error
      setStatus(`❌ Не прошло: ${err.message || err.name || 'неизвестная ошибка'}`)
    }
  }

  return (
    <main className="screen">
      <h1 className="title">TON Mini-Shop</h1>
      <p className="subtitle">Этап 3 — отправка платежа</p>

      <div className={`badge ${insideTelegram ? 'badge--ok' : 'badge--warn'}`}>
        {insideTelegram ? '✅ Внутри Telegram' : '🌐 Браузер'}
      </div>

      <TonConnectButton />

      {isConnected ? (
        <>
          <div className="card">
            <Row label="Кошелёк" value={wallet?.device.appName} />
            <Row label="Адрес" value={shortAddress(walletAddress)} />
            <Row label="Raw-адрес" value={rawAddress} />
            <Row label="Сеть" value={connectedNetwork} />
          </div>

          <button className="pay-btn" onClick={handlePay}>
            Оплатить 0.01 TON (тест на себя)
          </button>

          {status && <p className="status">{status}</p>}
        </>
      ) : (
        <p className="hint">Подключи Tonkeeper (testnet), чтобы протестировать платёж.</p>
      )}

      <p className="footnote">Дальше (Этап 4): магазин с товарами и оплатой за TON.</p>
    </main>
  )
}

// 1 TON = 1_000_000_000 нанотон. Кошелёк принимает сумму ТОЛЬКО в нанотонах, строкой.
function tonToNano(ton: number): string {
  return BigInt(Math.round(ton * 1e9)).toString()
}

// Укорачиваем адрес для красивого вывода: EQAb...x7Qd
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
