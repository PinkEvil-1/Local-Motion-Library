import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const base='https://kittenjam-motion-library.vercel.app/';
const update=process.argv.includes('--update');
if(!update&&!process.argv.includes('--check'))throw Error('Specify --check or --update');
const names=['index.html','data.js','fx.js','fx.css','app.js','robots.txt'];
const downloaded={};
for(const name of names){const response=await fetch(base+(name==='index.html'?'':name));if(!response.ok)throw Error(name+': HTTP '+response.status);downloaded[name]=await response.text();}
function literal(node){if(ts.isStringLiteral(node)||ts.isNumericLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))return ts.isNumericLiteral(node)?Number(node.text):node.text;if(node.kind===ts.SyntaxKind.TrueKeyword)return true;if(node.kind===ts.SyntaxKind.FalseKeyword)return false;if(ts.isArrayLiteralExpression(node))return node.elements.map(literal);if(ts.isObjectLiteralExpression(node))return Object.fromEntries(node.properties.map(p=>{if(!ts.isPropertyAssignment(p)||!p.name)throw Error('Nonliteral source property');return [p.name.text,literal(p.initializer)]}));throw Error('Source is no longer static literal data; manual review required.');}
const sf=ts.createSourceFile('data.js',downloaded['data.js'],ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);const found={};
for(const statement of sf.statements){if(ts.isVariableStatement(statement))for(const d of statement.declarationList.declarations){if(['COMPS','WHENS','USES','ITEMS'].includes(d.name.text))found[d.name.text]=literal(d.initializer);}}
if(!found.ITEMS?.length||new Set(found.ITEMS.map(x=>x.id)).size!==found.ITEMS.length)throw Error('Empty catalog or duplicate IDs');
const old=JSON.parse(await readFile('src/data/catalog.json','utf8'));const oldMap=new Map(old.items.map(x=>[x.id,x]));
const added=found.ITEMS.filter(x=>!oldMap.has(x.id)).map(x=>x.id);const changed=found.ITEMS.filter(x=>oldMap.has(x.id)&&JSON.stringify(oldMap.get(x.id))!==JSON.stringify(x)).map(x=>x.id);const ids=new Set(found.ITEMS.map(x=>x.id));const removed=old.items.filter(x=>!ids.has(x.id)).map(x=>x.id);
console.log(JSON.stringify({mode:update?'update':'check',local:old.items.length,remote:found.ITEMS.length,added,changed,removed},null,2));
if(update){const capturedAt=new Date().toISOString();const backup='source-snapshot/history/'+capturedAt.replace(/[:.]/g,'-');await mkdir(backup,{recursive:true});for(const n of names){try{await copyFile('source-snapshot/'+n,backup+'/'+n)}catch(e){if(e.code!=='ENOENT')throw e;}}await copyFile('src/data/catalog.json',backup+'/catalog.json');for(const [n,s]of Object.entries(downloaded))await writeFile('source-snapshot/'+n,s);await writeFile('src/data/catalog.json',JSON.stringify({comps:found.COMPS,whens:found.WHENS,uses:found.USES,items:found.ITEMS,capturedAt,source:base,author:'Hannah (UI/UX Designer)'},null,2)+'\n');for(const n of ['fx.js','fx.css'])await writeFile('public/runtime/'+n,downloaded[n]);await writeFile('source-snapshot/manifest.json',JSON.stringify({capturedAt,source:base,count:found.ITEMS.length,files:Object.fromEntries(Object.entries(downloaded).map(([n,s])=>[n,createHash('sha256').update(s).digest('hex')]))},null,2));console.log('Updated with previous snapshot retained. Run npm test, npm run build and npm run verify:demos before accepting.');}
