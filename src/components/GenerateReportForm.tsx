import React, { useState } from "react";
import Select, { SingleValue } from "react-select";
import { Heading } from "./General/Heading";
import Input from "./General/Input";
import Button from "./General/Button";
import { inventoryApi } from "../lib/db/db.api";
import Toast from "./General/Toast";

interface Option {
  value: string;
  label: string;
}

const monthOptions: Option[] = [
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

const yearOptions: Option[] = Array.from(
  { length: new Date().getFullYear() - 2022 },
  (_, i) => {
    const year = 2023 + i;
    return { value: year.toString(), label: year.toString() };
  }
);

function GenerateReportForm() {
  const [selectedMonth, setSelectedMonth] = useState<Option | null>(null);
  const [selectedYear, setSelectedYear] = useState<Option | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const handleGenerateReport = async () => {
    if (!selectedMonth || !selectedYear) {
      setToastType("error");
      setToastMsg("Please fill in all fields.");
      setShowToast(true);
      return;
    }

    const monthNum = parseInt(selectedMonth.value, 10);
    const yearNum = parseInt(selectedYear.value, 10);

    try {
      const pdfUrl = await inventoryApi.generateReport(monthNum, yearNum);
      setToastType("success");
      setToastMsg("Report generated successfully.");
      setShowToast(true);
      // Optionally: window.open(pdfUrl);
    } catch (error) {
      console.error("Report generation failed:", error);
      setToastType("error");
      setToastMsg("Failed to generate report.");
      setShowToast(true);
    }
  };

  return (
    <div className="relative w-full max-w-[500px] min-h-[300px] border bg-white border-black/70 rounded-2xl p-4 sm:p-6 shadow-md">
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
            <Select<Option>
              options={monthOptions}
              placeholder="Select month"
              value={selectedMonth}
              onChange={(option: SingleValue<Option>) =>
                setSelectedMonth(option)
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold font-Work-Sans text-black mb-1">
              Year
            </label>
            <Select<Option>
              options={yearOptions}
              placeholder="Select year"
              value={selectedYear}
              onChange={(option: SingleValue<Option>) =>
                setSelectedYear(option)
              }
            />
          </div>
          <div className="flex justify-center mt-6">
            <Button size="xs" onClick={handleGenerateReport}>
              Generate
            </Button>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <Toast
            message={toastMsg}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        </div>
      )}
    </div>
  );
}

export default GenerateReportForm;
