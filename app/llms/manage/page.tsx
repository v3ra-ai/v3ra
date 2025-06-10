import { fetchValidators } from "@/lib/validators/fetch-validators";
import ManageLLMsClient from "@/components/llm-management/manage-llms-client";
import { Validator } from "@/lib/types";

export const dynamic = 'force-dynamic'; // Force dynamic rendering

export default async function ManageLLMsPage() {
  const validators: Validator[] = await fetchValidators();
  console.log("[ManageLLMsPage] Fetched validators:", validators.length);

  return <ManageLLMsClient initial={validators} onClose={() => {}} />;
}