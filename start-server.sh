#!/bin/bash

# Скрипт для запуска локального сервера
# Использование: ./start-server.sh [порт]

PORT=${1:-8000}

echo "🚀 Запускаем Telewatch Mini App..."
echo "📱 Откройте http://localhost:$PORT в браузере"
echo "🛑 Для остановки нажмите Ctrl+C"
echo ""

# Проверяем доступность Python 3
if command -v python3 &> /dev/null; then
    echo "✅ Используем Python 3"
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    echo "✅ Используем Python"
    python -m SimpleHTTPServer $PORT
elif command -v node &> /dev/null; then
    echo "✅ Используем Node.js (http-server)"
    npx http-server -p $PORT
else
    echo "❌ Не найден Python или Node.js"
    echo "Установите Python 3 или Node.js для запуска сервера"
    exit 1
fi
