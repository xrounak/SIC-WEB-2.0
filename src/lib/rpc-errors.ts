/**
 * Workflow RPCs raise a stable UPPER_SNAKE code as the Postgres error message.
 * This maps each code to user-facing copy. Keep in sync with supabase/migrations.
 */
export const RPC_ERROR_MESSAGES = {
  NOT_AUTHENTICATED: "Sign in to continue.",
  NOT_ALLOWED: "You don't have permission to do that.",
  PROFILE_NOT_FOUND: "We couldn't find your profile. Sign out and sign in again.",
  ONBOARDING_REQUIRED: "Finish setting up your profile first.",
  NAME_REQUIRED: "Enter your full name.",
  PHONE_INVALID: "Enter a phone number with 8 to 16 digits.",
  STUDENT_DETAILS_REQUIRED: "Enter your branch, year and roll number.",
  COLLEGE_REQUIRED: "Enter the name of your college.",
  MEMBERS_MUST_BE_STUDENTS: "Club members and applicants must be students of our college.",
  CANNOT_VERIFY_SELF: "Someone else has to verify your student status.",
  ROLL_NUMBER_TAKEN: "Another verified account already uses this roll number.",
  USER_NOT_FOUND: "That person doesn't have an account.",
  LAST_ADMIN: "Assign another admin before removing the last one.",
  TEAM_NOT_FOUND: "That team doesn't exist.",
  INVALID_TEAM_ROLE: "Choose member, deputy or lead.",
  NOT_A_MEMBER: "Only club members can join a team.",

  EVENT_NOT_FOUND: "This event isn't available.",
  EVENT_INCOMPLETE: "Add a summary, description, venue and start time before submitting.",
  EVENT_IN_PAST: "The start time has to be in the future.",
  EVENT_STARTED: "The event has already started, so registration can't be changed.",
  EVENT_FULL: "This event is full.",
  REGISTRATION_NOT_OPEN: "Registration hasn't opened yet.",
  REGISTRATION_CLOSED: "Registration has closed.",
  REGISTRATION_NOT_FOUND: "We couldn't find that registration.",
  ALREADY_REGISTERED: "You're already registered for this event.",
  TEAM_EVENT: "This is a team event. Create a team or accept an invite to register.",
  INDIVIDUAL_EVENT: "This event is for individuals, not teams.",
  NOT_READY: "This event needs all approvals before it can be published.",
  NOTES_REQUIRED: "Add a note explaining what needs to change.",
  REASON_REQUIRED: "Add a reason. Registrants will see it.",
  CANNOT_REVIEW_OWN: "You can't review your own submission.",
  INVALID_DECISION: "Choose approve, request changes or reject.",
  INVALID_STATUS: "This can't be done at its current stage. Refresh and try again.",

  TEAM_NAME_REQUIRED: "Give your team a name.",
  TEAM_NAME_TAKEN: "Another team in this event already has that name.",
  TEAM_FULL: "This team is full.",
  TEAM_WITHDRAWN: "This team has withdrawn.",
  TOO_MANY_INVITES: "That's more people than this event allows per team.",
  CANNOT_INVITE_SELF: "You're already on the team. Invite your teammates' emails.",
  INVITE_EMAIL_INVALID: "One of the email addresses isn't valid.",
  ALREADY_INVITED: "That email already has a pending invite.",
  INVITE_NOT_FOUND: "This invite link isn't valid.",
  INVITE_EMAIL_MISMATCH: "This invite was sent to a different email. Sign in with that account.",
  INVITE_EXPIRED: "This invite has expired. Ask the team leader to send a new one.",
  INVITE_ACCEPTED: "This invite has already been accepted.",
  INVITE_DECLINED: "This invite was declined. Ask the team leader to send a new one.",
  INVITE_REVOKED: "The team leader cancelled this invite.",

  PROJECT_NOT_FOUND: "We couldn't find that project.",
  PROJECT_INCOMPLETE: "Add a summary, the problem and your solution before submitting.",
  NOT_A_CONTRIBUTOR: "You're not listed on this project.",

  CYCLE_CLOSED: "Recruitment isn't open right now.",
  NOT_ELIGIBLE: "Recruitment is open to students of our college only.",
  ALREADY_MEMBER: "You're already a member.",
  ALREADY_APPLIED: "You've already applied in this recruitment cycle.",
  DOMAIN_REQUIRED: "Pick at least one domain.",
  INVALID_PREFERENCE: "One of your choices is no longer available. Refresh and pick again.",
  APPLICATION_NOT_FOUND: "We couldn't find that application.",
  INVALID_TRANSITION: "The application can't move to that stage from where it is.",
  STUDENT_NOT_VERIFIED: "Verify this applicant's student status before selecting them.",
} as const;

export type RpcErrorCode = keyof typeof RPC_ERROR_MESSAGES;

export function rpcErrorMessage(error: { message?: string } | null | undefined): string {
  const code = error?.message as RpcErrorCode | undefined;
  return (code && RPC_ERROR_MESSAGES[code]) ?? "Something went wrong. Try again.";
}
