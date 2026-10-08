import { LearningQuizV5 } from "@/components/learning-v5-plus";
export const metadata = { title: "Quiz · Apprentissage" };
export default async function LearningQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LearningQuizV5 id={id} />;
}
