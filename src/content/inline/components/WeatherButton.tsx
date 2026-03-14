/** @jsxImportSource preact */

const WeatherButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 16px",
      border: "1px solid #dadce0",
      borderRadius: "20px",
      background: "#fff",
      color: "#1a73e8",
      fontSize: "13px",
      fontFamily: "'Google Sans', Roboto, sans-serif",
      cursor: "pointer",
      lineHeight: "1",
      height: "36px",
    }}
  >
    Weather
  </button>
);

export { WeatherButton };
