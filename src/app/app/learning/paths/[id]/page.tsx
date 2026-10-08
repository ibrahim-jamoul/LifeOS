import { LearningV5 } from "@/components/learning-v5";
export const metadata = { title: "Parcours · Apprentissage" };
export default async function PathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LearningV5 mode="path" pathId={id} />;
}
