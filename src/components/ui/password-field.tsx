"use client";

import { useState, type ReactNode } from "react";
import { FIELD, FIELD_LABEL } from "@/lib/field-styles";

export function PasswordField({
  id = "password",
  name = "password",
  label = "Password",
  autoComplete,
  required,
  helperText,
  headerRight,
}: {
  id?: string;
  name?: string;
  label?: string;
  autoComplete?: string;
  required?: boolean;
  helperText?: string;
  headerRight?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className={FIELD_LABEL}>
          {label}
        </label>
        {headerRight}
      </div>
      <div className="relative mt-1">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          className={`${FIELD} pr-16`}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-accent-600 hover:underline dark:text-accent-500"
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {helperText && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>}
    </div>
  );
}
