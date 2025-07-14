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

#### Technical Implementation Details  
- **Frontend**: Dedicated Gov Approval page with multi-stage wizard interface  
- **State Management**: Redux slice (`govApprovalSlice.ts`) for workflow state  
- **Document Integration**: Extends existing document management for drawing versioning  
- **Task Integration**: Auto-generates tasks in task management system for each stage  
- **Permission Integration**: Leverages existing role-based access control  

#### Workflow Stages  

1. **Stage 1** – Key Plan Drawing  
   • Upload initial architectural drawings and plans  
   • Basic project layout and design concepts  
   • File validation and versioned storage  

2. **Stage 2** – Working Plan / Approval Drawings  
   • Detailed technical drawings for authority submission  
   • Compliance with local building codes and regulations  
   • AI-assisted document tagging and compliance checking  

3. **Stage 3** – Assignment & Team Setup  
   • Assign to Approval Team (internal reviewers)  
   • If no dedicated approval users available, auto-assign to Super Admin or Project Admin  
   • Assign to Site Manager (execution lead)  
   • Set roles and permissions for review process  

4. **Stage 4** – Internal Review & Quality Check  
   • Approval team reviews submission drawings  
   • Inline comments and annotations on drawings  
   • Resubmission option with versioned document tracking  
   • Approval team estimates timeline for authority approval process  
   • Quality gates before external submission  

5. **Stage 5** – Authority Submission & Tracking  
   • Submit approved drawings to relevant authorities  
   • Track submission status and authority responses  
   • Timeline monitoring based on team estimates  
   • Handle parallel submissions (Fire Dept, Municipality, etc.)  

6. **Stage 6** – Authority Response & Resubmission Management  
   • Receive authority feedback and requirements  
   • Manage resubmission cycles if needed  
   • Final approval tracking and documentation  

#### Technical Implementation Details  

**Stage 1 - Key Plan Drawing:**  
- UI Components: File upload component with drag-and-drop for DWG/PDF files  
- Validation: File format validation, size limits (max 50MB per file)  
- Storage: Versioned storage in document management system  
- Tasks: Auto-create "Review Key Plan" task for assigned designers  
- Permissions: Only users with `UPLOAD_DRAWINGS` permission can upload  

**Stage 2 - Working Plan / Approval Drawings:**  
- Document Types: Technical drawings, compliance certificates, structural plans  
- Validation: Compliance checklist integration with local building codes  
- Version Control: Automatic versioning with diff tracking for drawings  
- Integration: Link to existing ProductLibrary for material specifications  
- AI Assistance: AI document tagging and compliance checking  

**Stage 3 - Assignment & Team Setup:**  
- User Management: Integration with existing user hierarchy (Company Staff)  
- Role Assignment: Dedicated Gov Approval Team role with specific permissions  
- Fallback Assignment Logic: If no users with `GOV_APPROVAL_REVIEWER` role exist, auto-assign to:  
  - Super Admin (isSuperAdmin = true) as primary fallback  
  - Project Admin as secondary fallback  
- Site Manager: Link to existing project management and site engineer roles  
- Notification System: Email/in-app notifications for team assignments  
- Calendar Integration: Schedule review meetings and deadlines  

**Stage 4 - Internal Review & Quality Check:**  
- Review Interface: Annotation tools for drawings with commenting system  
- Task Management: Integration with existing task board for review activities  
- Timeline Estimation: Form-based timeline input with dropdown for authority types  
- Quality Gates: Checklist-based approval before authority submission  
- Document Comparison: Side-by-side view of document versions  
- Approval Workflow: Multi-level approval with digital signatures  

**Stage 5 - Authority Submission & Tracking:**  
- External Integration: API connections to government portals (where available)  
- Submission Package: Automated PDF generation with all required documents  
- Tracking Dashboard: Real-time status updates and submission tracking  
- Timeline Monitoring: Visual timeline with milestone tracking  
- Parallel Processing: Support for multiple authority submissions simultaneously  
- Document Templates: Pre-configured submission templates by region/authority  

**Stage 6 - Authority Response & Resubmission Management:**  
- Response Processing: Upload and categorize authority feedback  
- Change Management: Track changes required vs. changes implemented  
- Resubmission Workflow: Automated resubmission package generation  
- Audit Trail: Complete history of all submissions and responses  
- Final Approval: Integration with project status updates  
- Certificate Management: Storage and access control for approval certificates  

#### Technical Features  
- **SLA Timers**: Automated countdown timers with escalation notifications  
- **Parallel Sub-flows**: Support for concurrent approval processes (Fire Dept, Municipality, Environmental, etc.)  
- **Audit Trail**: Immutable log of all actions, timestamps, and user interactions  
- **PDF Export**: Comprehensive project approval report generation  
- **Mobile Support**: Responsive design for site managers and field staff  
- **Real-time Updates**: WebSocket integration for live status updates  
- **Integration Points**: Connects with Tasks, Documents, TimeTracking, and Dashboard modules  

#### Database Schema Extensions  
- **gov_approval_stages**: Stage definitions and current status  
- **gov_approval_submissions**: Submission history and versions  
- **gov_approval_comments**: Review comments and annotations  
- **gov_approval_timelines**: Timeline estimates and actual durations  
- **gov_approval_authorities**: Authority contact information and requirements

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