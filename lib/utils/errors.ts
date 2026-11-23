// Turns technical errors (Firebase codes, network failures) into Arabic user messages.
export function friendlyError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  const message = (error as { message?: string })?.message ?? "";
  if (code === "permission-denied" || code === "storage/unauthorized") return "ليست لديك صلاحية لتنفيذ هذا الإجراء.";
  if (code === "unavailable" || code === "auth/network-request-failed" || /network|fetch failed|Failed to fetch/i.test(message))
    return "تعذر الاتصال بالإنترنت أو بالخادم. تحقق من الاتصال وحاول مرة أخرى.";
  if (code === "failed-precondition") return "تعذر تنفيذ الاستعلام. قد تحتاج قاعدة البيانات إلى فهرس جديد، تواصل مع الدعم.";
  if (code === "not-found") return "العنصر المطلوب غير موجود.";
  if (code === "resource-exhausted") return "تم تجاوز الحد المسموح مؤقتًا، حاول لاحقًا.";
  if (code === "auth/not-signed-in" || message === "auth/not-signed-in") return "انتهت الجلسة، سجّل الدخول مرة أخرى.";
  if (code === "storage/quota-exceeded") return "تم تجاوز مساحة التخزين المتاحة.";
  if (code === "storage/canceled") return "تم إلغاء الرفع.";
  return "حدث خطأ غير متوقع، حاول مرة أخرى.";
}
