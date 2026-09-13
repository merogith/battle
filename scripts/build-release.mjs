// Build an allowlisted, hash-verified Pages artifact. Development and test files never ship.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'offline-assets.json'),'utf8'));
const allowed=/^(?:battle\.html|index\.html|manifest\.webmanifest|online-(?:config|pvp)\.js|move-(?:anim|sfx)-map\.js|game-upgrades\.(?:js|css)|sw\.js|(?:sprites|music|data|fonts|icons|vendor)\/[^\0]+)$/;
for(const file of manifest.files){
  const relative=decodeURI(file.u);
  if(!allowed.test(relative) || relative.split('/').includes('..'))throw new Error(`Unapproved release path: ${relative}`);
  const bytes=fs.readFileSync(path.join(root,relative));
  const hash=crypto.createHash('sha1').update(bytes).digest('hex').slice(0,16);
  if(hash!==file.h || bytes.length!==file.b)throw new Error(`Stale release manifest: ${relative}. Run npm run offline:manifest.`);
}
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const file of manifest.files){
  const relative=decodeURI(file.u), target=path.join(out,relative);
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,relative),target);
}
for(const name of ['offline-assets.json','ATTRIBUTION.md','LICENSE','.nojekyll'])if(fs.existsSync(path.join(root,name)))fs.copyFileSync(path.join(root,name),path.join(out,name));
fs.writeFileSync(path.join(out,'release.json'),JSON.stringify({version:manifest.version,digest:manifest.digest,files:manifest.fileCount},null,2)+'\n');
console.log(`Verified ${manifest.fileCount} files; Pages artifact: dist/ (${manifest.version})`);
