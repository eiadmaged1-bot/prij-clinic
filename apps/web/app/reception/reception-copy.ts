export const receptionCopy = {
  en: {
    eyebrow: "Reception", title: "Reception Home", subtitle: "One workspace for registration, check-in, and the waiting line.", workspaceLabel: "Reception workspace",
    newPatient: "New Patient", newPatientHint: "Register a new clinic file.", returningPatient: "Returning Patient", returningPatientHint: "Search, confirm, and check in.", waitingLine: "Waiting Line", waitingLineHint: "Open today’s live queue.",
    liveClinicStatus: "Live clinic status", nextToDoctor: "Next to doctor", doctorAvailable: "No patient with doctor", waiting: "waiting", nextWaiting: "next waiting", waitingSummary: "Waiting-line summary", none: "None", refresh: "Refresh", queueUnavailable: "Queue preview is temporarily unavailable."
  },
  ar: {
    eyebrow: "الاستقبال", title: "الرئيسية — الاستقبال", subtitle: "مساحة واحدة للتسجيل والحضور وقائمة الانتظار.", workspaceLabel: "مساحة عمل الاستقبال",
    newPatient: "مريضة جديدة", newPatientHint: "إنشاء ملف جديد للعيادة.", returningPatient: "مريضة مسجلة", returningPatientHint: "بحث وتأكيد وتسجيل الحضور.", waitingLine: "قائمة الانتظار", waitingLineHint: "فتح قائمة اليوم المباشرة.",
    liveClinicStatus: "حالة العيادة الآن", nextToDoctor: "عند الطبيب الآن", doctorAvailable: "لا توجد مريضة عند الطبيب", waiting: "في الانتظار", nextWaiting: "التالية في الانتظار", waitingSummary: "ملخص قائمة الانتظار", none: "لا يوجد", refresh: "تحديث", queueUnavailable: "تعذر تحميل قائمة الانتظار مؤقتاً."
  }
} as const;

export const receptionWorkflowCopy = {
  en: { checkIn: "Check-in", todayAppointments: "Today’s appointments", bookAppointment: "Book appointment", paymentStatus: "Payment status" },
  ar: { checkIn: "تسجيل الحضور", todayAppointments: "مواعيد اليوم", bookAppointment: "حجز موعد", paymentStatus: "حالة الدفع" }
} as const;
