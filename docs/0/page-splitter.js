class PageSplitter {
    constructor(parser, inlineSize=640, blockSize=480, isHorizontal=false) {
        this._ = {};
        this._.jp = parser;
        this._.size = {inline:inlineSize, block:blockSize}
        this._.writingMode = isHorizontal ? 'horizontal-tb' : 'vertical-rl';
        this._.dummy = new DummyPage();
        //document.body.appendChild(this._.dummy.el);
        this._.pages = [];
    }
    get pages() {return this._.pages}

//    async *generateAsync(manuscript) {
    //async *generateAsync(manuscript, viewer=document.body) {
    async *generateAsync(viewer=document.body) {
        console.log('generateAsync() start');
        this._.dummy.show();
        this._.dummy.addTo(viewer);
        this._.pages = [];
//        this._.jp.manuscript = manuscript;
        yield* this.#makeCover();
//        const cover = this.#makeCover();
//        console.log(cover);
//        cover.dataset.page = 0;
//        this._.pages.push(cover);
//        yield* cover;
        await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
        console.log(this._.jp.body);
        console.log(this._.jp.body.manuscript.length);
        for await (let [el, block, inlines] of this._.jp.body.generateEntriesAsync()) {
            console.log('splitter.generate():', el, block, inlines);
            this._.dummy.el.appendChild(el); // ブロック要素単位（h, p）
            if (this._.dummy.without) {
                console.log('*******generateAsync() without:', el, el.textContent);
                const EL = el.cloneNode(true);
                this._.dummy.el.removeChild(el); // なぜかDOMから削除されるだけでなく要素ごと消えてしまう！のでcloneNode(true)でコピーする。
                console.log('*******generateAsync() without:', el, el.textContent);
                console.log('*******generateAsync() without:', EL, EL.textContent);
                console.log('*******generateAsync() without:', this._.dummy.el.textContent);
//                yield* this.#notInNewPage(); // 一文字も入らないなら新しいページを作る
//                if (this.#isNotInChar) {yield* this.#makePage();}
                if ('P'===el.tagName) {// もしp要素ならinline要素単位で分割し挿入する
//                    yield* this.#makePage(EL);
//                    console.log('*******generateAsync() if:', el.textContent);
//                    this.#makeFirstP(true, parseInt(el.dataset.bi));
//                    yield* await this.#splitNodes([...el.childNodes], inlines, parseInt(el.dataset.bi));
                    this.#makeFirstP(true, parseInt(EL.dataset.bi));
                    yield* await this.#splitNodes([...EL.childNodes], inlines, parseInt(EL.dataset.bi));
                }
                else {//<p>以外のBlockElement単体で画面サイズ超過するのは想定外(h1〜h6(の中にあるruby,em,br等も含めて)。<p>以外のブロック要素は全て単体で画面要素内に収まる事)
                    console.log('*******generateAsync() else:', EL.textContent);
                    yield* this.#makePage(EL);
//                    console.log('*******generateAsync() else:', el.textContent);
//                    yield* this.#makePage(el);
//                    this._.jp.body.progress.now += block.length + 2;
                }
//            } else {this._.jp.body.progress.now += block.length + 2} //+2はTextBlockの区切り文字である二連改行\n\nの文字数
            }
            this._.jp.body.progress.now += block.length + 2; //+2はTextBlockの区切り文字である二連改行\n\nの文字数
            await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
        }
        this._.jp.body.progress.now -= 2; //+2はTextBlockの区切り文字である二連改行\n\nの文字数のうち末尾のものを削除するため
        this._.dummy.hide();
        yield* this.#makePage();
    }
    get #isNotInChar() {
        const p = Dom.tags.p('あ');
        this._.dummy.el.appendChild(p);
        const res = this._.dummy.without;
        this._.dummy.el.removeChild(p);
        return res;
    }
    *#notInNewPage() { // 一文字も入らないなら新しいページを作る
        console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-------------');
        const p = Dom.tags.p('あ');
        this._.dummy.el.appendChild(p);
        if (this._.dummy.without) {this._.dummy.el.removeChild(p); yield* this.#makePage();}
        else {this._.dummy.el.removeChild(p);}
    }
    *#makeCover() {
        this._.dummy.el.append(
            Dom.tags.h1({'data-name':'title'}, ...this._.jp.meta.el.title[0].childNodes),
            Dom.tags.p({'data-name':'author.name'}, ...this._.jp.meta.el.author.name[0].childNodes),
//            this._.jp.meta.el.catch ? Dom.tags.h2({'data-name':'catch'}, ...this._.jp.meta.el.catch[0].childNodes) : null,
//            Dom.tags.p({'data-name':'obi'}, ...this._.jp.meta.el.obi),
        );
        //if (this._.jp.meta.el.catch) {this._.dummy.el.querySelector('[data-name="author.name"]').after(Dom.tags.h2({'data-name':'catch'}, ...this._.jp.meta.el.catch[0].childNodes));}
        if (this._.jp.meta.el.catch) {this._.dummy.el.appendChild(Dom.tags.h2({'data-name':'catch'}, ...this._.jp.meta.el.catch[0].childNodes));}
        if (this._.jp.meta.el.obi) {this._.dummy.el.appendChild(Dom.tags.p({'data-name':'obi'}, ...this._.jp.meta.el.obi));}
        
        /*
        const page = this.#_makePage();
        console.log(page);
        page.classList.add('spread');
        yield page;
        */
        yield* this.#makeSpreadPage();
    }
    async *#splitNodes(nodes, inlines, bi=-1, si=-1) {
        let p = this.#makeFirstP(false, bi, si);
        console.log(p, [...this._.dummy.el.childNodes], this._.dummy.el, nodes.length, nodes, this._.dummy.el.lastElementChild.textContent);
        let i = 0;
        for (i=0; i<nodes.length; i++) {
            p.appendChild(nodes[i]);
            console.log(`#splitNodes():`);
            console.log(nodes[i].textContent);
            console.log(this._.dummy.el.lastElementChild.textContent);
            console.log(p.lastChild.textContent);
            if (this._.dummy.without) {
                console.log(nodes[i].textContent);
                //p.removeChild(nodes[i]); // なぜか削除できない！　TextNodeだから？
                //this._.dummy.el.lastElementChild.removeChild(nodes[i]); // なぜか削除できない！　TextNodeだから？
                nodes[i].remove(); // 削除できる
                console.log(nodes[i].textContent);
                console.log(p.lastChild, p, [...p.childNodes], 'bi:', p.dataset.si);
                console.log(this._.dummy.el.lastElementChild.textContent);
                console.log(p.lastChild?.textContent);
                if (Node.ELEMENT_NODE===p.lastChild?.nodeType && 'BR'===p.lastElementChild?.tagName) {
                    if (-1===si) {si=0; p.dataset.si=si;}
                    yield* this.#makePage(null, bi, si);
//                    this._.jp.body.progress.now += inlines[i].length
                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
                    yield* await this.#splitNodes(nodes.slice(i), inlines.slice(i), bi, si+1);
                }
                else if (Node.TEXT_NODE===nodes[i].nodeType) {
                    yield* await this.#splitSentences(nodes[i].textContent.Sentences, bi, si)
                    p = this._.dummy.el.lastElementChild;
                }
                else {// 再帰する
                    if (-1===si) {si=0; p.dataset.si=si;}
                    yield* this.#makePage(null, bi, si);
//                    this._.jp.body.progress.now += inlines[i].length
                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
                    yield* await this.#splitNodes(nodes.slice(i), inlines.slice(i), bi, si+1);
                }
//            } else {this._.jp.body.progress.now += inlines[i].length}
            }
        }
    }
    #makeLastTextNode(bi=-1, si=-1) {
        const p = this.#makeFirstP(false, bi, si);
        if (Node.TEXT_NODE!==p.lastChild?.nodeType) {p.append(document.createTextNode(''))}
        return p.lastChild;
    }
    async *#splitSentences(sentences, bi=-1, si=-1) {//:node.textContent.Sentences 一文単位の配列
        console.log('#splitSentences():', sentences, bi, si, this._.dummy.el.lastElementChild.textContent);
        if (1===sentences.length) {yield* await this.#splitWords(sentences[0].Words, bi, si);}
        else {
            let lastNode = this.#makeLastTextNode(bi, si);
            for (let i=0; i<sentences.length; i++) {
                lastNode.textContent += sentences[i];
                if (this._.dummy.without) {
                    console.log('#splitSentences() 超過:', bi, si, i, sentences[i], this._.dummy.el.lastElementChild.textContent);
                    lastNode.textContent = lastNode.textContent.slice(0, sentences[i].length*-1);
                    yield* await this.#splitWords(sentences[i].Words, bi, si);
                    lastNode = this._.dummy.el.lastElementChild.lastChild;
                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
//                } else {this._.jp.body.progress.now += sentences[i].length}
                }
            }
        }
    }
    async *#splitWords(words, bi=-1, si=-1) {//:node.textContent.Words 一語単位の配列
        console.log('#splitWords():', words, bi, si);
        if (1===words.length && 15 < words[0].length) {yield* await this.#splitGraphemes(words[0].Graphemes, bi, si);}
        else {
            let lastNode = this.#makeLastTextNode(bi, si);
            for (let i=0; i<words.length; i++) {
                lastNode.textContent += words[i];
                if (this._.dummy.without) {
                    lastNode.textContent = lastNode.textContent.slice(0, words[i].length*-1);
                    if (15 < words[i].length) { // ０１２３４５６７８９０１２３４５６７８９等の単語として分割できない長い文字列なら一字単位で分割する
                        console.log('#splitWords() 超過 15字より多いので一字ずつ分割する:', bi, si, i, words[i]);
                        //lastNode.textContent = lastNode.textContent.slice(0, words[i].length*-1);
                        yield* await this.#splitGraphemes(words[i].Graphemes, bi, si);
                        lastNode = this._.dummy.el.lastElementChild.lastChild;
                        //await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
                    } else {// 単語として分割された（4文字以下であろう）文字列を次のページにまるごと移す
                        console.log('#splitWords() 超過:', bi, si, i, words[i]);
                        yield* this.#makePage(null, bi, si);
                        const p = this.#makeFirstP(true, bi, ++si);
                        console.log(p, words[i]);
                        p.append(words[i]);
                        console.log(p.textContent);
                        lastNode = p.lastChild;
                    }
                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
                    /*
                    console.log('#splitWords() 超過:', bi, si, i, words[i]);
                    lastNode.textContent = lastNode.textContent.slice(0, words[i].length*-1);
                    yield* await this.#splitGraphemes(words[i].Graphemes, bi, si);
                    lastNode = this._.dummy.el.lastElementChild.lastChild;
                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
//                } else {this._.jp.body.progress.now += words[i].length}
                    */
                }
            }
        }
    }
    async *#splitGraphemes(graphemes, bi=-1, si=-1) {//graphemes:node.textContent.Graphemes 一文字単位の配列
        console.log('#splitGraphemes():', graphemes);
        let lastNode = this.#makeLastTextNode(bi, si);
        let p = this._.dummy.el.querySelector(`p:last-child`);
        for (let i=0; i<graphemes.length; i++) {
            lastNode.textContent += graphemes[i];
            console.log('#splitGraphemes() for:', i, graphemes[i]);
            if (this._.dummy.without) {
                console.log('#splitGraphemes() without:', i, graphemes[i], lastNode.textContent);
                lastNode.textContent = lastNode.textContent.slice(0, -1);
                console.log('#splitGraphemes() without:', i, graphemes[i], lastNode.textContent);
                if (0===p.textContent.length) {// 一文字も入らない（si=-1のはず）
                    console.assert(-1===si); // si=-1のはず
                    console.log('si:', si);
                    console.log(lastNode.textContent);
                    this._.dummy.el.removeChild(p);
                    yield* this.#makePage(null, bi, si);
                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
                    lastNode = this.#makeLastTextNode(bi, si);
                    lastNode.textContent = graphemes[i];
                    p = this._.dummy.el.querySelector(`p:last-child`);
                } else {// 一文字以上ある
                    if (-1===si) {p.dataset.si = 0}
                    const SI = parseInt(p.dataset.si);
                    console.assert(-1<SI); // -1<SIのはず
                    console.log('SI:', SI);
                    console.log(lastNode.textContent);
                    yield* this.#makePage(null, bi, SI);
                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
                    lastNode = this.#makeLastTextNode(bi, SI+1);
                    lastNode.textContent = graphemes[i];
                    p = this._.dummy.el.querySelector(`p:last-child`);
                }
            }
            //else {this._.jp.body.progress.now++;}
//            this._.jp.body.progress.now++;
//            this._.jp.body.progress.now += graphemes[i].length;
        }
    }
    #_makePage(n, bi=-1, si=-1) {// n:残留TextNode or 文字列
        // ページを追加する
        const page = this._.dummy.el.cloneNode(true);
        page.classList.remove('dummy');
        page.classList.remove('show');
        page.dataset.page = this._.pages.length + 1;
        this._.pages.push(page);
        console.log('#makePage():', page.dataset.page, this._.pages)
        // ダミーを初期化し残留テキストを追加する
        this._.dummy.el.innerHTML = '';
        this._.dummy.el.append(...this.#getChildren(n, bi, si))
        console.log(`page:${page.dataset.page} now/all:${this._.jp.body.progress.now}/:${this._.jp.body.progress.all} **********************`);
        return page;
    }
    *#makePage(n, bi=-1, si=-1) {// n:残留TextNode or 文字列
        yield this.#_makePage(n, bi=-1, si=-1);
        /*
        // ページを追加する
        const page = this._.dummy.el.cloneNode(true);
        page.classList.remove('dummy');
        page.classList.remove('show');
        page.dataset.page = this._.pages.length + 1;
        this._.pages.push(page);
        console.log('#makePage():', page.dataset.page, this._.pages)
        // ダミーを初期化し残留テキストを追加する
        this._.dummy.el.innerHTML = '';
        this._.dummy.el.append(...this.#getChildren(n, bi, si))
        console.log(`page:${page.dataset.page} now/all:${this._.jp.body.progress.now}/:${this._.jp.body.progress.all} **********************`);
        yield page;
        */
    }
    *#makeSpreadPage(n, bi=-1, si=-1) {// 見開きページ
        const page = this.#_makePage(n, bi, si);
        page.classList.add('spread');
        yield page;
    }
    #getChildren(n, bi=-1, si=-1) {
        if (n instanceof Node && Node.TEXT_NODE===n.nodeType) {return [this.#makeP(bi, si, n)]}
        else if (Type.isStrs(n)) {return [this.#makeP(bi, si, n.join(''))]}
        else if (n instanceof Node) {return [n]}
        else if (Type.isAry(n) && n.every(v=>v instanceof Node)) {return n}
        else if (undefined===n || null===n) {return []}
        else {console.log(n);throw new TypeError(`要素が不正値です。`)}
    }
    #makeFirstP(isForce=false, bi=-1, si=-1) {// isForce:強制作成  dummyに<p>が一つも無いなら作成しDOM追加し返す。但し引数がtrueなら強制的に作成＆追加する
        if (isForce || !this._.dummy.el.querySelector(`p:last-child`)) {this._.dummy.el.appendChild(this.#makeP(bi, si));}
        return this._.dummy.el.querySelector(`p:last-child`);
    }
    #makeP(bi=-1, si=-1, ...nodes) {
        const o = {}
        if (-1<bi) {o['data-bi'] = bi}
        if (-1<si) {o['data-si'] = si}
//        console.log('#makeP():', o, bi, si);
        return Dom.tags.p(o, ...nodes);
    }
}
class Page {
    static make() {return Dom.tags.div({class:'page'})}
    constructor() {this._ = {}; this._.el = Dom.tags.div({class:'page'}); this._.writingMode=Css.get('--writing-mode');}
    get el() {return this._.el}
    //addTo(root=document.body) {if(Type.isEl(root)){root.appendChild(this.el); this._.r = this.el.getBoundingClientRect(); this.#observe();}}
    //addTo(root=document.body) {if(Type.isEl(root)){root.appendChild(this.el); this._.r = this.el.getBoundingClientRect(); this._.b = Css.getFloat(`--page-block-size`);}}
    addTo(root=document.body) {
        if (Type.isEl(root)) {
            root.appendChild(this.el); 
            this._.r = this.el.getBoundingClientRect(); 
            this._.b = Css.getFloat(`--page-block-size`);
            this._.i = Css.getFloat(`--page-inline-size`);
            this._.columnCount = Css.getInt(`--column-count`);
        }
        this._.writingMode = Css.get('--writing-mode');
        console.log('Page.addTo() writingMode:', this._.writingMode);
    }
    show() {this._.el.classList.add('show')}
    hide() {this._.el.classList.remove('show')}
    get isVertical() {return 'vertical-rl'===this._.writingMode}
    set isVertical(v) {if (Type.isBln(v)) {this._.writingMode = v ? 'vertical-rl' : 'horizontal-tb'}}
    get isHorizontal() {return 'horizontal-tb'===this._.writingMode}
    set isHorizontal(v) {if (Type.isBln(v)) {this._.writingMode = v ? 'horizontal-tb' : 'vertical-rl'}}
    get without() {
        if (null===this._.el.lastElementChild) {return false}
//        const R = this.el.getBoundingClientRect();
//        console.log(this._.r.width , R.width, this._.r.height , R.height);
//        return (this._.r.width < R.width) || (this._.r.height < R.height);
//        return this.#isOverflow;
        // writingModeを取得する。block方向に超過したか確認し、超過ならtrueを返す
        const r = this._.el.lastElementChild.getBoundingClientRect();
//        const isB = this.#withoutBlock(r);
//        const isI = this.#withoutInline(r);
//        return isI;
        //console.log('without():', this.#withoutInline(r), 'isV:', this.isVertical, (this._.b < (r.bottom - this._.r.y)), 'blockSize:',this._.b, (r.bottom - this._.r.y), 'bottom:', r.bottom, 'y:', this._.r.y);
//        console.log('without():', this.#withoutInline(r), 'isV:', this.isVertical, (this._.i < (r.bottom - this._.r.y)), 'inlineSize:',this._.i, (r.bottom - this._.r.y), 'bottom:', r.bottom, 'y:', this._.r.y);
        const res = this.isVertical ? this._.r.height < (r.bottom - this._.r.top) : this._.r.width < r.left
        console.log('without():', res, 'isV:', this.isVertical, 'this.H:', this._.r.height, '(bottom-top):', (r.bottom - this._.r.top), 'bottom:', r.bottom, 'this.top:', this._.r.top);
        return res;
        //return this.isVertical ? this._.r.height < r.bottom : this._.r.width < r.left;
        //return this.#withoutInline(r);
//        return this.#withoutInline(r) || this.#withoutBlock(r);
        /*
        const isB = this.#withoutBlock(r);
        const res = (1===this._.columnCount) ? isB : this.#withoutInline(r);
        console.log('without:', res, isB, this.#withoutInline(r));
        console.log('isB.false:', (this._.b < (r.bottom - this._.r.y)));
        console.log('cc:', this._.columnCount, 'isV:',this.isVertical, 'r.left:', r.left, 'b:', this._.b, 'bottom:', r.bottom, 'this.y:', this._.r.y, 'this.width:', this._.r.width, 'right:', r.right);
        return res;
        */
        //return (1===this._.columnCount) ? isB : (isB && this.#withoutInline(r));
        /*
        //return this.isVertical ? (r.left < 0) : (Css.getFloat(`--page-block-size`) < r.bottom);
        const res = this.isVertical ? (r.left < 0) : (this._.b < (r.bottom - this._.r.y)); // block方向の超過真偽
        console.log('without:', res, 'isV:', this.isVertical, 'b:', this._.b , 'bottom:', r.bottom , 'y:', this._.r.y, 'left:', r.left, 'txt:', this._.el.lastElementChild.textContent, 'cc:',this._.columnCount, 'without:', (1 < this._.columnCount) ? (this.isVertical ? (this._.b < (r.bottom - this._.r.y)) : (this._.r.width < r.right)) : res, 'this.width:', this._.r.width, 'right', r.right);
        return (1 < this._.columnCount) ? (res && (this.isVertical ? (this._.b < (r.bottom - this._.r.y))) : (this._.r.width < r.right)) : res;
        //return (res && 1 < this._.columnCount) ? (this.isVertical ? (this._.b < (r.bottom - this._.r.y)) : (this._.r.width < r.right)) : res;
//        return res;
        //return this.isVertical ? (r.left < 0) : (this._.b < (r.bottom - this._.r.y));
        //return this.isVertical ? (r.left < 0) : (Css.getFloat(`--page-block-size`) < r.bottom);
        */
    }
//    get #isOverflow() {console.log('this._.el.clientWidth:', this._.el.clientWidth, 'this._.el.scrollWidth', this._.el.scrollWidth);return this._.el.clientWidth < this._.el.scrollWidth;}
    #withoutBlock(r) {return this.isVertical ? (r.left < 0) : (this._.b < (r.bottom - this._.r.y));}// block方向の超過真偽
    #withoutInline(r) {return this.isVertical ? (this._.r.bottom < r.top) : (this._.r.width < r.right);}// inline方向の超過真偽
    //#withoutInline(r) {return this.isVertical ? (this._.i < (r.bottom - this._.r.y)) : (this._.r.width < r.right);}// inline方向の超過真偽
    /*
    #observe() {
        if (this._.observer) {return}
        this._.observer = new MutationObserver((mutationsList, observer)=>{
            for(const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    this._.r = this.el.getBoundingClientRect();
                }
            }
        });
        this._.observer.observe(this._.el, {
            attributes: true,
            attributeFilter: ['style'],
        });
    }
    */
}
class DummyPage extends Page {constructor() {super(); this._.el.classList.add('dummy');}}

