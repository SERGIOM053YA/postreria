const codeInputs = document.querySelectorAll('.code-input');
const newPassword = document.getElementById('new-password');
const confirmPassword = document.getElementById('confirm-password');
const btnSubmit = document.getElementById('btnSubmit');

const reqLength = document.getElementById('req-length');
const reqUppercase = document.getElementById('req-uppercase');
const reqLowercase = document.getElementById('req-lowercase');
const reqNumber = document.getElementById('req-number');
const reqSpecial = document.getElementById('req-special');
const matchMessage = document.getElementById('matchMessage');

// Navegación automática entre inputs de código
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

// Habilitar campos si están llenos los 6 dígitos del código
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

// Validación en tiempo real de la contraseña
newPassword.addEventListener('input', validatePassword);
confirmPassword.addEventListener('input', validatePassword);

function validatePassword() {
    const val = newPassword.value;
    const confirmVal = confirmPassword.value;

    // Validar reglas individuales
    validateRequirement(reqLength, val.length >= 8 && val.length <= 20);
    validateRequirement(reqUppercase, /[A-Z]/.test(val));
    validateRequirement(reqLowercase, /[a-z]/.test(val));
    validateRequirement(reqNumber, /[0-9]/.test(val));
    validateRequirement(reqSpecial, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val));

    // Validar coincidencia de contraseñas
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
    const icon = element.querySelector('i');
    if (isValid) {
        element.classList.add('valid');
        icon.className = 'fas fa-check-circle';
    } else {
        element.classList.remove('valid');
        icon.className = 'fas fa-circle';
    }
}

// Ocultar / Mostrar contraseña
setupTogglePassword('togglePassword1', 'new-password');
setupTogglePassword('togglePassword2', 'confirm-password');

function setupTogglePassword(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);

    btn.addEventListener('click', () => {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        btn.classList.toggle('fa-eye');
        btn.classList.toggle('fa-eye-slash');
    });
}