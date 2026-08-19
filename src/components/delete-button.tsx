"use client";

import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
}: {
  action: (formData: FormData) => void;
  confirmMessage: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      className="mt-3"
    >
      <Button type="submit" variant="danger" size="sm">
        {label}
      </Button>
    </form>
  );
}
