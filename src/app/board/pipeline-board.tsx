"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STAGE_OPTIONS, priorityColor, priorityLabel, stageDotColor } from "@/lib/constants";
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

const RISK_RING: Record<string, string> = {
  overdue: "ring-1 ring-red-300 dark:ring-red-900",
  at_risk: "ring-1 ring-amber-300 dark:ring-amber-900",
  none: "",
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
      if (result?.error) {
        setError(result.error);
        router.refresh();
      }
    });
  }

  return (
    <>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}

      <div className="scroll-thin -mx-4 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-6 sm:mx-0 sm:px-0 sm:pb-4">
        {STAGE_OPTIONS.map((stage) => {
          const stageProjects = optimisticProjects.filter((project) => project.stage === stage.value);
          const isOver = overStage === stage.value;

          return (
            <section
              key={stage.value}
              className={`flex w-[min(80vw,17rem)] shrink-0 snap-start flex-col rounded-2xl p-2 transition-colors sm:w-60 ${
                isOver ? "bg-accent-50 ring-2 ring-accent-500/40 dark:bg-accent-100/10" : "bg-zinc-200/50 dark:bg-zinc-900/70"
              }`}
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
              <h2 className="flex items-center gap-2 px-2 pb-2 pt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <span className={`h-2 w-2 rounded-full ${stageDotColor(stage.value)}`} aria-hidden />
                {stage.label}
                <span className="ml-auto text-xs font-medium text-zinc-400">{stageProjects.length}</span>
              </h2>

              <div className="min-h-20 flex-1 space-y-2">
                {stageProjects.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-zinc-400 dark:border-zinc-700">
                    {isAdmin ? "Drop here" : "Empty"}
                  </p>
                ) : (
                  stageProjects.map((project) => {
                    const risk = deadlineRisk(project.deadline, project.stage);
                    const showPriority = project.priority === "high" || project.priority === "urgent";
                    return (
                      <article
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
                        className={`rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 ${RISK_RING[risk]} ${
                          isAdmin ? "cursor-grab active:cursor-grabbing" : ""
                        } ${draggingId === project.id ? "rotate-1 opacity-50" : ""}`}
                      >
                        <Link
                          href={`/projects/${project.id}`}
                          className="block"
                          onClick={(event) => {
                            if (skipClickRef.current) event.preventDefault();
                          }}
                        >
                          <p className="text-sm font-medium leading-snug text-zinc-900 hover:text-accent-600 dark:text-zinc-50 dark:hover:text-accent-500">
                            {project.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {project.client?.company_name || "Internal product"}
                          </p>
                        </Link>

                        <div className="mt-3 flex items-center gap-2 text-xs">
                          {showPriority && <Badge tone={priorityColor(project.priority)}>{priorityLabel(project.priority)}</Badge>}
                          <span className="min-w-0 truncate">
                            <DeadlineBadge deadline={project.deadline} stage={project.stage} />
                          </span>
                          {project.assignee && (
                            <span className="ml-auto" title={project.assignee.full_name || project.assignee.email}>
                              <Avatar name={project.assignee.full_name || project.assignee.email} size="sm" />
                            </span>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="mt-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                            <StageSelect currentStage={project.stage} onMove={(next) => moveToStage(project.id, next)} />
                          </div>
                        )}
                      </article>
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
