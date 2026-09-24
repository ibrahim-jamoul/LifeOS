import type { Metadata } from "next";
import { ResourceWorkspace } from "@/components/resource-workspace";

export const metadata: Metadata = { title: "Routines · Apprentissage" };

export default function LearningRoutinesPage() {
  return (
    <ResourceWorkspace
      resourceKeys={["religion_routines", "religion_logs"]}
      heading="Apprentissage · Religion"
      intro="Configurez uniquement les habitudes qui soutiennent votre apprentissage religieux. Une routine n’apparaît le jour J que si son calendrier la rend réellement due."
    />
  );
}
