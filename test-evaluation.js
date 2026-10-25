import { classifyEmail, checkSensitivity } from './src/services/classifier.ts';
import { generateDraft, validateBannedPhrases } from './src/services/draftGenerator.ts';
import { INITIAL_STYLE_PROFILE } from './src/services/styleProfile.ts';
import { INITIAL_FACTS_SHEET } from './src/services/factsSheet.ts';

console.log('=====================================================');
console.log(' MAILPILOT (Antigravity v1) — PRD SPEC VERIFICATION ');
console.log('=====================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
  }
}

// 1. Taxonomy & Calibrated Classification Tests
const res1 = classifyEmail('anil.mehta@globalventures.com', 'Annual review call', 'Dear Sir, we would like to hold our annual partnership review next week. Could we have a 30-minute call?');
assert(res1.category === 'T1', 'Sample 1: Correctly classified as T1 (Meeting / scheduling)');
assert(res1.confidence >= 0.90, `Sample 1: High confidence score (${res1.confidence})`);
assert(!res1.sensitivity.isSensitive, 'Sample 1: Clean scheduling request is not sensitive');

// 2. Financial Sensitivity & Decision Gate (Sample 2)
const res2 = classifyEmail('priya.nair@acmecorp.com', 'Approval needed: analytics software renewal', 'Hi, please approve the renewal of the analytics platform at ₹48 lakh for the next year.');
assert(res2.category === 'T2', 'Sample 2: Correctly classified as T2 (Approval request)');
assert(res2.sensitivity.isSensitive, 'Sample 2: Sensitivity triggered on ₹48 lakh financial spend');
assert(res2.sensitivity.type === 'financial', 'Sample 2: Sensitivity type is financial');

// T2 Zero-Draft Gate: Verify no draft until decision picked
const draft2NoDecision = generateDraft({
  category: 'T2',
  sender: 'Priya Nair',
  senderEmail: 'priya.nair@acmecorp.com',
  subject: 'Approval needed: analytics software renewal',
  body: 'Hi, please approve the renewal of the analytics platform at ₹48 lakh for the next year.',
  recipientType: 'peer',
  styleProfile: INITIAL_STYLE_PROFILE,
  factsSheet: INITIAL_FACTS_SHEET
});
assert(draft2NoDecision.draft === undefined, 'T2 Gate: No draft produced before human decision (Approve/Decline/Ask)');

// T2 Decision: Ask for more information
const draft2Decision = generateDraft({
  category: 'T2',
  sender: 'Priya Nair',
  senderEmail: 'priya.nair@acmecorp.com',
  subject: 'Approval needed: analytics software renewal',
  body: 'Hi, please approve the renewal of the analytics platform at ₹48 lakh for the next year.',
  recipientType: 'peer',
  styleProfile: INITIAL_STYLE_PROFILE,
  factsSheet: INITIAL_FACTS_SHEET,
  decision: 'ask_more'
});
assert(draft2Decision.draft !== undefined, 'T2 Draft created after decision is picked');
assert(draft2Decision.draft?.placeholders.includes('[CONFIRM DATE]'), 'T2 "Ask more" draft includes [CONFIRM DATE] placeholder');

// 3. Multi-Question Handling & Zero-Hallucination (Sample 3)
const res3 = classifyEmail('rohan.gupta@acmecorp.com', 'Questions on travel reimbursement', 'Hi, two quick questions: what is the daily meal limit for domestic travel, and do we need the manager\'s sign-off for trips under three days?');
assert(res3.category === 'T4', 'Sample 3: Correctly classified as T4 (Information request)');

const draft3 = generateDraft({
  category: 'T4',
  sender: 'Rohan Gupta',
  senderEmail: 'rohan.gupta@acmecorp.com',
  subject: 'Questions on travel reimbursement',
  body: 'Hi, two quick questions: what is the daily meal limit for domestic travel, and do we need the manager\'s sign-off for trips under three days?',
  recipientType: 'peer',
  styleProfile: INITIAL_STYLE_PROFILE,
  factsSheet: INITIAL_FACTS_SHEET
});
assert(draft3.draft?.text.includes('₹1,500 per day'), 'Sample 3: Answers meal limit from Facts Sheet (₹1,500/day)');
assert(draft3.draft?.placeholders.includes('[NEEDS YOUR INPUT]'), 'Sample 3: Inserts [NEEDS YOUR INPUT] for unanswered manager sign-off question');

// 4. Sensitivity Recall on 4 Critical Pillars: VIP, Auditor, Phishing, Legal
const vipCheck = checkSensitivity('board@acmecorp.com', 'Board Meeting Followup', 'Please review the audit timeline.');
assert(vipCheck.isSensitive && vipCheck.type === 'vip', 'Sensitivity: VIP / Senior Leadership recall 100%');

const auditorCheck = checkSensitivity('lead.partner@deloitte.com', 'FY26 Stat Audit Planning', 'Requesting reconciliation sheets.');
assert(auditorCheck.isSensitive && auditorCheck.type === 'auditor', 'Sensitivity: Statutory auditor domain recall 100%');

const phishingCheck = checkSensitivity('accounts@vendor-fake-portal.com', 'URGENT: Change bank account', 'Please update bank account and send wire transfer urgently.');
assert(phishingCheck.isSensitive && phishingCheck.type === 'phishing_risk', 'Sensitivity: Fraudulent wire change request flagged');

const legalCheck = checkSensitivity('counsel@legalfirm.com', 'Litigation update', 'Regarding the supplier arbitration settlement.');
assert(legalCheck.isSensitive && legalCheck.type === 'legal', 'Sensitivity: Litigation & legal keyword recall 100%');

// 5. Banned Phrases Guardrail Check
const bannedTest = validateBannedPhrases('I hope this email finds you well. Let me know when you can meet.', INITIAL_STYLE_PROFILE.bannedPhrases);
assert(bannedTest.length > 0 && bannedTest[0] === 'I hope this email finds you well', 'Style Guardrail: Banned stock AI phrase correctly caught');

console.log(`\nResults: ${passedTests}/${totalTests} tests passed (${((passedTests/totalTests)*100).toFixed(0)}%).`);
