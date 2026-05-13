'use client';

import { useState } from 'react';

type CourseType = 'REGULAR' | 'HONORS' | 'AP' | 'COLLEGE';

type Initial = {
  name: string | null;
  email: string;
  school: string | null;
  state: string | null;
  gradeLevels: string[];
  courseType: CourseType | null;
  classNames: string[];
};

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

export function ProfileForm({ initial }: { initial: Initial }) {
  const [name, setName] = useState(initial.name ?? '');
  const [school, setSchool] = useState(initial.school ?? '');
  const [state, setState] = useState(initial.state ?? '');
  const [grades, setGrades] = useState<string[]>(initial.gradeLevels);
  const [courseType, setCourseType] = useState<CourseType>(initial.courseType ?? 'REGULAR');
  const [classNames, setClassNames] = useState(initial.classNames.join(', '));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleGrade(g: string) {
    setGrades((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        school,
        state,
        gradeLevels: grades,
        courseType,
        classNames: classNames
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="Name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <Field label="Email">
        <div className="py-2 text-muted">{initial.email}</div>
      </Field>
      <Field label="School (optional)">
        <input
          type="text"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <Field label="State">
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        >
          <option value="">—</option>
          {STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Grade levels">
        <div className="flex flex-wrap gap-2 pt-1">
          {['6','7','8','9','10','11','12'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleGrade(g)}
              className={`chrome px-3 py-1 rounded-full border ${
                grades.includes(g) ? 'bg-ink text-paper border-ink' : 'border-rule hover:border-ink'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Course type">
        <select
          value={courseType}
          onChange={(e) => setCourseType(e.target.value as CourseType)}
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        >
          <option value="REGULAR">Regular</option>
          <option value="HONORS">Honors</option>
          <option value="AP">AP</option>
          <option value="COLLEGE">College</option>
        </select>
      </Field>
      <Field label="Class names (comma-separated, optional)">
        <input
          type="text"
          value={classNames}
          onChange={(e) => setClassNames(e.target.value)}
          placeholder="Period 1, Period 3"
          className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
      </Field>
      <div className="pt-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-ink text-paper px-5 py-2 rounded-full chrome disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="chrome text-muted">Saved</span>}
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
