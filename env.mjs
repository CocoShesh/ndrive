import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const path=fileURLToPath(new URL('./.env',import.meta.url));
try{for(const raw of readFileSync(path,'utf8').split(/\r?\n/)){const line=raw.trim();if(!line||line.startsWith('#'))continue;const match=line.match(/^(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);if(!match||process.env[match[1]]!==undefined)continue;let value=match[2].trim();if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);else value=value.replace(/\s+#.*$/,'').trim();process.env[match[1]]=value}}catch(error){if(error.code!=='ENOENT')throw error}
