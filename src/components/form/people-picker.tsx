import { Avatar } from "@/components/ui/avatar";

export type Person = { id: string; full_name: string; email: string };

export function personName(person: { full_name: string; email: string }) {
  return person.full_name || person.email;
}

// Checkbox grid for choosing team members. Used both on the Team page and
// when creating a team inline from the project form, so the two stay in sync.
export function PeoplePicker({
  people,
  name,
  defaultSelected = [],
}: {
  people: Person[];
  name: string;
  defaultSelected?: string[];
}) {
  if (people.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No people have signed up yet.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {people.map((person) => (
        <label
          key={person.id}
          className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 has-[:checked]:border-accent-500 has-[:checked]:bg-accent-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:has-[:checked]:bg-accent-100/10"
        >
          <input
            type="checkbox"
            name={name}
            value={person.id}
            defaultChecked={defaultSelected.includes(person.id)}
            className="h-4 w-4 rounded border-zinc-300 accent-accent-600"
          />
          <Avatar name={personName(person)} size="sm" />
          <span className="min-w-0 truncate">{personName(person)}</span>
        </label>
      ))}
    </div>
  );
}
