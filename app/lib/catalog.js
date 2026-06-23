// Каталог на стороне сервера (Vercel-функции). id и price ДОЛЖНЫ совпадать с
// фронтом (app/src/products.ts). Поле delivery — то, что бот реально присылает
// покупателю после подтверждённой оплаты.
// Лежит вне app/api, поэтому Vercel не делает из него HTTP-эндпоинт — это просто
// модуль, который импортируют функции.
export const CATALOG = [
  {
    id: 'ebook',
    name: 'E-book: TON for beginners',
    price: 0.01,
    delivery: '📘 Твой гайд: https://docs.ton.org/  (тут была бы ссылка на PDF)',
  },
  {
    id: 'stickers',
    name: 'Premium sticker pack',
    price: 0.02,
    delivery: '🎨 Стикеры: https://t.me/addstickers/  (тут был бы реальный пак)',
  },
  {
    id: 'vip',
    name: 'VIP channel access',
    price: 0.05,
    delivery: '🔑 Инвайт в закрытый канал: https://t.me/+xxxx  (тут была бы ссылка-приглашение)',
  },
]
