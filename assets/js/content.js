/*
 * Single source of truth for the site. Edit this file to change what shows up
 * on the home page, the listing pages, the resume and the ⌘K palette.
 *
 * Anything still marked TODO is placeholder copy (resume, trips); replace it with your own.
 * Entries with `draft: true` render as "soon" and are not linked.
 */

export const profile = {
  name: "Atharva Mhetar",
  handle: "atharvamh",
  roles: ["curious human", "engineer", "traveller", "builder", "note-taker", "daydreamer"], // hero reads "I'm a/an …"
  tagline: "Engineer. Builder. Professional rabbit-hole explorer.",
  email: "atharvamhetar37@gmail.com",
  about: [
    "I'm a backend engineer who likes building the infrastructure that quietly powers products at scale: distributed systems, cloud-native platforms and the APIs between them.",
    "I care about reliability, simple design and teams that ship well together. I use AI tools every day to multiply what a small team can do, and I try to do it carefully.",
    "Away from the keyboard I'm planning a trip or chasing a what-if. This site is where it all lands: what I build, notes I take while learning, itineraries and ideas that don't fit anywhere else.",
  ],
  facts: [
    ["Craft", "Software engineering, end to end"],
    ["Obsessed with", "How things work under the hood"],
    ["Always up for", "A good trip"],
    ["Currently", "Shipping, writing, wandering"],
    ["Open to", "Interesting problems & good collaborators"],
  ],
  links: [
    { label: "GitHub", href: "https://github.com/atharvamh" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/atharvamhetar-254577161" },
    { label: "Email", href: "mailto:atharvamhetar37@gmail.com" },
  ],
};

/**
 * Things I build. Leave empty to hide the Build section everywhere (nav, 3D node, palette).
 * Add real, working projects only: { title, blurb, stack: [], year, href } - href is optional; draft: true shows it as "soon".
 */
export const projects = [
  {
    title: "Next project, in progress",
    blurb: "A working, deployed project will land here. Placeholder until then.",
    stack: ["Go", "Kubernetes"],
    year: "2026",
    draft: true,
  },
];

/** Engineering notes. Each real note lives at /engineering-notes/<slug>/index.html */
export const notes = [
  {
    slug: "redis-internals",
    title: "Redis Internals",
    blurb: "Threading model, event loop, persistence, replication, clustering and eviction: how Redis stays fast without giving up correctness.",
    date: "2026-09-18",
    tags: ["redis", "systems design"],
  },
  {
    slug: "database-engineering",
    title: "Database Engineering",
    blurb: "Transactions, ACID, isolation, storage internals and indexing: the trade-offs every relational engine makes.",
    date: "2026-09-18",
    tags: ["databases", "systems design"],
  },
  {
    slug: "netflix-architecture",
    title: "Netflix: Behind the Play Button",
    blurb: "How Netflix's streaming architecture actually holds together, grounded in their own engineering writing.",
    date: "2026-09-18",
    tags: ["architecture", "systems design"],
  },
];

/** Trip itineraries. Each real one lives at /trips/<slug>/index.html */
export const trips = [
  {
    slug: "kerala-2026",
    title: "Kerala: Hills, Wildlife & Backwaters",
    blurb: "Munnar, Thekkady, Alleppey and Kochi in five days, with a day-by-day plan and a log of 25 stops.",
    where: "Kerala, India",
    when: "Oct 2026",
    days: 6,
  },
];

/** Standalone experiments that already live in this repo. */
export const lab = [
  {
    title: "The Mathematics of Life",
    blurb: "An interactive thought experiment: modelling life with math and a bit of simulation.",
    href: "/thought-experiments/mathematical-model-of-life/",
    tags: ["thought experiment", "interactive"],
  },
  {
    title: "Multiversal Destabilization Report",
    blurb: "A fan-made TVA case file on the collapse of Earth-616: eight breach events, an incursion clock and a hero registry.",
    href: "/thought-experiments/multiversal-destabilization-report/",
    tags: ["what-if", "fan fiction"],
  },
  {
    title: "Attack on Titan Notes",
    blurb: "Fan notes on the lore: the Nine Titans, their inheritance lines, and a breakdown of the final episodes. Spoilers.",
    href: "/thought-experiments/attack-on-titan/",
    tags: ["fan notes", "spoilers"],
  },
];

/** Resume. Rendered on /resume/ and summarised on the home page. */
export const resume = {
  summary:
    "Backend and distributed-systems engineer building cloud-native platforms at scale. Founding engineer on Veeam Data Cloud for Microsoft Entra ID, taking it from zero to a global product.",
  experience: [
    {
      role: "Senior Software Engineer",
      org: "Veeam Software",
      when: "Oct 2026 - Present",
      points: [
        "Technical lead for Veeam Data Cloud for Microsoft Entra ID: architecture decisions, mentoring, and delivery across engineering, product and QA.",
        "Run agentic workflows with Claude Code and MCP for features, bug fixes and telemetry analysis; drove team-wide adoption.",
        "Conducted 100+ technical interviews to build the engineering teams.",
      ],
    },
    {
      role: "Software Engineer 3",
      org: "Veeam Software",
      when: "Jun 2024 - Sep 2026",
      points: [
        "Founding engineer on Veeam Data Cloud for Microsoft Entra ID: zero to production in 5 months across 23 regions, then 3,600+ enterprise customers and ~10 TB protected within a year.",
        "Built an event ingestion pipeline over geo-distributed queues, a zero-downtime compliance migration of 700+ customer storage accounts, and an internal operations portal in 3 months.",
        "Wrote a .NET proxy to work around cross-partition query limits in the Azure Cosmos DB Go SDK.",
        "On Kasten as a Service, built cluster verification with live agent status and the deboarding flow, including a reconciliation daemon that automates agent and Kasten teardown.",
      ],
    },
    {
      role: "Software Engineer 2",
      org: "Skypoint",
      when: "Aug 2022 - May 2024",
      points: [
        "Built Skypoint Chat end to end: React chat UI and a Text-to-SQL layer on Azure OpenAI that answers questions over Lakehouse data.",
        "Built multi-tenant ingestion services into Azure Data Lake Storage, orchestrated with Azure Data Factory.",
        "Built a Databricks service with a custom SQL query interface, and an extensible Cosmos DB schema for customer-defined properties.",
      ],
    },
    {
      role: "Software Engineer, then Senior Software Engineer",
      org: "Graphene AI",
      when: "Aug 2020 - Jul 2022",
      points: [
        "Migrated AngularJS apps through Angular to React, improving reuse, velocity and performance while mentoring teammates.",
        "Built sales and KPI analytics dashboards and license management UIs with React, Redux, SSO, JWT and Tableau.",
        "Built REST APIs in .NET Core and Node.js/Express on SQL Server, and replaced manual deployments with Azure DevOps CI/CD.",
        "Star Performer award; recommended for early promotion to Senior Software Engineer.",
      ],
    },
    {
      role: "Research Intern",
      org: "Indian Institute of Science (IISc)",
      when: "May 2019 - Dec 2019",
      points: [
        "Embedded Systems Lab: built an autonomous ToF-sensor navigation robot with PID control and a Delta Robot with custom linear actuators for an ICS security testbed.",
        "Built a self-balancing robot on a TI TIVA C microcontroller with register-level embedded C and a PID loop.",
      ],
    },
    {
      role: "Executive Member and Sub-SIG Coordinator",
      org: "ACM, NITK chapter",
      when: "Dec 2017 - Apr 2020",
      points: ["Coordinated technical groups, workshops and club events, and contributed to club projects."],
    },
  ],
  education: [
    { what: "B.Tech", org: "National Institute of Technology Karnataka", when: "2016 - 2020" },
    { what: "Research Intern, Electrical and Electronics Engineering", org: "Indian Institute of Science (IISc)", when: "2019" },
    { what: "Higher Secondary", org: "Pace Junior Science College", when: "2014 - 2016" },
    { what: "High School", org: "St. Xavier's High School, Kolhapur", when: "2002 - 2014" },
  ],
  skills: {
    Backend: ["Go", ".NET Core", "Node.js / Express", "REST APIs", "Event-driven systems", "Distributed systems"],
    "Cloud & Infra": ["Kubernetes", "Docker", "Azure (Data Lake, Data Factory, OpenAI, DevOps)", "Databricks", "CI/CD"],
    Data: ["Cosmos DB", "SQL Server", "SQL", "Lakehouse"],
    Frontend: ["React", "Redux", "Angular", "Tableau"],
    Embedded: ["Embedded C", "PID control", "Fusion 360"],
    Leadership: ["Technology leadership", "Leading development teams", "Hiring and mentoring", "AI-assisted engineering"],
  },
  certifications: ["Go Essential Training", "Azure Fundamentals", "Docker and Kubernetes", "SQL Essential Training", "The Complete Web Development Bootcamp"],
};

/** Home-page sections, in order. Drives the nav, the 3D nodes and the palette. */
export const sections = [
  { id: "about", label: "About", hue: "#8b7bff" },
  { id: "build", label: "Build", hue: "#4fe3d1" },
  { id: "notes", label: "Notes", hue: "#ffb86b" },
  { id: "trips", label: "Trips", hue: "#ff7eb6" },
  { id: "lab", label: "Lab", hue: "#7ec8ff" },
  { id: "resume", label: "Resume", hue: "#b6f26b" },
].filter((s) => s.id !== "build" || projects.length > 0);
