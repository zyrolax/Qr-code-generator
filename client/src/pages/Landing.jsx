import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Card } from "../components/ui.jsx";

// Mobile-first landing page. Leads with the student lost-and-found pitch;
// other use cases sit lower down.
export default function Landing() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  // The claim-code box just sends you to the claim flow (login happens there).
  function goClaim(e) {
    e.preventDefault();
    navigate("/claim", { state: { prefill: code.trim() } });
  }

  return (
    <main className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="py-14 text-center sm:py-20">
        <p className="mb-3 inline-block rounded-full bg-brand-light px-3 py-1 text-sm font-semibold text-brand">
          For college students
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Lose it. <span className="text-brand">Get it back.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
          Stick a Requesto QR on your bottle, laptop or ID card. If someone finds
          it, they scan and message you — your number stays private.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button as="link" to="/signup">
            Get started
          </Button>
          <Button as="link" to="/login" variant="outline">
            I have stickers
          </Button>
        </div>
      </section>

      {/* 3 steps */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { n: "1", t: "Stick it", d: "Put a QR sticker on the stuff you don't want to lose." },
          { n: "2", t: "Claim it", d: "Scan the card, enter your claim code, and it's yours." },
          { n: "3", t: "Get it back", d: "A finder scans and messages you. We email you right away." },
        ].map((s) => (
          <Card key={s.n}>
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white font-bold">
              {s.n}
            </div>
            <h3 className="font-semibold">{s.t}</h3>
            <p className="mt-1 text-sm text-gray-600">{s.d}</p>
          </Card>
        ))}
      </section>

      <p className="mt-6 text-center text-sm text-gray-500">
        🔒 Your phone number and email are <strong>never</strong> shown to the finder.
      </p>

      {/* Claim-code box */}
      <section className="mt-12">
        <Card className="mx-auto max-w-md">
          <h2 className="text-lg font-semibold">Got a claim code?</h2>
          <p className="mt-1 text-sm text-gray-600">
            Enter it to activate your sticker (looks like <code>RQ-7K2M-94XD</code>).
          </p>
          <form onSubmit={goClaim} className="mt-3 flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="RQ-XXXX-XXXX"
              className="uppercase"
            />
            <Button type="submit">Claim</Button>
          </form>
        </Card>
      </section>

      {/* Pricing */}
      <section className="mt-12 text-center">
        <h2 className="text-2xl font-bold">Simple pricing</h2>
        <Card className="mx-auto mt-4 max-w-sm">
          <p className="text-4xl font-extrabold text-brand">₹99</p>
          <p className="mt-1 text-gray-600">5 stickers</p>
          <p className="mt-2 text-xs text-gray-400">Placeholder pricing</p>
          <Button as="link" to="/signup" className="mt-4 w-full">
            Get your pack
          </Button>
        </Card>
      </section>

      {/* Other use cases (lower on the page) */}
      <section className="mt-14 mb-16">
        <h2 className="text-center text-xl font-bold">Not just lost &amp; found</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { t: "Links page", d: "Point your sticker at your portfolio or socials." },
            { t: "Clubs & events", d: "One QR for your club's latest info and sign-ups." },
            { t: "PG / hostel info", d: "Rules, Wi-Fi, contacts — editable any time." },
          ].map((u) => (
            <Card key={u.t}>
              <h3 className="font-semibold">{u.t}</h3>
              <p className="mt-1 text-sm text-gray-600">{u.d}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
