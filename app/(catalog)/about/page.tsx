export const metadata = {
  title: 'About',
};

export default function AboutPage() {
  return (
    <div className="max-w-page mx-auto px-6 pt-12 pb-24">
      <article className="max-w-prose">
        <h1 className="font-serif text-4xl mb-8 text-ink">About</h1>
        <div className="prose-literary">
          <p>
            qed&rsquo;bop is a catalog of public-domain poems set to music. The
            project is built around a single conviction: the poem comes first.
            The music is one element of an encounter with a poem &mdash; not a
            replacement for reading it, and not a wrapper of pedagogical
            scaffolding around it.
          </p>
          <p>
            The recordings are produced with AI musical tools. Treating that
            honestly is part of the project. The judgment about which poem to
            sing, what register to sing it in, and what the music should serve
            &mdash; those choices are not generative. They are editorial.
          </p>
          <p>
            The site is a working draft. New poems will appear regularly. If
            you teach, or you are a reader who wants somewhere to send a
            student, you are the audience this is built for.
          </p>
        </div>
      </article>
    </div>
  );
}
