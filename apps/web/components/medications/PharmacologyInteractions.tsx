import { useState, useEffect } from "react";
import { getPharmacologyInteractions, PharmacologyAtlas, InteractionPairResult } from "../../lib/medications";

export function PharmacologyInteractions({ atlas }: { atlas: PharmacologyAtlas }) {
  const [genericIds, setGenericIds] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<InteractionPairResult[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function load() {
      if (genericIds.length < 2) {
        setInteractions([]);
        return;
      }
      setStatus("Loading interaction canonical pairs...");
      try {
        const result = await getPharmacologyInteractions(genericIds);
        setInteractions(result.interactions);
      } catch {
        // Error loading
      }
      setStatus("");
    }
    void load();
  }, [genericIds]);

  const addGeneric = (id: string) => {
    if (!genericIds.includes(id)) setGenericIds([...genericIds, id]);
  };

  const removeGeneric = (id: string) => {
    setGenericIds(genericIds.filter(g => g !== id));
  };

  const selectedGenerics = genericIds.map(id => atlas.allGenerics.find(g => g.id === id)).filter(Boolean);

  return <section className="pharmacology-interactions" aria-label="Pharmacology Interactions">
    <div className="section-heading">
      <div><h2>Interaction Engine</h2><p className="muted">Check canonical pairs across multiple generic medications.</p></div>
    </div>
    
    <div className="interactions-controls panel">
      <label>Add medication to regimen: 
        <select onChange={(e) => addGeneric(e.target.value)} value="">
          <option value="" disabled>Select a medication</option>
          {atlas.allGenerics.map(g => <option key={g.id} value={g.id} disabled={genericIds.includes(g.id)}>{g.genericName}</option>)}
        </select>
      </label>
      <div className="selected-regimen">
        {selectedGenerics.map(g => g && (
          <span key={g.id} className="badge clickable-chip" onClick={() => removeGeneric(g.id)}>
            {g.genericName} ×
          </span>
        ))}
      </div>
      <p className="muted">{status}</p>
    </div>

    {genericIds.length >= 2 ? (
      <div className="interactions-results">
        {interactions.length > 0 ? (
          <ul className="interaction-list">
            {interactions.map(interaction => {
              const pName = interaction.primaryGeneric?.genericName || "Unknown Primary";
              const sName = interaction.secondaryGeneric?.genericName || interaction.interactingSubstance;
              return (
                <li key={interaction.id} className={`panel interaction-card severity-${interaction.severity}`}>
                  <div className="interaction-header">
                    <h3>{pName} + {sName}</h3>
                    <span className="badge">{interaction.severity.toUpperCase()}</span>
                  </div>
                  <p><strong>Mechanism/Consequence:</strong> {interaction.mechanismText || "Data missing"}</p>
                  <p><strong>Management/Monitoring:</strong> {interaction.recommendedResponse}</p>
                  {interaction.source && <p className="muted">Source: {(interaction.source as any).title || "Unknown"}</p>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="warning-text">No verified interaction record loaded for this pair. Missing data never means safe. Doctor review required.</p>
        )}
      </div>
    ) : (
      <p className="muted">Select at least 2 medications to check interactions.</p>
    )}
  </section>;
}
