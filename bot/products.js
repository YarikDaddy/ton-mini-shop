// Каталог на стороне бота: id и цена должны совпадать с фронтом (app/src/products.ts).
// Поле delivery — то, что бот реально присылает покупателю после оплаты.
export const PRODUCTS = [
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
