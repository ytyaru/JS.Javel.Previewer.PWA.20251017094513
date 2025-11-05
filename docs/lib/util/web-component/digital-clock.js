(function(){
class DigitalClock extends HTMLElement {// 全画面時のみ時分HH:MMを表示する。縦書き時縦中横にする。
    constructor() {
        super();
        this._ = {timer:null, attrs:{hidden:{type:'boolean', value:false}}};
    }
    static get observedAttributes() {return ['hidden'];}
    connectedCallback() {
        this.#updateDisplay();
        const N = 'span';
        const H = document.createElement(N);
        const C = document.createElement(N);
        const M = document.createElement(N);
        H.setAttribute('name', 'hours');
        C.setAttribute('name', 'colon');
        M.setAttribute('name', 'minutes');
        H.style.writingMode = 'vertical-rl';
        H.style.textOrientation = 'upright';
        H.style.textCombineUpright = 'all';
        C.style.textOrientation = 'mixed';
        M.style.writingMode = 'vertical-rl';
        M.style.textOrientation = 'upright';
        M.style.textCombineUpright = 'all';
        H.textContent = '--';
        C.textContent = ':';
        M.textContent = '--';
        this.append(H, C, M);
        this.#createTimer();
        this.#addListener();
        this.#setNowTime();
        window.dispatchEvent(new Event('resize'));
    }
    disconnectedCallback() {this.#removeTimer(); this.#removeListener();}
    attributeChangedCallback(property, oldValue, newValue) {
        if (!this.#isExist(property)) {return}
        const v = this.#parse(property, newValue);
        this._.attrs[property].value = v;
        if ('hidden'===property) { this.#updateDisplay(); }
    }
    #isExist(k) {return this._.attrs.hasOwnProperty(k)}
    #parse(k,v) {
        switch (this._.attrs[k].type) {
            case 'boolean': return (null!==v)
            case 'number': return Number(v)
            case 'integer': return parseInt(v)
            case 'float': return parseFloat(v)
            case 'bigint': return BigInt(v)
            default: return v
        }
    }
    get hidden() {return this._.attrs.hidden.value}
    set hidden(v) {
        this._.attrs.hidden.value = v;
        this.#updateDisplay();
        this.#setAttr('hidden', v);
        v ? this.#removeTimer() : this.#createTimer();
    }
    #setAttr(k, v) {null===v || 'boolean'===this._.attrs[k].type && !this._.attrs[k].value ? this.removeAttribute(k) : this.setAttribute(k, 'bool'===this._.attrs[k].type ? '' : `${v}`);}
    #setNowTime() {
        const now = new Date();
        const M = this.querySelector(`[name="minutes"]`);
        const m = `${now.getMinutes()}`.padStart(2, '0');
        if (m===M.textContent) {return}
        const H = this.querySelector(`[name="hours"]`);
        const h = `${now.getHours()}`.padStart(2, '0');
        this.style.contentVisibility = 'hidden';
        H.textContent = h; M.textContent = m;
        this.style.contentVisibility = 'auto';
    }
    #updateDisplay() { this.style.contentVisibility = `${this._.attrs.hidden.value ? 'hidden' : 'auto'}`; }
    #createTimer() {if (!this._.timer && !this._.attrs.hidden.value) {this._.timer = setInterval(this.#setNowTime.bind(this), 1000);}}
    #removeTimer() {if (this._.timer) {clearInterval(this._.timer); this._.timer=null;}}
    #onFocusIn(e) {this.#setNowTime(); this.#createTimer();}
    #onFocusOut(e) {this.#removeTimer();}
    #onResize(e) {this.hidden = !(window.screen.height===window.innerHeight);}
    #addListener() {// フォーカスの取得・喪失に合わせてタイマーON/OFF切替。focus/blurだとバブリングして複数回呼び出される。visibilitychangeだと他窓遷移時発火せず。
        window.addEventListener('focusin', this.#onFocusIn.bind(this));// 他のウインドウに遷移したときは発火する。最小化したりタブ遷移した時も！
        window.addEventListener('focusout', this.#onFocusOut.bind(this));// 他のウインドウに遷移したときは発火する。最小化したりタブ遷移した時も！
        window.addEventListener('resize', this.#onResize.bind(this));
    }
    #removeListener() {
        window.removeEventListener('focusin', this.#onFocusIn.bind(this));// 他のウインドウに遷移したときは発火する。最小化したりタブ遷移した時も！
        window.removeEventListener('focusout', this.#onFocusOut.bind(this));// 他のウインドウに遷移したときは発火する。最小化したりタブ遷移した時も！
        window.removeEventListener('resize', this.#onResize.bind(this));
    }
}
customElements.define('digital-clock', DigitalClock); // <digital-clock></digital-clock>
})();

