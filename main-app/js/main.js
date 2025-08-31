document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // تهيئة الخدمات والمتغيرات العامة
    // =================================================================
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    
    let currentUser = null;
    let currentLanguage = localStorage.getItem('language') || 'ar';
    let previousScreenId = null;

    // =================================================================
    // الوظائف الأساسية (Core Functions)
    // =================================================================

    /**
     * يعرض شاشة محددة ويخفي البقية
     * @param {string} screenId - معرف الشاشة المطلوب عرضها
     * @param {boolean} isBackAction - هل هذا الإجراء هو "رجوع"؟
     */
    const showScreen = (screenId, isBackAction = false) => {
        const screenToShow = document.getElementById(screenId);
        if (!screenToShow) {
            console.error(`Screen with id "${screenId}" not found.`);
            return;
        }

        const activeScreen = document.querySelector('main > section.active');
        if (activeScreen && !isBackAction) {
            previousScreenId = activeScreen.id;
        }

        document.querySelectorAll('main > section').forEach(s => s.classList.remove('active'));
        screenToShow.classList.add('active');

        // التحكم في ظهور عناصر الهيدر
        const isAuthScreen = screenToShow.classList.contains('auth-screen');
        document.getElementById('main-header').classList.toggle('hidden', isAuthScreen);
        document.getElementById('profile-button').classList.toggle('hidden', isAuthScreen);
        document.getElementById('menu-button').classList.toggle('hidden', screenId !== 'home-screen');
        document.getElementById('back-button').classList.toggle('hidden', screenId === 'home-screen' || isAuthScreen);

        // إغلاق القائمة الجانبية عند التنقل
        const sideMenu = document.getElementById('side-menu');
        if (sideMenu.classList.contains('active')) {
            toggleSideMenu(false);
        }
    };

    /**
     * يفتح أو يغلق القائمة الجانبية
     * @param {boolean|null} forceState - يمكن استخدامه لفرض الفتح أو الإغلاق
     */
    const toggleSideMenu = (forceState = null) => {
        const sideMenu = document.getElementById('side-menu');
        const shouldBeActive = forceState === null ? !sideMenu.classList.contains('active') : forceState;
        sideMenu.classList.toggle('active', shouldBeActive);

        let overlay = document.getElementById('overlay');
        if (shouldBeActive) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'overlay';
                document.body.appendChild(overlay);
                overlay.addEventListener('click', () => toggleSideMenu(false));
            }
        } else if (overlay) {
            overlay.remove();
        }
    };

    /**
     * يطبق الترجمات على جميع العناصر في الصفحة
     * @param {string} lang - رمز اللغة ('ar' أو 'en')
     */
    const applyTranslations = (lang) => {
        if (!window.translations || !window.translations[lang]) return;
        const langPack = window.translations[lang];
        
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (langPack[key]) {
                el.innerHTML = langPack[key];
            }
        });
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    };

    // =================================================================
    // وظائف خاصة بالمستخدم والبيانات
    // =================================================================

    const populateUserProfile = async () => {
        if (!currentUser) return;
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        const photoURL = userData.photoURL || currentUser.photoURL || 'images/profile.png';
        document.getElementById('user-profile-picture').src = photoURL;
        document.getElementById('user-name').textContent = userData.name || currentUser.displayName || '';
        document.getElementById('user-email').textContent = currentUser.email;
    };

    const handleLogout = () => {
        auth.signOut().catch(error => console.error('Sign out error', error));
    };

    // =================================================================
    // مراقبة حالة المصادقة (نقطة الدخول الرئيسية للتطبيق)
    // =================================================================
    auth.onAuthStateChanged(user => {
        currentLanguage = localStorage.getItem('language') || 'ar';
        applyTranslations(currentLanguage);

        if (user) {
            currentUser = user;
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists && doc.data().height) { // تحقق من إكمال الإعداد
                    showScreen('home-screen');
                } else {
                    const nameInput = document.getElementById('setup-name');
                    if (nameInput) nameInput.value = user.displayName || '';
                    showScreen('profile-setup-screen');
                }
            });
        } else {
            currentUser = null;
            showScreen('language-selection-screen');
        }
    });

    // =================================================================
    // معالجات الأحداث (Event Listeners) - باستخدام Event Delegation
    // =================================================================

    // --- معالج أحداث النقر (Click) ---
    document.body.addEventListener('click', (e) => {
        const target = e.target;

        // أزرار اختيار اللغة
        const langButton = target.closest('[data-lang]');
        if (langButton) {
            currentLanguage = langButton.getAttribute('data-lang');
            localStorage.setItem('language', currentLanguage);
            applyTranslations(currentLanguage);
            showScreen('auth-options-screen');
            return;
        }

        // الأزرار التي تنتقل بين الشاشات (data-target)
        const screenTarget = target.closest('[data-target]');
        if (screenTarget) {
            e.preventDefault();
            showScreen(screenTarget.getAttribute('data-target'));
            return;
        }

        // أزرار الهيدر والقائمة
        if (target.closest('#menu-button')) toggleSideMenu();
        if (target.closest('#back-button')) {
            showScreen(previousScreenId || 'home-screen', true);
            previousScreenId = null;
        }
        if (target.closest('#profile-button')) {
            populateUserProfile();
            showScreen('user-profile-screen');
        }

        // أزرار تسجيل الخروج
        if (target.closest('#logout-button') || target.closest('#logout-from-profile')) {
            handleLogout();
        }

        // تسجيل الدخول بجوجل
        if (target.closest('#google-signin-btn-1')) {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(error => alert(window.translations[currentLanguage].googleLoginError));
        }
        
        // زر رفع الصورة
        if (target.closest('#upload-photo-button')) {
            document.getElementById('photo-upload-input').click();
        }
    });

    // --- معالج أحداث إرسال النماذج (Submit) ---
    document.body.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;

        // نموذج التسجيل
        if (form.id === 'register-form') {
            const name = form.querySelector('#register-name').value;
            const email = form.querySelector('#register-email').value;
            const password = form.querySelector('#register-password').value;
            try {
                const cred = await auth.createUserWithEmailAndPassword(email, password);
                await cred.user.updateProfile({ displayName: name });
                // سيقوم onAuthStateChanged بالباقي
            } catch (error) {
                alert(window.translations[currentLanguage].registerError);
            }
        }

        // نموذج تسجيل الدخول
        if (form.id === 'login-form') {
            const email = form.querySelector('#login-email').value;
            const password = form.querySelector('#login-password').value;
            auth.signInWithEmailAndPassword(email, password)
                .catch(error => alert(window.translations[currentLanguage].loginError));
        }

        // نموذج إعداد الملف الشخصي
        if (form.id === 'profile-setup-form') {
            if (!currentUser) return;
            const profileData = {
                name: form.querySelector('#setup-name').value,
                gender: form.querySelector('#setup-gender').value,
                dob: form.querySelector('#setup-dob').value,
                height: Number(form.querySelector('#setup-height').value),
                weight: Number(form.querySelector('#setup-weight').value),
                waist: Number(form.querySelector('#setup-waist').value),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            try {
                await db.collection('users').doc(currentUser.uid).set(profileData, { merge: true });
                await currentUser.updateProfile({ displayName: profileData.name });
                // onAuthStateChanged سينقلنا إلى home-screen
            } catch (error) {
                alert(window.translations[currentLanguage].profileSaveError);
            }
        }
    });

    // --- معالج تغيير ملف الصورة ---
    document.getElementById('photo-upload-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        const storageRef = storage.ref(`user_photos/${currentUser.uid}/${file.name}`);
        try {
            const snapshot = await storageRef.put(file);
            const photoURL = await snapshot.ref.getDownloadURL();
            
            await currentUser.updateProfile({ photoURL });
            await db.collection('users').doc(currentUser.uid).set({ photoURL }, { merge: true });

            document.getElementById('user-profile-picture').src = photoURL;
            alert('تم تحديث الصورة بنجاح!');
        } catch (error) {
            alert('فشل رفع الصورة.');
        }
    });
});
