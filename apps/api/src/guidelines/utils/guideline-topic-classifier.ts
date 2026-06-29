export function classifyGuidelineTopic(input: { title?: string; topic?: string; specialty?: string }) {
  const haystack = `${input.title ?? ""} ${input.topic ?? ""} ${input.specialty ?? ""}`.toLowerCase();
  if (/antenatal|pregnan|obstetric|postpartum|labor|labour/.test(haystack)) return "obstetrics";
  if (/fertility|ivf|reproductive|eshre|asrm/.test(haystack)) return "fertility";
  if (/surgery|laparoscopy|operative/.test(haystack)) return "surgery";
  if (/gynec|gynaec|cervix|uter|ovarian|menopause/.test(haystack)) return "gynecology";
  return input.specialty?.trim().toLowerCase() || "general medicine";
}
