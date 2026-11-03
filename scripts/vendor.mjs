import { copyFile, mkdir, writeFile } from 'node:fs/promises';
const names=['gsap','SplitText','ScrambleTextPlugin','TextPlugin','CustomEase','CustomBounce','DrawSVGPlugin','MorphSVGPlugin','MotionPathPlugin','Flip','ScrollTrigger','Draggable','InertiaPlugin','Physics2DPlugin','Observer'];
await mkdir('public/runtime/vendor',{recursive:true});
for(const name of names) await copyFile('node_modules/gsap/dist/'+name+'.min.js','public/runtime/vendor/'+name+'.min.js');
await copyFile('node_modules/gsap/README.md','public/runtime/vendor/GSAP-README.md');
await writeFile('public/runtime/vendor/GSAP-LICENSE.txt',"GSAP 3.13.0 ? Copyright GreenSock. Standard no-charge license: https://gsap.com/standard-license. See distribution headers and GSAP-README.md.\n");
console.log('Vendored GSAP 3.13.0 and 14 plugins locally.');
