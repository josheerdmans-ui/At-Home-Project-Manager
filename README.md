# At Home Project Manager

This repository follows a strict workflow:

1. Spec
2. Plan
3. Build
4. Review

No UI feature implementation starts until the data layer and business logic are defined.

## Project Spec Template

Use this section as the source of truth for what we are building and why.

### 1) The What

- Product name:
- Primary users:
- Main jobs-to-be-done:
- Non-goals (explicitly out of scope):

### 2) The Why

- Problem statement:
- Why now:
- Success outcomes:
- Failure risks:

### 3) Core Loops

Define the repeatable user/system loops that drive value.

#### Loop A: Capture
- Trigger:
- User action:
- System response:
- Stored data:

#### Loop B: Plan
- Trigger:
- User action:
- System response:
- Stored data:

#### Loop C: Execute + Review
- Trigger:
- User action:
- System response:
- Stored data:

### 4) Strict Constraints

- Tech stack is fixed: Vite + React + Tailwind CSS + Supabase + GitHub.
- TypeScript strict mode is mandatory.
- No placeholder/fake data in implemented features.
- All feature data must map to real Supabase structures.
- RLS-aware data model and access patterns are required.
- Design DNA must follow a High-Contrast Laboratory aesthetic:
  - Bone-White background
  - Monospaced typography for all data
  - Sharp-edged UI components with 1px black borders
  - Safety Orange and Blueprint Blue accents
  - Precision industrial instrument feel from the year 2030

### 5) Data-Layer-First Gate

Before feature build begins, complete and approve:

- Business concepts in `CONCEPTS.md`
- Database schema plan
- Supabase types contract in `types.ts`
- RLS strategy

### 6) Review Protocol

After each major component/feature build:

1. Code Review
2. Security Audit

Minimum checks:
- Logic clarity and maintainability
- Render performance and unnecessary re-renders
- Supabase auth/RLS vulnerabilities
- Type safety
