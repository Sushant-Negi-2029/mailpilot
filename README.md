# MailPilot — Privacy-First AI Email Triage & Reply Automation

> Built for Antigravity • Based on the PRD: AI Email Triage & Reply Automation (Gmail)

MailPilot reads incoming executive email, classifies each into a starter taxonomy (T1–T6), generates personalized draft replies in the user's authentic voice using models running inside the user's local boundary (**Mode A**), and enables rapid, keyboard-first batch review with strict safety guardrails.

---

## Key Guarantees Implemented

1. **Zero Auto-Send (v1)**: All outbound replies require human-in-the-loop batch review.
2. **Never Guess Rule (Section 6)**: Dates, times, numbers, and commitments are never hallucinated. Missing items insert highlighted placeholders (`[CONFIRM DATE]`, `[ADD FIGURE]`, `[NEEDS YOUR INPUT]`) and block approval until resolved.
3. **Approval Request Gate (T2)**: Drafts are **never** pre-generated or auto-approved. The user must first choose an executive decision (*Approve Spend*, *Decline*, or *Ask for Information*).
4. **Sensitivity Detection (100% Recall)**: Hard rules and pattern matchers detect financial figures/spends, auditor/regulator domains (`@deloitte.com`, `@sebi.gov.in`), legal/litigation keywords, senior leadership/VIP senders, and phishing wire change attempts. Sensitive emails are excluded from bulk actions and require explicit confirmation checkboxes.
5. **Safety on Send**: 
   - 30-second undo window with live countdown timer.
   - Emergency **Kill Switch** pauses all fetching, drafting, and outbound sending instantly.
6. **Executive Style Learning**: Learns greetings, sign-offs, and tone by recipient type (`boss`, `peer`, `client`, `vendor`, `unknown`). Hard-blocks generic AI phrases (*"I hope this email finds you well"*).
7. **Tamper-Evident Audit Trail**: Immutable logging of classifications, drafts, edits, approvals, rejections, and sends with CSV export.

---

## Project Structure

```
mailpilot/
├── src/
│   ├── types/index.ts            # Complete PRD data model & schemas
│   ├── services/
│   │   ├── categories.ts         # Starter taxonomy (T1-T6)
│   │   ├── classifier.ts         # Sensitivity check & calibrated classifier
│   │   ├── draftGenerator.ts     # Layered draft engine & placeholder checks
│   │   ├── styleProfile.ts       # Voice & tone parameters by recipient
│   │   ├── factsSheet.ts         # Reusable facts, policies & slots
│   │   ├── auditLogger.ts        # Append-only audit log & CSV exporter
│   │   ├── storage.ts            # Persistent local state & config
│   │   └── mockData.ts           # PRD Appendix sample cases & synthetic suite
│   ├── components/
│   │   ├── Header.tsx            # Kill Switch, Mode indicator & navigation
│   │   ├── Sidebar.tsx           # Category lanes & guardrail queues
│   │   ├── EmailCard.tsx         # Side-by-side triage card & inline editor
│   │   ├── SendBar.tsx           # Batch actions & 30s undo countdown
│   │   ├── FactsSheetModal.tsx   # Facts sheet manager
│   │   ├── StyleProfileModal.tsx # Editable style profile & banned phrases
│   │   ├── AuditLogModal.tsx     # Immutable audit log viewer
│   │   ├── DigestModal.tsx       # Morning triage summary
│   │   └── SettingsModal.tsx     # Local model endpoint (Ollama) & OAuth
│   ├── App.tsx                   # Main keyboard-first triage application
│   └── main.tsx
├── test-evaluation.js            # Automated PRD acceptance test suite
└── package.json
```

---

## Quickstart

### 1. Run PRD Acceptance Verification
```bash
node test-evaluation.js
```
*Executes all 17 automated tests for classification accuracy, sensitivity recall, zero-guess placeholders, and guardrails.*

### 2. Start the Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Keyboard Shortcuts in Triage View

- `J` / `↓`: Next email
- `K` / `↑`: Previous email
- `A`: Approve draft
- `E`: Edit draft inline
- `R`: Reject / Dismiss email
