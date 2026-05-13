'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Version = {
  id: string;
  label: string;
  youtubeId: string;
  youtubeStatus: 'PUBLIC' | 'UNLISTED';
  durationSeconds: number | null;
  musicDescription: string | null;
  chorusPhrases: string | null;
  vocalCharacter: string | null;
  isRecommended: boolean;
  musicTextTeacherOnly: string;
  musicTextThemes: string;
};

export function VersionsManager({
  workId,
  versions,
}: {
  workId: string;
  versions: Version[];
}) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-5">
      {versions.map((v) => (
        <VersionEditor key={v.id} initial={v} />
      ))}
      {adding ? (
        <VersionEditor workId={workId} onCancel={() => setAdding(false)} isNew />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="chrome border border-rule px-4 py-2 rounded-full hover:border-ink"
        >
          + Add version
        </button>
      )}
    </div>
  );
}

function VersionEditor({
  initial,
  workId,
  isNew,
  onCancel,
}: {
  initial?: Version;
  workId?: string;
  isNew?: boolean;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [label, setLabel] = useState(initial?.label ?? '');
  const [youtubeId, setYoutubeId] = useState(initial?.youtubeId ?? '');
  const [youtubeStatus, setYoutubeStatus] = useState<'PUBLIC' | 'UNLISTED'>(
    initial?.youtubeStatus ?? 'UNLISTED'
  );
  const [duration, setDuration] = useState(initial?.durationSeconds?.toString() ?? '');
  const [musicDescription, setMusicDescription] = useState(initial?.musicDescription ?? '');
  const [chorusPhrases, setChorusPhrases] = useState(initial?.chorusPhrases ?? '');
  const [vocalCharacter, setVocalCharacter] = useState(initial?.vocalCharacter ?? '');
  const [isRecommended, setIsRecommended] = useState(initial?.isRecommended ?? false);
  const [teacherOnly, setTeacherOnly] = useState(initial?.musicTextTeacherOnly ?? '');
  const [themes, setThemes] = useState(initial?.musicTextThemes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!!isNew);

  async function save() {
    setSaving(true);
    setError(null);
    const payload = {
      ...(isNew ? { workId } : {}),
      label,
      youtubeId,
      youtubeStatus,
      durationSeconds: duration ? parseInt(duration, 10) : undefined,
      musicDescription: musicDescription || undefined,
      chorusPhrases: chorusPhrases || undefined,
      vocalCharacter: vocalCharacter || undefined,
      isRecommended,
      musicTextTeacherOnly: teacherOnly,
      musicTextThemes: themes,
    };
    const url = isNew ? '/api/admin/versions' : `/api/admin/versions/${initial!.id}`;
    const method = isNew ? 'POST' : 'PATCH';
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
    if (onCancel) onCancel();
    router.refresh();
  }

  async function remove() {
    if (!initial) return;
    if (!confirm(`Delete version "${initial.label}"?`)) return;
    const res = await fetch(`/api/admin/versions/${initial.id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }

  if (!expanded && initial) {
    return (
      <div className="border border-rule rounded-lg p-4 flex items-baseline justify-between">
        <div>
          <div className="chrome mb-1">{initial.youtubeStatus.toLowerCase()}</div>
          <div className="font-serif text-lg">{initial.label}</div>
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="chrome underline hover:text-ink"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="border border-rule rounded-lg p-5 space-y-4">
      <Field label="Label (e.g. 'Ranchera — Female Vocal')">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <Field label="YouTube ID">
        <input
          value={youtubeId}
          onChange={(e) => setYoutubeId(e.target.value)}
          required
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Status">
          <select
            value={youtubeStatus}
            onChange={(e) => setYoutubeStatus(e.target.value as 'PUBLIC' | 'UNLISTED')}
            className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
          >
            <option value="PUBLIC">Public</option>
            <option value="UNLISTED">Unlisted</option>
          </select>
        </Field>
        <Field label="Duration (seconds)">
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
          />
        </Field>
      </div>
      <Field label="Music description (brief, for library browsing)">
        <input
          value={musicDescription}
          onChange={(e) => setMusicDescription(e.target.value)}
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <Field label="Chorus phrases (which phrases were elevated to refrain and why)">
        <textarea
          value={chorusPhrases}
          onChange={(e) => setChorusPhrases(e.target.value)}
          rows={2}
          className="w-full border border-rule rounded-md bg-transparent p-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <Field label="Vocal character">
        <input
          value={vocalCharacter}
          onChange={(e) => setVocalCharacter(e.target.value)}
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <label className="flex items-baseline gap-2">
        <input
          type="checkbox"
          checked={isRecommended}
          onChange={(e) => setIsRecommended(e.target.checked)}
        />
        <span className="chrome">Part of recommended set</span>
      </label>

      <div className="border-2 border-red-700 rounded-md p-4 bg-red-50/30">
        <p className="chrome mb-2" style={{ color: '#991b1b' }}>
          Teacher-only · NEVER fed to Claude · NEVER shown to students
        </p>
        <p className="prose-literary text-sm text-muted mb-2">
          Timestamped specifics. "At 1:20, the bass drops out on 'look on my works.'" These power coaching podcasts and teacher materials. Specific observations go HERE.
        </p>
        <textarea
          value={teacherOnly}
          onChange={(e) => setTeacherOnly(e.target.value)}
          rows={6}
          className="w-full border border-rule rounded-md bg-paper p-2 focus:outline-none focus:border-ink font-mono text-sm"
        />
      </div>

      <div className="border-2 border-emerald-700 rounded-md p-4 bg-emerald-50/30">
        <p className="chrome mb-2" style={{ color: '#065f46' }}>
          Themes · safe to send to Claude · used for student question generation
        </p>
        <p className="prose-literary text-sm text-muted mb-2">
          Broader interpretive notes about what the music argues, how the arrangement subverts or emphasizes, what the genre carries. NO timestamps, NO specific moments. Interpretive themes go HERE.
        </p>
        <textarea
          value={themes}
          onChange={(e) => setThemes(e.target.value)}
          rows={6}
          className="w-full border border-rule rounded-md bg-paper p-2 focus:outline-none focus:border-ink font-mono text-sm"
        />
      </div>

      {error && <p className="prose-literary text-muted">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="bg-ink text-paper px-4 py-2 rounded-full chrome disabled:opacity-50"
        >
          {saving ? 'Saving…' : isNew ? 'Add' : 'Save'}
        </button>
        {!isNew && (
          <>
            <button
              onClick={() => setExpanded(false)}
              className="border border-rule px-4 py-2 rounded-full chrome hover:border-ink"
            >
              Collapse
            </button>
            <button
              onClick={remove}
              className="border border-rule px-4 py-2 rounded-full chrome hover:border-ink text-muted"
            >
              Delete
            </button>
          </>
        )}
        {isNew && (
          <button
            onClick={onCancel}
            className="border border-rule px-4 py-2 rounded-full chrome hover:border-ink"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
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
