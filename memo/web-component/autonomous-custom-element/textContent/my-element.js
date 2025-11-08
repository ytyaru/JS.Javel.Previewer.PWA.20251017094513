(function(){
class MyElement extends HTMLElement {// 全画面時のみ時分HH:MMを表示する。縦書き時縦中横にする。
    constructor() {super(); this._={els:{}, attrs:{}, textContent:'', innerText:'', innerHTML:'', shadow:null};}
    static get observedAttributes() {return ['myattr'];}
    attributeChangedCallback(property, oldValue, newValue) { // HTML属性値が変更された時
        if ('myattr'===property) {this._.attrs.myattr = newValue; this.#update();}
    }
    connectedCallback() { // documentにappend()された時
        this._.shadow = this.attachShadow({mode:'closed'});
        this._.els.span = document.createElement('span');
        this._.shadow.append(this._.els.span);
        //this._.textContent = (this.querySelector('pre') ? this.querySelector('pre').textContent : this.textContent).trim();
        //this._.textContent = this.textContent.trim(); // 先頭と末尾の空白文字は削除する（他多数の文字を消す https://zenn.dev/cybozu_frontend/articles/ecmascript-trim）
//        this._.textContent = this.textContent; // 先頭と末尾の空白文字は削除する（全角スペースも消えてしまう。改行、タブ、半角スペースのみ消したい）
//        this._.textContent = this.textContent.replace('^[ \n\r\t]{1,}', '').replace('[ \n\r\t]{1,}$', ''); // 先頭と末尾の空白文字は削除する（全角スペースは残す）
        this._.textContent = this.textContent.replace(/^[ \t\n\r]+|[ \t\n\r　]+$/g, ''); // 先頭と末尾の空白文字は削除する（先頭だけは全角スペースを残す）
        this._.innerText = this.innerText;
        this._.innerHTML = this.innerHTML;
        this.innerHTML = '';
        this.#update();
    }
    #update() {if (this._.els.span) {this._.els.span.innerHTML = `これは自律カスタム要素です。<br>myattr属性値は「<span style="color:red; font-weight:bold;">${this._.attrs.myattr}</span>」です。<br>textContentは<span style="color:green; font-weight:bold;">「${this._.textContent.replaceAll('\n', '<br>')}</span>」です。`;}}
    disconnectedCallback() {} // documentからremove()された時
    connectedMoveCallback() {} // 同一document内の別箇所へ移動した時（Element.moveBefore() 等）
    adoptedCallback() {} // 別ドキュメントに移動した時（iframe間やDocument.adoptNode()）
}
customElements.define('my-element', MyElement); // <my-element></my-element>
})();
