import React from "react";
import { TooltipRenderProps } from "react-joyride";
import { ShopitoMascot } from "./ShopitoMascot"; // Importação relativa na mesma pasta

export const CustomTooltip = ({
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
}: TooltipRenderProps) => {
  const mood = (step.data as any)?.mood || "welcome";
  const customImages = (step.data as any)?.images as string[] | undefined;

  return (
    <div
      {...tooltipProps}
      className="flex flex-col sm:flex-row items-center sm:items-start gap-0 sm:gap-4 max-w-[90vw] sm:max-w-md bg-transparent p-2 filter drop-shadow-xl mx-auto z-[9999]"
    >
      {/* MASCOTE */}
      <div className="z-20 relative -mb-8 sm:-mb-0 sm:-mr-6 transform transition-transform duration-300 w-full flex justify-center sm:block sm:w-auto">
        <ShopitoMascot mood={mood} customImages={customImages} />
      </div>

      {/* BALÃO DE FALA */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-[3px] border-black relative z-10 w-full text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] pt-10 sm:pt-6">
        {step.title && (
          <h3
            className="font-black text-lg sm:text-xl text-[#EE4D2D] mb-2 uppercase tracking-wide leading-tight"
            style={{ fontFamily: "sans-serif" }}
          >
            {step.title}
          </h3>
        )}

        <div className="text-slate-800 font-bold text-xs sm:text-sm leading-relaxed mb-5 font-sans">
          {step.content}
        </div>

        <div className="flex justify-between items-center pt-2 border-t-2 border-slate-100 mt-2">
          {!isLastStep && (
            <button
              {...skipProps}
              className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-black underline decoration-2 cursor-pointer"
            >
              Pular
            </button>
          )}

          <div className="flex gap-2 sm:gap-3 ml-auto">
            {index > 0 && (
              <button
                {...backProps}
                className="px-3 py-2 text-[10px] sm:text-xs font-bold border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                Voltar
              </button>
            )}
            <button
              {...primaryProps}
              className="px-4 py-2 text-[10px] sm:text-xs font-bold text-white bg-[#EE4D2D] border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all hover:bg-[#d94024]"
            >
              {isLastStep ? "Concluir! 🚀" : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
