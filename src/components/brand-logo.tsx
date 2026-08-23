const SIZES = {
  sm: 40,
  md: 56,
  lg: 156,
} as const;

export function BrandLogo({
  size = "md",
  className = "",
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mulsetu-logo.jpg"
      alt="Mulsetu CRM"
      width={px}
      height={px}
      className={`object-contain ${className}`}
    />
  );
}
