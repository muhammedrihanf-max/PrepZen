// Firebase is being removed from the connection
// This file will now export dummy versions of the services to prevent import errors during transition

export const auth = null as unknown;
export const secondaryAuth = null as unknown;
export const db = null as unknown;
export const secondaryDb = null as unknown;
export const storage = null as unknown;

const app = {};
export default app;
