"use client";

import { SubmitButton } from "@/components/ui/submit-button";
import type { ButtonVariant } from "@/lib/button-styles";

export function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
  pendingLabel = "Deleting…",
  variant = "danger",
  className = "mt-3",
}: {
  action: (formData: FormData) => void;
  confirmMessage?: string;
  label?: string;
  pendingLabel?: string;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirmMessage && !confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      className={className}
    >
      <SubmitButton variant={variant} size="sm" pendingLabel={pendingLabel}>
        {label}
      </SubmitButton>
    </form>
  );
}
