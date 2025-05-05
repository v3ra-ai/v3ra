import { getValidators } from "@/lib/db/validators";
import ValidatorsClient from "./validators-client";

export default async function ValidatorsPage() {
  const validators = await getValidators();

  return <ValidatorsClient validators={validators} />;
}