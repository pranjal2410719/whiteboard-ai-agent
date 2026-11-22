import type { DiagramRegion } from "@/lib/types";

/**
 * Standard whiteboard layout for the Demonstration A heart chambers diagram.
 * Positioned on the right side of the 1000x330 canvas at x: 550, y: 25.
 */
export const HEART_IMAGE_LAYOUT = { x: 550, y: 25, w: 370, h: 250 };

/**
 * Relative region coordinates within the heart diagram asset.
 */
export const heartRegions: DiagramRegion[] = [
  { id: "superior-vena-cava", label: "Superior Vena Cava", x: 70, y: 15, w: 50, h: 60, aliases: ["svc", "upper vena cava", "superior cava", "superior_vena_cava"], note: "Vein delivering deoxygenated blood from upper body into the right atrium." },
  { id: "inferior-vena-cava", label: "Inferior Vena Cava", x: 70, y: 185, w: 50, h: 55, aliases: ["ivc", "lower vena cava", "inferior cava", "inferior_vena_cava"], note: "Vein returning deoxygenated blood from lower body into right atrium." },
  { id: "right-atrium", label: "Right Atrium", x: 67, y: 74, w: 56, h: 72, aliases: ["ra", "right auricle", "right_atrium"], note: "Receives deoxygenated venous blood and sends it through tricuspid valve into right ventricle." },
  { id: "tricuspid-valve", label: "Tricuspid Valve", x: 91, y: 142, w: 48, h: 36, aliases: ["tricuspid", "right av valve", "tricuspid_valve"], note: "Three-flap valve preventing backflow into right atrium during ventricular contraction." },
  { id: "right-ventricle", label: "Right Ventricle", x: 91, y: 164, w: 68, h: 52, aliases: ["rv", "pulmonary pump", "right_ventricle"], note: "Pumps deoxygenated blood through pulmonary valve into the pulmonary arteries toward lungs." },
  { id: "pulmonary-valve", label: "Pulmonary Valve", x: 128, y: 97, w: 44, h: 36, aliases: ["pulmonic valve", "pulmonary semilunar valve", "pulmonary_valve"], note: "Semilunar valve preventing backflow from pulmonary artery into right ventricle." },
  { id: "pulmonary-artery", label: "Pulmonary Artery", x: 130, y: 40, w: 65, h: 50, aliases: ["pulmonary trunk", "lung artery", "pulmonary_artery"], note: "Transports deoxygenated blood toward the lungs for re-oxygenation." },
  { id: "aorta", label: "Aorta Arch", x: 140, y: 10, w: 75, h: 60, aliases: ["aortic arch", "systemic artery", "aorta"], note: "Main arterial trunk carrying high-pressure oxygenated blood from left ventricle to the entire body." },
  { id: "pulmonary-veins", label: "Pulmonary Veins", x: 230, y: 70, w: 55, h: 45, aliases: ["lung veins", "pulmonary vein", "pulmonary_veins"], note: "Bring oxygen-rich blood from lungs directly into left atrium." },
  { id: "left-atrium", label: "Left Atrium", x: 177, y: 70, w: 56, h: 50, aliases: ["la", "left auricle", "left_atrium"], note: "Receives oxygenated blood from lungs and funnels it into left ventricle." },
  { id: "bicuspid-valve", label: "Bicuspid (Mitral) Valve", x: 181, y: 117, w: 48, h: 36, aliases: ["mitral valve", "bicuspid", "mitral_valve", "bicuspid_valve"], note: "Valve preventing backflow into left atrium when left ventricle contracts." },
  { id: "aortic-valve", label: "Aortic Valve", x: 148, y: 57, w: 44, h: 36, aliases: ["aortic semilunar valve", "aortic_valve"], note: "Semilunar valve preventing backflow into left ventricle." },
  { id: "left-ventricle", label: "Left Ventricle", x: 193, y: 132, w: 64, h: 76, aliases: ["lv", "systemic pump", "left_ventricle"], note: "Most muscular chamber generating systemic pressure to pump oxygenated blood into aorta." },
  { id: "septum", label: "Interventricular Septum", x: 160, y: 150, w: 35, h: 75, aliases: ["septum", "ventricular septum", "cardiac wall"], note: "Thick muscular partition preventing mixing of oxygenated (left) and deoxygenated (right) blood." },
];

/**
 * Absolute whiteboard canvas coordinates matching the diagram image at (550, 25).
 * Centers align precisely with lecture animation circles:
 * RA center (645, 135), RV center (675, 215), LA center (755, 120), LV center (775, 195),
 * Tricuspid (665, 185), Pulm Valve (700, 140), Mitral (755, 160), Aortic Valve (720, 100).
 */
export const heartBoardRegions: DiagramRegion[] = [
  { id: "superior-vena-cava", label: "Superior Vena Cava", x: 620, y: 40, w: 50, h: 60, aliases: ["svc", "upper vena cava", "superior cava", "superior_vena_cava"], note: "Vein delivering deoxygenated blood from upper body into the right atrium." },
  { id: "inferior-vena-cava", label: "Inferior Vena Cava", x: 620, y: 210, w: 50, h: 55, aliases: ["ivc", "lower vena cava", "inferior cava", "inferior_vena_cava"], note: "Vein returning deoxygenated blood from lower body into right atrium." },
  { id: "right-atrium", label: "Right Atrium", x: 617, y: 99, w: 56, h: 72, aliases: ["ra", "right auricle", "right_atrium"], note: "Receives deoxygenated venous blood and sends it through tricuspid valve into right ventricle." },
  { id: "tricuspid-valve", label: "Tricuspid Valve", x: 641, y: 167, w: 48, h: 36, aliases: ["tricuspid", "right av valve", "tricuspid_valve"], note: "Three-flap valve preventing backflow into right atrium during ventricular contraction." },
  { id: "right-ventricle", label: "Right Ventricle", x: 641, y: 189, w: 68, h: 52, aliases: ["rv", "pulmonary pump", "right_ventricle"], note: "Pumps deoxygenated blood through pulmonary valve into the pulmonary arteries toward lungs." },
  { id: "pulmonary-valve", label: "Pulmonary Valve", x: 678, y: 122, w: 44, h: 36, aliases: ["pulmonic valve", "pulmonary semilunar valve", "pulmonary_valve"], note: "Semilunar valve preventing backflow from pulmonary artery into right ventricle." },
  { id: "pulmonary-artery", label: "Pulmonary Artery", x: 680, y: 65, w: 65, h: 50, aliases: ["pulmonary trunk", "lung artery", "pulmonary_artery"], note: "Transports deoxygenated blood toward the lungs for re-oxygenation." },
  { id: "aorta", label: "Aorta Arch", x: 690, y: 35, w: 75, h: 60, aliases: ["aortic arch", "systemic artery", "aorta"], note: "Main arterial trunk carrying high-pressure oxygenated blood from left ventricle to the entire body." },
  { id: "pulmonary-veins", label: "Pulmonary Veins", x: 780, y: 95, w: 55, h: 45, aliases: ["lung veins", "pulmonary vein", "pulmonary_veins"], note: "Bring oxygen-rich blood from lungs directly into left atrium." },
  { id: "left-atrium", label: "Left Atrium", x: 727, y: 95, w: 56, h: 50, aliases: ["la", "left auricle", "left_atrium"], note: "Receives oxygenated blood from lungs and funnels it into left ventricle." },
  { id: "bicuspid-valve", label: "Bicuspid (Mitral) Valve", x: 731, y: 142, w: 48, h: 36, aliases: ["mitral valve", "bicuspid", "mitral_valve", "bicuspid_valve"], note: "Valve preventing backflow into left atrium when left ventricle contracts." },
  { id: "aortic-valve", label: "Aortic Valve", x: 698, y: 82, w: 44, h: 36, aliases: ["aortic semilunar valve", "aortic_valve"], note: "Semilunar valve preventing backflow into left ventricle." },
  { id: "left-ventricle", label: "Left Ventricle", x: 743, y: 157, w: 64, h: 76, aliases: ["lv", "systemic pump", "left_ventricle"], note: "Most muscular chamber generating systemic pressure to pump oxygenated blood into aorta." },
  { id: "septum", label: "Interventricular Septum", x: 710, y: 175, w: 35, h: 75, aliases: ["septum", "ventricular septum", "cardiac wall"], note: "Thick muscular partition preventing mixing of oxygenated (left) and deoxygenated (right) blood." },
];
