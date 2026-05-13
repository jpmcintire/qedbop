import fs from 'node:fs/promises';
import path from 'node:path';

const STANDARDS_DIR = path.join(process.cwd(), 'content', 'standards');

const GRADE_BAND = (grade: string): '6-8' | '9-10' | '11-12' => {
  const n = parseInt(grade, 10);
  if (!Number.isFinite(n)) return '9-10';
  if (n <= 8) return '6-8';
  if (n <= 10) return '9-10';
  return '11-12';
};

// State → set of frameworks to load. Default everyone to CCSS; TX and VA get
// their state framework appended.
const FRAMEWORKS_FOR_STATE = (state: string | null | undefined): string[] => {
  const code = (state || '').trim().toUpperCase();
  if (code === 'TX' || code === 'TEXAS') return ['ccss', 'texas'];
  if (code === 'VA' || code === 'VIRGINIA') return ['ccss', 'virginia'];
  return ['ccss'];
};

export async function loadStandardsFor(opts: {
  state: string | null | undefined;
  gradeLevels: string[];
}): Promise<string> {
  const frameworks = FRAMEWORKS_FOR_STATE(opts.state);
  const bands = new Set(
    opts.gradeLevels.length > 0 ? opts.gradeLevels.map(GRADE_BAND) : ['9-10']
  );

  const parts: string[] = [];
  for (const framework of frameworks) {
    for (const band of bands) {
      const file = path.join(STANDARDS_DIR, `${framework}-${band}.txt`);
      try {
        const text = await fs.readFile(file, 'utf8');
        parts.push(`# ${framework.toUpperCase()} grades ${band}\n\n${text.trim()}`);
      } catch {
        // missing standards file is non-fatal; we just skip it
      }
    }
  }
  return parts.join('\n\n---\n\n');
}
