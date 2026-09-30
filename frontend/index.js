// 1. Configuración del Cliente Supabase
const SUPABASE_URL = 'https://abwqlettqauklpufupaa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8';
window.cliente = window.cliente || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const cliente = window.cliente;

// Función puente: Convierte el texto a minúsculas
function obtenerImagenLocal(nombreProducto) {
    const nombreNormalizado = nombreProducto.trim().toLowerCase();
    const mapaImagenes = {
        "fresas con crema": "./images/fresas_crema.jpg",
        "mini hot cakes": "./images/mini_hotcakes.jpg",
        "flan napolitano rebanada": "./images/flan_napolitano.jpg",
        "flan napolitano": "./images/flan_napolitano.jpg",
        "pastel imposible": "./images/pastel_imposible.jpg",
        "ensalada de manzana": "./images/ensalada_manzana.jpg",
        "gelatina con crema": "./images/gelatina_crema.jpg",
        "uvas con crema": "./images/uvas_crema.jpg",
        "arroz con leche": "./images/arroz_leche.jpg"
    };
    return mapaImagenes[nombreNormalizado] || "./logo.png";
}

// 2. Función principal para descargar y pintar el menú
async function cargarCatalogoInicio() {
    const grid = document.getElementById('catalogo-grid');
    if (!grid) return;

    grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--primary-pink); font-weight: bold;">Cargando catálogo oficial...</p>';

    const { data: productos, error } = await cliente
        .from('productos')
        .select('*')
        .eq('es_temporada', false)
        .limit(4);

    if (error) {
        console.error('Error al cargar productos:', error.message);
        grid.innerHTML = '<p style="text-align:center; width:100%; color: red;">Error al conectar con la base de datos.</p>';
        return;
    }

    grid.innerHTML = ''; 

    productos.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.id = `product-${prod.id}`;
        card.dataset.producto_id = prod.id;
        
        const imagenSource = obtenerImagenLocal(prod.nombre);

        card.innerHTML = `
            <div class="product-img-wrapper">
                <img src="${imagenSource}" alt="${prod.nombre}" class="product-img">
            </div>
            <div class="product-info">
                <h3>${prod.nombre}</h3>
                <p>${prod.descripcion || 'Delicioso postre preparado con los mejores ingredientes.'}</p>
                <div class="product-footer">
                    <span class="product-price">$${prod.precio.toFixed(2)}</span>
                    <button class="btn-add-cart"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogoInicio();
});