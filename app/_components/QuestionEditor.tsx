// Editable question list plus a custom-question generator.
// Pure presentation — all generation calls and state ownership live in
// the parent (the builder page).

type Props = {
  edited: string[];
  editQuestion: (index: number, value: string) => void;
  removeQuestion: (index: number) => void;
  customInput: string;
  setCustomInput: (s: string) => void;
  onAddCustom: () => void;
  generatingCustom: boolean;
  customError: string | null;
  canAddCustom: boolean;
};

export function QuestionEditor({
  edited,
  editQuestion,
  removeQuestion,
  customInput,
  setCustomInput,
  onAddCustom,
  generatingCustom,
  customError,
  canAddCustom,
}: Props) {
  return (
    <>
      <p
        style={{
          color: 'var(--muted)',
          fontSize: '0.8125rem',
          marginBottom: '0.75rem',
          maxWidth: '38rem',
        }}
      >
        Tweak any question. Changes are reflected in the URLs below in real time.
      </p>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
        {edited.map((q, i) => (
          <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span className="chrome" style={{ paddingTop: '0.625rem', minWidth: '1.5rem' }}>
              {i + 1}.
            </span>
            <textarea
              value={q}
              onChange={(e) => editQuestion(i, e.target.value)}
              rows={Math.max(2, Math.ceil(q.length / 80))}
              style={{
                flex: 1,
                fontFamily: 'Georgia, serif',
                fontSize: '1rem',
                lineHeight: 1.5,
                padding: '0.625rem 0.75rem',
                border: '1px solid var(--rule)',
                borderRadius: '0.375rem',
                resize: 'vertical',
                background: 'transparent',
                color: 'var(--ink)',
              }}
            />
            <button
              type="button"
              onClick={() => removeQuestion(i)}
              className="btn btn-ghost"
              style={{
                fontSize: '0.75rem',
                padding: '0.375rem 0.625rem',
                alignSelf: 'flex-start',
              }}
              title="Remove this question"
            >
              ✕
            </button>
          </li>
        ))}
      </ol>

      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--rule)',
          maxWidth: '46rem',
        }}
      >
        <p className="chrome" style={{ marginBottom: '0.5rem' }}>Add a custom question</p>
        <p
          style={{
            color: 'var(--muted)',
            fontSize: '0.8125rem',
            marginBottom: '0.75rem',
          }}
        >
          Describe what you want the next question to be about. Claude will
          generate one question that fits alongside the others without
          repeating them.
        </p>
        <textarea
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          rows={2}
          placeholder="E.g., 'Ask about how Millay's biography influences the reading.'"
          style={{
            width: '100%',
            fontFamily: 'inherit',
            fontSize: '0.9375rem',
            lineHeight: 1.5,
            padding: '0.625rem 0.75rem',
            border: '1px solid var(--rule)',
            borderRadius: '0.375rem',
            resize: 'vertical',
            background: 'transparent',
            color: 'var(--ink)',
            marginBottom: '0.5rem',
          }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onAddCustom}
            className="btn"
            disabled={!customInput.trim() || generatingCustom || !canAddCustom}
          >
            {generatingCustom ? 'Generating…' : 'Generate question'}
          </button>
          {customError && (
            <span style={{ color: '#a33', fontSize: '0.8125rem' }}>
              {customError}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
