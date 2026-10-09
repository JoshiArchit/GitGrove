import { useDraggable } from "@dnd-kit/react";
import { useRef, useState } from "react";
import { Project } from "../../types/project.types";
import ProjectCardExpanded from "./ProjectCardExpanded";

type ProjectCardProps = {
  project: Project;
};

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { ref, isDragging } = useDraggable({ id: project.projectId });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  function closeDialog() {
    dialogRef.current?.close();
  }

  function openDialog() {
    // Bumping the key remounts ProjectCardExpanded, resetting its uncontrolled
    // fields back to `project`'s real values — discards whatever was typed and
    // left unsaved from a prior open (e.g. a cancelled edit).
    setIsDirty(false);
    setInstanceKey((k) => k + 1);
    dialogRef.current?.showModal();
  }

  function handleAttemptClose(e?: React.SyntheticEvent) {
    if (isDirty) {
      e?.preventDefault(); // stops the dialog from actually closing (Escape/backdrop path)
      const confirmed = window.confirm("Discard unsaved changes?");
      if (!confirmed) return;
    }
    closeDialog();
  }

  return (
    <>
      <div
        onClick={openDialog}
        data-testid="project-card"
        ref={ref}
        className={`shadow-card-elevation-2 flex h-40 w-3xs flex-col gap-2 rounded-lg border border-l-4 border-gray-800 border-l-purple-400 bg-black px-6 py-4 text-white transition-all duration-150 hover:scale-110 hover:rotate-5 hover:cursor-pointer hover:bg-indigo-950 ${isDragging ? "opacity-80" : ""}`}
      >
        {/* TODO: Show a stable human-facing display id here once one exists
            (e.g. a per-scope monotonic displayId, or the future SQL
            auto-increment projectId)*/}
        <span className="line-clamp-1 w-full">{project.title}</span>
        <span className="line-clamp-4 w-full text-white/70">
          {project.description}
        </span>
      </div>

      <dialog
        ref={dialogRef}
        onCancel={handleAttemptClose}
        className="m-auto rounded-xl backdrop:bg-black/80"
      >
        <ProjectCardExpanded
          key={instanceKey}
          project={project}
          isDirty={isDirty}
          onDirtyChange={setIsDirty}
          onRequestClose={handleAttemptClose}
          onSaved={closeDialog}
        />
      </dialog>
    </>
  );
};

export default ProjectCard;
