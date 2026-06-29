"use client";

import { FormEvent } from "react";

export function ProtocolSearchBox({ query, onQuery }: { query: string; onQuery: (query: string) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onQuery(String(form.get("query") ?? ""));
  }

  return (
    <form className="protocol-search" onSubmit={submit}>
      <input defaultValue={query} name="query" placeholder="Search women's health condition..." />
      <button className="button" type="submit">Search</button>
    </form>
  );
}
