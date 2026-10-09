import { useDroppable } from "@dnd-kit/react";
import { Project, ProjectStatus } from "../../types/project.types";
import ProjectCard from "./ProjectCard";

type ProjectColumnProps = {
  status: ProjectStatus;
  label: string;
  projects: Project[];
};

const ProjectColumn = ({ status, label, projects }: ProjectColumnProps) => {
  const { ref, isDropTarget } = useDroppable({ id: status });

  return (
    <div
      ref={ref}
      data-testid="project-column"
      className={`flex flex-col items-stretch gap-2 rounded-lg transition-all duration-300 not-last:border-r-2 not-last:border-white/10 not-last:pr-4 ${isDropTarget ? "ring-2 ring-blue-500" : ""}`}
    >
      <span className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
        {label}
      </span>
      {projects.length === 0 ? (
        <span className="text-sm font-semibold tracking-tight text-gray-600 uppercase">
          No projects for this category
        </span>
      ) : (
        <div className="flex flex-wrap gap-2">
          {projects.map((item) => (
            <ProjectCard key={item.projectId} project={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectColumn;
