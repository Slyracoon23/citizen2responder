// Shared TypeScript interfaces for better type safety

export interface ReportLocation {
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface ReportDetails {
  caller_name?: string;
  phone_number?: string;
  incident_type: string;
  description: string;
  location: ReportLocation;
  injuries_reported: boolean;
  number_of_people_involved: number;
  is_active_threat: boolean;
  timestamp: string;
  evidence_images?: string[];
}

export interface ReportData {
  report_id: string;
  summary: string;
  details: ReportDetails;
}

export interface PreCareData {
  title: string;
  instructions: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface ImageCaptureResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
}