// Row shapes used by the UI. Replace with generated types (npm run db:types) once a
// Supabase project is linked; these mirror supabase/migrations.

export type AppRole = "vice_president" | "president" | "faculty_coordinator" | "admin";
export type StudentStatus = "unverified" | "pending" | "verified" | "rejected" | "external";
export type MemberStatus = "none" | "applicant" | "member" | "alumni" | "suspended";
export type EventStatus =
  | "draft" | "pending_review" | "changes_requested" | "lead_approved" | "final_approved"
  | "published" | "completed" | "cancelled" | "rejected" | "archived";
export type ProjectStatus =
  | "draft" | "submitted" | "in_review" | "changes_requested" | "published" | "rejected" | "archived";
export type ApplicationStatus =
  | "submitted" | "screening" | "shortlisted" | "interview" | "selected" | "waitlisted" | "rejected" | "withdrawn";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  college_name: string | null;
  branch: string | null;
  academic_year: number | null;
  roll_number: string | null;
  student_status: StudentStatus;
  member_status: MemberStatus;
  public_profile: boolean;
  onboarded_at: string | null;
  created_at: string;
};

export type Domain = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Team = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  team_type: "technical" | "operations" | "media";
  domain_id: string | null;
  is_active: boolean;
};

export type EventType = "workshop" | "hackathon" | "competition" | "seminar" | "external" | "meeting";

export type SicEvent = {
  id: string;
  slug: string | null;
  title: string;
  summary: string | null;
  description: string | null;
  event_type: EventType;
  is_major: boolean;
  status: EventStatus;
  visibility: "public" | "members";
  venue: string | null;
  starts_at: string | null;
  ends_at: string | null;
  reg_opens_at: string | null;
  reg_closes_at: string | null;
  capacity: number | null;
  participation: "individual" | "team";
  team_min: number | null;
  team_max: number | null;
  owner_team_id: string;
  domain_id: string | null;
  cover_path: string | null;
  created_by: string;
  published_at: string | null;
  created_at: string;
};

export type EventReview = {
  id: string;
  event_id: string;
  stage: "lead" | "final";
  reviewer_id: string | null;
  decision: "approved" | "changes_requested" | "rejected";
  notes: string | null;
  created_at: string;
};

export type Registration = {
  id: string;
  event_id: string;
  user_id: string;
  event_team_id: string | null;
  team_role: "leader" | "member" | null;
  status: "registered" | "cancelled" | "attended" | "no_show";
  created_at: string;
};

export type EventTeam = {
  id: string;
  event_id: string;
  name: string;
  leader_id: string;
  status: "forming" | "complete" | "withdrawn";
};

export type TeamInvite = {
  id: string;
  event_team_id: string;
  email: string;
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
};

export type Project = {
  id: string;
  slug: string | null;
  title: string;
  summary: string | null;
  problem: string | null;
  solution: string | null;
  outcomes: string | null;
  hardware_details: string | null;
  software_details: string | null;
  repo_url: string | null;
  demo_url: string | null;
  status: ProjectStatus;
  visibility: "public" | "members";
  owner_team_id: string;
  cover_path: string | null;
  created_by: string;
  published_at: string | null;
  created_at: string;
};

export type RecruitmentCycle = {
  id: string;
  name: string;
  description: string | null;
  opens_at: string;
  closes_at: string;
  status: "draft" | "open" | "closed" | "archived";
};

export type Application = {
  id: string;
  cycle_id: string;
  user_id: string;
  domain_prefs: string[];
  team_prefs: string[];
  motivation: string;
  experience: string | null;
  portfolio_url: string | null;
  status: ApplicationStatus;
  submitted_at: string;
  decided_at: string | null;
};

export type Evaluation = {
  id: string;
  application_id: string;
  evaluator_id: string | null;
  stage: "screening" | "interview";
  score: number | null;
  private_notes: string | null;
  recommendation: "advance" | "hold" | "reject" | "select" | null;
  created_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: "public" | "members" | "team";
  team_id: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  created_by: string;
  created_at: string;
};

export type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  target_url: string | null;
  read_at: string | null;
  created_at: string;
};
