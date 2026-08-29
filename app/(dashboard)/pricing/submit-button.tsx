'use client';

import { Button, Spinner } from '@heroui/react';
import { ArrowRight } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export function SubmitButton({ isDisabled = false }: { isDisabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" fullWidth isDisabled={pending || isDisabled}>
      {pending ? (
        <>
          <Spinner color="current" size="sm" className="mr-2" />
          Loading...
        </>
      ) : (
        <>
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}
