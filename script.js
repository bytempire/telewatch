// Telegram Web App инициализация
let tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
} else {
    console.log('Telegram Web App не доступен');
}

// Глобальные переменные
let products = [];
let cart = [];
let currentProduct = null;
let currentSlide = 0;

// DOM элементы
const elementsMap = {
    productsGrid: null,
    productModal: null,
    cartPanel: null,
    backdrop: null,
    cartCount: null,
    cartItems: null,
    cartTotal: null,
    photoCarousel: null,
    carouselTrack: null,
    carouselDots: null
};

// Инициализация DOM элементов
function initializeElements() {
    Object.keys(elementsMap).forEach(key => {
        elementsMap[key] = document.getElementById(
            key.charAt(0).toLowerCase() + key.slice(1).replace(/([A-Z])/g, (match, letter) => 
                letter === letter.toUpperCase() ? letter.charAt(0).toUpperCase() + letter.slice(1) : letter
            )
        );
        
        if (key === 'productsGrid') elementsMap[key] = document.getElementById('productsGrid');
        if (key === 'productModal') elementsMap[key] = document.getElementById('productModal');
        if (key === 'cartPanel') elementsMap[key] = document.getElementById('cartPanel');
        if (key === 'backdrop') elementsMap[key] = document.getElementById('backdrop');
        if (key === 'cartCount') elementsMap[key] = document.getElementById('cartCount');
        if (key === 'cartItems') elementsMap[key] = document.getElementById('cartItems');
        if (key === 'cartTotal') elementsMap[key] = document.getElementById('cartTotal');
        if (key === 'photoCarousel') elementsMap[key] = document.getElementById('photoCarousel');
        if (key === 'carouselTrack') elementsMap[key] = document.getElementById('carouselTrack');
        if (key === 'carouselDots') elementsMap[key] = document.getElementById('carouselDots');
    });
}

// Инициализация приложения
async function initApp() {
    initializeElements();
    await loadProducts();
    renderProducts();
    setupEventListeners();
    loadCartFromStorage();
    updateCartUI();
}

// Загрузка товаров из JSON
async function loadProducts() {
    try {
        const response = await fetch('./products.json');
        const data = await response.json();
        products = data.products;
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        products = [];
    }
}

// Отображение каталога товаров
function renderProducts() {
    if (!elementsMap.productsGrid) return;
    
    if (products.length === 0) {
        elementsMap.productsGrid.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Загрузка товаров...
            </div>
        `;
        return;
    }

    elementsMap.productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <img 
                class="product-image" 
                src="${product.images[0]}" 
                alt="${product.name}"
                loading="lazy"
                onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik00MCA0MEg4MFY4MEg0MFY0MFoiIGZpbGw9IiNDQ0NDQ0MiLz4KPC9zdmc+'"
            >
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">${formatPrice(product.price)} ₽</p>
            <p class="product-article">Артикул: ${product.article}</p>
        </div>
    `).join('');

    // Добавляем обработчики кликов на карточки товаров
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const productId = card.dataset.productId;
            openProductModal(productId);
        });
    });
}

// Форматирование цены
function formatPrice(price) {
    return price.toLocaleString('ru-RU');
}

// Открытие модального окна товара
function openProductModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;

    // Заполнение информации о товаре
    document.getElementById('productTitle').textContent = currentProduct.name;
    document.getElementById('productPrice').textContent = `${formatPrice(currentProduct.price)} ₽`;
    document.getElementById('productArticle').textContent = `Артикул: ${currentProduct.article}`;
    document.getElementById('productDescription').textContent = currentProduct.description;

    // Заполнение характеристик
    const specsList = document.getElementById('specsList');
    specsList.innerHTML = Object.entries(currentProduct.specs).map(([name, value]) => `
        <div class="spec-item">
            <span class="spec-name">${name}:</span>
            <span class="spec-value">${value}</span>
        </div>
    `).join('');

    // Настройка карусели
    setupCarousel();
    
    // Сброс количества
    document.getElementById('qtyInput').value = '50';

    // Показ модального окна
    elementsMap.productModal.classList.add('active');
    elementsMap.backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Настройка карусели фотографий
function setupCarousel() {
    if (!currentProduct || !currentProduct.images) return;

    currentSlide = 0;
    const track = elementsMap.carouselTrack;
    const dots = elementsMap.carouselDots;

    // Создание слайдов
    track.innerHTML = currentProduct.images.map(image => `
        <div class="carousel-slide">
            <img 
                class="carousel-image" 
                src="${image}" 
                alt="${currentProduct.name}"
                onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwSDE1MFYyMDBIMjUwVjEwMEgxNTBaIiBmaWxsPSIjQ0NDQ0NDIi8+Cjwvc3ZnPg=='"
            >
        </div>
    `).join('');

    // Создание точек навигации
    if (currentProduct.images.length > 1) {
        dots.innerHTML = currentProduct.images.map((_, index) => `
            <div class="dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>
        `).join('');

        // Обработчики для точек
        document.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', () => {
                goToSlide(parseInt(dot.dataset.slide));
            });
        });
    } else {
        dots.innerHTML = '';
    }

    updateCarousel();
}

// Переход к слайду
function goToSlide(slideIndex) {
    if (!currentProduct) return;
    
    const maxSlide = currentProduct.images.length - 1;
    currentSlide = Math.max(0, Math.min(slideIndex, maxSlide));
    updateCarousel();
}

// Обновление карусели
function updateCarousel() {
    if (!elementsMap.carouselTrack) return;

    const translateX = -currentSlide * 100;
    elementsMap.carouselTrack.style.transform = `translateX(${translateX}%)`;

    // Обновление активной точки
    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

// Закрытие модального окна
function closeProductModal() {
    elementsMap.productModal.classList.remove('active');
    elementsMap.backdrop.classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
}

// Добавление в корзину
function addToCart() {
    if (!currentProduct) return;

    const quantity = parseInt(document.getElementById('qtyInput').value);
    
    if (quantity < 50) {
        showNotification('Минимальное количество 50 штук');
        return;
    }
    
    if (isNaN(quantity) || quantity > 9999) {
        showNotification('Введите корректное количество (50-9999)');
        return;
    }

    const existingItem = cart.find(item => item.id === currentProduct.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            article: currentProduct.article,
            image: currentProduct.images[0],
            quantity: quantity
        });
    }

    saveCartToStorage();
    updateCartUI();
    showNotification('Товар добавлен в корзину');
    
    // Вибрация (если поддерживается)
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// Открытие корзины
function openCart() {
    renderCartItems();
    elementsMap.cartPanel.classList.add('active');
    elementsMap.backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закрытие корзины
function closeCart() {
    elementsMap.cartPanel.classList.remove('active');
    elementsMap.backdrop.classList.remove('active');
    document.body.style.overflow = '';
}

// Отображение товаров в корзине
function renderCartItems() {
    if (!elementsMap.cartItems) return;

    if (cart.length === 0) {
        elementsMap.cartItems.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <div class="empty-cart-text">Корзина пуста<br>Добавьте товары из каталога</div>
            </div>
        `;
        return;
    }

    elementsMap.cartItems.innerHTML = cart.map(item => `
        <div class="cart-item" data-product-id="${item.id}">
            <img class="cart-item-image" src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatPrice(item.price)} ₽</div>
                <div class="cart-item-quantity">
                    <button class="cart-qty-btn minus" data-action="decrease">-</button>
                    <span class="cart-qty-display">${item.quantity}</span>
                    <button class="cart-qty-btn plus" data-action="increase">+</button>
                    <button class="remove-item" data-action="remove">Удалить</button>
                </div>
            </div>
        </div>
    `).join('');

    // Добавляем обработчики событий для управления количеством
    document.querySelectorAll('.cart-qty-btn, .remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.closest('.cart-item').dataset.productId;
            const action = btn.dataset.action;
            
            handleCartItemAction(productId, action);
        });
    });
}

// Обработка действий с товарами в корзине
function handleCartItemAction(productId, action) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    switch (action) {
        case 'increase':
            item.quantity += 1;
            break;
        case 'decrease':
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                removeFromCart(productId);
                return;
            }
            break;
        case 'remove':
            removeFromCart(productId);
            return;
    }

    saveCartToStorage();
    updateCartUI();
    renderCartItems();
}

// Удаление товара из корзины
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartUI();
    renderCartItems();
    
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('warning');
    }
}

// Обновление интерфейса корзины
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Обновление счетчика товаров
    if (elementsMap.cartCount) {
        elementsMap.cartCount.textContent = totalItems;
        elementsMap.cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    // Обновление общей стоимости
    if (elementsMap.cartTotal) {
        elementsMap.cartTotal.textContent = `${formatPrice(totalPrice)} ₽`;
    }

    // Активация/деактивация кнопки оформления
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
}

// Сохранение корзины в localStorage
function saveCartToStorage() {
    try {
        localStorage.setItem('telewatch_cart', JSON.stringify(cart));
    } catch (error) {
        console.error('Ошибка сохранения корзины:', error);
    }
}

// Загрузка корзины из localStorage
function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('telewatch_cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        cart = [];
    }
}

// Оформление заказа
function checkout() {
    if (cart.length === 0) {
        showNotification('Корзина пуста');
        return;
    }

    // Подготовка данных заказа
    const orderData = {
        items: cart.map(item => ({
            name: item.name,
            article: item.article,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        timestamp: new Date().toISOString()
    };

    console.log('Данные заказа:', orderData);

    // Отправка данных через Telegram WebApp (если доступно)
    if (tg && tg.sendData) {
        try {
            tg.sendData(JSON.stringify(orderData));
        } catch (error) {
            console.error('Ошибка отправки данных:', error);
            fallbackCheckout(orderData);
        }
    } else {
        fallbackCheckout(orderData);
    }

    // Очистка корзины после оформления заказа
    cart = [];
    saveCartToStorage();
    updateCartUI();
    closeCart();
    showNotification('Заказ отправлен!');
    
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// Резервный способ оформления заказа
function fallbackCheckout(orderData) {
    const orderText = `Новый заказ:\n\n${orderData.items.map(item => 
        `${item.name} (${item.article})\nКоличество: ${item.quantity}\nЦена: ${formatPrice(item.price)} ₽\nСумма: ${formatPrice(item.total)} ₽`
    ).join('\n\n')}\n\nИтого: ${formatPrice(orderData.total)} ₽`;
    
    console.log('Текст заказа:', orderText);
    
    // Можно добавить дополнительную логику для отправки заказа
}

// Показ уведомления
function showNotification(message, type = 'info') {
    // Создание элемента уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--tg-theme-button-color, #007AFF);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 90vw;
        text-align: center;
    `;

    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    // Удаление через 3 секунды
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопки модального окна товара
    document.getElementById('closeModal')?.addEventListener('click', closeProductModal);
    
    // Карусель
    document.getElementById('prevBtn')?.addEventListener('click', () => goToSlide(currentSlide - 1));
    document.getElementById('nextBtn')?.addEventListener('click', () => goToSlide(currentSlide + 1));
    
    // Управление количеством - валидация при потере фокуса
    document.getElementById('qtyInput')?.addEventListener('blur', (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value) || value === 0 || e.target.value.trim() === '') {
            e.target.value = 50;
            showNotification('Установлено минимальное количество: 50 штук');
        } else if (value < 50) {
            e.target.value = 50;
            showNotification('Минимальное количество: 50 штук');
        } else if (value > 9999) {
            e.target.value = 9999;
            showNotification('Максимальное количество: 9999 штук');
        }
    });
    
    // Разрешаем только цифры при вводе
    document.getElementById('qtyInput')?.addEventListener('keypress', (e) => {
        // Разрешаем только цифры, backspace, delete, arrow keys
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
        if (!allowedKeys.includes(e.key) && (e.key < '0' || e.key > '9')) {
            e.preventDefault();
        }
    });
    
    // Выделяем весь текст при фокусе для удобного редактирования
    document.getElementById('qtyInput')?.addEventListener('focus', (e) => {
        // Небольшая задержка для корректной работы на мобильных
        setTimeout(() => {
            e.target.select();
        }, 10);
    });
    
    // Дополнительное выделение по клику
    document.getElementById('qtyInput')?.addEventListener('click', (e) => {
        e.target.select();
    });
    
    // Добавление в корзину
    document.getElementById('addToCartBtn')?.addEventListener('click', addToCart);
    
    // Корзина
    document.getElementById('cartIcon')?.addEventListener('click', openCart);
    document.getElementById('closeCart')?.addEventListener('click', closeCart);
    document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
    
    // Закрытие по клику на backdrop
    elementsMap.backdrop?.addEventListener('click', () => {
        if (elementsMap.productModal.classList.contains('active')) {
            closeProductModal();
        }
        if (elementsMap.cartPanel.classList.contains('active')) {
            closeCart();
        }
    });
    
    // Обработка клавиатуры
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elementsMap.productModal.classList.contains('active')) {
                closeProductModal();
            } else if (elementsMap.cartPanel.classList.contains('active')) {
                closeCart();
            }
        }
        
        // Навигация в карусели
        if (elementsMap.productModal.classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                goToSlide(currentSlide - 1);
            } else if (e.key === 'ArrowRight') {
                goToSlide(currentSlide + 1);
            }
        }
    });

    // Touch события для карусели
    let touchStartX = 0;
    let touchEndX = 0;
    
    elementsMap.photoCarousel?.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    elementsMap.photoCarousel?.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const threshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe left - next slide
                goToSlide(currentSlide + 1);
            } else {
                // Swipe right - prev slide
                goToSlide(currentSlide - 1);
            }
        }
    }
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

// Обработка изменений темы Telegram
if (tg) {
    tg.onEvent('themeChanged', () => {
        // Обновление CSS переменных при изменении темы
        console.log('Тема изменена');
    });
    
    tg.onEvent('mainButtonClicked', () => {
        // Обработка нажатия главной кнопки
        checkout();
    });
}
