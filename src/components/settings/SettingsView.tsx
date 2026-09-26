import { X } from "lucide-react";
import { useState } from "react";

type SettingsViewProps = {
  onClose: () => void;
};

const SECTIONS = [
  "Export",
  "Import",
  "Danger Zone",
  "Default Scan Root",
] as const;
type Section = (typeof SECTIONS)[number];

const SettingsView = ({ onClose }: SettingsViewProps) => {
  const [activeSection, setActiveSection] = useState<Section>(SECTIONS[0]);

  return (
    <div className="shadow-card-elevation-2 flex min-h-[50vh] min-w-[60vw] flex-col gap-4 rounded-2xl border-2 border-gray-700 bg-gray-900 px-6 py-4 text-white">
      <div className="flex items-center justify-between border-b border-gray-700 pb-2">
        <span className="text-sm text-gray-400">Settings</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-gray-300 transition-all duration-300 hover:scale-125 hover:cursor-pointer hover:text-white"
        >
          <X className="size-6 rounded-lg" />
        </button>
      </div>

      <div className="flex flex-1 divide-x divide-gray-700">
        <nav className="flex w-48 shrink-0 flex-col gap-1 pr-4">
          {SECTIONS.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`rounded-lg px-4 py-2 text-left text-sm transition-all duration-300 hover:cursor-pointer hover:bg-gray-700 ${
                activeSection === section
                  ? "bg-gray-700 text-white"
                  : "text-gray-400"
              }`}
            >
              {section}
            </button>
          ))}
        </nav>

        <section className="flex-1 pl-4">
          <span className="text-sm text-gray-400">
            {activeSection} — coming soon
          </span>
        </section>
      </div>
    </div>
  );
};

export default SettingsView;
