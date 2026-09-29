document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = 'https://abwqlettqauklpufupaa.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8';
    
    window.cliente = window.cliente || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const cliente = window.cliente;

    const codeInputs = document.querySelectorAll('.code-input');
    const emailInput = document.getElementById('email');
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    const btnSubmit = document.getElementById('btnSubmit');
    const resetForm = document.getElementById('resetForm');
    
    const reqLength = document.getElementById('req-length');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqLowercase = document.getElementById('req-lowercase');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');
    const matchMessage = document.getElementById('matchMessage');

    // Navegación de los 6 dígitos
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }
            checkCodeComplete();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                codeInputs[index - 1].focus();
            }
            setTimeout(checkCodeComplete, 10);
        });
    });

    function checkCodeComplete() {
        let code = Array.from(codeInputs).map(i => i.value).join('');
        if (code.length === 6) {
            newPassword.disabled = false;
            confirmPassword.disabled = false;
            btnSubmit.disabled = false;
        } else {
            newPassword.disabled = true;
            confirmPassword.disabled = true;
            btnSubmit.disabled = true;
        }
    }

    // Validación visual de contraseña
    newPassword.addEventListener('input', validatePassword);
    confirmPassword.addEventListener('input', validatePassword);

    function validatePassword() {
        const val = newPassword.value;
        const confirmVal = confirmPassword.value;

        validateRequirement(reqLength, val.length >= 8 && val.length <= 20);
        validateRequirement(reqUppercase, /[A-Z]/.test(val));
        validateRequirement(reqLowercase, /[a-z]/.test(val));
        validateRequirement(reqNumber, /[0-9]/.test(val));
        validateRequirement(reqSpecial, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val));

        if (confirmVal.length > 0) {
            if (val === confirmVal) {
                matchMessage.textContent = "¡Las contraseñas coinciden!";
                matchMessage.className = "match-message success";
            } else {
                matchMessage.textContent = "Las contraseñas no coinciden.";
                matchMessage.className = "match-message error";
            }
        } else {
            matchMessage.style.display = "none";
        }
    }

    function validateRequirement(element, isValid) {
        if (!element) return;
        const icon = element.querySelector('i');
        if (isValid) {
            element.classList.add('valid');
            if (icon) icon.className = 'fas fa-check-circle';
        } else {
            element.classList.remove('valid');
            if (icon) icon.className = 'fas fa-circle';
        }
    }

    setupTogglePassword('togglePassword1', 'new-password');
    setupTogglePassword('togglePassword2', 'confirm-password');

    function setupTogglePassword(btnId, inputId) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        if (!btn || !input) return;
        btn.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            btn.classList.toggle('fa-eye');
            btn.classList.toggle('fa-eye-slash');
        });
    }

    // Reenviar código
    const linkReenviar = document.querySelector('.reset-footer-links a');
    if (linkReenviar) {
        linkReenviar.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            if (!email) return alert("Ingresa tu correo en el campo superior primero.");

            linkReenviar.textContent = "Enviando...";
            const { error } = await cliente.auth.resetPasswordForEmail(email);
            if (error) alert("Error: " + error.message);
            else alert("Código enviado. Revisa tu bandeja.");
            linkReenviar.textContent = "Reenviar código";
        });
    }

    // Flujo Supabase: Verificar OTP y Actualizar Contraseña
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const token = Array.from(codeInputs).map(i => i.value).join('');
        const password = newPassword.value;

        if (password !== confirmPassword.value) return alert('Las contraseñas no coinciden.');

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'PROCESANDO...';

        const { error: otpError } = await cliente.auth.verifyOtp({ email, token, type: 'recovery' });
        if (otpError) {
            alert('Código inválido o expirado: ' + otpError.message);
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'RESTABLECER CONTRASEÑA';
            return;
        }

        const { error: updateError } = await cliente.auth.updateUser({ password });
        if (updateError) {
            alert('Error al actualizar: ' + updateError.message);
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'RESTABLECER CONTRASEÑA';
            return;
        }

        alert('¡Contraseña actualizada con éxito!');
        window.location.href = '../Login/login.html';
    });
});