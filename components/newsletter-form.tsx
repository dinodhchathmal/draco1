"use client";

import { FormEvent, useState } from "react";

export function NewsletterForm() {
  const [status, setStatus] = useState(""); const [unsubscribeUrl,setUnsubscribeUrl]=useState("");const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setStatus("");
    const formElement=e.currentTarget;const form = new FormData(formElement);
    try { const res = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), consent: form.get("consent") === "on", website: form.get("website") }) }); const data = await res.json(); setStatus(res.ok ? "You're on the list." : data.error ?? "Subscription could not be saved."); if (res.ok){setUnsubscribeUrl(data.unsubscribeUrl??"");formElement.reset();} }
    catch { setStatus("Connection issue. Please try again."); } finally { setBusy(false); }
  }
  return <form className="newsletter-form" onSubmit={submit}><div className="newsletter-row"><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" name="email" type="email" placeholder="Your email address" required maxLength={254}/><button disabled={busy}>{busy ? "Joining…" : "Join the list ↗"}</button></div><label className="consent"><input type="checkbox" name="consent" required/> I agree to receive occasional updates from DRACO. Unsubscribe anytime.</label><input className="honeypot" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/><p role="status">{status} {unsubscribeUrl&&<a className="newsletter-unsubscribe" href={unsubscribeUrl}>Manage your subscription / unsubscribe ↗</a>}</p></form>;
}
