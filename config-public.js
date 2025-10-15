// 🔧 Публичная конфигурация для GitHub Pages
// Этот файл содержит только публичные настройки, безопасные для Git

const CONFIG = {
    // Telegram настройки (заполните ваши данные)
    TELEGRAM: {
        BOT_TOKEN: '8383590226:AAFbzxk3JojSf396GxV_dMrOW2XO80PNmEU',
        CHAT_ID: '-4882443464',
        API_URL: 'https://api.telegram.org/bot'
    },
    
    // Настройки приложения
    APP: {
        NAME: 'POLLEN Shop',
        VERSION: '1.0.0',
        DEBUG: true
    },
    
    // ЮKassa proxy настройки
    YOOKASSA: {
        PROXY_URL: 'https://bytempire.ru/opt/',
        PAYMENT_ENDPOINT: 'https://bytempire.ru/opt/index.php'
    },
    
    // Резервные способы доставки
    DELIVERY: {
        WEBHOOK_URL: '',
        FALLBACK_EMAIL: ''
    }
};

// Экспорт конфигурации
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
