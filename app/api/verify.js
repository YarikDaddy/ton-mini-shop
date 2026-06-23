// Serverless-функция Vercel: проверяет оплату on-chain и выдаёт товар.
//
// Зачем она вместо вечного бота-поллера: на Vercel нет процесса, который живёт
// постоянно. Поэтому вместо «крутимся в цикле и опрашиваем блокчейн каждые 10с»
// мы проверяем оплату ПО ЗАПРОСУ: фронт после оплаты сам дёргает /api/verify,
// функция один раз читает блокчейн и, если платёж нашёлся, выдаёт товар.
// Плюс: работает для любого клиента, открывшего ссылку, — без запущенного бота.
import { CATALOG } from '../lib/catalog.js'

const TONAPI = 'https://tonapi.io/v2'
const MAX_AGE = 15 * 60 // секунд: не выдаём товар за платежи старше 15 минут

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'only POST' })

  const { productId, userId } = req.body ?? {}
  if (!productId || !userId) {
    return res.status(400).json({ error: 'productId и userId обязательны' })
  }

  const product = CATALOG.find((p) => p.id === productId)
  if (!product) return res.status(404).json({ error: 'unknown product' })

  const MERCHANT = process.env.MERCHANT_ADDRESS
  const TOKEN = process.env.BOT_TOKEN
  if (!MERCHANT || !TOKEN) {
    return res.status(500).json({ error: 'на сервере не заданы MERCHANT_ADDRESS / BOT_TOKEN' })
  }

  // 1. Читаем последние транзакции кошелька-продавца. tonapi работает и без ключа
  //    (лимит ~1 req/s); ключ в TONAPI_KEY повышает лимиты, если понадобится.
  const headers = process.env.TONAPI_KEY
    ? { Authorization: `Bearer ${process.env.TONAPI_KEY}` }
    : {}
  let data
  try {
    const r = await fetch(`${TONAPI}/blockchain/accounts/${MERCHANT}/transactions?limit=30`, {
      headers,
    })
    if (!r.ok) return res.status(502).json({ error: `tonapi ответил ${r.status}` })
    data = await r.json()
  } catch (e) {
    return res.status(502).json({ error: `не достучался до tonapi: ${e.message}` })
  }

  const now = Math.floor(Date.now() / 1000)
  const wanted = `o:${productId}:${userId}` // метка заказа, которую фронт кладёт в платёж
  const expected = Math.round(product.price * 1e9) // цена в нанотонах

  // 2. Ищем входящий платёж: метка совпала, сумма не меньше цены, платёж свежий.
  for (const tx of data.transactions ?? []) {
    const inMsg = tx.in_msg
    if (inMsg?.decoded_op_name !== 'text_comment') continue
    if (inMsg.decoded_body?.text !== wanted) continue
    if (now - tx.utime > MAX_AGE) continue
    if (Number(inMsg.value) < expected) continue

    // 3. Нашли оплату → выдаём товар в личку покупателю через Telegram Bot API.
    const tgRes = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: Number(userId),
        text: `✅ Оплата получена! Спасибо за покупку «${product.name}».\n\n${product.delivery}`,
      }),
    })
    const tg = await tgRes.json()
    if (!tg.ok) {
      // Самый частый кейс: юзер не нажимал /start у бота → бот не может писать первым.
      return res.status(200).json({ paid: true, delivered: false, reason: tg.description })
    }
    return res.status(200).json({ paid: true, delivered: true })
  }

  // 4. Платёж пока не виден (ещё не попал в блокчейн) — фронт повторит запрос.
  // Примечание: защита от двойной выдачи здесь «по времени» (окно 15 мин). Для
  // продакшена с потоком заказов — добавить дедуп по tx.hash в Upstash/Vercel KV.
  return res.status(200).json({ paid: false, delivered: false })
}
