document.addEventListener('DOMContentLoaded', () => {
    const footerHTML = `
    <footer class="global-footer">
        <!-- Ola decorativa para fusionar con la página -->
        <div class="footer-wave">
            <svg viewBox="0 0 1440 50" preserveAspectRatio="none">
                <path fill="#fff0f3" d="M0,50 C360,0 720,50 1080,0 C1260,25 1380,50 1440,50 L1440,100 L0,100 Z" />
            </svg>
        </div>
        
        <div class="footer-content">
            <!-- Sección de Marca -->
            <div class="footer-section">
                <div class="footer-brand">
                    <img src="./logo.png" alt="Hilda's Postres" class="footer-logo" onerror="this.src='../logo.png'">
                    <h3>Hilda's Postres</h3>
                </div>
                <p class="footer-tagline">Dulces momentos, siempre contigo. <i class="fas fa-heart" style="color: #e95072;"></i></p>
            </div>

            <!-- Sección ¿Por qué elegirnos? -->
            <div class="footer-section">
                <h3 class="footer-title">¿POR QUÉ ELEGIRNOS?</h3>
                <ul class="footer-list">
                    <li><i class="fas fa-seedling"></i> <span><strong>Ingredientes frescos:</strong> Calidad premium.</span></li>
                    <li><i class="fas fa-heart"></i> <span><strong>Hecho con amor:</strong> Para ti.</span></li>
                    <li><i class="fas fa-smile-beam"></i> <span><strong>Variedad:</strong> Para cada antojo.</span></li>
                </ul>
            </div>

            <!-- Sección Haz tu pedido -->
            <div class="footer-section">
                <h3 class="footer-title">HAZ TU PEDIDO</h3>
                <ul class="footer-list">
                    <li><i class="fab fa-whatsapp"></i> <span>(123) 456 7890</span></li>
                    <li><i class="fab fa-instagram"></i> <span>@hildas.postres</span></li>
                    <li><i class="fas fa-motorcycle"></i> <span>Servicio a domicilio</span></li>
                </ul>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; 2026 Hilda's Postres & Snacks. Hecho con mucho <i class="fas fa-heart" style="color: #e95072;"></i></p>
        </div>
    </footer>`;
    
    document.body.insertAdjacentHTML('beforeend', footerHTML);
});