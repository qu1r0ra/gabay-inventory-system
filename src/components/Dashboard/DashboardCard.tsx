// Update the import path below if the actual path or filename is different (e.g., './general/Heading', './General/heading', or '../General/Heading')
import { Heading } from "../General/Heading";
import { Link } from "react-router-dom";

type DashboardCardProps = {
  to: string;
  title: string;
  value: string | number;
  label: string;
};

function DashboardCard({ to, title, value, label }: DashboardCardProps) {
  return (
    <Link to={to} className="block w-full max-w-[440px]">
      <div
        className="w-full h-[180px] sm:h-[200px] bg-white border border-black/70 rounded-lg overflow-hidden 
        flex flex-col shadow-lg py-3 px-4 cursor-pointer transition duration-200 ease-in-out gap-3
        hover:bg-primary hover:border-transparent hover:text-white hover:scale-[1.05]
        active:bg-accent group"
      >
        <Heading
          size="md"
          className="transition-colors group-hover:text-white group-active:text-white"
        >
          {title}
        </Heading>

        <div className="flex items-center justify-center mt-5 flex-col gap-3">
          <Heading
            level={2}
            size="2xl"
            className="text-2xl sm:text-3xl transition-colors group-hover:text-white group-active:text-white"
          >
            {value}
          </Heading>
          <p className="text-xs sm:text-sm text-black font-Work-Sans group-hover:text-white group-active:text-white transition-colors">
            {label}
          </p>
        </div>
      </div>
    </Link>
  );
}
export default DashboardCard;
