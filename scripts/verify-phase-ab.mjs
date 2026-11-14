import fs from 'node:fs';
import path from 'node:path';

function getPngDimensions(buf) {
  if (buf.length < 24) return null;
  if (buf.toString('ascii', 1, 4) !== 'PNG') return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

function getJpegDimensions(buf) {
  if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xFF) return null;
    let marker = buf[offset + 1];
    if (marker === 0xC0 || marker === 0xC2) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    const len = buf.readUInt16BE(offset + 2);
    offset += 2 + len;
  }
  return null;
}

const baseDir = path.join(process.cwd(), 'docs', 'ui-redesign', 'images');
const folders = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory()).sort();

console.log(`Checking folders in ${baseDir}: found ${folders.length}`);

const imageAudit = [];
let totalImages = 0;
let validDesktopCount = 0;
let validMobileCount = 0;
let conceptCount = 0;

for (const folder of folders) {
  const dir = path.join(baseDir, folder);
  const files = fs.readdirSync(dir).sort();
  for (const file of files) {
    totalImages++;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    const buf = fs.readFileSync(full);
    let dims = null;
    if (file.endsWith('.png')) dims = getPngDimensions(buf);
    else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) dims = getJpegDimensions(buf);

    const isDesktop = file === 'desktop.png';
    const isMobile = file === 'mobile.png';
    const isConcept = file.startsWith('concept');

    if (isDesktop && dims?.width === 1440 && dims?.height === 900) validDesktopCount++;
    if (isMobile && dims?.width === 390 && dims?.height === 844) validMobileCount++;
    if (isConcept && dims) conceptCount++;

    imageAudit.push({
      pageId: folder,
      file,
      sizeBytes: stat.size,
      sizeKB: (stat.size / 1024).toFixed(1),
      width: dims ? dims.width : null,
      height: dims ? dims.height : null,
      status: dims && stat.size > 1024 ? 'PASS' : 'FAIL'
    });
  }
}

console.log(`Audited images: total ${totalImages}, valid Desktop (1440x900): ${validDesktopCount}/25, valid Mobile (390x844): ${validMobileCount}/25, Concept images: ${conceptCount}`);

// Prompt check
const designPromptDir = path.join(process.cwd(), 'docs', 'ui-redesign', 'prompts', 'design-prompts');
const implPromptDir = path.join(process.cwd(), 'docs', 'ui-redesign', 'prompts', 'implementation-prompts');

const designPrompts = fs.readdirSync(designPromptDir).filter(f => f.endsWith('.md')).sort();
const implPrompts = fs.readdirSync(implPromptDir).filter(f => f.endsWith('.md')).sort();

console.log(`Design prompts found: ${designPrompts.length}/25`);
console.log(`Implementation prompts found: ${implPrompts.length}/25`);

const promptAudit = [];
for (const p of implPrompts) {
  const pageId = p.replace('.md', '');
  const content = fs.readFileSync(path.join(implPromptDir, p), 'utf-8');
  const hasDesktopRef = content.includes(`images/${pageId}/desktop.png`) || content.includes(`${pageId}/desktop.png`);
  const hasMobileRef = content.includes(`images/${pageId}/mobile.png`) || content.includes(`${pageId}/mobile.png`);
  const forbidsFakeHack = content.includes('KHÔNG ĐƯỢC nhúng trực tiếp ảnh') || content.includes('background-image') || content.includes('không chèn ảnh');
  promptAudit.push({
    pageId,
    file: p,
    hasDesktopRef,
    hasMobileRef,
    forbidsFakeHack,
    lengthChars: content.length,
    status: hasDesktopRef && hasMobileRef ? 'PASS' : 'INCOMPLETE'
  });
}

fs.writeFileSync(path.join(process.cwd(), 'docs', 'ui-redesign', 'reports', 'image_audit_data.json'), JSON.stringify({
  summary: {
    totalFolders: folders.length,
    totalImages,
    validDesktopCount,
    validMobileCount,
    conceptCount,
    designPromptsCount: designPrompts.length,
    implPromptsCount: implPrompts.length
  },
  images: imageAudit,
  prompts: promptAudit
}, null, 2));

console.log('Saved audit data to docs/ui-redesign/reports/image_audit_data.json');
