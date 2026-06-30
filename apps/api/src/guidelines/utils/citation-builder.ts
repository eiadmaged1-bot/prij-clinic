export function buildCitationLabel(input: {
  organization: string;
  title: string;
  versionLabel?: string | null;
  heading?: string | null;
  chunkIndex: number;
}) {
  const version = input.versionLabel ? ` ${input.versionLabel}` : "";
  const heading = input.heading ? `, ${input.heading}` : "";
  return `${input.organization} - ${input.title}${version}${heading}, chunk ${input.chunkIndex + 1}`;
}
