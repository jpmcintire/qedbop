import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, school: true, state: true,
      gradeLevels: true, courseType: true, classNames: true,
    },
  });
  if (!user) return null;

  return (
    <div className="max-w-page mx-auto px-6 pt-16 pb-24 max-w-prose">
      <p className="chrome mb-2">Profile</p>
      <h1 className="font-serif text-4xl mb-8">Your teaching context.</h1>
      <p className="prose-literary text-muted mb-8">
        State and grade levels feed into every assignment Claude generates — they decide which standards get cited and how questions are calibrated.
      </p>
      <ProfileForm initial={user} />
    </div>
  );
}
