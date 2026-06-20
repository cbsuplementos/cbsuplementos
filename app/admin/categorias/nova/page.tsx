import { PageHeader } from "@/components/admin/FormFields";
import CategoryForm from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Nova Categoria"
        description="Crie uma nova categoria para organizar os produtos."
      />
      <CategoryForm />
    </div>
  );
}
