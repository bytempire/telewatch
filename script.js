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
let selectedColor = null;
let selectedSize = null;
let fullscreenImages = [];
let currentFullscreenIndex = 0;

// Конфигурация Telegram (загружается из внешнего файла)
let TELEGRAM_CONFIG = {
    CHAT_ID: '',
    BOT_TOKEN: '',
    API_URL: 'https://api.telegram.org/bot'
};

// Функция загрузки конфигурации
function loadConfig() {
    // Попытка загрузить конфигурацию из внешнего файла
    if (typeof CONFIG !== 'undefined' && CONFIG.TELEGRAM) {
        TELEGRAM_CONFIG = {
            CHAT_ID: CONFIG.TELEGRAM.CHAT_ID,
            BOT_TOKEN: CONFIG.TELEGRAM.BOT_TOKEN,
            API_URL: CONFIG.TELEGRAM.API_URL
        };
        console.log('✅ Конфигурация успешно загружена');
        return true;
    }
    
    // Попытка загрузить из переменных окружения (если поддерживается)
    if (typeof process !== 'undefined' && process.env) {
        TELEGRAM_CONFIG = {
            CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
            BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
            API_URL: process.env.TELEGRAM_API_URL || 'https://api.telegram.org/bot'
        };
        if (TELEGRAM_CONFIG.CHAT_ID && TELEGRAM_CONFIG.BOT_TOKEN) {
            console.log('✅ Конфигурация загружена из переменных окружения');
            return true;
        }
    }
    
    console.warn('⚠️ Конфигурация не найдена. Создайте файл config.js по образцу config.example.js');
    return false;
}

// Система уведомлений для мобильных устройств
let notificationTimeout = null;
let discountNotificationTimeout = null;

// Флаг для отслеживания показа уведомления о скидке в текущей сессии
let discountNotificationShownInSession = false;

// DOM элементы
const elementsMap = {
    productsGrid: null,
    productModal: null,
    productsListPanel: null,
    backdrop: null,
    cartCount: null,
    productsListItems: null,
    productsListTotal: null,
    photoCarousel: null,
    carouselTrack: null,
    carouselDots: null,
    fullscreenModal: null,
    fullscreenImage: null,
    currentImageIndex: null,
    totalImages: null
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
        if (key === 'productsListPanel') elementsMap[key] = document.getElementById('productsListPanel');
        if (key === 'backdrop') elementsMap[key] = document.getElementById('backdrop');
        if (key === 'cartCount') elementsMap[key] = document.getElementById('cartCount');
        if (key === 'productsListItems') elementsMap[key] = document.getElementById('productsListItems');
        if (key === 'productsListTotal') elementsMap[key] = document.getElementById('productsListTotal');
        if (key === 'photoCarousel') elementsMap[key] = document.getElementById('photoCarousel');
        if (key === 'carouselTrack') elementsMap[key] = document.getElementById('carouselTrack');
        if (key === 'carouselDots') elementsMap[key] = document.getElementById('carouselDots');
        if (key === 'fullscreenModal') {
            elementsMap[key] = document.getElementById('fullscreenModal');
            console.log('Fullscreen modal element:', elementsMap[key]); // Отладочная информация
        }
        if (key === 'fullscreenImage') elementsMap[key] = document.getElementById('fullscreenImage');
        if (key === 'currentImageIndex') elementsMap[key] = document.getElementById('currentImageIndex');
        if (key === 'totalImages') elementsMap[key] = document.getElementById('totalImages');
    });
}

// Инициализация приложения
async function initApp() {
    // Загружаем конфигурацию в первую очередь
    const configLoaded = loadConfig();
    if (!configLoaded) {
        console.warn('⚠️ Внимание: Telegram интеграция не настроена');
    }
    
    initializeElements();
    await loadProducts();
    renderProducts();
    setupEventListeners();
    loadCartFromStorage();
    updateProductsListUI();
    
    // Проверяем, есть ли уже скидка при загрузке
    checkInitialDiscountState();
}

// Проверка начального состояния скидки
function checkInitialDiscountState() {
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = calculateDiscount(totalPrice);
    
    // Если уже есть скидка при загрузке, помечаем что уведомление уже показано
    if (totalPrice >= 100000 && discount > 0) {
        discountNotificationShownInSession = true;
    }
}

// Загрузка товаров из JSON
async function loadProducts() {
    try {
        const response = await fetch('./products.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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

    elementsMap.productsGrid.innerHTML = products.map(product => {
        // Получаем изображение для карточки
        let cardImage = product.images && product.images[0] ? product.images[0] : '';
        
        // Если у товара есть варианты цветов, используем первое изображение первого цвета
        if (product.variants && product.variants.colors && product.variants.colors[0] && product.variants.colors[0].images) {
            cardImage = product.variants.colors[0].images[0];
        }
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <img 
                    class="product-image" 
                    src="${encodeImagePath(cardImage)}" 
                    alt="${product.name}"
                    loading="lazy"
                    onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik00MCA0MEg4MFY4MEg0MFY0MFoiIGZpbGw9IiNDQ0NDQ0MiLz4KPC9zdmc+'"
                >
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${formatPrice(product.price)} ₽</p>
                <p class="product-article">Артикул: ${product.article}</p>
            </div>
        `;
    }).join('');

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
    
    // Настройка вариантов (цвет и размер)
    setupVariants();
    
    // Очищаем поле количества (без предзаполнения)
    document.getElementById('qtyInput').value = '';

    // Показ модального окна
    elementsMap.productModal.classList.add('active');
    elementsMap.backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Настройка карусели фотографий
function setupCarousel() {
    if (!currentProduct) return;

    currentSlide = 0;
    const track = elementsMap.carouselTrack;
    const dots = elementsMap.carouselDots;

    // Получаем изображения для карусели
    let images = [];
    
    // Если у товара есть варианты цветов, используем изображения первого цвета
    if (currentProduct.variants && currentProduct.variants.colors && currentProduct.variants.colors[0]) {
        images = currentProduct.variants.colors[0].images || [];
    } else if (currentProduct.images) {
        images = currentProduct.images;
    }
    
    if (images.length === 0) return;

    // Создание слайдов
    track.innerHTML = images.map((image, index) => `
        <div class="carousel-slide">
            <img 
                class="carousel-image" 
                src="${encodeImagePath(image)}" 
                alt="${currentProduct.name}"
                data-image-index="${index}"
                style="cursor: pointer;"
                onclick="openFullscreen(${index})"
                onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwSDE1MFYyMDBIMjUwVjEwMEgxNTBaIiBmaWxsPSIjQ0NDQ0NDIi8+Cjwvc3ZnPg=='"
            >
        </div>
    `).join('');

    // Создание точек навигации
    if (images.length > 1) {
        dots.innerHTML = images.map((_, index) => `
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

    // Добавляем обработчики для кнопок навигации
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.onclick = () => goToSlide(currentSlide - 1);
    }
    if (nextBtn) {
        nextBtn.onclick = () => goToSlide(currentSlide + 1);
    }

    // Обработчики кликов теперь добавлены напрямую в HTML через onclick

    updateCarousel();
}

// Переход к слайду
function goToSlide(slideIndex) {
    if (!currentProduct) return;
    
    // Получаем актуальные изображения для текущего слайда
    let images = [];
    if (currentProduct.variants && currentProduct.variants.colors && selectedColor) {
        const selectedColorData = currentProduct.variants.colors.find(c => c.value === selectedColor);
        if (selectedColorData && selectedColorData.images) {
            images = selectedColorData.images;
        }
    } else if (currentProduct.variants && currentProduct.variants.colors && currentProduct.variants.colors[0]) {
        images = currentProduct.variants.colors[0].images || [];
    } else if (currentProduct.images) {
        images = currentProduct.images;
    }
    
    const maxSlide = images.length - 1;
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

// Настройка вариантов (цвет и размер)
function setupVariants() {
    if (!currentProduct) return;
    
    // Сброс выбранных вариантов
    selectedColor = null;
    selectedSize = null;
    
    const colorSelector = document.getElementById('colorSelector');
    const sizeSelector = document.getElementById('sizeSelector');
    const colorSelect = document.getElementById('colorSelect');
    const sizeSelect = document.getElementById('sizeSelect');
    
    // Показываем/скрываем селекторы в зависимости от наличия вариантов
    if (currentProduct.variants && currentProduct.variants.colors) {
        colorSelector.style.display = 'block';
        renderColorOptions(colorSelect, currentProduct.variants.colors);
    } else {
        colorSelector.style.display = 'none';
    }
    
    if (currentProduct.variants && currentProduct.variants.sizes) {
        sizeSelector.style.display = 'block';
        renderSizeOptions(sizeSelect, currentProduct.variants.sizes);
    } else {
        sizeSelector.style.display = 'none';
    }
}

// Отображение вариантов цвета
function renderColorOptions(select, colors) {
    // Очищаем и добавляем опции
    select.innerHTML = '<option value="">Выберите цвет</option>' + 
        colors.map(color => `<option value="${color.value}">${color.name}</option>`).join('');
    
    // Добавляем обработчик изменения
    select.addEventListener('change', (e) => {
        selectedColor = e.target.value;
        if (selectedColor) {
            // Обновляем карусель с новыми изображениями
            updateCarouselForColor(selectedColor);
        }
    });
    
    // Выбираем первый цвет по умолчанию
    if (colors.length > 0) {
        select.value = colors[0].value;
        selectedColor = colors[0].value;
        updateCarouselForColor(selectedColor);
    }
}

// Отображение вариантов размера
function renderSizeOptions(select, sizes) {
    // Очищаем и добавляем опции
    select.innerHTML = '<option value="">Выберите размер</option>' + 
        sizes.map(size => `<option value="${size.value}">${size.name}</option>`).join('');
    
    // Добавляем обработчик изменения
    select.addEventListener('change', (e) => {
        selectedSize = e.target.value;
    });
}

// Получение CSS цвета по значению
function getColorValue(colorValue) {
    const colorMap = {
        'olive': '#808000',
        'black': '#000000',
        'blue': '#87CEEB',
        'dark-blue': '#0000CD',
        'light-pink': '#FFB6C1',
        'light-brown': '#D2B48C'
    };
    return colorMap[colorValue] || '#CCCCCC';
}

// Функция для правильного кодирования путей к изображениям
function encodeImagePath(path) {
    // Разделяем путь на директорию и имя файла
    const parts = path.split('/');
    const directory = parts.slice(0, -1).join('/');
    const filename = parts[parts.length - 1];
    
    // Кодируем только имя файла
    return directory + '/' + encodeURIComponent(filename);
}

// Обновление карусели для выбранного цвета
function updateCarouselForColor(colorValue) {
    if (!currentProduct || !currentProduct.variants || !currentProduct.variants.colors) return;
    
    const selectedColorData = currentProduct.variants.colors.find(c => c.value === colorValue);
    if (!selectedColorData || !selectedColorData.images) return;
    
    // Обновляем изображения в карусели
    const track = elementsMap.carouselTrack;
    if (track) {
        track.innerHTML = selectedColorData.images.map((image, index) => `
            <div class="carousel-slide">
                <img 
                    class="carousel-image" 
                    src="${encodeImagePath(image)}" 
                    alt="${currentProduct.name}"
                    data-image-index="${index}"
                    style="cursor: pointer;"
                    onclick="openFullscreen(${index})"
                    onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwSDE1MFYyMDBIMjUwVjEwMEgxNTBaIiBmaWxsPSIjQ0NDQ0NDIi8+Cjwvc3ZnPg=='"
                >
            </div>
        `).join('');
        
        // Обновляем точки навигации
        const dots = elementsMap.carouselDots;
        if (dots && selectedColorData.images.length > 1) {
            dots.innerHTML = selectedColorData.images.map((_, index) => `
                <div class="dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>
            `).join('');
            
            // Добавляем обработчики для точек
            document.querySelectorAll('.dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    goToSlide(parseInt(dot.dataset.slide));
                });
            });
        } else {
            dots.innerHTML = '';
        }
        
        // Добавляем обработчики для кнопок навигации
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.onclick = () => goToSlide(currentSlide - 1);
        }
        if (nextBtn) {
            nextBtn.onclick = () => goToSlide(currentSlide + 1);
        }
        
        // Обработчики кликов теперь добавлены напрямую в HTML через onclick
        
        currentSlide = 0;
        updateCarousel();
    }
}

// Открытие полноэкранного просмотра изображения
window.openFullscreen = function(imageIndex = 0) {
    console.log('openFullscreen called with index:', imageIndex); // Отладочная информация
    if (!currentProduct) {
        console.log('No current product'); // Отладочная информация
        return;
    }
    
    // Получаем изображения для полноэкранного просмотра
    let images = [];
    if (currentProduct.variants && currentProduct.variants.colors && selectedColor) {
        const selectedColorData = currentProduct.variants.colors.find(c => c.value === selectedColor);
        if (selectedColorData && selectedColorData.images) {
            images = selectedColorData.images;
        }
    } else if (currentProduct.variants && currentProduct.variants.colors && currentProduct.variants.colors[0]) {
        images = currentProduct.variants.colors[0].images || [];
    } else if (currentProduct.images) {
        images = currentProduct.images;
    }
    
    console.log('Fullscreen images:', images); // Отладочная информация
    if (images.length === 0) {
        console.log('No images found for fullscreen');
        return;
    }
    
    fullscreenImages = images;
    currentFullscreenIndex = Math.max(0, Math.min(imageIndex, images.length - 1));
    
    // Устанавливаем изображение
    if (elementsMap.fullscreenImage) {
        elementsMap.fullscreenImage.src = encodeImagePath(fullscreenImages[currentFullscreenIndex]);
        elementsMap.fullscreenImage.alt = currentProduct.name;
    }
    
    // Обновляем счетчик
    if (elementsMap.currentImageIndex) {
        elementsMap.currentImageIndex.textContent = currentFullscreenIndex + 1;
    }
    if (elementsMap.totalImages) {
        elementsMap.totalImages.textContent = fullscreenImages.length;
    }
    
    // Показываем модальное окно
    if (elementsMap.fullscreenModal) {
        elementsMap.fullscreenModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('Fullscreen modal opened'); // Отладочная информация
    } else {
        console.log('Fullscreen modal element not found'); // Отладочная информация
    }
}

// Закрытие полноэкранного просмотра
function closeFullscreen() {
    if (elementsMap.fullscreenModal) {
        elementsMap.fullscreenModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Переход к следующему изображению в полноэкранном режиме
function nextFullscreenImage() {
    if (fullscreenImages.length === 0) return;
    
    currentFullscreenIndex = (currentFullscreenIndex + 1) % fullscreenImages.length;
    updateFullscreenImage();
}

// Переход к предыдущему изображению в полноэкранном режиме
function prevFullscreenImage() {
    if (fullscreenImages.length === 0) return;
    
    currentFullscreenIndex = currentFullscreenIndex === 0 ? fullscreenImages.length - 1 : currentFullscreenIndex - 1;
    updateFullscreenImage();
}

// Обновление изображения в полноэкранном режиме
function updateFullscreenImage() {
    if (!elementsMap.fullscreenImage || fullscreenImages.length === 0) return;
    
    elementsMap.fullscreenImage.src = encodeImagePath(fullscreenImages[currentFullscreenIndex]);
    elementsMap.fullscreenImage.alt = currentProduct.name;
    
    // Обновляем счетчик
    if (elementsMap.currentImageIndex) {
        elementsMap.currentImageIndex.textContent = currentFullscreenIndex + 1;
    }
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

    const inputValue = document.getElementById('qtyInput').value.trim();
    const quantity = parseInt(inputValue);
    
    if (!inputValue || isNaN(quantity)) {
        return;
    }
    
    if (quantity < 10) {
        showNotification('Минимальное количество для заказа 10 шт');
        return;
    }
    

    // Проверяем, выбраны ли обязательные варианты
    if (currentProduct.variants) {
        if (currentProduct.variants.colors && !selectedColor) {
            showNotification('Выберите цвет');
            return;
        }
        if (currentProduct.variants.sizes && !selectedSize) {
            showNotification('Выберите размер');
            return;
        }
    }

    // Создаем уникальный ID с учетом вариантов
    const variantId = currentProduct.variants ? 
        `${currentProduct.id}_${selectedColor || ''}_${selectedSize || ''}` : 
        currentProduct.id;

    const existingItem = cart.find(item => item.id === variantId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        // Получаем изображение для выбранного цвета или используем первое
        let productImage = currentProduct.images[0];
        if (currentProduct.variants && currentProduct.variants.colors && selectedColor) {
            const selectedColorData = currentProduct.variants.colors.find(c => c.value === selectedColor);
            if (selectedColorData && selectedColorData.images && selectedColorData.images[0]) {
                productImage = selectedColorData.images[0];
            }
        }
        
        // Создаем название с вариантами
        let productName = currentProduct.name;
        if (currentProduct.variants) {
            if (selectedColor) {
                const colorName = currentProduct.variants.colors.find(c => c.value === selectedColor)?.name;
                if (colorName) productName += ` (${colorName})`;
            }
            if (selectedSize) {
                productName += `, размер ${selectedSize}`;
            }
        }
        
        cart.push({
            id: variantId,
            name: productName,
            price: currentProduct.price,
            article: currentProduct.article,
            image: productImage,
            quantity: quantity,
            color: selectedColor,
            size: selectedSize
        });
    }

    saveCartToStorage();
    updateProductsListUI();
    showNotification('Товар добавлен в список');
    
    // Проверяем скидку после добавления товара
    checkDiscountAfterAdd();
    
    // Вибрация (если поддерживается)
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// Открытие списка товаров
function openProductsList() {
    renderProductsListItems();
    elementsMap.productsListPanel.classList.add('active');
    elementsMap.backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закрытие списка товаров
function closeProductsList() {
    elementsMap.productsListPanel.classList.remove('active');
    elementsMap.backdrop.classList.remove('active');
    document.body.style.overflow = '';
}

// Отображение товаров в списке
function renderProductsListItems() {
    if (!elementsMap.productsListItems) return;

    if (cart.length === 0) {
        elementsMap.productsListItems.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">📋</div>
                <div class="empty-cart-text">Список товаров пуст<br>Добавьте товары из каталога</div>
            </div>
        `;
        return;
    }

    elementsMap.productsListItems.innerHTML = cart.map(item => `
        <div class="products-list-item" data-product-id="${item.id}">
            <img class="products-list-item-image" src="${item.image}" alt="${item.name}">
            <div class="products-list-item-info">
                <div class="products-list-item-name">${item.name}</div>
                <div class="products-list-item-article">Артикул: ${item.article}</div>
                <div class="products-list-item-price">${formatPrice(item.price)} ₽</div>
                <div class="products-list-item-quantity">
                            <input 
                                type="number" 
                                class="products-list-qty-input" 
                                value="${item.quantity}" 
                                min="10"
                                data-product-id="${item.id}"
                                onchange="updateProductQuantity('${item.id}', this.value)"
                                onblur="validateQuantity('${item.id}', this.value)"
                            >
                    <button class="remove-item" onclick="removeFromProductsList('${item.id}')">Удалить</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Обновление количества товара
function updateProductQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) {
        // Восстанавливаем предыдущее значение
        const input = document.querySelector(`[data-product-id="${productId}"]`);
        if (input) input.value = item.quantity;
        return;
    }

    if (quantity < 10) {
        item.quantity = 10;
        const input = document.querySelector(`[data-product-id="${productId}"]`);
        if (input) input.value = 10;
        showNotification('Минимальное количество для заказа 10 шт');
    } else {
        item.quantity = quantity;
    }

    saveCartToStorage();
    updateProductsListUI();
    
    // Проверяем скидку после изменения количества
    checkDiscountAfterAdd();
}

// Валидация количества при потере фокуса
function validateQuantity(productId, value) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    const quantity = parseInt(value);
    const input = document.querySelector(`[data-product-id="${productId}"]`);
    
    if (!value || isNaN(quantity) || quantity < 1) {
        if (input) input.value = 10;
        item.quantity = 10;
        showNotification('Минимальное количество для заказа 10 шт');
    } else if (quantity < 10) {
        if (input) input.value = 10;
        item.quantity = 10;
        showNotification('Минимальное количество для заказа 10 шт');
    } else {
        item.quantity = quantity;
    }

    saveCartToStorage();
    updateProductsListUI();
}

// Удаление товара из списка
function removeFromProductsList(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateProductsListUI();
    renderProductsListItems();
    
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('warning');
    }
}

// Делаем функции глобальными для работы с inline обработчиками
window.updateProductQuantity = updateProductQuantity;
window.validateQuantity = validateQuantity;
window.removeFromProductsList = removeFromProductsList;

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

// Расчет скидки
function calculateDiscount(totalPrice) {
    const DISCOUNT_THRESHOLD = 100000; // Порог для скидки
    const DISCOUNT_PERCENT = 3; // Процент скидки
    
    if (totalPrice >= DISCOUNT_THRESHOLD) {
        return Math.round(totalPrice * DISCOUNT_PERCENT / 100);
    }
    return 0;
}

// Обновление интерфейса списка товаров
function updateProductsListUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = calculateDiscount(totalPrice);
    const finalPrice = totalPrice - discount;
    const uniqueProducts = cart.length; // Количество уникальных артикулов

    // Обновление счетчика товаров (показываем количество артикулов)
    if (elementsMap.cartCount) {
        elementsMap.cartCount.textContent = uniqueProducts;
        elementsMap.cartCount.style.display = uniqueProducts > 0 ? 'flex' : 'none';
    }

    // Обновление общей стоимости с учетом скидки
    if (elementsMap.productsListTotal) {
        if (discount > 0) {
            elementsMap.productsListTotal.innerHTML = `
                <div style="text-decoration: line-through; color: #999; font-size: 14px; margin-bottom: 4px;">
                    ${formatPrice(totalPrice)} ₽
                </div>
                <div style="color: #28a745; font-weight: 600;">
                    ${formatPrice(finalPrice)} ₽
                </div>
                <div style="font-size: 12px; color: #28a745; margin-top: 2px;">
                    Скидка 3%
                </div>
            `;
        } else {
            elementsMap.productsListTotal.textContent = formatPrice(totalPrice) + ' ₽';
        }
    }

    // Сбрасываем флаг скидки, если сумма стала меньше порога
    if (totalPrice < 100000) {
        // Сбрасываем флаг уведомления о скидке, чтобы можно было показать его снова
        discountNotificationShownInSession = false;
        // Очищаем таймаут скидки, если сумма стала меньше порога
        if (discountNotificationTimeout) {
            clearTimeout(discountNotificationTimeout);
            discountNotificationTimeout = null;
        }
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
        showNotification('Список товаров пуст');
        return;
    }

    // Подготовка данных заказа
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = calculateDiscount(subtotal);
    const finalTotal = subtotal - discount;
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const orderData = {
        items: cart.map(item => ({
            name: item.name,
            article: item.article,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
            color: item.color || null,
            size: item.size || null
        })),
        subtotal: subtotal,
        discount: discount,
        discountPercent: discount > 0 ? 3 : 0,
        total: finalTotal,
        totalQuantity: totalQuantity,
        timestamp: new Date().toISOString(),
        orderNumber: generateOrderNumber()
    };

    console.log('Данные заказа:', orderData);

    // Создаем красиво отформатированное сообщение
    const telegramMessage = formatOrderMessage(orderData);

    // Отправка напрямую в указанный чат
    sendOrderToTelegram(telegramMessage, orderData);

    // Очистка списка товаров после оформления заказа
    cart = [];
    saveCartToStorage();
    updateProductsListUI();
    closeProductsList();
    showNotification('Заказ отправлен в Telegram!');
    
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// Генерация номера заказа
function generateOrderNumber() {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6); // Последние 6 цифр timestamp
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `POLLEN-${timestamp}${random}`;
}

// Форматирование сообщения заказа для Telegram
function formatOrderMessage(orderData) {
    const orderDate = new Date(orderData.timestamp).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    let message = `🧶 *НОВЫЙ ЗАКАЗ POLLEN*\n`;
    message += `📋 Заказ №: \`${orderData.orderNumber}\`\n`;
    message += `📅 Дата: ${orderDate}\n`;
    message += `👥 Количество позиций: ${orderData.items.length}\n`;
    message += `📦 Общее количество: ${orderData.totalQuantity} шт\n\n`;

    message += `*СОСТАВ ЗАКАЗА:*\n`;
    orderData.items.forEach((item, index) => {
        message += `\n${index + 1}️⃣ *${item.name}*\n`;
        message += `   📄 Артикул: \`${item.article}\`\n`;
        
        if (item.color) {
            const colorNames = {
                'olive': 'Оливковый',
                'black': 'Черный',
                'blue': 'Голубой',
                'dark-blue': 'Синий',
                'light-pink': 'Светло-розовый',
                'light-brown': 'Светло-коричневый',
                'cream': 'Сливочный',
                'beige': 'Бежевый',
                'mustard': 'Горчичный',
                'indigo': 'Индиго',
                'powder': 'Пудра',
                'cocoa-light': 'Какао-лайт',
                'black-white': 'Черно-белый',
                'beige-mix': 'Бежевый микс',
                'black-brown': 'Черно-коричневый',
                'milk-lime': 'Молочно-лаймовый',
                'orange': 'Оранжевый',
                'dark-beige': 'Тёмно-бежевый',
                'milk-beige': 'Молочно-бежевый'
            };
            message += `   🎨 Цвет: ${colorNames[item.color] || item.color}\n`;
        }
        
        if (item.size) {
            message += `   📏 Размер: ${item.size}\n`;
        }
        
        message += `   💰 Цена за шт: ${formatPrice(item.price)} ₽\n`;
        message += `   📊 Количество: ${item.quantity} шт\n`;
        message += `   💵 Сумма: ${formatPrice(item.total)} ₽\n`;
    });

    message += `\n*ИТОГО:*\n`;
    message += `💰 Подытог: ${formatPrice(orderData.subtotal)} ₽\n`;
    
    if (orderData.discount > 0) {
        message += `🎉 Скидка ${orderData.discountPercent}%: -${formatPrice(orderData.discount)} ₽\n`;
        message += `✅ *К оплате: ${formatPrice(orderData.total)} ₽*\n`;
    } else {
        message += `✅ *К оплате: ${formatPrice(orderData.total)} ₽*\n`;
    }

    message += `\n📞 *Свяжитесь с клиентом для уточнения деталей заказа*`;
    
    return message;
}

// Основная функция отправки заказа в Telegram
async function sendOrderToTelegram(message, orderData) {
    console.log('🚀 Начинаем отправку заказа в Telegram');
    
    let success = false;
    
    // Способ 1: Прямая отправка в чат через Bot API
    try {
        console.log('📱 Попытка 1: Прямая отправка через Bot API');
        success = await sendDirectToTelegram(message, orderData);
        if (success) {
            showNotification('✅ Заказ отправлен в Telegram!', 'success');
            return;
        }
    } catch (error) {
        console.error('❌ Ошибка прямой отправки:', error);
    }
    
    // Способ 2: Отправка через Telegram Web App (если доступен)
    if (tg && tg.sendData && !success) {
        try {
            console.log('📱 Попытка 2: Отправка через Telegram Web App');
            tg.sendData(JSON.stringify({
                type: 'order',
                chat_id: TELEGRAM_CONFIG.CHAT_ID,
                message: message,
                data: orderData
            }));
            success = true;
            showNotification('✅ Заказ отправлен через Telegram Web App!', 'success');
            console.log('✅ Заказ отправлен через tg.sendData');
        } catch (error) {
            console.error('❌ Ошибка отправки через Web App:', error);
        }
    }
    
    // Способ 3: Отправка через proxy/webhook
    if (!success) {
        try {
            console.log('📱 Попытка 3: Отправка через proxy');
            success = await sendViaProxy(message, orderData);
            if (success) {
                showNotification('✅ Заказ отправлен!', 'success');
                return;
            }
        } catch (error) {
            console.error('❌ Ошибка отправки через proxy:', error);
        }
    }
    
    // Способ 4: Показать главную кнопку Telegram
    if (tg && tg.MainButton && !success) {
        console.log('📱 Попытка 4: Использование главной кнопки Telegram');
        tg.MainButton.text = `📋 Отправить заказ №${orderData.orderNumber}`;
        tg.MainButton.color = '#833177';
        tg.MainButton.show();
        
        tg.MainButton.onClick(async () => {
            try {
                const directSuccess = await sendDirectToTelegram(message, orderData);
                if (directSuccess) {
                    tg.MainButton.hide();
                    showNotification('✅ Заказ отправлен!', 'success');
                } else {
                    // Fallback - отправляем через sendData
                    tg.sendData(message);
                    tg.MainButton.hide();
                    showNotification('✅ Заказ отправлен!', 'success');
                }
            } catch (error) {
                console.error('❌ Ошибка отправки через главную кнопку:', error);
                tg.MainButton.hide();
                fallbackTelegramSend(message, orderData);
            }
        });
        
        showNotification('📱 Нажмите кнопку внизу для отправки заказа', 'info');
        success = true; // Считаем успехом, так как кнопка показана
    }
    
    // Способ 5: Резервная отправка
    if (!success) {
        console.log('📱 Используем резервный способ отправки');
        fallbackTelegramSend(message, orderData);
    }
}

// Резервная отправка в Telegram
function fallbackTelegramSend(message, orderData) {
    console.log('🔄 Резервная отправка заказа в Telegram');
    console.log('Сообщение для отправки:', message);
    
    // Сохраняем заказ локально
    sendToTelegramBot(message, orderData);
    
    // Показываем варианты пользователю
    if (tg) {
        // В Telegram Web App
        if (tg.close) {
            setTimeout(() => {
                if (confirm(`📋 Заказ №${orderData.orderNumber} готов!\n\n❓ Закрыть приложение и отправить заказ в чат вручную?`)) {
                    // Копируем в буфер обмена перед закрытием
                    navigator.clipboard.writeText(message).then(() => {
                        console.log('✅ Сообщение скопировано в буфер обмена');
                    }).catch(() => {
                        console.log('❌ Не удалось скопировать в буфер обмена');
                    });
                    tg.close();
                }
            }, 1000);
        } else {
            showNotification('💾 Заказ сохранен. Попробуйте обновить страницу', 'info');
        }
    } else {
        // В обычном браузере
        fallbackCheckout(orderData);
    }
}

// Прямая отправка сообщения в Telegram чат
async function sendDirectToTelegram(message, orderData) {
    // Проверяем наличие конфигурации
    if (!TELEGRAM_CONFIG.CHAT_ID || !TELEGRAM_CONFIG.BOT_TOKEN) {
        console.error('❌ Telegram не настроен. Создайте config.js файл с настройками');
        return false;
    }
    
    console.log('📤 Отправка заказа в Telegram чат:', TELEGRAM_CONFIG.CHAT_ID);
    
    const url = `${TELEGRAM_CONFIG.API_URL}${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`;
    
    // Добавляем информацию о пользователе, если доступна
    let fullMessage = message;
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        fullMessage = `👤 *КЛИЕНТ:*\n`;
        fullMessage += `ID: \`${user.id}\`\n`;
        fullMessage += `Имя: ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}\n`;
        if (user.username) {
            fullMessage += `Username: @${user.username}\n`;
        }
        fullMessage += `\n${message}`;
    }
    
    const payload = {
        chat_id: TELEGRAM_CONFIG.CHAT_ID,
        text: fullMessage,
        parse_mode: 'Markdown'
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Заказ успешно отправлен в Telegram чат');
            return true;
        } else {
            console.error('❌ Ошибка отправки в Telegram:', result);
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка сети при отправке в Telegram:', error);
        return false;
    }
}

// Отправка через webhook или proxy
async function sendViaProxy(message, orderData) {
    console.log('Попытка отправки через webhook/proxy');
    
    // Можно добавить отправку через ваш сервер-прокси
    const proxyUrl = 'https://your-server.com/api/telegram/send'; // Замените на ваш URL
    
    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CONFIG.CHAT_ID,
                message: message,
                orderData: orderData
            })
        });
        
        if (response.ok) {
            console.log('✅ Заказ отправлен через proxy');
            return true;
        }
    } catch (error) {
        console.error('❌ Ошибка отправки через proxy:', error);
    }
    
    return false;
}

// Отправка боту через Telegram Web App Data (резерв)
function sendToTelegramBot(message, orderData) {
    console.log('Резервная отправка через Telegram Web App Data');
    
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        // Данные пользователя доступны
        const userData = tg.initDataUnsafe.user;
        console.log('Пользователь:', userData);
        
        // Сохраняем данные заказа в локальном хранилище для бота
        const orderForBot = {
            ...orderData,
            user: userData,
            telegramMessage: message
        };
        
        localStorage.setItem('pending_order', JSON.stringify(orderForBot));
        console.log('Заказ сохранен для отправки боту');
    }
}

// Резервный способ оформления заказа для браузера
function fallbackCheckout(orderData) {
    const orderText = formatOrderMessage(orderData);
    console.log('Fallback checkout - Текст заказа:', orderText);
    
    // Показываем пользователю текст заказа
    if (confirm('Telegram Web App недоступен. Скопировать данные заказа в буфер обмена?')) {
        navigator.clipboard.writeText(orderText).then(() => {
            showNotification('Данные заказа скопированы в буфер обмена');
        }).catch(() => {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = orderText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('Данные заказа скопированы в буфер обмена');
        });
    }
}

// Показ уведомления
function showNotification(message, type = 'info') {
    // Очищаем предыдущие таймауты
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }
    
    // Удаляем предыдущие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => {
        if (notif.parentNode) {
            notif.parentNode.removeChild(notif);
        }
    });
    
    // Создание элемента уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Принудительное обновление DOM
    notification.offsetHeight;

    // Анимация появления
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        // Проверяем, мобильное ли устройство
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            notification.style.transform = 'translateX(-50%) translateY(0)';
        } else {
            notification.style.transform = 'translateY(0)';
        }
    });

    // Удаление через 3 секунды
    notificationTimeout = setTimeout(() => {
        notification.style.opacity = '0';
        // Проверяем, мобильное ли устройство
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
        } else {
            notification.style.transform = 'translateY(-20px)';
        }
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Проверка скидки после добавления товара
function checkDiscountAfterAdd() {
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = calculateDiscount(totalPrice);
    
    // Показываем уведомление о скидке только если достигли порога
    if (totalPrice >= 100000 && discount > 0) {
        // Проверяем, не показывали ли уже уведомление в этой сессии
        if (!discountNotificationShownInSession) {
            showDiscountNotification();
            discountNotificationShownInSession = true;
        }
    }
}

// Показ уведомления о скидке с задержкой
function showDiscountNotification() {
    // Очищаем предыдущий таймаут скидки
    if (discountNotificationTimeout) {
        clearTimeout(discountNotificationTimeout);
    }
    
    console.log('Запланировано уведомление о скидке через 3 секунды');
    
    // Показываем уведомление о скидке через 3 секунды
    discountNotificationTimeout = setTimeout(() => {
        console.log('Показываем уведомление о скидке');
        showNotification(`🎉 Поздравляем! Вы получили скидку 3%`, 'success');
    }, 3000);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопки модального окна товара
    document.getElementById('closeModal')?.addEventListener('click', closeProductModal);
    
    // Карусель - обработчики будут добавлены в setupCarousel
    
    // Управление количеством - валидация при потере фокуса
    document.getElementById('qtyInput')?.addEventListener('blur', (e) => {
        const inputValue = e.target.value.trim();
        const value = parseInt(inputValue);

        // Если поле пустое, оставляем пустым (не навязываем значение)
        if (!inputValue) {
            return; // Просто выходим, не меняем значение
        }

        // Если введено некорректное значение
        if (isNaN(value) || value === 0) {
            e.target.value = '';
            showNotification('Введите корректное число');
        } else if (value < 10) {
            // Больше не выставляем 10 автоматически — пользователь должен сам ввести допустимое значение
            e.target.value = '';
            showNotification('Минимальное количество для заказа 10 шт');
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
    
    // Список товаров
    document.getElementById('cartIcon')?.addEventListener('click', openProductsList);
    document.getElementById('closeProductsList')?.addEventListener('click', closeProductsList);
    document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
    
    // Полноэкранный просмотр изображений
    document.getElementById('closeFullscreen')?.addEventListener('click', closeFullscreen);
    document.getElementById('prevFullscreen')?.addEventListener('click', prevFullscreenImage);
    document.getElementById('nextFullscreen')?.addEventListener('click', nextFullscreenImage);
    
    // Закрытие по клику на backdrop
    elementsMap.backdrop?.addEventListener('click', () => {
        if (elementsMap.productModal.classList.contains('active')) {
            closeProductModal();
        }
        if (elementsMap.productsListPanel.classList.contains('active')) {
            closeProductsList();
        }
    });
    
    // Обработка клавиатуры
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elementsMap.fullscreenModal && elementsMap.fullscreenModal.classList.contains('active')) {
                closeFullscreen();
            } else if (elementsMap.productModal.classList.contains('active')) {
                closeProductModal();
            } else if (elementsMap.productsListPanel.classList.contains('active')) {
                closeProductsList();
            }
        }
        
        // Навигация в полноэкранном режиме
        if (elementsMap.fullscreenModal && elementsMap.fullscreenModal.classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                prevFullscreenImage();
            } else if (e.key === 'ArrowRight') {
                nextFullscreenImage();
            }
        }
        // Навигация в карусели
        else if (elementsMap.productModal.classList.contains('active')) {
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
    
    // Touch события для полноэкранного режима
    let fullscreenTouchStartX = 0;
    let fullscreenTouchEndX = 0;
    
    elementsMap.fullscreenModal?.addEventListener('touchstart', (e) => {
        fullscreenTouchStartX = e.changedTouches[0].screenX;
    });
    
    elementsMap.fullscreenModal?.addEventListener('touchend', (e) => {
        fullscreenTouchEndX = e.changedTouches[0].screenX;
        handleFullscreenSwipe();
    });
    
    function handleFullscreenSwipe() {
        const threshold = 50;
        const diff = fullscreenTouchStartX - fullscreenTouchEndX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe left - next image
                nextFullscreenImage();
            } else {
                // Swipe right - prev image
                prevFullscreenImage();
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
