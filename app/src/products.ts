// Товары магазина — это просто данные, отдельно от интерфейса.
// Чтобы добавить/убрать товар, правим только этот массив, верстку не трогаем.

export type Product = {
  id: string // уникальный код товара (понадобится боту на Этапе 5)
  emoji: string
  name: string
  description: string
  price: number // цена в TON
}

export const PRODUCTS: Product[] = [
  {
    id: 'ebook',
    emoji: '📘',
    name: 'E-book: TON for beginners',
    description: 'PDF-гайд по экосистеме TON',
    price: 0.01,
  },
  {
    id: 'stickers',
    emoji: '🎨',
    name: 'Premium sticker pack',
    description: 'Набор авторских стикеров',
    price: 0.02,
  },
  {
    id: 'vip',
    emoji: '🔑',
    name: 'VIP channel access',
    description: 'Доступ в закрытый канал на месяц',
    price: 0.05,
  },
]
