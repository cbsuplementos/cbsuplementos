import { PageHeader } from "@/components/admin/FormFields";
import HeroSlideForm from "@/components/admin/HeroSlideForm";

export default function NewHeroSlidePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Novo Slide" description="Adicione um novo banner ao carrossel do site." />
      <HeroSlideForm />
    </div>
  );
}
