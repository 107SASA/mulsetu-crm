"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ButtonSize, ButtonVariant } from "@/lib/button-styles";

// Submit button for forms that post to a server action. While the action is
// running it shows a spinner and is disabled, so repeated clicks (or pressing
// Enter again) can't create duplicate records.
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className = "",
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending, data } = useFormStatus();
  // With several submit buttons in one form, only the clicked one shows the
  // spinner; all of them stay disabled while the action runs.
  const isClicked = !name || !data || data.get(name) === (value ?? "");
  const showPending = pending && isClicked;

  return (
    <Button
      type="submit"
      name={name}
      value={value}
      variant={variant}
      size={size}
      className={`${className} ${pending ? "cursor-wait" : ""}`}
      disabled={pending}
      aria-busy={pending}
    >
      {showPending && <Spinner className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />}
      {showPending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
