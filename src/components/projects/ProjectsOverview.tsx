import { DragDropProvider } from "@dnd-kit/react";
import { Info } from "lucide-react";
import { motion } from "motion/react";
import React, { type ComponentProps, useRef, useState } from "react";
import { useProjectsStore } from "../../stores/projectsStore";
import { ProjectStatus } from "../../types/project.types";
import ProjectColumn from "./ProjectColumn";
import ProjectForm from "./ProjectForm";

const ProjectsOverview = () => {
  const projects = useProjectsStore((s) => s.projects);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProjectFormDirty, setIsProjectFormDirty] = useState(false);
  const updateProjectStatus = useProjectsStore((s) => s.updateProjectStatus);

  const closeDialog = () => {
    dialogRef.current?.close();
    setIsFormOpen(false);
  };

  const handleDragEnd: ComponentProps<typeof DragDropProvider>["onDragEnd"] = (
    event,
  ) => {
    if (event.canceled) return;
    const { source, target } = event.operation;
    if (!source || !target) return; // dropped outside any droppable

    const itemId = Number(source.id);
    const destination = target.id; // the column's id, per ProjectColumn's useDroppable({ id: status })
    if (!Object.values(ProjectStatus).includes(destination as ProjectStatus))
      return;

    const item = projects.find((i) => i.projectId === itemId);
    if (!item || item.status === destination) return; // same-column drop is a no-op

    updateProjectStatus(itemId, destination as ProjectStatus);
  };

  function openProjectFormDialog() {
    setIsProjectFormDirty(false);
    setIsFormOpen(true);
    dialogRef.current?.showModal();
  }

  function handleAttemptCloseProjectForm(e?: React.SyntheticEvent) {
    if (isProjectFormDirty) {
      e?.preventDefault();
      const confirmed = window.confirm("Discard unsaved changes?");
      if (!confirmed) return;
    }
    closeDialog();
  }

  const STATUS_SECTIONS: { status: ProjectStatus; label: string }[] = [
    { status: ProjectStatus.Idea, label: "New Ideas" },
    { status: ProjectStatus.Brainstorming, label: "Brainstorming" },
    { status: ProjectStatus.InDevelopment, label: "In Development" },
    { status: ProjectStatus.InTest, label: "In Test" },
    { status: ProjectStatus.Deployed, label: "Deployed" },
  ];

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex flex-col gap-3 pr-3"
    >
      <section className="flex grow flex-col items-center justify-start gap-8 rounded-xl bg-gray-900 p-4">
        <div className="flex w-full justify-center tracking-tight text-white uppercase">
          Projects
        </div>

        <div className="shadow-card-elevation-2 flex w-full items-center justify-between gap-2 rounded-2xl bg-gray-600 px-4 py-2 text-gray-300">
          <div className="flex w-3/4 gap-2">
            <Info className="flex self-start" />
            <span>
              Ideas don't need a git init yet. Track a project from first sketch
              through brainstorming, development, and deployment — tag a repo
              whenever one actually exists.
            </span>
          </div>

          <div className="1/4 flex items-center justify-end">
            <button
              type="button"
              className="btn-primary shadow-card-elevation-2 text-white"
              onClick={openProjectFormDialog}
            >
              Add a Project
            </button>
          </div>
        </div>

        <section className="flex flex-wrap items-center justify-center gap-4">
          {/* TODO: Add a helper tooltip to show what each status means */}
          <DragDropProvider onDragEnd={handleDragEnd}>
            {STATUS_SECTIONS.map(({ status, label }) => (
              <ProjectColumn
                key={status}
                status={status}
                label={label}
                projects={projects.filter((p) => p.status === status)}
              />
            ))}
          </DragDropProvider>
        </section>
      </section>

      <dialog
        ref={dialogRef}
        onCancel={handleAttemptCloseProjectForm}
        className="m-auto rounded-lg bg-gray-900 p-6 text-white backdrop:bg-black/80"
      >
        {isFormOpen && (
          <ProjectForm
            isDirty={isProjectFormDirty}
            onDirtyChange={setIsProjectFormDirty}
            onRequestClose={handleAttemptCloseProjectForm}
            onSaved={closeDialog}
          />
        )}
      </dialog>
    </motion.div>
  );
};

export default ProjectsOverview;
