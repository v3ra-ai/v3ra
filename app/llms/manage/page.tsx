import ManageLLMsClient from "@/components/llm-management/manage-llms-client";
import { fetchValidators } from "@/lib/validators/fetch-validators";

export default async function ManageLLMsPage() {
  let validators = await fetchValidators();
  
  // Ensure active is false to prevent unwanted enabled tags
  validators = validators.map((v) => ({ ...v, active: false }));

  return <ManageLLMsClient initial={validators} />;
}
