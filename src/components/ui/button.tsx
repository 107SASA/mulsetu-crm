import type { ButtonHTMLAttributes } from "react";
import { buttonClasses, type ButtonVariant, type ButtonSize } from "@/lib/button-styles";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant = "secondary", size = "md", className = "", ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}
