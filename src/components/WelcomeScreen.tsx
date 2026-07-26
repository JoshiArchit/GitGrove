import { Sprout } from "lucide-react";
import { RepoEntry } from "../types/repo.types";

type WelcomeScreenProps = {
  reposScanned: boolean;
  activeRepo: RepoEntry | undefined;
};

const WelcomeScreen = ({ reposScanned, activeRepo }: WelcomeScreenProps) => {
  return (
    <section
      id="welcome-screen"
      className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-xl bg-gray-900 p-6 text-white"
    >
      <div className="flex items-center gap-2">
        <Sprout className="h-9 w-9" />
        <span className="text-4xl">Welcome to GitGrove!</span>
      </div>
      <div className="relative h-6 w-full text-center text-white/50 transition-all duration-300">
        <span
          className={`absolute inset-x-0 transition-opacity duration-300 ${
            !reposScanned ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          Scan for repositories to get started.
        </span>
        <span
          className={`absolute inset-x-0 transition-opacity duration-300 ${
            reposScanned && !activeRepo
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          Select a repository from the scanned list
        </span>
      </div>
    </section>
  );
};

export default WelcomeScreen;
