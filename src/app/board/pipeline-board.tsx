"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STAGE_OPTIONS, priorityColor, priorityLabel } from "@/lib/constants";
import { DeadlineBadge } from "@/components/deadline-badge";
import { deadlineRisk } from "@/lib/project-risk";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StageSelect } from "./stage-select";
import { moveProjectStage } from "./actions";
import type { Enums } from "@/lib/supabase/database.types";

export type BoardProject = {
  id: string;
  name: string;
  stage: Enums<"project_stage">;
  priority: Enums<"priority_level">;
  deadline: string | null;
  client: { id: string; company_name: string } | null;
  assignee: { full_name: string; email: string } | null;
  team: { id: string; name: string } | null;
};

const RISK_BORDER: Record<string, string> = {
  overdue: "border-l-4 border-l-red-500",
  at_risk: "border-l-4 border-l-amber-500",
  none: "border-l-4 border-l-transparent",
};

export function PipelineBoard({ projects, isAdmin }: { projects: BoardProject[]; isAdmin: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const skipClickRef = useRef(false);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimisticProjects, setOptimistic] = useOptimistic(
    projects,
    (current, update: { id: string; stage: Enums<"project_stage"> }) =>
      current.map((project) => (project.id === update.id ? { ...project, stage: update.stage } : project))
  );

  function moveToStage(projectId: string, newStage: Enums<"project_stage">) {
    const project = optimisticProjects.find((item) => item.id === projectId);
    if (!project || project.stage === newStage) return;

    startTransition(async () => {
      setOptimistic({ id: projectId, stage: newStage });
      setError(null);
      const result = await moveProjectStage(projectId, newStage);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <>
      {isAdmin && (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Drag a card to a column, or pick a stage from the dropdown.
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}

      <div className="scroll-thin -mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-6 sm:mx-0 sm:gap-4 sm:px-0 sm:pb-4">
        {STAGE_OPTIONS.map((stage) => {
          const stageProjects = optimisticProjects.filter((project) => project.stage === stage.value);
          const isOver = overStage === stage.value;

          return (
            <section
              key={stage.value}
              className={`w-[min(80vw,18rem)] shrink-0 snap-start rounded-xl sm:w-72 ${isOver ? "bg-accent-50/60 dark:bg-accent-100/5" : ""}`}
              onDragOver={(event) => {
                if (!isAdmin) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setOverStage(stage.value);
              }}
              onDragLeave={() => {
                if (overStage === stage.value) setOverStage(null);
              }}
              onDrop={(event) => {
                if (!isAdmin) return;
                event.preventDefault();
                setOverStage(null);
                const projectId = event.dataTransfer.getData("text/plain");
                if (projectId) moveToStage(projectId, stage.value);
                setDraggingId(null);
              }}
            >
              <h2 className="mb-2 flex items-center justify-between text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {stage.label}
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {stageProjects.length}
                </span>
              </h2>

              <div className={`min-h-24 space-y-2 rounded-xl p-0.5 ${isOver ? "ring-2 ring-accent-500/40" : ""}`}>
                {stageProjects.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-zinc-200 p-3 text-xs text-zinc-400 dark:border-zinc-800">
                    {isAdmin ? "Drop a project here" : "No projects"}
                  </p>
                ) : (
                  stageProjects.map((project) => {
                    const risk = deadlineRisk(project.deadline, project.stage);
                    return (
                      <div
                        key={project.id}
                        draggable={isAdmin}
                        onDragStart={(event) => {
                          if (!isAdmin) return;
                          event.dataTransfer.setData("text/plain", project.id);
                          event.dataTransfer.effectAllowed = "move";
                          skipClickRef.current = true;
                          setDraggingId(project.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverStage(null);
                          requestAnimationFrame(() => {
                            skipClickRef.current = false;
                          });
                        }}
                        className={`rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 ${RISK_BORDER[risk]} ${
                          isAdmin ? "cursor-grab active:cursor-grabbing" : ""
                        } ${draggingId === project.id ? "opacity-50" : ""}`}
                      >
                        <Link
                          href={`/projects/${project.id}`}
                          className="block"
                          onClick={(event) => {
                            if (skipClickRef.current) event.preventDefault();
                          }}
                        >
                          <p className="text-sm font-medium text-zinc-900 hover:text-accent-600 dark:text-zinc-50 dark:hover:text-accent-500">
                            {project.name}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {project.client?.company_name || "Internal product"}
                          </p>
                        </Link>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                          <Badge tone={priorityColor(project.priority)}>{priorityLabel(project.priority)}</Badge>
                          <DeadlineBadge deadline={project.deadline} stage={project.stage} />
                        </div>

                        {(project.assignee || project.team) && (
                          <div className="mt-2 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {project.assignee && (
                              <div className="flex items-center gap-1.5">
                                <Avatar name={project.assignee.full_name || project.assignee.email} size="sm" />
                                {project.assignee.full_name || project.assignee.email}
                              </div>
                            )}
                            {project.team && <p>Team: {project.team.name}</p>}
                          </div>
                        )}

                        {isAdmin && (
                          <div className="mt-2">
                            <StageSelect projectId={project.id} currentStage={project.stage} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
