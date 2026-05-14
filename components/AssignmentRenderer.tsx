import type { Curriculum, DepthToggles } from '@/lib/schemas';

type VersionForRender = {
  id: string;
  label: string;
  youtubeId: string;
};

type WorkForRender = {
  title: string;
  author: string;
  fullText: string;
  publicationYear: number | null;
};

export function AssignmentRenderer({
  work,
  versions,
  curriculum,
  toggles,
  teacherDisplayName,
  classDisplayName,
}: {
  work: WorkForRender;
  versions: VersionForRender[];
  curriculum: Curriculum;
  toggles: DepthToggles;
  teacherDisplayName?: string | null;
  classDisplayName?: string | null;
}) {
  return (
    <article className="max-w-page mx-auto px-6 pt-12 pb-24">
      {(teacherDisplayName || classDisplayName) && (
        <div className="chrome mb-3">
          {[teacherDisplayName, classDisplayName].filter(Boolean).join(' · ')}
        </div>
      )}

      <header className="max-w-prose">
        <h1 className="font-serif text-4xl md:text-5xl leading-tight text-ink">
          {work.title}
        </h1>
        <p className="chrome mt-3">
          {work.author}
          {work.publicationYear ? ` · ${work.publicationYear}` : ''}
        </p>
      </header>

      <section className="mt-12 max-w-prose">
        <pre className="poem">{work.fullText}</pre>
      </section>

      <section className="mt-16 max-w-prose">
        <h2 className="chrome mb-4 pb-2 border-b border-rule">Background</h2>
        <div className="prose-literary space-y-4">
          <p>{curriculum.background.poetBio}</p>
          <p>{curriculum.background.historicalContext}</p>
          <p>{curriculum.background.literarySignificance}</p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="chrome mb-4 pb-2 border-b border-rule max-w-prose">
          {versions.length > 1 ? 'Listen' : 'Listen'}
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {versions.map((v) => (
            <div key={v.id}>
              <p className="chrome mb-3">{v.label}</p>
              <div className="aspect-video">
                <iframe
                  className="w-full h-full border-0"
                  src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                  title={`${work.title} — ${v.label}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {curriculum.vocabulary.length > 0 && (
        <section className="mt-16 max-w-prose">
          <h2 className="chrome mb-4 pb-2 border-b border-rule">Vocabulary</h2>
          <dl className="prose-literary">
            {curriculum.vocabulary.map((v) => (
              <div key={v.term} className="mb-2">
                <dt className="inline font-semibold">{v.term}.</dt>{' '}
                <dd className="inline">{v.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="mt-16 max-w-prose">
        <h2 className="chrome mb-4 pb-2 border-b border-rule">Discussion</h2>
        <p className="chrome italic mb-6 normal-case tracking-normal" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Strong responses describe specific moments in the music. &ldquo;The
          song felt sad&rdquo; is not enough.
        </p>
        <ol className="prose-literary list-decimal pl-5 space-y-4">
          {curriculum.discussionQuestions.map((q, i) => (
            <li key={i}>{q.prompt}</li>
          ))}
        </ol>
      </section>

      <section className="mt-16 max-w-prose">
        <h2 className="chrome mb-4 pb-2 border-b border-rule">Writing prompt</h2>
        <div className="prose-literary space-y-4">
          <p>{curriculum.writingPrompt.prompt}</p>
          <p className="text-muted">
            <span className="chrome">Length:</span> {curriculum.writingPrompt.lengthGuidance}
          </p>
          <p className="text-muted">
            <span className="chrome">Evidence:</span>{' '}
            {curriculum.writingPrompt.evidenceRequirements}
          </p>
        </div>
      </section>

      {toggles.extendedBio && curriculum.addOns.extendedBio && (
        <AddOn title="About the poet" body={curriculum.addOns.extendedBio} />
      )}
      {toggles.historicalContext && curriculum.addOns.historicalContext && (
        <AddOn title="Historical context" body={curriculum.addOns.historicalContext} />
      )}
      {toggles.genreSociology && curriculum.addOns.genreSociology && (
        <AddOn title="About this musical genre" body={curriculum.addOns.genreSociology} />
      )}
      {toggles.crossCurricular && curriculum.addOns.crossCurricular && (
        <AddOn title="Cross-curricular connections" body={curriculum.addOns.crossCurricular} />
      )}
      {toggles.technicalPoetry && curriculum.addOns.technicalPoetry && (
        <AddOn title="A closer look at the poem" body={curriculum.addOns.technicalPoetry} />
      )}
      {toggles.creativeResponse && curriculum.addOns.creativeResponse && (
        <AddOn title="Creative response options" body={curriculum.addOns.creativeResponse} />
      )}
      {toggles.scaffoldedListening && curriculum.addOns.scaffoldedListening && (
        <AddOn title="A few places to listen for" body={curriculum.addOns.scaffoldedListening} />
      )}

      <footer className="hairline mt-24 pt-6 max-w-prose">
        <p className="chrome">
          Built with qed&rsquo;bop &middot; poems set to music
        </p>
      </footer>
    </article>
  );
}

function AddOn({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-16 max-w-prose">
      <h2 className="chrome mb-4 pb-2 border-b border-rule">{title}</h2>
      <div className="prose-literary whitespace-pre-wrap">{body}</div>
    </section>
  );
}
