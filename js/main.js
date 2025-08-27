document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // تعريف عناصر الواجهة (UI Elements)
    // =================================================================
    const allScreens = document.querySelectorAll('.auth-screen, .profile-section, .main-app-screen');
    const languageScreen = document.getElementById('language-selection-screen');
    const authOptionsScreen = document.getElementById('auth-options-screen');
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const homeScreen = document.getElementById('home-screen');
    const profileSetupScreen = document.getElementById('profile-setup-screen');
    const healthStatusScreen = document.getElementById('health-status-screen');
    const diagnosisScreen = document.getElementById('diagnosis-screen'); // <-- الشاشة الجديدة
    const mainHeader = document.getElementById('main-header');
    const sideMenu = document.getElementById('side-menu');
    const menuButton = document.getElementById('menu-button');
    const overlay = document.createElement('div');
    overlay.id = 'overlay';

    // =================================================================
    // تعريف خدمات Firebase
    // =================================================================
    const auth = firebase.auth();
    const db = firebase.firestore();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    // =================================================================
    // الدوال المساعدة (Helper Functions)
    // =================================================================

    const showScreen = (screenToShow) => {
        allScreens.forEach(screen => screen.classList.remove('active'));
        if (screenToShow) {
            screenToShow.classList.add('active');
            if (screenToShow.classList.contains('profile-section') || screenToShow.classList.contains('main-app-screen')) {
                mainHeader.classList.remove('hidden');
            } else {
                mainHeader.classList.add('hidden');
            }
        }
        closeMenu();
    };

    const updateTranslations = (lang) => {
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (window.translations && window.translations[lang] && window.translations[lang][key]) {
                el.textContent = window.translations[lang][key];
            }
        });
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    };

    const setLanguage = (lang) => {
        localStorage.setItem('userLanguage', lang);
        updateTranslations(lang);
    };

    const toggleMenu = () => {
        sideMenu.classList.toggle('active');
        if (sideMenu.classList.contains('active')) {
            document.body.appendChild(overlay);
        } else if (document.body.contains(overlay)) {
            overlay.remove();
        }
    };

    const closeMenu = () => {
        if (sideMenu.classList.contains('active')) {
            sideMenu.classList.remove('active');
            if (document.body.contains(overlay)) {
                overlay.remove();
            }
        }
    };

    // =================================================================
    // دوال حساب وتفسير المؤشرات الصحية
    // =================================================================
    const populateHealthStatus = async () => {
        const user = auth.currentUser;
        if (!user) return;

        document.getElementById('bmi-interpretation').style.display = 'none';
        document.getElementById('whtr-interpretation').style.display = 'none';

        try {
            const userDocRef = db.collection('users').doc(user.uid);
            const userDoc = await userDocRef.get();

            if (userDoc.exists) {
                const data = userDoc.data();
                const lang = localStorage.getItem('userLanguage') || 'ar';
                
                if (data.dob) {
                    const dob = new Date(data.dob);
                    const today = new Date();
                    let age = today.getFullYear() - dob.getFullYear();
                    const m = today.getMonth() - dob.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                        age--;
                    }
                    document.getElementById('status-age').textContent = age;
                }

                if (data.height && data.weight) {
                    const heightM = parseFloat(data.height) / 100;
                    const weightKg = parseFloat(data.weight);
                    if (heightM > 0) {
                        const bmi = (weightKg / (heightM * heightM)).toFixed(1);
                        document.getElementById('status-bmi').textContent = bmi;

                        const bmiBox = document.getElementById('bmi-interpretation');
                        let bmiText = '';
                        if (bmi < 18.5) {
                            bmiText = (lang === 'ar') ? 'نقص في الوزن. مؤشر كتلة الجسم لديك أقل من المعدل الطبيعي.' : 'Underweight. Your BMI is below the normal range.';
                            bmiBox.style.borderColor = '#3498db';
                        } else if (bmi >= 18.5 && bmi < 25) {
                            bmiText = (lang === 'ar') ? 'وزن طبيعي. مؤشر كتلة الجسم لديك في المعدل الصحي.' : 'Normal weight. Your BMI is in the healthy range.';
                            bmiBox.style.borderColor = '#2ecc71';
                        } else if (bmi >= 25 && bmi < 30) {
                            bmiText = (lang === 'ar') ? 'زيادة في الوزن. مؤشر كتلة الجسم لديك أعلى من المعدل الطبيعي.' : 'Overweight. Your BMI is above the normal range.';
                            bmiBox.style.borderColor = '#f39c12';
                        } else {
                            bmiText = (lang === 'ar') ? 'سمنة. مؤشر كتلة الجسم لديك في نطاق السمنة، مما يزيد من المخاطر الصحية.' : 'Obesity. Your BMI is in the obesity range, which increases health risks.';
                            bmiBox.style.borderColor = '#e74c3c';
                        }
                        bmiBox.textContent = bmiText;
                        bmiBox.style.display = 'block';
                    }
                }

                if (data.waist && data.height) {
                    const waistCm = parseFloat(data.waist);
                    const heightCm = parseFloat(data.height);
                    if (heightCm > 0) {
                        const whtr = (waistCm / heightCm).toFixed(2);
                        document.getElementById('status-whtr').textContent = whtr;

                        const whtrBox = document.getElementById('whtr-interpretation');
                        let whtrText = '';
                        if (whtr < 0.5) {
                            whtrText = (lang === 'ar') ? 'مخاطر صحية منخفضة. نسبة محيط خصرك إلى طولك في النطاق الصحي.' : 'Low health risk. Your waist-to-height ratio is in the healthy range.';
                            whtrBox.style.borderColor = '#2ecc71';
                        } else if (whtr >= 0.5 && whtr < 0.6) {
                            whtrText = (lang === 'ar') ? 'مخاطر صحية متزايدة. قد تشير هذه النسبة إلى زيادة الدهون الحشوية.' : 'Increased health risk. This ratio may indicate increased visceral fat.';
                            whtrBox.style.borderColor = '#f39c12';
                        } else {
                            whtrText = (lang === 'ar') ? 'مخاطر صحية عالية. هذه النسبة مرتبطة بزيادة مخاطر الأمراض المزمنة.' : 'High health risk. This ratio is associated with an increased risk of chronic diseases.';
                            whtrBox.style.borderColor = '#e74c3c';
                        }
                        whtrBox.textContent = whtrText;
                        whtrBox.style.display = 'block';
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching user data for health status: ", error);
        }
    };

    // =================================================================
    // منطق المصادقة (Authentication Logic)
    // =================================================================

    auth.onAuthStateChanged(async (user) => {
        const savedLang = localStorage.getItem('userLanguage');
        
        if (savedLang) {
            updateTranslations(savedLang);
        }

        if (user) {
            const userDocRef = db.collection('users').doc(user.uid);
            const userDoc = await userDocRef.get();

            if (userDoc.exists) {
                showScreen(homeScreen);
            } else {
                const nameInput = document.getElementById('setup-name');
                if (user.displayName) {
                    nameInput.value = user.displayName;
                }
                showScreen(profileSetupScreen);
            }
        } else {
            if (savedLang) {
                showScreen(authOptionsScreen);
            } else {
                showScreen(languageScreen);
            }
        }
    });

    // =================================================================
    // دوال المصادقة (تسجيل، دخول، جوجل، خروج)
    // =================================================================

    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                return userCredential.user.updateProfile({
                    displayName: name
                });
            })
            .catch((error) => {
                alert(`Error: ${error.message}`);
            });
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .catch((error) => {
                alert(`Error: ${error.message}`);
            });
    });

    const handleGoogleSignIn = () => {
        auth.signInWithPopup(googleProvider)
            .catch((error) => {
                alert(`حدث خطأ أثناء محاولة الدخول باستخدام جوجل. يرجى المحاولة مرة أخرى.\n${error.message}`);
            });
    };
    document.getElementById('google-signin-btn-1').addEventListener('click', handleGoogleSignIn);
    document.getElementById('google-signin-btn-2').addEventListener('click', handleGoogleSignIn);

    document.getElementById('logout-button').addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut();
    });

    // =================================================================
    // حفظ بيانات الملف الشخصي
    // =================================================================

    document.getElementById('profile-setup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const profileData = {
            name: document.getElementById('setup-name').value,
            gender: document.getElementById('setup-gender').value,
            dob: document.getElementById('setup-dob').value,
            height: document.getElementById('setup-height').value,
            weight: document.getElementById('setup-weight').value,
            waist: document.getElementById('setup-waist').value,
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            const userDocRef = db.collection('users').doc(user.uid);
            await userDocRef.set(profileData, { merge: true });
        } catch (error) {
            console.error("Error saving profile data: ", error);
            alert("حدث خطأ أثناء حفظ بياناتك. يرجى المحاولة مرة أخرى.");
        }
    });

    // =================================================================
    // مستمعو الأحداث (Event Listeners) للتنقل
    // =================================================================

    document.querySelectorAll('.language-buttons button').forEach(button => {
        button.addEventListener('click', (e) => {
            const lang = e.target.getAttribute('data-lang');
            setLanguage(lang);
            showScreen(authOptionsScreen);
        });
    });

    document.getElementById('go-to-login-screen-btn').addEventListener('click', () => showScreen(loginScreen));
    document.getElementById('go-to-register-screen-btn').addEventListener('click', () => showScreen(registerScreen));
    document.getElementById('back-to-login-from-register').addEventListener('click', (e) => { e.preventDefault(); showScreen(loginScreen); });
    document.getElementById('back-to-register-from-login').addEventListener('click', (e) => { e.preventDefault(); showScreen(registerScreen); });

    sideMenu.querySelectorAll('a[data-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetScreenId = link.getAttribute('data-target');
            const targetScreen = document.getElementById(targetScreenId);
            if (targetScreen) {
                if (targetScreenId === 'health-status-screen') {
                    populateHealthStatus();
                }
                showScreen(targetScreen);
            }
        });
    });

    menuButton.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);

    // =================================================================
    // تحميل اللغة عند بدء التطبيق
    // =================================================================
    const initialLang = localStorage.getItem('userLanguage');
    if (initialLang) {
        updateTranslations(initialLang);
    }
});
