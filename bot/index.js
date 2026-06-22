// Бот TON Mini-Shop: отвечает на /start И следит за оплатами в блокчейне,
// выдавая товар покупателю после подтверждённой оплаты.
import 'dotenv/config'
import { Bot } from 'grammy'
import { PRODUCTS } from './products.js'

const token = process.env.BOT_TOKEN
const MERCHANT = process.env.MERCHANT_ADDRESS

if (!token) {
  console.error('❌ Нет BOT_TOKEN в bot/.env')
  process.exit(1)
}
if (!MERCHANT) {
  console.error('❌ Нет MERCHANT_ADDRESS в bot/.env (адрес кошелька-продавца)')
  process.exit(1)
}

const bot = new Bot(token)

bot.command('start', (ctx) =>
  ctx.reply('Привет! 🛒 Это бот TON Mini-Shop. Открой магазин кнопкой меню внизу.')
)

// --- Слежение за оплатами ---
const seen = new Set() // хэши уже обработанных транз (защита от двойной выдачи)
const startedAt = Math.floor(Date.now() / 1000) // не выдаём товар за старые платежи

async function pollPayments() {
  try {
    const url = `https://tonapi.io/v2/blockchain/accounts/${MERCHANT}/transactions?limit=20`
    const res = await fetch(url)
    if (!res.ok) {
      console.error('tonapi ответил', res.status)
      return
    }
    const data = await res.json()

    for (const tx of data.transactions ?? []) {
      const inMsg = tx.in_msg
      // нас интересуют только входящие платежи с текстовым комментарием
      if (!inMsg || inMsg.decoded_op_name !== 'text_comment') continue

      const text = inMsg.decoded_body?.text
      if (!text || !text.startsWith('o:')) continue

      if (tx.utime < startedAt) continue // только новые оплаты
      if (seen.has(tx.hash)) continue // уже обработали
      seen.add(tx.hash)

      const [, productId, userId] = text.split(':')
      const product = PRODUCTS.find((p) => p.id === productId)
      if (!product) {
        console.log('⚠️ Неизвестный товар в метке:', text)
        continue
      }

      // Проверяем сумму: пришло должно быть не меньше цены товара (в нанотонах)
      const paid = Number(inMsg.value)
      const expected = Math.round(product.price * 1e9)
      if (paid < expected) {
        console.log(`⚠️ Недоплата за ${productId}: ${paid} < ${expected} нанотон`)
        continue
      }

      // Всё сошлось → выдаём товар покупателю в личку
      try {
        await bot.api.sendMessage(
          userId,
          `✅ Оплата получена! Спасибо за покупку «${product.name}».\n\n${product.delivery}`
        )
        console.log(`📦 Выдан «${product.name}» юзеру ${userId}`)
      } catch (e) {
        console.error(`Не смог отправить юзеру ${userId}:`, e.message)
      }
    }
  } catch (e) {
    console.error('Ошибка опроса:', e.message)
  }
}

setInterval(pollPayments, 10000)
console.log('👀 Слежу за оплатами на адрес:', MERCHANT)

bot.start({
  onStart: () => console.log('🤖 Бот запущен и слушает сообщения'),
})
