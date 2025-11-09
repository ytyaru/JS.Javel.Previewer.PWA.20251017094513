(function(){
class MyElement extends HTMLElement {
    constructor() {super();}
    static get observedAttributes() {return ['myattr'];} // 変更通知するHTML属性名
    attributeChangedCallback(property, oldValue, newValue) {} // HTML属性値が変更された時
    connectedCallback() {} // document.append()された時
    disconnectedCallback() {} // document.remove()された時
    connectedMoveCallback() {} // 同一document内の別箇所へ移動した時（Element.moveBefore() 等）
    adoptedCallback() {} // 別ドキュメントに移動した時（iframe間やDocument.adoptNode()）
}
customElements.define('my-element', MyElement); // <my-element></my-element>
})();
