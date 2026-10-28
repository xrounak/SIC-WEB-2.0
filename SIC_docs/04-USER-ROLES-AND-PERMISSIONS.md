# 04 — User Roles and Permissions

## Role model
Use global roles for system authority and separate team/domain membership records for scope. Do not use a single role field to represent all a user's team memberships.

Suggested global roles:
- `member`
- `team_lead`
- `vice_president`
- `president`
- `faculty_coordinator`
- `admin`

A person can have more than one global role only if club policy explicitly allows it. Prefer a trusted role-assignment process and audit every change.

## Permission matrix
| Capability | Public | Member | Lead | VP | President | Faculty/Admin |
|---|---:|---:|---:|---:|---:|---:|
| Read published public content | Yes | Yes | Yes | Yes | Yes | Yes |
| Submit public event registration | Yes | Yes | Yes | Yes | Yes | Yes |
| Read own profile | No account | Yes | Yes | Yes | Yes | Yes |
| Edit own profile | No | Yes | Yes | Yes | Yes | Yes |
| Submit project/event proposal | No | Yes | Yes | Yes | Yes | Yes |
| Review assigned team proposals | No | No | Yes | Yes | Yes | According to policy |
| Publish ordinary content | No | No | Assigned scope only | Yes | Yes | According to policy |
| Final approval for major events | No | No | No | Yes | Yes | Optional policy |
| View private recruitment applications | No | No | Only if assigned | Yes | Yes | Restricted |
| Assign global roles | No | No | No | Normally no | Policy-defined | Admin/trusted authority |
| Read audit log | No | No | Own scope if needed | Limited | Yes | Yes |
| Export personal data | No | No | Minimal assigned scope | Restricted | Restricted | Explicitly authorized |

## Approval authority
- Team lead: initial review and recommendation for assigned scope.
- Vice President: final approval for important operational decisions when authorized.
- President: final approval for major decisions and policy exceptions.
- Faculty coordinator: oversight only as agreed with the college.
- Admin: technical system administration; should not automatically imply authority to make club decisions.

## Authorization rules
1. Verify user identity from the authenticated session.
2. Verify role and scope in the database or trusted server context.
3. Apply RLS to direct database operations.
4. Apply authorization again inside Edge Functions.
5. Log approvals, role changes, exports and other sensitive actions.
6. Do not trust role values supplied by the browser.
7. A lead's access is limited to assigned teams/domains, not all records.
