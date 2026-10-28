# 01 — Project Overview

## 1. Vision
Provide one trusted online home for SIC's public identity, projects, events, recruitment and internal operations.

## 2. Objectives
- Make club activity visible to students, visitors, partners and college administration.
- Organize members across multiple technical domains and operational teams.
- Standardize event proposal, approval, publication and registration.
- Track attendance and contributions with privacy-aware access.
- Support project portfolios, competitions, achievements and certificates.
- Reduce fragmented management across forms, spreadsheets, email and chat.

## 3. Users
- Anonymous visitor
- Public event registrant / recruitment applicant
- Authenticated member
- Team lead
- Vice President
- President
- Faculty coordinator
- System administrator

## 4. Non-goals for the first release
- Full accounting/payment processing
- Native Android/iOS app
- Real-time chat replacement for WhatsApp
- Automatic scraping and republishing of arbitrary news
- Complex points economy or gamification
- Public exposure of private member contact information

## 5. Architecture
Browser → React app → Supabase Auth / Postgres API  
Browser → Supabase Storage (only under storage policies)  
Browser → Edge Functions for public registration, QR check-in validation, notifications and other trusted workflows.

All database tables containing personal, internal or editable data must have RLS enabled. Public content should be exposed only through narrowly scoped policies or server functions.

## 6. Data principles
- Store a single profile per authenticated person.
- A person can belong to multiple domains and teams.
- A user can have a system role and also be a member of multiple teams.
- Event and recruitment decisions must retain who made the decision and when.
- Public profile fields must be explicitly opted into; email and phone are private by default.
- Prefer soft archival for important records instead of destructive deletion.

## 7. Success criteria
- A visitor can browse public pages and register for a published event.
- A student can apply to join SIC.
- An authenticated member can submit a project or event proposal.
- A lead can review assigned work within their scope.
- President/VP can make final decisions on important approvals.
- Private member/application data is inaccessible to anonymous users.
- The site is usable on mobile and supports basic PWA installation.
