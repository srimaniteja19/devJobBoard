export const AppStatus = {
  WISHLIST: "WISHLIST",
  APPLIED: "APPLIED",
  SCREENING: "SCREENING",
  INTERVIEW: "INTERVIEW",
  OFFER: "OFFER",
  REJECTED: "REJECTED",
  GHOSTED: "GHOSTED",
} as const;
export type AppStatus = (typeof AppStatus)[keyof typeof AppStatus];

export const STATUS_LABELS: Record<AppStatus, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
};

export const STATUS_COLORS: Record<AppStatus, string> = {
  WISHLIST: "text-[#555]",
  APPLIED: "text-[#a78bfa]",
  SCREENING: "text-[#fbbf24]",
  INTERVIEW: "text-[#fb923c]",
  OFFER: "text-[#e8ff47]",
  REJECTED: "text-[#f87171]",
  GHOSTED: "text-[#444]",
};

export const KANBAN_COLUMNS: AppStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
];

export const LocationType = {
  REMOTE: "REMOTE",
  HYBRID: "HYBRID",
  ONSITE: "ONSITE",
} as const;
export type LocationType = (typeof LocationType)[keyof typeof LocationType];

export const LOCATION_LABELS: Record<LocationType, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
};

export const EventType = {
  PHONE_SCREEN: "PHONE_SCREEN",
  TECHNICAL: "TECHNICAL",
  BEHAVIORAL: "BEHAVIORAL",
  ONSITE: "ONSITE",
  OFFER: "OFFER",
  REJECTION: "REJECTION",
  FOLLOW_UP: "FOLLOW_UP",
  OTHER: "OTHER",
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

export const EVENT_LABELS: Record<EventType, string> = {
  PHONE_SCREEN: "Phone Screen",
  TECHNICAL: "Technical Interview",
  BEHAVIORAL: "Behavioral Interview",
  ONSITE: "On-site Interview",
  OFFER: "Offer",
  REJECTION: "Rejection",
  FOLLOW_UP: "Follow Up",
  OTHER: "Other",
};

export const STACK_OPTIONS = [
  "React", "Next.js", "Vue", "Angular", "Svelte",
  "Node.js", "Python", "Go", "Rust", "Java",
  "TypeScript", "Ruby", "PHP", "Swift", "Kotlin",
  "AWS", "Docker", "Kubernetes", "GraphQL", "PostgreSQL",
] as const;

export interface SuggestedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  matchReason: string;
  postedRecency: string;
}
