document.addEventListener('DOMContentLoaded', () => {
    // Inyectamos el HTML del carrito y el modal de comentarios/instrucciones especiales en el body
    const cartHTML = `
    <!-- Modal de Comentarios / Instrucciones Especiales al agregar producto -->
    <div class="custom-modal-overlay" id="custom-modal-overlay">
        <div class="custom-modal" id="custom-modal">
            <div class="custom-modal-header">
                <div class="custom-modal-title-area">
                    <span class="custom-modal-icon">🍓</span>
                    <h2 class="custom-modal-title" id="custom-modal-title">Nombre del Producto</h2>
                </div>
                <button class="custom-modal-close" id="custom-modal-close" type="button" aria-label="Cerrar modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="custom-modal-subtitle">Personaliza tu pedido antes de agregarlo al carrito</p>
            
            <form id="custom-modal-form" onsubmit="return false;">
                <label class="custom-modal-label" for="custom-modal-instructions">
                    <span style="font-size: 1.15rem;">💬</span> Instrucciones especiales (opcional):
                </label>
                <textarea 
                    id="custom-modal-instructions" 
                    class="custom-modal-textarea" 
                    placeholder="Ej: Con poco picante, sin crema, bien doraditas..."></textarea>
                
                <button type="button" class="btn-custom-add-cart" id="btn-custom-add-cart">
                    <i class="fas fa-shopping-cart"></i> Agregar al carrito
                </button>
            </form>
        </div>
    </div>

    <!-- Fondo oscuro detrás del carrito -->
    <div class="cart-overlay" id="cart-overlay" style="display: none; opacity: 0; transition: opacity 0.3s ease;">
        <!-- Contenedor principal del carrito -->
        <aside class="cart-sidebar" id="cart-sidebar" style="transform: translateX(100%); transition: transform 0.3s ease;">
            
            <!-- Cabecera del carrito -->
            <div class="cart-header">
                <div class="cart-title-area">
                    <i class="fas fa-shopping-cart cart-icon"></i>
                    <h2>Tu carrito</h2>
                    <span class="cart-badge">2</span>
                </div>
                <button class="cart-close" id="cart-close" type="button" aria-label="Cerrar carrito">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Lista de productos -->
            <div class="cart-items" id="cart-items-container">
                <!-- Producto 1 -->
                <div class="cart-item">
                    <img src="./images/fresas_crema.jpg" alt="Fresas con crema" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'">
                    <div class="cart-item-info">
                        <h3 class="cart-item-title">Fresas con crema</h3>
                        <p class="cart-item-desc">Fresas frescas con crema dulce y un toque especial.</p>
                        <span class="cart-item-price">$45.00</span>
                        <div class="cart-item-quantity">
                            <button type="button" class="btn-qty-minus"><i class="fas fa-minus"></i></button>
                            <input type="number" value="1" min="1">
                            <button type="button" class="btn-qty-plus"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                    <button class="cart-item-delete" type="button" aria-label="Eliminar">
                        <i class="far fa-trash-alt"></i>
                    </button>
                </div>

                <!-- Producto 2 -->
                <div class="cart-item">
                    <img src="./images/mini_hotcakes.jpg" alt="Mini hot cakes" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'">
                    <div class="cart-item-info">
                        <h3 class="cart-item-title">Mini hot cakes</h3>
                        <p class="cart-item-desc">Hot cakes esponjosos con frutas y un toque de miel.</p>
                        <span class="cart-item-price">$55.00</span>
                        <div class="cart-item-quantity">
                            <button type="button" class="btn-qty-minus"><i class="fas fa-minus"></i></button>
                            <input type="number" value="1" min="1">
                            <button type="button" class="btn-qty-plus"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                    <button class="cart-item-delete" type="button" aria-label="Eliminar">
                        <i class="far fa-trash-alt"></i>
                    </button>
                </div>
            </div>

            <!-- Resumen de compra -->
            <div class="cart-summary">
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span id="cart-subtotal">$100.00</span>
                </div>
                <div class="summary-row">
                    <span>Envío</span>
                    <span>$0.00</span>
                </div>
                <p class="summary-note">(En compras mayores a $300)</p>
                
                <div class="summary-total">
                    <span>Total</span>
                    <span class="total-price" id="cart-total">$100.00</span>
                </div>

                <div class="cart-buttons">
                    <button class="btn-checkout" type="button">
                        <i class="fas fa-lock"></i> Finalizar compra
                    </button>
                    <button class="btn-continue" id="btn-continue-shopping" type="button">
                        <i class="fas fa-arrow-left"></i> Seguir comprando
                    </button>
                </div>
            </div>

        </aside>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', cartHTML);

    // Elementos del carrito
    const cartIcon = document.getElementById('cart-icon');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartClose = document.getElementById('cart-close');
    const btnContinue = document.getElementById('btn-continue-shopping');
    const cartItemsContainer = document.getElementById('cart-items-container');

    // Elementos del modal de instrucciones especiales
    const customModalOverlay = document.getElementById('custom-modal-overlay');
    const customModal = document.getElementById('custom-modal');
    const customModalTitle = document.getElementById('custom-modal-title');
    const customModalInstructions = document.getElementById('custom-modal-instructions');
    const customModalClose = document.getElementById('custom-modal-close');
    const btnCustomAddCart = document.getElementById('btn-custom-add-cart');

    let pendingProduct = null;

    // Función para escapar texto en HTML y evitar inyecciones
    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    // Función para abrir el carrito
    const openCart = () => {
        cartOverlay.style.display = 'flex';
        setTimeout(() => {
            cartOverlay.style.opacity = '1';
            cartSidebar.style.transform = 'translateX(0)';
        }, 10);
    };

    // Función para cerrar el carrito
    const closeCart = () => {
        cartOverlay.style.opacity = '0';
        cartSidebar.style.transform = 'translateX(100%)';
        setTimeout(() => {
            cartOverlay.style.display = 'none';
        }, 300);
    };

    // Función para abrir el modal de instrucciones especiales
    const openCustomModal = (product) => {
        pendingProduct = product;
        customModalTitle.textContent = product.name || 'Producto Especial';
        customModalInstructions.value = '';
        customModalOverlay.style.display = 'flex';
        setTimeout(() => {
            customModalOverlay.classList.add('show');
            customModal.classList.add('show');
            customModalInstructions.focus();
        }, 10);
    };

    // Función para cerrar el modal de instrucciones especiales
    const closeCustomModal = () => {
        customModalOverlay.classList.remove('show');
        customModal.classList.remove('show');
        setTimeout(() => {
            customModalOverlay.style.display = 'none';
            pendingProduct = null;
        }, 300);
    };

    // Recalcular subtotales, totales y badges del carrito
    const recalculateCart = () => {
        let subtotal = 0;
        let totalItems = 0;
        const items = cartItemsContainer.querySelectorAll('.cart-item');

        items.forEach(item => {
            const priceText = item.querySelector('.cart-item-price')?.textContent || '$0';
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            const qtyInput = item.querySelector('.cart-item-quantity input');
            const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
            subtotal += price * qty;
            totalItems += qty;
        });

        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;

        // Actualizar badges
        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.textContent = totalItems;
            badge.style.transform = 'scale(1.4)';
            setTimeout(() => badge.style.transform = 'scale(1)', 220);
        });
    };

    // Agregar producto al carrito
    const addProductToCart = (product, instructions) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';

        const noteHTML = instructions ? `
            <div class="cart-item-note">
                <i class="fas fa-comment-dots"></i> <span>"${escapeHTML(instructions)}"</span>
            </div>
        ` : '';

        itemEl.innerHTML = `
            <img src="${product.img || './images/fresas_crema.jpg'}" alt="${escapeHTML(product.name)}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'">
            <div class="cart-item-info">
                <h3 class="cart-item-title">${escapeHTML(product.name)}</h3>
                ${noteHTML}
                <p class="cart-item-desc">${escapeHTML(product.desc || '')}</p>
                <span class="cart-item-price">${escapeHTML(product.price || '$50.00')}</span>
                <div class="cart-item-quantity">
                    <button type="button" class="btn-qty-minus"><i class="fas fa-minus"></i></button>
                    <input type="number" value="1" min="1">
                    <button type="button" class="btn-qty-plus"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <button class="cart-item-delete" type="button" aria-label="Eliminar producto">
                <i class="far fa-trash-alt"></i>
            </button>
        `;

        cartItemsContainer.prepend(itemEl);
        recalculateCart();
    };

    // Agrega hotcakes ya personalizados desde su propio formulario.
    window.addHotcakeToCart = (product) => {
        addProductToCart(product, product.instructions || '');
        openCart();
    };

    // Interceptar clics en botones de agregar al carrito (.btn-add-cart)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add-cart');
        if (!btn) return;

        // Si el botón está dentro de un anchor con link a otra página, no lo interceptamos
        if (btn.closest('a[href]')) return;

        e.preventDefault();
        e.stopPropagation();

        const card = btn.closest('.product-card');
        if (!card) return;

        const name = card.querySelector('h3')?.textContent.trim() || 'Producto Especial';
        const price = card.querySelector('.product-price')?.textContent.trim() || '$50.00';
        const img = card.querySelector('.product-img')?.src || '';
        const desc = card.querySelector('.product-info p')?.textContent.trim() || '';

        openCustomModal({ name, price, img, desc });
    });

    // Confirmar en el modal de instrucciones
    if (btnCustomAddCart) {
        btnCustomAddCart.addEventListener('click', () => {
            if (!pendingProduct) return;
            const instructions = customModalInstructions.value.trim();
            addProductToCart(pendingProduct, instructions);
            closeCustomModal();

            // Abrir el carrito para ver el producto agregado con su comentario
            setTimeout(() => {
                openCart();
            }, 250);
        });
    }

    // Cerrar modal de instrucciones
    if (customModalClose) {
        customModalClose.addEventListener('click', closeCustomModal);
    }
    if (customModalOverlay) {
        customModalOverlay.addEventListener('click', (e) => {
            if (e.target === customModalOverlay) closeCustomModal();
        });
    }

    // Delegación de eventos para controles dentro del carrito (cantidad y eliminar)
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            const btnPlus = e.target.closest('.btn-qty-plus');
            const btnMinus = e.target.closest('.btn-qty-minus');
            const btnDelete = e.target.closest('.cart-item-delete');

            if (btnPlus) {
                const input = btnPlus.parentElement.querySelector('input');
                if (input) {
                    input.value = (parseInt(input.value) || 1) + 1;
                    recalculateCart();
                }
            } else if (btnMinus) {
                const input = btnMinus.parentElement.querySelector('input');
                if (input) {
                    const current = parseInt(input.value) || 1;
                    if (current > 1) {
                        input.value = current - 1;
                        recalculateCart();
                    }
                }
            } else if (btnDelete) {
                const item = btnDelete.closest('.cart-item');
                if (item) {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.9)';
                    item.style.transition = 'all 0.25s ease';
                    setTimeout(() => {
                        item.remove();
                        recalculateCart();
                    }, 250);
                }
            }
        });

        cartItemsContainer.addEventListener('input', (e) => {
            if (e.target.matches('.cart-item-quantity input')) {
                if (parseInt(e.target.value) < 1 || isNaN(parseInt(e.target.value))) {
                    e.target.value = 1;
                }
                recalculateCart();
            }
        });
    }

    // Abrir al hacer click en el icono del navbar
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        });
    }

    // Cerrar carrito
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (btnContinue) btnContinue.addEventListener('click', closeCart);
    if (cartOverlay) {
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) closeCart();
        });
    }

    // Cerrar modales con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCustomModal();
            closeCart();
        }
    });

    // Exponer funciones útiles globalmente
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.openProductCustomModal = openCustomModal;
    window.addProductToCart = addProductToCart;

    // Calcular totales iniciales
    recalculateCart();
});
