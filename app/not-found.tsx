import Link from 'next/link';
import { CircleIcon } from 'lucide-react';
import { buttonVariants } from '@heroui/styles';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <CircleIcon className="size-12 text-accent" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Page Not Found
        </h1>
        <p className="text-base text-muted">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          href="/"
          className={`${buttonVariants({
            variant: 'outline'
          })} mx-auto max-w-48`}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
