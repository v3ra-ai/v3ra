import ManageLLMsClient from "@/components/llm-management/manage-llms-client";
import { getValidators } from "@/lib/db/validators";

export default async function ManageLLMsPage() {
  // Fetch validators on server
  const validators = await getValidators();

  return <ManageLLMsClient initial={validators} />;
}
