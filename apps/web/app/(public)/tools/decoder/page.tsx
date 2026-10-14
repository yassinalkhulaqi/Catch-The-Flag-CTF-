import { DecoderTool } from "@/components/tools/decoder-tool";

export const metadata = {
  title: "Encoder / Decoder | Security Tools",
  description: "Encode and decode URL, Base64, hex, and HTML offline, plus unverified JWT inspection.",
};

export default function DecoderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="type-eyebrow text-accent">Security tools</p>
      <h1 className="type-title mt-2">Encoder / decoder</h1>
      <p className="mt-2 text-muted">
        Convert values between common web encodings. Runs entirely in your browser.
      </p>
      <div className="mt-6">
        <DecoderTool />
      </div>
    </div>
  );
}
