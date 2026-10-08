import type { Metadata } from "next";
import { ResourceWorkspace } from "@/components/resource-workspace";

export const metadata: Metadata = { title: "Ressources · Apprentissage" };

export default function LearningResourcesPage() {
  return (
    <ResourceWorkspace
      resourceKeys={["resources"]}
      heading="Bibliothèque d’apprentissage"
      intro="Votre bibliothèque transversale : livres, cours, articles et références. Préférez les ressources réellement exploitées et reliez-les aux projets existants."
    />
  );
}
