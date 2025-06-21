import { redirect } from "next/navigation";

export default async function ValidatorsPage() {
  redirect("/llms/manage");
}