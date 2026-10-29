import { redirect } from "next/navigation";

// "Today" is now part of My Work (/tasks). Keep old links working.
export default async function TodayRedirect({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; developer?: string }>;
}) {
  const { date, developer } = await searchParams;
  const params = new URLSearchParams();
  if (developer) params.set("person", developer);
  if (date) params.set("date", date);
  const query = params.toString();
  redirect(query ? `/tasks?${query}` : "/tasks");
}
