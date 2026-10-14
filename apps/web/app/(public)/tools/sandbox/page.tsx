import { RequestSandbox } from "@/components/tools/request-sandbox";

export const metadata = {
  title: "Request Sandbox | Security Tools",
  description:
    "Simulated HTTP request builder for study purposes. Canned local responses — no real requests leave the browser.",
};

export default function SandboxPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="type-eyebrow text-accent">Security tools</p>
      <h1 className="type-title mt-2">Request sandbox</h1>
      <p className="mt-2 text-muted">
        Practise shaping HTTP requests against a canned simulation. Nothing here contacts a server.
      </p>
      <div className="mt-6">
        <RequestSandbox />
      </div>
    </div>
  );
}
