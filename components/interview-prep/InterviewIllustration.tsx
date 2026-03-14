/** Minimal vector illustrations for interview prep cards. No external deps. */
export function CodeInterviewIllu({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="30" width="50" height="40" rx="6" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M35 45h20M35 55h14M35 65h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <circle cx="85" cy="50" r="15" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M80 50l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

export function SystemDesignIllu({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="35" r="12" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
      <circle cx="35" cy="75" r="12" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
      <circle cx="85" cy="75" r="12" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M60 47v12M48 67l12-12M72 67l-12-12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function BehavioralIllu({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="45" cy="55" r="14" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
      <circle cx="75" cy="55" r="14" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M35 75c6 8 18 8 24 0M75 75c6 8 18 8 24 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M60 30v10M55 38l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

export function CompanyIllu({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="35" width="25" height="45" rx="3" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
      <rect x="45" y="25" width="25" height="55" rx="3" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.7" />
      <rect x="75" y="45" width="25" height="35" rx="3" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M27 35V25l13-8 13 8v10M58 25V15l12-5 12 5v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function PrepStartIllu({ className = "w-32 h-32" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="70" cy="70" r="45" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.2" />
      <circle cx="70" cy="70" r="32" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M55 70l12 12 24-24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <path d="M70 40v10M70 90v10M40 70h-10M100 70h10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}
