#!/usr/bin/env python3
"""
Простой Telegram бот для обработки заказов из Web App
"""

import json
import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Замените на ваш токен от BotFather
BOT_TOKEN = "ВАШ_ТОКЕН_БОТА"

# URL вашего Web App (замените на свой)
WEB_APP_URL = "https://ВАШ_ЛОГИН.github.io/telewatch/"

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик команды /start"""
    user = update.effective_user
    
    keyboard = [
        [InlineKeyboardButton(
            "🛒 Открыть каталог", 
            web_app=WebAppInfo(url=WEB_APP_URL)
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    welcome_text = f"""
👋 Добро пожаловать, {user.first_name}!

🛍️ **Telewatch Shop** - ваш персональный каталог товаров

✨ **Возможности:**
• 📱 Удобный каталог товаров
• 🖼️ Карусель фотографий
• 📋 Подробные характеристики
• 🛒 Корзина с управлением количеством
• 💾 Сохранение заказов

Нажмите кнопку ниже, чтобы начать покупки!
"""
    
    await update.message.reply_text(
        welcome_text, 
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик данных из Web App"""
    try:
        # Получаем данные заказа из Web App
        web_app_data = update.message.web_app_data.data
        order_data = json.loads(web_app_data)
        
        user = update.effective_user
        
        # Формируем сообщение с заказом
        order_text = f"🛒 **Новый заказ от {user.first_name}**\n\n"
        
        total_amount = 0
        for item in order_data.get('items', []):
            item_total = item['price'] * item['quantity']
            total_amount += item_total
            
            order_text += f"📦 **{item['name']}**\n"
            order_text += f"🏷️ Артикул: `{item['article']}`\n"
            order_text += f"💰 Цена: {item['price']:,} ₽\n"
            order_text += f"📊 Количество: {item['quantity']} шт.\n"
            order_text += f"💵 Сумма: {item_total:,} ₽\n\n"
        
        order_text += f"💎 **Итого: {total_amount:,} ₽**\n"
        order_text += f"📅 Дата: {order_data.get('timestamp', 'N/A')}\n"
        order_text += f"👤 ID пользователя: `{user.id}`"
        
        # Отправляем подтверждение пользователю
        await update.message.reply_text(
            "✅ **Заказ принят!**\n\nСпасибо за покупку! Ваш заказ обрабатывается.\n\nМы свяжемся с вами в ближайшее время.",
            parse_mode='Markdown'
        )
        
        # Логируем заказ (здесь можно добавить отправку админу)
        logger.info(f"Новый заказ от пользователя {user.id}: {order_data}")
        
        # TODO: Отправить заказ администратору
        # await context.bot.send_message(
        #     chat_id=ADMIN_CHAT_ID,
        #     text=order_text,
        #     parse_mode='Markdown'
        # )
        
    except Exception as e:
        logger.error(f"Ошибка обработки заказа: {e}")
        await update.message.reply_text(
            "❌ Произошла ошибка при обработке заказа. Попробуйте еще раз или обратитесь к администратору."
        )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик команды /help"""
    help_text = """
🤖 **Команды бота:**

/start - Запустить бота и открыть каталог
/help - Показать эту справку

🛍️ **Как пользоваться:**
1. Нажмите "🛒 Открыть каталог"
2. Просматривайте товары и их характеристики
3. Добавляйте понравившиеся товары в корзину
4. Оформляйте заказ - данные автоматически отправятся боту

📞 **Поддержка:**
Если у вас возникли вопросы, обратитесь к администратору.
"""
    
    await update.message.reply_text(help_text, parse_mode='Markdown')

def main() -> None:
    """Запуск бота"""
    if BOT_TOKEN == "ВАШ_ТОКЕН_БОТА":
        print("❌ Ошибка: Замените BOT_TOKEN на ваш реальный токен!")
        return
    
    print("🤖 Запускаем Telewatch бота...")
    
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()

    # Добавляем обработчики
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))

    # Запускаем бота
    print("✅ Бот запущен! Нажмите Ctrl+C для остановки.")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
