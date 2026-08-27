import { redirect } from "next/navigation";

export default async function TeamTasksRedirect({
  searchParams,
}: {
  searchParams: Promise<{ developer?: string; status?: string }>;
}) {
  const { developer, status } = await searchParams;
  const params = new URLSearchParams({ view: "team" });
  if (developer) params.set("developer", developer);
  if (status) params.set("status", status);
  redirect(`/tasks?${params.toString()}`);
}
