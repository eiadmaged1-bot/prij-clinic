"use client";

import Link from "next/link";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { expandSearchShortcut } from "@/lib/search-shortcuts";

type SearchResult = {
  id: string;
  entityType: string;
  title: string;
  subtitle?: string | null;
  href?: string;
};

type SearchSection = {
  title: string;
  results: SearchResult[];
};

export function UniversalSearchBox({ scope = "global" }: { scope?: string }) {
  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<SearchSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const flatResults = useMemo(() => sections.flatMap((section) => section.results), [sections]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSections([]);
      setLoading(false);
      return;
    }
    const token = sessionStorage.getItem("prijClinicToken");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      fetch(`${getApiBaseUrl()}/search/live?q=${encodeURIComponent(expandSearchShortcut(query))}&scope=${encodeURIComponent(scope)}`, {
        credentials: "include",
        signal: controller.signal,
        headers: token ? { authorization: `Bearer ${token}` } : undefined
      })
        .then(async (response) => response.ok ? response.json() : { sections: [] })
        .then((data: { sections?: SearchSection[] }) => {
          setSections(data.sections ?? []);
          setActiveIndex(0);
        })
        .catch(() => setSections([]))
        .finally(() => setLoading(false));
    }, 275);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query, scope]);

  useEffect(() => {
    function onShortcut(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!flatResults.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, flatResults.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }
    if (event.key === "Enter") {
      const result = flatResults[activeIndex];
      if (result?.href) window.location.href = result.href;
    }
  }

  return (
    <label className="portal-search universal-search" aria-label="Universal clinic search">
      <span>Search <kbd>Ctrl+K</kbd></span>
      <input
        ref={inputRef}
        value={query}
        placeholder="Patient name, MRN, phone, appointment, or queue"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {query ? (
        <div className="typeahead-panel">
          {loading ? <p className="muted">Searching</p> : null}
          {!loading && sections.length === 0 ? <p className="muted">No matching results</p> : null}
          {sections.map((section) => (
            <div className="typeahead-section" key={section.title}>
              <strong>{section.title}</strong>
              {section.results.map((result) => {
                const index = flatResults.findIndex((item) => item.id === result.id && item.entityType === result.entityType);
                const content = (
                  <>
                    <span>{result.title}</span>
                    {result.subtitle ? <small>{result.subtitle}</small> : null}
                  </>
                );
                return result.href ? (
                  <Link className={`typeahead-row ${index === activeIndex ? "active" : ""}`} href={result.href} key={`${result.entityType}-${result.id}`}>
                    {content}
                  </Link>
                ) : (
                  <button className={`typeahead-row ${index === activeIndex ? "active" : ""}`} key={`${result.entityType}-${result.id}`} type="button">
                    {content}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </label>
  );
}
