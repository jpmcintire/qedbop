import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function PublishedSuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { slug } = await params;

  const page = await prisma.assignmentPage.findFirst({
    where: { urlSlug: slug, teacherId: session.user.id },
  });
  if (!page) notFound();

  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  const url = `${base}/a/${slug}`;

  return (
    <div className="max-w-page mx-auto px-6 pt-16 pb-24 max-w-prose">
      <p className="chrome mb-2">Published</p>
      <h1 className="font-serif text-4xl mb-6">Your assignment is live.</h1>
      <p className="prose-literary mb-8">
        Share this link with your students. They access the page anonymously — no account required.
      </p>

      <div className="border border-rule rounded-lg p-5 mb-8">
        <p className="chrome mb-2">URL</p>
        <p className="font-mono break-all mb-6">{url}</p>
        <div className="flex gap-3">
          <Link
            href={`/a/${slug}`}
            target="_blank"
            className="bg-ink text-paper px-4 py-2 rounded-full chrome no-underline"
          >
            Open page
          </Link>
          <a
            href={`/api/qr/${slug}`}
            target="_blank"
            className="border border-rule px-4 py-2 rounded-full chrome hover:border-ink no-underline"
          >
            QR code
          </a>
        </div>
      </div>

      <Link href="/app/dashboard" className="chrome underline hover:text-ink">
        Back to dashboard →
      </Link>
    </div>
  );
}
