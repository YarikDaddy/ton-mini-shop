// Минимальные типы для Telegram WebApp (то, что используем на Дне 1).
// Полный объект описан в доках Telegram; расширим по мере надобности.
export {};

interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  platform: string;
  version: string;
  colorScheme: 'light' | 'dark';
  initData: string;
  initDataUnsafe: {
    user?: TelegramWebAppUser;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
