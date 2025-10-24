class OnePageSplitter {
    constructor(parser) {
        this._ = {};
        this._.parser = parser;
        this._.hp = new HtmlParser();
//        this._.size = {inline:inlineSize, block:blockSize}
//        this._.writingMode = isHorizontal ? 'horizontal-tb' : 'vertical-rl';
        this._.dummy = new DummyPage();
        this._.pages = [];
        this._.continue = {bi:-1, si:-1, ni:-1, sentenceI:-1, wordI:-1, graphemeI:-1, mi:-1}; // 次のページ生成はTextBlockのどこから開始か
//        this._.continue = {bi:0, si:0, ni:0, sentenceI:0, wordI:0, graphemeI:0, mi:0}; // 次のページ生成はTextBlockのどこから開始か
        this._.calculating = false; // ページ生成中か
        this._.finished = false; // 全ページ生成済みか
        this._.text = null;
        this._.tbs = null;
    }
    get calculating() {return this._.calculating}
    get finished() {return this._.finished}
    make(viewer, text=null) {// 一ページだけ生成して終了する（TextBlockの生成までは一括で全部行う？）
        if (!text && this._.finished) {return []}
        this._.calculating = true;
        this._.dummy.show();
        this._.dummy.addTo(viewer);
        //if (!this._.text) {this._.finished = false; this._.text = text; this._.parser.body.manuscript = text; this._.calculating = false; this._.dummy.hide(); return [this.makeCover()];}
        if (-1===this._.continue.bi) {this._.finished = false; this._.continue.bi=0; this._.continue.mi=0; this._.text = text; this._.parser.body.manuscript = text; this._.calculating = false; this._.blocks = (new TextBlock()).parse(text);}
        let block = null;
        let pages = [];
        console.log(this._.continue.bi, this._.parser.body.blocks.length, this._.parser);
        while (block = this.#getBlock()) {
//        do {
            //console.log('OnePageSplitter.make() block:', block, this._.blocks, this._.text);
            console.log('OnePageSplitter.make() block:', block, this._.blocks.length, this._.blocks);
            const [el, inlines] = this._.hp.toElBl(block, this._.continue.bi); // TextBlockをHTML要素に変換する
            this._.dummy.el.appendChild(el); // ブロック要素単位（h, p）
            if (this._.dummy.without) {
                const EL = el.cloneNode(true);
                this._.dummy.el.removeChild(el); // なぜかDOMから削除されるだけでなく要素ごと消えてしまう！のでcloneNode(true)でコピーする。
                if ('P'===el.tagName) {// もしp要素ならinline要素単位で分割し挿入する
                    this.#makeFirstP(true, parseInt(EL.dataset.bi));
                    //yield* await this.#splitNodes([...EL.childNodes], inlines, parseInt(EL.dataset.bi));
                    //return this.#splitNodes([...EL.childNodes], inlines, parseInt(EL.dataset.bi));
                    this.#splitNodes([...EL.childNodes], inlines, parseInt(EL.dataset.bi), pages);
                    if (0 < pages.length) {this._.calculating = false; this._.dummy.hide(); return pages}
                }
                else {//<p>以外のBlockElement単体で画面サイズ超過するのは想定外(h1〜h6(の中にあるruby,em,br等も含めて)。<p>以外のブロック要素は全て単体で画面要素内に収まる事。将来の拡張で超過する他要素`<pre>`などが想定される！)
                    console.debug('*******else:', EL.textContent);
                    //yield* this.#makePage(EL);
                    //return this.#makePage(EL);
                    pages.push(this.#makePage(EL));
                    this._.continue.bi++;
                    this._.calculating = false;
                    this._.dummy.hide();
                    return pages;
                }
            }
            this._.parser.body.progress.now += block.length + 2; //+2はTextBlockの区切り文字である二連改行\n\nの文字数
//            await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
            this._.continue.bi++;
        }
        //} while (block = this.#getBlock())
        this._.parser.body.progress.now -= 2; //+2はTextBlockの区切り文字である二連改行\n\nの文字数のうち末尾のものを削除するため
        pages.push(this.#makePage());
        pages.push(this.makeBackCover());
        this._.dummy.hide();
        this._.calculating = false; // ページ生成中か
        this._.finished = true; // 全ページ生成済みか
        this._.text = null;
        this._.continue.bi = -1;
        return pages;
        //yield* this.#makePage();
//        return this.#makePage();
//        return [this.#makePage(), makeBackCover()];

        /*
        if (!this._.calculating && )
        this._.begin = true; this._.end = false;

        this._.begin = false; this._.end = true;
        */
    }
    //#getBlock() {return this._.parser.body.blocks.length <= this._.continue.bi ? null : this._.parser.body.blocks[this._.continue.bi].slice(this._.continue.mi);}
    //#getBlock() {return -1 < this._.continue.bi && this._.continue.bi < this._.parser.body.blocks.length ? this._.parser.body.blocks[this._.continue.bi].slice(this._.continue.mi) : null;}
    //#getBlock() {return -1 < this._.continue.bi && this._.continue.bi < this._.parser.body.blocks.length ? this._.parser.body.blocks[this._.continue.bi].slice(this._.continue.mi) : null;}
    #getBlock() {return -1 < this._.continue.bi && this._.continue.bi < this._.blocks.length ? this._.blocks[this._.continue.bi].slice(this._.continue.mi) : null;}

//    #getEls() {return -1 < this._.continue.bi && this._.continue.bi < this._.parser.body.els.length ? this._.parser.body.blocks[this._.continue.bi].slice(this._.continue.mi) : null;}
    /*
    #getBlock() {
        const b = this._.parser.body.blocks[this._.continue.bi]
        return -1 < this._.continue.mi ? b : b.slice(this._.continue.mi);
    }
    */
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
    //async *#splitNodes(nodes, inlines, bi=-1, si=-1) {
    //#splitNodes(nodes, inlines, bi=-1, si=-1) {
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
//                    return this.#makePage(null, bi, si);
                    //yield* this.#makePage(null, bi, si);
//                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
                    //yield* await this.#splitNodes(nodes.slice(i), inlines.slice(i), bi, si+1);
//                    return this.#splitNodes(nodes.slice(i), inlines.slice(i), bi, si+1);
                }
                else if (Node.TEXT_NODE===nodes[i].nodeType) {
                    // 次回設定値
                    this._.continue.bi = bi;
                    this._.continue.si = si;
                    this._.continue.ni = i;
                    this.#splitSentences(nodes[i].textContent.Sentences, bi, si, pages);
//                    yield* await this.#splitSentences(nodes[i].textContent.Sentences, bi, si)
                    p = this._.dummy.el.lastElementChild;
                }
                else {// 再帰する
                    if (-1===si) {si=0; p.dataset.si=si;}
                    // 次回設定値
                    this._.continue.bi = bi;
                    this._.continue.si = si+1;
                    this._.continue.ni = i;
                    pages.push(this.#makePage(null, bi, si));
                    return this.#splitNodes(nodes.slice(i), inlines.slice(i), bi, si+1);
//                    return this.#makePage(null, bi, si);
//                    yield* this.#makePage(null, bi, si);
//                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
//                    yield* await this.#splitNodes(nodes.slice(i), inlines.slice(i), bi, si+1);
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
    //async *#splitSentences(sentences, bi=-1, si=-1) {//:node.textContent.Sentences 一文単位の配列
    //#splitSentences(sentences, bi=-1, si=-1) {//:node.textContent.Sentences 一文単位の配列
    #splitSentences(sentences, bi=-1, si=-1, pages=[]) {//:node.textContent.Sentences 一文単位の配列
        console.debug('#splitSentences():', sentences, bi, si, this._.dummy.el.lastElementChild.textContent);
        //if (1===sentences.length) {yield* await this.#splitWords(sentences[0].Words, bi, si);}
        //if (1===sentences.length) {return this.#splitWords(sentences[0].Words, bi, si, pages);}
        if (1===sentences.length) {this.#splitWords(sentences[0].Words, bi, si, pages);}
        else {
            let lastNode = this.#makeLastTextNode(bi, si);
            for (let i=0; i<sentences.length; i++) {
                lastNode.textContent += sentences[i];
                if (this._.dummy.without) {
                    this._.continue.sentenceI = i;
                    console.debug('#splitSentences() 超過:', bi, si, i, sentences[i], this._.dummy.el.lastElementChild.textContent);
                    lastNode.textContent = lastNode.textContent.slice(0, sentences[i].length*-1);
                    //yield* await this.#splitWords(sentences[i].Words, bi, si);
                    this.#splitWords(sentences[i].Words, bi, si, pages);
                    lastNode = this._.dummy.el.lastElementChild.lastChild;
//                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
                }
            }
        }
        return pages;
    }
    async *#splitWords(words, bi=-1, si=-1, pages=[]) {//:node.textContent.Words 一語単位の配列
        console.debug('#splitWords():', words, bi, si);
        //if (1===words.length && 15 < words[0].length) {yield* await this.#splitGraphemes(words[0].Graphemes, bi, si);}
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
//                        yield* await this.#splitGraphemes(words[i].Graphemes, bi, si);
//                        lastNode = this._.dummy.el.lastElementChild.lastChild;
                    } else {// 単語として分割されたであろう文字列を次のページにまるごと移す
                        console.debug('#splitWords() 超過:', bi, si, i, words[i]);
                        pages.push(this.#makePage(null, bi, si));
                        const p = this.#makeFirstP(true, bi, ++si);
                        console.debug(p, words[i]);
                        p.append(words[i]);
                        console.debug(p.textContent);
                        lastNode = p.lastChild;
                        /*
                        yield* this.#makePage(null, bi, si);
                        const p = this.#makeFirstP(true, bi, ++si);
                        console.debug(p, words[i]);
                        p.append(words[i]);
                        console.debug(p.textContent);
                        lastNode = p.lastChild;
                        */
                    }
//                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
                }
            }
        }
        return pages;
    }
    //async *#splitGraphemes(graphemes, bi=-1, si=-1) {//graphemes:node.textContent.Graphemes 一文字単位の配列
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
                    /*
                    yield* this.#makePage(null, bi, si);
                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
                    lastNode = this.#makeLastTextNode(bi, si);
                    lastNode.textContent = graphemes[i];
                    p = this._.dummy.el.querySelector(`p:last-child`);
                    */
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
                    /*
                    yield* this.#makePage(null, bi, SI);
                    await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
                    lastNode = this.#makeLastTextNode(bi, SI+1);
                    lastNode.textContent = graphemes[i];
                    p = this._.dummy.el.querySelector(`p:last-child`);
                    */
                }
            }
        }
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
    //*#makePage(n, bi=-1, si=-1) {yield this.#_makePage(n, bi=-1, si=-1);}// n:残留TextNode or 文字列
    //*#makeSpreadPage(n, bi=-1, si=-1) {// 見開きページ
    //#makeSpreadPage(n, bi=-1, si=-1) {// 見開きページ
    #makeSpreadPage(n, bi=-1, si=-1) {// 見開きページ
        const page = this.#makePage(n, bi, si);
        page.classList.add('spread');
        return page;
        //yield page;
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

