// src/components/MonthFilter/MonthFilter.jsx
import { useDispatch, useSelector } from "react-redux";
import { setSelectedMonthYear } from "../../Fetures/Inventory/attendanceSlice";

const monthsList = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function MonthFilter() {
  const dispatch = useDispatch();
  const selectedMonthYear = useSelector(
    (state) => state.attendance.selectedMonthYear
  );

  // Default month and year parse
  const [currentMonth, currentYear] = selectedMonthYear ? selectedMonthYear.split(" ") : ["January", "2026"];

  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    dispatch(setSelectedMonthYear(`${newMonth} ${currentYear}`));
  };

  const handleYearChange = (e) => {
    const newYear = e.target.value;
    dispatch(setSelectedMonthYear(`${currentMonth} ${newYear}`));
  };

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px" }}>
      <label style={{ fontWeight: "bold" }}>Filter Month:</label>
      <select value={currentMonth} onChange={handleMonthChange} style={{ padding: "6px 12px", borderRadius: "4px" }}>
        {monthsList.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select value={currentYear} onChange={handleYearChange} style={{ padding: "6px 12px", borderRadius: "4px" }}>
        {[2024, 2025, 2026, 2027].map((yr) => (
          <option key={yr} value={yr}>
            {yr}
          </option>
        ))}
      </select>
    </div>
  );
}

export default MonthFilter;