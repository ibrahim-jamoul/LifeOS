import { ResourceWorkspace } from "@/components/resource-workspace";
export const metadata = { title: "Arabe · Apprentissage" };
export default function LanguagesPage() { return <ResourceWorkspace resourceKeys={["arabic_profile", "arabic_sessions"]} heading="Apprendre l’arabe" intro="Votre profil et vos séances d’arabe existants, sans duplication de données. Pour un parcours guidé, créez un parcours Arabe et utilisez son modèle en cinq étapes." />; }
