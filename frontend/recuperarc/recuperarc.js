document.addEventListener('DOMContentLoaded', () => {
    const API_REQUEST = '../../api/recuperar.php';
    const API_VERIFY = '../../api/verificar.php';

    const codeInputs = document.querySelectorAll('.code-input');
    const emailInput = document.getElementById('email');
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    const btnSubmit = document.getElementById('btnSubmit');
    const resetForm = document.getElementById('resetForm');
    const btnSendCode = document.getElementById('btnSendCode');
    const linkReenviar = document.querySelector('.reset-footer-links a');
    
    const reqLength = document.getElementById('req-length');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqLowercase = document.getElementById('req-lowercase');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');
    const matchMessage = document.getElementById('matchMessage');

    async function pedirCodigo(boton, textoOriginal) {
        const email = emailInput.value.trim();
        if (!email || !email.includes('@')) return alert("Por favor, ingresa un correo válido.");

        boton.disabled = true;
        boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando código...';

        try {
            const response = await fetch(API_REQUEST, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            alert("✅ ¡Código enviado con éxito! Revisa tu bandeja.");
            boton.innerHTML = '<i class="fas fa-check"></i> Código Enviado';
        } catch (error) {
            alert("Fallo el envío: " + error.message);
            boton.innerHTML = textoOriginal;
            boton.disabled = false;
        }
    }

    if (btnSendCode) {
        // 1. ELIMINADOR DE DUPLICADOS: Borra la orden del HTML para que solo actúe el JS
        btnSendCode.removeAttribute('onclick');

        // 2. Única orden de envío
        btnSendCode.addEventListener('click', (e) => {
            e.preventDefault();
            pedirCodigo(btnSendCode, '<i class="fas fa-paper-plane"></i> Solicitar Código');
        });
    }

    if (linkReenviar) {
        linkReenviar.addEventListener('click', (e) => {
            e.preventDefault();
            pedirCodigo(linkReenviar, 'Reenviar código');
        });
    }

    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < codeInputs.length - 1) codeInputs[index + 1].focus();
            checkCodeComplete();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) codeInputs[index - 1].focus();
            setTimeout(checkCodeComplete, 10);
        });
    });

    function checkCodeComplete() {
    let code = Array.from(codeInputs).map(i => i.value).join('');
    // Cambiamos a 8 dígitos
    const isComplete = code.length === 8;
    newPassword.disabled = !isComplete;
    confirmPassword.disabled = !isComplete;
    btnSubmit.disabled = !isComplete;
    }

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
            matchMessage.textContent = val === confirmVal ? "¡Las contraseñas coinciden!" : "Las contraseñas no coinciden.";
            matchMessage.className = val === confirmVal ? "match-message success" : "match-message error";
            matchMessage.style.display = "block";
        } else {
            matchMessage.style.display = "none";
        }
    }

    function validateRequirement(element, isValid) {
        if (!element) return;
        const icon = element.querySelector('i');
        element.style.color = isValid ? '#25D366' : '#887275';
        if (icon) {
            icon.className = isValid ? 'fas fa-check-circle' : 'fas fa-circle';
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

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const token = Array.from(codeInputs).map(i => i.value).join('');
        const password = newPassword.value;

        if (password !== confirmPassword.value) return alert('Las contraseñas no coinciden.');

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO...';

        try {
            const response = await fetch(API_VERIFY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, password })
            });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error);

            alert('¡Contraseña actualizada con éxito!');
            window.location.href = '../Login/login.html';
        } catch (error) {
            alert('Error: ' + error.message);
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'RESTABLECER CONTRASEÑA';
        }
    });
});