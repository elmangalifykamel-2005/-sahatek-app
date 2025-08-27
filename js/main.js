// =================================================================
// 1. تعريف متغيرات واجهة المستخدم (DOM Elements)
// =================================================================
const htmlTag = document.documentElement;
const body = document.body;
const languageScreen = document.getElementById('language-selection-screen');
const authOptionsScreen = document.getElementById('auth-options-screen');
const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');
const homeScreen = document.getElementById('home-screen');
const mainHeader = document.getElementById('main-header');
const menuButton = document.getElementById('menu-button');
const sideMenu = document.getElementById('side-menu');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const langButtonsContainer = languageScreen.querySelector('.language-buttons');
const goToLoginScreenBtn = document.getElementById('go-to-login-screen-btn');
const goToRegisterScreenBtn = document.getElementById('go-to-register-screen-btn');
const backToRegisterLink = document.getElementById('back-to-register-from-login');
const backToLoginLink = document.getElementById('back-to-login-from-register');

// =================================================================
// 2. دوال أساسية (الترجمة، إظهار الشاشات، القائمة)
// =================================================================
function setLanguage(lang) {
    htmlTag.setAttribute('lang', lang);
    htmlTag.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(el => {
        const key = el.getAttribute('data-translate');
        if (window.translations && translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    document.title = (window.translations && translations[lang]) ? translations[lang].appName : "Healthy Wealthy";
}

function showScreen(screenToShow) {
    const screens = [languageScreen, authOptionsScreen, loginScreen, registerScreen, homeScreen];
    screens.forEach(screen => screen.classList.remove('active'));
    mainHeader.classList.toggle('hidden', screenToShow !== homeScreen);
    screenToShow.classList.add('active');
}

function toggleOverlay() {
    let overlay = document.getElementById('overlay');
    if (sideMenu.classList.contains('active')) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'overlay';
            body.appendChild(overlay);
            overlay.addEventListener('click', () => {
                sideMenu.classList.remove('active');
                toggleOverlay();
            });
        }
    } else {
        if (overlay) {
            overlay.remove();
        }
    }
}

// =================================================================
// 3. ربط الأحداث (Event Listeners)
// =================================================================
langButtonsContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        setLanguage(e.target.getAttribute('data-lang'));
        showScreen(authOptionsScreen);
    }
});
goToLoginScreenBtn.addEventListener('click', () => showScreen(loginScreen));
goToRegisterScreenBtn.addEventListener('click', () => showScreen(registerScreen));
backToRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showScreen(registerScreen); });
backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showScreen(loginScreen); });
menuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    sideMenu.classList.toggle('active');
    toggleOverlay();
});

// --- أحداث المصادقة الحقيقية ---
registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert("تم إنشاء حسابك بنجاح!");
        })
        .catch((error) => {
            const errorCode = error.code;
            if (errorCode === 'auth/email-already-in-use') {
                alert("هذا البريد الإلكتروني مسجل بالفعل.");
            } else if (errorCode === 'auth/weak-password') {
                alert("كلمة المرور ضعيفة جداً (6 أحرف على الأقل).");
            } else {
                alert("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
            }
        });
});

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert("أهلاً بعودتك!");
        })
        .catch((error) => {
            alert("البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.");
        });
});

// =================================================================
// 4. مراقبة حالة المصادقة (الحارس)
// =================================================================
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("المستخدم مسجل دخوله:", user.email);
        setLanguage('ar');
        showScreen(homeScreen);
    } else {
        console.log("لا يوجد مستخدم مسجل دخوله.");
        setLanguage('ar');
        showScreen(languageScreen);
    }
});
