'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type WorkType = 'POEM' | 'PASSAGE' | 'SPEECH' | 'DRAMATIC';

type Initial = {
  id?: string;
  title?: string;
  author?: string;
  fullText?: string;
  type?: WorkType;
  publicationYear?: number | null;
  themes?: string[];
  gradeBands?: string[];
};

export function WorkForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [fullText, setFullText] = useState(initial?.fullText ?? '');
  const [type, setType] = useState<WorkType>(initial?.type ?? 'POEM');
  const [year, setYear] = useState(initial?.publicationYear?.toString() ?? '');
  const [themes, setThemes] = useState(initial?.themes?.join(', ') ?? '');
  const [gradeBands, setGradeBands] = useState(initial?.gradeBands?.join(', ') ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      title,
      author,
      fullText,
      type,
      publicationYear: year ? parseInt(year, 10) : undefined,
      themes: themes.split(',').map((s) => s.trim()).filter(Boolean),
      gradeBands: gradeBands.split(',').map((s) => s.trim()).filter(Boolean),
    };
    const url = initial?.id ? `/api/admin/works/${initial.id}` : '/api/admin/works';
    const method = initial?.id ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || 'Save failed');
      return;
    }
    const data = (await res.json()) as { id: string };
    router.push(`/admin/works/${data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Title">
        <input
          type="text"
          value={title}
          required
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <Field label="Author">
        <input
          type="text"
          value={author}
          required
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <Field label="Type">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as WorkType)}
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        >
          <option value="POEM">Poem</option>
          <option value="PASSAGE">Passage</option>
          <option value="SPEECH">Speech</option>
          <option value="DRAMATIC">Dramatic monologue</option>
        </select>
      </Field>
      <Field label="Publication year">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <Field label="Themes (comma-separated)">
        <input
          type="text"
          value={themes}
          onChange={(e) => setThemes(e.target.value)}
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <Field label="Grade bands (comma-separated, e.g. 9-10, 11-12)">
        <input
          type="text"
          value={gradeBands}
          onChange={(e) => setGradeBands(e.target.value)}
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <Field label="Full text">
        <textarea
          value={fullText}
          required
          onChange={(e) => setFullText(e.target.value)}
          rows={16}
          className="w-full border border-rule rounded-md bg-transparent p-3 font-serif focus:outline-none focus:border-ink"
        />
      </Field>
      {error && <p className="prose-literary text-muted">{error}</p>}
      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-ink text-paper px-5 py-2 rounded-full chrome disabled:opacity-50"
        >
          {saving ? 'Saving…' : initial?.id ? 'Save changes' : 'Create work'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="chrome block mb-1">{label}</span>
      {children}
    </label>
  );
}
