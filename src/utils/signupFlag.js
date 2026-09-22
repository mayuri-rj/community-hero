// src/utils/signupFlag.js  ← NEW FILE
// Simple in-memory flag to prevent App.js's global auth listener
// from racing with PartnerAuth.js's own ensureUserDoc call during signup.
let signupInProgress = false;

export const setSignupInProgress = (val) => {
  signupInProgress = val;
};

export const isSignupInProgress = () => signupInProgress;