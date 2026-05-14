import { WorkForm } from '../WorkForm';

export default function NewWorkPage() {
  return (
    <div className="max-w-page mx-auto px-6 pt-16 pb-24 max-w-prose">
      <p className="chrome mb-2">Admin · New work</p>
      <h1 className="font-serif text-4xl mb-8">New work</h1>
      <WorkForm />
    </div>
  );
}
