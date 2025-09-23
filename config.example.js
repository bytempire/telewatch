// 🔧 Шаблон конфигурации для Telegram бота
// 
// ИНСТРУКЦИЯ:
// 1. Скопируйте этот файл в config.js
// 2. Заполните реальными данными
// 3. НЕ добавляйте config.js в Git!

const CONFIG = {
    // Telegram настройки
    TELEGRAM: {
        BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE',           // Токен вашего бота от @BotFather
        CHAT_ID: 'YOUR_CHAT_ID_HERE',              // ID чата для получения заказов
        API_URL: 'https://api.telegram.org/bot'    // Базовый URL Telegram Bot API
    },
    
    // Настройки приложения
    APP: {
        NAME: 'POLLEN Shop',
        VERSION: '1.0.0',
        DEBUG: false                                // Включить отладочные сообщения
    },
    
    // Резервные способы доставки
    DELIVERY: {
        WEBHOOK_URL: '',                           // URL вашего webhook сервера (опционально)
        FALLBACK_EMAIL: ''                         // Email для резервной отправки (опционально)
    }
};

// Экспорт конфигурации
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}