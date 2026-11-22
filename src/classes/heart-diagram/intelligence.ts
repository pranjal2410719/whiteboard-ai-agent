import type { DiagramRegion } from "@/lib/types";

export const heartRegions: DiagramRegion[] = [
  { id: "superior-vena-cava", label: "Superior Vena Cava", x: 90, y: 30, w: 50, h: 55, aliases: ["svc", "upper vena cava", "superior cava", "superior_vena_cava"], note: "Vein delivering deoxygenated blood from upper body into the right atrium." },
  { id: "inferior-vena-cava", label: "Inferior Vena Cava", x: 85, y: 180, w: 50, h: 50, aliases: ["ivc", "lower vena cava", "inferior cava", "inferior_vena_cava"], note: "Vein returning deoxygenated blood from lower body into right atrium." },
  { id: "right-atrium", label: "Right Atrium", x: 95, y: 95, w: 60, h: 65, aliases: ["ra", "right auricle", "right_atrium"], note: "Receives deoxygenated venous blood and sends it through tricuspid valve into right ventricle." },
  { id: "tricuspid-valve", label: "Tricuspid Valve", x: 120, y: 155, w: 50, h: 32, aliases: ["tricuspid", "right av valve", "tricuspid_valve"], note: "Three-flap valve preventing backflow into right atrium during ventricular contraction." },
  { id: "right-ventricle", label: "Right Ventricle", x: 125, y: 175, w: 75, h: 65, aliases: ["rv", "pulmonary pump", "right_ventricle"], note: "Pumps deoxygenated blood through pulmonary valve into the pulmonary arteries toward lungs." },
  { id: "pulmonary-valve", label: "Pulmonary Valve", x: 140, y: 110, w: 45, h: 32, aliases: ["pulmonic valve", "pulmonary semilunar valve", "pulmonary_valve"], note: "Semilunar valve preventing backflow from pulmonary artery into right ventricle." },
  { id: "pulmonary-artery", label: "Pulmonary Artery", x: 145, y: 65, w: 75, h: 55, aliases: ["pulmonary trunk", "lung artery", "pulmonary_artery"], note: "Transports deoxygenated blood toward the lungs for re-oxygenation." },
  { id: "aorta", label: "Aorta Arch", x: 160, y: 20, w: 70, h: 65, aliases: ["aortic arch", "systemic artery", "aorta"], note: "Main arterial trunk carrying high-pressure oxygenated blood from left ventricle to the entire body." },
  { id: "pulmonary-veins", label: "Pulmonary Veins", x: 235, y: 85, w: 55, h: 45, aliases: ["lung veins", "pulmonary vein", "pulmonary_veins"], note: "Bring oxygen-rich blood from lungs directly into left atrium." },
  { id: "left-atrium", label: "Left Atrium", x: 200, y: 95, w: 60, h: 55, aliases: ["la", "left auricle", "left_atrium"], note: "Receives oxygenated blood from lungs and funnels it into left ventricle." },
  { id: "bicuspid-valve", label: "Bicuspid (Mitral) Valve", x: 195, y: 145, w: 45, h: 32, aliases: ["mitral valve", "bicuspid", "mitral_valve", "bicuspid_valve"], note: "Valve preventing backflow into left atrium when left ventricle contracts." },
  { id: "aortic-valve", label: "Aortic Valve", x: 170, y: 120, w: 40, h: 32, aliases: ["aortic semilunar valve", "aortic_valve"], note: "Semilunar valve preventing backflow into left ventricle." },
  { id: "left-ventricle", label: "Left Ventricle", x: 195, y: 170, w: 80, h: 70, aliases: ["lv", "systemic pump", "left_ventricle"], note: "Most muscular chamber generating systemic pressure to pump oxygenated blood into aorta." },
  { id: "septum", label: "Interventricular Septum", x: 165, y: 175, w: 35, h: 65, aliases: ["septum", "ventricular septum", "cardiac wall"], note: "Thick muscular partition preventing mixing of oxygenated (left) and deoxygenated (right) blood." },
];
