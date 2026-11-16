import fs from "node:fs";
import path from "node:path";

import { PAGES_DATA } from "./ui-redesign-generator/pages-data.mjs";
import {
  getDesignSystemMd,
  getTokensMd,
  getComponentCatalogMd,
} from "./ui-redesign-generator/design-system-gen.mjs";
import {
  getPageInventoryMd,
  getPageDesignSpecificationsMd,
  getResponsiveSpecificationsMd,
} from "./ui-redesign-generator/specifications-gen.mjs";
import {
  generateDesignPrompt,
  generateImplementationPrompt,
} from "./ui-redesign-generator/prompts-gen.mjs";
import {
  getPhaseAReportMd,
  getImageQaReportMd,
} from "./ui-redesign-generator/reports-gen.mjs";

const BASE_OUT = "E:/Virtual Campus FPT Poly/docs/ui-redesign";
const SRC_SCREENSHOTS = "E:/Virtual Campus FPT Poly/docs/project-redesign-audit/screenshots";
const SRC_MOCKUPS = "E:/Virtual Campus FPT Poly/docs/project-redesign-audit/ui-mockups";

// 1. Ensure directory tree
const DIRS = [
  BASE_OUT,
  path.join(BASE_OUT, "design-system"),
  path.join(BASE_OUT, "images"),
  path.join(BASE_OUT, "prompts"),
  path.join(BASE_OUT, "prompts", "design-prompts"),
  path.join(BASE_OUT, "prompts", "implementation-prompts"),
  path.join(BASE_OUT, "specifications"),
  path.join(BASE_OUT, "reports"),
];

for (const d of DIRS) {
  fs.mkdirSync(d, { recursive: true });
}

// 2. Populate 25 image subdirectories and copy images
console.log("Copying images into 25 page directories...");
let imageCount = 0;

for (const p of PAGES_DATA) {
  const pageImgDir = path.join(BASE_OUT, "images", p.id);
  fs.mkdirSync(pageImgDir, { recursive: true });

  // Copy desktop.png
  const srcDesktop = path.join(SRC_SCREENSHOTS, `desktop-1440__${p.slug}.png`);
  if (fs.existsSync(srcDesktop)) {
    fs.copyFileSync(srcDesktop, path.join(pageImgDir, "desktop.png"));
    imageCount++;
  } else {
    console.warn(`[WARN] Missing desktop screenshot for ${p.id} (${srcDesktop})`);
  }

  // Copy mobile.png
  const srcMobile = path.join(SRC_SCREENSHOTS, `mobile-390__${p.slug}.png`);
  if (fs.existsSync(srcMobile)) {
    fs.copyFileSync(srcMobile, path.join(pageImgDir, "mobile.png"));
    imageCount++;
  } else {
    console.warn(`[WARN] Missing mobile screenshot for ${p.id} (${srcMobile})`);
  }

  // Copy concept-redesign.jpg if available
  if (p.hasConcept) {
    const srcConcept = path.join(SRC_MOCKUPS, p.hasConcept);
    if (fs.existsSync(srcConcept)) {
      fs.copyFileSync(srcConcept, path.join(pageImgDir, "concept-redesign.jpg"));
      imageCount++;
    }
  }
}
console.log(`[OK] Finished copying ${imageCount} image files into 25 page folders.`);

// 3. Write Design System files
fs.writeFileSync(path.join(BASE_OUT, "design-system", "DESIGN_SYSTEM.md"), getDesignSystemMd(), "utf8");
fs.writeFileSync(path.join(BASE_OUT, "design-system", "TOKENS.md"), getTokensMd(), "utf8");
fs.writeFileSync(path.join(BASE_OUT, "design-system", "COMPONENT_CATALOG.md"), getComponentCatalogMd(), "utf8");
console.log("[OK] Generated Design System files.");

// 4. Write Specifications files
fs.writeFileSync(path.join(BASE_OUT, "specifications", "page-inventory.md"), getPageInventoryMd(), "utf8");
fs.writeFileSync(path.join(BASE_OUT, "specifications", "page-design-specifications.md"), getPageDesignSpecificationsMd(), "utf8");
fs.writeFileSync(path.join(BASE_OUT, "specifications", "responsive-specifications.md"), getResponsiveSpecificationsMd(), "utf8");
console.log("[OK] Generated Specification files.");

// 5. Write 25 Design Prompts and 25 Implementation Prompts
for (const p of PAGES_DATA) {
  // Design Prompt
  const dpContent = generateDesignPrompt(p);
  fs.writeFileSync(path.join(BASE_OUT, "prompts", "design-prompts", `${p.id}.md`), dpContent, "utf8");

  // Implementation Prompt
  const ipContent = generateImplementationPrompt(p);
  fs.writeFileSync(path.join(BASE_OUT, "prompts", "implementation-prompts", `${p.id}.md`), ipContent, "utf8");
}
console.log(`[OK] Generated 25 Design Prompts and 25 Implementation Prompts.`);

// 6. Write Reports
fs.writeFileSync(path.join(BASE_OUT, "reports", "PHASE_A_REPORT.md"), getPhaseAReportMd(), "utf8");
fs.writeFileSync(path.join(BASE_OUT, "reports", "IMAGE_QA_REPORT.md"), getImageQaReportMd(), "utf8");
console.log("[OK] Generated Reports (PHASE_A_REPORT.md & IMAGE_QA_REPORT.md).");

console.log("=== ENTIRE UI-REDESIGN SUITE BUILT SUCCESSFULLY ===");
