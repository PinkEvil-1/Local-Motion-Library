<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import type { MotionItem } from '../types';
import catalog from '../data/catalog.json';
const props=withDefaults(defineProps<{item:MotionItem;text?:string;playing?:boolean}>(),{text:'',playing:true});
const host=ref<HTMLElement>();const frame=ref<HTMLIFrameElement>();const visible=ref(false);const ready=ref(false);const error=ref('');let observer:IntersectionObserver|undefined;
const color=computed(()=>catalog.comps.find(c=>c[0]===props.item.comp)?.[2]??'#c8f03c');
function send(){if(!ready.value)return;frame.value?.contentWindow?.postMessage({type:'motion-render',item:JSON.parse(JSON.stringify(props.item)),text:props.text,color:color.value,playing:props.playing},'*');}
function message(e:MessageEvent){if(e.source!==frame.value?.contentWindow)return;if(e.data?.type==='motion-ready'){ready.value=true;send()}if(e.data?.type==='motion-status')error.value=e.data.ok?'':e.data.error;if(e.data?.type==='motion-error')error.value=e.data.error;}
watch(()=>[props.item.id,props.text,props.playing],send);watch(visible,()=>{ready.value=false;error.value=''});
onMounted(()=>{window.addEventListener('message',message);observer=new IntersectionObserver(entries=>{visible.value=entries[0]?.isIntersecting??false},{rootMargin:'120px'});if(host.value)observer.observe(host.value)});
onBeforeUnmount(()=>{observer?.disconnect();window.removeEventListener('message',message)});
</script>
<template><div ref="host" class="motion-preview" :style="{'--preview-color':color}"><iframe v-if="visible && playing" ref="frame" src="/runtime/demo.html" :title="item.zh+' 動畫演示'" sandbox="allow-scripts" loading="lazy" referrerpolicy="no-referrer"></iframe><div v-else class="preview-sleep">{{ playing?'移入畫面即可播放':'演示已暫停' }}</div><div v-if="error" class="preview-error" role="status">{{ error }}</div></div></template>
<style scoped>.motion-preview{width:100%;aspect-ratio:16/9;background:#15161a;border-radius:12px;overflow:hidden;position:relative}iframe{display:block;border:0;width:100%;height:100%}.preview-sleep{display:grid;place-items:center;height:100%;color:#85877d;font-size:12px}.preview-error{position:absolute;inset:auto 8px 8px;background:#3d2020;color:#ffc0af;padding:8px;border-radius:6px;font-size:12px}</style>
