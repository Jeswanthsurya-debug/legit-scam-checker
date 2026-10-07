// Demo-mode intelligence: a small, realistic registry of brands, official domains,
// known-bad domains and companies. Used when no API keys are configured.

export interface BrandEntry {
  brand: string;
  keywords: string[];
  official: string[];
}

export const BRANDS: BrandEntry[] = [
  { brand: "DHL", keywords: ["dhl"], official: ["dhl.com", "dhl.in", "dhl.co.in", "dhl-express.com"] },
  { brand: "FedEx", keywords: ["fedex"], official: ["fedex.com", "fedex.in"] },
  { brand: "Blue Dart", keywords: ["bluedart", "blue dart"], official: ["bluedart.com"] },
  { brand: "Delhivery", keywords: ["delhivery"], official: ["delhivery.com"] },
  { brand: "Amazon", keywords: ["amazon"], official: ["amazon.com", "amazon.in"] },
  { brand: "Flipkart", keywords: ["flipkart"], official: ["flipkart.com", "flipkartcare.com"] },
  { brand: "PhonePe", keywords: ["phonepe"], official: ["phonepe.com", "phonepe.in"] },
  { brand: "Paytm", keywords: ["paytm"], official: ["paytm.com", "paytm.in"] },
  { brand: "Google Pay", keywords: ["google pay", "gpay"], official: ["google.com", "pay.google.com"] },
  { brand: "PayPal", keywords: ["paypal"], official: ["paypal.com"] },
  { brand: "UPS", keywords: ["ups "], official: ["ups.com"] },
  { brand: "SBI", keywords: ["sbi", "state bank"], official: ["sbi.co.in", "onlinesbi.sbi"] },
  { brand: "HDFC Bank", keywords: ["hdfc"], official: ["hdfcbank.com"] },
  { brand: "ICICI Bank", keywords: ["icici"], official: ["icicibank.com"] },
  { brand: "Axis Bank", keywords: ["axis bank"], official: ["axisbank.com"] },
  { brand: "Microsoft", keywords: ["microsoft", "msft"], official: ["microsoft.com"] },
  { brand: "Apple", keywords: ["apple"], official: ["apple.com"] },
  { brand: "Netflix", keywords: ["netflix"], official: ["netflix.com"] },
  { brand: "Instagram", keywords: ["instagram"], official: ["instagram.com"] },
  { brand: "WhatsApp", keywords: ["whatsapp"], official: ["whatsapp.com"] },
  { brand: "LinkedIn", keywords: ["linkedin"], official: ["linkedin.com"] },
];

const OFFICIAL_INDEX = new Map<string, string>();
for (const brand of BRANDS) {
  for (const domain of brand.official) {
    OFFICIAL_INDEX.set(domain, brand.brand);
  }
}

export const SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "is.gd",
  "cutt.ly",
  "rb.gy",
  "rebrand.ly",
  "ow.ly",
  "goo.gl",
  "shorturl.at",
  "tr.ee",
  "linktr.ee",
]);

export const RISKY_TLDS = new Set([
  "top",
  "xyz",
  "zip",
  "click",
  "icu",
  "buzz",
  "loan",
  "work",
  "click",
  "rest",
  "surf",
  "monster",
  "quest",
  "cam",
  "bar",
  "gq",
  "tk",
  "ml",
]);

export interface FlaggedDomain {
  headline: string;
  detail: string;
  reported: string;
  sources: { title: string; url: string; snippet: string }[];
}

export const FLAGGED_DOMAINS: Record<string, FlaggedDomain> = {
  "dhl-parcel-reschedule.net": {
    headline: "Not a DHL domain",
    detail:
      "Registered 11 days ago through a privacy proxy, and listed in three parcel-fee fraud reports collected this month. DHL does not collect customs charges on a .net reschedule page.",
    reported: "11 days ago",
    sources: [
      {
        title: "Parcel fee scam: fake DHL reschedule pages",
        url: "https://www.example.org/advisory/dhl-reschedule",
        snippet:
          "Victims are asked to pay a small customs fee to release a parcel that was never shipped.",
      },
      {
        title: "Consumer complaints thread #48210",
        url: "https://www.example.org/thread/48210",
        snippet: "Same domain, same 1,850 rupee fee, same phone number.",
      },
    ],
  },
  "dhl-express-support.top": {
    headline: "Impersonating DHL Express",
    detail:
      "The .top domain was registered 4 days ago and has no history before this week. It appears in a cluster of parcel-hold messages sent to Indian numbers.",
    reported: "4 days ago",
    sources: [
      {
        title: "Newly registered domain bulletin",
        url: "https://www.example.org/nrd/dhl-express-support.top",
        snippet: "Registered 2026-10-02, privacy proxy, no MX record.",
      },
    ],
  },
  "upi-refund-desk.xyz": {
    headline: "Fake refund desk",
    detail:
      "This domain is not connected to NPCI, PhonePe, Paytm or any bank. Refund-desk pages on .xyz domains are a common way to collect card details and OTPs.",
    reported: "3 weeks ago",
    sources: [
      {
        title: "UPI refund scam advisory",
        url: "https://www.example.org/advisory/upi-refund-desk",
        snippet: "The page asks for card number, expiry and OTP before a refund can be released.",
      },
    ],
  },
  "brightlinestaffing.co": {
    headline: "No company record found",
    detail:
      "We could not find a registered company, a GST number, a careers page or any employee profiles behind this domain. Staffing agencies that charge a fee before an interview almost never refund it.",
    reported: "no record",
    sources: [
      {
        title: "Company registry lookup",
        url: "https://www.example.org/registry/brightlinestaffing.co",
        snippet: "No incorporation match for Brightline Staffing.",
      },
    ],
  },
  "nemotron-campushiring.work": {
    headline: "Recruiting-fee scam",
    detail:
      "Pretends to recruit for a large technology company but asks for a documentation fee over Telegram. The real company posts graduate roles only on its own careers domain.",
    reported: "6 days ago",
    sources: [
      {
        title: "Fake campus hiring ring",
        url: "https://www.example.org/advisory/campus-hiring",
        snippet: "Offer letters sent within 20 minutes, payment requested on Telegram.",
      },
    ],
  },
  "netflix-billing-refresh.info": {
    headline: "Card-harvesting page",
    detail:
      "Phishing kit that mirrors a billing page. The real service never asks you to re-enter a full card number from an email link.",
    reported: "2 weeks ago",
    sources: [
      {
        title: "Phishing kit write-up",
        url: "https://www.example.org/advisory/netflix-refresh",
        snippet: "Kits rotates domains weekly to dodge mail filters.",
      },
    ],
  },
};

export interface CompanyEntry {
  status: "verified" | "unknown" | "flagged";
  headline: string;
  detail: string;
  sources: { title: string; url: string; snippet: string }[];
}

export const COMPANIES: Record<string, CompanyEntry> = {
  "northwind analytics": {
    status: "verified",
    headline: "Real company",
    detail:
      "Registered in 2019, 140 employees, a public careers page and a matching payroll domain. They do not use messaging apps for offers.",
    sources: [
      {
        title: "Northwind Analytics careers",
        url: "https://www.example.org/careers/northwind",
        snippet: "All internship offers are sent from @northwindanalytics.com only.",
      },
    ],
  },
  "stellar microsystems": {
    status: "verified",
    headline: "Real company",
    detail:
      "Product company with a verifiable address and a documented interview process that always includes a video call.",
    sources: [
      {
        title: "Stellar Microsystems hiring process",
        url: "https://www.example.org/hiring/stellar",
        snippet: "Two rounds, both scheduled by email from the official domain.",
      },
    ],
  },
  "quantum ledger labs": {
    status: "flagged",
    headline: "Repeated recruiting complaints",
    detail:
      "Twelve reports in the last quarter describe a registration fee followed by silence once payment was made.",
    sources: [
      {
        title: "Job scam reports",
        url: "https://www.example.org/reports/quantum-ledger",
        snippet: "They ask for 1,499 rupees for document verification, then stop replying.",
      },
    ],
  },
};

export interface DomainCheck {
  risk: "high" | "medium" | "low" | "clean";
  reasons: string[];
  officialFor?: string;
}

export function normaliseHost(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export function officialBrandForHost(host: string): string | undefined {
  const clean = normaliseHost(host);
  return OFFICIAL_INDEX.get(clean);
}

export function brandForKeyword(text: string): BrandEntry | undefined {
  const lower = text.toLowerCase();
  return BRANDS.find((brand) => brand.keywords.some((keyword) => lower.includes(keyword)));
}

export function checkDomain(host: string): DomainCheck {
  const clean = normaliseHost(host);
  const reasons: string[] = [];

  const officialBrand = OFFICIAL_INDEX.get(clean);
  if (officialBrand) {
    return { risk: "clean", reasons: [`Official ${officialBrand} domain`], officialFor: officialBrand };
  }

  if (SHORTENERS.has(clean)) {
    return {
      risk: "high",
      reasons: ["Link shortener that hides the real destination"],
    };
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(clean)) {
    reasons.push("Uses a raw IP address instead of a named website");
  }

  if (clean.startsWith("xn--") || clean.includes(".xn--")) {
    reasons.push("Uses lookalike characters that imitate a real brand");
  }

  const tld = clean.split(".").pop() ?? "";
  if (RISKY_TLDS.has(tld)) {
    reasons.push(`The .${tld} ending is common in short-lived scam sites`);
  }

  if (clean.split(".").length > 3) {
    reasons.push("Deep multi-part domain, often built to look official");
  }

  if (/\d/.test(clean) && clean.replace(/[^a-z]/g, "").length > 4) {
    reasons.push("Digits inside the domain name, a common lookalike trick");
  }

  for (const brand of BRANDS) {
    for (const keyword of brand.keywords) {
      const squashed = clean.replace(/[^a-z0-9]/g, "");
      const brandSquashed = keyword.replace(/[^a-z0-9]/g, "");
      if (
        brandSquashed.length > 2 &&
        squashed.includes(brandSquashed) &&
        !brand.official.includes(clean)
      ) {
        reasons.push(`Contains “${brand.brand}” but is not a ${brand.brand} domain`);
        break;
      }
    }
    if (reasons.some((reason) => reason.startsWith("Contains “"))) {
      break;
    }
  }

  if (clean.split(".").length === 2 && ["com", "in", "org", "co", "net", "io", "co.in"].includes(tld)) {
    return { risk: reasons.length ? "medium" : "low", reasons };
  }

  if (reasons.length === 0) {
    reasons.push("We have no history for this domain");
  }

  const looksLikeBrandCopy = reasons.some((reason) => reason.startsWith("Contains “"));
  if (looksLikeBrandCopy) {
    return { risk: "high", reasons };
  }

  return { risk: reasons.length >= 2 ? "high" : "medium", reasons };
}

export function domainReport(host: string) {
  const clean = normaliseHost(host);
  const flagged = FLAGGED_DOMAINS[clean];
  if (flagged) {
    return {
      status: "flagged" as const,
      headline: flagged.headline,
      detail: flagged.detail,
      sources: flagged.sources,
    };
  }
  const brand = OFFICIAL_INDEX.get(clean);
  if (brand) {
    return {
      status: "verified" as const,
      headline: `Official ${brand} domain`,
      detail: `This domain has been owned by ${brand} for years and is used for their real messages.`,
      sources: [],
    };
  }
  return {
    status: "unknown" as const,
    headline: "Not in our registry",
    detail:
      "Demo mode only knows a curated registry of domains. Turn on live checks to search the web for reports about this sender.",
    sources: [],
  };
}

export function companyReport(name: string) {
  const key = name.trim().toLowerCase();
  const entry = COMPANIES[key];
  if (entry) {
    return {
      status: entry.status,
      headline: entry.headline,
      detail: entry.detail,
      sources: entry.sources,
    };
  }
  return {
    status: "unknown" as const,
    headline: "Could not confirm the company",
    detail:
      "Demo mode has a small company registry. With live checks on, Legit searches the web for the company's careers page, reviews and scam reports.",
    sources: [],
  };
}
