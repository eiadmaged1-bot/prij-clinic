export type HistoryContext =
  | "general"
  | "gynecology"
  | "pregnancy"
  | "fertility"
  | "postmenopausal"
  | "postoperative";

export type HistoryFieldDefinition = {
  id: string;
  label: string;
  labelAr: string;
  prompt?: string;
  promptAr?: string;
  type?: "text" | "date" | "number";
};

export type HistorySectionDefinition = {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  contexts?: HistoryContext[];
  fields: HistoryFieldDefinition[];
};

export const historyGuidance: Record<HistoryContext, { label: string; labelAr: string; complaintChoices: Array<[string, string]>; prioritySections: string[] }> = {
  general: {
    label: "General",
    labelAr: "عام",
    complaintChoices: [["Follow-up", "متابعة"], ["Screening review", "مراجعة فحص"], ["New concern", "شكوى جديدة"]],
    prioritySections: ["hpi", "medical", "medications-allergies"]
  },
  gynecology: {
    label: "Gynaecology",
    labelAr: "أمراض النساء",
    complaintChoices: [["Abnormal bleeding", "نزيف غير طبيعي"], ["Pelvic pain", "ألم الحوض"], ["Vaginal discharge", "إفرازات مهبلية"], ["Dyspareunia", "ألم أثناء الجماع"]],
    prioritySections: ["hpi", "menstrual-gynaecological", "contraception", "screening"]
  },
  pregnancy: {
    label: "Pregnancy / antenatal",
    labelAr: "الحمل ومتابعة ما قبل الولادة",
    complaintChoices: [["Antenatal review", "متابعة الحمل"], ["New symptom", "عرض جديد"], ["Result review", "مراجعة نتيجة"]],
    prioritySections: ["hpi", "obstetric-reproductive", "medical", "medications-allergies"]
  },
  fertility: {
    label: "Fertility",
    labelAr: "الخصوبة",
    complaintChoices: [["Fertility review", "مراجعة الخصوبة"], ["Cycle review", "مراجعة الدورة"], ["Treatment follow-up", "متابعة العلاج"]],
    prioritySections: ["hpi", "fertility", "menstrual-gynaecological", "medications-allergies"]
  },
  postmenopausal: {
    label: "Postmenopausal",
    labelAr: "ما بعد انقطاع الطمث",
    complaintChoices: [["Postmenopausal bleeding", "نزيف بعد انقطاع الطمث"], ["Pelvic symptom", "عرض بالحوض"], ["Screening review", "مراجعة فحص"]],
    prioritySections: ["hpi", "menstrual-gynaecological", "screening", "medical"]
  },
  postoperative: {
    label: "Postoperative follow-up",
    labelAr: "متابعة ما بعد الإجراء",
    complaintChoices: [["Postoperative review", "مراجعة ما بعد الإجراء"], ["Recovery concern", "شكوى أثناء التعافي"], ["Result review", "مراجعة نتيجة"]],
    prioritySections: ["hpi", "surgical-procedural", "medical", "medications-allergies"]
  }
};

export const historySections: HistorySectionDefinition[] = [
  section("hpi", "History of presenting concern", "تاريخ الشكوى الحالية", "Document the characteristics that are relevant to this concern. These prompts do not add findings automatically.", "وثّق خصائص الشكوى ذات الصلة. لا تضيف هذه الإرشادات أي نتائج تلقائياً.", [
    field("onset", "Onset", "البداية"),
    field("duration", "Duration", "المدة"),
    field("progression", "Progression", "التطور"),
    field("patternTiming", "Pattern / timing", "النمط / التوقيت"),
    field("severityEffect", "Severity / functional effect", "الشدة / التأثير الوظيفي"),
    field("aggravatingRelieving", "Aggravating or relieving context", "العوامل المفاقمة أو المخففة"),
    field("associatedSymptoms", "Associated symptoms", "الأعراض المصاحبة"),
    field("documentedNegatives", "Explicitly documented negatives", "السلبيات الموثقة صراحةً", "Only record a negative after the clinician explicitly selects or enters it.", "لا تسجل نتيجة سلبية إلا بعد اختيارها أو إدخالها صراحةً."),
    field("previousAssessment", "Previous assessment", "تقييم سابق"),
    field("previousIntervention", "Previous intervention", "تدخل سابق")
  ]),
  section("menstrual-gynaecological", "Menstrual and gynaecological history", "التاريخ الحيضي والنسائي", "Open only the details relevant to this visit.", "افتح فقط التفاصيل ذات الصلة بهذه الزيارة.", [
    field("lmp", "LMP", "تاريخ آخر دورة", undefined, undefined, "date"),
    field("cycleRegularity", "Cycle regularity", "انتظام الدورة"),
    field("cycleInterval", "Cycle interval (days)", "الفاصل بين الدورات (أيام)", undefined, undefined, "number"),
    field("bleedingDuration", "Bleeding duration (days)", "مدة النزف (أيام)", undefined, undefined, "number"),
    field("flowDescription", "Flow description", "وصف كمية النزف"),
    field("clotsFlooding", "Clots or flooding", "جلطات أو نزف غزير"),
    field("intermenstrualBleeding", "Intermenstrual bleeding", "نزف بين الدورات"),
    field("postcoitalBleeding", "Postcoital bleeding", "نزف بعد الجماع"),
    field("pain", "Pain / dysmenorrhoea", "الألم / عسر الطمث"),
    field("discharge", "Discharge", "الإفرازات"),
    field("dyspareunia", "Dyspareunia", "ألم أثناء الجماع"),
    field("gynaecologicalDiagnoses", "Previous gynaecological diagnoses", "تشخيصات نسائية سابقة"),
    field("gynaecologicalProcedures", "Previous gynaecological procedures", "إجراءات نسائية سابقة"),
    field("cervicalScreening", "Cervical screening history", "تاريخ فحص عنق الرحم"),
    field("menopauseStatus", "Menopause status", "حالة انقطاع الطمث"),
    field("postmenopausalBleeding", "Postmenopausal bleeding", "نزف بعد انقطاع الطمث")
  ], ["gynecology", "fertility", "postmenopausal", "general"]),
  section("obstetric-reproductive", "Obstetric and reproductive history", "التاريخ التوليدي والإنجابي", "Summarise the existing reproductive record without creating a second pregnancy episode.", "لخّص السجل الإنجابي الحالي دون إنشاء سجل حمل مكرر.", [
    field("gpal", "G/P/A/L summary", "ملخص G/P/A/L"),
    field("pregnancyStatus", "Pregnancy status", "حالة الحمل"),
    field("datingReview", "Pregnancy dating review", "مراجعة تأريخ الحمل"),
    field("deliveryHistory", "Previous delivery modes", "طرق الولادة السابقة"),
    field("pregnancyLosses", "Pregnancy losses", "فقد الحمل"),
    field("livingChildren", "Living children", "الأطفال الأحياء"),
    field("reproductiveReview", "Reproductive-status review", "مراجعة الحالة الإنجابية")
  ], ["pregnancy", "gynecology", "fertility", "general"]),
  section("fertility", "Fertility history", "تاريخ الخصوبة", "Shown because fertility context is recorded or was manually expanded.", "يظهر لأن سياق الخصوبة مسجل أو تم فتحه يدوياً.", [
    field("infertilityDuration", "Duration of infertility", "مدة تأخر الإنجاب"),
    field("infertilityType", "Primary / secondary context", "أولي / ثانوي"),
    field("cycleOvulation", "Cycle and ovulation context", "سياق الدورة والتبويض"),
    field("ovulationInduction", "Previous ovulation induction", "تنشيط تبويض سابق"),
    field("amh", "AMH", "AMH"),
    field("afc", "AFC", "AFC"),
    field("iui", "Previous IUI", "IUI سابق"),
    field("ivf", "Previous IVF", "IVF سابق"),
    field("icsi", "Previous ICSI", "ICSI سابق"),
    field("fertilityProcedures", "Relevant procedures", "إجراءات ذات صلة"),
    field("partnerContext", "Partner / semen-analysis context", "سياق الشريك / تحليل السائل المنوي")
  ], ["fertility"]),
  section("contraception", "Contraception", "منع الحمل", "Record the clinician-confirmed history; this does not select or recommend a method.", "سجل التاريخ الذي أكده الطبيب؛ ولا يختار أو يوصي بوسيلة.", [
    field("currentMethod", "Current method", "الوسيلة الحالية"),
    field("previousMethods", "Previous methods", "وسائل سابقة"),
    field("methodDuration", "Duration", "المدة"),
    field("contraceptionNotes", "Documentation notes", "ملاحظات التوثيق")
  ], ["gynecology", "fertility", "general"]),
  section("medical", "Medical history", "التاريخ المرضي العام", "Keep longitudinal conditions separate; record only the visit-relevant update here.", "احتفظ بالحالات الطولية منفصلة؛ وسجل هنا تحديث الزيارة فقط.", [
    field("medicalChangeStatus", "Change since the longitudinal record", "التغير منذ السجل الطولي"),
    field("medicalVisitUpdate", "Visit-relevant update", "تحديث ذو صلة بالزيارة")
  ]),
  section("surgical-procedural", "Surgical and procedural history", "التاريخ الجراحي والإجرائي", "Distinguish historical, planned, completed, and unverified patient-reported procedures.", "ميّز بين الإجراءات السابقة والمخططة والمكتملة والمذكورة من المريضة دون تحقق.", [
    field("historicalProcedures", "Historical procedures", "إجراءات سابقة"),
    field("patientReportedProcedures", "Unverified patient-reported history", "تاريخ ذكرته المريضة دون تحقق"),
    field("plannedProcedure", "Current-visit planned procedure", "إجراء مخطط في الزيارة الحالية"),
    field("completedProcedure", "Current-visit completed procedure", "إجراء مكتمل في الزيارة الحالية")
  ]),
  section("medications-allergies", "Medications and allergies", "الأدوية والحساسية", "Review loaded longitudinal data and document only visit-relevant changes.", "راجع البيانات الطولية المحملة وسجل فقط التغييرات ذات الصلة بالزيارة.", [
    field("medicationChanges", "Visit-relevant medication changes", "تغييرات الأدوية ذات الصلة بالزيارة"),
    field("allergyReview", "Allergy review", "مراجعة الحساسية")
  ]),
  section("family", "Family history", "التاريخ العائلي", "Record only clinician-entered, visit-relevant family history.", "سجل فقط التاريخ العائلي الذي أدخله الطبيب وذو الصلة بالزيارة.", [
    field("familyHistory", "Relevant family history", "التاريخ العائلي ذو الصلة")
  ]),
  section("social", "Social history", "التاريخ الاجتماعي", "Use neutral documentation and avoid assumptions from demographics.", "استخدم توثيقاً محايداً وتجنب الافتراضات المبنية على البيانات الديموغرافية.", [
    field("socialHistory", "Relevant social history", "التاريخ الاجتماعي ذو الصلة")
  ]),
  section("sexual", "Relevant sexual history", "التاريخ الجنسي ذو الصلة", "Expand only when clinically relevant. Do not infer sexual activity.", "افتح فقط عند وجود صلة سريرية. لا تستنتج النشاط الجنسي.", [
    field("sexualActivityStatus", "Sexual activity status", "حالة النشاط الجنسي"),
    field("sexualHistory", "Relevant details", "تفاصيل ذات صلة")
  ], ["gynecology", "fertility"]),
  section("screening", "Screening and previous care", "الفحوصات والرعاية السابقة", "Link existing screening, investigations, procedures, follow-up, and referrals.", "اربط الفحوصات والتحاليل والإجراءات والمتابعة والإحالات الموجودة.", [
    field("cervicalScreening", "Cervical screening", "فحص عنق الرحم"),
    field("breastScreening", "Breast screening", "فحص الثدي"),
    field("previousInvestigations", "Previous investigations", "فحوصات سابقة"),
    field("previousFollowUp", "Previous follow-up / referrals", "متابعة / إحالات سابقة")
  ])
];

export function resolveHistoryContext(input: {
  patientType?: unknown;
  chiefComplaint?: unknown;
  pregnancyEpisode?: unknown;
  infertilityEpisode?: unknown;
  structuredHistory?: unknown;
}): HistoryContext {
  const patientType = String(input.patientType ?? "").toLowerCase();
  const complaint = String(input.chiefComplaint ?? "").toLowerCase();
  const structured = object(input.structuredHistory);
  const menopause = JSON.stringify(structured ?? {}).toLowerCase();
  if (input.pregnancyEpisode || patientType.includes("obstetric") || patientType.includes("pregnan")) return "pregnancy";
  if (input.infertilityEpisode || patientType.includes("infertility") || complaint.includes("fertility")) return "fertility";
  if (complaint.includes("post-op") || complaint.includes("postoperative") || complaint.includes("procedure follow")) return "postoperative";
  if (complaint.includes("postmenopausal") || menopause.includes("postmenopausal")) return "postmenopausal";
  if (patientType.includes("gyn") || complaint.includes("pelvic") || complaint.includes("bleeding") || complaint.includes("discharge")) return "gynecology";
  return "general";
}

export function visibleHistorySections(context: HistoryContext, recordedSectionIds: string[] = []) {
  const priorities = historyGuidance[context].prioritySections;
  return [...historySections].sort((a, b) => {
    const aRecorded = recordedSectionIds.includes(a.id) ? -2 : 0;
    const bRecorded = recordedSectionIds.includes(b.id) ? -2 : 0;
    const aPriority = priorities.includes(a.id) ? -1 : 0;
    const bPriority = priorities.includes(b.id) ? -1 : 0;
    return (aRecorded + aPriority) - (bRecorded + bPriority);
  });
}

function section(id: string, title: string, titleAr: string, description: string, descriptionAr: string, fields: HistoryFieldDefinition[], contexts?: HistoryContext[]): HistorySectionDefinition {
  return { id, title, titleAr, description, descriptionAr, fields, contexts };
}

function field(id: string, label: string, labelAr: string, prompt?: string, promptAr?: string, type: HistoryFieldDefinition["type"] = "text"): HistoryFieldDefinition {
  return { id, label, labelAr, prompt, promptAr, type };
}

function object(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
