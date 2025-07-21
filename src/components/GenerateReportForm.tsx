import React from "react";
import Select from "react-select";
import { Heading } from "./General/Heading";
import Input from "./General/Input";
import Button from "./General/Button";

const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const yearOptions = Array.from(
  { length: new Date().getFullYear() - 2022 },
  (_, i) => {
    const year = 2023 + i;
    return { value: year.toString(), label: year.toString() };
  }
);

function GenerateReportForm() {
  return (
    <div className="w-full max-w-[500px] min-h-[500px] border bg-white border-black/70 rounded-2xl p-4 sm:p-6 shadow-md">
      <Heading size="lg" className="mb-1">
        Generate Report
      </Heading>

      <p className="text-border text-sm font-Work-Sans mb-4 sm:mb-6">
        Generate reports as downloadable PDFs.
      </p>

      <div className="flex flex-col items-center">
        <div className="w-full max-w-[400px] space-y-6 sm:space-y-12">
          <div>
            <label className="block text-xs font-bold font-Work-Sans text-black mb-1">
              Month
            </label>
            <Select options={monthOptions} placeholder="Select month" />
          </div>

          <div>
            <label className="block text-xs font-bold font-Work-Sans text-black mb-1">
              Year
            </label>
            <Select options={yearOptions} placeholder="Select year" />
          </div>

          <div>
            <Input
              label="File Name"
              placeholder="e.g. July_Report"
              size="full"
              id="file-name"
            />
          </div>

          <div className="flex justify-center mt-30 sm:mt-6">
            <Button size="xs">Generate</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerateReportForm;
