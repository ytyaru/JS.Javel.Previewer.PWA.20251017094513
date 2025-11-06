(function(){
class JavelViewer {
    constructor() {
        this._ = {loaded:false, listened:false, pagingDisabled:false}
        this._.parser = new JavelParser();
        this._.loading = new PageLoadingDialog();
        this._.footer = new PageFooter();
        this._.splitter = new PageSplitter(this._.parser, this._.loading, this._.footer);
        this._.hammer = new Hammer(Dom.q(`[name="book"]`));
        this._.interval = null;
    }
    #isBulkMode() {return 'bulk'===this._.O.pageMakeMethod}
    #isSplitMode() {return 'split'===this._.O.pageMakeMethod}
    async make(options) {
        this._.loaded = false;
        this.#setOptions(options);
        await this.#setup();
        this._.loaded = true;
    }
    get #defaultOptions() { return {
        javel: null,
        viewer: null,
        editor: null,
        width: document.body.clientWidth,
        height: document.documentElement.clientHeight,
        writingMode: 'vertical-rl',
        lineOfChars: 40,
        minFontSize: 16,
        columnCount: null,
        columnGap: Css.getFloat('--column-gap') ?? null,
        lineHeight: 1.7,
        letterSpacing: 0.05,
        pageMakeMethod: 'bulk',
        intervalSec: 5,
//        isFullScreen: false, // ユーザ操作必須で自動化不可の為却下
        onClosed: ()=>{},
    } }
    #setOptions(options) {
        console.log('#setOptions() options:', options);
        const O = {...this.#defaultOptions, ...options};
        ['viewer', 'editor'].map(n=>{if (!Type.isEl(O[n])) {O[n]=null;}});
        if (!Type.isStr(O.javel)) {O.javel='';}
        if (!O.javel && (Type.isEl(O.editor) && !!O.editor.value)) {O.javel = O.editor.value}
        if (!Type.isEl(O.viewer)) {O.viewer=document.body;}
        if (!Number.isFinite(O.width)) {O.width=document.body.clientWidth}
        if (!Number.isFinite(O.height)) {O.height=window.innerHeight}//document.documentElement.clientHeight（横スクロールバーの高さも含まれるが表示しないため無問題）
        if (!this.#isValidWritingMode(O.writingMode)) {O.writingMode='vertical-rl';}
        if (!Number.isFinite(O.lineOfChars) || (O.lineOfChars < 25 || 50 < O.lineOfChars)) {O.lineOfChars=40}
        if (!Number.isFinite(O.minFontSize) || (O.minFontSize < 8 || 32 < O.minFontSize)) {O.minFontSize=16}
        if (![1,2].some(v=>v===O.columnCount)) {O.columnCount=null}
        if (!Number.isFinite(O.lineHeight) || (O.lineHeight < 0 || 1 < O.lineHeight)) {O.lineHeight=1.7}
        if (!Number.isFinite(O.letterSpacing) || (O.letterSpacing < 0 || 1 < O.letterSpacing)) {O.letterSpacing=0.05}
        Css.set('--writing-mode', O.writingMode);
        this._.O = O;
        console.log('設定:', O, !O.javel && (Type.isEl(O.editor) && !!O.editor.value));
    }
    async #load() {
        if (!this._.O.viewer.querySelector('[name="error"]')) {
            this._.O.viewer.append(Dom.tags.div({name:'error', style:'display:none; widht:100%; height:100%;'}, 
                Dom.tags.p('パースに失敗しました。Javel原稿の冒頭にはYAML形式のメタ情報が必要です。次のような形式にしてください。'),
                Dom.tags.pre(`---
title: 小説のタイトル
catch: 小説のキャッチコピー
obi: |-
小説の帯文。

Javel形式《けいしき》で書けるよ。
author:
name: 著者名
---

# 見出し

　本文。`),
            ));
        }
        try {
            if (this._.O.javel.startsWith('https://') || 0===(this._.O.javel.trim().match(new RegExp('\n', 'g')) || []).length) {
                const res = await fetch(this._.O.javel);
                const txt = await res.text();
                if (this._.O.editor) {this._.O.editor.value = txt}
                this._.parser.manuscript = txt;
            } else { console.log(this._.O.javel); this._.parser.manuscript = this._.O.javel; }
            if (this._.O.editor) {this._.O.editor.value = this._.parser.manuscript;}
        } catch (err) {
            console.error(err);
            this._.O.viewer.querySelector('[name="error"]').style.display = 'block';
            throw err;
        }
    }
    #makeBookDiv() {
        const book = this._.O.viewer.querySelector(`[name="book-in-pages"]`);
        console.log('#makeBookDiv():', book);
        if (book) {book.innerHTML = ''; return book;}
        else {const b = Dom.tags.div({name:'book-in-pages', style:';display:block;padding:0;margin:0;box-sizing:border-box;', 'data-all-page':0});this._.O.viewer.appendChild(b); return b;}
    }
    #isOverSilverRatio(inlineSize, blockSize) {// inlineSizeが白銀比1:√2(1.414)の長辺かそれ以上か
        const isLongInline = blockSize < inlineSize;
        const inlineRatio = inlineSize / blockSize;
        return Math.sqrt(2) < inlineRatio;
    }
    #setSize() {
        let W = this._.O.width - (screen.width === this._.O.width ? 4 : 0); // -4はスクロール表示抑制用
        let H = this._.O.height - (screen.height === this._.O.height ? 4 : 0);
        let inlineSize = this.#isVertical ? H : W;
        let blockSize = this.#isVertical ? W : H;
        // inlineSizeが1040px以上で、かつ長辺であり縦横比が本と同じ1:√2(1.414)の長辺と同じかそれ以上ならcolumnCountを2にする。
        const columnCount = this._.O.columnCount ? this._.O.columnCount : (1040 < inlineSize && this.#isOverSilverRatio(inlineSize, blockSize) ? 2 : 1);
        // サイズはそのままで余白にする。そしてその余白部分にオーバーレイする
        Css.set('--page-padding-bottom', `${1===columnCount ? 16 : 0}px`);
        inlineSize = this.#isVertical ? H : W;
        blockSize = this.#isVertical ? W : H;
        const columnWidth = 1===columnCount ? inlineSize : (this.#isVertical ? inlineSize/columnCount : inlineSize);
        Css.set('--writing-mode', this._.O.writingMode);
        Css.set(`--page-inline-size`, `${inlineSize}px`);
        Css.set(`--page-block-size`, `${blockSize}px`);
        this._.O.viewer.style.width = `${W}px`;
        this._.O.viewer.style.height = `${H}px`;
        Css.set(`--column-count`, `${columnCount}`);
        console.log('columnCount:', columnCount, 'inline:', inlineSize, 'block:', blockSize, 'mode:', this._.O.writingMode);
        const inlineChars = ((this._.O.lineOfChars + (this._.O.lineOfChars*this._.O.letterSpacing) * columnCount) + (1===columnCount ? 0 : this._.O.columnGap));
        console.log(`inlineChars:`, inlineChars, this._.O.lineOfChars);
        const inlineFtSz = Math.max(this._.O.minFontSize, ((inlineSize/columnCount)-(1===columnCount ? 0 : 16))/inlineChars);
        Css.set(`--font-size`, `${inlineFtSz}px`);
        console.log('font-size:', inlineFtSz, this._.O.minFontSize, inlineSize/inlineChars, inlineSize, inlineChars, this._.O.lineOfChars);
        const columnGapEm = Number.isFinite(this._.O.columnGap) ? this._.O.columnGap : 2;
        Css.set(`--column-gap`, `${columnGapEm}em`);
        const columnGapPx = inlineFtSz*columnGapEm;
        Css.set(`--line-height`, `${this._.O.lineHeight}em`);
        Css.set(`--letter-spacing`, `${this._.O.letterSpacing}em`);
        return {
            isVertical: this.#isVertical,
            width: W, height: H,
            inlineSize: inlineSize,
            blockSize: blockSize,
            columnCount: columnCount,
            columnWidth: columnWidth,
            fontSize: inlineFtSz,
            columnGap: {em:columnGapEm, px:columnGapPx},
        }
    }
    async #setup() {
        this._.O.viewer.style.display = 'block';
        const calc = this.#setSize();
        console.log('calc:', calc);
        this._.loading.make();
        await this.#load();
        this._.footer.make(this._.O.viewer, calc, this._.O.footer);
        const book = this.#makeBookDiv();// ページを含める親要素
        this._.splitter.type = 'bulk'===this._.O.pageMakeMethod ? 'all' : 'one';
        this._.splitter.intervalSec = this._.O.intervalSec;
        await this._.splitter.split(this._.O.viewer);
        this._.O.viewer.style.display = 'block';
        if (this.#isVertical) {
            book.style.writingMode = this._.O.writingMode;
            book.style.display = 'flex';
            book.style.flexDirection= 'column';
        } else {
            book.style.writingMode = 'vertical-lr';
            book.style.display = 'flex';
            book.style.flexDirection= 'column';
        }
        book.querySelector('.page.cover').classList.add('show');
        // イベント設定（イベントのターゲットHTML要素は変わらない想定。もし変わったらバグる）
        if (!this._.listened) {this.#listen();this._.listened=true;}
        this._.O.viewer.focus();
        this.#nowPage.scrollIntoView({behavior:'instant'}); // 元ページに戻す
        this._.loading.hide();
    }
    #listen() {
        console.log('listen()');
        Hammer.defaults.cssProps.userSelect = 'text'; // テキスト選択できないので、選択可にしたら、今度はスワイプできなくなった。よってスワイプでなくタップで遷移する。new Hammer()の前に設定する必要がある。あとから変更不可（反映されない）
        this._.hammer = new Hammer(this._.O.viewer);
        this._.hammer.get('press').set({ time:3000 }); // 3秒長押し
        this._.hammer.on('press', async(e)=>{
            console.log('PRESS:', e);
            this.turnBack();
        });
        this._.hammer.on('doubletap', async(e)=>{
            console.log('Double-TAP:', e);
            Hammer.defaults.cssProps.userSelect = 'text'===Hammer.defaults.cssProps.userSelect ? 'none' : 'text'; // テキスト選択できないので、選択可にしたら、今度はスワイプできなくなった。よってスワイプでなくタップで遷移する
            console.log('Hammer.defaults.cssProps.userSelect:', Hammer.defaults.cssProps.userSelect);
        });
        this._.hammer.on('tap', async(e)=>{
            console.log('TAP:', e);
            if (!this._.loaded) {return}
            if (this.#isHorizontal) {
                if (this.#isClickLeftSide(e.srcEvent.clientX)) {this.#prevPage(this.#nowPage)}
                else {this.#nextPage(this.#nowPage)}
            } else {
                if (this.#isClickRightSide(e.srcEvent.clientX)) {console.log('縦書きの右側をタップした。');this.#prevPage(this.#nowPage)}
                else {this.#nextPage(this.#nowPage)}
            }
        });
        this._.O.viewer.setAttribute('tabindex', '0');
        this._.O.viewer.addEventListener('keyup', async(e)=>{
            console.log('keyup:', e);
            if (!this._.loaded) {return}
            const nowPage = this.#nowPage;
            if (e.shiftKey) {
                if ([' ', 'Enter'].some(k=>k===e.key)) {this.#prevPage(nowPage);}
            } else {
                if ([' ', 'Enter'].some(k=>k===e.key)) {this.#nextPage(nowPage);}
                else if (['Escape', 'Backspace'].some(k=>k===e.key)) {this.turnBack()} // 設定画面表示
                else if ('ArrowLeft'===e.key) {this.#isHorizontal ? this.#prevPage(nowPage) : this.#nextPage(nowPage);}
                else if ('ArrowRight'===e.key) {this.#isHorizontal ? this.#nextPage(nowPage) : this.#prevPage(nowPage);}
                else if ('n'===e.key) {this.#nextPage(nowPage)}
                else if ('p'===e.key) {this.#prevPage(nowPage)}
            }
        });
        this._.O.viewer.addEventListener('wheel', (event) => {
            console.log('マウスホイール検知:', event.deltaY, 'pagingDisabled:', this._.pagingDisabled);
            event.deltaY < 0 ? this.#prevPage(this.#nowPage) : this.#nextPage(this.#nowPage);
        });
        document.addEventListener('scrollend', async(e)=>{// scrollIntoView({behavior:'smooth'})完了後に前ページを非表示にする
            console.log('scrollend!!!!!!!!!!!!!!!!!!!!!!!:', 'pagingDisabled:', this._.pagingDisabled);
            if ('none'!==this._.O.viewer.style.display) {
                if (this._.hidePage) {this._.hidePage.classList.remove('show');this._.hidePage=null;}
                this._.footer.resetContent();
                this._.pagingDisabled = false;
            }
        });
    }
    turnBack() {// 最初の画面に戻る
        this.showScrollbar();
        this._.O.onClosed();
        this._.footer.hide();
    }
    hideScrollbar() {
        Css.set('--overflow', 'hidden');
        Css.set('--scrollbar-width', 'none');
        Css.set('--webkit-scrollbar', 'none');
        Css.set('--ms-overflow-style', 'none');
    }
    showScrollbar() {
        Css.set('--overflow', 'auto');
        Css.set('--scrollbar-width', 'auto');
        Css.set('--webkit-scrollbar', 'block');
        Css.set('--ms-overflow-style', 'auto');
    }
    #isValidWritingMode(v) {return ['horizontal-tb', 'vertical-rl'].some(n=>n===v)}
    get #isHorizontal() {return this._.O.writingMode.startsWith('h')}
    get #isVertical() {return this._.O.writingMode.startsWith('v')}
    #isClickLeftSide(x, y) {return (x % this._.O.width) < (this._.O.width/2)}//画面を左右に二分割したとき左半分をクリックしたか
    #isClickRightSide(x, y) {return (this._.O.width/2) <= (x % this._.O.width)}//画面を左右に二分割したとき左半分をクリックしたか
    get #nowPage() {return this._.O.viewer.querySelector('.page.show:not(.dummy)');}
    #nextPage(nowPage) {
        console.log('次に進む', nowPage, this.#isSelection, this._.pagingDisabled);
        if (this.#isSelection) {console.log('テキスト選択中につき遷移無視する。');return}
        if (this._.pagingDisabled) {console.log('ページ遷移中につき遷移無視する。');return}
        if (this._.splitter.calculating) {console.log('ページ計算中につき遷移無視する。');return}
        const nextPage = this._.splitter.makeNextPage(nowPage.nextElementSibling, this._.pagingDisabled);
        console.log('nextPage:', !!nextPage)
        if (nextPage) {
            console.log('次ページを表示する:', 'nowPage:', nowPage.dataset.page, 'nextPage:', nextPage.dataset.page);
            this._.pagingDisabled = true;
            nextPage.classList.add('show'); // なぜか次ページがここで表示されてしまいscrollIntoViewが実行できずscrollend発火できないので
            nowPage.scrollIntoView({behavior:'instant'}); // 元ページに戻す
            this._.hidePage = nowPage;
            this._.footer.hide();
            nextPage.scrollIntoView({behavior:'smooth'});// instant:即時, smooth:ぬるっと
        }
    }
    #prevPage(nowPage) {
        console.log('前に戻る', nowPage);
        if (this.#isSelection) {return}
        if (this._.pagingDisabled) {return}
        if (this._.splitter.calculating) {console.log('ページ計算中につき遷移無視する。');return}
        const prevPage = nowPage.previousElementSibling;
        if (prevPage && !prevPage.classList.contains('dummy')) {
            this._.pagingDisabled = true;
            prevPage.classList.add('show');
            this._.hidePage = nowPage;
            this._.footer.hide();
            prevPage.scrollIntoView({behavior:'smooth'});// instant:即時, smooth:ぬるっと
        }
    }
    get #isSelection() {return 0 < window.getSelection().toString().length;}
}
window.JavelViewer = JavelViewer;
})();
