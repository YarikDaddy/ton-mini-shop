// Serverless-функция Vercel: вебхук Telegram. Раньше /start обрабатывал
// вечный бот (grammy long-polling). На Vercel вечного процесса нет, поэтому
// Telegram сам шлёт сюда POST с апдейтом, когда юзеру что-то приходит.
//
// Привязывается один раз командой setWebhook (см. README) на URL /api/telegram.
const APP_URL = 'https://app-pi-ivory-74.vercel.app'

export default async function handler(req, res) {
  // Telegram всегда шлёт POST; на прочее просто отвечаем «ок».
  if (req.method !== 'POST') return res.status(200).send('ok')

  const TOKEN = process.env.BOT_TOKEN
  const msg = req.body?.message
  const text = msg?.text ?? ''

  if (TOKEN && msg && text.startsWith('/start')) {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: msg.chat.id,
        text: 'Привет! 🛒 Это бот TON Mini-Shop. Жми кнопку, чтобы открыть магазин.',
        // Кнопка, открывающая Mini App прямо из чата.
        reply_markup: {
          inline_keyboard: [[{ text: '🛒 Открыть магазин', web_app: { url: APP_URL } }]],
        },
      }),
    })
  }

  // Отвечаем 200 быстро — иначе Telegram будет ретраить апдейт.
  return res.status(200).json({ ok: true })
}
