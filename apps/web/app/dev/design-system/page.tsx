import { notFound } from "next/navigation";
import { DesignGallery } from "@/components/dev/design-gallery";

export const metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DESIGN_SYSTEM !== "true") {
    notFound();
  }
  return <DesignGallery />;
}
