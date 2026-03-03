
export enum Department {
  Production = 'Production Department',
  Engineering = 'Engineering Department',
}

export enum Factory {
  F1 = 'F1',
  F2 = 'F2',
}

export enum IssueCategory {
  LoosePart = 'Loose Part',
  MissingPart = 'Missing Part',
  BrokenDamaged = 'Broken/Damaged Part',
  Maintenance = 'Maintenance Issue',
  Label = 'Label Issue',
  Cleanliness = 'Cleanliness Issue',
  WrongPart = 'Wrong Part',
  ExcessPart = 'Excess Part',
  EquipmentBad = 'Equipment part bad',
}

export enum StationStatus {
  Online = 'Online',
  Offline = 'Offline',
}

export enum Status {
  Closed = 'Closed',
  Open = 'Open',
}

export enum InspectionType {
  Routine = 'Routine Inspection',
  ChangeOver = 'Change Over',
}

export enum UserRole {
  God = 'God', // 190925
  Admin = 'Admin', // 583922
  UserL1 = 'User Level 1', // 004093
  Viewer = 'Viewer', // 111111
}

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  displayRole: string; // e.g., "Auditor", "Inspector"
  department?: string; // New field
}

export interface ActivityLog {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  timestamp: string;
  ip: string;
}

export interface Feedback {
  id: string;
  userName: string;
  userPin: string;
  message: string;
  timestamp: string;
}

export interface FormData {
  id: string;
  findingDate: string;
  department: string;
  factory: string;
  productionLine: string;
  violator: string;
  jobId: string;
  model: string;
  stationStatus: string;
  stationName: string; // Only if online
  fixtureCode: string;
  issueDescription: string;
  issueCategory: string;
  labelType?: 'Calibration Label' | 'Non-calibration Label';
  rootCause: string;
  correctiveAction?: string; // New Field
  divPic: string;
  divPicSubOption?: string; // For Engineer/Technician sub-options
  inspectionType: string;
  status: string;
  // Files can be File objects (during upload) or base64 strings (from DB)
  findingImage?: string | File | null;
  findingImprovedImage?: string | File | null;
  findingImprovementForm?: string | File | null;
  // Derived/Optional fields for analytics
  week?: number;
  month?: string;
}

export interface LogChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface LogEntry {
  id: string; // Log ID
  findingId: string;
  timestamp: string;
  action: 'New Submit' | 'Update' | 'Delete' | 'Create';
  changes: LogChange[];
  user: string;
}

export interface ValidationErrors {
  [key: string]: string;
}
