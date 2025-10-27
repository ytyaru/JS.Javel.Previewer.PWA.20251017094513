(function(){// Manuscript > TextBlock > HTML > Element
/*
class TextBlock {
    constructor() {this._={}; this._.blocks=[];}
    fromText(text) {
        this._.blocks = [];
        if (0===text.trim().length) { return this._.blocks }
        //text = text.replace('\r\n', '\n')
        //text = text.replace('\r', '\n')
        //text = text.replace(/\r\n?/gm, '\n').trimLine();
        text = text.normalizeLineBreaks().trimLine();
        let start = 0;
        for (let match of text.matchAll(/\n\n/gm)) {
            this._.blocks.push(text.slice(start, match.index).trimLine())
            start = match.index + 2
        }
        this._.blocks.push(text.slice(start).trimLine())
        return blocks.filter(v=>v).map(b=>/^#{1,6} /.test(b) ? b.split('\n') : b).flat();
    }
    async *generate(text) {
        this._.blocks = [];
        if (0===text.trim().length) { return this._.blocks }
        //text = text.replace(/\r?\n/gm, '\n')
        //text = text.replace(/\r\n?/gm, '\n').trimLine();
        text = text.normalizeLineBreaks().trimLine();
        let start = 0; let block = null;
        for (let match of text.matchAll(/\n\n/gm)) {
            block = text.slice(start, match.index).trimLine();
            this._.blocks.push(block);
            start = match.index + 2
            yield block;
        }
        block = text.slice(start).trimLine();
        blocks.push(block);
        yield block;
        this._.blocks = blocks.filter(v=>v).map(b=>/^#{1,6} /.test(b) ? b.split('\n') : b).flat();
    }
    get blocks() {return this._.blocks}
}
const tb = new TextBlock();
class ManuscriptBlock {
    constructor(manuscript) {
        this._ = {manuscript:null, blocks:null, coverRng:[0,0], contentRng:[0,0]};
        this.manuscript = manuscript ?? '';
    }
    get manuscript() {return this._.manuscript}
    set manuscript(v) {
//        console.log(v)
        if (!Type.isStr(v)) {throw new TypeError(`原稿はString型であるべきです。`)}
        this._.manuscript = v;
        this._.blocks = tb.fromText(this._.manuscript);
        this.#getContentStartIndex();
    }
    get blocks() {return this._.blocks}
    get covers() {return this._.blocks.slice(...this._.coverRng)}
    get contents() {return this._.blocks.slice(...this._.contentRng)}
    #getContentStartIndex() {
        const firstIdx = this._.blocks.findIndex(b=>b.startsWith('# '));
        const secondIdx = this._.blocks.slice(firstIdx+1).findIndex(b=>b.startsWith('# ')) + firstIdx+1;
//        console.log(firstIdx, secondIdx);
        this._.coverRng = [firstIdx, secondIdx];
        this._.contentRng = [secondIdx, this._.blocks.length];
    }
}
class HtmlParser {
    constructor(blocks) {this._blocks = blocks; this._hasNewline=false;}
    get blocks() {return this._blocks}
    set blocks(v) {if(Type.isStrs(v)){this._blocks = v}}
    get hasNewline() {return this._hasNewline}
    set hasNewline(v) {if(Type.isBln(v)){this._hasNewline = v}}
    get els() {return this.toEls(this._blocks)}
    get html() {return this.toHtmls(this._blocks).join((this._hasNewline) ? '\n' : '')}
    get htmls() {return this.toEls(blocks).map(el=>el.outerHTML)}
    toEls(blocks) {
        if (!Type.isStrs(blocks)) {throw new TypeError(`引数はblocksであるべきです。`)}
        //return blocks.map(b=>((this.#isHeading(b)) ? this.#getHeadingEl(b) : Dom.tags.p(...this.#inlines(b))))
        return blocks.map((b,i)=>{
            const el = ((this.#isHeading(b)) ? this.#getHeadingEl(b,i) : Dom.tags.p(...this.#inlines(b)));
            el.dataset.bi = i;
            return el;
        });
    }
    toHtml(blocks, hasNewline=false) {return this.toHtmls(blocks).join((hasNewline) ? '\n' : '')}
    toHtmls(blocks) {return this.toEls(blocks).map(el=>el.outerHTML)}
    #isHeading(v) {return /^(#{1,6}) (.+)$/.test(v)}
    #getHeadingEl(v) {
        const match = v.match(/^(#{1,6}) (.+)$/);
        const level = match[1].length;
        const inline = match[2];
        return Dom.tags[`h${level}`](...this.#inlines(inline));
    }
    #inlines(block) { 
        const inlines = []; let start = 0;
        for (let d of this.#genBrEmRuby(block)) {
            inlines.push(block.slice(start, d.index))
            inlines.push(d.html)
            start = d.index + d.length
        }
        inlines.push(block.slice(start).trimLine())
        return inlines.filter(v=>v)
    }
    #genBrEmRuby(text) { return [...this.#genBr(this.#matchBr(text)), ...this.#genEm(this.#matchEm(text)), ...this.#genRuby(this.#matchRubyL(text)), ...this.#genRuby(this.#matchRubyS(text))].sort((a,b)=>a.index - b.index) }
    #genBr(matches) { return matches.map(m=>({'match':m, 'html':Dom.tags.br({'data-bis':m.index, 'data-len':m[0].Graphemes.length}), 'index':m.index, 'length':m[0].length})) }
    #matchBr(text) { return [...text.matchAll(/[\r|\r?\n]/gm)] }
    #matchEm(text) { return [...text.matchAll(/《《([^｜《》\n]+)》》/gm)] }
    #genEm(matches) { return matches.map(m=>({'match':m, 'html':Dom.tags.em({'data-bis':m.index, 'data-len':m[0].Graphemes.length}, m[1]), 'index':m.index, 'length':m[0].length}))}
    #matchRubyL(text) { return [...text.matchAll(/｜([^｜《》\n\r]{1,50})《([^｜《》\n\r]{1,20})》/gm)] }
    #matchRubyS(text) { return [...text.matchAll(/([一-龠々仝〆〇ヶ]{1,50})《([^｜《》\n\r]{1,20})》/gm)] }
    #genRuby(matches) { return matches.map(m=>({match:m, html:Dom.tags.ruby({'data-bis':m.index, 'data-len':m[0].Graphemes.length}, m[1], Dom.tags.rp('（'), Dom.tags.rt(m[2]), Dom.tags.rp('）')), 'index':m.index, length:m[0].length})) }
}
const mb = new ManuscriptBlock();
const hp = new HtmlParser();
class JavelParser {
    constructor() {this._ = {mb:mb, hp:hp, htmls:null, els:null, opt:{type:'scroll'}};}
    get text() {return this._.mb.manuscript}
    get blocks() {return this._.mb.blocks}
    get coverBlocks() {return this._.mb.covers}
    get contentBlocks() {return this._.mb.contents}
    get htmls() {return hp.toHtmls(this._.mb.blocks)}
    get coverHtml() {return hp.toHtml(this._.mb.covers)}
    get contentHtml() {return hp.toHtml(this._.mb.contents)}
    get coverHtmls() {return hp.toHtmls(this._.mb.covers)}
    get contentHtmls() {return hp.toHtmls(this._.mb.contents)}
    get els() {return hp.toEls(this._.mb.blocks)}
    get coverEls() {return hp.toEls(this._.mb.covers)}
    get contentEls() {return hp.toEls(this._.mb.contents)}
    set text(v) {this._.mb.manuscript = v; this._.hp.blocks = this._.mb.blocks;}
}
*/
class TextBlock {
    constructor() {this._={}; this._.blocks=[];}
    parse(text) {
        this._.blocks = [];
        if (0===text.trim().length) { return this._.blocks }
        text = text.normalizeLineBreaks().trimLine();
        let start = 0;
        for (let match of text.matchAll(/\n\n/gm)) {
            this._.blocks.push(text.slice(start, match.index).trimLine())
            start = match.index + 2
        }
        this._.blocks.push(text.slice(start).trimLine())
        return this._.blocks.filter(v=>v).map(b=>/^#{1,6} /.test(b) ? b.split('\n') : b).flat();
    }
    *generate(text) {
//        console.log('TextBlock.generate():', text);
        this._.blocks = [];
        if (0===text.trim().length) { return this._.blocks }
        text = text.normalizeLineBreaks().trimLine();
        let start = 0; let block = null;
//        console.log(text, text.matchAll(/\n\n/gm));
        for (let match of text.matchAll(/\n\n/gm)) {
            block = text.slice(start, match.index).trimLine();
            this._.blocks.push(block);
            start = match.index + 2
            yield block;
        }
        block = text.slice(start).trimLine();
        this._.blocks.push(block);
        yield block;
        this._.blocks = this._.blocks.filter(v=>v).map(b=>/^#{1,6} /.test(b) ? b.split('\n') : b).flat();
    }
    get blocks() {return this._.blocks}
}

class HtmlParser {
    constructor(blocks) {this._blocks = blocks; this._hasNewline=false;}
    get blocks() {return this._blocks}
    set blocks(v) {if(Type.isStrs(v)){this._blocks = v}}
    get hasNewline() {return this._hasNewline}
    set hasNewline(v) {if(Type.isBln(v)){this._hasNewline = v}}
    get els() {return this.toEls(this._blocks)}
    get html() {return this.toHtmls(this._blocks).join((this._hasNewline) ? '\n' : '')}
    get htmls() {return this.toEls(blocks).map(el=>el.outerHTML)}
    toElBl(block, bi) {
        const [el, inlines] = this.#getHeadingElBl(block) ?? this.#getParagraphElBl(block);
        if (Type.isInt(bi)) {el.dataset.bi = bi;}
        return [el, inlines]; // [blockのHTML要素, block内を子要素に分割した文字列配列]
    }
    toEl(block, bi) {
        const el = ((this.#isHeading(block)) ? this.#getHeadingEl(block) : Dom.tags.p(...this.#inlines(block)));
        if (Type.isInt(bi)) {el.dataset.bi = bi;}
        return el;
    }
    toEls(blocks) {
        if (!Type.isStrs(blocks)) {throw new TypeError(`引数はblocksであるべきです。`)}
        return blocks.map((b,i)=>this.toEl(b,i));
    }
    toHtml(blocks, hasNewline=false) {return this.toHtmls(blocks).join((hasNewline) ? '\n' : '')}
    toHtmls(blocks) {return this.toEls(blocks).map(el=>el.outerHTML)}
    #isHeading(v) {return /^(#{1,6}) (.+)$/.test(v)}
    #getHeadingElBl(block) {
        const match = block.match(/^(#{1,6}) (.+)$/);
        if (!match) {return null}
        const level = match[1].length;
        const inline = match[2];
        const elbl = this.#inlineElBl(inline);
        return [Dom.tags[`h${level}`](...elbl.map(eb=>eb.html ?? eb.javel)), elbl.map(eb=>eb.javel)];
    }
    #getParagraphElBl(block) {
        const elbl = this.#inlineElBl(block);
        return [Dom.tags.p(...elbl.map(eb=>eb.html ?? eb.javel)), elbl.map(eb=>eb.javel)];
    }
    #getHeadingEl(v) {
        const match = v.match(/^(#{1,6}) (.+)$/);
        const level = match[1].length;
        const inline = match[2];
        return Dom.tags[`h${level}`](...this.#inlines(inline));
    }
    #inlineElBl(block) {
        const inlines = []; let start = 0;
        for (let d of this.#genBrEmRuby(block)) {
            inlines.push({html:null, javel:block.slice(start, d.index)})
            inlines.push({html:d.html, javel:d.match[0]})
            start = d.index + d.length
        }
        inlines.push({html:null, javel:block.slice(start).trimLine()});
        return inlines.filter(v=>v.javel);
    }
    #inlines(block) { 
        const inlines = []; let start = 0;
        for (let d of this.#genBrEmRuby(block)) {
            inlines.push(block.slice(start, d.index))
            inlines.push(d.html)
            start = d.index + d.length
        }
        inlines.push(block.slice(start).trimLine())
        return inlines.filter(v=>v)
    }
    #genBrEmRuby(text) { return [...this.#genBr(this.#matchBr(text)), ...this.#genEm(this.#matchEm(text)), ...this.#genRuby(this.#matchRubyL(text)), ...this.#genRuby(this.#matchRubyS(text))].sort((a,b)=>a.index - b.index) }
    #genBr(matches) { return matches.map(m=>({'match':m, 'html':Dom.tags.br({'data-bis':m.index, 'data-len':m[0].Graphemes.length}), 'index':m.index, 'length':m[0].length})) }
    #matchBr(text) { return [...text.matchAll(/[\r|\r?\n]/gm)] }
    #matchEm(text) { return [...text.matchAll(/《《([^｜《》\n]+)》》/gm)] }
    #genEm(matches) { return matches.map(m=>({'match':m, 'html':Dom.tags.em({'data-bis':m.index, 'data-len':m[0].Graphemes.length}, m[1]), 'index':m.index, 'length':m[0].length}))}
    #matchRubyL(text) { return [...text.matchAll(/｜([^｜《》\n\r]{1,50})《([^｜《》\n\r]{1,20})》/gm)] }
    #matchRubyS(text) { return [...text.matchAll(/([一-龠々仝〆〇ヶ]{1,50})《([^｜《》\n\r]{1,20})》/gm)] }
    #genRuby(matches) { return matches.map(m=>({match:m, html:Dom.tags.ruby({'data-bis':m.index, 'data-len':m[0].Graphemes.length, 'data-piped':m[0].startsWith('｜')}, m[1], Dom.tags.rp('（'), Dom.tags.rt(m[2]), Dom.tags.rp('）')), 'index':m.index, length:m[0].length})) }
}
class JavelMeta {// https://github.com/nodeca/js-yaml 依存
    constructor(bp,hp,manuscript) {
        this._={manuscript:null, javel:null, text:null, el:null, bp:bp, hp:hp};
        this.manuscript = manuscript;
    }
    get manuscript() {return this._.manuscript}
    set manuscript(v) {if(Type.isStr(v)){this._.manuscript=v; this.parse();}}
    set #manuscript(v) {if(Type.isStr(v)){this._.manuscript=v;}}
    parse(manuscript) {
        this.#manuscript = manuscript;
        if (!Type.isStr(this.manuscript)) {console.debug(this.manuscript);throw new TypeError(`manuscriptは文字列型であるべきです。`)}
        if (0===this._.manuscript.length) {console.warn('メタデータがありません。')}
        this._.javel = jsyaml.load(this._.manuscript);
        this._.el = structuredClone(this._.javel);
        this.#parseEl(this._.javel, this._.el);
    }
    get text() {return this._.manuscript}
    get obj() {return this._.obj}
    get keys() {return Object.keys(this._.javel)}
    get javel() {return this._.javel}
    get text() {return this._.text}
    get el() {return this._.el}
    #parseEl(jo, eo) {// javel→el
        for (let k of Object.keys(jo)) {
            if (Type.isObj(jo[k])) {this.#parseEl(jo[k], eo[k]);}
            else {eo[k] = this._.hp.toEls(this._.bp.parse(jo[k]));}
        }
    }
}
class Progress {
    constructor(all=0) {this._ = {rate:0, now:0, all:0}; this.clear(all);}
    get rate() {return this._.rate}
    get now() {return this._.now}
    set now(v) {if (Type.isNum(v)) {this._.now = v; this.#calc();}}
    get all() {return this._.all}
    set all(v) {if (Type.isNum(v)) {this._.all = v; this.clear(v);}}
    clear(all=0) {this._.all = all; this._.now = 0; this._.rate = 0;}
    #calc() {
        this._.rate = (this._.now / this._.all) * 100;
        if (100 < this._.rate) {this._.rate=100}
        console.debug(this._.rate, '% *******************************', this._.now , this._.all);
    }
}
class JavelBody {
    constructor(bp,hp,manuscript) {
        this._={manuscript:null, blocks:[], texts:[], els:[], bp:bp, hp:hp, progress:new Progress()};
        this.manuscript = manuscript;
    }
    get manuscript() {return this._.manuscript}
    set manuscript(v) {if(Type.isStr(v)){this._.manuscript=v;this._.progress.clear(v.length);}}
    get blocks() {return this._.blocks}
    get texts() {return this._.texts}
    get els() {return this._.els}
    get progress() {return this._.progress}
    parse(manuscript) {
        this.manuscript = manuscript;
        if (0===this._.manuscript.length) {console.warn('本文がありません。')}
        this._.els = this._.hp.toEls(this._.bp.parse(this._.manuscript));
        return this._.els;
    }
    *generate(manuscript) {
        this.manuscript = manuscript;
        this._.els = []
        let bi = 0;
        for (let block of this._.bp.generate(this.manuscript)) {
            const el = this._.hp.toEl(block, bi);
            this._.els.push(el);
            yield el; bi++;
        }
    }
    async *generateAsync(manuscript) {
        this.manuscript = manuscript;
        this._.els = []
        let bi = 0;
        for (let block of this._.bp.generate(this.manuscript)) {
            const el = this._.hp.toEl(block, bi);
            this._.els.push(el);
            await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
            yield el; bi++;
        }
    }
    async *generateEntriesAsync(manuscript) {
        this.manuscript = manuscript;
        this._.els = []
        let bi = 0;
        for (let block of this._.bp.generate(this.manuscript)) {
            const [el, inlines] = this._.hp.toElBl(block, bi);
            this._.els.push(el);
            await new Promise(resolve => setTimeout(resolve, 0)); // イベントループを解放
            yield [el, block, inlines]; bi++;
        }
    }
}
class JavelParser {
    constructor(manuscript) {
        const bp=new TextBlock(), hp=new HtmlParser();
        this._={manuscript:null, meta:new JavelMeta(bp,hp), body:new JavelBody(bp,hp)};
        this.#parse();
    }
    get manuscript() {return this._.manuscript}
    //set manuscript(v) {if(Type.isStr(v)){this._.manuscript=v.normalizeLineBreaks().trimLine(); this.#parse();}}
    set manuscript(v) {if(Type.isStr(v)){this._.manuscript=v.normalizeLineBreaks().trim(); this.#parse();}}
    get meta() {return this._.meta}
    get body() {return this._.body}
    #parse() {
        if (!Type.isStr(this._.manuscript)) {return}
        // メタ情報
        const fences = [...this._.manuscript.matchAll(/^---/gm)];
        this._.meta.manuscript = (fences.length < 2) ? '' : this._.manuscript.slice(fences[0].index+4, fences[1].index-1).trimLine();
        // 本文
        const firstHeading = this._.manuscript.match(/^# /m);
        this._.body.manuscript = (null===firstHeading) ? '' : this._.manuscript.slice(firstHeading.index).trimLine();
    }
}
window.TextBlock = TextBlock;
window.HtmlParser = HtmlParser;
window.JavelParser = JavelParser;
})();
