import type { Metadata } from "next";
import { AlertCenter } from "@/components/alert-center";

export const metadata: Metadata = { title: "Alertes" };

export default function AlertsPage() {
  return <AlertCenter />;
}
