import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import './index.css'
import App from './App.tsx'

// Инициализация Telegram WebApp: сообщаем Telegram, что аппа готова,
// и разворачиваем на весь экран.
const tg = window.Telegram?.WebApp
tg?.ready()
tg?.expand()

// TON Connect требует абсолютный https-URL манифеста.
// origin подставится автоматически после деплоя на Vercel.
const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </StrictMode>,
)
