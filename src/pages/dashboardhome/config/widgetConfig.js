import AlertTimelineWidget from '../components/AlertTimelineWidget'
import AlertTypeBreakdownWidget from '../components/AlertTypeBreakdownWidget'
import TopProblematicRoisWidget from '../components/TopProblematicRoisWidget'
import DetectionChart from '../components/DetectionChart'

export const WIDGETS = [
  {
    widget_name: 'alert_timeline',
    component: AlertTimelineWidget,
    titleKey: 'dashboard.alert_timeline',
    descriptionKey: 'dashboard.alert_timeline_desc',
    dataKey: 'alertTimeline',
    totalKey: 'totalAlerts'
  },
  {
    widget_name: 'alert_type_breakdown',
    component: AlertTypeBreakdownWidget,
    titleKey: 'dashboard.alert_type_breakdown',
    descriptionKey: 'dashboard.alert_type_breakdown_desc',
    dataKey: 'alertTypeBreakdown',
    totalKey: 'totalAlertTypeBreakdown'
  },
  {
    widget_name: 'priority',
    component: DetectionChart,
    titleKey: 'dashboard.priority_analytics',
    descriptionKey: 'dashboard.priority_desc',
    dataKey: 'priorityData',
    totalKey: 'totalAlerts',
    chartProps: { showPercentages: true }
  },
  {
    widget_name: 'top_problematic_rois',
    component: TopProblematicRoisWidget,
    titleKey: 'dashboard.top_problematic_rois',
    descriptionKey: 'dashboard.top_problematic_rois_desc',
    dataKey: 'topProblematicRois'
  }
]
