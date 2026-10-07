export interface Example {
  id: string;
  chip: string;
  hint: string;
  text: string;
}

// Five chips, five different outcomes: heavy scam, scam, careful, scam, safe.
export const EXAMPLES: Example[] = [
  {
    id: "internship",
    chip: "Internship offer",
    hint: "job scam",
    text: `Dear candidate,

Congratulations! Your profile has been selected for a paid remote internship at NVIDIA partner labs (stipend ₹42,000/month, only 2 hours a day).

Interview is not required. Your offer letter is ready and attached on our portal: https://nemotron-campushiring.work/offer?id=8842

You only need to pay a one-time documentation fee of ₹1,499 to activate your offer. This must be completed within 24 hours or the position will be given to the next candidate.

For any questions, message our HR manager on Telegram @nv_hiring_desk. Please do not discuss this offer with anyone until joining is confirmed.

— Campus Recruitment Cell`,
  },
  {
    id: "parcel",
    chip: "Parcel stuck SMS",
    hint: "delivery scam",
    text: `DHL: Your parcel #DHL-8829104 is held at the customs warehouse because the delivery address is incomplete. A clearance charge of Rs 1,850 is pending.

Please update your address and complete the payment within 12 hours, otherwise the parcel will be returned and your account will be suspended.

Update now: http://dhl-parcel-reschedule.net/in?id=8829104`,
  },
  {
    id: "upi",
    chip: "UPI refund",
    hint: "refund scam",
    text: `Hello, this is Sana from the refunds desk. Your refund of ₹1,240 for order OD-2291 was approved this morning and is ready to be credited to your account.

Please confirm your details on the refund portal: https://paytm-refund-help.net/od2291

The link expires in 2 hours, after which the refund goes back to the sender.

Please do not inform anyone else about this reference number while the refund is being processed.`,
  },
  {
    id: "bankotp",
    chip: "Bank OTP",
    hint: "bank scam",
    text: `Dear customer, unusual activity was detected on your SBI netbanking. Your account will be suspended today.

To stop this, share the OTP sent to your registered mobile number with our verification desk immediately. Do not inform your branch until verification is complete.

Verification desk: +91 90045 11882`,
  },
  {
    id: "recruiter",
    chip: "Recruiter",
    hint: "real outreach",
    text: `Hi Rohan, I'm Meera, a technical recruiter at Northwind Analytics. I came across your profile and there's a remote data role that might suit you — flexible hours, no experience needed.

The full description is on our careers page, and I'm happy to answer questions before you decide anything. If it sounds interesting, reply here or write to meera@northwindanalytics.com and we'll set up a short call.

No rush — the role stays open for another couple of weeks.`,
  },
];

export const SAFE_EXAMPLE = `Hi Priya, your Flipkart order OD-2291483 has shipped and should reach you by Thursday. You can follow the delivery in the Flipkart app whenever you like.

If anything looks wrong, reply to this message or write to us at support@flipkart.com and we'll sort it out.

Thanks for shopping with us.`;
