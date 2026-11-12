// Logotipo de ITAMS (mismo dibujo que public/favicon.svg)
function Logo({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#2557eb" />
      <path d="M16 6.5 7.5 11v10L16 25.5 24.5 21V11L16 6.5Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7.8 11.2 16 15.6l8.2-4.4M16 15.6v9.6" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default Logo;
