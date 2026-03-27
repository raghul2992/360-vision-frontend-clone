import React from "react";
import { FiCircle } from "react-icons/fi";

export const KPI_WIDGETS_CONFIG = [
  {
    id: "total_alerts",
    titleKey: "dashboard.kpi.total_alerts",
    descriptionKey: "dashboard.kpi.total_alerts_desc",
    // Function to extract data
    getValue: (data) => data?.alertsCount ?? 0,
    getSubText: (data, t) => t("dashboard.kpi.last_7_days"),
    subClass: "text-gray-500",
    badge: "dashboard.kpi.badge",
    infoKey: "dashboard.kpi.total_alerts_info_desc",
  },
  {
    id: "most_frequent",
    titleKey: "dashboard.kpi.most_frequent",
    descriptionKey: "dashboard.kpi.most_frequent_desc",
    getValue: (data) => data?.mostFrequent?.detection_type || "N/A",
    getSubText: (data, t) => t("dashboard.kpi.last_7_days"),
    subClass: "text-gray-400",
    badge: "dashboard.kpi.badge",
    infoKey: "dashboard.kpi.most_frequent_info_desc",
  },
  {
    id: "busiest_hour",
    titleKey: "dashboard.kpi.busiest_hour",
    descriptionKey: "dashboard.kpi.busiest_hour_desc",
    getValue: (data) => {
    const busiest = data?.busiestHour;
    if (!busiest || !busiest.time_start_utc || busiest.alert_count === 0) {
      return "00:00";
    }
    return busiest.time_start_utc.slice(11, 16);
  },
    getSubText: (data, t) => t("dashboard.kpi.last_7_days"),
    subClass: "text-gray-400",
    badge: "dashboard.kpi.badge",
    infoKey: "dashboard.kpi.busiest_hour_info_desc",
  },
  // {
  //   id: "dwell_time",
  //   titleKey: "dashboard.kpi.avg_dwell",
  //   descriptionKey: "dashboard.kpi.avg_dwell_desc",
  //   getValue: (data) => data?.avgDwell?.average_dwell_time || "00m 00s",
  //   getSubText: (data, t) => t("dashboard.kpi.last_7_days"),
  //   subClass: "text-gray-400",
  //   badge: "dashboard.kpi.badge",
  //   infoKey: "dashboard.kpi.avg_dwell_info_desc",
  // },
  {
    id: "camera_status",
    titleKey: "dashboard.kpi.camera_status",
    descriptionKey: "dashboard.kpi.camera_status_desc",
    getValue: (data) =>
      `${data?.activeCameras ?? 0}/${data?.totalCameras ?? 0}`,
    getSubText: (data, t) => t("dashboard.kpi.live"),
    subIcon: (
      <FiCircle
        size={10}
        className="fill-green-500 text-green-500 animate-pulse"
      />
    ),
    subClass: "text-green-500",
    badge: "dashboard.kpi.badge",
     infoKey: "dashboard.kpi.camera_status_info_desc",
    hideDateRangeFilter: true,
     hideCameraFilter: true,
  },
  {
  id: "avg_customer_queue_time",
  titleKey: "dashboard.kpi.avg_customer_queue_time",
  descriptionKey: "dashboard.kpi.avg_customer_queue_time_desc",
  getValue: (data) => {
    const v = Number(data?.avgCustomerQueueTime);
    return `${Number.isFinite(v) ? v.toFixed(2) : 0} s`;
  },
  getSubText: (data, t) => t("dashboard.kpi.last_7_days"),
  subClass: "text-gray-400",
  badge: "dashboard.kpi.badge",
  infoKey: "dashboard.kpi.avg_customer_queue_time_info_desc",
  trackingfeatureKey: "dashboard.kpi.tracking_feature_customer",
},
{
  id: "customer_peak_time",
  titleKey: "dashboard.kpi.customer_peak_time",
  descriptionKey: "dashboard.kpi.customer_peak_time_desc",
  getValue: (data) =>
    data?.customerPeakTime ? `${data.customerPeakTime.peak_hour}:00` : "00:00",
  getSubText: (data, t) => t("dashboard.kpi.last_7_days"),
  subClass: "text-gray-400",
  badge: "dashboard.kpi.badge",
  infoKey: "dashboard.kpi.customer_peak_time_info_desc",
  trackingfeatureKey: "dashboard.kpi.tracking_feature_customer",
},
{
  id: "visitor_traffic",
  titleKey: "dashboard.kpi.visitor_traffic",
  descriptionKey: "dashboard.kpi.visitor_traffic_desc",
  getValue: (data) => {
    const v = Number(data?.visitorTraffic);
    return Number.isFinite(v) ? v.toFixed(0) : "0";
  },
  getSubText: (data, t) => t("dashboard.kpi.last_7_days"),
  subClass: "text-gray-400",
  badge: "dashboard.kpi.badge",
  infoKey: "dashboard.kpi.visitor_traffic_info_desc",
  trackingfeatureKey: "dashboard.kpi.tracking_feature_customer",
},
];
