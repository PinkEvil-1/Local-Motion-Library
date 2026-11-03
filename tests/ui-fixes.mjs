import { chromium } from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4186';
const catalog=JSON.parse(await readFile('src/data/catalog.json','utf8'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1200}});
const report={testedAt:new Date().toISOString(),base,geometry:[],contrast:[],mobileGroups:[],checks:[]};
function rgb(s){return s.match(/[\d.]+/g).slice(0,3).map(Number)}
function lum(c){return c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0)}
function contrast(a,b){const [x,y]=[lum(rgb(a)),lum(rgb(b))].sort((a,b)=>b-a);return (x+.05)/(y+.05)}
try{
await page.goto(base);await page.waitForSelector('.ml-favorite svg');await page.locator('.ml-card').first().scrollIntoViewIfNeeded();
for(const active of [false,true]){if(active)await page.locator('.ml-favorite').first().click();const geometry=await page.locator('.ml-favorite').first().evaluate(button=>{const svg=button.querySelector('svg'),a=button.getBoundingClientRect(),b=svg.getBoundingClientRect(),s=getComputedStyle(button);return {pressed:button.getAttribute('aria-pressed'),dx:(b.x+b.width/2)-(a.x+a.width/2),dy:(b.y+b.height/2)-(a.y+a.height/2),padding:s.padding,width:a.width,height:a.height,svgFill:getComputedStyle(svg).fill,color:s.color}});assert.ok(Math.abs(geometry.dx)<=.5&&Math.abs(geometry.dy)<=.5);assert.equal(geometry.padding,'0px');assert.equal(geometry.pressed,String(active));report.geometry.push(geometry)}
await page.locator('.ml-favorite').first().click();
for(const selector of ['.ml-item-desc','.ml-tags button']){const colors=await page.locator(selector).first().evaluate(el=>{const style=getComputedStyle(el);let p=el;let bg=style.backgroundColor;while(bg==='rgba(0, 0, 0, 0)'&&p.parentElement){p=p.parentElement;bg=getComputedStyle(p).backgroundColor}return {color:style.color,background:bg,fontSize:style.fontSize}});const ratio=contrast(colors.color,colors.background);assert.ok(ratio>=4.5,selector+' contrast '+ratio);report.contrast.push({selector,...colors,ratio})}
const frameEl=page.locator('.ml-card iframe').first();await frameEl.waitFor();const frame=await frameEl.elementHandle().then(h=>h.contentFrame());await frame.waitForSelector('.tag');const tag=await frame.locator('.tag').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:r.x,y:r.y,width:r.width,height:r.height,innerHeight,top:s.top,bottom:s.bottom}});const heartBox=await page.locator('.ml-favorite').first().boundingBox();const iframeBox=await frameEl.boundingBox();const tagAbs={x:iframeBox.x+tag.x,y:iframeBox.y+tag.y,width:tag.width,height:tag.height};assert.ok(tagAbs.y>=heartBox.y+heartBox.height||tagAbs.x+tagAbs.width<=heartBox.x||tagAbs.x>=heartBox.x+heartBox.width);assert.ok(parseFloat(tag.bottom)>0); assert.ok(tag.y>tag.innerHeight/2);report.tag={...tag,overlapsHeart:false};
assert.equal(await page.locator('select').count(),0);
const groups=page.locator('.ml-filter-row');assert.equal(await groups.count(),3);
for(let i=0;i<3;i++){const group=groups.nth(i),button=group.locator('button').nth(1);await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');await button.click();assert.equal(await button.getAttribute('aria-pressed'),'false');assert.equal(await group.locator('button').first().getAttribute('aria-pressed'),'true')}
await groups.nth(0).locator('button').nth(1).click();await groups.nth(1).locator('button').nth(1).click();await page.locator('.ml-clear').click();for(let i=0;i<3;i++)assert.equal(await groups.nth(i).locator('button').first().getAttribute('aria-pressed'),'true');
report.checks.push('No select elements; all three groups toggle and clear correctly');
await page.setViewportSize({width:390,height:844});await page.goto(base);await page.waitForSelector('.ml-card');
const allGroups=[page.locator('.ml-component-chips'),...Array.from({length:3},(_,i)=>page.locator('.ml-filter-row').nth(i))];const expected=[catalog.comps.length+1,catalog.whens.length+1,Object.keys(catalog.uses).length+1,4];
for(let i=0;i<allGroups.length;i++){const group=allGroups[i];await group.scrollIntoViewIfNeeded();const bs=group.locator('button');assert.equal(await bs.count(),expected[i]);const metrics=await bs.evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {text:el.textContent,x:r.x,right:r.right,width:r.width,height:r.height,display:s.display,visibility:s.visibility}}));for(const m of metrics)assert.ok(m.x>=0&&m.right<=390&&m.width>0&&m.height>0&&m.display!=='none'&&m.visibility==='visible',JSON.stringify(m));report.mobileGroups.push({count:metrics.length,allChoicesVisible:true,labels:metrics.map(m=>m.text.trim())})}
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.checks.push('390px mobile: all categories/timing/use/tech buttons wrap within viewport, no horizontal overflow');
await page.setViewportSize({width:1440,height:1650});await page.goto(base);await page.waitForSelector('.ml-card');await page.locator('.ml-explorer').scrollIntoViewIfNeeded();await page.waitForTimeout(1000);await page.screenshot({path:'docs/ui-fixes-preview.png',fullPage:false});report.checks.push('Screenshot captured; user screenshot.png untouched');console.log(JSON.stringify(report,null,2));await writeFile('docs/ui-fixes-verification.json',JSON.stringify(report,null,2)+'\n');
}finally{await browser.close()}



