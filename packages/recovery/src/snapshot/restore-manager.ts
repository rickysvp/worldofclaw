import type { RecoverySnapshot } from "../recovery.types";

export const restoreRecoverySnapshot = (snapshot: RecoverySnapshot): RecoverySnapshot => structuredClone(snapshot);
