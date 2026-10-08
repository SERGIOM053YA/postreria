// 1. Apuntamos al servidor Node.js (Ya no hay llaves de Supabase expuestas)
// Apuntamos al nuevo servidor intermediario en PHP
const API_PRODUCTOS = '../api/productos.php';

// Función puente: Busca por palabra clave para evitar errores de coincidencia
function obtenerImagenLocal(nombreProducto) {
    const n = nombreProducto.trim().toLowerCase();
    
    if (n.includes('crepa')) return './images/crepa.jpg';
    if (n.includes('hot cake') || n.includes('hotcake')) return './images/mini_hotcakes.jpg';
    if (n.includes('frappé') || n.includes('frappe')) return './images/frappe_oreo.jpg'; 
    if (n.includes('fresa') || n.includes('eskimo')) return './images/fresas_crema.jpg';
    if (n.includes('alita')) return './images/alitas.jpg';
    if (n.includes('boneless')) return './images/boneless.jpg';
    if (n.includes('flan')) return './images/flan_napolitano.jpg';
    if (n.includes('imposible')) return './images/pastel_imposible.jpg';
    if (n.includes('manzana')) return './images/ensalada_manzana.jpg';
    if (n.includes('gelatina')) return './images/gelatina_crema.jpg';
    if (n.includes('uva')) return './images/uvas_crema.jpg';
    if (n.includes('arroz')) return './images/arroz_leche.jpg';
    
    return './logo.png';
}

// 2. Función principal para descargar y pintar el menú desde PHP
async function cargarCatalogoInicio() {
    const grid = document.getElementById('catalogo-grid');
    if (!grid) return;

    grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--primary-pink); font-weight: bold;">Cargando catálogo oficial...</p>';

    try {
        // Hacemos la petición a tu servidor PHP local
        const respuesta = await fetch(API_PRODUCTOS);
        if (!respuesta.ok) throw new Error('Error en la conexión con el servidor');
        
        const productosBD = await respuesta.json();
        
        // Filtramos los que no son de temporada y limitamos a 6
        const productos = productosBD.filter(p => !p.es_temporada).slice(0, 6);
        
        grid.innerHTML = ''; 

        productos.forEach((prod, index) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.producto_id = prod.id;
            
            const imagenSource = obtenerImagenLocal(prod.nombre);

            // 1. Evaluamos la disponibilidad real de la base de datos
            const estaDisponible = prod.disponible !== false;

            // 2. Control de etiquetas (Priorizamos "Agotado" sobre "Más vendido")
            let badgeHtml = '';
            if (!estaDisponible) {
                badgeHtml = '<div class="bestseller-badge" style="background-color: #81747a;">Agotado</div>';
            } else if (prod.nombre.toLowerCase().includes('fresa') || index === 0) {
                badgeHtml = '<div class="bestseller-badge">Más vendido</div>';
            }

            // 3. Control del botón y la opacidad visual
            const btnHtml = estaDisponible 
                ? `<button class="btn-add-cart"><i class="fas fa-plus"></i></button>`
                : `<button class="btn-add-cart" disabled style="background-color: #ccc; cursor: not-allowed; border: none;"><i class="fas fa-ban"></i></button>`;

            const imgFiltro = estaDisponible ? '' : 'style="filter: grayscale(100%); opacity: 0.6;"';
            const infoEstilo = estaDisponible ? '' : 'style="opacity: 0.6;"';

            card.innerHTML = `
                ${badgeHtml}
                <div class="product-img-wrapper">
                    <img src="${imagenSource}" alt="${prod.nombre}" class="product-img" ${imgFiltro}>
                </div>
                <div class="product-info" ${infoEstilo}>
                    <h3>${prod.nombre}</h3>
                    <p>${prod.descripcion || 'Delicioso postre preparado con los mejores ingredientes.'}</p>
                    <div class="product-footer">
                        <span class="product-price">$${Number(prod.precio).toFixed(2)}</span>
                        ${btnHtml}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar productos:', error.message);
        grid.innerHTML = '<p style="text-align:center; width:100%; color: #e95072;">Error al conectar con el servidor PHP.</p>';
    }
}

// 3. Sincronizador visual de sesión
function sincronizarSesionVisual() {
    const tokenLocal = localStorage.getItem('sb_access_token');
    const userEmail = localStorage.getItem('sb_user_email');
    
    if (tokenLocal && userEmail) {
        const nombre = userEmail.split('@')[0];
        const intervalo = setInterval(() => {
            const loginBtn = document.getElementById('login-btn');
            const adminBtn = document.getElementById('admin-btn');
            
            if (loginBtn) {
                clearInterval(intervalo); 
                loginBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i><span>Salir (${nombre})</span>`;
                loginBtn.href = '#';
                loginBtn.style.backgroundColor = '#f8e7ec'; 
                loginBtn.style.color = '#8d3d54';
                loginBtn.style.borderColor = '#ffccd8';
                
                loginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('¿Deseas cerrar sesión?')) {
                        localStorage.removeItem('sb_access_token');
                        localStorage.removeItem('sb_user_email');
                        window.location.reload(); 
                    }
                });

                if (userEmail.toLowerCase() === 'admin@reposteria.com' && adminBtn) {
                    adminBtn.style.display = 'inline-flex';
                }
            }
        }, 100);
    }
}


// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogoInicio();
    sincronizarSesionVisual();
});