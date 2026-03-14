/**
 * FAANG+ interview prep data – gathered from public sources (2024–2025).
 * Companies: Google, Meta, Apple, Amazon, Netflix, Microsoft, Uber, Airbnb, Stripe, LinkedIn
 */

export type InterviewType = "technical" | "system_design" | "behavioral" | "culture_fit";

export interface InterviewRound {
  name: string;
  duration: string;
  description: string;
  types: InterviewType[];
  tips?: string[];
}

export interface InterviewTypeInfo {
  id: InterviewType;
  name: string;
  description: string;
  topics: string[];
  sampleQuestions: string[];
  resources: { label: string; url: string }[];
}

export interface CompanyInterviewData {
  id: string;
  name: string;
  logo?: string;
  timeline: string;
  process: string;
  rounds: InterviewRound[];
  technical: InterviewTypeInfo;
  systemDesign: InterviewTypeInfo;
  behavioral: InterviewTypeInfo;
  cultureFit?: InterviewTypeInfo;
}

const INTERVIEW_TYPE_BASE: Record<InterviewType, InterviewTypeInfo> = {
  technical: {
    id: "technical",
    name: "Technical / Coding",
    description: "Data structures, algorithms, problem-solving",
    topics: ["Arrays & Strings", "Trees & Graphs", "DP", "Binary Search", "Two Pointers"],
    sampleQuestions: [],
    resources: [
      { label: "LeetCode", url: "https://leetcode.com" },
      { label: "NeetCode 150", url: "https://neetcode.io" },
    ],
  },
  system_design: {
    id: "system_design",
    name: "System Design",
    description: "Scalable architecture, distributed systems",
    topics: ["Load balancing", "Caching", "Databases", "API design", "Scalability"],
    sampleQuestions: [],
    resources: [
      { label: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
    ],
  },
  behavioral: {
    id: "behavioral",
    name: "Behavioral",
    description: "Past experience, STAR method",
    topics: ["Leadership", "Conflict resolution", "Ownership", "Collaboration"],
    sampleQuestions: [],
    resources: [],
  },
  culture_fit: {
    id: "culture_fit",
    name: "Culture Fit",
    description: "Values alignment, teamwork",
    topics: [],
    sampleQuestions: [],
    resources: [],
  },
};

export const INTERVIEW_PREP_COMPANIES: CompanyInterviewData[] = [
  {
    id: "google",
    name: "Google",
    timeline: "4–8 weeks",
    process:
      "Phone screen → 2 coding rounds → System design (L5+) → Googleyness/Leadership → Hiring committee",
    rounds: [
      {
        name: "Phone Screen",
        duration: "45 min",
        description: "1–2 LeetCode medium coding problems. Focus on approach and communication.",
        types: ["technical"],
        tips: ["Practice 50–75 problems by pattern", "Explain your thought process out loud"],
      },
      {
        name: "Coding Interviews (×2)",
        duration: "45 min each",
        description: "Algorithms and data structures. Evaluated on correctness, complexity, edge cases.",
        types: ["technical"],
        tips: ["Consider time/space complexity", "Handle edge cases explicitly"],
      },
      {
        name: "System Design",
        duration: "45–60 min",
        description: "For L5+. CSMR (Correct, Scalable, Maintainable, Reliable). Global-scale expectations.",
        types: ["system_design"],
        tips: ["Clarify requirements first", "Discuss trade-offs: SQL vs NoSQL, consistency models"],
      },
      {
        name: "Googleyness & Leadership",
        duration: "45 min",
        description: "Cultural fit, leadership, collaboration. Uses structured behavioral questions.",
        types: ["behavioral", "culture_fit"],
      },
    ],
    technical: {
      ...INTERVIEW_TYPE_BASE.technical,
      sampleQuestions: [
        "Design Google Drive",
        "LRU Cache",
        "Two Sum variants",
        "Tree traversal (inorder, level order)",
      ],
      resources: [
        ...INTERVIEW_TYPE_BASE.technical.resources,
        { label: "Google L4 System Design", url: "https://www.systemdesignhandbook.com/guides/google-l4-system-design/" },
      ],
    },
    systemDesign: {
      ...INTERVIEW_TYPE_BASE.system_design,
      sampleQuestions: ["Google Drive", "Global load balancers", "YouTube video pipeline", "Distributed messaging"],
      topics: ["Multi-region deployment", "Data locality", "Fault tolerance", "Consistency models"],
    },
    behavioral: {
      ...INTERVIEW_TYPE_BASE.behavioral,
      sampleQuestions: ["Tell me about a time you led a project", "How do you handle ambiguous requirements?", "Describe a conflict with a teammate"],
    },
  },
  {
    id: "meta",
    name: "Meta",
    timeline: "4–6 weeks",
    process: "Recruiter → Technical phone (CoderPad) → Onsite loop: coding (×2), system design (×2), behavioral",
    rounds: [
      {
        name: "Recruiter Screen",
        duration: "30 min",
        description: "Background, role fit, process overview.",
        types: ["culture_fit"],
      },
      {
        name: "Technical Phone",
        duration: "45 min",
        description: "Live coding on CoderPad. Expect real, executable code—not pseudocode.",
        types: ["technical"],
        tips: ["Graphs, trees, linked lists, binary search, DP", "Code must run"],
      },
      {
        name: "Onsite Loop (4–5 rounds)",
        duration: "45 min each",
        description: "Coding, system design (2×), behavioral. Conversation-style, not presentation.",
        types: ["technical", "system_design", "behavioral"],
        tips: ["Ask clarifying questions", "Discuss capacity planning (QPS, storage)"],
      },
    ],
    technical: {
      ...INTERVIEW_TYPE_BASE.technical,
      sampleQuestions: ["Find number of islands", "Reverse linked list", "Merge sorted lists", "Binary tree traversal"],
      topics: ["Graph/tree traversal", "Linked lists", "Binary search", "String processing", "Dynamic programming"],
    },
    systemDesign: {
      ...INTERVIEW_TYPE_BASE.system_design,
      sampleQuestions: ["Design Instagram", "News Feed", "Stories/Reels", "Messaging system", "Notifications", "S3-like file storage"],
      topics: ["Feed ranking", "Real-time personalization", "Multi-region replication", "Capacity planning"],
    },
    behavioral: {
      ...INTERVIEW_TYPE_BASE.behavioral,
      sampleQuestions: ["Tell me about a challenging project", "How do you give/receive feedback?", "Describe a technical decision you disagreed with"],
    },
  },
  {
    id: "amazon",
    name: "Amazon",
    timeline: "4–8 weeks",
    process: "Recruiter → Phone/Online Assessment → Onsite: coding (×2), system design, behavioral (Bar Raiser)",
    rounds: [
      {
        name: "Phone Screen",
        duration: "30–45 min",
        description: "Technical validation, behavioral questions aligned to Leadership Principles.",
        types: ["technical", "behavioral"],
      },
      {
        name: "Online Assessment",
        duration: "90 min",
        description: "2 coding questions, 20 min system design scenarios, work style survey (Leadership Principles).",
        types: ["technical", "system_design", "behavioral"],
      },
      {
        name: "Onsite Loop",
        duration: "4–6 rounds",
        description: "Coding, system design, behavioral (Bar Raiser). Strong focus on Leadership Principles.",
        types: ["technical", "system_design", "behavioral"],
        tips: ["Use STAR method", "Prepare 2–3 stories per Leadership Principle"],
      },
    ],
    technical: {
      ...INTERVIEW_TYPE_BASE.technical,
      sampleQuestions: ["Two Sum", "Valid parentheses", "Merge intervals", "LRU Cache", "Design parking lot (OOD)"],
      topics: ["Arrays", "Hash maps", "Trees", "Graphs", "OOP"],
    },
    systemDesign: {
      ...INTERVIEW_TYPE_BASE.system_design,
      sampleQuestions: ["Design Amazon product page", "Design recommendation system", "Design order fulfillment pipeline"],
      topics: ["Scalability", "Reliability", "Efficiency", "Distributed systems"],
    },
    behavioral: {
      ...INTERVIEW_TYPE_BASE.behavioral,
      sampleQuestions: [
        "Tell me about a time you disagreed with a decision",
        "Describe a time you took ownership",
        "Give an example of delivering results under pressure",
      ],
      topics: ["Leadership Principles", "STAR method", "Customer obsession", "Bias for action"],
    },
  },
  {
    id: "apple",
    name: "Apple",
    timeline: "4–8 weeks",
    process: "Recruiter → Technical phone → Onsite (4–8 rounds): coding, system design, behavioral, domain-specific",
    rounds: [
      {
        name: "Recruiter Screen",
        duration: "20–30 min",
        description: "Background, motivation, product interest.",
        types: ["culture_fit"],
      },
      {
        name: "Technical Phone",
        duration: "45–60 min",
        description: "1–2 coding problems. Emphasis on memory efficiency, edge cases, complexity analysis.",
        types: ["technical"],
      },
      {
        name: "Onsite (4–8 rounds)",
        duration: "~5–6 hours",
        description: "Coding (×2+), system design, behavioral, domain-specific. Apple ecosystem scenarios.",
        types: ["technical", "system_design", "behavioral"],
        tips: ["Swift/Objective-C or C/C++ helpful", "Security and privacy mindset"],
      },
    ],
    technical: {
      ...INTERVIEW_TYPE_BASE.technical,
      sampleQuestions: ["Implement merge sort", "Two pointers problems", "Tree serialization", "Binary search variants"],
      topics: ["Two pointers", "Sliding window", "Binary search", "Tree traversal", "Memory efficiency"],
    },
    systemDesign: {
      ...INTERVIEW_TYPE_BASE.system_design,
      sampleQuestions: ["Design iCloud sync", "Design App Store", "Design Siri architecture"],
      topics: ["Apple ecosystem", "Security", "Privacy"],
    },
    behavioral: {
      ...INTERVIEW_TYPE_BASE.behavioral,
      sampleQuestions: ["Describe a conflict with a teammate", "How do you learn new technologies?", "Project with cross-functional team"],
    },
  },
  {
    id: "netflix",
    name: "Netflix",
    timeline: "3–4 weeks",
    process: "Recruiter → Hiring manager → Technical video screening → Onsite (technical, system design, cultural fit)",
    rounds: [
      {
        name: "Recruiter Call",
        duration: "30 min",
        description: "Background and interest in the role.",
        types: ["culture_fit"],
      },
      {
        name: "Hiring Manager Screen",
        duration: "45 min",
        description: "Qualifications and team fit.",
        types: ["behavioral", "culture_fit"],
      },
      {
        name: "Technical Video Screening",
        duration: "60 min",
        description: "Coding and problem-solving. Netflix interviews are known to be challenging.",
        types: ["technical"],
        tips: ["Arrays, trees, DP, system design concepts", "LRU Cache, Rate Limiter are common"],
      },
      {
        name: "Onsite",
        duration: "Multiple rounds",
        description: "Technical, system design, cultural alignment. Heavy emphasis on freedom & responsibility, candor.",
        types: ["technical", "system_design", "behavioral", "culture_fit"],
      },
    ],
    technical: {
      ...INTERVIEW_TYPE_BASE.technical,
      sampleQuestions: ["Product of Array Except Self", "Kth Largest Element", "Rate Limiter design", "Key-Value Store implementation", "LRU Cache"],
      topics: ["Arrays", "Linked lists", "Binary trees", "DP", "Distributed systems"],
    },
    systemDesign: {
      ...INTERVIEW_TYPE_BASE.system_design,
      sampleQuestions: ["Design video streaming pipeline", "Recommendation system", "Global CDN"],
      topics: ["Streaming", "Low latency", "Scale"],
    },
    behavioral: {
      ...INTERVIEW_TYPE_BASE.behavioral,
      sampleQuestions: ["How do you handle mistakes and feedback?", "Decision-making with limited data", "Conflict resolution", "Prioritization and adaptability"],
    },
    cultureFit: {
      ...INTERVIEW_TYPE_BASE.culture_fit,
      name: "Culture Fit",
      description: "Freedom & responsibility, candor, innovation, integrity.",
      topics: ["High performance", "Judgment", "Candor"],
      sampleQuestions: ["Tell me about a time you had to make a tough call with limited info", "How do you give candid feedback?"],
      resources: [],
    },
  },
  {
    id: "microsoft",
    name: "Microsoft",
    timeline: "4–8 weeks",
    process: "Recruiter → Codility/Technical screen → Onsite (coding, system design for L61+, behavioral) → AA round",
    rounds: [
      {
        name: "Recruiter Call",
        duration: "15–30 min",
        description: "Background, interest, team preferences.",
        types: ["culture_fit"],
      },
      {
        name: "Technical Screen",
        duration: "45–90 min",
        description: "Codility (2–3 medium–hard) or phone screen. No syntax highlighting in editor.",
        types: ["technical"],
        tips: ["Need 60%+ on Codility", "Practice in plain editors"],
      },
      {
        name: "Onsite (4–5 rounds)",
        duration: "3–5 hours",
        description: "Coding (×3–4), system design (L61+), behavioral. Lunch interview may include design/behavioral.",
        types: ["technical", "system_design", "behavioral"],
      },
      {
        name: "As Appropriate (AA) Round",
        duration: "45–60 min",
        description: "Senior leader with veto power. Technical + behavioral. Seeing this round often means offer likely.",
        types: ["technical", "behavioral"],
      },
    ],
    technical: {
      ...INTERVIEW_TYPE_BASE.technical,
      sampleQuestions: ["Arrays, strings, linked lists", "Trees, graphs", "Dynamic programming", "Design OneDrive/Teams features"],
      topics: ["Arrays", "Strings", "Trees", "Graphs", "DP"],
    },
    systemDesign: {
      ...INTERVIEW_TYPE_BASE.system_design,
      sampleQuestions: ["Design OneDrive", "Design Teams", "Design Azure service"],
      topics: ["Microsoft products", "Cloud (Azure)", "Collaboration tools"],
    },
    behavioral: {
      ...INTERVIEW_TYPE_BASE.behavioral,
      sampleQuestions: ["Growth mindset example", "Learning from failure", "Teamwork and collaboration"],
      topics: ["Learn-it-all culture", "Growth mindset", "Risk-taking"],
    },
  },
  {
    id: "uber",
    name: "Uber",
    timeline: "4–6 weeks",
    process: "Recruiter → Technical phone (CodeSignal) → Onsite (4–5.5 hours): coding, system design",
    rounds: [
      {
        name: "Recruiter Call",
        duration: "30 min",
        description: "Background and role alignment.",
        types: ["culture_fit"],
      },
      {
        name: "Technical Phone",
        duration: "60 min",
        description: "1–2 LeetCode-style problems on CodeSignal. Fully compilable, runnable code expected.",
        types: ["technical"],
        tips: ["Medium difficulty", "Write test cases"],
      },
      {
        name: "Onsite",
        duration: "4–5.5 hours",
        description: "Coding and system design. Problems sometimes adapted from real Uber engineering challenges.",
        types: ["technical", "system_design"],
        tips: ["Marketplace, routing, pricing, safety domains"],
      },
    ],
    technical: {
      ...INTERVIEW_TYPE_BASE.technical,
      sampleQuestions: ["Design ride matching", "Pricing calculations", "ETA estimation", "LeetCode medium patterns"],
      topics: ["Real-time systems", "Matching algorithms", "Distributed systems"],
    },
    systemDesign: {
      ...INTERVIEW_TYPE_BASE.system_design,
      sampleQuestions: ["Design Uber matching system", "Design surge pricing", "Design real-time location tracking"],
      topics: ["Marketplace dynamics", "Routing", "Pricing", "Safety"],
    },
    behavioral: {
      ...INTERVIEW_TYPE_BASE.behavioral,
      sampleQuestions: ["Tell me about a complex system you built", "How do you handle ambiguity?"],
    },
  },
  {
    id: "airbnb",
    name: "Airbnb",
    timeline: "4–6 weeks",
    process: "Recruiter → Technical phone (CoderPad/CodeSignal) → Onsite: 3–4 technical + 1–2 behavioral/systems",
    rounds: [
      {
        name: "Recruiter Screen",
        duration: "30 min",
        description: "Background and role clarification.",
        types: ["culture_fit"],
      },
      {
        name: "Technical Phone",
        duration: "60 min",
        description: "1–2 coding challenges. Production-quality code, testing, real-world patterns.",
        types: ["technical"],
        tips: ["Filtering listings, booking conflicts, messaging scenarios"],
      },
      {
        name: "Onsite (3–4 technical + 1–2 behavioral)",
        duration: "Full day",
        description: "User-centered reasoning. Product engineering, architecture + business logic.",
        types: ["technical", "system_design", "behavioral"],
        tips: ["Communication, collaboration, user empathy", "Latency, privacy, observability"],
      },
    ],
    technical: {
      ...INTERVIEW_TYPE_BASE.technical,
      sampleQuestions: ["Filter/search listings", "Booking conflict detection", "Messaging system", "Calendar availability"],
      topics: ["Production code", "Testing", "Product thinking"],
    },
    systemDesign: {
      ...INTERVIEW_TYPE_BASE.system_design,
      sampleQuestions: ["Design search and filters", "Design booking system", "Design reviews/ratings"],
      topics: ["User-centered design", "Latency", "Privacy", "Observability"],
    },
    behavioral: {
      ...INTERVIEW_TYPE_BASE.behavioral,
      sampleQuestions: ["Tell me about a product decision you influenced", "How do you work with designers?"],
    },
  },
  {
    id: "stripe",
    name: "Stripe",
    timeline: "~6 weeks",
    process: "Recruiter → Technical phone → Recruiter → Onsite: coding, system design, bug hunt, behavioral, integration",
    rounds: [
      {
        name: "Recruiter Call",
        duration: "30 min",
        description: "Background and process overview.",
        types: ["culture_fit"],
      },
      {
        name: "Technical Phone",
        duration: "60 min",
        description: "Pair programming. Real-world problems (not standard LeetCode). Track: frontend, backend, fullstack, or infra.",
        types: ["technical"],
        tips: ["Use your IDE or CoderPad", "Think out loud", "Code quality: naming, docs, single responsibility"],
      },
      {
        name: "Onsite (5 rounds)",
        duration: "45 min each",
        description: "Coding, system design, bug hunt/debugging, behavioral, integration problem.",
        types: ["technical", "system_design", "behavioral"],
        tips: ["Reliability, trade-offs (latency vs durability)", "Financial system integrity", "No AI allowed"],
      },
    ],
    technical: {
      ...INTERVIEW_TYPE_BASE.technical,
      sampleQuestions: ["Real-world parsing/validation", "API design", "Payment flow logic", "Debugging scenarios"],
      topics: ["Production-quality code", "Edge cases", "Clarity under pressure"],
    },
    systemDesign: {
      ...INTERVIEW_TYPE_BASE.system_design,
      sampleQuestions: ["Design authentication system", "Design payment processing", "Design microservices for payments"],
      topics: ["Reliability", "Latency vs durability", "Financial integrity"],
    },
    behavioral: {
      ...INTERVIEW_TYPE_BASE.behavioral,
      sampleQuestions: ["Ownership example", "Handling ambiguity", "Cross-team collaboration"],
    },
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    timeline: "4–6 weeks",
    process: "Recruiter → Technical phone → Onsite: coding, system design, behavioral (culture fit)",
    rounds: [
      {
        name: "Recruiter Screen",
        duration: "30 min",
        description: "Background, role, culture fit.",
        types: ["culture_fit"],
      },
      {
        name: "Technical Phone",
        duration: "45–60 min",
        description: "Coding problems, often around graphs, feeds, or social features.",
        types: ["technical"],
      },
      {
        name: "Onsite",
        duration: "4–5 rounds",
        description: "Coding, system design, behavioral. Strong emphasis on culture (transformation, collaboration, results).",
        types: ["technical", "system_design", "behavioral"],
      },
    ],
    technical: {
      ...INTERVIEW_TYPE_BASE.technical,
      sampleQuestions: ["Design connection graph", "Feed ranking", "Recommendation systems", "Search"],
      topics: ["Graphs", "Social features", "Recommendation systems"],
    },
    systemDesign: {
      ...INTERVIEW_TYPE_BASE.system_design,
      sampleQuestions: ["Design LinkedIn feed", "Design messaging", "Design job recommendations"],
      topics: ["Social graphs", "Recommendations", "Scale"],
    },
    behavioral: {
      ...INTERVIEW_TYPE_BASE.behavioral,
      sampleQuestions: ["Transformation and growth", "Collaboration across teams", "Results and impact"],
    },
  },
];
