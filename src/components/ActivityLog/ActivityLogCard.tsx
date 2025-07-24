import React from "react";
import { Heading } from "../General/Heading";

interface ActivityLogCardProps {
  entry: {
    actor: string;
    item: string;
    lotId: string;
    date: string;
    time: string;
    type: string;
  };
}

function ActivityLogCard({ entry }: ActivityLogCardProps) {
  const actionColor =
    {
      "+": "text-green-600",
      "-": "text-red-600",
      "=": "text-yellow-600",
      X: "text-gray-600",
    }[entry.type[0]] || "text-black";

  return (
    <div className="w-full bg-white border border-[rgba(0,0,0,0.7)] shadow rounded-2xl p-4 flex flex-col gap-2 font-Work-Sans text-black">
      <div className="flex justify-between items-center">
        <Heading size="md" className="font-semibold">
          {entry.item || "—"}
        </Heading>
        <span
          className="text-xs font-medium  font-Work-Sans max-w-[80px] truncate"
          title={entry.lotId}
        >
          {entry.lotId?.slice(0, 5) || "—"}…
        </span>
      </div>

      <p className="text-sm font-Work-Sans">
        <span className="font-medium">User:</span> {entry.actor || "—"}
      </p>

      <p className="text-sm font-Work-Sans">
        <span className="font-medium">Date:</span> {entry.date || "—"}
      </p>

      <p className="text-sm font-Work-Sans">
        <span className="font-medium">Time:</span> {entry.time || "—"}
      </p>

      <p className={`text-sm font-medium font-Work-Sans ${actionColor}`}>
        Action:{" "}
        {{
          "+": `Added (+${entry.type.slice(1)})`,
          "-": `Removed (-${entry.type.slice(1)})`,
          "=": `Corrected (=${entry.type.slice(1)})`,
          X: "Deleted (X)",
        }[entry.type[0]] || entry.type}
      </p>
    </div>
  );
}

export default ActivityLogCard;
