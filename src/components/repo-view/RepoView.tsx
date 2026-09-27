import { motion } from "motion/react";
import Board from "../board/Board";
import ContributionGraph from "../ContributionGraph";
import RepoSummary from "../repo-summary/RepoSummary";

const RepoView = () => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex flex-col gap-3 pr-3"
    >
      <RepoSummary />
      <ContributionGraph />
      <Board />
    </motion.div>
  );
};

export default RepoView;
