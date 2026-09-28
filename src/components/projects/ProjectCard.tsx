import { Project } from "../../types/project.types";

type ProjectCardProps = {
  project: Project;
  index: number;
};

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  return (
    <div className="shadow-card-elevation-2 flex h-40 w-3xs flex-col gap-2 rounded-lg border border-l-4 border-gray-800 border-l-purple-400 bg-black px-6 py-4 text-white transition-all duration-300 hover:scale-110 hover:rotate-5 hover:cursor-pointer hover:bg-indigo-950">
      <span className="w-full text-xs tracking-tight text-purple-300 uppercase">
        Project {index}
      </span>
      <span className="line-clamp-1 w-full">{project.title}</span>
      <span className="line-clamp-4 w-full text-white/70">
        {project.description}
      </span>
    </div>
  );
};
export default ProjectCard;
