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
    <div v-else class="table-page">
      <div class="table-page-header">
        <a class="back-link" @click="switchMode(null)">← 返回主页</a>
      </div>
      <!-- 其余内容留空，后续填充 -->
    </div>
  </div>
</template>

<script>
import poemSource from '../苏轼诗文精选.txt?raw';

function parsePoems(text) {
  const lines = (text || '').split(/\r?\n/);
  const poems = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    let titleLine = (lines[i] || '').trim();
    let contentLine = (lines[i + 1] || '').trim();
    titleLine = titleLine.replace(/^"/, '').replace(/"$/, '');
    contentLine = contentLine.replace(/^\?/, '').replace(/"$/, '');
    if (titleLine) {
      poems.push({ title: titleLine, content: contentLine });
    }
  }
  return poems;
}

const HASH_TO_MODE = { '#/nxuan64': '64' };

export default {
  name: 'App',
  data() {
    return {
      mode: null,
      randomPoemContent: '',
      randomPoemTitle: ''
    };
  },
  mounted() {
    this.mode = this.hashToMode();
    window.addEventListener('hashchange', this.handleHashChange);
    this.refreshRandomPoem();
  },
  beforeDestroy() {
    window.removeEventListener('hashchange', this.handleHashChange);
  },
  methods: {
    hashToMode() {
      return HASH_TO_MODE[window.location.hash] || null;
    },
    handleHashChange() {
      this.mode = this.hashToMode();
    },
    refreshRandomPoem() {
      const poems = parsePoems(poemSource);
      if (poems.length > 0) {
        const p = poems[Math.floor(Math.random() * poems.length)];
        this.randomPoemContent = p.content || '';
        this.randomPoemTitle = p.title || '';
      }
    },
    switchMode(m) {
      window.location.hash = m === '64' ? '/nxuan64' : '/';
    }
  }
};
</script>
