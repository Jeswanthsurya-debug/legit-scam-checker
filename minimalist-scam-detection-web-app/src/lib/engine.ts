import {
  brandForKeyword,
  checkDomain,
  COMPANIES,
  companyReport,
  domainReport,
  normaliseHost,
} from "./senders";
import type {
  Analysis,
  LinkFinding,
  ModelOpinion,
  SenderReport,
  Signal,
  SignalKind,
  SignalSeverity,
  Verdict,
} from "./types";

interface Rule {
  id: string;
  label: string;
  kind: SignalKind;
  severity: SignalSeverity;
  weight: number;
  note: string;
  patterns: RegExp[];
  maxHits?: number;
}

const RULES: Rule[] = [
  {
    id: "urgency",
    label: "urgent pressure",
    kind: "pressure",
    severity: "medium",
    weight: 12,
    note: "A manufactured deadline is the most reliable way to stop you thinking clearly.",
    patterns: [
      /\b(?:urgent|urgently|immediately|right now|asap|act now|act fast)\b/gi,
      /\b(?:within|in) (?:an? |the next )?(?:hour|hours|minute|minutes|24 hours|today|minutes)\b/gi,
      /\b(?:final|last) (?:warning|notice|reminder|chance|call)\b/gi,
      /\b(?:expires?|closing|deadline|time[- ]sensitive|don'?t delay|hurry)\b/gi,
    ],
  },
  {
    id: "threat",
    label: "fear or threat",
    kind: "pressure",
    severity: "high",
    weight: 14,
    note: "Real institutions send consequences by post or in-app, not as a threat inside a forwarded message.",
    patterns: [
      /\b(?:account|card|services?|number|sim|netbanking|net banking|banking|upi|wallet)\s+(?:will be |is |are |has been )?(?:suspended|blocked|closed|terminated|deactivated|blacklisted|frozen)\b/gi,
      /\b(?:legal action|police|arrest|penalty|fine of|lawsuit|court proceedings|customs seizure)\b/gi,
      /\b(?:debit freeze|negative marking|cibil will be affected|permanent(?:ly)? blocked)\b/gi,
    ],
  },
  {
    id: "fee",
    label: "asks for a fee",
    kind: "money",
    severity: "high",
    weight: 18,
    note: "Asking for money before you get anything is the signature move of recruiting and refund scams.",
    patterns: [
      /\b(?:registration|processing|security|clearance|onboarding|training|verification|documentation|refundable|activation)\s+(?:fee|charge|deposit|amount)s?\b/gi,
      /\b(?:pay|send|transfer|deposit)\s+(?:a\s+|your\s+)?(?:small\s+|one[- ]time\s+|nominal\s+)?(?:fee|amount|deposit|charge)s?\b/gi,
      /\b(?:fee|charge|deposit)s?\s+of\s*(?:rs\.?|₹|inr|\$|usd)?\s*[\d,]+/gi,
      /\bupfront\b|\bin advance\b|\badvance payment\b/gi,
    ],
  },
  {
    id: "untraceable",
    label: "untraceable payment",
    kind: "money",
    severity: "high",
    weight: 20,
    note: "Gift cards and crypto are chosen because they cannot be reversed once sent.",
    patterns: [
      /\b(?:gift ?cards?|itunes card|google play card|steam card|amazon gift)\b/gi,
      /\b(?:bitcoin|btc|usdt|tether|crypto(?:currency|wallet)?|binance|metamask|wallet address)\b/gi,
      /\b(?:wire transfer|western union|money ?gram|m[- ]pesa|airtm)\b/gi,
    ],
  },
  {
    id: "code",
    label: "asks for a code",
    kind: "credentials",
    severity: "high",
    weight: 20,
    note: "A one-time code is the last thing standing between a scammer and your account. Nobody legitimate needs it.",
    patterns: [
      /\b(?:otp|one[- ]time (?:code|password|pin)|verification code|secure code|passcode)\b/gi,
      /\b(?:cvv|cvc|card (?:number|details)|expiry date|expiration date|card ending)\b/gi,
      /\b(?:aadhaar|pan card|ssn|social security|passport number)\b/gi,
      /\b(?:pin|mpin)\s*(?:number|code)?\b/gi,
    ],
  },
  {
    id: "credentials",
    label: "asks for a password",
    kind: "credentials",
    severity: "high",
    weight: 22,
    note: "No real employer, bank or courier ever needs your password or recovery phrase.",
    patterns: [
      /\b(?:password|passphrase|login credentials|sign[- ]in details)\b/gi,
      /\b(?:seed phrase|recovery phrase|private key|backup phrase|12 words)\b/gi,
    ],
  },
  {
    id: "privatechat",
    label: "moves you off the record",
    kind: "channel",
    severity: "medium",
    weight: 12,
    note: "Switching you to a private chat removes the paper trail and the platform's scam filters.",
    patterns: [
      /\b(?:whats ?app|whatsapp)\s*(?:me|us|on|at|number)?\b/gi,
      /\b(?:telegram|signal me|hangouts|dm me|inbox me|text me at|contact me on)\b/gi,
      /\b(?:hr manager|interview) (?:on|via|at) (?:telegram|whatsapp|hangouts)\b/gi,
    ],
  },
  {
    id: "noInterview",
    label: "hired without an interview",
    kind: "job",
    severity: "high",
    weight: 16,
    note: "Offers that arrive before anyone has spoken to you are almost always fee traps.",
    patterns: [
      /\b(?:no interview|interview (?:is |was |will be )?not required|without (?:an |any )?interview|direct (?:selection|appointment|hiring))\b/gi,
      /\b(?:you (?:have been|are|'re) (?:selected|hired|shortlisted)|your profile has been selected)\b/gi,
      /\bcongratulations\b[^.\n]{0,44}(?:selected|hired|shortlisted|won|chosen)/gi,
      /\b(?:immediate(?:ly)? (?:hiring|appointment|joining)|offer letter attached|your offer is ready)\b/gi,
    ],
  },
  {
    id: "secrecy",
    label: "asks you to keep it quiet",
    kind: "pressure",
    severity: "medium",
    weight: 12,
    note: "Legitimate offers survive being discussed with your family, a friend or your bank.",
    patterns: [
      /\b(?:do not|don'?t) (?:discuss|share|tell|mention|inform|contact)[^.\n]{0,40}(?:anyone|anybody|anyone else|friends?|family|bank|branch|employer|department|anyone else)\b/gi,
      /\b(?:keep this|keep it) (?:confidential|private|between us|quiet)\b/gi,
      /\b(?:strictly confidential|do not inform anyone)\b/gi,
    ],
  },
  {
    id: "easymoney",
    label: "money for very little work",
    kind: "job",
    severity: "medium",
    weight: 13,
    note: "Simple tasks with high pay are priced that way to make you skip the questions.",
    patterns: [
      /\b(?:simple (?:tasks?|data entry|typing work)|easy (?:tasks?|money)|get paid (?:to|for) (?:click|like|review|rate|test)|captcha work|part time (?:job|work) from home)\b/gi,
      /\b(?:no experience (?:needed|required|necessary)|anyone can (?:do|apply)|just a phone)\b/gi,
    ],
  },
  {
    id: "toogood",
    label: "too good to be true",
    kind: "money",
    severity: "medium",
    weight: 14,
    note: "Guaranteed money is the offer itself. The payout never arrives, the fee does.",
    patterns: [
      /\bguaranteed (?:returns?|income|payment|job|profit|refund|payout)\b/gi,
      /\b(?:risk[- ]free|doub(?:le|ling) your|instant (?:profit|returns?))\b/gi,
      /(?:rs\.?|₹|inr|\$|usd)\s?[\d,]{4,}\s*(?:\/|per|a)\s*(?:day|week|hour|month)/gi,
      /\b[\d]{2,3}\s?%\s?(?:returns?|roi|interest|profit|per (?:month|annum|week))/gi,
    ],
  },
  {
    id: "parcel",
    label: "parcel held for money",
    kind: "money",
    severity: "high",
    weight: 15,
    note: "Couriers never collect customs or holding charges through a link in a text message.",
    patterns: [
      /\b(?:parcel|package|shipment|consignment|courier|item)\s+(?:is |has been |was )?(?:stuck|held|on hold|pending|detained|waiting|unclaimed)\b/gi,
      /\b(?:customs (?:fee|duty|charge|clearance)|clearance charge|holding fee|redelivery fee|release fee)\b/gi,
      /\b(?:address (?:is )?incomplete|wrong address|could not be delivered)\b/gi,
    ],
  },
  {
    id: "overpayment",
    label: "overpayment then refund",
    kind: "money",
    severity: "high",
    weight: 15,
    note: "The classic shape: extra money appears, you refund the difference, then the original payment bounces.",
    patterns: [
      /\b(?:overpaid|accidentally sent|extra (?:amount|money) was|sent you more than|refund the (?:difference|balance))\b/gi,
      /\b(?:refundable? deposit|advance (?:amount|fee)|partial refund)\b/gi,
    ],
  },
  {
    id: "prize",
    label: "unsolicited prize",
    kind: "money",
    severity: "high",
    weight: 15,
    note: "You cannot win a draw you never entered, and a real prize never costs money to release.",
    patterns: [
      /\b(?:you(?:'| a)?ve (?:won|won a|been chosen)|winner|lucky draw|lottery|prize money|claim your (?:prize|reward|reward|gift))\b/gi,
      /\b(?:free (?:iphone|iphone 1[567]|ps5|gift|voucher)|cash bonus|congratulations!)\b/gi,
    ],
  },
  {
    id: "kyc",
    label: "asks for identity documents",
    kind: "credentials",
    severity: "medium",
    weight: 13,
    note: "Photos of identity documents are reused for loans and SIM cards in your name.",
    patterns: [
      /\b(?:send|share|upload|attach)[^.\n]{0,40}(?:photo|picture|scan|copy|image) of your (?:id|identity|passport|licence|license|aadhaar|pan|card)\b/gi,
      /\b(?:kyc (?:documents?|verification|update)|documents? for verification)\b/gi,
    ],
  },
  {
    id: "impersonation",
    label: "speaks for a big brand",
    kind: "impersonation",
    severity: "low",
    weight: 6,
    note: "Named brands are used for credibility. What matters is whether the link and sender actually belong to them.",
    patterns: [
      /\b(?:dhl|fedex|bluedart|blue dart|delhivery|amazon|flipkart|phonepe|paytm|google pay|paypal|netflix|instagram|whatsapp|linkedin)\b/gi,
      /\b(?:sbi|state bank|hdfc|icici|axis bank|income tax|gst|customs|irs|hmrc|microsoft|apple)\b/gi,
    ],
    maxHits: 1,
  },
];

const URL_PATTERNS = [
  /https?:\/\/[^\s<>"')]+/gi,
  /\bwww\.[^\s<>"')]+/gi,
  /\b(?:[a-z0-9][a-z0-9-]*\.)+(?:com|net|in|org|co|io|info|xyz|top|work|live|click|icu|buzz|zip|shop|online|site|link|cc|app|biz|us|uk|me)(?:\/[^\s]*)?/gi,
];

const EMAIL_PATTERN = /[\w.+-]+@((?:[\w-]+\.)+[a-z]{2,})/gi;
const PHONE_PATTERN = /(?:\+?\d[\d\s-]{8,14}\d)/g;

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end;
}

function detectLinks(text: string): LinkFinding[] {
  const emails: { start: number; end: number }[] = [];
  for (const match of text.matchAll(EMAIL_PATTERN)) {
    emails.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length });
  }

  const seen = new Set<string>();
  const findings: LinkFinding[] = [];

  for (const pattern of URL_PATTERNS) {
    for (const match of text.matchAll(new RegExp(pattern.source, "gi"))) {
      const start = match.index ?? 0;
      const raw = match[0].replace(/[.,;:!?)]+$/, "");
      const end = start + raw.length;
      if (raw.length < 5) continue;
      if (emails.some((span) => overlaps({ start, end }, span))) continue;

      let host = raw.toLowerCase();
      if (!/^https?:\/\//.test(host)) host = `https://${host}`;
      try {
        const parsed = new URL(host);
        const hostname = normaliseHost(parsed.hostname);
        if (!hostname.includes(".")) continue;
        if (seen.has(hostname)) continue;
        seen.add(hostname);
        const check = checkDomain(hostname);
        findings.push({
          raw,
          host: hostname,
          risk: check.risk,
          reasons: check.reasons,
          officialFor: check.officialFor,
        });
      } catch {
        continue;
      }
    }
  }

  return findings;
}

interface Candidate extends Signal {
  ruleId: string;
}

function collectCandidates(text: string): Candidate[] {
  const candidates: Candidate[] = [];

  for (const rule of RULES) {
    const hits: { phrase: string; start: number; end: number }[] = [];
    for (const pattern of rule.patterns) {
      for (const match of text.matchAll(new RegExp(pattern.source, "gi"))) {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        if (hits.some((hit) => overlaps(hit, { start, end }))) continue;
        hits.push({ phrase: match[0], start, end });
      }
    }
    const maxHits = rule.maxHits ?? 2;
    hits
      .sort((a, b) => b.phrase.length - a.phrase.length)
      .slice(0, maxHits)
      .forEach((hit, index) => {
        candidates.push({
          id: `${rule.id}-${index}`,
          ruleId: rule.id,
          label: rule.label,
          phrase: hit.phrase,
          start: hit.start,
          end: hit.end,
          weight: rule.weight,
          severity: rule.severity,
          kind: rule.kind,
          note: rule.note,
        });
      });
  }

  return candidates;
}

function linkSignal(finding: LinkFinding, start: number, end: number): Candidate {
  const label =
    finding.officialFor ?
      "official brand link"
    : finding.reasons.some((reason) => reason.startsWith("Contains")) ? "lookalike link"
    : finding.reasons.some((reason) => reason.includes("shortener")) ? "shortened link"
    : finding.reasons.some((reason) => reason.includes("IP address")) ? "raw address link"
    : finding.reasons.some((reason) => reason.includes("ending")) ? "risky link ending"
    : "unknown link";

  const weight =
    finding.risk === "high" ? 18
    : finding.risk === "medium" ? 10
    : finding.risk === "low" ? 5
    : -8;

  return {
    id: `link-${finding.host}`,
    ruleId: "link",
    label,
    phrase: finding.raw,
    start,
    end,
    weight,
    severity: weight >= 15 ? "high" : weight >= 8 ? "medium" : "low",
    kind: "link",
    note:
      finding.officialFor ?
        `This really is a ${finding.officialFor} domain.`
      : `${finding.reasons[0] ?? "We could not verify this domain"}.`,
  };
}

function companySenderReport(text: string): SenderReport | null {
  const lower = text.toLowerCase();
  const name = Object.keys(COMPANIES).find((key) => lower.includes(key));
  if (!name) return null;
  const report = companyReport(name);
  const label = name.replace(/\b\w/g, (character) => character.toUpperCase());
  return {
    query: label,
    kind: "company",
    status: report.status,
    headline: report.headline,
    detail: report.detail,
    sources: report.sources,
    provider: "demo",
  };
}

function senderReport(text: string, links: LinkFinding[], categorySlug: string): SenderReport {
  const emailMatch = [...text.matchAll(EMAIL_PATTERN)][0];
  const phoneMatch = [...text.matchAll(PHONE_PATTERN)][0];

  if (emailMatch) {
    const domain = emailMatch[1].toLowerCase();
    const report = domainReport(domain);
    if (report.status !== "unknown") {
      return {
        query: domain,
        kind: "domain",
        status: report.status,
        headline: report.headline,
        detail: report.detail,
        sources: report.sources,
        provider: "demo",
      };
    }
    // An unknown domain is worth less than a real company record, if there is one.
    const company = categorySlug === "job-offer" ? companySenderReport(text) : null;
    if (company) return company;
    return {
      query: domain,
      kind: "domain",
      status: report.status,
      headline: report.headline,
      detail: report.detail,
      sources: report.sources,
      provider: "demo",
    };
  }

  const suspicious = links.find((link) => link.risk === "high") ?? links.find((link) => link.risk !== "clean");
  if (suspicious) {
    const report = domainReport(suspicious.host);
    return {
      query: suspicious.host,
      kind: "domain",
      status: report.status,
      headline: report.headline,
      detail: report.detail,
      sources: report.sources,
      provider: "demo",
    };
  }

  const phone = phoneMatch?.[0];
  if (phone) {
    return {
      query: phone.trim(),
      kind: "phone",
      status: "unknown",
      headline: "Number not in our registry",
      detail:
        "Demo mode keeps a curated list of reported numbers. Live checks search public complaint boards for this number.",
      sources: [],
      provider: "demo",
    };
  }

  return {
    query: "",
    kind: "none",
    status: "unknown",
    headline: "No sender to check",
    detail: "There was no email address, link or phone number in this message to verify.",
    sources: [],
    provider: "demo",
  };
}

const CATEGORIES: { slug: string; label: string; keywords: string[] }[] = [
  {
    slug: "job-offer",
    label: "Job offer",
    keywords: [
      "internship", "job", "offer", "position", "role", "hiring", "recruiter", "recruitment",
      "cv", "resume", "salary", "stipend", "interview", "campus", "placement", "hr ", "hr:",
      "data entry", "work from home", "part time", "staffing", "employment",
    ],
  },
  {
    slug: "parcel",
    label: "Delivery or parcel",
    keywords: [
      "parcel", "package", "shipment", "courier", "customs", "consignment", "dispatch",
      "delivery", "redelivery", "address", "unclaimed", "waybill", "tracking",
    ],
  },
  {
    slug: "payment",
    label: "Payment or refund",
    keywords: [
      "refund", "upi", "payment", "transaction", "wallet", "transfer", "cashback",
      "recharge", "order", "invoice", "subscription", "billing",
    ],
  },
  {
    slug: "banking",
    label: "Bank or account",
    keywords: [
      "bank", "account", "kyc", "atm", "debit", "credit card", "netbanking", "ifsc",
      "statement", "loan", "emi", "cibil", "otp",
    ],
  },
  {
    slug: "investment",
    label: "Investment or crypto",
    keywords: [
      "crypto", "bitcoin", "usdt", "invest", "returns", "profit", "trading", "portfolio",
      "forex", "mining", "staking", "signal group",
    ],
  },
  {
    slug: "prize",
    label: "Prize or giveaway",
    keywords: ["winner", "won", "prize", "lottery", "lucky draw", "giveaway", "reward", "free gift"],
  },
  {
    slug: "government",
    label: "Government or tax",
    keywords: ["income tax", "gst", "aadhaar", "pan card", "customs duty", "epfo", "irs", "hmrc", "police"],
  },
  {
    slug: "romance",
    label: "Relationship",
    keywords: ["love", "darling", "beautiful", "met you", "deployment", "military", "widow", "send me money"],
  },
];

function detectCategory(text: string): { slug: string; label: string } {
  const lower = ` ${text.toLowerCase()} `;
  let best = { slug: "other", label: "General message", score: 0 };
  for (const category of CATEGORIES) {
    const score = category.keywords.reduce(
      (total, keyword) => (lower.includes(keyword) ? total + 1 : total),
      0,
    );
    if (score > best.score) best = { slug: category.slug, label: category.label, score };
  }
  return { slug: best.slug, label: best.label };
}

function buildNextSteps(verdict: Verdict, slug: string, context: { hasLink: boolean; hasFee: boolean; asksCode: boolean }): string[] {
  const steps: string[] = [];

  if (verdict === "scam") {
    steps.push("Don't reply, and don't open the link — the goal is to keep you in the conversation.");
    if (context.hasFee) steps.push("No real employer, courier or bank asks for a fee to release something that is yours. Keep the money.");
    if (context.asksCode) steps.push("Never share a one-time code. If you already did, change that account's password now and call the number on the back of your card.");
    if (slug === "job-offer") steps.push("Search the company name plus the word “scam” before sending anything, and look for the role on the company's own careers page.");
    if (slug === "parcel") steps.push("If you are expecting a parcel, open the courier's app or their official website and check the tracking number there.");
    if (slug === "payment" || slug === "banking") steps.push("Call your bank on the number printed on your card, not any number in this message.");
    if (slug === "investment") steps.push("No regulated scheme guarantees returns. Check the registration number with your market regulator.");
    steps.push("Report and delete. Screenshot it first if you want a record for your bank.");
  } else if (verdict === "careful") {
    steps.push("Pause before replying. A day of silence costs you nothing and breaks most scripts.");
    steps.push("Verify through a channel you already trust: the official app, the number on your card, or the company's own website.");
    if (slug === "job-offer") steps.push("Ask for the offer on the company's own email domain and the name of someone you can call.");
    if (slug === "parcel") steps.push("Enter the tracking number on the courier's official site rather than tapping through.");
    steps.push("Never move to a payment, a code or a document upload while you are still unsure.");
  } else {
    steps.push("Nothing here needs a decision today — you can reply whenever it suits you.");
    steps.push("If you want to be certain, open the company's app or website directly instead of using the link in the message.");
    steps.push("Keep an eye out for a follow-up that introduces urgency, a fee or a code. That is where these usually turn.");
  }

  return steps.slice(0, 4);
}

function buildGreenFlags(text: string, signals: Signal[], links: LinkFinding[]): string[] {
  const flags: string[] = [];
  const asksMoney = signals.some((signal) => signal.kind === "money");
  const asksCredentials = signals.some((signal) => signal.kind === "credentials");
  const pressured = signals.some((signal) => signal.kind === "pressure");
  const officialLink = links.some((link) => link.risk === "clean");

  if (!asksMoney) flags.push("No payment, fee or deposit is requested");
  if (!asksCredentials) flags.push("No password, card detail or one-time code is requested");
  if (!pressured) flags.push("No artificial deadline pushing you to act fast");
  if (officialLink) flags.push("Every link points to a domain the brand actually owns");
  if (links.length === 0) flags.push("No links to tap at all");
  if (/\b(?:please|thank you|kindly|whenever|no rush)\b/i.test(text)) flags.push("The tone leaves room for you to say no");

  return flags.slice(0, 4);
}

function rankOf(verdict: Verdict): number {
  return verdict === "safe" ? 0 : verdict === "careful" ? 1 : 2;
}

function verdictFromScore(score: number): Verdict {
  if (score >= 74) return "safe";
  if (score >= 45) return "careful";
  return "scam";
}

const HEADLINES: Record<Verdict, string[]> = {
  safe: [
    "Nothing here behaves like a scam. Reply when you're ready.",
    "This reads like an ordinary message. We didn't find a single well-known scam pattern.",
  ],
  careful: [
    "Mostly fine, with a few things worth checking before you reply.",
    "Nothing is proven either way — but the shape of this message is worth a second look.",
  ],
  scam: [
    "This has the fingerprints of a scam. Don't pay, don't tap, don't reply.",
    "Every pattern we look for in real fraud is present in this message.",
  ],
};

export function analyseMessage(rawText: string): Analysis {
  const text = rawText.slice(0, 4000);
  const lower = text.toLowerCase();

  const links = detectLinks(text);
  const candidates = collectCandidates(text);

  for (const link of links) {
    const index = text.toLowerCase().indexOf(link.raw.toLowerCase());
    if (index >= 0) candidates.push(linkSignal(link, index, index + link.raw.length));
  }

  // Keep the strongest non-overlapping spans so the highlight layer stays readable.
  candidates.sort((a, b) => b.weight - a.weight || a.start - b.start);
  const chosen: Candidate[] = [];
  for (const candidate of candidates) {
    if (chosen.some((existing) => overlaps(existing, candidate))) continue;
    chosen.push(candidate);
  }
  chosen.sort((a, b) => a.start - b.start);

  // A brand name on its own is not a warning. When every link really belongs to that
  // brand, the mention is just the brand talking about itself.
  const noRiskyLinks = links.every((link) => link.risk === "clean");
  const hasRealRisk = chosen.some((candidate) => candidate.weight >= 10);
  const visible =
    noRiskyLinks && !hasRealRisk ?
      chosen.filter((candidate) => candidate.ruleId !== "impersonation")
    : chosen;

  const signals: Signal[] = visible.map(({ ruleId: _ruleId, ...signal }) => signal);

  let score = 96;
  const perRule = new Map<string, number>();
  for (const signal of signals) {
    if (signal.weight <= 0) continue;
    const count = (perRule.get(signal.id.split("-")[0]) ?? 0) + 1;
    perRule.set(signal.id.split("-")[0], count);
    score -= signal.weight * (1 + 0.18 * (count - 1));
  }

  // Escalators: combinations are far more damning than the parts.
  const has = (id: string) => signals.some((signal) => signal.id.startsWith(id));
  const mentionsBrand = brandForKeyword(text);
  const riskyLink = links.find((link) => link.risk === "high" || link.risk === "medium");

  if (has("fee") && (has("urgency") || has("noInterview"))) score -= 10;
  if (has("code") && (has("urgency") || has("threat"))) score -= 10;
  if (mentionsBrand && riskyLink && !riskyLink.officialFor) score -= 14;
  if (has("credentials") && has("privatechat")) score -= 8;
  if (has("untraceable")) score -= 6;
  if (has("prize") && has("fee")) score -= 10;
  if (/\b(?:do not|don'?t) (?:share|tell|discuss) (?:this|it) with (?:anyone|anybody)\b/i.test(lower)) score -= 12;
  if (/\b(?:why waiting|kindly do the needful|dear customer|valued customer)\b/i.test(lower)) score -= 8;

  const greenFlags = buildGreenFlags(text, signals, links);
  score += Math.min(12, greenFlags.length * 4);

  if (text.trim().length < 25) score = Math.max(score, 58);

  const trustScore = Math.round(Math.max(3, Math.min(97, score)));
  let verdict = verdictFromScore(trustScore);

  const critical =
    has("credentials") ||
    has("untraceable") ||
    (has("fee") && has("noInterview")) ||
    (mentionsBrand !== undefined && riskyLink !== undefined && riskyLink.risk === "high");
  if (critical && trustScore > 52) {
    verdict = "scam";
  }

  const category = detectCategory(text);
  const weightSum = signals.reduce((total, signal) => total + Math.max(0, signal.weight), 0);
  let confidence = 58 + Math.min(30, weightSum * 0.5);
  if (text.trim().length < 60) confidence -= 14;
  if (riskyLink) confidence += 6;
  if (greenFlags.length >= 3 && weightSum < 10) confidence += 6;
  confidence = Math.round(Math.max(52, Math.min(96, confidence)));

  const sender = senderReport(text, links, category.slug);

  const headline = HEADLINES[verdict][weightSum > 60 ? 1 : 0];

  return {
    verdict,
    trustScore,
    headline,
    category: category.label,
    categorySlug: category.slug,
    signals,
    greenFlags,
    nextSteps: buildNextSteps(verdict, category.slug, {
      hasLink: links.length > 0,
      hasFee: has("fee"),
      asksCode: has("code") || has("credentials"),
    }),
    links,
    sender,
    confidence,
    model: {
      provider: "demo",
      model: "Legit pattern engine v2",
    },
  };
}

/** Blend the offline engine with an optional live model opinion. */
export function mergeOpinion(analysis: Analysis, opinion: ModelOpinion): Analysis {
  if (opinion.provider === "demo" || opinion.trustScore === undefined) return analysis;

  const blended = Math.round(analysis.trustScore * 0.65 + opinion.trustScore * 0.35);
  let verdict = verdictFromScore(blended);
  const engineRank = rankOf(analysis.verdict);
  const modelRank = rankOf(opinion.verdict ?? verdict);
  if (verdict === "safe" && (engineRank === 2 || modelRank === 2)) verdict = "careful";

  const nextSteps =
    opinion.nextSteps && opinion.nextSteps.length >= 2 ? opinion.nextSteps.slice(0, 4) : analysis.nextSteps;

  return {
    ...analysis,
    verdict,
    trustScore: Math.max(3, Math.min(97, blended)),
    headline: opinion.headline?.trim() || analysis.headline,
    nextSteps,
    model: opinion,
  };
}

export function excerptOf(text: string, length = 170): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= length ? clean : `${clean.slice(0, length).trimEnd()}…`;
}

export { companyReport };
