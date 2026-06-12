"use client";

import { useFormStatus } from "react-dom";

/** Submit button that shows a pending state while its parent <form> action runs. */
export function SubmitButton({
  children,
  pendingText = "Working…",
  className = "btn-primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
