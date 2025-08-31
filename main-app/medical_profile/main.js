document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // تعريف العناصر (DOM Elements)
    // =================================================================
    const medicalSubMenuScreen = document.getElementById('medical-sub-menu-screen');
    const medicalTestsScreen = document.getElementById('medical-tests-screen');
    const personalHistoryScreen = document.getElementById('personal-history-screen');
    const familyHistoryScreen = document.getElementById('family-history-screen');
    const labResultsScreen = document.getElementById('lab-results-screen');
    const labResultsHistoryScreen = document.getElementById('lab-results-history-screen');
    const allScreens = document.querySelectorAll('main > section');
    const backButton = document.getElementById('medical-back-button');

    // تهيئة Firebase
    const auth = firebase.auth();
    const db = firebase.firestore();
    let currentUser = null;
    let currentLanguage = localStorage.getItem('language') || 'ar';
    let previousScreen = null; // <-- تم إضافة متغير لتتبع الشاشة السابقة

    // =================================================================
    // وظائف أساسية (Core Functions)
    // =================================================================
    const showScreen = (screenToShow, isBackAction = false) => {
        // === نفس منطق التطبيق الرئيسي: نحفظ الشاشة الحالية قبل الانتقال ===
        if (!isBackAction) {
            const activeScreen = document.querySelector('main > section.active');
            if (activeScreen) {
                previousScreen = activeScreen;
            }
        }
        allScreens.forEach(screen => screen.classList.remove('active'));
        screenToShow.classList.add('active');
    };

    const applyTranslations = (lang) => {
        if (!window.translations || !window.translations[lang]) return;
        
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (window.translations[lang][key]) {
                element.innerHTML = window.translations[lang][key];
            }
        });

        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            if (window.translations[lang][key]) {
                element.placeholder = window.translations[lang][key];
            }
        });

        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    };

    // =================================================================
    // وظائف جلب البيانات وعرضها
    // =================================================================
    const populatePersonalHistoryForm = async () => {
        if (!currentUser) return;
        try {
            const doc = await db.collection('users').doc(currentUser.uid).get();
            if (doc.exists && doc.data().medicalHistory) {
                const data = doc.data().medicalHistory;
                if (data.personalConditions) {
                    document.querySelectorAll('#personal-history-form input[name="personalCondition"]').forEach(checkbox => {
                        checkbox.checked = data.personalConditions.includes(checkbox.value);
                    });
                }
                document.getElementById('allergies').value = data.allergies || '';
                document.getElementById('surgeries').value = data.surgeries || '';
                if (data.lifestyle) {
                    document.getElementById('sleep-hours').value = data.lifestyle.sleepHours || '';
                    document.querySelector(`input[name="smoking"][value="${data.lifestyle.smokingStatus || 'no'}"]`).checked = true;
                    document.getElementById('physical-activity').value = data.lifestyle.physicalActivity || '';
                    document.getElementById('work-nature').value = data.lifestyle.workNature || '';
                }
            }
        } catch (error) {
            console.error("Error populating personal history form:", error);
        }
    };

    const populateFamilyHistoryForm = async () => {
        if (!currentUser) return;
        try {
            const doc = await db.collection('users').doc(currentUser.uid).get();
            if (doc.exists && doc.data().familyHistory && doc.data().familyHistory.familyConditions) {
                const conditions = doc.data().familyHistory.familyConditions;
                document.querySelectorAll('#family-history-form input[name="familyCondition"]').forEach(checkbox => {
                    checkbox.checked = conditions.includes(checkbox.value);
                });
            }
        } catch (error) {
            console.error("Error populating family history form:", error);
        }
    };

    const displayMedicalTests = async () => {
        if (!currentUser) return;
        try {
            const doc = await db.collection('users').doc(currentUser.uid).get();
            const testsList = document.getElementById('medical-tests-list');
            testsList.innerHTML = '';
            if (doc.exists && doc.data().medicalTests) {
                const sortedTests = doc.data().medicalTests.sort((a, b) => new Date(b.date) - new Date(a.date));
                sortedTests.forEach((test, index) => {
                    const testItem = document.createElement('div');
                    testItem.className = 'list-item';
                    testItem.innerHTML = `
                        <div class="test-info">
                            <strong>${test.name}</strong> 
                            <p>${test.result} - ${new Date(test.date).toLocaleDateString()}</p>
                            <small>${test.notes || ''}</small>
                        </div>
                        <button class="btn-delete-test" data-test-id="${index}"><i class="fas fa-trash-alt"></i></button>
                    `;
                    testsList.appendChild(testItem);
                });
            } else {
                testsList.innerHTML = `<p>${window.translations[currentLanguage].noTestsFound}</p>`;
            }
        } catch (error) {
            console.error("Error fetching medical tests:", error);
        }
    };
    
    const displayDetailedLabResults = async () => {
        if (!currentUser) return;
        try {
            const doc = await db.collection('users').doc(currentUser.uid).get();
            const historyList = document.getElementById('lab-results-history-list');
            historyList.innerHTML = '';
            if (doc.exists && doc.data().detailedLabResults) {
                const results = doc.data().detailedLabResults.sort((a, b) => new Date(b.date) - new Date(a.date));
                if (results.length === 0) {
                    historyList.innerHTML = `<p class="screen-subtitle">${window.translations[currentLanguage].noTestsFound}</p>`;
                    return;
                }
                results.forEach((lab) => {
                    const labCard = document.createElement('div');
                    labCard.className = 'list-item';
                    
                    let detailsHtml = Object.keys(lab)
                        .filter(key => key !== 'date' && key !== 'createdAt')
                        .map(key => `<li><strong>${(window.translations[currentLanguage]['lab' + key.charAt(0).toUpperCase() + key.slice(1)] || key)}:</strong> ${lab[key]}</li>`)
                        .join('');

                    labCard.innerHTML = `
                        <div class="test-info">
                            <h4>${new Date(lab.date).toLocaleDateString()}</h4>
                            <ul class="lab-details-list">${detailsHtml}</ul>
                        </div>
                        <button class="btn-delete-test" data-lab-date="${lab.date}"><i class="fas fa-trash-alt"></i></button>
                    `;
                    historyList.appendChild(labCard);
                });
            } else {
                historyList.innerHTML = `<p class="screen-subtitle">${window.translations[currentLanguage].noTestsFound}</p>`;
            }
        } catch (error) {
            console.error("Error displaying detailed lab results:", error);
        }
    };

    // =================================================================
    // مراقبة حالة المصادقة
    // =================================================================
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            applyTranslations(currentLanguage);
        } else {
            window.location.href = '../index.html';
        }
    });

    // =================================================================
    // معالجات الأحداث (Event Listeners)
    // =================================================================
    medicalSubMenuScreen.addEventListener('click', (e) => {
        const target = e.target.closest('button[data-target]');
        if (target) {
            const targetScreenId = target.getAttribute('data-target');
            const targetScreen = document.getElementById(targetScreenId);
            if (targetScreen) {
                if (targetScreenId === 'medical-tests-screen') displayMedicalTests();
                if (targetScreenId === 'personal-history-screen') populatePersonalHistoryForm();
                if (targetScreenId === 'family-history-screen') populateFamilyHistoryForm();
                if (targetScreenId === 'lab-results-screen') document.getElementById('lab-results-form').reset();
                if (targetScreenId === 'lab-results-history-screen') displayDetailedLabResults();
                showScreen(targetScreen);
            }
        }
    });

    // === الإصلاح النهائي لزر الرجوع بناءً على اقتراحك ===
    backButton.addEventListener('click', () => {
        const activeScreen = document.querySelector('main > section.active');
        // إذا كنا في أي شاشة فرعية، نعود إلى الشاشة السابقة (التي هي القائمة)
        if (previousScreen) {
            showScreen(previousScreen, true);
            previousScreen = null; // إعادة تعيين المتغير بعد الرجوع
        } 
        // إذا كنا في القائمة الرئيسية، نعود إلى التطبيق الرئيسي
        else {
            history.back();
        }
    });

    document.getElementById('show-recommendations-btn').addEventListener('click', () => {
        document.getElementById('recommendations-content').classList.toggle('active');
    });

    // --- نماذج الحفظ ---
    document.getElementById('personal-history-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const personalHistoryData = {
            personalConditions: Array.from(document.querySelectorAll('#personal-history-form input[name="personalCondition"]:checked')).map(el => el.value),
            allergies: document.getElementById('allergies').value,
            surgeries: document.getElementById('surgeries').value,
            lifestyle: {
                sleepHours: document.getElementById('sleep-hours').value,
                smokingStatus: document.querySelector('input[name="smoking"]:checked').value,
                physicalActivity: document.getElementById('physical-activity').value,
                workNature: document.getElementById('work-nature').value
            }
        };
        try {
            await db.collection('users').doc(currentUser.uid).set({ medicalHistory: personalHistoryData }, { merge: true });
            alert(window.translations[currentLanguage].saveSuccess);
        } catch (error) {
            console.error("Error saving personal history:", error);
            alert(window.translations[currentLanguage].saveError);
        }
    });
    
    document.getElementById('family-history-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const familyHistoryData = {
            familyConditions: Array.from(document.querySelectorAll('#family-history-form input[name="familyCondition"]:checked')).map(el => el.value),
        };
        try {
            await db.collection('users').doc(currentUser.uid).set({ familyHistory: familyHistoryData }, { merge: true });
            alert(window.translations[currentLanguage].saveSuccess);
        } catch (error) {
            console.error("Error saving family history:", error);
            alert(window.translations[currentLanguage].saveError);
        }
    });

    document.getElementById('medical-tests-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const testData = {
            name: document.getElementById('test-name').value,
            date: document.getElementById('test-date').value,
            result: document.getElementById('test-result').value,
            notes: document.getElementById('test-notes').value
        };
        try {
            await db.collection('users').doc(currentUser.uid).set({
                medicalTests: firebase.firestore.FieldValue.arrayUnion(testData)
            }, { merge: true });
            alert(window.translations[currentLanguage].saveSuccess);
            document.getElementById('medical-tests-form').reset();
            displayMedicalTests();
        } catch (error) {
            console.error("Error saving medical test:", error);
            alert(window.translations[currentLanguage].saveError);
        }
    });

    document.getElementById('lab-results-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        
        const labDate = document.getElementById('lab-date').value;
        if (!labDate) {
            alert(window.translations[currentLanguage].enterLabDateError);
            return;
        }

        const newLabRecord = { date: labDate };
        const labFields = ['glucose', 'hba1c', 'cholesterol', 'hdl', 'ldl', 'triglycerides', 'ast', 'alt', 'alp', 'bilirubin', 'bun', 'creatinine', 'tsh', 'vitd', 'crp', 'psa', 'hemoglobin', 'wbc', 'rbc', 'platelets'];
        
        labFields.forEach(field => {
            const input = document.getElementById(`lab-${field}`);
            if (input && input.value !== '') {
                newLabRecord[field] = Number(input.value);
            }
        });
        
        try {
            await db.collection('users').doc(currentUser.uid).set({
                detailedLabResults: firebase.firestore.FieldValue.arrayUnion(newLabRecord)
            }, { merge: true });

            alert(window.translations[currentLanguage].saveSuccess);
            document.getElementById('lab-results-form').reset();
            showScreen(medicalSubMenuScreen);
        } catch (error) {
            console.error("Error saving detailed lab results:", error);
            alert(window.translations[currentLanguage].saveError);
        }
    });

    // --- عمليات الحذف ---
    document.getElementById('medical-tests-list').addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.btn-delete-test');
        if (!deleteButton || !currentUser) return;
        const testIndex = parseInt(deleteButton.getAttribute('data-test-id'), 10);
        const userDocRef = db.collection('users').doc(currentUser.uid);
        try {
            const doc = await userDocRef.get();
            if (doc.exists && doc.data().medicalTests) {
                let tests = doc.data().medicalTests.sort((a, b) => new Date(b.date) - new Date(a.date));
                const testToDelete = tests[testIndex];
                await userDocRef.update({
                    medicalTests: firebase.firestore.FieldValue.arrayRemove(testToDelete)
                });
                displayMedicalTests();
            }
        } catch (error) {
            console.error("Error deleting medical test:", error);
        }
    });

    document.getElementById('lab-results-history-list').addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.btn-delete-test');
        if (!deleteButton || !currentUser) return;
        const labDateToDelete = deleteButton.getAttribute('data-lab-date');
        const userDocRef = db.collection('users').doc(currentUser.uid);
        try {
            const doc = await userDocRef.get();
            if (doc.exists && doc.data().detailedLabResults) {
                const labs = doc.data().detailedLabResults;
                const labToDelete = labs.find(lab => lab.date === labDateToDelete);
                if (labToDelete) {
                    await userDocRef.update({
                        detailedLabResults: firebase.firestore.FieldValue.arrayRemove(labToDelete)
                    });
                    displayDetailedLabResults();
                }
            }
        } catch (error) {
            console.error("Error deleting detailed lab result:", error);
        }
    });
});

