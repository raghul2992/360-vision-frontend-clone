import { format, isSameDay } from "date-fns";

export const formatKpiDateLabel = (dateRange, t) => {
  if (!dateRange || !dateRange[0] || !dateRange[1]) {
    return t("dashboard.kpi.last_7_days");
  }

  const [start, end] = dateRange;
  const today = new Date();

  if (isSameDay(start, end) && isSameDay(start, today)) {
    return t("common.today");
  }

  if (isSameDay(start, end)) {
    return format(start, "dd/MM/yy");
  }

  return `${format(start, "dd/MM/yy")} – ${format(end, "dd/MM/yy")}`;
};