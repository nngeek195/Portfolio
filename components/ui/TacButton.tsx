import Link from 'next/link';

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  external?: boolean;
  className?: string;
};

const VARIANTS = {
  primary: 'bg-bone text-void hover:bg-white',
  secondary: 'bg-gunmetal text-bone ring-1 ring-inset ring-steel hover:ring-ash',
};

// Angled-corner button; "[ ]" brackets slide in on hover/focus.
export default function TacButton({ href, children, variant = 'primary', external = false, className = '' }: Props) {
  const classes = `clip-corner bracket-hover inline-flex items-center justify-center gap-2 px-9 py-3.5 font-mono text-sm font-semibold uppercase tracking-[0.2em] transition-colors ${VARIANTS[variant]} ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
