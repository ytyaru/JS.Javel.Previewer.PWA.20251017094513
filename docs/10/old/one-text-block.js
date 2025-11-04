class OneTextBlock {
    constructor() {this._={text:null, mi:-1, si:-1, finished:false}; this._.blocks=[]; this._.matches=null;}
    parse(text) {
        if (this._.matches) {// 途中から始める
            for (let match of this._.matches[this._.mi]) {
                const block = this._.text.slice(this._.si, match.index).trimLine();
                this._.blocks.push(block);
                this._.si = match.index + 2;
                return block;
            }
            const lastBlock = text.slice(start).trimLine();
            this._.blocks.push(lastBlock)
            this._.matches=null; this._.mi=-1; this._.si=-1; this._.finished=true;
            return lastBlock;
//            return this._.blocks.filter(v=>v).map(b=>/^#{1,6} /.test(b) ? b.split('\n') : b).flat();
            // 完了したら初期化する（this._.matches=null）
        } else {// 最初から始める
            this._.finished=false;
            this._.text = text.normalizeLineBreaks().trimLine();
            this._.blocks = [];
            this._.matches = text.matchAll(/\n\n/gm);
            if (0===this._.matches.length) {throw new TypeError(`この原稿にはテキストブロックが一つもありません。`)}
            this._.mi = 0;
            this._.si = 0;
            this.parse();// 再帰
        }
    }
    get blocks() {return this._.blocks}
    get finished() {return this._.finished}
}


