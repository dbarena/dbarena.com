export const HOME_HREF = "/";
export const COMPARE_HREF = "/compare";
export const METHODOLOGY_HREF = "/methodology";
export const GITHUB_HREF = "https://github.com/dbarena/dbarena.com";
export const GITHUB_RESULTS_HREF =
  "https://github.com/dbarena/dbarena.com/tree/main/results";
const GITHUB_RESULT_BLOB_HREF =
  "https://github.com/dbarena/dbarena.com/blob/main/results";

export function githubResultHref(resultPath: string) {
  return `${GITHUB_RESULT_BLOB_HREF}/${resultPath}`;
}

export const SPONSOR_SIGNUP_HREF =
  "https://supabase.com/dashboard/sign-up?utm_source=dbarena&utm_medium=referral&utm_campaign=dbarena";

// `/?subscribe` opens the footer subscribe dialog on load (blog and email CTAs).
export const SUBSCRIBE_PARAM = "subscribe";
