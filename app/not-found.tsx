import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-page mx-auto px-6 pt-24 pb-24 max-w-prose">
      <p className="chrome mb-4">404</p>
      <h1 className="font-serif text-4xl mb-6">Not found.</h1>
      <p className="prose-literary">
        That page does not exist. Try the{' '}
        <Link href="/poems">catalog</Link>.
      </p>
    </div>
  );
}
