import type { TenantFormController } from "@/hooks/useTenantForm";
import type { CandidateDraft } from "@/lib/candidate";

/**
 * The contract every step component receives.
 *
 * `update` is intentionally the hook's own generic setter rather than a bespoke
 * callback per field: it keeps the sections type-safe (a typo in a field name is
 * a compile error) and stops ten near-identical handlers existing.
 */
export interface StepProps {
  draft: CandidateDraft;
  update: TenantFormController["update"];
  errorFor: TenantFormController["errorFor"];
  markTouched: TenantFormController["markTouched"];
}