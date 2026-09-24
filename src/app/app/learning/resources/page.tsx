import type { Metadata } from "next";
import { ResourceWorkspace } from "@/components/resource-workspace";

export const metadata: Metadata = { title: "Ressources · Apprentissage" };

export default function LearningResourcesPage() {
  return (
    <ResourceWorkspace
      resourceKeys={["religion_resources"]}
      heading="Bibliothèque d’apprentissage"
      intro="Conservez ici uniquement les ressources utilisées pour apprendre : livres, cours, articles, sites, documents et références. Elles restent reliées aux sujets d’étude existants."
    />
  );
}
