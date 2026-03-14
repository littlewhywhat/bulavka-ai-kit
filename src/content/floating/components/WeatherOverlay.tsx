/** @jsxImportSource preact */

import type { WeatherData } from "../../../types/messages";

const WeatherOverlay = ({
  data,
  onClose,
}: {
  data: WeatherData;
  onClose: () => void;
}) => (
  <div className="w-72 bg-white rounded-xl shadow-2xl overflow-hidden font-sans">
    <div
      className="flex justify-between items-center px-4 py-3 bg-blue-500 text-white cursor-grab select-none"
      data-drag-handle
    >
      <span className="text-sm font-semibold">Weather</span>
      <button
        type="button"
        onClick={onClose}
        className="text-white hover:text-blue-200 text-lg leading-none bg-transparent border-none cursor-pointer"
      >
        &times;
      </button>
    </div>
    <div className="p-4">
      <div className="text-2xl font-bold text-gray-800">{data.temp}&deg;F</div>
      <div className="text-sm text-gray-500">{data.condition}</div>
      <div className="text-xs text-gray-400 mt-1">{data.city}</div>
    </div>
  </div>
);

export { WeatherOverlay };
