<!--
Purpose of this file: State why the portfolio site exists (the
"Purpose" section below) and define the content sections it must
include to fulfill that purpose. Other specs derive from this one —
component-spec.md builds the UI for these sections, content-schema.md
defines the data shapes behind them, and constraints.md enforces the
"curated, not exhaustive" discipline declared here.
-->

# Purpose

This portfolio is a curated, opinionated representation of how I think, design, and build complex systems—not a collection of miscellaneous projects. My background in simulation, real‑time software, and distributed architectures means the site is intentionally crafted to highlight depth, rigor, and engineering judgment over breadth. Its purpose is to make my approach to system design legible: the constraints I navigate, the decisions I make, and the kinds of problems I’m built to solve. It exists so that the right opportunities and collaborators can immediately recognize the work I do—and why it matters.

---

It should include the following:

## 1. Clear Positioning (Landing Page)

This is where most portfolios fall flat.

I want a tight, specific headline that answers:

- What I do
- At what level
- In what domain

**Example:**

> “Senior Systems & Software Architect specializing in real‑time simulation, digital twins, and safety‑critical control systems across transportation and energy — with a focus on AI‑augmented engineering.”

Then immediately support it with:

- 2–3 key strengths drawn from my actual practice (e.g., “deterministic real‑time systems,” “digital‑twin & simulation platforms,” “AI‑augmented SDLC,” “architectural governance via RFCs/ADRs”)
- Links to your best projects (not all of them)

---

## 2. Featured Projects (Core of the Portfolio)

This is the most important section. Don’t list everything—pick **3–5 serious projects**.

> **Hard cap:** at most **5** projects may carry `featured: true` in [content-schema.md](content-schema.md). The cap is enforced at build time by `validate-content.ts` (see [content-schema.md → Validation flow](content-schema.md#validation-flow)) so the curation discipline can’t silently slip. If a sixth project deserves featuring, demote one first.

Each project should read like a _mini case study_, not a README clone:

### For each project include:

- **Problem statement**
  - What real-world problem were you solving?

- **Why it’s hard**
  - Constraints (real-time, precision, hardware limits, etc.)

- **Architecture**
  - Diagrams (this is huge for your level)

- **Key technical decisions**
  - Why CUDA vs CPU?
  - Why gRPC vs REST?

- **Tradeoffs**
  - What you _didn’t_ do and why

- **Outcome**
  - Performance gains, accuracy, reliability improvements

If you do this well, you’ll immediately differentiate from 95% of portfolios.

---

## 3. Code Samples (Curated, Not Exhaustive)

Link to GitHub repos, but guide the reader:

- Highlight specific modules:
  - “Physics engine core”
  - “HAL layer”
  - “CUDA kernel implementation”

- Point to **entry points**, not entire repos

Bonus points:

- Include diagrams next to code
- Explain tricky parts (race conditions, latency control, etc.)

---

## 4. Architecture & Systems Thinking Section

This is where you can really separate yourself.

Include:

- System diagrams (clean, professional)
- Patterns you use:
  - Domain-driven design
  - Event-driven systems
  - Real-time pipelines

- “How I approach system design” (short but sharp)

---

## 5. Resume + Experience Summary

Don’t just upload a PDF—summarize:

- Key roles (1–2 lines each)
- Impact (not responsibilities)
- Domains (medical, energy, transportation, etc.)

Then link to full resume.

---

## 6. Tools & Technologies (But Not a Buzzword Dump)

Group by capability:

- **Languages:** C#, C++, Python, Java
- **Real‑time / embedded / GPU:** C++, CUDA, deterministic control systems, physics engines
- **Web & UI:** Blazor, React, Qt/QML, WPF
- **Distributed systems & integration:** gRPC, REST, GraphQL, OPC, HIL interfaces
- **Data & QA:** SQL Server, MongoDB, V&V automation, unit testing
- **AI‑augmented engineering:** Claude Code, GitHub Copilot, GPT‑5.X Codex, Anthropic 4.X Opus, RAG, FAISS vector embeddings
- **Frameworks & DevOps:** .NET, Git, Docker, CI/CD

Avoid listing everything you’ve ever touched — group by capability, not by buzzword.

---

## 7. Contact + Signal of Availability

Make it easy to act:

- Email
- LinkedIn
- GitHub

Optional but powerful:

- “Open to Principal / Staff / Architect roles in simulation, digital engineering, transportation, energy, robotics, industrial automation, or medtech.”

---

## What Most People Get Wrong

This is where you can gain leverage:

- ❌ Too many small projects
- ❌ No explanation of _why_ decisions were made
- ❌ No architecture diagrams
- ❌ Generic “full-stack developer” positioning
- ❌ README-style descriptions instead of case studies

## Technical Pro-Tips for github.io:

- **Use a Static Site Generator:** Tools like **Jekyll**, **Hugo**, or **Astro** make it easier to manage content via Markdown while keeping the site lightning-fast.
- **Responsive Design:** Ensure the site looks perfect on mobile. Many recruiters will first click your link from their phones.
