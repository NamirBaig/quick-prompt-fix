export type Template = {
  title: string;
  category: string;
  prompt: string;
};

export const TEMPLATE_CATEGORIES = [
  "Resume",
  "Coding",
  "Research",
  "Marketing",
  "Email",
  "SQL",
  "Python",
  "Business",
  "Education",
  "Blogging",
  "Interview Prep",
  "Image Generation",
] as const;

export const TEMPLATES: Template[] = [
  {
    category: "Resume",
    title: "Rewrite a resume bullet",
    prompt:
      "Rewrite my resume bullet points for a mid-level product manager role so they lead with impact and include metrics.",
  },
  {
    category: "Resume",
    title: "Tailor resume to a job ad",
    prompt:
      "Tailor my resume to this job description, matching keywords and reordering my experience by relevance.",
  },
  {
    category: "Coding",
    title: "Debug an error",
    prompt: "Help me fix this error in my code and explain what caused it.",
  },
  {
    category: "Coding",
    title: "Code review",
    prompt:
      "Review this function for correctness, readability and performance, and suggest concrete improvements.",
  },
  {
    category: "Research",
    title: "Literature summary",
    prompt:
      "Summarize the current research on this topic, highlighting where the evidence agrees and where it conflicts.",
  },
  {
    category: "Research",
    title: "Compare two approaches",
    prompt: "Compare these two approaches and tell me which is better for my use case.",
  },
  {
    category: "Marketing",
    title: "Landing page copy",
    prompt: "Write landing page copy for my new product that converts visitors into signups.",
  },
  {
    category: "Marketing",
    title: "Ad variations",
    prompt: "Give me some ad headlines for a social campaign targeting small business owners.",
  },
  {
    category: "Email",
    title: "Cold outreach email",
    prompt: "Write a cold email to a potential client introducing my consulting services.",
  },
  {
    category: "Email",
    title: "Follow-up after no reply",
    prompt: "Write a polite follow-up email after someone did not reply to my last message.",
  },
  {
    category: "SQL",
    title: "Write a report query",
    prompt:
      "Write a SQL query that returns monthly revenue per customer segment from my orders and customers tables.",
  },
  {
    category: "SQL",
    title: "Optimize a slow query",
    prompt: "This query is slow. Make it faster and explain what you changed.",
  },
  {
    category: "Python",
    title: "Data cleaning script",
    prompt: "Write a Python script that cleans a messy CSV of customer records.",
  },
  {
    category: "Python",
    title: "Refactor to be testable",
    prompt: "Refactor this Python module so it is easier to unit test.",
  },
  {
    category: "Business",
    title: "Business plan outline",
    prompt: "Help me outline a business plan for a subscription coffee service.",
  },
  {
    category: "Business",
    title: "Competitor analysis",
    prompt: "Analyze my competitors and tell me where I can differentiate.",
  },
  {
    category: "Education",
    title: "Explain a hard concept",
    prompt: "Explain how neural networks work to a curious high school student.",
  },
  {
    category: "Education",
    title: "Build a lesson plan",
    prompt: "Create a lesson plan for teaching fractions to 10-year-olds over one week.",
  },
  {
    category: "Blogging",
    title: "Blog post draft",
    prompt: "Write a blog post about remote work productivity.",
  },
  {
    category: "Blogging",
    title: "SEO outline",
    prompt: "Create an SEO-friendly outline for an article targeting the keyword 'prompt engineering'.",
  },
  {
    category: "Interview Prep",
    title: "Behavioral answers",
    prompt: "Help me prepare STAR answers for common behavioral interview questions.",
  },
  {
    category: "Interview Prep",
    title: "Mock technical interview",
    prompt: "Act as an interviewer and run a mock system design interview with me.",
  },
  {
    category: "Image Generation",
    title: "Product photo prompt",
    prompt: "Generate an image prompt for a premium product photo of a ceramic coffee mug.",
  },
  {
    category: "Image Generation",
    title: "Illustration style",
    prompt: "Write an image prompt for a flat vector illustration of a team collaborating.",
  },
];
