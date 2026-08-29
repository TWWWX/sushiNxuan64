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
        <div class="entry-card" @click="switchMode('rank')">
          <div class="card-deco-bar"></div>
          <div class="card-body">
            <div class="card-title">排行榜</div>
            <div class="card-subtitle">截至26.8.29</div>
          </div>
        </div>
      </div>

      <div class="random-poem">
        <div>「{{ randomPoemContent }}」</div>
        <div class="random-poem-title">{{ randomPoemTitle }}</div>
      </div>
    </div>

    <!-- 苏轼诗文N选64 界面 -->
    <div v-else-if="mode === '64'" class="table-page n64-page" id="n64Page">
      <div class="table-page-header">
        <a class="back-link" @click="switchMode(null)">← 返回主页</a>
        <div class="filler-field">
          <label class="filler-label" for="fillerInput">填表人：</label>
          <input
            id="fillerInput"
            v-model="fillerName"
            class="filler-input"
            type="text"
            placeholder=""
            maxlength="20"
          />
        </div>
      </div>

      <div class="n64-layout">
        <!-- 苏轼经典诗文一览 -->
        <div class="n64-col n64-col-main" id="n64MainCol">
          <div class="table-title-row">
            <div class="title-deco-bar"></div>
            <h2 class="table-page-title">苏轼经典诗文一览</h2>
            <span class="table-hint">单击 → 选中 / 取消</span>
            <span class="table-counter">{{ visiblePoems.length }} 首</span>
          </div>
          <div class="table-wrapper poem-library-wrapper" id="mainLibraryWrapper">
            <table class="poem-library-table" id="mainLibraryTable">
              <colgroup>
                <col />
              </colgroup>
              <tbody>
                <template v-for="p in visiblePoems" :key="'grp-'+p.id">
                  <tr
                    :class="['poem-row', { selected: isSelected(p.id) }]"
                    @click.stop="toggleSelect(p)"
                  >
                    <td :class="['poem-cell', { selected: isSelected(p.id) }]">
                      <div class="poem-combo">
                        <button class="expand-btn inline-expand-btn" @click.stop="toggleExpand(p)">
                          {{ expandedId === p.id ? '收起' : '全文' }}
                        </button>
                        <div class="poem-text">
                          <span class="poem-title">{{ p.title }}</span>
                          <span class="poem-content">{{ p.content }}</span>
                        </div>
                        <button class="swipe-action inline-elim-btn" @click.stop="eliminate(p)">淘汰</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="expandedId === p.id" :key="'ex-'+p.id" class="expand-row">
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

        <!-- 苏轼诗文TOP64 -->
        <div class="n64-col n64-col-result">
          <div class="table-title-row">
            <div class="title-deco-bar"></div>
            <h2 class="table-page-title">苏轼诗文TOP64</h2>
            <span class="table-hint">单击 → 移除该项</span>
            <span class="table-counter">{{ result64.length }}首 / 64首</span>
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
                <col v-for="n in displayCols" :key="'c'+n" />
              </colgroup>
              <!-- 仅导出图片时显示的两行：第1行标题，第2行副栏；日常界面隐藏（.export-only-head { display:none }），导出前临时显示 -->
              <thead class="export-only-head">
                <tr class="export-row export-row-title">
                  <!-- 日常显示 1 列 → colspan=1 -->
                  <th :colspan="displayCols" class="export-title-cell">最喜欢的苏轼诗文top64</th>
                </tr>
                <tr class="export-row export-row-sub">
                  <th :colspan="displayCols" class="export-sub-cell">
                    <div class="sub-flex">
                      <span class="es-mid">填表人：{{ _getSafeFillerName() }}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in resultRowsDisplay" :key="'r'+r">
                  <td
                    v-for="c in displayCols"
                    :key="'td'+r+'-'+c"
                    :class="['result-cell', { empty: !getResultCell(r, c, displayCols) }]"
                    @click="removeFromResult(r, c, displayCols)"
                  >
                    <template v-if="getResultCell(r, c, displayCols)">
                      <span class="poem-title">{{ getResultCell(r, c, displayCols).title }}</span>
                      <span class="poem-content">{{ getResultCell(r, c, displayCols).content }}</span>
                    </template>
                    <span v-else class="result-idx">{{ (r - 1) * displayCols + c }}</span>
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

    <!-- 排行榜页面 -->
    <div v-else-if="mode === 'rank'" class="table-page rank-page">
      <div class="table-page-header">
        <a class="back-link" @click="switchMode(null)">← 返回主页</a>
      </div>

      <div class="rank-center-wrap">
        <div class="rank-wrapper" id="rankWrapper">
          <div class="table-title-row">
            <div class="title-deco-bar"></div>
            <h2 class="table-page-title">苏轼诗文人气排行榜</h2>
            <span class="table-hint">截至 2026.08.29</span>
            <span class="table-counter">{{ rankList.length }} 首</span>
          </div>
          <div class="rank-table-scroll">
            <table class="rank-table">
              <thead>
                <tr class="rank-head-row">
                  <th class="rank-col-idx">序号</th>
                  <th class="rank-col-content">诗文</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in rankList" :key="'rk' + item.idx" class="rank-row">
                  <td class="rank-col-idx rank-idx-cell">{{ item.idx }}</td>
                  <td class="rank-col-content rank-content-cell">
                    <div class="rank-poem-text">{{ item.content }}</div>
                  </td>
                </tr>
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
          为了防止人机刷票，请写一段关于「自己与苏轼」的话以证明您是真实的人类，我们将根据您的自证决定是否采纳您提交的数据上榜。
          <br>
          <br>
          <strong>注意：</strong>若使用AI生成，一律不予采纳。
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

    <!-- 轻反馈 Toast：成功/失败/警告等无需用户确认的提示 -->
    <transition name="toast-fade">
      <div v-if="toast.show" class="toast-wrap" :class="'toast-' + toast.type">
        <span class="toast-text">{{ toast.text }}</span>
      </div>
    </transition>
  </div>
</template>

<script>
import html2canvas from 'html2canvas';
import poemSource from '../苏轼诗文精选.txt?raw';
import csvSource from '../苏轼诗文精选.csv?raw';
import rankSource from '../排行榜总表.csv?raw';

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

const HASH_TO_MODE = { '#/nxuan64': '64', '#/ranking': 'rank' };

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
      toast: { show: false, type: 'success', text: '' },
      _toastTimer: null,
      rankList: [],
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
    displayCols() { return 1; },
    resultRowsDisplay() {
      const cols = this.displayCols;
      const needed = Math.ceil(Math.max(1, this.selectedIdsOrder.length) / cols);
      const minRows = (cols === 1) ? 64 : (cols === 2 ? 32 : 16); // 1列至少64行=64格
      return Math.max(minRows, needed);
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
    this.initRank();
    this.mode = this.hashToMode();
    window.addEventListener('hashchange', this.handleHashChange);
    window.addEventListener('resize', this.forceRerender);
    this.refreshRandomPoem();
    this._ensureDeviceId(); // 页面加载即进行双重备份同步/恢复/生成
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
      }));
    },
    initRank() {
      const rows = parseCSV(rankSource);
      if (rows.length === 0) return;
      const start = (rows[0] && rows[0][0] === '计数') ? 1 : 0;
      const list = [];
      for (let i = start; i < rows.length; i++) {
        const r = rows[i] || [];
        const content = (r[1] || '').trim();
        if (!content) continue;
        list.push({ idx: list.length + 1, content });
      }
      this.rankList = list;
    },
    forceRerender() { this.$forceUpdate(); },
    hashToMode() {
      const h = window.location.hash;
      // hash 为空（'' 或 仅 '#'）时默认显示首页（mode = null → v-if="!mode" 展示 homepage）
      if (!h || h === '#' || h.trim() === '') return null;
      return HASH_TO_MODE[h] || null;
    },
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
      if (m === '64') window.location.hash = '/nxuan64';
      else if (m === 'rank') window.location.hash = '/ranking';
      else window.location.hash = '/';
    },

    isSelected(id) { return this.selectedIdsOrder.indexOf(id) !== -1; },

    toggleExpand(p) {
      if (this.expandedId === p.id) this.expandedId = null;
      else this.expandedId = p.id;
    },

    toggleSelect(p) {
      if (this.eliminatedIds.indexOf(p.id) !== -1) return;
      if (this.isSelected(p.id)) {
        const idx = this.selectedIdsOrder.indexOf(p.id);
        if (idx !== -1) this.selectedIdsOrder.splice(idx, 1);
      } else {
        this.$set(this.selectedIdsOrder, this.selectedIdsOrder.length, p.id);
      }
    },

    getResultCell(r, c, cols = 4) {
      const idx = (r - 1) * cols + (c - 1);
      return this.result64[idx] || null;
    },
    removeFromResult(r, c, cols = 4) {
      const idx = (r - 1) * cols + (c - 1);
      if (idx >= this.selectedIdsOrder.length) return;
      this.selectedIdsOrder.splice(idx, 1);
    },

    eliminate(p) {
      const idx = this.selectedIdsOrder.indexOf(p.id);
      if (idx !== -1) this.selectedIdsOrder.splice(idx, 1);
      if (this.eliminatedIds.indexOf(p.id) === -1) {
        this.$set(this.eliminatedIds, this.eliminatedIds.length, p.id);
      }
      if (this.expandedId === p.id) this.expandedId = null;
    },

    restore(p) {
      const i = this.eliminatedIds.indexOf(p.id);
      if (i !== -1) this.eliminatedIds.splice(i, 1);
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
    // ===================== 轻反馈 Toast =====================
    showToast(text, type = 'success', duration = 2000) {
      if (this._toastTimer) clearTimeout(this._toastTimer);
      this.toast = { show: true, type, text };
      this._toastTimer = setTimeout(() => {
        this.toast.show = false;
        this._toastTimer = null;
      }, duration);
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
    _uuidShort() {
      const bytes = new Uint8Array(8);
      if (crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
      else for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
      let hex = '';
      for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
      return hex;
    },
    _setCookie(name, value, days) {
      try {
        const d = new Date();
        d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
        const secure = location.protocol === 'https:' ? 'Secure;' : '';
        document.cookie =
          encodeURIComponent(name) + '=' + encodeURIComponent(value) +
          ';expires=' + d.toUTCString() +
          ';path=/' +
          (secure ? ';' + secure : '') +
          ';SameSite=Lax';
      } catch (e) {}
    },
    _getCookie(name) {
      try {
        const key = encodeURIComponent(name) + '=';
        const parts = document.cookie ? document.cookie.split(';') : [];
        for (let p of parts) {
          p = p.trim();
          if (p.indexOf(key) === 0) return decodeURIComponent(p.slice(key.length));
        }
      } catch (e) {}
      return '';
    },
    // 双重备份：Cookie + LocalStorage
    // 读取时优先 LocalStorage；其缺失则用 Cookie 恢复并回写 LocalStorage；Cookie 缺失则用 LocalStorage 回写 Cookie；均缺失时生成新 ID 并写入两处。
    _ensureDeviceId() {
      const LS_KEY = 'shiwen-device-id';
      const CK_KEY = 'shiwenDeviceId';
      const DAYS = 365 * 5;
      let fromLS = '';
      try { fromLS = (localStorage.getItem(LS_KEY) || '').trim(); } catch (e) { fromLS = ''; }
      const fromCK = (this._getCookie(CK_KEY) || '').trim();
      let id = '';
      if (fromLS && fromCK && fromLS !== fromCK) {
        // 两者不一致：取 LocalStorage 为主，同时把 Cookie 覆盖回写为 LS 的值
        id = fromLS;
      } else {
        id = fromLS || fromCK;
      }
      if (!id) {
        id = 'dev_' + Date.now().toString(36) + '_' + this._uuidShort();
      }
      try { localStorage.setItem(LS_KEY, id); } catch (e) {}
      this._setCookie(CK_KEY, id, DAYS);
      return id;
    },
    _getDeviceId() {
      return this._ensureDeviceId();
    },
    // 上传：deviceId 直接作为文件名前缀，folder 使用白名单顶层目录（不建子目录）
    // 文件名形式：{deviceId}_{表标识}.csv；不含动态串，同设备重复 PUT 即覆盖
    _buildUploadFileName(kind) {
      const did = this._getDeviceId();
      const safe = did.replace(/[\\/:*?"<>|\s]/g, '_');
      if (kind === 'result') return safe + '_苏轼诗文TOP64.csv';
      if (kind === 'elim') return safe + '_淘汰表.csv';
      return safe + '.csv';
    },
    _buildUploadFolder(kind, folder) {
      // 直接使用白名单顶层 folder，不再拼接 deviceId 子目录
      return folder || '';
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
      return s || '——';
    },

    // ===================== CSV 构建 =====================
    // 苏轼诗文TOP64：首行=自证语/填表人；次行=填表人信息；后续=数据行（4列组布局）
    _buildResultCSV() {
      const firstLine = this.authText ? '【自证】' + this.authText :
        '【填表人】' + this._getSafeFillerName();
      const COL = 4;
      const N = Math.max(64, this.result64.length);
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
      lines.push([firstLine].concat(new Array(COL - 1).fill('')).map(this._csvEscape).join(','));
      // 填表人信息行（第2行）
      const infoRow = ['填表人：' + this._getSafeFillerName(), '数量：' + this.result64.length, '提交时间：' + new Date().toLocaleString()];
      while (infoRow.length < COL) infoRow.push('');
      lines.push(infoRow.map(this._csvEscape).join(','));
      for (const r of dataRows) {
        while (r.length < COL) r.push('');
        lines.push(r.map(this._csvEscape).join(','));
      }
      return '\uFEFF' + lines.join('\r\n');
    },

    // 淘汰表：首行=自证/填表人；次行=填表人信息；后续=数据
    _buildElimCSV() {
      const firstLine = this.authText ? '【自证】' + this.authText :
        '【填表人】' + this._getSafeFillerName();
      const cols = this.elimMultiCol ? this.elimColCount : 1;
      const N = this.eliminated.length;
      const totalCol = Math.max(1, cols);
      const poemRows = Math.ceil(N / totalCol);
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
      const name = this._getDeviceId() + '_' + this._getSafeFillerName() + '_苏轼N选64_' + suffix + '_' + this._formatDate() + '.csv';
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    },
    exportResultCSV() {
      this._downloadCSV(this._buildResultCSV(), '苏轼诗文TOP64');
    },
    exportElimCSV() {
      this._downloadCSV(this._buildElimCSV(), '淘汰表');
    },

    // ===================== 导出PNG（直接对 苏轼诗文TOP64/淘汰表 的表格本身进行截图） =====================
    // 苏轼诗文TOP64 在 <thead class="export-only-head"> 里插入两行（标题 / 副栏），日常隐藏，导出前临时显示。
    _escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    async _exportPNGDirect({ wrapperId, tableId, mode }) {
      const wrapper = document.getElementById(wrapperId);
      const table = document.getElementById(tableId);
      if (!wrapper || !table) { this.showToast('未找到表格容器', 'error'); return; }

      // ---- 1. 展开 wrapper：去掉最大高度限制，显示隐藏的导出表头行 ----
      const prevOverflow = wrapper.style.overflow;
      const prevMaxH = wrapper.style.maxHeight;
      const prevH = wrapper.style.height;
      wrapper.style.overflow = 'visible';
      wrapper.style.maxHeight = 'none';
      wrapper.style.height = 'auto';

      const exportHead = table.querySelector('thead.export-only-head');
      const prevHeadDisplay = exportHead ? exportHead.style.display : '';
      let headWasHidden = false;
      if (exportHead) {
        const cs = getComputedStyle(exportHead);
        headWasHidden = (cs.display === 'none');
        if (headWasHidden) exportHead.style.display = 'table-header-group';
      }
      // 清理所有 th 的 sticky 定位，避免截图错位
      const thFix = table.querySelectorAll('th');
      const thPrev = [];
      thFix.forEach(th => { thPrev.push(th.style.position); th.style.position = 'static'; });

      await this.$nextTick();
      await new Promise(r => setTimeout(r, 120));

      // ---- 2. 把原 table 克隆一个独立副本，放到 body 最左（-99999px），避免屏幕外/滚动问题 ----
      const cloneWrap = document.createElement('div');
      cloneWrap.style.position = 'absolute';
      cloneWrap.style.left = '-99999px';
      cloneWrap.style.top = '0';
      cloneWrap.style.background = '#ffffff';
      cloneWrap.style.zIndex = '1';
      const tableClone = table.cloneNode(true);
      const isResult = (tableId === 'resultTable');
      const isElim = (tableId === 'elimTable');
      const FF = '"Noto Serif SC","Songti SC","SimSun","STSong",serif';

      if (isResult || isElim) {
        // --- 两种表统一两列；动态区分数据源/标题/列数/空格类名 ---
        const resultCols = 2;
        const data = (isResult ? this.result64 : this.eliminated).slice();
        const numRows = Math.max(1, Math.ceil(data.length / resultCols));
        const actualCount = data.length;

        // 尺寸：行高+4 24px，字号各+1，整体宽 890（原880+10）
        const cellH = 24;
        const titleFS = 11;
        const contentFS = 10;
        const idxFS = 8;
        const totalW = 890;

        // 表头标题：TOP64 的 "64" 改为实际填的诗词数；淘汰表固定"淘汰表"
        const titleText = isResult
          ? ('最喜欢的苏轼诗文TOP' + actualCount)
          : ('淘汰表（共' + actualCount + '首）');

        const safeTitle = this._escapeHtml(titleText);
        const safeFiller = this._escapeHtml('填表人：' + this._getSafeFillerName());

        // 重建整表结构（覆盖克隆体），统一两列
        const colgroupHtml = '<colgroup><col /><col /></colgroup>';
        const theadHtml =
          `<thead class="export-only-head" style="display:table-header-group;">
            <tr style="height:auto;">
              <th colspan="2" style="padding:18px 12px 8px;font-size:26px;letter-spacing:4px;font-family:${FF};background:#faf9f6;border-bottom:1px solid #b8cdb8;text-align:center;color:#2c3e2c;font-weight:700;">${safeTitle}</th>
            </tr>
            <tr style="height:auto;">
              <th colspan="2" style="padding:8px 12px;background:#faf9f6;border-bottom:1px solid #b8cdb8;text-align:center;font-size:12px;color:#6b866b;font-family:${FF};font-weight:normal;">${safeFiller}</th>
            </tr>
          </thead>`;

        const rowBuilder = [];
        const cellCls = isResult ? 'result-cell' : 'elim-cell';
        for (let r = 0; r < numRows; r++) {
          let rowHtml = '<tr style="height:' + cellH + 'px;">';
          for (let c = 0; c < resultCols; c++) {
            const i = r * resultCols + c;
            if (i < data.length) {
              const p = data[i];
              rowHtml += `<td class="${cellCls}" data-id="${this._escapeHtml(p.id)}"
                style="height:${cellH}px;min-height:${cellH}px;max-height:${cellH}px;padding:2px 6px;vertical-align:middle;line-height:1.25;font-family:${FF};border:1px solid #dde7dd;background:#fcfdfb;">
                <span class="poem-title" style="font-size:${titleFS}px;line-height:1.3;font-family:${FF};display:block;">${this._escapeHtml(p.title)}</span>
                <span class="poem-content" style="font-size:${contentFS}px;line-height:1.3;font-family:${FF};display:block;color:${isResult ? '#5c7a5c' : '#4e5b4e'};">${this._escapeHtml(p.content || '')}</span>
              </td>`;
            } else {
              rowHtml += `<td class="${cellCls} empty"
                style="height:${cellH}px;min-height:${cellH}px;max-height:${cellH}px;padding:2px 6px;vertical-align:middle;font-family:${FF};border:1px solid #dde7dd;background:#faf9f6;color:#b8cdb8;">
                <span class="result-idx" style="font-size:${idxFS}px;font-family:${FF};">${i + 1}</span>
              </td>`;
            }
          }
          rowHtml += '</tr>';
          rowBuilder.push(rowHtml);
        }

        // 表尾
        const leftStr = '网站制作：蟋蟀  诗文筛汇：嫻菜无敌 蟋蟀';
        const rightStr = '聚友：欢迎关注公众号「东坡墙」QQ「3301590656」';
        const centerStr = 'www.sudongpo521.cn';
        const footerRow =
          `<tr style="height:auto;">
            <td colspan="2" style="padding:10px 12px 8px;border-top:1px solid #b8cdb8;font-family:${FF};background:#faf9f6;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;font-family:${FF};font-size:11px;line-height:1.7;color:#4e5b4e;">
                <span style="text-align:left;flex:0 0 auto;">${this._escapeHtml(leftStr)}</span>
                <span style="text-align:center;flex:1 1 auto;font-size:11px;">${this._escapeHtml(centerStr)}</span>
                <span style="text-align:right;flex:0 0 auto;">${this._escapeHtml(rightStr)}</span>
              </div>
            </td>
          </tr>`;
        rowBuilder.push(footerRow);

        const tbodyHtml = '<tbody>' + rowBuilder.join('') + '</tbody>';

        // 整体覆盖克隆体：避免日常的列数/隐藏表头差异干扰
        tableClone.innerHTML = colgroupHtml + theadHtml + tbodyHtml;
        tableClone.setAttribute('border', '0');
        tableClone.setAttribute('cellspacing', '0');
        tableClone.setAttribute('cellpadding', '0');
        tableClone.style.fontFamily = FF;
        tableClone.style.color = '#2c3e2c';
        tableClone.style.tableLayout = 'fixed';
        tableClone.style.width = totalW + 'px';
        tableClone.style.maxWidth = totalW + 'px';
        tableClone.style.height = 'auto';
        tableClone.style.background = '#ffffff';
      } else {
        // 兜底（理论不会进入）
        const realWidth = Math.ceil(table.getBoundingClientRect().width);
        tableClone.style.tableLayout = 'fixed';
        tableClone.style.width = realWidth + 'px';
        tableClone.querySelectorAll('th').forEach(th => { th.style.position = 'static'; });
      }
      cloneWrap.appendChild(tableClone);
      document.body.appendChild(cloneWrap);

      // 在测量尺寸前给 cloneWrap 显式设置包裹尺寸 = tableClone 的实际尺寸，消除绝对定位下的多余空白
      cloneWrap.style.width = tableClone.offsetWidth + 'px';
      cloneWrap.style.height = tableClone.offsetHeight + 'px';
      cloneWrap.style.overflow = 'hidden';
      cloneWrap.style.padding = '0';
      cloneWrap.style.margin = '0';
      cloneWrap.style.display = 'block';

      await this.$nextTick();
      await new Promise(r => setTimeout(r, 150));

      try {
        // 第二次校准：table 渲染后可能尺寸有微小变化
        const finalW = tableClone.offsetWidth;
        const finalH = tableClone.offsetHeight;
        if (!finalW || !finalH) throw new Error('导出容器尺寸为 0');
        cloneWrap.style.width = finalW + 'px';
        cloneWrap.style.height = finalH + 'px';

        const canvas = await html2canvas(cloneWrap, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          // 严格使用 cloneWrap 的实际渲染尺寸，html2canvas 不再使用 windowSize 推断
          width: finalW,
          height: finalH,
          windowWidth: finalW,
          windowHeight: finalH,
          x: 0, y: 0,
          scrollX: 0, scrollY: 0,
          ignoreElements: () => false,
        });
        if (!canvas || !canvas.width) throw new Error('画布生成失败（空）');
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = this._getDeviceId() + '_' + this._getSafeFillerName() + '_苏轼N选64_' + mode + '_' + this._formatDate() + '.png';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) link.parentNode.removeChild(link);
          try { URL.revokeObjectURL(dataUrl); } catch (e) { /* ignore */ }
        }, 500);
      } catch (err) {
        console.error(err);
        this.showToast('导出图片失败：' + (err && err.message ? err.message : String(err)), 'error', 3000);
      } finally {
        if (cloneWrap && cloneWrap.parentNode) cloneWrap.parentNode.removeChild(cloneWrap);
        // ---- 3. 还原：隐藏导出表头 + 恢复 wrapper 原属性 + 还原 th sticky ----
        if (exportHead) {
          exportHead.style.display = prevHeadDisplay;
        }
        thFix.forEach((th, i) => { th.style.position = thPrev[i]; });
        wrapper.style.overflow = prevOverflow;
        wrapper.style.maxHeight = prevMaxH;
        wrapper.style.height = prevH;
      }
    },
    exportResultPNG() {
      this._exportPNGDirect({
        wrapperId: 'resultWrapper',
        tableId: 'resultTable',
        mode: '苏轼诗文TOP64'
      });
    },
    exportElimPNG() {
      // 淘汰表：直接截图表格本体（不加两行标题，保持原貌）
      this._exportPNGDirect({
        wrapperId: 'elimWrapper',
        tableId: 'elimTable',
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
        this.showToast('请填写填表人', 'warn');
        return;
      }
      if (this.result64.length !== 64) {
        this.showToast('TOP64 需为 64 首', 'warn', 3000);
        return;
      }
      if (!this._requireAuthOrProceed('result')) return;
      this._doUploadResult();
    },
    onUploadElim() {
      if (!(this.fillerName || '').trim()) {
        this.showToast('请填写填表人', 'warn');
        return;
      }
      if (this.eliminated.length === 0) {
        this.showToast('淘汰表为空，无法上传', 'warn');
        return;
      }
      if (!this._requireAuthOrProceed('elim')) return;
      this._doUploadElim();
    },
    async _uploadBlob(blob, fileName, folder) {
      const url = '/api/upload?fileName=' + encodeURIComponent(fileName) +
        '&folder=' + encodeURIComponent(folder);
      let r;
      try {
        r = await fetch(url);
      } catch (netErr) {
        // 比如 CORS 拦、网络断 / 路径 404（vite dev 无后端）
        throw new Error('网络错误 / 上传接口不可用（' + (netErr && netErr.message ? netErr.message : 'fetch失败') + '）。请确认项目部署到 Cloudflare Pages Functions；本地调试阶段可改成本地下载 CSV。');
      }
      let bodyText = '';
      try { bodyText = await r.text(); } catch (_) { bodyText = ''; }
      if (!r.ok) {
        const msg = (bodyText && bodyText.slice(0, 200)) || r.statusText;
        // CF Pages 构建失败 / 路由不存在时，返回的不是 JSON
        if (r.status === 404 || /not found/i.test(msg) || /no such file/i.test(msg)) {
          throw new Error('未找到 /api/upload 接口（状态码 404）。请确认项目已部署到 Cloudflare Pages 并启用 Functions；本地 vite dev 下不会自动处理 functions 目录。');
        }
        // 反解 JSON 的错误消息
        try {
          const j = JSON.parse(bodyText);
          if (j && j.error) {
            throw new Error('获取预签名 URL 失败(' + r.status + '): ' + j.error +
              ' —— 若是"R2/凭证"相关报错：请在 Cloudflare Pages → Settings → Environment Variables 中检查 CLOUDFLARE_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME 是否已配置并重新部署。');
          }
        } catch (_) { /* 非 JSON，用原文本 */ }
        throw new Error('获取预签名 URL 失败(' + r.status + '): ' + msg);
      }
      let json = null;
      try { json = JSON.parse(bodyText); } catch (e) {
        throw new Error('上传返回体不是合法 JSON（' + bodyText.slice(0, 120) + '）。请确认已部署 Cloudflare Pages Functions（functions/api/upload.js）而不是纯静态托管。');
      }
      const { signedUrl } = json || {};
      if (!signedUrl) throw new Error('未获取到上传地址（signedUrl 为空）。请登录 Cloudflare Pages → Functions 日志查看具体报错（通常是 R2 环境变量缺失 / S3 import 失败）。');
      const put = await fetch(signedUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'text/csv;charset=utf-8' }
      });
      if (!put.ok) {
        let putMsg = put.statusText;
        try { putMsg = await put.text(); } catch (_) {}
        throw new Error('上传到 R2 失败(' + put.status + '): ' + (putMsg || put.statusText) +
          ' —— 这一步一般是 R2 桶名写错 / 没有 PutObject 权限 / signedUrl 过期。');
      }
    },
    async _doUploadResult() {
      if (this.uploadingResult) return;
      this.uploadingResult = true;
      try {
        const csv = this._buildResultCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const name = this._buildUploadFileName('result');
        const folder = this._buildUploadFolder('result', 'shiwen-nxuan64');
        await this._uploadBlob(blob, name, folder);
        this.showToast('上传成功，感谢您的投稿！', 'success');
      } catch (err) {
        console.error(err);
        this.showToast('上传失败：' + (err && err.message ? err.message : String(err)), 'error', 3000);
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
        const name = this._buildUploadFileName('elim');
        const folder = this._buildUploadFolder('elim', 'shiwen-eliminated');
        await this._uploadBlob(blob, name, folder);
        this.showToast('上传成功，感谢您的投稿！', 'success');
      } catch (err) {
        console.error(err);
        this.showToast('上传失败：' + (err && err.message ? err.message : String(err)), 'error', 3000);
      } finally {
        this.uploadingElim = false;
      }
    },
  }
};
</script>
