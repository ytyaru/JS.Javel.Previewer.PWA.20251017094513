(function(){
class JavelViewer {
    constructor() {
        this._ = {loaded:false}
        this._.parser = new JavelParser();
        this._.splitter = new PageSplitter(this._.parser);
        this._.footer = new PageFooter();
    }
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
//        height: window.innerHeight,
        height: document.documentElement.clientHeight,
        writingMode: 'vertical-rl',
        lineOfChars: 40,
        minFontSize: 16,
        columnCount: null,
        columnGap: Css.getFloat('--column-gap') ?? null,
        lineHeight: 1.7,
        letterSpacing: 0.05,
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
//        Css.set('writing-mode', 'var(--writing-mode)', this._.viewer);
        Css.set('--writing-mode', O.writingMode);
        this._.O = O;
        console.log('設定:', O, !O.javel && (Type.isEl(O.editor) && !!O.editor.value));
    }
    #makeLoading() {
        if (!this._.O.viewer.querySelector('[name="loading"]')) {
            this._.O.viewer.append(Dom.tags.div({name:'loading', style:'display:none;'}, 
                Dom.tags.span({name:'loading-rate'}, '0'),
                '　', Dom.tags.span({name:'loading-all-page'}), 'ページ', 
                Dom.tags.br(), Dom.tags.span({name:'loading-message'}, '読込中……しばしお待ち下さい'),
            ));
        }
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
        else {const b = Dom.tags.div({name:'book', style:';display:block;padding:0;margin:0;box-sizing:border-box;', 'data-all-page':0});this._.O.viewer.appendChild(b); return b;}
    }
    #isOverSilverRatio(inlineSize, blockSize) {// inlineSizeが白銀比1:√2(1.414)の長辺かそれ以上か
        const isLongInline = blockSize < inlineSize;
        const inlineRatio = inlineSize / blockSize;
        return Math.sqrt(2) < inlineRatio;
    }
    #setSize() {
        let W = this._.O.width - (screen.width === this._.O.width ? 4 : 0); // -4はスクロール表示抑制用
        let H = this._.O.height - (screen.height === this._.O.height ? 4 : 0);
//        const W = this._.O.width - (screen.width === this._.O.width ? 2 : 0); // -2はスクロール表示抑制用
//        const H = this._.O.height - (screen.height === this._.O.height ? 2 : 0) - (1===this._.O.columnCount ? 16 : 0); // -16はfooter
//        const H = this._.O.height - (screen.height === this._.O.height ? 2 : 0) - (1===this._.O.columnCount ? 16 : 0); // -16はfooter
//        const W = this._.O.width;
//        const H = this._.O.height - (1===this._.O.columnCount ? 16 : 0); // -16はfooter
//        const inlineSize = this.#isVertical ? H : W;
//        const blockSize = this.#isVertical ? W : H;
        let inlineSize = this.#isVertical ? H : W;
        let blockSize = this.#isVertical ? W : H;
        // inlineSizeが1040px以上で、かつ長辺であり縦横比が本と同じ1:√2(1.414)の長辺と同じかそれ以上ならcolumnCountを2にする。
        const columnCount = this._.O.columnCount ? this._.O.columnCount : (1040 < inlineSize && this.#isOverSilverRatio(inlineSize, blockSize) ? 2 : 1);
        H -= (1===columnCount ? 16 : 0); // -16はfooter
        inlineSize = this.#isVertical ? H : W;
        blockSize = this.#isVertical ? W : H;
        const columnWidth = 1===columnCount ? inlineSize : inlineSize + Css.getFloat('--column-gap')
        Css.set('--writing-mode', this._.O.writingMode);
        //Css.set(`--page-inline-size`, `${this.#isVertical ? this._.O.height : this._.O.width}px`);
        Css.set(`--page-inline-size`, `${inlineSize}px`);
        Css.set(`--page-block-size`, `${blockSize}px`);
        this._.O.viewer.style.width = `${W}px`;
        this._.O.viewer.style.height = `${H}px`;
        //Css.set(`--column-count`, `2`);
        Css.set(`--column-count`, `${columnCount}`);
        console.log('columnCount:', columnCount, 'inline:', inlineSize, 'block:', blockSize, 'mode:', this._.O.writingMode);
        //const inlineChars = ((40 + (40*Css.getFloat('--letter-spacing'))) * columnCount) + Css.getFloat('--column-gap');
        //const inlineChars = ((this._.O.lineOfChars + (this._.O.lineOfChars*Css.getFloat('--letter-spacing'))) * columnCount) + Css.getFloat('--column-gap');
        //const inlineChars = ((this._.O.lineOfChars + ((this._.O.lineOfChars*this._.O.letterSpacing) * columnCount)) + (1===columnCount ? 0 : this._.O.columnGap/columnCount));
        const inlineChars = ((this._.O.lineOfChars + (this._.O.lineOfChars*this._.O.letterSpacing) * columnCount) + (1===columnCount ? 0 : this._.O.columnGap));
        console.log(`inlineChars:`, inlineChars, this._.O.lineOfChars);
        //const inlineChars = this._.O.lineOfChars;
        //const inlineFtSz = Math.max(16, inlineSize/inlineChars);
        //const inlineFtSz = Math.max(this._.O.minFontSize, inlineSize/inlineChars);
        const inlineFtSz = Math.max(this._.O.minFontSize, ((inlineSize/columnCount)-(1===columnCount ? 0 : 16))/inlineChars);
        Css.set(`--font-size`, `${inlineFtSz}px`);
        console.log('font-size:', inlineFtSz, this._.O.minFontSize, inlineSize/inlineChars, inlineSize, inlineChars, this._.O.lineOfChars);
        //Math.max(16, inlineSize/(40+(1===columnCount ? 0 : Css.getFloat('--column-gap'))+(40*Css.getFloat('--letter-spacing'))));
        //if (!Number.isFinite(O.columnGap)) {O.columnGap=}
        const columnGapEm = Number.isFinite(this._.O.columnGap) ? this._.O.columnGap : 2;
        Css.set(`--column-gap`, `${columnGapEm}em`);
        const columnGapPx = inlineFtSz*columnGapEm;

        Css.set(`--line-height`, `${this._.O.lineHeight}em`);
        Css.set(`--letter-spacing`, `${this._.O.letterSpacing}em`);
        /*
        this._.O.viewer.style.width = `${this._.O.width}px`;
        this._.O.viewer.style.height = `${this._.O.height}px`;
        if (this._.O.editor) {
            this._.O.editor.style.width = `${this._.O.width}px`;
            this._.O.editor.style.height = `${this._.O.height}px`;
        }
        */
//        this._.O.viewer.style.blockSize = `${blockSize + 16}px`;
//        this._.O.viewer.style.inlineSize = `${inlineSize}px`;
//        this._.O.editor.style.blockSize = `${blockSize + 16}px`;
//        this._.O.editor.style.inlineSize = `${inlineSize}px`;
        return {
            isVertical: this.#isVertical,
            width: W, height: H,
            inlineSize: inlineSize,
            blockSize: blockSize,
            columnCount: columnCount,
            columnWidth: columnWidth,
            fontSize: inlineFtSz,
//            columnGap: Css.getFloat('--column-gap') ?? inlineFtSz*2,
            columnGap: {em:columnGapEm, px:columnGapPx},
        }
    }
    async #setup() {
        const calc = this.#setSize();
        console.log('calc:', calc);
        console.log('JavelViewer#setup() writingMode:', Css.get('--writing-mode'), Css.get('--page-inline-size'), Css.get('--page-block-size'), this.#isVertical, this._.O.width, this._.O.height);
//        ['width', 'height'].map(n=>Css.set(`--page-${this.isVertical ? '' : n}-size`, `${n}px`));
        //['inline', 'block'].map(n=>Css.set(`--page-${n}-size`, Css.getInt(`${n}-size`, O.viewer}+'px'));
        /*
        Css.set('--page-inline-size', `${Css.getInt('inline-size', O.viewer}px`);
        Css.set('--page-block-size', `${Css.getInt('block-size', O.viewer}px`);
        const W = Css.getInt('inline-size', Dom.q(`[name="demo-edit"]`));
        const H = Css.getInt('block-size', Dom.q(`[name="demo-edit"]`));
//        const W = Css.getInt('width', Dom.q(`[name="demo-edit"]`));
//        const H = Css.getInt('height', Dom.q(`[name="demo-edit"]`));
        Css.set('--page-inline-size', `${H}px`);
        Css.set('--page-block-size', `${W}px`);
        console.log('Demo W:H ', W, H);
        */
        /*
        */
        this.#makeLoading();
        await this.#load();
        //this._.O.viewer.querySelector('[name="error"]').style.display = 'none';
        this._.O.viewer.querySelector('[name="loading"]').style.display = 'block';
        const book = this.#makeBookDiv();
        this._.footer.make(book, calc, {});
//        footer.style.bottom = (2===this._.O.columnCount ? '0' : '0');
        //for await (let page of this._.splitter.generateAsync()) {
        for await (let page of this._.splitter.generateAsync(this._.O.viewer)) {
            console.log('ページ数:',page.dataset.page)
            book.appendChild(page);
            this._.O.viewer.querySelector('[name="loading-all-page"]').textContent = page.dataset.page;
            this._.O.viewer.querySelector('[name="loading-rate"]').textContent = `${this._.parser.body.progress.rate.toFixed(100===this._.parser.body.progress.rate ? 0 : 1)}%`;
            /*
            this._.O.viewer.appendChild(page);
            this._.O.viewer.querySelector('[name="loading-all-page"]').textContent = page.dataset.page;
            this._.O.viewer.querySelector('[name="loading-rate"]').textContent = `${this._.parser.body.progress.rate.toFixed(100===this._.parser.body.progress.rate ? 0 : 1)}%`;
            */
        }
        this._.O.viewer.appendChild(this._.footer.el); // 末尾に移動する
        this._.O.viewer.querySelector('[name="loading"]').style.display = 'none';
//        footer.style.visibility = 'hidden';
//        footer.style.display = 'flex';
        // ノンブルを表示する（未実装）
//        this._.O.viewer.querySelector('[name="loading-all-page"]').textContent = `${this._.O.viewer.querySelector(`[data-page]:last-child`).dataset.page}`;
//        this._.O.viewer.querySelector('[name="loading-all-page"]').textContent = `${book.querySelector(`[data-page]:last-child`).dataset.page}`;
        //this._.O.viewer.querySelector('.page:not(.dummy)').classList.add('show');
        book.querySelector('.page:not(.dummy)').classList.add('show');
        this._.O.viewer.querySelector(`[name="footer"] [name="allPage"]`).textContent = this._.O.viewer.querySelector('[name="loading-all-page"]').textContent;
        this._.footer.title = this._.parser.meta.javel.title;
        this._.footer.subTitle = '';
        this._.footer.allPage = parseInt(this._.O.viewer.querySelector('[name="loading-all-page"]').textContent);
        this._.footer.nowPage = 0;
        this.#listen();
        this._.O.viewer.focus();
    }
    #listen() {
        console.log('listen()');
        this._.O.viewer.addEventListener('click', async(e)=>{
            if (!this._.loaded) {return}
            const nowPage = this._.O.viewer.querySelector('.page.show:not(.dummy)');
            console.log(nowPage)
            if (this.#isHorizontal) {
                if (this.#isClickLeft(e.clientX)) {this.#prevPage(nowPage)}
                else {this.#nextPage(nowPage)}
            } else {
                if (this.#isClickRight(e.clientX)) {this.#prevPage(nowPage)}
                else {this.#nextPage(nowPage)}
            }
            console.log(this.#isHorizontal, this.#isClickLeft(e.clientX), this._.O.viewer.width, this._.O.viewer.height);
        });
        this._.O.viewer.setAttribute('tabindex', '0');
        this._.O.viewer.addEventListener('keyup', async(e)=>{
            console.log('keyup:', e);
            if (!this._.loaded) {return}
            const nowPage = this._.O.viewer.querySelector('.page.show:not(.dummy)');
            if (e.shiftKey) {
                if ([' ', 'Enter'].some(k=>k===e.key)) {this.#prevPage(nowPage);}
            } else {
                if ([' ', 'Enter'].some(k=>k===e.key)) {this.#nextPage(nowPage);}
                else if ('Escape'===e.key) {} // 設定画面表示
                else if ('ArrowLeft'===e.key) {this.#isHorizontal ? this.#prevPage(nowPage) : this.#nextPage(nowPage);}
                else if ('ArrowRight'===e.key) {this.#isHorizontal ? this.#nextPage(nowPage) : this.#prevPage(nowPage);}
                else if ('n'===e.key) {this.#nextPage(nowPage)}
                else if ('p'===e.key) {this.#prevPage(nowPage)}
            }
        });
    }
    #isValidWritingMode(v) {return ['horizontal-tb', 'vertical-rl'].some(n=>n===v)}
    get #isHorizontal() {return this._.O.writingMode.startsWith('h')}
    get #isVertical() {return this._.O.writingMode.startsWith('v')}
    #isClickLeft(x, y) {return x < (this._.O.width / 2)}//画面を左右に二分割したとき左半分をクリックしたか
    #isClickRight(x, y) {return (this._.O.width / 2) <= x}//画面を左右に二分割したとき左半分をクリックしたか
    #nextPage(nowPage) {
        if (nowPage.nextElementSibling) {
            if (this.#isSelection) {return}
            console.log('次に進む', nowPage);
            if (!nowPage.nextElementSibling.classList.contains('page') || nowPage.nextElementSibling.classList.contains('dummy')) {}// 最初のページで前に戻ろうとしても次に進む
            else {
                nowPage.nextElementSibling.classList.add('show');
                nowPage.classList.remove('show');
                this._.footer.resetContent();
            }
        //} else {this.#prevPage(nowPage)} // 最期のページで次に進もうとしても前に戻る
        } // 最期のページで次に進もうとしても何もしない
    }
    #prevPage(nowPage) {
        if (nowPage.previousElementSibling) {
            if (this.#isSelection) {return}
            console.log('前に戻る', nowPage);
            if (!nowPage.previousElementSibling.classList.contains('page') || nowPage.previousElementSibling.classList.contains('dummy')) {this.#nextPage(nowPage)}// 最初のページで前に戻ろうとしても次に進む
            else {
                nowPage.previousElementSibling.classList.add('show');
                nowPage.classList.remove('show');
                this._.footer.resetContent();
            }
        } else {this.#nextPage(nowPage)} // 最初のページで前に戻ろうとしても次に進む
        //} // 最初のページで前に戻ろうとしても何もしない
    }
    get #isSelection() {return 0 < window.getSelection().toString().length;}
}
window.JavelViewer = JavelViewer;
})();
