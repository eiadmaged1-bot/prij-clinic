const shortcutMap: Record<string, string[]> = {
  cb: ["CBC", "complete blood count"],
  cbc: ["CBC", "complete blood count"],
  urine: ["urine analysis", "urinalysis"],
  tsh: ["TSH", "thyroid stimulating hormone"],
  bhcg: ["beta-hCG", "beta hcg"],
  beta: ["beta-hCG", "beta hcg"],
  "b-hcg": ["beta-hCG", "beta hcg"],
  us: ["ultrasound"],
  tvus: ["transvaginal ultrasound"],
  pcos: ["PCOS", "polycystic ovary"],
  aub: ["AUB", "abnormal uterine bleeding"],
  uti: ["UTI", "urinary tract infection"],
  pain: ["pain", "pelvic pain"],
  dysmenorrhea: ["dysmenorrhea", "period pain"],
  dyspareunia: ["dyspareunia", "painful intercourse"],
  discharge: ["vaginal discharge", "discharge"],
  infertility: ["infertility"],
  "pregnancy follow up": ["pregnancy follow up", "antenatal follow-up"],
  "reduced fetal movement": ["reduced fetal movement"]
};

export function expandSearchShortcut(query: string) {
  const normalized = query.trim().toLowerCase();
  const aliases = shortcutMap[normalized] ?? [];
  return [query.trim(), ...aliases].filter(Boolean).join(" ");
}

export function searchShortcutAliases(query: string) {
  return shortcutMap[query.trim().toLowerCase()] ?? [];
}
