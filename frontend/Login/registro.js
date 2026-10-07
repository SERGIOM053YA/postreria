document.addEventListener('DOMContentLoaded', () => {
    // Apuntamos a tu nuevo servidor intermediario
    const API_URL = '../../api/registro.php';

    // Capturamos los elementos del formulario
    const form = document.querySelector('form'); 
    const nombreInput = form.querySelector('input[type="text"]'); // Asumiendo que el primero es el nombre
    const emailInput = form.querySelector('input[type="email"]');
    const passInput = form.querySelector('input[type="password"]');
    
    // Capturamos el botón del ojito y el de registro
    const togglePass = form.querySelector('.fa-eye, .fa-eye-slash') || document.querySelector('.toggle-password');
    const btnRegistro = form.querySelector('button[type="submit"]') || document.querySelector('.btn-login');

    // ==========================================
    // 1. LÓGICA DEL OJITO (Mostrar/Ocultar)
    // ==========================================
    if (togglePass && passInput) {
        togglePass.addEventListener('click', () => {
            const isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            
            // Cambiar el icono visualmente si usa FontAwesome
            if (togglePass.classList.contains('fa-eye') || togglePass.classList.contains('fa-eye-slash')) {
                togglePass.classList.toggle('fa-eye', !isPass);
                togglePass.classList.toggle('fa-eye-slash', isPass);
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DE LA LISTA DE REQUISITOS
    // ==========================================
    const reqLength = document.getElementById('req-length');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqLowercase = document.getElementById('req-lowercase');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');

    const validateRequirement = (element, isValid) => {
        if (!element) return;
        const icon = element.querySelector('i');
        if (isValid) {
            element.style.color = '#25D366'; // Verde WhatsApp (Completado)
            if (icon) {
                icon.classList.remove('fa-circle');
                icon.classList.add('fa-check-circle');
            }
        } else {
            element.style.color = '#666'; // Gris (Incompleto)
            if (icon) {
                icon.classList.remove('fa-check-circle');
                icon.classList.add('fa-circle');
            }
        }
    };

    if (passInput) {
        passInput.addEventListener('input', (e) => {
            const p = e.target.value;
            validateRequirement(reqLength, p.length >= 8 && p.length <= 20);
            validateRequirement(reqUppercase, /[A-Z]/.test(p));
            validateRequirement(reqLowercase, /[a-z]/.test(p));
            validateRequirement(reqNumber, /[0-9]/.test(p));
            validateRequirement(reqSpecial, /[!@#$%^&*(),.?":{}|<>]/.test(p));
        });
    }

    // ==========================================
    // 3. ENVÍO AL SERVIDOR NODE.JS
    // ==========================================
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validar que la contraseña cumpla todo antes de enviar
            const p = passInput.value;
            const isValidPass = p.length >= 8 && p.length <= 20 && 
                                /[A-Z]/.test(p) && /[a-z]/.test(p) && 
                                /[0-9]/.test(p) && /[!@#$%^&*(),.?":{}|<>]/.test(p);
            
            if(!isValidPass) {
                alert('Por favor, asegúrate de que la contraseña cumpla con todos los requisitos en verde.');
                return;
            }

            const textoOriginalBtn = btnRegistro.innerHTML;
            btnRegistro.disabled = true;
            btnRegistro.innerHTML = '<i class="fas fa-spinner fa-spin"></i> REGISTRANDO...';

            try {
                // Enviar datos al puente (Node.js)
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nombreInput ? nombreInput.value.trim() : '',
                        email: emailInput.value.trim(),
                        password: passInput.value
                    })
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.error || 'Error al registrar la cuenta');

                alert('Registro exitoso. ¡Bienvenido a Hilda\'s Postres!');
                window.location.href = '../Login/login.html'; // Te redirige al login

            } catch (error) {
                alert('Hubo un problema: ' + error.message);
                btnRegistro.disabled = false;
                btnRegistro.innerHTML = textoOriginalBtn;
            }
        });
    }
});