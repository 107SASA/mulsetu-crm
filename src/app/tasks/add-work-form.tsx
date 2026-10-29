"use client";

import { useState } from "react";
import { SelectField, TextField } from "@/components/form/fields";
import { personName, type Person } from "@/components/form/people-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import { CARD } from "@/lib/card-styles";
import { TaskFields } from "./task-fields";

type Mode = "task" | "meeting";

const MEETING_TYPES = [
  { value: "meeting", label: "Meeting" },
  { value: "call", label: "Call" },
  { value: "other", label: "Other" },
];

// One place to add work: switch between a task (something to get done) and a
// meeting/call (something at a set time). Both forms share the same fields
// and layout as everywhere else in the app.
export function AddWorkForm({
  createTaskAction,
  createMeetingAction,
  people,
  projects,
  isAdmin,
  currentUserId,
  defaultPerson,
  date,
  returnTo,
}: {
  createTaskAction: (formData: FormData) => void;
  createMeetingAction: (formData: FormData) => void;
  people: Person[];
  projects: { id: string; name: string }[];
  isAdmin: boolean;
  currentUserId: string;
  defaultPerson: string;
  date: string;
  returnTo: string;
}) {
  const [mode, setMode] = useState<Mode>("task");

  return (
    <section className={`${CARD} p-5`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Add to your work</h2>
        <div role="tablist" className="inline-flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
          {(["task", "meeting"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={`min-h-9 flex-1 rounded-md px-4 text-sm transition-colors sm:flex-none ${
                mode === value
                  ? "bg-white font-medium text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {value === "task" ? "Task" : "Meeting / call"}
            </button>
          ))}
        </div>
      </div>

      {mode === "task" ? (
        <form key="task" action={createTaskAction} className="space-y-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <TaskFields
            people={people}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
            defaultAssignee={defaultPerson}
            projects={projects}
            idPrefix="work-task"
          />
          <div className="flex justify-end">
            <SubmitButton pendingLabel="Adding…" className="w-full sm:w-auto">
              Add task
            </SubmitButton>
          </div>
        </form>
      ) : (
        <form key="meeting" action={createMeetingAction} className="space-y-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <TextField id="meeting-title" label="Title" name="title" placeholder="e.g. Kick-off call with client" required />
            </div>
            <SelectField id="meeting-type" label="Type" name="item_type" defaultValue="meeting" options={MEETING_TYPES} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-2">
              <TextField id="meeting-date" label="Date" name="item_date" type="date" defaultValue={date} required />
            </div>
            <TextField id="meeting-start" label="Start" name="start_time" type="time" required />
            <TextField id="meeting-end" label="End" name="end_time" type="time" optional />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              id="meeting-project"
              label="Project"
              name="project_id"
              placeholder="No project"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              optional
            />
            {isAdmin ? (
              <SelectField
                id="meeting-person"
                label="For"
                name="developer_id"
                defaultValue={defaultPerson}
                options={people.map((p) => ({
                  value: p.id,
                  label: p.id === currentUserId ? `${personName(p)} (me)` : personName(p),
                }))}
              />
            ) : (
              <input type="hidden" name="developer_id" value={currentUserId} />
            )}
          </div>
          <TextField id="meeting-notes" label="Notes" name="notes" placeholder="Agenda, meeting link, …" optional />
          <div className="flex justify-end">
            <SubmitButton pendingLabel="Adding…" className="w-full sm:w-auto">
              Add to schedule
            </SubmitButton>
          </div>
        </form>
      )}
    </section>
  );
}
