import { Heading } from "../General/Heading";
import { Link } from "react-router-dom";

interface ReportCardProps {
  itemsAdded: number;
  itemsTaken: number;
}

// ReportCard.jsx
function ReportCard({ itemsAdded, itemsTaken }: ReportCardProps) {
  return (
    <Link to="/generate-report" className="block w-full max-w-[800px]">
      <div
        className="w-full h-[240px] sm:h-[260px] bg-white border border-black/70 rounded-lg overflow-hidden 
        flex flex-col shadow-lg py-4 px-6 sm:py-6 sm:px-8 cursor-pointer transition duration-200 ease-in-out gap-6
        hover:bg-primary hover:border-transparent hover:text-white hover:scale-[1.05]
        active:bg-accent group"
      >
        {/* Title */}
        <Heading
          size="md"
          className="text-center font-Poppins group-hover:text-white group-active:text-white"
        >
          Monthly Report
        </Heading>

        {/* Two Columns */}
        <div className="flex flex-1 items-center justify-center gap-8 sm:gap-24">
          {/* Left Stat */}
          <div className="flex flex-col items-center">
            <Heading
              level={2}
              size="2xl"
              className="text-2xl sm:text-3xl group-hover:text-white group-active:text-white"
            >
              {itemsAdded}
            </Heading>
            <p className="text-xs sm:text-sm text-black font-Work-Sans group-hover:text-white group-active:text-white">
              Items Added
            </p>
          </div>

          {/* Divider */}
          <div className="w-px h-[80px] bg-black/30 group-hover:bg-white/40" />

          {/* Right Stat */}
          <div className="flex flex-col items-center">
            <Heading
              level={2}
              size="2xl"
              className="text-2xl sm:text-3xl group-hover:text-white group-active:text-white"
            >
              {itemsTaken}
            </Heading>
            <p className="text-xs sm:text-sm text-black font-Work-Sans group-hover:text-white group-active:text-white">
              Items Taken
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ReportCard;
