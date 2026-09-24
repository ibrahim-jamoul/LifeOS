import type { Metadata } from "next";
import { ResourceWorkspace } from "@/components/resource-workspace";

export const metadata: Metadata = { title: "Leçons · Apprentissage" };

export default function LearningLessonsPage() {
  return (
    <ResourceWorkspace
      resourceKeys={["religion_topics", "religion_sessions"]}
      heading="Apprentissage · Religion"
      intro="Construisez vos sujets d’étude puis enregistrez ce que vous avez réellement vu. Ici, pas d’objectifs annuels ni de tâches LifeOS : uniquement votre parcours d’apprentissage."
    />
  );
}
