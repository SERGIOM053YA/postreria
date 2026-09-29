document.addEventListener('DOMContentLoaded', () => {
    // 1. Credenciales de Supabase
    const SUPABASE_URL = 'https://abwqlettqauklpufupaa.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8';
    
    window.cliente = window.cliente || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const cliente = window.cliente;

    const form = document.getElementById('registerForm');
    const nombreInput = document.getElementById('nombre');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    const togglePass = document.getElementById('togglePassword');
    const btnSubmit = document.getElementById('btnSubmit');
    const statusDiv = document.getElementById('register-status');

    const reqLength = document.getElementById('req-length');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqLowercase = document.getElementById('req-lowercase');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');

    // Ocultar/Mostrar Contraseña
    if (togglePass) {
        togglePass.addEventListener('click', () => {
            const isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            togglePass.classList.toggle('fa-eye', !isPass);
            togglePass.classList.toggle('fa-eye-slash', isPass);
        });
    }

    // Validación visual de contraseña
    passInput.addEventListener('input', () => {
        const val = passInput.value;
        validarCheck(reqLength, val.length >= 8 && val.length <= 20);
        validarCheck(reqUppercase, /[A-Z]/.test(val));
        validarCheck(reqLowercase, /[a-z]/.test(val));
        validarCheck(reqNumber, /[0-9]/.test(val));
        validarCheck(reqSpecial, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val));
    });

    function validarCheck(item, esValido) {
        if (!item) return;
        const icon = item.querySelector('i');
        item.classList.toggle('valid', esValido);
        if (icon) icon.className = esValido ? 'fas fa-check-circle' : 'fas fa-circle';
    }

    function mostrarEstado(mensaje, esError = false) {
        statusDiv.style.display = 'block';
        statusDiv.textContent = mensaje;
        if (esError) {
            statusDiv.style.background = '#ffe5e5';
            statusDiv.style.color = '#d90429';
            statusDiv.style.border = '1px solid #ffb3b3';
        } else {
            statusDiv.style.background = '#e6fcf5';
            statusDiv.style.color = '#0ca678';
            statusDiv.style.border = '1px solid #b2f2bb';
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const val = passInput.value;
        const isLengthValid = val.length >= 8 && val.length <= 20;
        const hasUpper = /[A-Z]/.test(val);
        const hasLower = /[a-z]/.test(val);
        const hasNumber = /[0-9]/.test(val);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);

        if (!isLengthValid || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            mostrarEstado('La contraseña no cumple los requisitos.', true);
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> REGISTRANDO...';
        mostrarEstado('Creando tu cuenta...', false);

        // Registro en Supabase guardando el nombre en los metadatos
        const { data, error } = await cliente.auth.signUp({
            email: emailInput.value.trim(),
            password: val,
            options: {
                data: {
                    nombre: nombreInput.value.trim()
                }
            }
        });

        if (error) {
            mostrarEstado('Error al registrar: ' + error.message, true);
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'REGISTRARSE';
            return;
        }

        mostrarEstado('¡Cuenta creada con éxito! Redirigiendo...', false);
        
        // Al registrarse, Supabase suele iniciar sesión automáticamente
        if (data.session) {
            localStorage.setItem('sb_access_token', data.session.access_token);
            localStorage.setItem('sb_user_id', data.user.id);
            localStorage.setItem('sb_user_email', data.user.email);
            setTimeout(() => { window.location.href = '../index.html'; }, 1000);
        } else {
            // Por si tienes confirmación de correos activada
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        }
    });
});