import { useState, useEffect } from "react";
import { getPharmacologyProfile, PharmacologyAtlas, PharmacologyProfile } from "../../lib/medications";

export function PharmacologyCompare({ atlas }: { atlas: PharmacologyAtlas }) {
  const [genericIds, setGenericIds] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PharmacologyProfile>>({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function load() {
      setStatus("Loading profiles...");
      const newProfiles: Record<string, PharmacologyProfile> = { ...profiles };
      for (const id of genericIds) {
        if (!newProfiles[id]) {
          try {
            newProfiles[id] = await getPharmacologyProfile(id);
          } catch {
            // Error loading
          }
        }
      }
      setProfiles(newProfiles);
      setStatus("");
    }
    void load();
  }, [genericIds]);

  const addGeneric = (id: string) => {
    if (!genericIds.includes(id) && genericIds.length < 5) setGenericIds([...genericIds, id]);
  };

  const removeGeneric = (id: string) => {
    setGenericIds(genericIds.filter(g => g !== id));
  };

  const swapGenerics = (idx1: number, idx2: number) => {
    const newIds = [...genericIds];
    const temp = newIds[idx1] as string;
    newIds[idx1] = newIds[idx2] as string;
    newIds[idx2] = temp;
    setGenericIds(newIds);
  };

  const selectedGenerics = genericIds.map(id => profiles[id]).filter((p): p is PharmacologyProfile => Boolean(p));

  const sections = ["Uses", "Mechanism", "Pharmacodynamics", "Pharmacokinetics", "Renal/hepatic", "Serious warnings", "Pregnancy/lactation", "Monitoring"];

  const renderCell = (profile: PharmacologyProfile, section: string) => {
    if (section === "Uses") return profile.officialProfile?.indications?.join("; ") || "Data missing";
    if (section === "Mechanism") return profile.officialProfile?.mechanism?.join("; ") || profile.mechanism?.join("; ") || "Data missing";
    if (section === "Pharmacodynamics") return profile.pharmacodynamics?.join("; ") || "Data missing";
    if (section === "Serious warnings") return profile.officialProfile?.warnings?.join("; ") || "Data missing";
    if (section === "Pregnancy/lactation") return profile.officialProfile?.pregnancy?.join("; ") || "Data missing";
    if (section === "Monitoring") return profile.officialProfile?.monitoring?.join("; ") || "Data missing";
    return "Data missing";
  };

  return <section className="pharmacology-compare" aria-label="Pharmacology Compare">
    <div className="section-heading">
      <div><h2>Strict Desktop Compare</h2><p className="muted">Compare up to 5 generic medications side-by-side.</p></div>
    </div>
    
    <div className="compare-controls panel">
      <label>Add medication: 
        <select onChange={(e) => addGeneric(e.target.value)} value="">
          <option value="" disabled>Select a medication</option>
          {atlas.allGenerics.map(g => <option key={g.id} value={g.id} disabled={genericIds.includes(g.id)}>{g.genericName}</option>)}
        </select>
      </label>
      <p className="muted">{status}</p>
    </div>

    {selectedGenerics.length > 0 ? (
      <div className="compare-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Feature</th>
              {genericIds.map((id, index) => (
                <th key={id}>
                  <div className="compare-header">
                    <span>{profiles[id]?.genericName || "Loading..."}</span>
                    <div className="compare-actions">
                      <button type="button" onClick={() => removeGeneric(id)} title="Remove">×</button>
                      {index > 0 && <button type="button" onClick={() => swapGenerics(index, index - 1)} title="Move left">←</button>}
                      {index < genericIds.length - 1 && <button type="button" onClick={() => swapGenerics(index, index + 1)} title="Move right">→</button>}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map(section => {
              const baseProfile = selectedGenerics[0] as PharmacologyProfile;
              const allSame = selectedGenerics.length > 1 && selectedGenerics.every(p => renderCell(p, section) === renderCell(baseProfile, section));
              return (
                <tr key={section} className={allSame ? "compare-row-identical" : "compare-row-diff"}>
                  <td><strong>{section}</strong></td>
                  {selectedGenerics.map(profile => (
                    <td key={profile.id} className={!renderCell(profile, section) || renderCell(profile, section) === "Data missing" ? "missing-data" : ""}>
                      {renderCell(profile, section)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="muted">Select medications above to begin comparison.</p>
    )}
  </section>;
}
