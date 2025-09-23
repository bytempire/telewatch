# 🚀 Развертывание проекта POLLEN Shop

## 📋 Чеклист для деплоя

### ✅ Перед публикацией в GitHub

1. **Проверить .gitignore**
   - [ ] `config.js` исключен из репозитория
   - [ ] Нет файлов с токенами и ключами

2. **Убедиться в безопасности**
   - [ ] Все чувствительные данные в `config.js`
   - [ ] `config.example.js` не содержит реальных данных
   - [ ] История Git не содержит токенов

### 📦 Файлы проекта

```
telewatch/
├── 📄 index.html              # Главная страница
├── 📄 catalog.html            # Страница каталога
├── 📄 custom-order.html       # Страница индивидуальных заказов
├── 📄 script.js               # Основная логика приложения
├── 📄 styles.css              # Стили
├── 📄 products.json           # База данных товаров
├── 📁 images/                 # Изображения товаров
├── 🔧 config.example.js       # Шаблон конфигурации
├── 🚫 .gitignore              # Исключения для Git
└── 📚 docs/                   # Документация
    ├── TELEGRAM_BOT_SETUP.md
    ├── SECURITY.md
    └── README_CONFIG.md
```

### 🏗️ Для разработчиков

**1. Клонирование:**
```bash
git clone [your-repo-url]
cd telewatch
```

**2. Настройка:**
```bash
cp config.example.js config.js
# Отредактировать config.js с реальными данными
```

**3. Запуск:**
```bash
python3 -m http.server 8000
# Или
./start-server.sh
```

### 🌐 Production деплой

**GitHub Pages:**
1. Настроить GitHub Pages в настройках репозитория
2. Создать `config.js` на сервере или через GitHub Secrets
3. URL будет: `https://username.github.io/telewatch`

**Telegram Web App:**
1. Создать бота через @BotFather
2. Настроить Web App URL: `https://username.github.io/telewatch`
3. Команда: `/setmenubutton` → выбрать бота → указать URL

**Netlify/Vercel:**
1. Подключить GitHub репозиторий
2. Настроить переменные окружения:
   - `TELEGRAM_CHAT_ID`
   - `TELEGRAM_BOT_TOKEN`
3. Автоматический деплой при пуше

### 🔒 Безопасность production

**Обязательно:**
- [ ] Использовать HTTPS
- [ ] Настроить CSP заголовки
- [ ] Ограничить CORS политику
- [ ] Настроить rate limiting
- [ ] Мониторинг логов

**Рекомендуется:**
- Webhook через собственный сервер
- Шифрование данных заказов
- Backup базы данных товаров

### 🐛 Отладка

**Проверка конфигурации:**
```javascript
// В консоли браузера
console.log('Config loaded:', typeof CONFIG !== 'undefined');
console.log('Telegram config:', TELEGRAM_CONFIG);
```

**Тест отправки:**
1. Добавить товар в корзину
2. Нажать "Оформить заказ"
3. Проверить консоль браузера
4. Проверить Telegram чат

### 📞 Поддержка

При проблемах проверить:
1. **README_CONFIG.md** - быстрая настройка
2. **SECURITY.md** - вопросы безопасности
3. **TELEGRAM_BOT_SETUP.md** - настройка бота
4. Консоль браузера - ошибки JavaScript
5. Network tab - HTTP запросы

---

🎉 **Успешного деплоя!** После настройки все заказы будут автоматически приходить в Telegram.
