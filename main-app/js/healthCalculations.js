// js/healthCalculations.js
/**
 * وحدة حسابات المؤشرات الصحية
 * تحتوي على دوال لحساب العمر، مؤشر كتلة الجسم، نسبة الخصر إلى الطول، ومعدل الأيض الأساسي
 */

/**
 * حساب عمر الشخص بناءً على تاريخ الميلاد
 * @param {string} dob - تاريخ الميلاد بتنسيق YYYY-MM-DD
 * @return {number} العمر بالسنوات
 */
function calculateAge(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(new Date(diff).getUTCFullYear() - 1970);
}

/**
 * حساب مؤشر كتلة الجسم (BMI)
 * @param {number} w - الوزن بالكيلوغرام
 * @param {number} h - الطول بالسنتيمتر
 * @return {string} مؤشر كتلة الجسم مقرباً لرقم عشري واحد
 */
function calculateBMI(w, h) { 
  return (w / (h / 100 * h / 100)).toFixed(1); 
}

/**
 * حساب نسبة الخصر إلى الطول (WHtR)
 * @param {number} w - محيط الخصر بالسنتيمتر
 * @param {number} h - الطول بالسنتيمتر
 * @return {string} نسبة الخصر إلى الطول مقربة لرقمين عشريين
 */
function calculateWHtR(w, h) {
  return (w / h).toFixed(2);
}

/**
 * حساب معدل الأيض الأساسي (BMR) باستخدام معادلة Mifflin-St Jeor
 * @param {number} w - الوزن بالكيلوغرام
 * @param {number} h - الطول بالسنتيمتر
 * @param {number} age - العمر بالسنوات
 * @param {string} gen - الجنس ('male' للذكر، 'female' للأنثى)
 * @return {string} معدل الأيض الأساسي بالسعرات الحرارية يومياً
 */
function calculateBMR(w, h, age, gen) {
  let b = 10 * w + 6.25 * h - 5 * age + (gen === 'male' ? 5 : -161);
  return b.toFixed(1);
}

// تصدير الدوال للاستخدام في ملفات أخرى
window.healthCalculations = {
  calculateAge, calculateBMI, calculateWHtR, calculateBMR
};
