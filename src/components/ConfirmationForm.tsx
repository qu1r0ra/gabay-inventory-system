import { useState } from "react";
import { Heading } from "./Heading";
import NumberStepper from "./NumberStepper";
import Button from "./Button";

function ConfirmationForm() {
  return (
    <div className="w-[900px] h-[650px] bg-white border border-black/70 rounded-lg overflow-hidden flex flex-col">
      {/* Header with heading and buttons */}
      <div className="bg-primary px-6 py-4 shrink-0 flex items-center justify-between">
        <Heading level={3} size="sm" className="text-white">
          Confirmation
        </Heading>
        <div className="flex gap-2">
          <Button size="xs">
            Remove
          </Button>
          <Button size="xs">
            Confirm
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {[...Array(9)].map((_, i) => {
          const day = String((i % 28) + 1).padStart(2, "0");
          const lotId = `Location-202507${day}-Batch${(i % 5) + 1}`;
          return (
            <div
              key={i}
              className="w-full h-24 bg-white border-t border-border flex items-center px-4 justify-between"
            >
              {/* Left side: checkbox + item info */}
              <div className="flex items-start gap-4">
                <input type="checkbox" className="w-5 h-5 mt-1 accent-primary" />
                <div className="flex flex-col">
                  <Heading level={3} size="md" className="font-Work-Sans mb-1">
                    Item {i + 1}
                  </Heading>
                  <div className="text-sm text-black font-Work-Sans flex gap-6">
                    <span className="w-[130px]">Exp: 2025-08-{day}</span>
                    <span className="w-[260px]">ID: {lotId}</span>
                    <span className="w-[80px]">Qty: 30</span>
                  </div>
                </div>
              </div>

              {/* Right side: stepper */}
              <div className="ml-6">
                <NumberStepper initial={1} min={1} max={99} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConfirmationForm;
