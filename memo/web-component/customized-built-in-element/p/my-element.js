(function(){
class MyElement extends HTMLParagraphElement {// 全画面時のみ時分HH:MMを表示する。縦書き時縦中横にする。
    constructor() {super(); this._={els:{}, attrs:{}, textContent:'', shadow:null};}
    static get observedAttributes() {return ['myattr'];}
    attributeChangedCallback(property, oldValue, newValue) { // HTML属性値が変更された時
        if ('myattr'===property) {this._.attrs.myattr = newValue; this.#update();}
    }
    connectedCallback() { // documentにappend()された時
        // DOMException: Element.attachShadow: Unable to attach ShadowDOM
        // Shadowツリーを追加できる要素は限られている。pre要素には追加できずエラーになる。
        // https://developer.mozilla.org/ja/docs/Web/API/Element/attachShadow#%E3%82%B7%E3%83%A3%E3%83%89%E3%82%A6%E3%83%84%E3%83%AA%E3%83%BC%E3%82%92%E8%BF%BD%E5%8A%A0%E3%81%A7%E3%81%8D%E3%82%8B%E8%A6%81%E7%B4%A0
        this._.shadow = this.attachShadow({mode:'closed'});

        this._.els.span = document.createElement('span');
        this._.shadow.append(this._.els.span);
        //this._.textContent = this.querySelector('pre') ? this.querySelector('pre').textContent : this.textContent;
        this._.textContent = this.textContent;
        this.innerHTML = '';
        this.#update();
    }
    #update() {if (this._.els.span) {this._.els.span.innerHTML = `これはカスタム組込要素です。<br>myattr属性値は「<span style="color:red; font-weight:bold;">${this._.attrs.myattr}</span>」です。<br>textContentは<span style="color:green; font-weight:bold;">「${this._.textContent.replaceAll('\n', '<br>')}</span>」です。`;}}
    disconnectedCallback() {} // documentからremove()された時
    connectedMoveCallback() {} // 同一document内の別箇所へ移動した時（Element.moveBefore() 等）
    adoptedCallback() {} // 別ドキュメントに移動した時（iframe間やDocument.adoptNode()）
}
customElements.define('my-element', MyElement, {extends:'p'}); // <p is="my-element"></p>
})();
