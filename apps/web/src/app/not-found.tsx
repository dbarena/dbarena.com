import type { Metadata } from "next";

import { StatusScreen } from "@/components/status-screen";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StatusScreen
      body="That URL is not a published page. Home is the front of DBARENA."
      title="Page not found"
    />
  );
}
