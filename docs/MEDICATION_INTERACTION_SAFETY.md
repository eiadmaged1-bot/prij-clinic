# Medication Interaction Safety

The drug interaction checker is assistive and source-aware. Output must include severity, reason, source/citation when present, and doctor review required.

If no verified interaction data is loaded, the system must say: No verified interaction records loaded for this pair. Doctor review required.

Safety checks include drug-drug lookup foundation, drug-allergy warnings, duplicate therapy warnings, and current medication versus new prescription checks. Warnings do not autonomously block prescribing unless a reviewed safety policy explicitly supports that.
