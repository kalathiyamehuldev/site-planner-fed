# Product Requirements Document (PRD)  
“Project Management Suite (PMS)”

## 1. Purpose  
Design and deliver a web-based Project Management Suite for interior-design firms and constuction firms, agencies, and their external stakeholders (vendors, customers). The platform should streamline project execution, government-approval workflows, and task management while providing permissions and AI-assisted productivity.

---

## 2. Goals & Success Metrics  
1. Decrease project kickoff time by 30 % through automated Project Creation process. 
2. Cut average government-approval cycle time by 25 % via guided Gov Approval Flow.  
3. Raise task completion rate by 20 % with AI-generated task suggestions and progress summaries.  
4. Achieve Proper Costing Method By Addeing Invoice Feature. AI Based Quotation.

---

## 3. Users & Personas  
| Persona | Description | Portal Access |
|---------|-------------|---------------|
| Company Admin(USER table) | In-house PMO or owner | Create projects, control permissions, dashboards |
| Designer(USER table) | Creates drawings, quotations | Task board, file versioning |
| Site Engineer(USER table) | Executes on site | Mobile-first task view, upload photos |
| Vendor | Supplies materials | View POs, attach invoices |
| Customer | End-client | Read-only progress, approvals |
| AI Assistant | System agent | Generate tasks, summaries |

---

## 4. Key Features  

### 4.1 Authentication & User Management  
1. **Auth Stack**  
   •  email/password (Bcrypt, 12 rounds).  
   • JWT access tokens (15 min) + refresh tokens (30 days) stored httpOnly.   
2. **User Hierarchy**  
   • _Company_ ➜ _Company Staff_ ➜ _Projects_.  
   • Company Super Admin (isSuperAdmin flag) has all permissions.  
   • Company Super Admin creates Company Staff users with companyId.  
   • Company Staff can create projects and manage company operations.  
3. **Role & Permission Model (Ultra-Simplified)**  
   • **Super Admin**: Full access to company (isSuperAdmin = true).  
   • **Company Staff**: Can create projects, manage tasks (has companyId).  
   • **External Users**: Project-level access when invited (customers, vendors, freelancers).  
   • Predefined system roles for external project invitations only.  
4. **Access Evaluation**  
   • Super Admin: All permissions for their company.  
   • Company Staff: Project creation and management permissions.  
   • External Users: Project-specific permissions only.  
   • AI assistant respects same permission structure.  

### 4.2 Projects & Pipelines  
1. Create project from template (includes predefined Gov Approval timeline).  
2. Assign users / groups; select permission scheme.  
3. Pipeline phases: **Planning → Design → Gov Approval → Execution → Handover**.  

### 4.3 Gov Approval Flow (High Priority)  
1. **Stage 0** – Prepare Quotation  
2. **Stage 1** – Key Plan Drawing  
3. **Stage 2** – Working Plan / Approval Drawings  
4. **Stage 3** – Assign to Approval Team & Site Manager  
5. **Stage 4** – Review & Comment Loop (versioned submissions, inline comments)  
6. **Stage 5** – Authority Submission & Timeline Tracking  
7. SLA timers and reminder notifications per stage.  
8. Parallel sub-flows allowed (e.g., Fire Dept vs. Municipality).  
9. Audit trail immutable; exportable PDF.

### 4.4 Tasks & Sub-Tasks  
• Kanban & Calendar views.  
• Attach docs, images.  
• Recursive sub-tasks.  
• % Project completion auto-recalculated on status change.

### 4.5 Document / File Manager  
• Versioning with diff viewer for DWG/PDF.  
• Role-based sharing (user, group, external link).  
• Predefined folders, custom allowed.

### 4.6 Dashboard & Reporting  
• Widgets: Kanban, Calendar, My Tasks, Burn-down, Gov Approval progress.  
• Org Admin can build custom dashboards.

### 4.7 AI Features  
1. **Task Generation** – When a new Gov stage begins, AI suggests checklist tasks.  
2. **Progress Summaries** – AI digests comments / status and posts daily summary.  
3. **Document Tagging** – Auto-label uploaded files for faster search.  
4. **Prompt Guardrails** – AI limited by same role permissions; no PII leakage.

---

## 5. Functional Requirements  

### 5.1 Authentication  
| ID | Requirement |
|----|-------------|
| AUTH-01 | System shall support OAuth (Google, Microsoft) and email/password signup. |
| AUTH-02 | System shall force email verification before project access. |
| AUTH-03 | Forgotten password flow must allow reset via time-limited token. |

### 5.2 Permission Scheme  
| PERM-01 | Admin can create, edit, delete permission schemes. |
| PERM-02 | Each project shall reference exactly one permission scheme. |
| PERM-03 | Permission checks enforced on backend via policy middleware. |

### 5.3 Gov Approval Flow  
| GOV-01 | Creation of a project shall auto-instantiate Gov Approval timeline. |
| GOV-02 | Each stage change requires user with `MANAGE_GOV_STAGE` permission. |
| GOV-03 | System shall log stage changes with timestamp and actor. |
| GOV-04 | Users may request resubmission; previous submission kept for audit. |

### 5.4 AI Assistant  
| AI-01 | AI suggestions must be reviewable; no auto-apply without human confirmation. |
| AI-02 | AI must not access documents tagged Confidential unless user has permission. |
| AI-03 | All AI actions logged for traceability. |

*(Full functional matrix in appendix)*

---

## 6. Non-Functional Requirements  
| Category | Target |
|----------|--------|
| Performance | ≤ 250 ms p95 API latency |
| Scalability | 1000 concurrent users / org |
| Security | OWASP Top-10, SOC-2 Type II |
| Availability | 99.9 % monthly uptime |
| Compliance | GDPR, local data-residency toggle |
| Internationalization | UTF-8, RTL ready |

---

## 7. System Architecture (High-level)  
1. **Frontend**: React 18 + Vite, TypeScript, Redux Toolkit.  
2. **Backend**: Node.js 20, NestJS, PostgreSQL, Redis for caching, MinIO/S3 for file store.  
3. **Auth**: Keycloak OR Auth0 (pluggable) with custom permission service.  
4. **AI Layer**: Langchain pipeline → OpenAI GPT-4o (fallback GPT-3.5) with vector store (PGVector) for project knowledge.  
5. **CI/CD**: GitHub Actions → Docker → Kubernetes (AWS EKS).  
6. **Observability**: Prometheus, Grafana, Sentry.

---

## 8. Milestones & Timeline  
| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Discovery & UX | 2 w | Wireframes, user flows |
| M1 – Core Auth & Projects | 4 w | Login, roles, project CRUD |
| M2 – Gov Approval MVP | 4 w | Full timeline, file versioning |
| M3 – Tasks & Dashboard | 3 w | Kanban, Calendar |
| M4 – AI Features | 3 w | Task suggestions, summaries |
| Hardening & Compliance | 2 w | Pen-test, audits |
| Launch | +1 w | Prod rollout |

---

## 9. Risks & Mitigations  
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Complex permission logic | Medium | High | Re-use Jira-style model, exhaustive tests |
| AI hallucination | Medium | Med | Human-in-loop review, temperature < 0.4 |
| Gov authority requirements change | Medium | High | Config-driven stages |

---

## 10. Open Questions  
1. Do we need on-prem deployment for large enterprises?  
2. Required regional data centers (e.g., UAE)?  
3. Which AI provider(s) allowed by client’s compliance?  
4. File size limits for drawings/videos?

---

## 11. Appendices  
• A. Detailed permission matrix (60+ permissions)  
• B. Database ERD (draft)  
• C. API contract examples  
• D. Wireframe links

---

_Authored by: Senior Software Architect_