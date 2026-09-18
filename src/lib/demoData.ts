import type { Categorie, ToolType } from "@/types/database";

/** Modèle d'outil de démonstration (mode démo / pré-remplissage du catalogue). */
export interface DemoTool {
  nom: string;
  version: string | null;
  chemin: string;
  type: ToolType;
  categorie: Categorie;
  sous_categorie: string | null;
  description: string | null;
  favori: boolean;
  icone: string | null;
  tags: string[];
}

/**
 * Jeu de données fictives reprenant l'organisation d'outils de réparation
 * mobile de l'atelier GogoSoft. Sert au mode démo et au bouton
 * « Importer le catalogue de démonstration ».
 */
export const DEMO_TOOLS: DemoTool[] = [
  {
    nom: "TSM PRO (Turbo Service Mobile)",
    version: "2.4.1",
    chemin: "C:\\Program Files (x86)\\TurboServiceMobile",
    type: "exe",
    categorie: "MTK",
    sous_categorie: "Outils",
    description: "Suite multi-marques : flash, FRP, déblocage réseau.",
    favori: true,
    icone: "wrench",
    tags: ["frp", "flash", "unlock"],
  },
  {
    nom: "SP Flash Tool",
    version: "5.2152",
    chemin: "D:\\Outils\\MTK\\SP_Flash_Tool_v5.2152",
    type: "exe",
    categorie: "MTK",
    sous_categorie: "Noyau",
    description: "Flasher les ROM scatter MediaTek.",
    favori: true,
    icone: "cpu",
    tags: ["scatter", "rom", "mediatek"],
  },
  {
    nom: "MTK Droid Tools",
    version: "2.5.3",
    chemin: "D:\\Outils\\MTK\\MTKDroidTools",
    type: "dossier",
    categorie: "MTK",
    sous_categorie: "Outils",
    description: "Lecture d'infos, backup ROM et scatter.",
    favori: false,
    icone: "folder",
    tags: ["backup", "scatter"],
  },
  {
    nom: "SPD Research Tool",
    version: "R26.21",
    chemin: "D:\\Outils\\Unisoc\\SPD_Research_Tool",
    type: "exe",
    categorie: "Unisoc",
    sous_categorie: "Noyau",
    description: "Flash des firmwares Unisoc/Spreadtrum (.pac).",
    favori: true,
    icone: "microchip",
    tags: ["pac", "spreadtrum"],
  },
  {
    nom: "SPD Upgrade Tool",
    version: "16.0",
    chemin: "D:\\Outils\\Unisoc\\SPD_Upgrade_Tool.zip",
    type: "archive",
    categorie: "Unisoc",
    sous_categorie: "Outils",
    description: "Version portable de l'outil de mise à jour Unisoc.",
    favori: false,
    icone: "archive",
    tags: ["portable", "upgrade"],
  },
  {
    nom: "3uTools",
    version: "3.16",
    chemin: "C:\\Program Files (x86)\\3uTools",
    type: "exe",
    categorie: "Apple",
    sous_categorie: "Outils",
    description: "Gestion iOS : flash, jailbreak, diagnostic batterie.",
    favori: true,
    icone: "apple",
    tags: ["ios", "iphone", "flash"],
  },
  {
    nom: "iTunes (drivers Apple Mobile Device)",
    version: "12.13",
    chemin: "C:\\Program Files\\Common Files\\Apple\\Mobile Device Support",
    type: "dossier",
    categorie: "Apple",
    sous_categorie: "Pilotes",
    description: "Pilotes nécessaires à la détection des appareils iOS.",
    favori: false,
    icone: "usb",
    tags: ["driver", "usb"],
  },
  {
    nom: "MTK USB Driver (VCOM)",
    version: "1.0.8",
    chemin: "D:\\Outils\\Drivers\\MTK_VCOM_Driver",
    type: "dossier",
    categorie: "Drivers",
    sous_categorie: "Pilotes",
    description: "Pilotes VCOM MediaTek pour Windows 10/11.",
    favori: true,
    icone: "plug",
    tags: ["vcom", "windows11"],
  },
  {
    nom: "Qualcomm QDLoader 9008",
    version: "2.1.3",
    chemin: "D:\\Outils\\Drivers\\Qualcomm_QDLoader_9008.zip",
    type: "archive",
    categorie: "Drivers",
    sous_categorie: "Pilotes",
    description: "Pilote EDL 9008 pour le mode Emergency Download.",
    favori: false,
    icone: "plug",
    tags: ["edl", "9008", "qualcomm"],
  },
  {
    nom: "Notepad++",
    version: "8.6",
    chemin: "C:\\Program Files\\Notepad++",
    type: "exe",
    categorie: "Autres",
    sous_categorie: "Utilitaires",
    description: "Édition des fichiers scatter, XML et logs.",
    favori: false,
    icone: "file-text",
    tags: ["editeur", "logs"],
  },
];
