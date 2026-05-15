export type StructureStatus =
  | "draft"
  | "submitted"
  | "tested"
  | "validated"
  | "approved"
  | "rejected"
  | "under_testing"
  | "under_validation"
  | string;

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken?: string;
  user?: {
    id?: string;
    username?: string;
    email?: string;
    role?: string;
  };
}

export interface OwnerInfo {
  user_id?: string;
  username?: string;
  email?: string;
}

export interface LocationInfo {
  city?: string;
  state?: string;
  district?: string;
  location_code?: string;
}

export interface AdminStructureCard {
  structure_id: string;
  uid?: string;
  structure_number?: string;
  structural_identity_number?: string;
  structure_name?: string;
  client_name?: string;
  status?: StructureStatus;
  type?: string;
  type_of_structure?: string;
  location?: LocationInfo;
  owner?: OwnerInfo;
  created_date?: string;
  last_updated?: string;
  last_updated_date?: string;
  ratings_summary?: RatingsSummary;
}

export interface RatingsSummary {
  total_flats?: number;
  rated_flats?: number;
  completion_percentage?: number;
  avg_structural_rating?: number | null;
  avg_non_structural_rating?: number | null;
  overall_health?: string | null;
}

export interface WorkflowActor {
  name?: string;
  role?: string;
  date?: string;
}

export interface WorkflowInfo {
  submitted_by?: WorkflowActor;
  tested_by?: WorkflowActor;
  validated_by?: WorkflowActor;
  approved_by?: WorkflowActor;
  rejected_by?: WorkflowActor;
}

export interface TestingAssignmentUser {
  _id?: string;
  user_id?: string;
  username?: string;
  email?: string;
  role?: string;
  designation?: string;
}

export interface TestingFormatOption {
  format_id: string;
  test_name: string;
  display_name: string;
  is_custom?: boolean;
}

export interface StructureWorkflowResponse {
  status?: string;
  workflow?: WorkflowInfo;
  testing_assignment?: {
    assigned_at?: string | null;
    assigned_by?: {
      user_id?: string;
      name?: string;
      email?: string;
      role?: string;
    } | null;
    testers?: TestingAssignmentUser[];
    testing_formats?: Array<{
      format_id?: string;
      test_name?: string;
      display_name?: string;
    }>;
  };
}

export interface StructureFloor {
  _id?: string;
  floor_id?: string;
  floor_number?: number;
  floor_label_name?: string;
  flats?: Array<{
    flat_id?: string;
    flat_number?: string;
    flat_overall_rating?: {
      combined_score?: number;
      health_status?: string;
      priority?: string;
    };
    structural_rating?: {
      overall_average?: number;
      health_status?: string;
    };
    non_structural_rating?: {
      overall_average?: number;
      health_status?: string;
    };
  }>;
  blocks?: Array<unknown>;
  floor_overall_rating?: {
    overall_average?: number;
    health_status?: string;
    priority?: string;
  };
  structural_rating?: {
    overall_average?: number;
    health_status?: string;
  };
  non_structural_rating?: {
    overall_average?: number;
    health_status?: string;
  };
}

export interface AdminStructureDetail {
  _id?: string;
  structure_id?: string;
  uid?: string;
  status?: StructureStatus;
  owner?: OwnerInfo;
  ratings_summary?: RatingsSummary;
  workflow?: WorkflowInfo;
  administration?: {
    client_name?: string;
    organization?: string;
    custodian?: string;
    engineer_designation?: string;
    contact_details?: string;
    email_id?: string;
  };
  structural_identity?: {
    structural_identity_number?: string;
    uid?: string;
    type_of_structure?: string;
    structure_subtype?: string;
    structure_name?: string;
    city_name?: string;
    state_code?: string;
    district_code?: string;
    location_code?: string;
  };
  location?: {
    state_code?: string;
    district_code?: string;
    city_name?: string;
    location_code?: string;
    address?: string;
  };
  creation_info?: {
    created_date?: string;
    last_updated_date?: string;
  };
  geometric_details?: {
    floors?: StructureFloor[];
  };
  floors?: Array<{
    floor_id?: string;
    mongodb_id?: string;
    floor_number?: number;
    floor_height?: number;
    total_area_sq_mts?: number;
    floor_label_name?: string;
    floor_notes?: string;
    has_floor_structural_ratings?: boolean;
    has_floor_non_structural_ratings?: boolean;
    floor_structural_rating?: Record<string, unknown> & {
      overall_average?: number | null;
      assessment_date?: string | null;
      inspector_notes?: string | null;
      health_status?: string | null;
      averages?: Record<string, number | null>;
    };
    floor_non_structural_rating?: Record<string, unknown> & {
      overall_average?: number | null;
      assessment_date?: string | null;
      inspector_notes?: string | null;
      averages?: Record<string, number | null>;
    };
    floor_overall_rating?: {
      combined_score?: number | null;
      overall_average?: number | null;
      health_status?: string | null;
      priority?: string | null;
      last_assessment_date?: string | null;
    } | null;
    floor_statistics?: {
      structural_components?: number;
      non_structural_components?: number;
      structural_average?: number | null;
      non_structural_average?: number | null;
    };
    flats?: Array<{
      flat_id?: string;
      mongodb_id?: string;
      flat_number?: string;
      flat_type?: string;
      area_sq_mts?: number;
      direction_facing?: string;
      occupancy_status?: string;
      flat_notes?: string;
      has_structural_ratings?: boolean;
      has_non_structural_ratings?: boolean;
      structural_rating?: Record<string, unknown>;
      non_structural_rating?: Record<string, unknown>;
      flat_overall_rating?: {
        combined_score?: number | null;
        health_status?: string | null;
        priority?: string | null;
      } | null;
    }>;
  }>;
}

export interface AdminLocationResponse {
  structure_id?: string;
  uid?: string;
  structural_identity?: AdminStructureDetail["structural_identity"];
  location?: {
    longitude?: number | null;
    latitude?: number | null;
    address?: string;
    state_code?: string;
    district_code?: string;
    city_name?: string;
    location_code?: string;
  };
}

export interface AdminAdministrativeResponse {
  structure_id?: string;
  uid?: string;
  administrative?: {
    client_name?: string;
    organization?: string;
    custodian?: string;
    engineer_designation?: string;
    contact_details?: string;
    email_id?: string;
  };
}

export interface AdminFloorListItem {
  floor_id?: string;
  mongodb_id?: string;
  floor_number?: number;
  is_parking_floor?: boolean;
  parking_floor_type?: string | null;
  floor_height?: number;
  total_area_sq_mts?: number;
  floor_label_name?: string;
  number_of_flats?: number;
  floor_notes?: string;
}

export interface AdminFloorsResponse {
  structure_id?: string;
  total_floors?: number;
  floors?: AdminFloorListItem[];
}

export interface AdminFlatListItem {
  floor_id?: string;
  floor_number?: number;
  floor_label_name?: string;
  flat_id?: string;
  mongodb_id?: string;
  flat_number?: string;
  flat_type?: string;
  area_sq_mts?: number;
  direction_facing?: string;
  occupancy_status?: string;
  flat_notes?: string;
  structural_rating?: {
    overall_average?: number;
    health_status?: string;
  };
  non_structural_rating?: {
    overall_average?: number;
    health_status?: string;
  };
  flat_overall_rating?: {
    combined_score?: number;
    health_status?: string;
    priority?: string;
  } | null;
}

export interface AdminFlatsResponse {
  structure_id?: string;
  uid?: string;
  structural_identity_number?: string;
  total_flats?: number;
  flats?: AdminFlatListItem[];
}

export interface AdminFloorRatingsItem {
  floor_id?: string;
  mongodb_id?: string;
  floor_number?: number;
  floor_label_name?: string;
  total_flats?: number;
  rated_flats?: number;
  structural_rating?: {
    overall_average?: number | null;
    health_status?: string;
  };
  non_structural_rating?: {
    overall_average?: number | null;
  };
  floor_overall_rating?: {
    combined_score?: number | null;
    overall_average?: number | null;
    health_status?: string;
    priority?: string;
  } | null;
}

export interface AdminRatingsResponse {
  structure_id?: string;
  uid?: string;
  structural_identity_number?: string;
  ratings_summary?: RatingsSummary;
  total_floors?: number;
  floors?: AdminFloorRatingsItem[];
}

export interface AdminStructureTestResultItem {
  scope?: "structure" | "floor" | "flat" | "block" | string;
  location_label?: string;
  floor_id?: string | null;
  flat_id?: string | null;
  block_id?: string | null;
  test_id?: string;
  test_name?: string;
  component_type?: string;
  component_id?: string;
  test_date?: string | null;
  tested_by?: string;
  remarks?: string;
  test_results?: Record<string, unknown>;
  test_report_pdf?: {
    filename?: string;
    file_path?: string;
    uploaded_at?: string;
  } | null;
}

export interface AdminStructureTestsResponse {
  structure_id?: string;
  uid?: string;
  structural_identity_number?: string;
  total?: number;
  results?: AdminStructureTestResultItem[];
}

export interface SystemStats {
  structures?: {
    total?: number;
  };
  users?: {
    active?: number;
    total?: number;
  };
}

export type UserRole = "AD" | "TE" | "VE" | "FE" | string;

export interface ModuleAccess {
  read: boolean;
  write: boolean;
}

export interface AdminUserPermissions {
  can_create_structures?: boolean;
  can_approve_structures?: boolean;
  can_delete_structures?: boolean;
  can_view_all_structures?: boolean;
  can_export_reports?: boolean;
  can_manage_users?: boolean;
  modules: {
    users: ModuleAccess;
    structures: ModuleAccess;
    reports: ModuleAccess;
    admin: ModuleAccess;
  };
}

export interface AdminUserProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
  organization?: string;
  designation?: string;
  employee_id?: string;
  address?: string;
}

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  profile?: AdminUserProfile;
  permissions: AdminUserPermissions;
  is_active?: boolean;
  isEmailVerified?: boolean;
  structure_count?: number;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  temporary_password?: string;
}

export interface AdminUserPayload {
  username: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  profile?: AdminUserProfile;
  is_active?: boolean;
  isEmailVerified?: boolean;
  permissions: AdminUserPermissions;
}
