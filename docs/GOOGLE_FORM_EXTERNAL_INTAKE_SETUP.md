# Google Form External Intake Setup

1. Open the Google Form.
2. Open the Responses tab.
3. Create or open the linked Google Sheet.
4. In the Sheet, choose Extensions -> Apps Script.
5. Open Project Settings -> Script Properties.
6. Add `PRIJ_WEBHOOK_URL`, for example `https://regretful-unwomanly-silliness.ngrok-free.dev/api/backend/external-intake/google-form`. If the ngrok domain changes, update this value.
7. Add `PRIJ_INTAKE_TOKEN`. Do not share this token.
8. Add this `Code.gs` script.
9. Add a trigger: From spreadsheet -> On form submit.
10. Submit a test response.
11. Check Prij External Intake Inbox.

```javascript
function onFormSubmit(e) {
  const props = PropertiesService.getScriptProperties();

  const PRIJ_WEBHOOK_URL = props.getProperty("PRIJ_WEBHOOK_URL");
  const PRIJ_INTAKE_TOKEN = props.getProperty("PRIJ_INTAKE_TOKEN");

  if (!PRIJ_WEBHOOK_URL || !PRIJ_INTAKE_TOKEN) {
    throw new Error("Missing PRIJ_WEBHOOK_URL or PRIJ_INTAKE_TOKEN in Script Properties.");
  }

  const answers = e.namedValues || {};

  function getAnswer(question) {
    const value = answers[question];
    return Array.isArray(value) ? String(value[0] || "").trim() : "";
  }

  const caseType = getAnswer("نوع المتابعة") || getAnswer("Case type");

  const payload = {
    source: "google_form",
    language: "ar",
    submittedAt: new Date().toISOString(),
    rawAnswers: answers,
    patient: {
      fullName: getAnswer("الاسم بالكامل") || getAnswer("Full name"),
      phone: getAnswer("رقم الهاتف") || getAnswer("Phone number"),
      address: getAnswer("محل الإقامة") || getAnswer("محل الإقامة / العنوان") || getAnswer("العنوان") || getAnswer("Address"),
      husbandName: getAnswer("اسم الزوج") || getAnswer("Husband name"),
      dateOfBirth: getAnswer("تاريخ الميلاد") || getAnswer("سنة الميلاد") || getAnswer("Date of birth"),
      caseType: caseType,
      mainComplaint: getAnswer("الشكوى الأساسية") || getAnswer("Main complaint"),
      notes: getAnswer("ملاحظات إضافية") || getAnswer("Notes")
    },
    mappedCaseType: mapCaseType(caseType)
  };

  const response = UrlFetchApp.fetch(PRIJ_WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-prij-intake-token": PRIJ_INTAKE_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error("Prij intake webhook failed: " + status + " " + response.getContentText());
  }
}

function mapCaseType(value) {
  if (value === "متابعة حمل" || value === "Obstetric") {
    return { patientType: "OB", suggestedPhase: "pregnancy" };
  }

  if (value === "تأخر حمل" || value === "Infertility") {
    return { patientType: "INFERTILITY", suggestedPhase: "infertility" };
  }

  if (value === "شكوى نساء" || value === "Gynecology") {
    return { patientType: "GYN", suggestedPhase: "gynecology" };
  }

  return { patientType: "WOMEN_HEALTH", suggestedPhase: "general_review" };
}
```

Security notes:

- Do not use localhost in Google Apps Script.
- Use ngrok/public URL only for testing.
- Submissions are pending review only.
- External text is untrusted.
