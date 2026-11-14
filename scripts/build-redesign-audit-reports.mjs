import fs from "node:fs";
import path from "node:path";

import {
  getExecutiveSummary,
  getProjectCurrentStatus,
  getTechnologyStackAudit,
  getArchitectureAudit,
  getCompleteRouteInventory,
} from "./audit-modules/part1-overview.mjs";

import {
  getPageCountAndRedesignScope,
  getCompleteUiUxAudit,
  getDesignSystemAudit,
  getFeatureCompleteness,
  getBackendApiDatabaseAudit,
} from "./audit-modules/part2-routes-ui.mjs";

import {
  getAuthRbacAudit,
  getPerformanceAccessibilitySeo,
  getTestingDevopsSecurity,
  getScreenshotCatalog,
} from "./audit-modules/part3-backend-security.mjs";

import {
  getRedesignPageImagePlan,
  getRedesignStrategy,
  getRedesignRoadmap,
  getRiskAndTechnicalDebt,
  getEvidenceIndex,
} from "./audit-modules/part4-redesign-plan.mjs";

const OUT_DIR = "E:/Virtual Campus FPT Poly/docs/project-redesign-audit";
fs.mkdirSync(OUT_DIR, { recursive: true });

function writeDoc(filename, content) {
  const filePath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filePath, content.trim() + "\n", "utf8");
  console.log(`[OK] Generated: ${filename} (${content.length} chars)`);
}

const reports = [
  { name: "00-executive-summary.md", content: getExecutiveSummary() },
  { name: "01-project-current-status.md", content: getProjectCurrentStatus() },
  { name: "02-technology-stack-audit.md", content: getTechnologyStackAudit() },
  { name: "03-architecture-audit.md", content: getArchitectureAudit() },
  { name: "04-complete-route-inventory.md", content: getCompleteRouteInventory() },
  { name: "05-page-count-and-redesign-scope.md", content: getPageCountAndRedesignScope() },
  { name: "06-complete-ui-ux-audit.md", content: getCompleteUiUxAudit() },
  { name: "07-design-system-audit.md", content: getDesignSystemAudit() },
  { name: "08-feature-completeness.md", content: getFeatureCompleteness() },
  { name: "09-backend-api-database-audit.md", content: getBackendApiDatabaseAudit() },
  { name: "10-auth-rbac-audit.md", content: getAuthRbacAudit() },
  { name: "11-performance-accessibility-seo.md", content: getPerformanceAccessibilitySeo() },
  { name: "12-testing-devops-security.md", content: getTestingDevopsSecurity() },
  { name: "13-screenshot-catalog.md", content: getScreenshotCatalog() },
  { name: "14-redesign-page-image-plan.md", content: getRedesignPageImagePlan() },
  { name: "15-redesign-strategy.md", content: getRedesignStrategy() },
  { name: "16-redesign-roadmap.md", content: getRedesignRoadmap() },
  { name: "17-risk-and-technical-debt.md", content: getRiskAndTechnicalDebt() },
  { name: "18-evidence-index.md", content: getEvidenceIndex() },
];

console.log("Generating 19 Redesign Audit Markdown documents...");
for (const rep of reports) {
  writeDoc(rep.name, rep.content);
}
console.log("All 19 documents successfully generated under docs/project-redesign-audit/");
