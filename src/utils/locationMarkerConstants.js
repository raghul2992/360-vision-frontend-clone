export const PREDEFINED_COLORS = [
  '#00FF00', // Green
  '#FFFF00', // Yellow
  '#0000FF', // Blue
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500' // Orange
]

export const MARKER_ICON_PATHS = {
  default:
    'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  store:
    'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-3-9V7h-2v2h-2v2h2v2h2v-2h2v-2h-2z',
  gas_station:
    'M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm-1-10h2V6h-2v6zM10 9c0-1.66 1.34-3 3-3s3 1.34 3 3H10zm0 6h4v-2h-4v2z',
  office:
    'M18 2h-8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H10V4h8v16zM12 6h4v2h-4V6zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2z',
  factory:
    'M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14h12v-2h8v-8h-2zM4 6h16v4H4V6zm14 10h-8v-2h8v2z'
}

export const MARKER_ICON_TYPES = Object.keys(MARKER_ICON_PATHS)
