import { redirect } from "next/navigation";

// Team Tasks is now the "Everyone" view of My Work.
export default function TeamTasksRedirect() {
  redirect("/tasks?person=all");
}
