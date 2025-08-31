/**
 * وحدة عرض الحالة الصحية (نسخة محاكاة)
 * تقوم بعرض المؤشرات الصحية للمستخدم باستخدام البيانات المخزنة محلياً
 */
document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('health-status-screen');
  
  /**
   * معالج حدث الانتقال إلى شاشة الحالة الصحية
   * يتم تنفيذه عند اكتمال انتقال الشاشة (transitionend)
   * يقوم بحساب وعرض المؤشرات الصحية للمستخدم
   */
  section.addEventListener('transitionend', () => {
    // التحقق من أن الشاشة نشطة قبل تحديث البيانات
    if (!section.classList.contains('active')) return;
    
    // استرجاع بيانات المستخدم من التخزين المحلي
    const p = JSON.parse(localStorage.userProfile || '{}');
    if (!p.dob) return; // التأكد من وجود بيانات المستخدم
    
    // حساب وعرض العمر
    const age = document.getElementById('status-age');
    age.textContent = calculateAge(p.dob);
    
    // حساب وعرض مؤشر كتلة الجسم
    document.getElementById('status-bmi').textContent = calculateBMI(p.weight, p.height);
    
    // حساب وعرض نسبة الخصر إلى الطول
    document.getElementById('status-whtr').textContent = calculateWHtR(p.waist, p.height);
    
    // حساب وعرض معدل الأيض الأساسي
    document.getElementById('status-bmr').textContent = 
      calculateBMR(p.weight, p.height, calculateAge(p.dob), p.gender) + ' cal';
    
    // حساب وعرض احتياجات السعرات الحرارية اليومية (معامل النشاط 1.55 للنشاط المعتدل)
    document.getElementById('status-calories').textContent =
      Math.round(calculateBMR(p.weight, p.height, calculateAge(p.dob), p.gender) * 1.55) + ' cal';
  });
});

