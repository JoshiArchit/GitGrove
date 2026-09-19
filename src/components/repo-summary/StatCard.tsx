import React from "react";

type StatCardProps = {
  title: String;
  value: String | number;
  icon: React.ReactNode;
};
const StatCard = ({ icon, title, value }: StatCardProps) => {
  return (
    <div className="shadow-card-elevation-2 relative flex flex-col items-start justify-center gap-2 rounded-xl bg-gray-900 px-8 py-6">
      <div className="shadow-card-elevation-2 absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-700">
        {icon}
      </div>
      <span className="self-center text-2xl font-semibold">{value}</span>
      <span className="self-center text-sm opacity-50">{title}</span>
    </div>
  );
};

export default StatCard;
