// ==========================================
// 1. CLIENTE SUPABASE & SESIÓN
// ==========================================
const SUPABASE_URL = 'https://axcgteybbxagctuvqtlf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Y2d0ZXliYnhhZ2N0dXZxdGxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTgxMDQsImV4cCI6MjEwNTIzNDEwNH0.hciK65GK8FIwpdRSrRteBKfMBbR-6HMweZQqvz9RZP8';
const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let cart = [];
let pendingProduct = null;
let currentUser = null;
let esAdmin = false;

// Variables Modales
let hkMaxFruta = 1;
let hkMaxTopping = 1;
let selectedHkFrutas = [];
let selectedHkToppings = [];
let extraPapasCount = 1;
let hasPapasOption = false;

document.addEventListener('DOMContentLoaded', async () => {
    await verificarSesion();
    renderOrders();

    document.querySelectorAll('.pill-btn:not(.hk-f-btn):not(.hk-t-btn)').forEach(btn => {
        btn.addEventListener('click', function () {
            const type = this.getAttribute('data-type');
            if (type) {
                document.querySelectorAll(`.pill-btn[data-type="${type}"]`).forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
});

async function verificarSesion() {
    try {
        const { data: { session }, error } = await cliente.auth.getSession();
        if (error || !session) return; 

        currentUser = session.user;

        const { data: perfil } = await cliente
            .from('perfiles')
            .select('rol')
            .eq('id', currentUser.id)
            .single();

        if ((perfil && perfil.rol === 'Administrador') || currentUser.email.toLowerCase() === 'admin@reposteria.com') {
            esAdmin = true;
        }

        if (esAdmin) {
            const adminPanel = document.getElementById('admin-panel-global');
            if (adminPanel) adminPanel.style.display = 'block';
        }

        const userBtn = document.querySelector('.login-header-btn');
        if (userBtn) {
            const rolDisplay = (perfil && perfil.rol) ? perfil.rol : 'Cliente';
            userBtn.innerHTML = `<i class="fas fa-user-circle"></i> <span>${currentUser.email.split('@')[0]} (${rolDisplay})</span>`;
            userBtn.href = "#";
            userBtn.onclick = async (e) => {
                e.preventDefault();
                if (confirm('¿Deseas cerrar sesión?')) {
                    await cliente.auth.signOut();
                    localStorage.clear();
                    window.location.href = '../Login/login.html';
                }
            };
        }
    } catch (err) {
        console.error("Error verificando la sesión:", err);
    }
}

// ==========================================
// 2. MODALES Y AGREGADO AL CARRITO
// ==========================================
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }

function openNoteModal(id, productName, price, details = '') {
    pendingProduct = { id: id, name: productName, price: price, details: details };
    document.getElementById('note-modal-title').textContent = `📝 ${productName}`;
    document.getElementById('product-note-input').value = '';
    document.getElementById('note-modal').style.display = 'flex';
}

function confirmAddWithNote() {
    if (!pendingProduct) return;
    const note = document.getElementById('product-note-input').value.trim();
    addToCart(pendingProduct.id, pendingProduct.name, pendingProduct.price, pendingProduct.details, note);
    closeModal('note-modal');
    pendingProduct = null;
}

function openCrepaModal() { document.getElementById('crepa-modal').style.display = 'flex'; }

function addCustomCrepa() {
    const base = document.querySelector('.pill-btn.active[data-type="base"]')?.textContent || 'Lechera';
    const fruta = document.querySelector('.pill-btn.active[data-type="fruta"]')?.textContent || 'Fresa';
    const topping = document.querySelector('.pill-btn.active[data-type="topping"]')?.textContent || 'Nuez';
    
    let extraCost = 0;
    let extrasList = [];
    document.querySelectorAll('.extra-item:checked').forEach(item => {
        extraCost += parseFloat(item.value);
        extrasList.push(item.getAttribute('data-name'));
    });

    const totalPrice = 60 + extraCost;
    let details = `Base: ${base}, Fruta: ${fruta}, Topping: ${topping}`;
    if (extrasList.length > 0) details += ` | Extras: ${extrasList.join(', ')}`;

    closeModal('crepa-modal');
    openNoteModal('Crepa Personalizada', totalPrice, details);
}

function openSalsaModal(productName, price, hasPapas = false) {
    pendingProduct = { name: productName, price: price };
    hasPapasOption = hasPapas;
    extraPapasCount = 1;
    document.getElementById('salsa-modal-title').textContent = `🍗 Salsa para ${productName}`;
    document.getElementById('papas-extra-container').style.display = hasPapas ? 'block' : 'none';
    if (hasPapas) updatePapasDisplay();
    document.getElementById('salsa-modal').style.display = 'flex';
}

function changePapasQty(change) {
    if (extraPapasCount + change >= 1) {
        extraPapasCount += change;
        updatePapasDisplay();
    }
}

function updatePapasDisplay() {
    const grams = extraPapasCount * 100;
    const extraPrice = (extraPapasCount - 1) * 15;
    document.getElementById('papas-qty-display').textContent = `${extraPapasCount} porción(es) (${grams}g) ${extraPrice > 0 ? '(+$' + extraPrice + ' MXN)' : ''}`;
}

function addSalsaProduct() {
    const salsa = document.getElementById('salsa-select').value;
    let price = pendingProduct.price;
    let details = `Salsa: ${salsa}`;
    if (hasPapasOption) {
        const extraPapas = extraPapasCount - 1;
        details += extraPapas > 0 ? ` | Papas: ${extraPapasCount * 100}g (+${extraPapas} extra)` : ` | Papas: 100g incluidos`;
        price += extraPapas * 15;
    }
    closeModal('salsa-modal');
    openNoteModal(pendingProduct.name, price, details);
}

function openHotcakesModal(title, price, maxFruta, maxTopping) {
    pendingProduct = { name: `Mini Hotcakes ${title}`, price: price };
    hkMaxFruta = maxFruta;
    hkMaxTopping = maxTopping;
    selectedHkFrutas = [];
    selectedHkToppings = [];
    document.getElementById('hotcakes-modal-title').textContent = `🥞 ${title} ($${price})`;
    document.querySelectorAll('.hk-f-btn, .hk-t-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('hotcakes-modal').style.display = 'flex';
}

function toggleHkSelection(btn, type) {
    const val = btn.getAttribute('data-val');
    if (type === 'fruta') {
        if (selectedHkFrutas.includes(val)) {
            selectedHkFrutas = selectedHkFrutas.filter(item => item !== val);
            btn.classList.remove('active');
        } else if (selectedHkFrutas.length < hkMaxFruta) {
            selectedHkFrutas.push(val);
            btn.classList.add('active');
        }
    } else if (type === 'topping') {
        if (selectedHkToppings.includes(val)) {
            selectedHkToppings = selectedHkToppings.filter(item => item !== val);
            btn.classList.remove('active');
        } else if (selectedHkToppings.length < hkMaxTopping) {
            selectedHkToppings.push(val);
            btn.classList.add('active');
        }
    }
}

function addHotcakesProduct() {
    if (selectedHkFrutas.length === 0 || selectedHkToppings.length === 0) return alert('Selecciona al menos 1 fruta y 1 topping.');
    const details = `Frutas: ${selectedHkFrutas.join(', ')} | Toppings: ${selectedHkToppings.join(', ')}`;
    closeModal('hotcakes-modal');
    openNoteModal(pendingProduct.name, pendingProduct.price, details);
}

function openDrinkFlavorModal(drinkName, price, flavors) {
    pendingProduct = { name: drinkName, price: price };
    document.getElementById('drink-modal-title').textContent = `🥤 ${drinkName}`;
    const select = document.getElementById('drink-flavor-select');
    select.innerHTML = '';
    flavors.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        select.appendChild(opt);
    });
    document.getElementById('drink-comment').value = '';
    document.getElementById('drink-flavor-modal').style.display = 'flex';
}

function addDrinkProduct() {
    const flavor = document.getElementById('drink-flavor-select').value;
    const comment = document.getElementById('drink-comment').value.trim();
    closeModal('drink-flavor-modal');
    addToCart(null, `${pendingProduct.name} (${flavor})`, pendingProduct.price, `Sabor: ${flavor}`, comment);
}

// ==========================================
// 3. LÓGICA DEL CARRITO
// ==========================================
function addToCart(productId, name, price, details = '', note = '') {
    const existingIndex = cart.findIndex(item => item.name === name && item.details === details && item.note === note);
    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({ 
            productId: productId || 1, 
            uniqueId: Date.now(), 
            name: name, 
            price: price, 
            details: details, 
            note: note, 
            qty: 1 
        });
    }
    renderCart();
    openCart();
}

function updateQuantity(id, change) {
    const index = cart.findIndex(item => item.uniqueId === id);
    if (index > -1) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) cart.splice(index, 1);
    }
    renderCart();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.uniqueId !== id);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const badge = document.querySelector('.cart-badge');
    const totalPriceEl = document.getElementById('cart-total-price');

    container.innerHTML = '';
    let total = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p class="cart-empty-msg">Tu carrito está vacío 🍧<br>¡Agrega algo delicioso!</p>';
    } else {
        cart.forEach(item => {
            total += item.price * item.qty;
            totalItems += item.qty;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div class="cart-item-info">
                    <h5>${item.name}</h5>
                    ${item.details ? `<p>${item.details}</p>` : ''}
                    ${item.note ? `<p class="cart-item-note">Nota: "${item.note}"</p>` : ''}
                    <p><strong>$${item.price.toFixed(2)} c/u</strong></p>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.uniqueId}, -1)">-</button>
                    <span class="cart-item-qty">${item.qty}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.uniqueId}, 1)">+</button>
                    <i class="fas fa-trash-alt delete-btn" onclick="removeFromCart(${item.uniqueId})"></i>
                </div>
            `;
            container.appendChild(itemDiv);
        });
    }
    totalPriceEl.textContent = `$${total.toFixed(2)} MXN`;
    if (badge) badge.textContent = totalItems;
}

function openCart() {
    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('cart-drawer-overlay').classList.add('active');
}

function closeCart() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('cart-drawer-overlay').classList.remove('active');
}

// ==========================================
// 4. CHECKOUT NORMALIZADO HACIA PHP
// ==========================================
async function checkout() {
    if (cart.length === 0) return alert('Tu carrito está vacío.');
    
    const { data: { session } } = await cliente.auth.getSession();
    if (!session) {
        alert('Por favor inicia sesión para realizar un pedido.');
        window.location.href = '../Login/login.html';
        return;
    }
    currentUser = session.user;

    const pagoEfectivo = confirm('¿Pagas en Efectivo al recibir? (Cancelar = Transferencia SPEI)');
    const metodoPago = pagoEfectivo ? 'Efectivo' : 'Transferencia SPEI';
    const aDomicilio = confirm('¿Es pedido A Domicilio? (Cancelar = Recoger en Local)');
    
    let lat = null, lon = null, direccion = 'Recoger en Mostrador';
    
    if (aDomicilio) {
        direccion = prompt('Ingresa tu dirección de entrega en Mathzi 2:') || 'Calle local';
        lat = 19.6030000; 
        lon = -99.0530000;
    }

    // Empaquetar la orden para PHP incluyendo las notas
    const payload = {
        cliente_nombre: currentUser.user_metadata?.nombre || currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
        cliente_telefono: "5512345678",
        tipo_entrega: aDomicilio ? 'A Domicilio' : 'Recoger en Local',
        metodo_pago: metodoPago,
        direccion_entrega: direccion,
        latitud: lat,
        longitud: lon,
        items: cart.map(item => {
            let textoDetalles = '';
            if (item.details) textoDetalles += item.details;
            if (item.note) textoDetalles += (textoDetalles ? ' | Nota: ' : 'Nota: ') + item.note;

            return {
                producto_id: item.productId || 1,
                cantidad: item.qty,
                precio_unitario: item.price,
                detalles: textoDetalles // <-- Envía la nota amarilla
            };
        })
    };

    try {
        const tokenLocal = localStorage.getItem('sb_access_token');
        const response = await fetch('../api/pedidos.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenLocal}`
            },
            body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || 'Error al enviar pedido');
        }

        cart = [];
        renderCart();
        closeCart();
        renderOrders();

        alert(`¡Orden #${responseData.id_orden || Math.floor(Math.random() * 1000)} enviada exitosamente a la cocina!`);
        document.getElementById('pedidos-section')?.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        alert('Error al enviar el pedido: ' + error.message);
    }
}

function renderOrders() {
    const ordersList = document.getElementById('orders-list');
    const storedOrders = JSON.parse(localStorage.getItem('hildas_orders') || '[]');

    if (!ordersList) return;

    if (storedOrders.length === 0) {
        ordersList.innerHTML = '<p class="no-orders-msg">No hay pedidos registrados aún.</p>';
        return;
    }

    ordersList.innerHTML = '';
    storedOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        let itemsHtml = order.items.map(item => `
            <li>
                <strong>${item.qty}x ${item.name}</strong> - $${(item.price * item.qty).toFixed(2)}
                ${item.details ? `<br><small style="color: #8d7b7a;">${item.details}</small>` : ''}
                ${item.note ? `<br><small style="color: #ff6584;">Nota: ${item.note}</small>` : ''}
            </li>
        `).join('');

        orderCard.innerHTML = `
            <div class="order-header">
                <span><i class="fas fa-receipt"></i> ${order.id}</span>
                <span><i class="fas fa-clock"></i> ${order.status || 'En Proceso'}</span>
            </div>
            <div class="order-body">
                <ul>${itemsHtml}</ul>
            </div>
            <div class="order-footer">
                Total: $${order.total.toFixed(2)} MXN
            </div>
        `;
        ordersList.appendChild(orderCard);
    });
}