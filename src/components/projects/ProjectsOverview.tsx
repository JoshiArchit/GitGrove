import { motion } from "motion/react";

const ProjectsOverview = () => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex flex-col gap-3 pr-3"
    >
      <section className="rounded-xl bg-gray-900 p-4">
        <div className="flex w-full justify-center tracking-tight text-white uppercase">
          Projects
        </div>

        <div>Add project</div>

        <section className="flex flex-wrap gap-4"></section>
      </section>
    </motion.div>
  );
};

export default ProjectsOverview;
