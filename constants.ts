
export const PRODUCTION_LINES_F1 = ["Z01", "Z02", "Z03", "Z04", "Z05", "Z06", "Z07", "Warranty"];
export const PRODUCTION_LINES_F2 = [
  "Z08", "Z09", "Z10", "Z11", "Z12", "Z13", "Z14", "Z15", "Z16", "Z17", 
  "Warranty", "Repair Appearance Area", "Repair Function Room"
];

export const ALL_PRODUCTION_LINES = [
  ...PRODUCTION_LINES_F1.filter(l => l !== "Warranty"), 
  ...PRODUCTION_LINES_F2.filter(l => l !== "Warranty" && l !== "Repair Appearance Area" && l !== "Repair Function Room"), 
  "Warranty",
  "Repair Appearance Area", 
  "Repair Function Room"
];

export const DIV_PIC_PRODUCTION = ["Mass Production Team", "Equipment Team", "Warranty Team", "Repair Appearance Team"];
export const DIV_PIC_ENGINEERING = ["Engineer", "Technician", "Repair Function Team"];

export const SUB_OPTIONS_TECHNICIAN = ["TMT", "EMT"];
export const SUB_OPTIONS_ENGINEER = ["PME", "PEE", "TME", "IE", "TE"];

// Map teams to specific colors matching the Dashboard chart colors
export const TEAM_COLORS: Record<string, string> = {
  // Production
  "Mass Production Team": "#3b82f6", // Blue
  "Mass Production": "#3b82f6", // Fallback for old data
  "Equipment Team": "#10b981",  // Emerald
  "Warranty Team": "#f59e0b",   // Amber
  "Repair Appearance Team": "#ef4444", // Red
  
  // Engineering
  "Engineer": "#8b5cf6",        // Violet
  "Technician": "#ec4899",      // Pink
  "Repair Function Team": "#06b6d4" // Cyan
};
