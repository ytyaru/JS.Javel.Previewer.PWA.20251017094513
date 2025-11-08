(function(){
class PageSplitter {
    constructor(parser, loading, footer) {
        this._ = {viewer:null};
        this._.parser = parser;
        this._.loading = loading;
        this._.footer = footer;
        this._.opSplitter = new OnePageSplitter(parser);
        this._.name = this.#typeNames[0];
        this._.interval = null;
        this._.intervalSec= 5;
    }
    get #typeNames() {return ['all', 'one']}
    #validType(v) {return this.#typeNames.some(t=>t===v)}
    get type() {return this._.name}
    set type(v) {if(this.#validType(v)){this._.name=v}}
    get #splitter() {return this._.types.get(this._.name)}
    get calculating() {return this._.opSplitter.calculating;}
    get finished() {return this._.opSplitter.finished;}
    get intervalSec() {return this._.intervalSec}
    set intervalSec(v) {if (Number.isInteger(v)) {this._.intervalSec=v}}
//    get elapsedMs {return this._.elapsedMs}
    async split(viewer) {
        this._.viewer = viewer;
        viewer.style.display = 'block';
        const book = viewer.querySelector(`[name="book-in-pages"]`);
        if (null!==this._.interval) { clearInterval(this._.interval); this._.interval=null; }// 完了する前に戻って再びページ生成されても前回のタイマーを削除する
        this._.opSplitter.init(viewer, this._.parser.body.manuscript);
        // 表紙
        if (viewer.querySelector('.cover')) {viewer.querySelector('.cover').remove();}
        book.prepend(this._.opSplitter.makeCover());
        this._.footer.allPage++;
        // 本文＋裏表紙
        if ('all'===this._.name) {
            this._.loading.show();
            let pages = null;
            while (0 < (pages = this._.opSplitter.make()).length) {
                book.append(...pages);
                this._.loading.update(this._.opSplitter.pages.length, this._.parser.body.progress.rate);
                //this._.loading.update(this._.opSplitter.pages.length, this._.parser.body.progress.percent);
                await wait(0); // これがないとフリーズ状態になり進捗が表示されない！
            }
            this._.footer.allPageLoaded = true;
            this._.loading.hide();
        } else if ('one'===this._.name){
            this.#onInterval();
            this._.interval = setInterval(this.#onInterval.bind(this), this._.intervalSec*1000);
        }
        // ノンブルを表示する（未実装）
        this._.footer.title = this._.parser.meta.javel.title;
        this._.footer.subTitle = '';
        this._.footer.allPage = this._.opSplitter.pages.length
        this._.footer.nowPage = 0;
    }
    #onInterval() {
        const book = this._.viewer.querySelector(`[name="book-in-pages"]`);
        const nowPage = this._.viewer.querySelector('.page.show:not(.dummy)'); // bind(this)したせいか#nowPageがundefinedになるので仕方なく
        if (nowPage) {nowPage.scrollIntoView({behavior:'instant'});}// 元ページに戻す。これがないとなぜか空ページ表示される。
        const pages = this._.opSplitter.make();
        if (0 < pages.length) {book.append(...pages);}
        else {
            clearInterval(this._.interval);
            this._.interval = null;
            this._.footer.allPageLoaded = true;
        }
        this._.footer.allPage = this._.opSplitter.pages.length;
//        Dom.q('loading-icon').rate = this._.footer.rate;
        this._.footer.loading.rate = this._.parser.body.progress.rate;
        if (nowPage) {nowPage.scrollIntoView({behavior:'instant'});}// 元ページに戻す。これがないとなぜか空ページ表示される。
    }
    makeNextPage(nextPage, pagingDisabled) {
        if ('one'===this.type) {
            if (this.calculating) {console.log('ページ計算中につき遷移無視する。');return}
            console.log('finished:', this.finished, 'nextPage:', !!nextPage);
            // 未完了かつ全ページと現在ページが同じかつページ遷移中でないなら一ページずつ追加する
            if (!this.finished && this._.footer.nowPage===this._.footer.allPage && !pagingDisabled) {
                const bookInPages = Dom.q('[name="book-in-pages"]');
                const pages = this._.opSplitter.make();
                console.log('生成したページ数:', pages.length);
                console.log('生成したページのうち最後のページ番号:', pages.at(-1).dataset.page);
                if (0 < pages.length) {
                    bookInPages.append(...pages);
                    if (!nextPage) {nextPage = pages[0];}
                    console.log('次ページ番号:', nextPage.dataset.page);
                    this._.footer.allPage += pages.length;
                    this.#nowPage.scrollIntoView({behavior:'instant'}); // 元ページに戻す
                }
            }
            this._.footer.allPageLoaded = this.finished;
        }
        return nextPage;
    }
    get #nowPage() {return document.querySelector('.page.show:not(.dummy)');}
}
class OnePageSplitter {
    constructor(parser) {
        this._ = {viewer:null};
        this._.parser = parser;
        this._.hp = new HtmlParser();
        this._.dummy = new DummyPage();
        this.init();
    }
    get pages() {return this._.pages}
    get calculating() {return this._.calculating}
    get finished() {return this._.finished}
    init(viewer, manuscript) {
        this._.pages = [];
        this._.continue = {bi:-1, si:-1, ni:-1, sentenceI:-1, wordI:-1, graphemeI:-1, mi:-1}; // 次のページ生成はTextBlockのどこから開始か
        this._.calculating = false; // ページ生成中か
        this._.finished = false; // 全ページ生成済みか
        this._.text = null;
        this._.tbs = null;
        this._.viewer = viewer;
        this._.parser.body.manuscript = manuscript;
        if (manuscript) {
            this._.finished = false; 
            this._.continue.bi = 0; 
            this._.continue.mi = 0; 
            this._.text = manuscript; 
            this._.parser.body.manuscript = manuscript; 
            this._.blocks = (new TextBlock()).parse(manuscript);
        }
    }
    make() {// 一ページだけ生成して終了する（TextBlockの生成までは一括で全部行う？）
        if (this._.finished) {return []}
        this._.calculating = true;
        this._.dummy.show();
        this._.dummy.addTo(this._.viewer);
        let block = null;
        let pages = [];
        console.log(this._.continue.bi, this._.parser.body.blocks.length, this._.parser);
        while (block = this.#getBlock()) {
            console.log('OnePageSplitter.make() block:', block, this._.blocks.length, this._.blocks);
            const [el, inlines] = this._.hp.toElBl(block, this._.continue.bi); // TextBlockをHTML要素に変換する
            this._.dummy.el.appendChild(el); // ブロック要素単位（h, p）
            if (this._.dummy.without) {
                const EL = el.cloneNode(true);
                this._.dummy.el.removeChild(el); // なぜかDOMから削除されるだけでなく要素ごと消えてしまう！のでcloneNode(true)でコピーする。
                if ('P'===el.tagName) {// もしp要素ならinline要素単位で分割し挿入する
                    this.#makeFirstP(true, parseInt(EL.dataset.bi));
                    this.#splitNodes([...EL.childNodes], inlines, parseInt(EL.dataset.bi), -1, pages);
                    console.log('OnePageSplitter.make() if pages.length:', pages.length);
                    if (0 < pages.length) {
                        this._.calculating = false; 
                        this._.dummy.hide(); 
                        this._.continue.bi++;
                        // ダミー内の最終要素のdata-si属性が存在したら、data-bi+1を返す。そうでないならdata-bi
                        return pages
                    }
                }
                else {//<p>以外のBlockElement単体で画面サイズ超過するのは想定外(h1〜h6(の中にあるruby,em,br等も含めて)。<p>以外のブロック要素は全て単体で画面要素内に収まる事。将来の拡張で超過する他要素`<pre>`などが想定される！)
                    console.debug('*******else:', EL.textContent);
                    pages.push(this.#makePage(EL));
                    this._.continue.bi++;
                    this._.calculating = false;
                    this._.dummy.hide();
                    return pages;
                }
            }
            this._.parser.body.progress.now += block.length + 2; //+2はTextBlockの区切り文字である二連改行\n\nの文字数
            this._.continue.bi++;
        }
        this._.parser.body.progress.now -= 2; //+2はTextBlockの区切り文字である二連改行\n\nの文字数のうち末尾のものを削除するため
        pages.push(this.#makePage());
        pages.push(this.makeBackCover());
        this._.dummy.hide();
        this._.calculating = false; // ページ生成中か
        this._.finished = true; // 全ページ生成済みか
        this._.text = null;
        this._.continue.bi = -1;
        return pages;
    }
    #getBlock() {return -1 < this._.continue.bi && this._.continue.bi < this._.blocks.length ? this._.blocks[this._.continue.bi].slice(this._.continue.mi) : null;}
    makeCover() {
        this._.dummy.el.append(
            Dom.tags.h1({'data-name':'title'}, ...this._.parser.meta.el.title[0].childNodes),
            Dom.tags.p({'data-name':'author.name'}, ...this._.parser.meta.el.author.name[0].childNodes),
        );
        if (this._.parser.meta.el.catch) {this._.dummy.el.appendChild(Dom.tags.h2({'data-name':'catch'}, ...this._.parser.meta.el.catch[0].childNodes));}
        if (this._.parser.meta.el.obi) {this._.dummy.el.appendChild(Dom.tags.p({'data-name':'obi'}, ...this._.parser.meta.el.obi));}
        const page = this.#makePage();
        ['spread', 'cover'].map(v=>page.classList.add(v))
        return page;
    }
    makeBackCover() {
        this._.dummy.el.append(
            Dom.tags.h1({'data-name':'title'}, '完'),
            Dom.tags.h2({'data-name':'message'}, '読了ありがとうございました'),
            Dom.tags.p({'data-name':'message'}, 'いかがでしたか？　よろしければ感想などのアクションをどうぞ。'),
            Dom.tags.fieldset(
                Dom.tags.legend('ここだけの話'),
                Dom.tags.button({name:'like'}, Dom.tags.ruby('♥', Dom.tags.rt('ここだけの話'))),
                Dom.tags.input({name:'likeComment', placeholder:'あの展開は良かったが、最後が残念だった。'}),
                Dom.tags.button({name:'impressions'}, '感想'),
                Dom.tags.button({name:'assessment'}, '評価'),
            ),
            Dom.tags.fieldset(
                Dom.tags.legend('筆者に伝えたい'),
                Dom.tags.button({name:'like-to'}, Dom.tags.ruby('♥', Dom.tags.rt('スキ'))),
                Dom.tags.button({name:'send'}, Dom.tags.ruby('🗨', Dom.tags.rt('作者に送る'))),
                Dom.tags.input({name:'sendMessage', placeholder:'面白かったです！'}),
                Dom.tags.button({name:'donate'}, '寄付'),
            ),
            Dom.tags.fieldset(
                Dom.tags.legend('みんなに伝えたい'),
                Dom.tags.button({name:'share'}, '共有'),
                Dom.tags.button({name:'comment'}, Dom.tags.ruby('🗨', Dom.tags.rt('作者に送る'))),
                Dom.tags.input({name:'commentMessage', placeholder:'これは面白い！　お勧めです！'}),
            ),
            Dom.tags.button({name:'reread'}, '最初から読む'),
            Dom.tags.button({name:'reread'}, '最後に戻る'),
            Dom.tags.p({name:'title'}, this._.parser.meta.javel.title),
            Dom.tags.p({name:'author'}, this._.parser.meta.javel.author.name),
        );
        const page = this.#makePage();
        ['spread', 'back-cover'].map(v=>page.classList.add(v))
        return page;
    }
    #splitNodes(nodes, inlines, bi=-1, si=-1, pages=[]) {
        let p = this.#makeFirstP(false, bi, si);
        console.debug(p, [...this._.dummy.el.childNodes], this._.dummy.el, nodes.length, nodes, this._.dummy.el.lastElementChild.textContent);
        let i = 0;
        for (i=0; i<nodes.length; i++) {
            p.appendChild(nodes[i]);
            console.debug(`#splitNodes():`);
            console.debug(nodes[i].textContent);
            console.debug(this._.dummy.el.lastElementChild.textContent);
            console.debug(p.lastChild.textContent);
            if (this._.dummy.without) {
                console.debug(nodes[i].textContent);
                //p.removeChild(nodes[i]); // なぜか削除できない！　TextNodeだから？
                //this._.dummy.el.lastElementChild.removeChild(nodes[i]); // なぜか削除できない！　TextNodeだから？
                nodes[i].remove(); // 削除できる
                console.debug(nodes[i].textContent);
                console.debug(p.lastChild, p, [...p.childNodes], 'bi:', p.dataset.si);
                console.debug(this._.dummy.el.lastElementChild.textContent);
                console.debug(p.lastChild?.textContent);
                if (Node.ELEMENT_NODE===p.lastChild?.nodeType && 'BR'===p.lastElementChild?.tagName) {
                    if (-1===si) {si=0; p.dataset.si=si;}
                    // 次回設定値
                    this._.continue.bi = bi;
                    this._.continue.si = si+1;
                    this._.continue.ni = i;
                    // returnする前にはみ出た部分を再帰で生成する。場合によっては一つのブロックで複数ページ生成することもありうる。これをどう実装するか。
                    pages.push(this.#makePage(null, bi, si));
                    return this.#splitNodes(nodes.slice(i), inlines.slice(i), bi, si+1, pages);
                }
                else if (Node.TEXT_NODE===nodes[i].nodeType) {
                    // 次回設定値
                    this._.continue.bi = bi;
                    this._.continue.si = si;
                    this._.continue.ni = i;
                    this.#splitSentences(nodes[i].textContent.Sentences, bi, si, pages);
                    p = this._.dummy.el.lastElementChild;
                }
                else {// 再帰する
                    if (-1===si) {si=0; p.dataset.si=si;}
                    // 次回設定値
                    this._.continue.bi = bi;
                    this._.continue.si = si+1;
                    this._.continue.ni = i;
                    pages.push(this.#makePage(null, bi, si));
                    return this.#splitNodes(nodes.slice(i), inlines.slice(i), bi, si+1, pages);
                }
            }
        }
        return pages;
    }
    #makeLastTextNode(bi=-1, si=-1) {
        const p = this.#makeFirstP(false, bi, si);
        if (Node.TEXT_NODE!==p.lastChild?.nodeType) {p.append(document.createTextNode(''))}
        return p.lastChild;
    }
    #splitSentences(sentences, bi=-1, si=-1, pages=[]) {//:node.textContent.Sentences 一文単位の配列
        console.debug('#splitSentences():', sentences.length, sentences, bi, si, this._.dummy.el.lastElementChild.textContent);
        if (1===sentences.length) {this.#splitWords(sentences[0].Words, bi, si, pages);}
        else {
            let lastNode = this.#makeLastTextNode(bi, si);
            for (let i=0; i<sentences.length; i++) {
                lastNode.textContent += sentences[i];
                if (this._.dummy.without) {
                    this._.continue.sentenceI = i;
                    console.debug('#splitSentences() 超過:', bi, si, i, sentences[i], this._.dummy.el.lastElementChild.textContent);
                    lastNode.textContent = lastNode.textContent.slice(0, sentences[i].length*-1);
                    this.#splitWords(sentences[i].Words, bi, si, pages);
                    lastNode = this._.dummy.el.lastElementChild.lastChild;
                }
            }
        }
        return pages;
    }
    #splitWords(words, bi=-1, si=-1, pages=[]) {//:node.textContent.Words 一語単位の配列
        console.debug('#splitWords():', words, bi, si);
        if (1===words.length && 15 < words[0].length) {this.#splitGraphemes(words[0].Graphemes, bi, si, pages);}
        else {
            let lastNode = this.#makeLastTextNode(bi, si);
            for (let i=0; i<words.length; i++) {
                lastNode.textContent += words[i];
                if (this._.dummy.without) {
                    this._.continue.wordI = i;
                    lastNode.textContent = lastNode.textContent.slice(0, words[i].length*-1);
                    if (15 < words[i].length) { // ０１２３４５６７８９０１２３４５６７８９等の単語として分割できない長い文字列なら一字単位で分割する
                        console.debug('#splitWords() 超過 15字より多いので一字ずつ分割する:', bi, si, i, words[i]);
                        this.#splitGraphemes(words[i].Graphemes, bi, si, pages);
                        lastNode = this._.dummy.el.lastElementChild.lastChild;
                    } else {// 単語として分割されたであろう文字列を次のページにまるごと移す
                        console.debug('#splitWords() 超過:', bi, si, i, words[i]);
                        pages.push(this.#makePage(null, bi, si));
                        const p = this.#makeFirstP(true, bi, ++si);
                        console.debug(p, words[i]);
                        p.append(words[i]);
                        console.debug(p.textContent);
                        lastNode = p.lastChild;
                    }
                }
            }
        }
        return pages;
    }
    async *#splitGraphemes(graphemes, bi=-1, si=-1, pages=[]) {//graphemes:node.textContent.Graphemes 一文字単位の配列
        console.debug('#splitGraphemes():', graphemes);
        let lastNode = this.#makeLastTextNode(bi, si);
        let p = this._.dummy.el.querySelector(`p:last-child`);
        for (let i=0; i<graphemes.length; i++) {
            lastNode.textContent += graphemes[i];
            console.debug('#splitGraphemes() for:', i, graphemes[i]);
            if (this._.dummy.without) {
                this._.continue.graphemeI= i;
                console.debug('#splitGraphemes() without:', i, graphemes[i], lastNode.textContent);
                lastNode.textContent = lastNode.textContent.slice(0, -1);
                console.debug('#splitGraphemes() without:', i, graphemes[i], lastNode.textContent);
                if (0===p.textContent.length) {// 一文字も入らない（si=-1のはず）
                    console.assert(-1===si); // si=-1のはず
                    console.debug('si:', si);
                    console.debug(lastNode.textContent);
                    this._.dummy.el.removeChild(p);
                    pages.push(this.#makePage(null, bi, si));
                    lastNode = this.#makeLastTextNode(bi, si);
                    lastNode.textContent = graphemes[i];
                    p = this._.dummy.el.querySelector(`p:last-child`);
                } else {// 一文字以上ある
                    if (-1===si) {p.dataset.si = 0}
                    const SI = parseInt(p.dataset.si);
                    console.assert(-1<SI); // -1<SIのはず
                    console.debug('SI:', SI);
                    console.debug(lastNode.textContent);
                    pages.push(this.#makePage(null, bi, SI));
                    lastNode = this.#makeLastTextNode(bi, SI+1);
                    lastNode.textContent = graphemes[i];
                    p = this._.dummy.el.querySelector(`p:last-child`);
                }
            }
        }
        return pages;
    }
    #makePage(n, bi=-1, si=-1) {// n:残留TextNode or 文字列
        // ページを追加する
        const page = this._.dummy.el.cloneNode(true);
        page.classList.remove('dummy');
        page.classList.remove('show');
        page.dataset.page = this._.pages.length + 1;
        this._.pages.push(page);
        console.debug('#makePage():', page.dataset.page, this._.pages)
        // ダミーを初期化し残留テキストを追加する
        this._.dummy.el.innerHTML = '';
        this._.dummy.el.append(...this.#getChildren(n, bi, si))
        console.debug(`page:${page.dataset.page} now/all:${this._.parser.body.progress.now}/:${this._.parser.body.progress.all} **********************`);
        return page;
    }
    #makeSpreadPage(n, bi=-1, si=-1) {// 見開きページ
        const page = this.#makePage(n, bi, si);
        page.classList.add('spread');
        return page;
    }
    #getChildren(n, bi=-1, si=-1) {
        if (n instanceof Node && Node.TEXT_NODE===n.nodeType) {return [this.#makeP(bi, si, n)]}
        else if (Type.isStrs(n)) {return [this.#makeP(bi, si, n.join(''))]}
        else if (n instanceof Node) {return [n]}
        else if (Type.isAry(n) && n.every(v=>v instanceof Node)) {return n}
        else if (undefined===n || null===n) {return []}
        else {console.debug(n);throw new TypeError(`要素が不正値です。`)}
    }
    #makeFirstP(isForce=false, bi=-1, si=-1) {// isForce:強制作成  dummyに<p>が一つも無いなら作成しDOM追加し返す。但し引数がtrueなら強制的に作成＆追加する
        if (isForce || !this._.dummy.el.querySelector(`p:last-child`)) {this._.dummy.el.appendChild(this.#makeP(bi, si));}
        return this._.dummy.el.querySelector(`p:last-child`);
    }
    #makeP(bi=-1, si=-1, ...nodes) {
        const o = {}
        if (-1<bi) {o['data-bi'] = bi}
        if (-1<si) {o['data-si'] = si}
        return Dom.tags.p(o, ...nodes);
    }
}
class Page {
    static make() {return Dom.tags.div({class:'page'})}
    constructor() {this._ = {}; this._.el = Dom.tags.div({class:'page'}); this._.writingMode=Css.get('--writing-mode');}
    get el() {return this._.el}
    addTo(root=document.body) {
        if (Type.isEl(root)) {
            if (!Dom.q('.dummy')) {root.prepend(this.el);} // visibility
            else {this._.el = Dom.q('.dummy');}
            this.show();
            this._.r = this.el.getBoundingClientRect(); 
            this._.b = Css.getFloat(`--page-block-size`);
            this._.i = Css.getFloat(`--page-inline-size`);
            this._.columnCount = Css.getInt(`--column-count`);
        }
        this._.writingMode = Css.get('--writing-mode');
        console.debug('Page.addTo() writingMode:', this._.writingMode);
    }
    show() {this._.el.classList.add('show')}
    hide() {this._.el.classList.remove('show')}
    get isVertical() {return 'vertical-rl'===this._.writingMode}
    set isVertical(v) {if (Type.isBln(v)) {this._.writingMode = v ? 'vertical-rl' : 'horizontal-tb'}}
    get isHorizontal() {return 'horizontal-tb'===this._.writingMode}
    set isHorizontal(v) {if (Type.isBln(v)) {this._.writingMode = v ? 'horizontal-tb' : 'vertical-rl'}}
    get without() {
        if (null===this._.el.lastElementChild) {return false}
        const r = this._.el.lastElementChild.getBoundingClientRect();
        const res = this.isVertical ? this._.r.height < (r.bottom - this._.r.top) : this._.r.width < r.right
        console.debug('without():', res, 'isV:', this.isVertical, 'this.H:', this._.r.height, '(bottom-top):', (r.bottom - this._.r.top), 'bottom:', r.bottom, 'this.top:', this._.r.top);
        return res;
    }
    #withoutBlock(r) {return this.isVertical ? (r.left < 0) : (this._.b < (r.bottom - this._.r.y));}// block方向の超過真偽
    #withoutInline(r) {return this.isVertical ? (this._.r.bottom < r.top) : (this._.r.width < r.right);}// inline方向の超過真偽
}
class DummyPage extends Page {constructor() {super(); this._.el.classList.add('dummy');}}
window.PageSplitter = PageSplitter;
})();

