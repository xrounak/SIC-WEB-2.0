/** Branches offered in forms. "Other" covers anything not listed. */
export const BRANCHES = ["Mechanical", "EEE", "EE", "CSE", "Civil", "Other"] as const;

export const BRANCH_OPTIONS = BRANCHES.map((b) => ({ value: b, label: b }));

/** Batch sessions such as "2024-28": the current intake and the four before it. */
export function sessionOptions(now = new Date()) {
  const latest = now.getFullYear();
  return Array.from({ length: 5 }, (_, i) => {
    const start = latest - i;
    const value = `${start}-${String(start + 4).slice(2)}`;
    return { value, label: value };
  });
}

/** A saved session that is no longer in the list (an older batch) still shows up. */
export function sessionOptionsWith(current?: string | null) {
  const options = sessionOptions();
  return current && !options.some((o) => o.value === current) ? [...options, { value: current, label: current }] : options;
}

/** A saved branch that is not in the list still shows up. */
export function branchOptionsWith(current?: string | null) {
  return current && !BRANCHES.includes(current as (typeof BRANCHES)[number])
    ? [...BRANCH_OPTIONS, { value: current, label: current }]
    : BRANCH_OPTIONS;
}
