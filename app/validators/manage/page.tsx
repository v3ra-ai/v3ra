import ValidatorList from "@/components/validator-management/validator-list";
import { getValidators } from "@/lib/db/validators";

export const dynamic = "force-dynamic"; // ensure fresh data

export default async function ManageValidatorsPage() {
  const validators = await getValidators();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start pt-8 gap-8">
      <h1 className="text-3xl font-semibold">Manage Validators</h1>
      <ValidatorList initial={validators} />
    </div>
  );
}
