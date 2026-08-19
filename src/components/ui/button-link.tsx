import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { buttonClasses, type ButtonVariant, type ButtonSize } from "@/lib/button-styles";

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  };

export function ButtonLink({ variant = "secondary", size = "md", className = "", ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
