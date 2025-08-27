// هذا الكود يستخدم الإصدار القديم من Firebase (v8) لأنه أبسط ولا يتطلب modules
// وهذا سيساعدنا على تحديد مصدر المشكلة بسهولة.

// 1. إعدادات Firebase الخاصة بك
const firebaseConfig = {
  apiKey: "AIzaSyCdUHldUu83kfgc_qUn-h5rZ8xTl2rhNjA",
  authDomain: "healthy-wealthy-app.firebaseapp.com",
  projectId: "healthy-wealthy-app",
  storageBucket: "healthy-wealthy-app.appspot.com",
  messagingSenderId: "182436316225",
  appId: "1:182436316225:web:5cfd34f879204b12ebf2c0"
};

// 2. تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// 3. تهيئة خدمة المصادقة (سنستخدمها لاحقاً)
const auth = firebase.auth();
