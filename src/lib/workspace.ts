import type { AuditRecord, ContractRecord, TemplateRecord, UserRecord, WorkspaceSettings } from "@/lib/domain";
import type { PluginModule } from "@/lib/modules";

export type WorkspaceData = {
  contracts: ContractRecord[];
  templates: TemplateRecord[];
  users: UserRecord[];
  audit: AuditRecord[];
  settings: WorkspaceSettings;
  modules: PluginModule[];
  integrations: { kavenegarConfigured: boolean; woocommerceConfigured: boolean; resendConfigured: boolean; appUrl: string };
};

export type WorkspaceView = "overview" | "templates" | "issue" | "contracts" | "audit" | "architecture";
export type Notify = (message: string, type?: "success" | "error") => void;
