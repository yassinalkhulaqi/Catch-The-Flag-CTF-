import { PayloadCheatsheet } from "@/components/tools/payload-cheatsheet";

export const metadata = {
  title: "Payload Cheatsheet | Security Tools",
  description:
    "Searchable study reference of classic SQLi, XSS, SSRF, and path-traversal payload patterns (inert text).",
};

export default function CheatsheetsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="type-eyebrow text-accent">Security tools</p>
      <h1 className="type-title mt-2">Payload cheatsheet</h1>
      <p className="mt-2 text-muted">
        Learn to recognise classic attack patterns. Reference only — payloads are inert text and never
        executed.
      </p>
      <div className="mt-6">
        <PayloadCheatsheet />
      </div>
    </div>
  );
}
