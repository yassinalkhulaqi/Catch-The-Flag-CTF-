import type { Metadata } from "next";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Settings
      </h1>
      <p className="mt-1 text-muted">Email and display preferences.</p>
      <Card className="mt-6">
        <CardTitle>Coming with the profile API</CardTitle>
        <CardDescription className="mt-2">
          Email, theme and notification preferences will be editable here once
          the backend settings endpoints land.
        </CardDescription>
      </Card>
    </div>
  );
}
