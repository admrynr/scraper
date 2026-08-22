import Link from 'next/link';

interface LogoProps {
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ href = '/', className = '', size = 'md' }: LogoProps) {
  // Height mapping for proportionality
  const heightClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-12',
  }[size];

  const content = (
    <div className={`flex items-center select-none ${className}`}>
      {/* Light Theme Wrapper */}
      <div className="logo-light-variant">
        {/* Mobile: P Icon Mark */}
        <img
          src="/prospekto-icon.png"
          alt="Prospekto"
          className={`${heightClasses} w-auto object-contain block md:hidden`}
        />
        {/* Desktop: Full Logo (P mark + typography) */}
        <img
          src="/prospekto-logo.png"
          alt="Prospekto"
          className={`${heightClasses} w-auto object-contain hidden md:block`}
        />
      </div>

      {/* Dark Theme Wrapper */}
      <div className="logo-dark-variant">
        {/* Mobile: P Icon Mark (White) */}
        <img
          src="/prospekto-icon-dark.png"
          alt="Prospekto"
          className={`${heightClasses} w-auto object-contain block md:hidden`}
        />
        {/* Desktop: Full Logo (White Text) */}
        <img
          src="/prospekto-logo-dark.png"
          alt="Prospekto"
          className={`${heightClasses} w-auto object-contain hidden md:block`}
        />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group focus:outline-none rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
