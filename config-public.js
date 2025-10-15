// 🔧 Публичная конфигурация для GitHub Pages
// Этот файл содержит только публичные настройки, безопасные для Git
// 
// ⚠️ ВАЖНО: Для работы Telegram интеграции создайте локальный config.js
// по образцу config.example.js с вашими секретными данными

const CONFIG = {
    // Telegram настройки (оставьте пустыми для публичного репозитория)
    TELEGRAM: {
        BOT_TOKEN: '', // Заполните в локальном config.js
        CHAT_ID: '', // Заполните в локальном config.js
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
