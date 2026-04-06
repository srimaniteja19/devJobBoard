/**
 * Ordered system design curriculum — stable ids; append only, never reorder in place.
 * Learning path aligned with donnemartin/system-design-primer plus DDIA, SRE, and related material.
 */
export const SD_CURRICULUM_VERSION = 2;

/** Main README on GitHub (anchors match heading slugs). */
export const SD_PRIMER_README = "https://github.com/donnemartin/system-design-primer";

export function sdPrimerHash(anchor: string): string {
  const a = anchor.startsWith("#") ? anchor.slice(1) : anchor;
  return `${SD_PRIMER_README}#${a}`;
}

export const SD_PRIMER_ANKI_FOLDER =
  "https://github.com/donnemartin/system-design-primer/tree/master/resources/flash_cards";

export const SD_PRIMER_SOLUTION = (path: string) =>
  `https://github.com/donnemartin/system-design-primer/blob/master/${path}`;

export type SdResourceKind = "book" | "article" | "course" | "video" | "exercise";

export type SdResource = {
  title: string;
  kind: SdResourceKind;
  url: string;
  note?: string;
};

export type SdPracticeExercise = {
  title: string;
  /** Suggested focused block; treat as a guide, not a rule. */
  minutes: number;
  steps: string[];
};

export type SdConcept = {
  id: string;
  title: string;
  summary: string;
  /** Primary Primer section to read alongside this lesson. */
  primerTopic: { label: string; href: string };
  /** Hands-on work: do this before tapping “Complete”. */
  practiceExercise: SdPracticeExercise;
  /** Retrieval practice — answer out loud or in a short written note. */
  selfCheck: string[];
  /** Optional worked exercise in the Primer (solutions/…). */
  primerSolution?: { title: string; url: string };
  /** Spaced repetition / memory hint. */
  memorizationTip?: string;
  learningObjectives: string[];
  suggestedTodos: string[];
  resources: SdResource[];
};

const ANKI_TIP =
  "Import the Primer’s Anki decks (System Design + Exercises) from the flash_cards folder — review 5–10 cards on days you study.";

const PRIMER_STUDY_GUIDE = sdPrimerHash("study-guide");
const PRIMER_APPROACH = sdPrimerHash("how-to-approach-a-system-design-interview-question");
const PRIMER_QUESTIONS = sdPrimerHash("system-design-interview-questions-with-solutions");
const PRIMER_SCALING_VIDEO = "https://www.youtube.com/watch?v=-W9F__D3oY4";

export const SD_CURRICULUM: SdConcept[] = [
  {
    id: "sd-01",
    title: "The system design interview frame",
    summary:
      "Treat the interview as a conversation you lead: scope, sketch, detail, then scale. The Primer’s step list is your rehearsal script.",
    primerTopic: { label: "How to approach a system design interview question", href: PRIMER_APPROACH },
    practiceExercise: {
      title: "Rehearse the Primer’s four steps",
      minutes: 40,
      steps: [
        "Open the Primer section and read Steps 1–4 (outline use cases → high level → core components → scale).",
        "Pick any one solved exercise (e.g. Pastebin) and **only** read the problem statement.",
        "On paper, spend 15 minutes writing your own outline for Steps 1–2 **before** peeking at their solution.",
        "Compare your outline to the solution’s first sections — note one gap you will fix next time.",
      ],
    },
    selfCheck: [
      "What questions do you ask first to learn read/write ratio and total users?",
      "What belongs in a “high level design” box diagram vs left for later?",
    ],
    memorizationTip: ANKI_TIP,
    primerSolution: {
      title: "Example: Pastebin / Bit.ly (full write-up)",
      url: SD_PRIMER_SOLUTION("solutions/system_design/pastebin/README.md"),
    },
    learningObjectives: [
      "Lead the interview with clarifying questions, not silent drawing",
      "Separate functional requirements from NFRs before components",
      "Know when to move from breadth to depth",
    ],
    suggestedTodos: [
      "Bookmark the Primer README + Study guide",
      "Run one timed 20-minute outline on a random Primer question title only",
    ],
    resources: [
      {
        title: "Primer — Scalability lecture (Harvard)",
        kind: "video",
        url: PRIMER_SCALING_VIDEO,
        note: "Primer ‘start here’ step 1 — clones, LB, DB, cache, async",
      },
      { title: "Primer — Study guide", kind: "article", url: PRIMER_STUDY_GUIDE },
      { title: "Primer — Interview questions with solutions", kind: "exercise", url: PRIMER_QUESTIONS },
      { title: "DDIA (Kleppmann) — book home", kind: "book", url: "https://dataintensive.net/", note: "Deeper reading after each topic" },
    ],
  },
  {
    id: "sd-02",
    title: "Functional vs non-functional requirements",
    summary:
      "Interviewers grade how you prioritize latency, consistency, durability, and cost. Practice asking the same questions the Primer lists under Step 1.",
    primerTopic: { label: "Step 1 — use cases, constraints, assumptions", href: PRIMER_APPROACH },
    practiceExercise: {
      title: "Requirement interview for two products",
      minutes: 25,
      steps: [
        "Choose **Twitter timeline** vs **payment ledger** (or any two contrasting domains).",
        "For each, write 4 bullet functional requirements and 4 NFRs with **priority order** (P0/P1).",
        "For one NFR conflict (e.g. consistency vs latency), write one sentence on which side you bias and why.",
      ],
    },
    selfCheck: [
      "What’s the difference between “available” and “consistent enough” for a social feed?",
      "Which NFRs matter most for money movement?",
    ],
    memorizationTip: "Anki: make cards for definitions of availability, durability, and idempotency.",
    learningObjectives: [
      "Elicit scale, read/write ratio, and consistency expectations early",
      "State explicit assumptions when the interviewer is vague",
    ],
    suggestedTodos: [
      "Copy Primer Step 1 bullet questions into your own cheat sheet",
    ],
    resources: [
      { title: "Google SRE — Table of contents", kind: "book", url: "https://sre.google/sre-book/table-of-contents/" },
    ],
  },
  {
    id: "sd-03",
    title: "Back-of-the-envelope estimation",
    summary:
      "Rough QPS, storage, and bandwidth drive every box on the whiteboard. The Primer’s appendix tables are the numbers to internalize.",
    primerTopic: { label: "Back-of-the-envelope calculations", href: sdPrimerHash("back-of-the-envelope-calculations") },
    practiceExercise: {
      title: "Estimation reps with Primer appendix",
      minutes: 35,
      steps: [
        "Read **Powers of two** and **Latency numbers every programmer should know** in the Primer appendix (scroll from index).",
        "Estimate daily active users → average RPS → **peak** RPS (assume 3× average) for a mobile app with 10M DAU.",
        "Estimate storage per year for 1 KB metadata + 500 KB object per user per day at 1% of DAU writing daily.",
        "Check order of magnitude only — no calculator perfection.",
      ],
    },
    selfCheck: [
      "Why convert DAU to RPS before picking DB size?",
      "Name one latency from the cheat sheet that argues for caching.",
    ],
    memorizationTip: "Memorize 2^10…2^40 and a few latency orders (disk vs SSD vs RAM vs RTT).",
    learningObjectives: [
      "Convert users/day to writes/sec with simple assumptions",
      "Use powers of two for storage math in interviews",
    ],
    suggestedTodos: [
      "Re-draw the powers-of-two table from memory once",
    ],
    resources: [
      { title: "Primer — Powers of two", kind: "article", url: sdPrimerHash("powers-of-two-table") },
      { title: "Primer — Latency numbers", kind: "article", url: sdPrimerHash("latency-numbers-every-programmer-should-know") },
      {
        title: "Lecloud — Scalability for dummies (archived series)",
        kind: "article",
        url: "https://web.archive.org/web/20221030091841/http://www.lecloud.net/tagged/scalability/chrono",
        note: "Primer ‘start here’ step 2",
      },
      { title: "Jeff Dean — LADIS latency numbers (PDF)", kind: "article", url: "http://www.cs.cornell.edu/projects/ladis2009/talks/dean-keynote-ladis2009.pdf" },
    ],
  },
  {
    id: "sd-04",
    title: "Latency, throughput, and tail latency",
    summary:
      "p99 matters when many services chain. The Primer contrasts latency vs throughput; SRE material reinforces SLO thinking.",
    primerTopic: { label: "Latency vs throughput", href: sdPrimerHash("latency-vs-throughput") },
    practiceExercise: {
      title: "Trace a slow request",
      minutes: 30,
      steps: [
        "Read the Primer’s Latency vs throughput section end-to-end.",
        "Draw 4 serial RPC hops each adding p50 5ms and p99 40ms — explain why user p99 explodes.",
        "Write one mitigation (parallel fan-out, caching, or async) for your diagram.",
      ],
    },
    selfCheck: [
      "When is optimizing p50 wasted effort?",
      "How does batching affect throughput vs tail latency?",
    ],
    learningObjectives: [
      "Explain tail latency amplification in deep call graphs",
      "Choose batching vs streaming for a workload",
    ],
    suggestedTodos: [
      "Skim SRE book — monitoring chapter for SLI/SLO language",
    ],
    resources: [
      { title: "Google SRE — Monitoring distributed systems", kind: "book", url: "https://sre.google/sre-book/monitoring-distributed-systems/" },
    ],
  },
  {
    id: "sd-05",
    title: "DNS, load balancers, and API gateways",
    summary:
      "Traffic path from client to service: DNS resolution, L4/L7 LB, optional gateway. The Primer walks DNS and load balancer trade-offs.",
    primerTopic: { label: "Domain name system", href: sdPrimerHash("domain-name-system") },
    practiceExercise: {
      title: "Draw the edge path",
      minutes: 30,
      steps: [
        "Read Primer **DNS** and **Load balancer** sections (L4 vs L7, horizontal scaling).",
        "Draw mobile app → DNS → LB → API gateway? → service instances. Label where TLS terminates.",
        "List one pro and one con of putting auth at gateway vs service.",
      ],
    },
    selfCheck: [
      "When do you need L7 instead of L4?",
      "What does DNS TTL change during failover?",
    ],
    memorizationTip: "Cards: round-robin vs least connections; active-active vs active-passive.",
    learningObjectives: [
      "Place DNS, LB, and gateway in a request path",
      "Compare L4 and L7 routing",
    ],
    suggestedTodos: [
      "Read Primer — Load balancer vs reverse proxy",
    ],
    resources: [
      { title: "Primer — Load balancer", kind: "article", url: sdPrimerHash("load-balancer") },
      { title: "Primer — Reverse proxy", kind: "article", url: sdPrimerHash("reverse-proxy-web-server") },
      { title: "AWS — ELB introduction", kind: "article", url: "https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/introduction.html" },
    ],
  },
  {
    id: "sd-06",
    title: "CDNs and edge caching",
    summary:
      "Push vs pull CDNs, TTLs, and cache invalidation — straight from the Primer CDN section.",
    primerTopic: { label: "Content delivery network", href: sdPrimerHash("content-delivery-network") },
    practiceExercise: {
      title: "CDN decision for a product",
      minutes: 25,
      steps: [
        "Read **Push CDNs** vs **Pull CDNs** in the Primer.",
        "Pick **video streaming** or **JS/CSS static site** — which CDN mode fits better and why?",
        "Write how you’d invalidate a user’s avatar after upload.",
      ],
    },
    selfCheck: [
      "What metric shows CDN is working (hit ratio)?",
      "When does CDN hurt more than help?",
    ],
    learningObjectives: [
      "Explain edge caching and origin offload",
      "Contrast push vs pull CDN mentally",
    ],
    suggestedTodos: [
      "Skim Primer disadvantages list for CDN",
    ],
    resources: [
      { title: "Cloudflare — What is a CDN?", kind: "article", url: "https://www.cloudflare.com/learning/cdn/what-is-a-cdn/" },
    ],
  },
  {
    id: "sd-07",
    title: "Caching layers",
    summary:
      "Cache-aside, write-through, write-behind — the Primer cache section is the canonical interview map.",
    primerTopic: { label: "Cache (full section)", href: sdPrimerHash("cache") },
    practiceExercise: {
      title: "Pick patterns for a scenario",
      minutes: 35,
      steps: [
        "Read through **cache-aside**, **write-through**, **write-behind** in the Primer.",
        "Scenario: product catalog read-heavy, rare admin updates — which pattern and why?",
        "Scenario: write-heavy counters — what breaks with naive cache-aside?",
      ],
    },
    selfCheck: [
      "What causes a thundering herd after TTL expiry?",
      "Name one fix (staggered TTL, singleflight, etc.).",
    ],
    memorizationTip: "Drill: for each pattern, one sentence on consistency risk.",
    learningObjectives: [
      "Match cache pattern to read/write ratio",
      "Describe stale read failure modes",
    ],
    suggestedTodos: [
      "Re-read Primer — when to update the cache",
    ],
    resources: [
      { title: "DDIA — book home (derived data)", kind: "book", url: "https://dataintensive.net/" },
    ],
  },
  {
    id: "sd-08",
    title: "Relational vs document vs wide-column (high level)",
    summary:
      "Primer **Database** index: RDBMS, NoSQL flavors, and when SQL wins.",
    primerTopic: { label: "Database", href: sdPrimerHash("database") },
    practiceExercise: {
      title: "Schema choice",
      minutes: 30,
      steps: [
        "Skim RDBMS + **SQL or NoSQL** in the Primer.",
        "Design **user profile** storage: justify document vs relational in 5 bullets.",
        "Add one access pattern that would flip your choice.",
      ],
    },
    selfCheck: [
      "When are joins worth the operational cost at scale?",
      "What workload fits wide-column stores?",
    ],
    learningObjectives: [
      "Map access patterns to SQL vs document",
      "Name trade-offs of denormalization",
    ],
    suggestedTodos: [
      "Read Primer — Document store vs Key-value (high level)",
    ],
    resources: [
      { title: "Primer — NoSQL subsection", kind: "article", url: sdPrimerHash("nosql") },
    ],
  },
  {
    id: "sd-09",
    title: "Replication basics",
    summary:
      "Master-slave vs master-master in the Primer; tie to read scaling and failover.",
    primerTopic: { label: "Master-slave replication", href: sdPrimerHash("master-slave-replication") },
    practiceExercise: {
      title: "Replication storyboard",
      minutes: 30,
      steps: [
        "Read **Master-slave** and **Master-master** under Database in the Primer.",
        "Draw writes to primary, reads from replicas — mark replication lag risk.",
        "Describe failover in one paragraph (promote replica, DNS, etc.).",
      ],
    },
    selfCheck: [
      "What breaks read-your-writes under async replication?",
      "Why is multi-master hard for conflicts?",
    ],
    learningObjectives: [
      "Contrast sync vs async replication",
      "Connect replication lag to user-visible bugs",
    ],
    suggestedTodos: [
      "Read Primer — Fail-over",
    ],
    resources: [
      { title: "DDIA — Replication", kind: "book", url: "https://dataintensive.net/" },
    ],
  },
  {
    id: "sd-10",
    title: "Partitioning / sharding",
    summary:
      "Sharding keys, hot partitions, federation — Primer database section.",
    primerTopic: { label: "Sharding", href: sdPrimerHash("sharding") },
    practiceExercise: {
      title: "Shard key design",
      minutes: 30,
      steps: [
        "Read Primer **Sharding** + **Federation** (overview).",
        "Pick `user_id` vs `tenant_id` vs time-based key for a multi-tenant SaaS — argue trade-offs.",
        "Describe how you’d find and mitigate a hot shard.",
      ],
    },
    selfCheck: [
      "Why monotonic keys can create hotspots?",
      "What query becomes expensive after sharding by user?",
    ],
    learningObjectives: [
      "Choose shard keys from access patterns",
      "Explain resharding at a high level",
    ],
    suggestedTodos: [
      "Skim Primer — Denormalization",
    ],
    resources: [
      { title: "DDIA — Partitioning", kind: "book", url: "https://dataintensive.net/" },
    ],
  },
  {
    id: "sd-11",
    title: "CAP theorem (practical framing)",
    summary:
      "Primer **CAP theorem** + CP/AP sections — practice nuance, not slogans.",
    primerTopic: { label: "CAP theorem", href: sdPrimerHash("cap-theorem") },
    practiceExercise: {
      title: "CP vs AP in products",
      minutes: 25,
      steps: [
        "Read CAP + CP/AP bullets in the Primer.",
      "Classify **Google Doc editing** vs **Twitter likes** as leaning CP or AP (no perfect answer — defend it).",
        "Write 3 sentences on partition behavior in plain English.",
      ],
    },
    selfCheck: [
      "Why is “pick two” misleading in interviews?",
      "What does partition tolerance mean practically?",
    ],
    memorizationTip: "Card: define consistency, availability, partition tolerance in your own words.",
    learningObjectives: [
      "Give balanced CAP explanation",
      "Relate to real product tolerance for stale reads",
    ],
    suggestedTodos: [
      "Read Primer — Availability vs consistency intro",
    ],
    resources: [
      { title: "CAP — Wikipedia", kind: "article", url: "https://en.wikipedia.org/wiki/CAP_theorem" },
    ],
  },
  {
    id: "sd-12",
    title: "Transactions and isolation (interview level)",
    summary:
      "Consistency patterns + DDIA depth: know when to mention ACID vs sagas.",
    primerTopic: { label: "Consistency patterns", href: sdPrimerHash("consistency-patterns") },
    practiceExercise: {
      title: "Isolation trade-offs",
      minutes: 30,
      steps: [
        "Read weak / eventual / strong consistency in the Primer.",
        "Describe a **money transfer** flow: where you need strong consistency vs where eventual is OK.",
        "Name one pattern for cross-service consistency (saga, outbox) in one line each.",
      ],
    },
    selfCheck: [
      "What is a dirty read?",
      "Why avoid 2PC in many microservice designs?",
    ],
    learningObjectives: [
      "Name common isolation anomalies",
      "Prefer sagas/outbox over distributed 2PC in interviews when appropriate",
    ],
    suggestedTodos: [
      "Skim DDIA transactions chapter outline",
    ],
    resources: [
      { title: "DDIA — Transactions", kind: "book", url: "https://dataintensive.net/" },
    ],
  },
  {
    id: "sd-13",
    title: "Idempotency and delivery semantics",
    summary:
      "Tie **asynchronism** and message delivery to idempotent handlers — Primer async section.",
    primerTopic: { label: "Asynchronism", href: sdPrimerHash("asynchronism") },
    practiceExercise: {
      title: "Idempotent consumer",
      minutes: 30,
      steps: [
        "Read **Message queues** + **Back pressure** in the Primer.",
        "Design `POST /payments` with retries: where does idempotency key live?",
        "List duplicate message handling in a queue consumer.",
      ],
    },
    selfCheck: [
      "Difference between at-least-once and exactly-once processing?",
      "Why is dedupe table acceptable overhead?",
    ],
    learningObjectives: [
      "Design idempotency keys for retried writes",
      "Relate backpressure to queue depth",
    ],
    suggestedTodos: [
      "Read Primer — Task queues (overview)",
    ],
    resources: [
      { title: "DDIA — stream processing themes", kind: "book", url: "https://dataintensive.net/" },
    ],
  },
  {
    id: "sd-14",
    title: "Message queues and logs",
    summary:
      "Queues vs logs for replay; Primer asynchronism + real-world Kafka architecture row.",
    primerTopic: { label: "Message queues", href: sdPrimerHash("message-queues") },
    practiceExercise: {
      title: "Event flow design",
      minutes: 30,
      steps: [
        "Map **order placed → email + analytics** with a queue and two consumers.",
        "List what you lose if the queue is volatile vs log-backed.",
        "Read one **Real world architectures** row for Kafka in the Primer (skim).",
      ],
    },
    selfCheck: [
      "When does ordering matter per partition?",
      "What is poison message handling?",
    ],
    learningObjectives: [
      "Compare queue vs log for replay",
      "Name backpressure tactics",
    ],
    suggestedTodos: [
      "Primer — Real world architectures → Kafka line",
    ],
    resources: [
      { title: "Primer — Real world architectures", kind: "article", url: sdPrimerHash("real-world-architectures") },
      { title: "AWS SQS features", kind: "article", url: "https://aws.amazon.com/sqs/features/" },
    ],
  },
  {
    id: "sd-15",
    title: "Search and indexing",
    summary:
      "Inverted indexes and async indexing — Primer **query_cache** solution models search-engine thinking.",
    primerTopic: { label: "Additional: search engine references", href: sdPrimerHash("additional-system-design-interview-questions") },
    practiceExercise: {
      title: "Read the query-cache solution",
      minutes: 45,
      steps: [
        "Open the Primer solution **Design a key-value store for a search engine**.",
        "Read only until the data model + indexing approach is clear — pause.",
        "Without scrolling further, sketch your own indexing pipeline.",
        "Read the rest and diff your sketch.",
      ],
    },
    selfCheck: [
      "Why is search often eventually consistent?",
      "What triggers an index rebuild vs incremental update?",
    ],
    primerSolution: {
      title: "Primer — Key-value store for search engine",
      url: SD_PRIMER_SOLUTION("solutions/system_design/query_cache/README.md"),
    },
    learningObjectives: [
      "Outline ingest → index → query path",
      "Contrast DB scan vs inverted index at scale",
    ],
    suggestedTodos: [
      "Elasticsearch intro (vendor overview)",
    ],
    resources: [
      { title: "Elasticsearch — What is Elasticsearch?", kind: "article", url: "https://www.elastic.co/what-is/elasticsearch" },
    ],
  },
  {
    id: "sd-16",
    title: "Rate limiting",
    summary:
      "Token bucket and sliding window — Primer **additional questions** links Stripe’s post; implement mentally.",
    primerTopic: { label: "Additional: API rate limiter", href: sdPrimerHash("additional-system-design-interview-questions") },
    practiceExercise: {
      title: "Design a limiter API",
      minutes: 35,
      steps: [
        "Read Stripe blog on rate limiters (linked from Primer table).",
        "Define **limit**: 100 req/min per user — choose token bucket vs fixed window; justify.",
        "Decide: limit at edge, gateway, or service — trade-offs.",
      ],
    },
    selfCheck: [
      "How do you handle burst traffic fairly?",
      "Distributed rate limit: what shared state do you need?",
    ],
    learningObjectives: [
      "Place rate limiting in architecture",
      "Explain token bucket vs sliding window verbally",
    ],
    suggestedTodos: [
      "Whiteboard counters in Redis vs in-memory per node",
    ],
    resources: [
      {
        title: "Stripe — Rate limiters",
        kind: "article",
        url: "https://stripe.com/blog/rate-limiters",
        note: "Linked from Primer additional questions",
      },
    ],
  },
  {
    id: "sd-17",
    title: "Distributed unique IDs",
    summary:
      "Snowflake-style IDs — Primer additional table + Twitter Snowflake links.",
    primerTopic: { label: "Additional: random ID generation", href: sdPrimerHash("additional-system-design-interview-questions") },
    practiceExercise: {
      title: "ID scheme comparison",
      minutes: 30,
      steps: [
        "Read Twitter Snowflake announcement / repo (Primer links).",
        "Compare UUID v4 vs time-sortable 64-bit ID for **B-tree indexes**.",
        "Sketch 64 bits: timestamp | machine | sequence — what breaks if clocks skew?",
      ],
    },
    selfCheck: [
      "Why monotonic IDs help ingestion throughput?",
      "Clock jump risk mitigations?",
    ],
    learningObjectives: [
      "Pick ID schemes for chat, orders, and logs",
      "Mention rough Snowflake layout",
    ],
    suggestedTodos: [
      "Read Primer row on random ID generation",
    ],
    resources: [
      { title: "Twitter — Announcing Snowflake", kind: "article", url: "https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake" },
    ],
  },
  {
    id: "sd-18",
    title: "Real-time: WebSockets, SSE, long polling",
    summary:
      "Connection state and fan-out — complement Primer with MDN + optional WhatsApp architecture article.",
    primerTopic: { label: "Communication — TCP/UDP/REST (baseline)", href: sdPrimerHash("communication") },
    practiceExercise: {
      title: "Transport pick",
      minutes: 30,
      steps: [
        "Skim Primer **TCP vs UDP** + **REST** (high level).",
        "For **live sports scores** vs **Slack-style chat**, pick WS/SSE/long-poll and justify.",
        "Draw how you scale WebSocket connections horizontally (sticky sessions vs pub/sub).",
      ],
    },
    selfCheck: [
      "Why sticky sessions complicate deploys?",
      "When is SSE enough instead of WebSockets?",
    ],
    learningObjectives: [
      "Choose realtime transports",
      "Name horizontal scaling concerns",
    ],
    suggestedTodos: [
      "High Scalability — WhatsApp architecture (optional deep read)",
    ],
    resources: [
      { title: "MDN — WebSockets API", kind: "article", url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API" },
      {
        title: "High Scalability — WhatsApp architecture",
        kind: "article",
        url: "http://highscalability.com/blog/2014/2/26/the-whatsapp-architecture-facebook-bought-for-19-billion.html",
      },
    ],
  },
  {
    id: "sd-19",
    title: "Object storage and large blobs",
    summary:
      "Blobs belong in object stores — relate to **scaling AWS** Primer solution mindset.",
    primerTopic: { label: "Design a system that scales on AWS (blob/CDN angle)", href: sdPrimerHash("design-a-system-that-scales-to-millions-of-users-on-aws") },
    practiceExercise: {
      title: "Upload pipeline",
      minutes: 35,
      steps: [
        "Skim Primer **scaling AWS** solution for media/static handling ideas.",
        "Design presigned PUT upload: browser → API token → S3 → confirmation callback.",
        "List metadata you store in DB vs object store.",
      ],
    },
    selfCheck: [
      "Why avoid multi-GB rows in SQL?",
      "Multipart upload when?",
    ],
    primerSolution: {
      title: "Primer — Scale on AWS",
      url: SD_PRIMER_SOLUTION("solutions/system_design/scaling_aws/README.md"),
    },
    learningObjectives: [
      "Separate metadata and bytes",
      "Use pre-signed URLs correctly in interviews",
    ],
    suggestedTodos: [
      "AWS S3 user guide intro",
    ],
    resources: [
      { title: "AWS S3 — User guide", kind: "article", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html" },
    ],
  },
  {
    id: "sd-20",
    title: "Observability: metrics, logs, traces",
    summary:
      "Three pillars — Primer **Dapper** row + SRE monitoring chapter.",
    primerTopic: { label: "Real world — Dapper (tracing)", href: sdPrimerHash("real-world-architectures") },
    practiceExercise: {
      title: "Golden signals for a service",
      minutes: 30,
      steps: [
        "Pick a read API you know; define **latency, traffic, errors, saturation** SLIs in one line each.",
        "Describe how you’d debug a p99 regression with traces vs logs.",
        "Skim Dapper one-paragraph summary from Primer link.",
      ],
    },
    selfCheck: [
      "Metric vs log vs trace — one example of each?",
      "What is an exemplar?",
    ],
    learningObjectives: [
      "Use RED/USE language appropriately",
      "Tie observability to incident response",
    ],
    suggestedTodos: [
      "SRE workbook — monitoring chapter exercises (optional)",
    ],
    resources: [
      { title: "Google SRE — Monitoring", kind: "book", url: "https://sre.google/sre-book/monitoring-distributed-systems/" },
    ],
  },
  {
    id: "sd-21",
    title: "Security basics in design interviews",
    summary:
      "Primer **Security** section + OWASP mindset at the architecture layer.",
    primerTopic: { label: "Security", href: sdPrimerHash("security") },
    practiceExercise: {
      title: "Threat pass on a public API",
      minutes: 25,
      steps: [
        "Read Primer security overview.",
        "List **3** threats for a public JSON API (authn, authz, injection, rate abuse).",
        "Map each to a layer (edge, gateway, app, DB).",
      ],
    },
    selfCheck: [
      "Where does TLS terminate and why does it matter?",
      "What is least privilege for service accounts?",
    ],
    learningObjectives: [
      "Mention TLS, secrets, and OWASP themes in designs",
    ],
    suggestedTodos: [
      "OWASP Top 10 skim",
    ],
    resources: [
      { title: "OWASP Top 10", kind: "article", url: "https://owasp.org/www-project-top-ten/" },
    ],
  },
  {
    id: "sd-22",
    title: "Microservices vs modular monolith",
    summary:
      "Primer **Application layer** + microservices + service discovery.",
    primerTopic: { label: "Application layer — microservices", href: sdPrimerHash("microservices") },
    practiceExercise: {
      title: "Boundary drawing",
      minutes: 35,
      steps: [
        "Read microservices + **service discovery** in the Primer.",
        "For a **small team** product, argue monolith first — 5 bullets.",
        "Add one condition where you would split a service out.",
      ],
    },
    selfCheck: [
      "What is data ownership per service?",
      "How do sagas relate to cross-service workflows?",
    ],
    learningObjectives: [
      "Defend monolith vs services with team and scale context",
    ],
    suggestedTodos: [
      "Primer — Service discovery",
    ],
    resources: [
      { title: "DDIA — maintainability", kind: "book", url: "https://dataintensive.net/" },
    ],
  },
  {
    id: "sd-23",
    title: "Design: URL shortener",
    summary:
      "Classic Primer exercise — URL shortener is covered in the Pastebin / Bit.ly solution (shared patterns).",
    primerTopic: { label: "Design Pastebin.com (or Bit.ly)", href: sdPrimerHash("design-pastebincom-or-bitly") },
    practiceExercise: {
      title: "Timed mock (then compare)",
      minutes: 45,
      steps: [
        "Read problem statement only in Primer or solution README.",
        "Timer **25 min**: your full design (steps 1–4 from lesson 1).",
        "Read Primer solution; mark 3 improvements to your answer.",
      ],
    },
    selfCheck: [
      "How do you avoid collisions on short keys?",
      "Analytics without killing read path?",
    ],
    memorizationTip: "Redo this mock once a week until smooth.",
    primerSolution: {
      title: "Primer — Pastebin/Bitly solution (closest canonical)",
      url: SD_PRIMER_SOLUTION("solutions/system_design/pastebin/README.md"),
    },
    learningObjectives: [
      "Encode hashing vs counter trade-offs",
      "Size storage for mappings",
    ],
    suggestedTodos: [
      "Re-run mock in 20 minutes after 1 week",
    ],
    resources: [
      { title: "Primer — Pastebin / Bit.ly section", kind: "exercise", url: PRIMER_QUESTIONS },
    ],
  },
  {
    id: "sd-24",
    title: "Design: Pastebin / text share",
    summary:
      "TTL, abuse, read/write asymmetry — follow Primer solution line by line.",
    primerTopic: { label: "Design Pastebin", href: sdPrimerHash("design-pastebincom-or-bitly") },
    practiceExercise: {
      title: "Deep read + redo",
      minutes: 50,
      steps: [
        "Read full Primer Pastebin solution once.",
        "Close the tab; redraw schema + APIs from memory.",
        "Re-open and fix gaps — especially TTL cleanup and abuse.",
      ],
    },
    selfCheck: [
      "How do you expire objects cheaply?",
      "Public vs private paste auth model?",
    ],
    primerSolution: {
      title: "Primer — Pastebin",
      url: SD_PRIMER_SOLUTION("solutions/system_design/pastebin/README.md"),
    },
    learningObjectives: [
      "Handle expiration and metadata",
    ],
    suggestedTodos: [
      "Note 3 interview phrases you’d reuse verbatim",
    ],
    resources: [
      { title: "Primer — Pastebin (README)", kind: "exercise", url: SD_PRIMER_SOLUTION("solutions/system_design/pastebin/README.md") },
    ],
  },
  {
    id: "sd-25",
    title: "Design: News feed",
    summary:
      "Fan-out on write vs read — Primer Twitter timeline solution is the main text.",
    primerTopic: { label: "Twitter timeline / Facebook feed", href: sdPrimerHash("design-the-twitter-timeline-and-search-or-facebook-feed-and-search") },
    practiceExercise: {
      title: "Celebrity problem",
      minutes: 55,
      steps: [
        "Read Primer Twitter solution sections on fan-out.",
        "On paper: normal user vs 100M-follower celebrity — two different strategies.",
        "List storage for timeline + ranking hook (even if vague).",
      ],
    },
    selfCheck: [
      "Hybrid fan-out: when and why?",
      "What metadata do you need for ranking later?",
    ],
    primerSolution: {
      title: "Primer — Twitter timeline",
      url: SD_PRIMER_SOLUTION("solutions/system_design/twitter/README.md"),
    },
    learningObjectives: [
      "Explain push vs pull fan-out",
      "Discuss hot keys and mitigations",
    ],
    suggestedTodos: [
      "Skim Facebook news-feed Quora links from Primer additional section",
    ],
    resources: [
      { title: "Primer — Twitter README", kind: "exercise", url: SD_PRIMER_SOLUTION("solutions/system_design/twitter/README.md") },
    ],
  },
  {
    id: "sd-26",
    title: "Design: Chat / messaging",
    summary:
      "Use Primer **web crawler** for large-scale async + fan-out patterns; supplement with WhatsApp architecture for messaging scale.",
    primerTopic: { label: "Design a web crawler (scale patterns)", href: sdPrimerHash("design-a-web-crawler") },
    practiceExercise: {
      title: "Crawler → messaging analogy",
      minutes: 45,
      steps: [
        "Skim Primer **web crawler** solution for URL frontier / politeness / scale — focus on queues and dedup.",
        "Map frontier worker pattern to **message delivery workers**.",
        "Read WhatsApp architecture article (resource below) for connection scale.",
      ],
    },
    selfCheck: [
      "How is chat different from feed fan-out?",
      "Delivery receipts: where do they add complexity?",
    ],
    primerSolution: {
      title: "Primer — Web crawler",
      url: SD_PRIMER_SOLUTION("solutions/system_design/web_crawler/README.md"),
    },
    learningObjectives: [
      "Borrow scale patterns across problem types",
      "Discuss presence and delivery at high level",
    ],
    suggestedTodos: [
      "Optional: Primer OO chat server notebook (different angle)",
    ],
    resources: [
      {
        title: "High Scalability — WhatsApp",
        kind: "article",
        url: "http://highscalability.com/blog/2014/2/26/the-whatsapp-architecture-facebook-bought-for-19-billion.html",
      },
    ],
  },
  {
    id: "sd-27",
    title: "Design: Notification system",
    summary:
      "Queue workers, templates, retries — align with **Mint.com** aggregation + **Twitter** fan-out ideas in Primer.",
    primerTopic: { label: "Design Mint.com", href: sdPrimerHash("design-mintcom") },
    practiceExercise: {
      title: "Notification pipeline",
      minutes: 45,
      steps: [
        "Read Primer **Mint.com** solution for scheduled jobs + aggregation patterns.",
        "Design notify: event → queue → workers for push/email/SMS with retry + dead letter.",
        "Add user preference filtering before send.",
      ],
    },
    selfCheck: [
      "How to avoid duplicate notifications?",
      "Digest vs realtime — trade-off?",
    ],
    primerSolution: {
      title: "Primer — Mint.com",
      url: SD_PRIMER_SOLUTION("solutions/system_design/mint/README.md"),
    },
    learningObjectives: [
      "Build worker-heavy async pipelines",
      "Handle retries and idempotency",
    ],
    suggestedTodos: [
      "Cross-compare with Twitter solution for fan-out",
    ],
    resources: [
      { title: "Primer — Mint README", kind: "exercise", url: SD_PRIMER_SOLUTION("solutions/system_design/mint/README.md") },
    ],
  },
  {
    id: "sd-28",
    title: "Design: Search autocomplete",
    summary:
      "Trie vs search cluster — use **query_cache** solution + Primer additional search-engine references.",
    primerTopic: { label: "Additional: search engine", href: sdPrimerHash("additional-system-design-interview-questions") },
    practiceExercise: {
      title: "Prefix search design",
      minutes: 50,
      steps: [
        "Re-read **query_cache** Primer solution with autocomplete lens.",
        "Sketch trie service vs Elasticsearch completion — when each wins.",
        "Plan incremental index updates as user types trending queries.",
      ],
    },
    selfCheck: [
      "How to minimize latency for first keystrokes?",
      "Ranking signals you might mention in follow-up?",
    ],
    primerSolution: {
      title: "Primer — Query cache / search engine",
      url: SD_PRIMER_SOLUTION("solutions/system_design/query_cache/README.md"),
    },
    learningObjectives: [
      "Structure prefix query path",
      "Discuss memory vs disk structures",
    ],
    suggestedTodos: [
      "Skim Stanford Google paper from Primer additional table (optional)",
    ],
    resources: [
      { title: "Stanford — Early Google (Background)", kind: "article", url: "http://infolab.stanford.edu/~backrub/google.html" },
    ],
  },
];

export function getConceptById(id: string): SdConcept | undefined {
  return SD_CURRICULUM.find((c) => c.id === id);
}

export function conceptIndexById(id: string): number {
  return SD_CURRICULUM.findIndex((c) => c.id === id);
}
