import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const baseDir = path.join(process.cwd(), 'docs', 'ui-redesign', 'images');
const folders = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory()).sort();

const filesAudit = [];
const hashMap = new Map();

for (const folder of folders) {
  for (const filename of ['desktop.png', 'mobile.png']) {
    const filePath = path.join(baseDir, folder, filename);
    if (!fs.existsSync(filePath)) {
      filesAudit.push({ pageId: folder, filename, exists: false });
      continue;
    }
    const buf = fs.readFileSync(filePath);
    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
    const gitBlobSha = crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

    const item = {
      pageId: folder,
      filename,
      relPath: `docs/ui-redesign/images/${folder}/${filename}`,
      size: buf.length,
      sha256,
      gitBlobSha: gitBlobSha.slice(0, 8),
      duplicates: []
    };

    if (!hashMap.has(sha256)) {
      hashMap.set(sha256, []);
    }
    hashMap.get(sha256).push(item);
    filesAudit.push(item);
  }
}

console.log(`Total files inspected: ${filesAudit.length}`);
console.log(`Total unique SHA-256 hashes: ${hashMap.size}`);

for (const [sha256, items] of hashMap.entries()) {
  if (items.length > 1) {
    console.log(`\nDUPLICATE GROUP (${items.length} files): GitBlob: ${items[0].gitBlobSha}, Size: ${items[0].size} bytes, SHA256: ${sha256}`);
    for (const it of items) {
      console.log(`  - ${it.relPath}`);
    }
  }
}

fs.writeFileSync('docs/ui-redesign/reports/duplicate_hash_audit.json', JSON.stringify({
  totalFiles: filesAudit.length,
  uniqueHashes: hashMap.size,
  duplicateGroups: Array.from(hashMap.entries()).filter(([k, v]) => v.length > 1).map(([sha256, items]) => ({
    sha256,
    gitBlobSha: items[0].gitBlobSha,
    size: items[0].size,
    count: items.length,
    files: items.map(x => x.relPath)
  }))
}, null, 2));

console.log('\nSaved duplicate audit to docs/ui-redesign/reports/duplicate_hash_audit.json');
