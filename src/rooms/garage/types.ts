import type { VehicleIssueRow, VehicleRow } from "../../../types";

export type Vehicle = VehicleRow;
export type VehicleIssue = VehicleIssueRow;

export type VehicleWithIssues = Vehicle & {
  vehicle_issues: VehicleIssue[];
};

export const DEMO_VEHICLE: VehicleWithIssues = {
  id: "demo",
  nickname: "Example",
  year: 2019,
  make: "Toyota",
  model: "Camry",
  color: "Silver",
  vin: null,
  license_plate: null,
  current_mileage: 84200,
  mpg_avg: 28.5,
  last_oil_change_date: "2025-11-01",
  last_oil_change_mileage: 81000,
  tires_installed_date: "2023-06-15",
  registration_expires: "2026-08-01",
  insurance_expires: "2026-04-01",
  photo_path: null,
  notes: null,
  created_at: "",
  updated_at: "",
  vehicle_issues: [
    {
      id: "demo-issue",
      vehicle_id: "demo",
      description: "Example: rear wiper streaking",
      severity: "low",
      status: "open",
      created_at: "",
      updated_at: "",
    },
  ],
};
