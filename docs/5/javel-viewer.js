(function(){
class JavelViewer {
    constructor() {
        this._ = {loaded:false, listened:false}
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
//        Css.set('writing-mode', 'var(--writing-mode)', this._.viewer);
        Css.set('--writing-mode', O.writingMode);
        this._.O = O;
        console.log('設定:', O, !O.javel && (Type.isEl(O.editor) && !!O.editor.value));
    }
    #makeLoading() {
        //if (!this._.O.viewer.querySelector('[name="loading"]')) {
        if (!Dom.q('[name="loading"]')) {
            Dom.q(`[name="overlay"]`).append(
                Dom.tags.div({name:'loading', style:'display:none; font-size:1.25em; color:var(--fg-color); background-color:var(--bg-color); border:8px ridge var(--fg-color);'}, 
                    Dom.tags.span({name:'loading-rate'}, '0'),
                    '　', Dom.tags.span({name:'loading-all-page'}), 'ページ', 
                    Dom.tags.br(),
                    Dom.tags.span({name:'loading-message'}, '読込中……しばしお待ち下さい'),
                ),
            );
            /*
            //this._.O.viewer.append(Dom.tags.div({name:'loading', style:'display:none;'}, 
//            this._.O.viewer.append(Dom.tags.div({name:'loading', style:'display:none; position:fixed; top:0; left:0; width:100%;  height:100%; z-index:999; display:flex; justify-content:center; align-items:center;'}, 
                Dom.tags.span({name:'loading-rate'}, '0'),
                '　', Dom.tags.span({name:'loading-all-page'}), 'ページ', 
                Dom.tags.br(), Dom.tags.span({name:'loading-message'}, '読込中……しばしお待ち下さい'),
            ));
            */
        }
        Dom.q('[name="loading"]').display = 'none';
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
        //else {const b = Dom.tags.div({name:'book', style:';display:block;padding:0;margin:0;box-sizing:border-box;', 'data-all-page':0});this._.O.viewer.appendChild(b); return b;}
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
//        H -= (1===columnCount ? 16 : 0); // -16はfooter
        Css.set('--page-padding-bottom', `${1===columnCount ? 16 : 0}px`);
        

        inlineSize = this.#isVertical ? H : W;
        blockSize = this.#isVertical ? W : H;
        const columnWidth = 1===columnCount ? inlineSize : inlineSize + Css.getFloat('--column-gap')
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
        const calc = this.#setSize();
        console.log('calc:', calc);
        console.log('JavelViewer#setup() writingMode:', Css.get('--writing-mode'), Css.get('--page-inline-size'), Css.get('--page-block-size'), this.#isVertical, this._.O.width, this._.O.height);
        this.#makeLoading();
        await this.#load();
        //this._.O.viewer.querySelector('[name="loading"]').style.display = 'block';
        Dom.q('[name="loading"]').style.display = 'block';

        // 表紙
        if (this._.O.viewer.querySelector('.cover')) {this._.O.viewer.querySelector('.cover').remove();}
        this._.O.viewer.appendChild(this._.splitter.makeCover());
        this._.O.viewer.querySelector('.cover').classList.add('show');

        // 本文
        const book = this.#makeBookDiv();
        //this._.footer.make(book, calc, this._.O.footer);
        this._.footer.make(this._.O.viewer, calc, this._.O.footer);
        this._.O.viewer.style.display = 'block';
//        if (!this._.listened) {this.#listen(); this._.listened=true;} // 操作可能にするのは不可能（ページ追加中に操作するとバグって空ページが大量挿入されてしまう）
//        book.querySelector('.page:not(.dummy)').classList.add('show');
        // それ以降
        for await (let page of this._.splitter.generateAsync(this._.O.viewer)) {
            console.log('ページ数:',page.dataset.page)
            book.appendChild(page);
            Dom.q('[name="loading-all-page"]').textContent = page.dataset.page;
            Dom.q('[name="loading-rate"]').textContent = `${this._.parser.body.progress.rate.toFixed(100===this._.parser.body.progress.rate ? 0 : 1)}%`;
//            this._.O.viewer.querySelector('[name="loading-all-page"]').textContent = page.dataset.page;
//            this._.O.viewer.querySelector('[name="loading-rate"]').textContent = `${this._.parser.body.progress.rate.toFixed(100===this._.parser.body.progress.rate ? 0 : 1)}%`;
        }
        // 裏表紙
        if (this._.O.viewer.querySelector('.back-cover')) {this._.O.viewer.querySelector('.back-cover').remove();}
        this._.O.viewer.appendChild(this._.splitter.makeBackCover());
//        this._.O.viewer.appendChild(this._.footer.el); // 末尾に移動する
        //this._.O.viewer.querySelector('[name="loading"]').style.display = 'none';
        Dom.q('[name="loading"]').style.display = 'none';
//        book.querySelector('.page:not(.dummy)').classList.add('show');
        // ノンブルを表示する（未実装）
//        this._.O.viewer.querySelector(`[name="footer"] [name="allPage"]`).textContent = this._.O.viewer.querySelector('[name="loading-all-page"]').textContent;
        this._.footer.title = this._.parser.meta.javel.title;
        this._.footer.subTitle = '';
        //this._.footer.allPage = parseInt(this._.O.viewer.querySelector('[name="loading-all-page"]').textContent);
        this._.footer.allPage = parseInt(Dom.q('[name="loading-all-page"]').textContent);
        this._.footer.nowPage = 0;
//        this.#listen();
        if (!this._.listened) {this.#listen();this._.listened=true;}
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
                else if ('Escape'===e.key) {if(this._.loaded){this._.O.onClosed();}} // 設定画面表示
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
        if (this.#isSelection) {return}
        console.log('次に進む', nowPage);
        const nextPage = nowPage.classList.contains('cover')
            ? Dom.q('[name="book-in-pages"] .page:not(.dummy):first-child')
            : nowPage.classList.contains('back-cover')
                ? null
                : nowPage.nextElementSibling
                    ? nowPage.nextElementSibling
                    : Dom.q('.back-cover');
                //: nowPage.nextElementSibling;
        if (nextPage) {
            nextPage.classList.add('show');
            nowPage.classList.remove('show');
            this._.footer.resetContent();
        }

        //if (nowPage.nextElementSibling) {
            /*
            if (nowPage.classList.contains('cover')) {
                Dom.q('[name="book-in-pages"] .page:not(.dummy):first-child')
            } else {
                nowPage.nextElementSibling

                }
            console.log(!!nowPage.nextElementSibling, nowPage.classList.contains('cover'));
            const nextPage = nowPage.nextElementSibling
                ? nowPage.nextElementSibling
                : (nowPage.classList.contains('cover') 
                    ? Dom.q('.page:nth-child(2)')
                    //? Dom.q('[name="book-in-pages"]').querySelector('.page:first-child')
                    //? Dom.q('[name="book-in-pages"]').querySelector('.page:not(.dummy):first-child')
                    : Dom.q('.back-cover'));
                //: Dom.q(nowPage.classList.contains('cover') ? '[name="book-in-pages"] > .page:not(.dummy):first-child': '.back-cover');
                //: Dom.q(nowPage.classList.contains('cover') ? '[name="book-in-pages"] .page:not(.dummy):first-child': '.back-cover');
            console.log('nextPage:', nextPage);
            nextPage.classList.add('show');
            nowPage.classList.remove('show');
            this._.footer.resetContent();
            */
            /*
            if (!nowPage.nextElementSibling.classList.contains('page') || nowPage.nextElementSibling.classList.contains('dummy')) {}// 最初のページで前に戻ろうとしても次に進む
            else {
                const nextPage = nowPage.nextElementSibling
                    ? nowPage.nextElementSibling
                    : (nowPage.classList.contains('cover')
                        ? Dom.q('[name="book-in-pages"] .page:not(.dummy):first-child')
                        : Dom.q('.back-cover'));
                const nextPage = (nowPage.classList.contains('cover'))
                    ? Dom.q('[name="book-in-pages"] .page:not(.dummy):first-child')
                    : (nowPage.nextElementSibling) 
                        ? nowPage.nextElementSibling
                        : Dom.q('.back-cover');
                if (nowPage.classList.contains('cover')) {}
                else {nowPage.nextElementSibling.classList.add('show');}
                //nowPage.nextElementSibling.classList.add('show');
                //nowPage.classList.remove('show');
                //this._.footer.resetContent();
            }
            */
        //} else {this.#prevPage(nowPage)} // 最期のページで次に進もうとしても前に戻る
//        } // 最期のページで次に進もうとしても何もしない
    }
    #prevPage(nowPage) {
        console.log('前に戻る', nowPage);
        if (this.#isSelection) {return}

        const prevPage = nowPage.classList.contains('cover')
            ? null
            : nowPage.classList.contains('back-cover')
                ? Dom.q('[name="book-in-pages"] .page:not(.dummy):last-child')
                : (nowPage.previousElementSibling
                    ? nowPage.previousElementSibling
                    : Dom.q('.cover'));
        /*
        const prevPage = nowPage.classList.contains('cover')
            ? null
            : (nowPage.previousElementSibling
                ? nowPage.previousElementSibling
                : Dom.q('.cover'));
                //: nowPage.classList.contains('back-cover') ? Dom.q('back-cover') : null;
        */
        console.log('prevPage:', prevPage, nowPage.previousElementSibling, nowPage.classList.contains('cover'));
        if (prevPage) {
            prevPage.classList.add('show');
            nowPage.classList.remove('show');
            this._.footer.resetContent();
        }
        /*
        const prevPage = !nowPage.classList.contains('cover') && nowPage.previousElementSibling
            ? nowPage.previousElementSibling
            : (nowPage.classList.contains('cover') 
                ? null
                : Dom.q('.cover'));
                //: Dom.q('[name="book-in-pages"]').querySelector('.page:not(.dummy):last-child')); // .back-cover
                //: Dom.q('[name="book-in-pages"] > .page:not(.dummy):last-child')); // .back-cover
        console.log('prevPage:', prevPage);
        if (prevPage) {
            prevPage.classList.add('show');
            nowPage.classList.remove('show');
            this._.footer.resetContent();
        }
        */
            /*
        if (nowPage.previousElementSibling) {
            if (this.#isSelection) {return}
            console.log('前に戻る', nowPage);
            if (!nowPage.previousElementSibling.classList.contains('page') || nowPage.previousElementSibling.classList.contains('dummy')) {this.#nextPage(nowPage)}// 最初のページで前に戻ろうとしても次に進む
            else {
//                nowPage.previousElementSibling.classList.add('show');
//                nowPage.classList.remove('show');
//                this._.footer.resetContent();
            }
        } else {this.#nextPage(nowPage)} // 最初のページで前に戻ろうとしても次に進む
        //} // 最初のページで前に戻ろうとしても何もしない
            */
    }
    get #isSelection() {return 0 < window.getSelection().toString().length;}
}
window.JavelViewer = JavelViewer;
})();
