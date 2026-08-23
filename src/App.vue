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
    <div v-else class="table-page n64-page" id="n64Page">
      <div class="table-page-header">
        <a class="back-link" @click="switchMode(null)">← 返回主页</a>
        <div class="filler-field">
          <label class="filler-label" for="fillerInput">填表人：</label>
          <input
            id="fillerInput"
            v-model="fillerName"
            class="filler-input"
            type="text"
            placeholder="请填写您的署名"
            maxlength="20"
          />
        </div>
      </div>

      <div class="n64-layout">
        <!-- 诗文库主表 -->
        <div class="n64-col n64-col-main" id="n64MainCol">
          <div class="table-title-row">
            <div class="title-deco-bar"></div>
            <h2 class="table-page-title">诗文库主表</h2>
            <span class="table-hint">单击 → 选中 &nbsp;|&nbsp; 再次单击 → 取消</span>
            <span class="table-counter">{{ visiblePoems.length }} 首</span>
          </div>
          <div class="table-wrapper poem-library-wrapper" id="mainLibraryWrapper">
            <table class="poem-library-table" id="mainLibraryTable">
              <colgroup>
                <col style="width:58px" />
                <col />
              </colgroup>
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

        <!-- 64结果表 -->
        <div class="n64-col n64-col-result">
          <div class="table-title-row">
            <div class="title-deco-bar"></div>
            <h2 class="table-page-title">64结果表</h2>
            <span class="table-hint">单击 → 移除该项</span>
            <span class="table-counter">{{ result64.length }} / 64</span>
          </div>
          <div class="action-btn-row">
            <div class="action-btn-group">
              <button class="btn btn-png" @click="exportResultPNG">导出图片</button>
              <button class="btn btn-csv" @click="exportResultCSV">导出CSV</button>
              <button class="btn btn-upload" :disabled="uploadingResult" @click="onUploadResult">
                {{ uploadingResult ? '上传中...' : '上传CSV' }}
              </button>
            </div>
          </div>
          <div class="table-wrapper result-wrapper" id="resultWrapper">
            <table class="result-table" id="resultTable">
              <colgroup>
                <col v-for="n in 4" :key="'c'+n" />
              </colgroup>
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
            <span class="table-hint">单击 → 回到诗文表</span>
            <span class="table-counter">{{ eliminated.length }} 首</span>
          </div>
          <div class="action-btn-row">
            <div class="action-btn-group">
              <button class="btn btn-png" @click="exportElimPNG">导出图片</button>
              <button class="btn btn-csv" @click="exportElimCSV">导出CSV</button>
              <button class="btn btn-upload" :disabled="uploadingElim" @click="onUploadElim">
                {{ uploadingElim ? '上传中...' : '上传CSV' }}
              </button>
            </div>
          </div>
          <div class="table-wrapper elim-wrapper" id="elimWrapper">
            <table class="elim-table" id="elimTable" :class="{ 'elim-multi': elimMultiCol }">
              <colgroup v-if="elimMultiCol">
                <col v-for="n in elimColCount" :key="'ec'+n" />
              </colgroup>
              <colgroup v-else><col /></colgroup>
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

    <!-- 真人自证弹窗：首次点击任何上传按钮时弹出；内容写入CSV首行 -->
    <div v-if="showAuthModal" class="auth-mask" @click.self="cancelAuthModal">
      <div class="auth-box">
        <h3 class="auth-title">请证明你是人类</h3>
        <p class="auth-desc">
          为了防止人机刷票，请写一段关于「自己与苏轼」的话以证明您是人类，我们将根据您的自证决定是否采纳您提交的数据上榜。
          注意：若使用AI生成，一律不予采纳。
        </p>
        <textarea
          v-model="authText"
          class="auth-textarea"
          rows="6"
          placeholder="可以随意发挥，体裁不限，诗歌也可。不少于20字。"
          maxlength="1000"
        ></textarea>
        <div class="auth-footer">
          <span class="auth-count-tip" :class="{ ok: authText.trim().length >= 20 }">
            {{ authText.trim().length }} / 20
          </span>
          <button class="btn" @click="cancelAuthModal">取消</button>
          <button class="btn btn-upload" :disabled="authText.trim().length < 20" @click="confirmAuth">提交</button>
        </div>
      </div>
    </div>

    <!-- 通用提示弹窗（替换 alert）：UI 与自证弹窗一致 -->
    <div v-if="showMsgModal" class="auth-mask" @click.self="closeMsgModal">
      <div class="auth-box msg-box">
        <h3 class="auth-title">{{ msgTitle }}</h3>
        <p class="auth-desc">{{ msgDesc }}</p>
        <div class="auth-footer">
          <button class="btn btn-upload" @click="closeMsgModal">知道了</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import html2canvas from 'html2canvas';
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
      ignoreNextClickId: null,
      fillerName: '',
      uploadingResult: false,
      uploadingElim: false,
      showAuthModal: false,
      authText: '',
      pendingUploadKind: null,
      authCompleted: false,
      showMsgModal: false,
      msgTitle: '',
      msgDesc: '',
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
      return this.elimColCount >= 2;
    },
    elimColCount() {
      if (typeof window === 'undefined') return 1;
      const w = window.innerWidth;
      let avail;
      if (w < 900) avail = 0;                                 /* 手机端单列 */
      else if (w < 1400) avail = Math.min(1120, w - 160);    /* 两列下方：跨两栏总宽 ≈ w-两边160，上限 1120 */
      else if (w < 1800) avail = Math.max(220, (w - 220) * 0.7 / 2.9 - 16); /* 三列：淘汰表 0.7/2.9 占比 */
      else if (w < 2100) avail = Math.max(220, (w - 220) * 0.7 / 2.9 - 16); /* 1800~2100：单列表头/内容已经不换行 */
      else avail = Math.max(220, (w - 220) * 0.7 / 2.9 - 16);
      if (avail <= 0) return 1;
      const cols = Math.max(1, Math.floor((avail + 16) / 220));
      /* 封顶策略：1400~1799 强制1列（最左窄列）；1800+ 封顶 2 列 直到 2100+ 3列；两列模式封顶4列 */
      let cap;
      if (w < 900) cap = 1;
      else if (w < 1400) cap = 4;
      else if (w < 1800) cap = 1;
      else if (w < 2100) cap = 2;
      else cap = 3;
      return Math.min(cap, Math.max(1, cols));
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
    },

    // ===================== 通用提示弹窗 =====================
    showMsg(title, desc) {
      this.msgTitle = title || '提示';
      this.msgDesc = desc || '';
      this.showMsgModal = true;
    },
    closeMsgModal() {
      this.showMsgModal = false;
      this.msgTitle = '';
      this.msgDesc = '';
    },

    // ===================== 工具 =====================
    _formatDate() {
      const d = new Date();
      return d.getFullYear() +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') + '_' +
        String(d.getHours()).padStart(2, '0') +
        String(d.getMinutes()).padStart(2, '0');
    },
    _csvEscape(s) {
      if (s === null || s === undefined) return '""';
      const x = String(s);
      if (x.includes(',') || x.includes('"') || x.includes('\n') || x.includes('\r')) {
        return '"' + x.replace(/"/g, '""') + '"';
      }
      return x;
    },
    _getSafeFillerName() {
      const s = (this.fillerName || '').trim();
      return s || '未署名';
    },

    // ===================== CSV 构建 =====================
    // 64结果表：首行=自证语/填表人；次行=表头（序号1..N 或 1..64 列号分4组展示，这里用平铺64列）
    //   之后每行=数据（按顺序编号 title content）
    _buildResultCSV() {
      const firstLine = this.authText ? '【自证】' + this.authText :
        '【填表人】' + this._getSafeFillerName();
      const COL = 4;
      const N = Math.max(64, this.result64.length);
      const head = [];
      for (let i = 1; i <= N; i++) head.push('第' + i + '篇');
      const dataRows = [];
      const poemRows = Math.ceil(N / COL);
      for (let r = 1; r <= poemRows; r++) {
        const row = [];
        for (let c = 1; c <= COL; c++) {
          const idx = (r - 1) * COL + c - 1;
          const p = this.result64[idx];
          if (p) row.push((p.title || '') + ' ' + (p.content || ''));
          else row.push('');
        }
        dataRows.push(row);
      }
      const lines = [];
      lines.push([firstLine].concat(new Array(head.length - 1).fill('')).map(this._csvEscape).join(','));
      lines.push(head.map(this._csvEscape).join(','));
      // 填表人信息行（第3行放填报表相关信息）
      const infoRow = ['填表人：' + this._getSafeFillerName(), '数量：' + this.result64.length, '提交时间：' + new Date().toLocaleString()];
      while (infoRow.length < head.length) infoRow.push('');
      lines.push(infoRow.map(this._csvEscape).join(','));
      for (const r of dataRows) {
        while (r.length < head.length) r.push('');
        lines.push(r.map(this._csvEscape).join(','));
      }
      return '\uFEFF' + lines.join('\r\n');
    },

    // 淘汰表：首行=自证/填表人；次行=表头（按多列或单列表头）；后续=数据
    _buildElimCSV() {
      const firstLine = this.authText ? '【自证】' + this.authText :
        '【填表人】' + this._getSafeFillerName();
      const cols = this.elimMultiCol ? this.elimColCount : 1;
      const N = this.eliminated.length;
      const head = cols === 1 ? ['已淘汰（单击可复位）'] :
        Array.from({ length: cols }, (_, i) => '第' + (i + 1) + '组');
      const totalCol = head.length;
      const poemRows = Math.ceil(N / Math.max(1, totalCol));
      const rows = [];
      for (let r = 0; r < poemRows; r++) {
        const row = [];
        for (let c = 0; c < totalCol; c++) {
          const p = this.eliminated[r * totalCol + c];
          row.push(p ? (p.title + ' ' + p.content) : '');
        }
        rows.push(row);
      }
      const lines = [];
      lines.push([firstLine].concat(new Array(totalCol - 1).fill('')).map(this._csvEscape).join(','));
      lines.push(head.map(this._csvEscape).join(','));
      const infoRow = ['填表人：' + this._getSafeFillerName(), '数量：' + N, '提交时间：' + new Date().toLocaleString()];
      while (infoRow.length < totalCol) infoRow.push('');
      lines.push(infoRow.map(this._csvEscape).join(','));
      for (const r of rows) lines.push(r.map(this._csvEscape).join(','));
      return '\uFEFF' + lines.join('\r\n');
    },

    // ===================== 下载CSV =====================
    _downloadCSV(csvStr, suffix) {
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const name = this._getSafeFillerName() + '_苏轼N选64_' + suffix + '_' + this._formatDate() + '.csv';
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    },
    exportResultCSV() {
      this._downloadCSV(this._buildResultCSV(), '64结果表');
    },
    exportElimCSV() {
      this._downloadCSV(this._buildElimCSV(), '淘汰表');
    },

    // ===================== 导出PNG（参考sushishicijingxuan：标题+副栏+表格克隆） =====================
    async _exportPNGCommon({ wrapperId, tableId, title, subLeft, subMid, mode }) {
      const wrapper = document.getElementById(wrapperId);
      if (!wrapper) { this.showMsg('提示', '未找到表格容器'); return; }
      const safeName = this._getSafeFillerName();
      const prevOverflow = wrapper.style.overflow;
      const prevMaxH = wrapper.style.maxHeight;
      const prevH = wrapper.style.height;
      wrapper.style.overflow = 'visible';
      wrapper.style.maxHeight = 'none';
      wrapper.style.height = 'auto';
      await this.$nextTick();
      await new Promise(r => setTimeout(r, 100));

      const fontStack = '"Noto Serif SC", "Songti SC", "SimSun", "STSong", serif';
      const wrapperRect = wrapper.getBoundingClientRect();
      const exportWidth = Math.ceil(wrapperRect.width) + 32; // + 左右 16 padding

      const cont = document.createElement('div');
      cont.style.position = 'absolute';
      cont.style.left = '-99999px';
      cont.style.top = '0';
      cont.style.background = '#f5f3ef';
      cont.style.padding = '16px';
      cont.style.width = exportWidth + 'px';
      cont.style.boxSizing = 'border-box';
      cont.style.fontFamily = fontStack;
      cont.style.color = '#2c3e2c';
      cont.style.zIndex = '1';
      cont.setAttribute('data-export-wrap', '1');

      const tDiv = document.createElement('div');
      tDiv.style.textAlign = 'center';
      tDiv.style.color = '#2c3e2c';
      tDiv.style.fontSize = '26px';
      tDiv.style.fontWeight = '700';
      tDiv.style.letterSpacing = '4px';
      tDiv.style.padding = '16px 10px 8px';
      tDiv.style.borderBottom = '1px solid #b8cdb8';
      tDiv.style.background = '#faf9f6';
      tDiv.style.fontFamily = fontStack;
      tDiv.style.width = '100%';
      tDiv.style.boxSizing = 'border-box';
      tDiv.textContent = title || '最喜欢的苏轼诗文top64';
      cont.appendChild(tDiv);

      const sDiv = document.createElement('div');
      sDiv.style.display = 'flex';
      sDiv.style.justifyContent = 'space-between';
      sDiv.style.alignItems = 'center';
      sDiv.style.color = '#6b866b';
      sDiv.style.padding = '6px 10px';
      sDiv.style.fontWeight = '400';
      sDiv.style.background = '#faf9f6';
      sDiv.style.borderBottom = '1px solid #b8cdb8';
      sDiv.style.fontSize = '14px';
      sDiv.style.fontFamily = fontStack;
      sDiv.style.width = '100%';
      sDiv.style.boxSizing = 'border-box';
      sDiv.style.gap = '12px';
      sDiv.style.flexWrap = 'nowrap';
      const left = document.createElement('span');
      left.style.textAlign = 'left'; left.style.flex = '1 1 auto'; left.style.minWidth = '0';
      left.textContent = subLeft || '网站制作：蟋蟀 诗文筛汇：嫻菜无敌 蟋蟀';
      sDiv.appendChild(left);
      const mid = document.createElement('span');
      mid.style.textAlign = 'center'; mid.style.flex = '1 1 auto'; mid.style.fontSize = '11px'; mid.style.minWidth = '0';
      mid.textContent = subMid || '欢迎关注公众号「东坡墙」QQ「3301590656」';
      sDiv.appendChild(mid);
      const right = document.createElement('span');
      right.style.textAlign = 'right'; right.style.flex = '1 1 auto'; right.style.minWidth = '0';
      right.textContent = '填表人：' + safeName;
      sDiv.appendChild(right);
      cont.appendChild(sDiv);

      const wrapperClone = wrapper.cloneNode(true);
      wrapperClone.style.overflow = 'visible';
      wrapperClone.style.maxHeight = 'none';
      wrapperClone.style.height = 'auto';
      wrapperClone.style.position = 'static';
      wrapperClone.style.transform = 'none';
      wrapperClone.style.width = '100%';
      wrapperClone.style.margin = '0';
      // 清掉克隆体里 th 的 sticky，避免被绘制成错位
      wrapperClone.querySelectorAll('th').forEach(th => {
        th.style.position = 'static';
        th.style.borderRadius = '0';
      });
      // 诗文库中 absolute expand-btn 的尺寸也要正确：absolute 填充需要单元格有定位
      wrapperClone.querySelectorAll('.expand-cell').forEach(td => {
        if (getComputedStyle(td).position === 'static') td.style.position = 'relative';
      });
      cont.appendChild(wrapperClone);

      document.body.appendChild(cont);
      await this.$nextTick();
      await new Promise(r => setTimeout(r, 150));

      try {
        const targetH = cont.scrollHeight;
        const targetW = cont.scrollWidth;
        const canvas = await html2canvas(cont, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: targetW,
          height: targetH,
          windowWidth: targetW + 40,
          windowHeight: targetH + 40,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
        });
        if (!canvas || !canvas.width) throw new Error('画布生成失败（空）');
        // 改 toDataURL（兼容性好 + 同步下载）
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = this._getSafeFillerName() + '_苏轼N选64_' + mode + '_' + this._formatDate() + '.png';
        document.body.appendChild(link);
        link.click();
        // 立即移除节点 + 释放 data URL（虽然 data URL 可不用 revoke，但部分浏览器占内存）
        setTimeout(() => {
          if (link.parentNode) link.parentNode.removeChild(link);
          if (typeof URL.revokeObjectURL === 'function') {
            try { URL.revokeObjectURL(dataUrl); } catch (e) { /* ignore */ }
          }
        }, 500);
      } catch (err) {
        console.error(err);
        this.showMsg('导出图片失败', err && err.message ? err.message : String(err));
      } finally {
        if (cont && cont.parentNode) cont.parentNode.removeChild(cont);
        wrapper.style.overflow = prevOverflow;
        wrapper.style.maxHeight = prevMaxH;
        wrapper.style.height = prevH;
      }
    },
    exportResultPNG() {
      this._exportPNGCommon({
        wrapperId: 'resultWrapper',
        tableId: 'resultTable',
        title: '最喜欢的苏轼诗文top64',
        subLeft: '网站制作：蟋蟀 诗文筛汇：嫻菜无敌 蟋蟀',
        subMid: '欢迎关注公众号「东坡墙」QQ「3301590656」',
        mode: '结果表'
      });
    },
    exportElimPNG() {
      this._exportPNGCommon({
        wrapperId: 'elimWrapper',
        tableId: 'elimTable',
        title: '最喜欢的苏轼诗文top64',
        subLeft: '网站制作：蟋蟀 诗文筛汇：嫻菜无敌 蟋蟀',
        subMid: '欢迎关注公众号「东坡墙」QQ「3301590656」',
        mode: '淘汰表'
      });
    },

    // ===================== 自证弹窗 + 上传 =====================
    cancelAuthModal() {
      this.showAuthModal = false;
      this.authText = '';
      this.pendingUploadKind = null;
    },
    confirmAuth() {
      if (!this.authText.trim()) return;
      this.authCompleted = true;
      this.showAuthModal = false;
      const kind = this.pendingUploadKind;
      this.pendingUploadKind = null;
      if (kind === 'result') this._doUploadResult();
      else if (kind === 'elim') this._doUploadElim();
    },
    // 首次点击上传 -> 弹自证；自证完成后再次直接上传
    _requireAuthOrProceed(kind) {
      if (this.authCompleted) return true;
      this.pendingUploadKind = kind;
      this.authText = '';
      this.showAuthModal = true;
      return false;
    },
    onUploadResult() {
      if (!(this.fillerName || '').trim()) {
        this.showMsg('需填写填表人', '请先在页面顶部填写填表人后再进行上传。');
        return;
      }
      if (this.result64.length !== 64) {
        this.showMsg('为排行榜公平性考虑', '只接受诗文数量为64篇的数据，请将 64结果表 调整为正好 64 篇后再上传。');
        return;
      }
      if (!this._requireAuthOrProceed('result')) return;
      this._doUploadResult();
    },
    onUploadElim() {
      if (!(this.fillerName || '').trim()) {
        this.showMsg('需填写填表人', '请先在页面顶部填写填表人后再进行上传。');
        return;
      }
      if (this.eliminated.length === 0) {
        this.showMsg('淘汰表为空', '淘汰表中没有任何诗文，无法上传。');
        return;
      }
      if (!this._requireAuthOrProceed('elim')) return;
      this._doUploadElim();
    },
    async _uploadBlob(blob, fileName, folder) {
      const url = '/api/upload?fileName=' + encodeURIComponent(fileName) +
        '&folder=' + encodeURIComponent(folder);
      const r = await fetch(url);
      if (!r.ok) throw new Error('获取上传地址失败(' + r.status + ')');
      const { signedUrl } = await r.json();
      if (!signedUrl) throw new Error('未获取到上传地址');
      const put = await fetch(signedUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'text/csv;charset=utf-8' }
      });
      if (!put.ok) throw new Error('上传失败(' + put.status + '): ' + put.statusText);
    },
    async _doUploadResult() {
      if (this.uploadingResult) return;
      this.uploadingResult = true;
      try {
        const csv = this._buildResultCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const name = this._getSafeFillerName() + '_苏轼N选64_64结果表_' + this._formatDate() + '.csv';
        await this._uploadBlob(blob, name, 'shiwen-nxuan64');
        this.showMsg('上传成功', '64结果表上传成功，感谢您的投稿！');
      } catch (err) {
        console.error(err);
        this.showMsg('上传失败', err && err.message ? err.message : String(err));
      } finally {
        this.uploadingResult = false;
      }
    },
    async _doUploadElim() {
      if (this.uploadingElim) return;
      this.uploadingElim = true;
      try {
        const csv = this._buildElimCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const name = this._getSafeFillerName() + '_苏轼N选64_淘汰表_' + this._formatDate() + '.csv';
        await this._uploadBlob(blob, name, 'shiwen-eliminated');
        this.showMsg('上传成功', '淘汰表上传成功，感谢您的投稿！');
      } catch (err) {
        console.error(err);
        this.showMsg('上传失败', err && err.message ? err.message : String(err));
      } finally {
        this.uploadingElim = false;
      }
    },
  }
};
</script>
