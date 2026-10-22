export type StaffRole =
  | "owner"
  | "manager"
  | "technicien"
  | "technicien_pc"
  | "vendeur"
  | "caissier"
  | "magasinier";

export interface StaffMember {
  id: string;
  shop_id: string;
  user_id: string | null;
  role: StaffRole;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface CreateStaffData {
  shop_id: string;
  role: StaffRole;
  full_name: string;
  phone?: string;
  user_id?: string | null;
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Propriétaire",
  manager: "Chef d'atelier",
  technicien: "Technicien téléphone",
  technicien_pc: "Technicien PC",
  vendeur: "Vendeur",
  caissier: "Caissier",
  magasinier: "Magasinier",
};
