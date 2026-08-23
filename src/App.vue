<template>
  <div id="app-root">
    <!-- 主页 -->
    <div v-if="!mode" class="homepage">
      <div class="home-header">
        <div class="home-title-row">
          <span class="title-line"></span>
          <h1 class="home-title">苏轼诗文N选64</h1>
          <span class="title-line"></span>
        </div>
        <p class="home-subtitle">— 填表游戏 —</p>
      </div>

      <div class="author-note-wrapper">
        <div class="author-note-bar"></div>
        <div class="author-note-box"></div>
      </div>

      <div class="entry-cards">
        <div class="entry-card" @click="switchMode('64')">
          <div class="card-deco-bar"></div>
          <div class="card-body">
            <div class="card-title">苏轼诗文</div>
            <div class="card-subtitle">N选64</div>
          </div>
        </div>
      </div>

      <div class="random-poem">
        <div>「{{ randomPoemContent }}」</div>
        <div class="random-poem-title">{{ randomPoemTitle }}</div>
      </div>
    </div>

    <!-- 苏轼诗文N选64 界面 -->
    <div v-else class="table-page n64-page">
      <div class="table-page-header">
        <a class="back-link" @click="switchMode(null)">← 返回主页</a>
      </div>

      <div class="n64-layout">
        <!-- 诗文库主表 单列 高1500px区域 -->
        <div class="n64-col n64-col-main">
          <div class="table-title-row">
            <div class="title-deco-bar"></div>
            <h2 class="table-page-title">诗文库主表</h2>
            <p class="hint">单击 → 选入结果表 / 再次单击取消 &nbsp;|&nbsp; 左滑 → 淘汰</p>
          </div>
          <div class="table-wrapper poem-library-wrapper">
            <table class="poem-library-table">
              <colgroup>
                <col style="width:64px" />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th>&nbsp;</th>
                  <th>诗文及内容（共 {{ visiblePoems.length }} 首）</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="p in visiblePoems" :key="'grp-'+p.id">
                  <tr
                    :class="['poem-row', { selected: isSelected(p.id), 'swiping': p.swiping }]"
                    @click.stop="toggleSelect(p)"
                    @touchstart="onTouchStart(p, $event)"
                    @touchmove="onTouchMove(p, $event)"
                    @touchend="onTouchEnd(p, $event)"
                    @mousedown="onMouseDown(p, $event)"
                  >
                    <td class="expand-cell" @click.stop>
                      <button class="expand-btn" @click.stop="toggleExpand(p)">
                        {{ expandedId === p.id ? '收起' : '全文' }}
                      </button>
                    </td>
                    <td :class="['poem-cell', { selected: isSelected(p.id) }]">
                      <div class="poem-inner" :style="getSwipeStyle(p)">
                        <div class="poem-text">
                          <span class="poem-title">{{ p.title }}</span>
                          <span class="poem-content">{{ p.content }}</span>
                        </div>
                        <div class="swipe-action" @click.stop="eliminate(p)">淘汰</div>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="expandedId === p.id" :key="'ex-'+p.id" class="expand-row">
                    <td class="expand-empty"></td>
                    <td class="expand-body">
                      <div class="expand-body-inner">
                        <strong class="expand-title">{{ p.title }}</strong>
                        <pre class="expand-content">{{ p.fullText || (p.title + '\n' + p.content) }}</pre>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 64结果表 4列（行数自适应，超64自动加行） -->
        <div class="n64-col n64-col-result">
          <div class="table-title-row">
            <div class="title-deco-bar"></div>
            <h2 class="table-page-title">64结果表</h2>
            <span class="n64-counter">{{ result64.length }} / 64</span>
          </div>
          <div class="table-wrapper result-wrapper">
            <table class="result-table">
              <colgroup>
                <col v-for="n in 4" :key="'c'+n" />
              </colgroup>
              <thead>
                <tr>
                  <th v-for="n in 4" :key="'th'+n">结果{{ n }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in resultRows" :key="'r'+r">
                  <td
                    v-for="c in 4"
                    :key="'td'+r+'-'+c"
                    :class="['result-cell', { empty: !getResultCell(r, c) }]"
                    @click="removeFromResult(r, c)"
                  >
                    <template v-if="getResultCell(r, c)">
                      <span class="poem-title">{{ getResultCell(r, c).title }}</span>
                      <span class="poem-content">{{ getResultCell(r, c).content }}</span>
                    </template>
                    <span v-else class="result-idx">{{ (r - 1) * 4 + c }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 淘汰表 -->
        <div class="n64-col n64-col-elim">
          <div class="table-title-row">
            <div class="title-deco-bar"></div>
            <h2 class="table-page-title">淘汰表</h2>
            <span class="n64-counter">{{ eliminated.length }} 首</span>
          </div>
          <div class="table-wrapper elim-wrapper">
            <table class="elim-table" :class="{ 'elim-multi': elimMultiCol }">
              <colgroup v-if="elimMultiCol">
                <col v-for="n in elimColCount" :key="'ec'+n" />
              </colgroup>
              <colgroup v-else><col /></colgroup>
              <thead>
                <tr>
                  <th :colspan="elimMultiCol ? elimColCount : 1">
                    已淘汰（单击 → 回到诗文表）
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-if="elimMultiCol">
                  <tr v-for="(row, ri) in elimGrid" :key="'er'+ri">
                    <td
                      v-for="(cell, ci) in row"
                      :key="'ec'+ri+'-'+ci"
                      :class="['elim-cell', { empty: !cell }]"
                      @click="cell && restore(cell)"
                    >
                      <template v-if="cell">
                        <span class="poem-title">{{ cell.title }}</span>
                        <span class="poem-content">{{ cell.content }}</span>
                      </template>
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr v-for="p in eliminated" :key="'e'+p.id">
                    <td class="elim-cell" @click="restore(p)">
                      <span class="poem-title">{{ p.title }}</span>
                      <span class="poem-content">{{ p.content }}</span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import poemSource from '../苏轼诗文精选.txt?raw';
import csvSource from '../苏轼诗文精选.csv?raw';

function parsePoemsFromTxt(text) {
  const lines = (text || '').split(/\r?\n/);
  const list = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    let t = (lines[i] || '').trim();
    let c = (lines[i + 1] || '').trim();
    t = t.replace(/^"/, '').replace(/"$/, '');
    c = c.replace(/^\?/, '').replace(/"$/, '');
    if (t) list.push({ title: t, content: c });
  }
  return list;
}

function parseCSV(text) {
  let s = text || '';
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  const rows = [];
  let cur = '';
  let inQ = false;
  const items = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQ) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { items.push(cur); cur = ''; }
      else if (ch === '\r' || ch === '\n') {
        items.push(cur); cur = '';
        if (ch === '\r' && s[i + 1] === '\n') i++;
        rows.push(items.slice());
        items.length = 0;
      } else {
        cur += ch;
      }
    }
  }
  if (cur !== '' || items.length > 0) {
    items.push(cur);
    rows.push(items.slice());
  }
  return rows;
}

function parsePoemsFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const startIdx = (rows[0][0] || '').includes('诗文及内容') ? 1 : 0;
  const list = [];
  for (let i = startIdx; i < rows.length; i++) {
    const cell0 = rows[i][0] || '';
    const cell1 = rows[i][1] || '';
    if (!cell0.trim() && !cell1.trim()) continue;
    const nl = cell0.indexOf('\n');
    let title, content;
    if (nl >= 0) {
      title = cell0.slice(0, nl).trim();
      content = cell0.slice(nl + 1).trim();
    } else {
      title = cell0.trim();
      content = '';
    }
    const fullText = cell1.trim() ? cell1.trim() : (title + '\n' + content).trim();
    list.push({ title, content, fullText });
  }
  return list;
}

const HASH_TO_MODE = { '#/nxuan64': '64' };

export default {
  name: 'App',
  data() {
    return {
      mode: null,
      randomPoemContent: '',
      randomPoemTitle: '',
      allPoems: [],
      eliminatedIds: [],
      selectedIdsOrder: [],
      expandedId: null,
      swipeStartX: {},
      swipeStartY: {},
      swipeActive: {},
      swipeDx: {},
      isMouseDown: false,
      mouseTarget: null,
      mouseStartX: 0,
      mouseMoved: false,
      ignoreNextClickId: null
    };
  },
  computed: {
    visiblePoems() {
      const elim = new Set(this.eliminatedIds);
      return this.allPoems.filter(p => !elim.has(p.id));
    },
    eliminated() {
      const set = new Set(this.eliminatedIds);
      return this.allPoems.filter(p => set.has(p.id));
    },
    result64() {
      return this.selectedIdsOrder
        .map(id => this.allPoems.find(p => p.id === id))
        .filter(Boolean);
    },
    resultRows() {
      const needed = Math.ceil(Math.max(1, this.selectedIdsOrder.length) / 4);
      return Math.max(16, needed);
    },
    elimMultiCol() {
      if (typeof window === 'undefined') return false;
      const w = window.innerWidth;
      return w >= 900 && w < 1400;
    },
    elimColCount() {
      return 4;
    },
    elimGrid() {
      const cols = this.elimColCount;
      const list = this.eliminated;
      const len = Math.max(1, list.length);
      const rows = Math.ceil(len / cols);
      const grid = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push(list[r * cols + c] || null);
        }
        grid.push(row);
      }
      return grid;
    }
  },
  mounted() {
    this.initPoems();
    this.mode = this.hashToMode();
    window.addEventListener('hashchange', this.handleHashChange);
    window.addEventListener('resize', this.forceRerender);
    this.refreshRandomPoem();
  },
  beforeDestroy() {
    window.removeEventListener('hashchange', this.handleHashChange);
    window.removeEventListener('resize', this.forceRerender);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  },
  methods: {
    initPoems() {
      let list = parsePoemsFromCSV(csvSource);
      if (list.length === 0) list = parsePoemsFromTxt(poemSource);
      this.allPoems = list.map((p, i) => ({
        id: 'p' + i,
        title: p.title,
        content: p.content,
        fullText: p.fullText,
        swiping: false
      }));
    },
    forceRerender() { this.$forceUpdate(); },
    hashToMode() { return HASH_TO_MODE[window.location.hash] || null; },
    handleHashChange() { this.mode = this.hashToMode(); },
    refreshRandomPoem() {
      const poems = parsePoemsFromTxt(poemSource);
      if (poems.length > 0) {
        const p = poems[Math.floor(Math.random() * poems.length)];
        this.randomPoemContent = p.content || '';
        this.randomPoemTitle = p.title || '';
      }
    },
    switchMode(m) {
      window.location.hash = m === '64' ? '/nxuan64' : '/';
    },

    isSelected(id) { return this.selectedIdsOrder.indexOf(id) !== -1; },

    toggleExpand(p) {
      if (this.expandedId === p.id) this.expandedId = null;
      else this.expandedId = p.id;
    },

    toggleSelect(p) {
      if (this.eliminatedIds.indexOf(p.id) !== -1) return;
      if (this.ignoreNextClickId === p.id) {
        this.ignoreNextClickId = null;
        return;
      }
      if (this.isSelected(p.id)) {
        const idx = this.selectedIdsOrder.indexOf(p.id);
        if (idx !== -1) this.selectedIdsOrder.splice(idx, 1);
      } else {
        this.$set(this.selectedIdsOrder, this.selectedIdsOrder.length, p.id);
      }
    },

    getResultCell(r, c) {
      const idx = (r - 1) * 4 + (c - 1);
      return this.result64[idx] || null;
    },
    removeFromResult(r, c) {
      const idx = (r - 1) * 4 + (c - 1);
      if (idx >= this.selectedIdsOrder.length) return;
      this.selectedIdsOrder.splice(idx, 1);
    },

    onTouchStart(p, e) {
      if (!e.touches || e.touches.length === 0) return;
      this.swipeStartX[p.id] = e.touches[0].clientX;
      this.swipeStartY[p.id] = e.touches[0].clientY;
      this.swipeDx[p.id] = 0;
      this.swipeActive[p.id] = true;
      this.ignoreNextClickId = null;
    },
    onTouchMove(p, e) {
      if (!this.swipeActive[p.id]) return;
      if (!e.touches || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - this.swipeStartX[p.id];
      const dy = e.touches[0].clientY - this.swipeStartY[p.id];
      if (Math.abs(dx) < Math.abs(dy)) return;
      this.swipeDx[p.id] = Math.min(0, Math.max(-100, dx));
      e.preventDefault();
    },
    onTouchEnd(p) {
      if (!this.swipeActive[p.id]) return;
      const dx = this.swipeDx[p.id] || 0;
      if (dx < -60) {
        this.swipeDx[p.id] = -80;
        this.$set(p, 'swiping', true);
        this.ignoreNextClickId = p.id;
      } else {
        this.swipeDx[p.id] = 0;
        this.$set(p, 'swiping', false);
      }
      this.swipeActive[p.id] = false;
    },
    onMouseDown(p, e) {
      if (e.button !== 0) return;
      this.isMouseDown = true;
      this.mouseTarget = p;
      this.mouseStartX = e.clientX;
      this.mouseMoved = false;
      this.swipeStartX[p.id] = e.clientX;
      this.swipeDx[p.id] = 0;
      this.swipeActive[p.id] = true;
      this.ignoreNextClickId = null;
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
    },
    onMouseMove(e) {
      const p = this.mouseTarget;
      if (!this.isMouseDown || !p) return;
      const dx = e.clientX - this.swipeStartX[p.id];
      if (Math.abs(dx) > 5) this.mouseMoved = true;
      this.swipeDx[p.id] = Math.min(0, Math.max(-100, dx));
    },
    onMouseUp() {
      const p = this.mouseTarget;
      if (!p) {
        this.isMouseDown = false;
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        return;
      }
      const dx = this.swipeDx[p.id] || 0;
      if (dx < -60) {
        this.swipeDx[p.id] = -80;
        this.$set(p, 'swiping', true);
        this.ignoreNextClickId = p.id;
      } else {
        this.swipeDx[p.id] = 0;
        this.$set(p, 'swiping', false);
      }
      this.swipeActive[p.id] = false;
      this.isMouseDown = false;
      this.mouseTarget = null;
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('mouseup', this.onMouseUp);
    },
    getSwipeStyle(p) {
      const dx = this.swipeDx[p.id] || 0;
      return { transform: 'translateX(' + dx + 'px)' };
    },

    eliminate(p) {
      const idx = this.selectedIdsOrder.indexOf(p.id);
      if (idx !== -1) this.selectedIdsOrder.splice(idx, 1);
      if (this.eliminatedIds.indexOf(p.id) === -1) {
        this.$set(this.eliminatedIds, this.eliminatedIds.length, p.id);
      }
      if (this.expandedId === p.id) this.expandedId = null;
      this.swipeDx[p.id] = 0;
      this.$set(p, 'swiping', false);
    },

    restore(p) {
      const i = this.eliminatedIds.indexOf(p.id);
      if (i !== -1) this.eliminatedIds.splice(i, 1);
      this.swipeDx[p.id] = 0;
      this.$set(p, 'swiping', false);
    }
  }
};
</script>
