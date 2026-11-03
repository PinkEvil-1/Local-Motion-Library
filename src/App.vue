<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import catalogData from './data/catalog.json'
import MotionPreview from './components/MotionPreview.vue'
import type { MotionItem } from './types'

const catalog = catalogData as unknown as {
  comps: [string, string, string][]
  whens: [string, string][]
  uses: Record<string, string>
  items: MotionItem[]
  capturedAt: string
}
const source = 'https://kittenjam-motion-library.vercel.app/'
const query = ref('')
const component = ref('')
const timing = ref('')
const usage = ref('')
const technology = ref('')
const sort = ref('group')
const customText = ref('')
const favoritesOnly = ref(false)
const playing = ref(true)
const page = ref(1)
const pageSize = 24
const selected = ref<MotionItem | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const replay = ref(0)
const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined
const favoriteKey = 'motion-library:favorites:v1'
function readFavorites(): number[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(favoriteKey) || '[]')
    return Array.isArray(value) ? value.filter((id): id is number => typeof id === 'number') : []
  } catch { return [] }
}
const favorites = ref<number[]>(readFavorites())
const compLabel = (key: string) => catalog.comps.find(([id]) => id === key)?.[1] || key
const whenLabel = (key: string) => catalog.whens.find(([id]) => id === key)?.[1] || key
const accent = (key: string) => catalog.comps.find(([id]) => id === key)?.[2] || '#c8f03c'
const technologies = [...new Set(catalog.items.map(item => item.tech))].sort()
const capturedDate = computed(() => catalog.capturedAt ? catalog.capturedAt.slice(0, 10) : '本地快照')
const indexed = catalog.items.map(item => ({
  item,
  text: [item.zh, item.en, item.desc, item.prompt, item.tag, item.style, item.tech,
    compLabel(item.comp), ...item.when.map(whenLabel), ...item.uses.map(key => catalog.uses[key] || key)]
    .join(' ').normalize('NFKC').toLocaleLowerCase()
}))
const filtered = computed(() => {
  const terms = query.value.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
  const result = indexed.filter(({ item, text }) =>
    (!component.value || item.comp === component.value) &&
    (!timing.value || item.when.includes(timing.value)) &&
    (!usage.value || item.uses.includes(usage.value)) &&
    (!technology.value || item.tech === technology.value) &&
    (!favoritesOnly.value || favorites.value.includes(item.id)) &&
    terms.every(term => text.includes(term))
  ).map(({ item }) => item)
  const groupOrder = new Map(catalog.comps.map(([key], index) => [key, index]))
  return result.sort((a, b) => sort.value === 'latest'
    ? b.added.localeCompare(a.added) || b.id - a.id
    : (groupOrder.get(a.comp) ?? 99) - (groupOrder.get(b.comp) ?? 99) || a.id - b.id)
})
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const visible = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const hasFilters = computed(() => Boolean(query.value || component.value || timing.value || usage.value || technology.value || favoritesOnly.value))
watch([query, component, timing, usage, technology, sort, favoritesOnly], () => { page.value = 1 })
watch(() => filtered.value.length, () => { page.value = Math.min(page.value, pageCount.value) })
function flash(message: string) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 2800)
}
function toggleFavorite(id: number) {
  favorites.value = favorites.value.includes(id) ? favorites.value.filter(value => value !== id) : [...favorites.value, id]
  try { localStorage.setItem(favoriteKey, JSON.stringify(favorites.value)) }
  catch { flash('無法儲存收藏；這次開啟期間仍可使用。') }
}
function reset() {
  query.value = component.value = timing.value = usage.value = technology.value = ''
  favoritesOnly.value = false
}
async function openDetail(item: MotionItem) {
  selected.value = item
  replay.value++
  await nextTick()
  if (dialog.value && !dialog.value.open) dialog.value.showModal()
}
function closeDetail() {
  dialog.value?.close()
  selected.value = null
}
async function copyPrompt(item: MotionItem) {
  const text = `${item.zh}（${item.en}）\n${item.prompt}\n\n來源：Hannah / Motion Library\n${source}fx/${item.id}/`
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text)
    else {
      const field = document.createElement('textarea')
      field.value = text
      field.style.cssText = 'position:fixed;opacity:0;inset:0;pointer-events:none'
      ;(dialog.value?.open ? dialog.value : document.body).append(field)
      field.select()
      const copied = document.execCommand('copy')
      field.remove()
      if (!copied) throw new Error('Clipboard unavailable')
    }
    flash('已複製提示詞與來源')
  } catch {
    await openDetail(item)
    flash('無法自動複製，請選取詳情中的提示詞複製。')
  }
}
function exportCatalog() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `motion-library-${capturedDate.value}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  flash('已匯出完整收藏資料')
}
function turnPage(value: number) {
  page.value = Math.max(1, Math.min(pageCount.value, value))
  document.getElementById('ml-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="ml-app">
    <div class="ml-source-strip">
      <span><span class="ml-status-dot" aria-hidden="true"></span> 本地保存版</span>
      <span>原始收藏由 <strong>Hannah</strong> 整理</span>
      <a :href="source" target="_blank" rel="noopener noreferrer">前往原站 ↗</a>
    </div>
    <header class="ml-header">
      <a class="ml-brand" href="#"><span class="ml-brand-mark" aria-hidden="true">m<span>↗</span></span><span>MOTION LIBRARY<small>動態靈感，留在身邊。</small></span></a>
      <div class="ml-header-actions">
        <button class="ml-button ml-quiet" type="button" @click="exportCatalog">匯出資料 <span aria-hidden="true">↓</span></button>
        <button class="ml-button" :class="{ 'ml-active': favoritesOnly }" type="button" :aria-pressed="favoritesOnly" @click="favoritesOnly = !favoritesOnly">{{ favoritesOnly ? '♥' : '♡' }} 我的收藏 <span class="ml-count">{{ favorites.length }}</span></button>
      </div>
    </header>

    <main>
      <section class="ml-hero" aria-labelledby="ml-title">
        <div class="ml-hero-copy">
          <p class="ml-eyebrow"><span></span> YOUR LOCAL MOTION PLAYGROUND</p>
          <h1 id="ml-title">讓靈感<span class="ml-serif">動</span>起來<span class="ml-title-period">.</span></h1>
          <p class="ml-intro">探索、試玩，再帶進你的下一個作品。<br>動畫演示、分類標籤與 AI 提示詞，一起保存在本地。</p>
          <div class="ml-hero-stats"><strong>{{ catalog.items.length }}<span>個動態效果</span></strong><strong>{{ catalog.comps.length }}<span>種元件分類</span></strong><span class="ml-snapshot">資料快照<br><b>{{ capturedDate }}</b></span></div>
        </div>
        <div class="ml-hero-art" aria-hidden="true"><div class="ml-orbit ml-orbit-one"></div><div class="ml-orbit ml-orbit-two"></div><div class="ml-orbit ml-orbit-three"></div><div class="ml-art-core">↗</div><span class="ml-art-label ml-art-label-top">MOVE YOUR IDEAS</span><span class="ml-art-label ml-art-label-bottom">PLAY. EXPLORE. CREATE.</span><span class="ml-art-star">✳</span></div>
      </section>

      <section class="ml-explorer" aria-label="搜尋與篩選">
        <div class="ml-search-row">
          <label class="ml-search"><span aria-hidden="true">⌕</span><input v-model="query" type="search" placeholder="搜尋效果、關鍵字、描述或提示詞…" aria-label="搜尋效果、關鍵字、描述或提示詞"><kbd>/ EXPLORE</kbd></label>
          <label class="ml-custom-input"><span>預覽文字</span><input v-model="customText" maxlength="80" placeholder="試試你自己的文字" aria-label="自訂預覽文字"></label>
        </div>
        <div class="ml-component-chips" role="group" aria-label="依元件篩選">
          <button type="button" class="ml-chip" :class="{ 'ml-chip-selected': !component }" :aria-pressed="!component" @click="component = ''">全部效果 <span>{{ catalog.items.length }}</span></button>
          <button v-for="[key, label, color] in catalog.comps" :key="key" type="button" class="ml-chip" :class="{ 'ml-chip-selected': component === key }" :aria-pressed="component === key" @click="component = component === key ? '' : key"><i :style="{ background: color }"></i>{{ label }}</button>
        </div>
        <div class="ml-filter-rows">
          <div class="ml-filter-row" role="group" aria-label="依時機篩選">
            <span class="ml-filter-label">時機</span><div class="ml-filter-options">
              <button type="button" class="ml-chip" :class="{ 'ml-chip-selected': !timing }" :aria-pressed="!timing" @click="timing = ''">全部時機</button>
              <button v-for="[key, label] in catalog.whens" :key="key" type="button" class="ml-chip" :class="{ 'ml-chip-selected': timing === key }" :aria-pressed="timing === key" @click="timing = timing === key ? '' : key">{{ label }}</button>
            </div>
          </div>
          <div class="ml-filter-row" role="group" aria-label="依情境篩選">
            <span class="ml-filter-label">情境</span><div class="ml-filter-options">
              <button type="button" class="ml-chip" :class="{ 'ml-chip-selected': !usage }" :aria-pressed="!usage" @click="usage = ''">全部情境</button>
              <button v-for="(label, key) in catalog.uses" :key="key" type="button" class="ml-chip" :class="{ 'ml-chip-selected': usage === key }" :aria-pressed="usage === key" @click="usage = usage === key ? '' : key">{{ label }}</button>
            </div>
          </div>
          <div class="ml-filter-row" role="group" aria-label="依技術篩選">
            <span class="ml-filter-label">技術</span><div class="ml-filter-options">
              <button type="button" class="ml-chip" :class="{ 'ml-chip-selected': !technology }" :aria-pressed="!technology" @click="technology = ''">全部技術</button>
              <button v-for="tech in technologies" :key="tech" type="button" class="ml-chip" :class="{ 'ml-chip-selected': technology === tech }" :aria-pressed="technology === tech" @click="technology = technology === tech ? '' : tech">{{ tech }}</button>
            </div>
          </div>
        </div>
        <div class="ml-filter-actions">
          <button v-if="hasFilters" class="ml-clear" type="button" @click="reset">清除篩選 ×</button>
          <button class="ml-play-toggle" type="button" :aria-pressed="!playing" @click="playing = !playing">{{ playing ? 'Ⅱ 暫停預覽' : '▷ 播放預覽' }}</button>
        </div>
      </section>

      <section id="ml-results" class="ml-results" aria-labelledby="ml-results-heading">
        <div class="ml-results-bar"><div><h2 id="ml-results-heading">{{ favoritesOnly ? '我的收藏' : component ? compLabel(component) : '探索動態' }}</h2><span aria-live="polite">{{ filtered.length }} 個效果</span></div><div class="ml-sort" role="group" aria-label="排序方式"><span>排序</span><button type="button" class="ml-chip" :class="{ 'ml-chip-selected': sort === 'group' }" :aria-pressed="sort === 'group'" @click="sort = 'group'">依元件分類</button><button type="button" class="ml-chip" :class="{ 'ml-chip-selected': sort === 'latest' }" :aria-pressed="sort === 'latest'" @click="sort = 'latest'">最新收錄</button></div></div>
        <div v-if="visible.length" class="ml-grid">
          <article v-for="item in visible" :key="item.id" class="ml-card" :style="{ '--ml-accent': accent(item.comp) }">
            <div class="ml-card-preview"><MotionPreview :item="item" :text="customText" :playing="playing && !selected" /><span class="ml-tech-badge">{{ item.tech }}</span><button class="ml-favorite" type="button" :class="{ 'ml-favorited': favorites.includes(item.id) }" :aria-label="`${favorites.includes(item.id) ? '取消收藏' : '收藏'} ${item.zh}`" :aria-pressed="favorites.includes(item.id)" @click="toggleFavorite(item.id)"><svg class="ml-heart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.5 3.7 12.6a5.5 5.5 0 0 1 7.8-7.8l.5.5.5-.5a5.5 5.5 0 0 1 7.8 7.8Z" /></svg></button></div>
            <div class="ml-card-body"><div class="ml-card-title-row"><span class="ml-item-number">{{ String(item.id).padStart(3, '0') }}</span><button class="ml-item-title" type="button" @click="openDetail(item)">{{ item.zh }} <span aria-hidden="true">↗</span></button></div><p class="ml-item-english">{{ item.en }}</p><p class="ml-item-desc">{{ item.desc }}</p><div class="ml-tags"><button v-for="when in item.when" :key="when" type="button" @click="timing = when">{{ whenLabel(when) }}</button><button v-for="use in item.uses" :key="use" type="button" @click="usage = use">{{ catalog.uses[use] || use }}</button></div><div class="ml-card-actions"><button type="button" class="ml-prompt-button" @click="copyPrompt(item)"><span aria-hidden="true">▧</span> 複製 AI 提示詞</button><button type="button" class="ml-detail-button" :aria-label="`查看 ${item.zh} 詳情`" @click="openDetail(item)">試玩 <span aria-hidden="true">→</span></button></div></div>
          </article>
        </div>
        <div v-else class="ml-empty"><span aria-hidden="true">⌕</span><h3>還沒找到這個靈感</h3><p>試試其他關鍵字，或放寬篩選條件。</p><button class="ml-button" type="button" @click="reset">查看全部效果</button></div>
        <nav v-if="pageCount > 1" class="ml-pagination" aria-label="效果分頁"><button class="ml-button" type="button" :disabled="page === 1" @click="turnPage(page - 1)">← 上一頁</button><span>第 <strong>{{ page }}</strong> / {{ pageCount }} 頁</span><button class="ml-button" type="button" :disabled="page === pageCount" @click="turnPage(page + 1)">下一頁 →</button></nav>
      </section>
    </main>

    <footer class="ml-footer"><div><a class="ml-footer-brand" href="#">MOTION LIBRARY <span>↗</span></a><p>動態靈感的本地收藏室。</p></div><div class="ml-footer-credit"><p>原始收藏、名稱與描述由 <a href="https://hannahchao-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer">Hannah · UI/UX Designer ↗</a> 整理。</p><p>本地保存與介面重建，僅供個人參考學習。內容與相關權利歸原作者所有。</p><a :href="source" target="_blank" rel="noopener noreferrer">原始網站與完整來源 ↗</a></div></footer>

    <dialog ref="dialog" class="ml-dialog" aria-labelledby="ml-detail-title" @close="selected = null" @click="event => { if (event.target === dialog) closeDetail() }">
      <template v-if="selected"><div class="ml-dialog-header"><div><p class="ml-eyebrow">{{ compLabel(selected.comp) }} / {{ selected.tech }}</p><h2 id="ml-detail-title">{{ selected.zh }}</h2><p>{{ selected.en }}</p></div><button class="ml-close" type="button" aria-label="關閉效果詳情" @click="closeDetail">×</button></div><div class="ml-large-preview" :style="{ '--ml-accent': accent(selected.comp) }"><MotionPreview :key="`${selected.id}-${replay}`" :item="selected" :text="customText" /><button type="button" class="ml-replay" @click="replay++">↻ 重播</button></div><div class="ml-dialog-content"><p class="ml-detail-desc">{{ selected.desc }}</p><div class="ml-tags"><span v-for="when in selected.when" :key="when">{{ whenLabel(when) }}</span><span v-for="use in selected.uses" :key="use">{{ catalog.uses[use] || use }}</span><span v-if="selected.tag">{{ selected.tag }}</span></div><div class="ml-keyword-section"><h3>演示關鍵字</h3><p>{{ [selected.en, selected.style, selected.tag, selected.tech].filter(Boolean).join(' · ') }}</p></div><div class="ml-prompt-heading"><h3>AI 提示詞</h3><button class="ml-button ml-primary" type="button" @click="copyPrompt(selected)">複製提示詞 ↗</button></div><textarea class="ml-prompt-text" :value="selected.prompt" readonly aria-label="完整 AI 提示詞" rows="6"></textarea><div class="ml-detail-source"><span>原始內容：Hannah / Motion Library</span><a :href="`${source}fx/${selected.id}/`" target="_blank" rel="noopener noreferrer">查看原站此效果 ↗</a></div></div></template>
      <div v-if="notice" class="ml-dialog-notice" role="status" aria-live="polite">{{ notice }}</div>
    </dialog>
    <div class="ml-toast" :class="{ 'ml-toast-visible': notice }" role="status" aria-live="polite">{{ notice }}</div>
  </div>
</template>
