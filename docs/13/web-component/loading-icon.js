(function(){
class LoadingIcon extends HTMLElement {// 全画面時のみ時分HH:MMを表示する。縦書き時縦中横にする。
    constructor() {
        super();
        this._ = {
            timer:null, 
            attrs:{
                hidden:{type:'boolean', value:false},
                color:{type:'string', value:'#000'},
                rate:{type:'float', value:-1},
                percent:{type:'string', value:''},
                fig:{type:'integer', value:1}, // percentの小数部における桁数
            },
            listened:false
        };
    }
    static get observedAttributes() {return ['hidden', 'color', 'size', 'rate', 'fig'];}
    connectedCallback() {
        console.log('LoadingIcon.connectedCallback()');
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `<style>
:root {
  --loading-color: #f00;
  --loading-size: 1em;
}
:host {
  /*
  width:100%;
  height:100%;
  */
  font-size: 1em;
  font-family: monoscape;
  line-height: 1em;
  letter-spacing: 0;
  padding: 0;
  margin: 0;
  vertical-align: middle;
  display: inline-block;
  /*
  */
  /*
  display: flex;
  flex-direction: row;
  align-items: flex-center;
  */
  display: flex;
  content-visibility: hidden;
}
.icon {
  width: var(--loading-size);
  height: var(--loading-size);
  border-radius: 50%;
  display: inline-block;
  border-top: calc(var(--loading-size) / 6) solid var(--loading-color);
  border-right: calc(var(--loading-size) / 6) solid transparent;
  -webkit-animation: icon-rotation 1s linear infinite;
          animation: icon-rotation 1s linear infinite;
}
/*.percent {display: inline-block; padding:0; margin:0; line-height:1em;}*/ /* なぜか画面下部に埋もれてしまう */
/*.percent {padding:0; margin:0; line-height:1em;}*/ /* なぜか表示されなくなる */
/*.percent {display: block; padding:0; margin:0; line-height:1em;}*/ /* なぜか表示されなくなる */
/*.percent {padding:0; margin:0; line-height:1em;}*/
.percent {display: none; padding:0; margin:0; line-height:1em;}
.int, .dec {
  /*writing-mode: vertical-rl;*/
  text-orientation: upright;
  text-combine-upright: all;
}
@-webkit-keyframes icon-rotation {
  0% {transform: rotate(0deg);}
  100% {transform: rotate(360deg);}
}
@keyframes icon-rotation {
  0% {transform: rotate(0deg);}
  100% {transform: rotate(360deg);}
}
</style>`
        shadow.append(
            Dom.tags.div({name:'icon', class:'icon'}),
            Dom.tags.div({name:'percent', class:'percent'},
                Dom.tags.span({name:'int', class:'int'}, ''), // 整数部0〜100
                Dom.tags.span({name:'dec', class:'dec'}, ''), // 少数部.0〜.9
                Dom.tags.span({name:'sig', class:'sig'}, ''), // %
            ),
        );
        /*
        this.append(
            Dom.tags.div({name:'loading-icon', class:'loading-icon'}),
            Dom.tags.div({name:'loading-percent', class:'loading-percent'}, 
                Dom.tags.span({name:'loading-percent-int', style:'writing-mode:vertical-rl; text-orientation:upright; text-combine-upright:all;'}, ''), // 整数部0〜100
                Dom.tags.span({name:'loading-percent-dec', style:'writing-mode:vertical-rl; text-orientation:upright; text-combine-upright:all;'}, ''), // 少数部.0〜.9
                Dom.tags.span({name:'loading-percent-sig'}, ''), // %
            ),
        );
        */
        this.#updateDisplay(); 
    }
    get #icon() {return this.shadowRoot.querySelector('[name="icon"]')}
    get #percent() {return this.shadowRoot.querySelector('[name="percent"]')}
    get #int() {return this.shadowRoot.querySelector('[name="int"]')}
    get #dec() {return this.shadowRoot.querySelector('[name="dec"]')}
    get #sig() {return this.shadowRoot.querySelector('[name="sig"]')}
    /*
    adoptedCallback() {
        const size = Css.get('font-size');
        console.log('size:', size);
        if (0===size) {this.size = '16px';}
    }
    */
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
            case 'string': return `${v}`
            default: return v
        }
    }
    // JS用プロパティ
    get hidden() {return this._.attrs.hidden.value}
    set hidden(v) {
        this._.attrs.hidden.value = v;
        this.#updateDisplay();
        this.#setAttr('hidden', v);
    }
    get hiddenPercent() {return 'none'===this.#percent.style.display;}
    set hiddenPercent(v) {this.#percent.style.display = v ? 'none' : 'inline-block'; console.error('this.#percent.style.display:', this.#percent.style.display);}
    get color() {return this._.attrs.color.value}
    set color(v) {
        if (!this.#validColor(v)) {throw new TypeError(`LoadingIcon.colorはCSS色値であるべきです。:${v}`);}
        this._.attrs.color.value = v;
        Css.set('--loading-color', v);
        this.#setAttr('color', v);
    }
    /*
    get size() {return this._.attrs.size.value}
    set size(v) {
        if (!this.#validSize(v)) {throw new TypeError(`LoadingIcon.sizeはCSS色値であるべきです。:${v}`');}
        this._.attrs.size.value = v;
        Css.set('--loading-size', v);
        this.#setAttr('size', v);
    }
    */
    get rate() {return this._.attrs.color.rate}
    set rate(v) {
        if (!Number.isFinite(v)) {throw new TypeError(`LoadingIcon.rateはNumber型の有限数であるべきです。:${v}`);}
        if (v < 0 || 1 < v) {throw new RangeError(`LoadingIcon.rateは0〜1の数値であるべきです。:${v}`);}
        this._.attrs.rate.value = v;
        this.#resetPercent();
        this.#setAttr('rate', v);
    }
    get fig() {return this._.attrs.fig.rate}
    set fig(v) {
        if (!Number.isInteger(v)) {throw new TypeError(`LoadingIcon.figはNumber型の整数値であるべきです。:${v}`);}
        if (v < 0 || 100 < v) {throw new RangeError(`LoadingIcon.figは0〜100の整数値であるべきです。:${v}`);}
        this._.attrs.fig.value = v;
        this.#resetPercent();
        this.#setAttr('fig', v);
    }
    #resetPercent() {
        const R = this._.attrs.rate.value;
        this._.attrs.percent.value = `${1===R ? '完' : (R*100).toFixed(this._.attrs.fig.value)}`;
        const parts = this._.attrs.percent.value.split('.');
        console.log(this, this.#int, this.#dec, this.#sig);
        this.#int.textContent = parts[0];
        this.#dec.textContent = 1===parts.length ? '' : '.'+parts[1];
        this.#sig.textContent = '%';
//        Dom.q('[name="loading-percent-int"]').textContent = parts[0];
//        Dom.q('[name="loading-percent-dec"]').textContent = 1===parts.length ? '' : '.'+parts[1];
//        Dom.q('[name="loading-percent-sig"]').textContent = '%';
    }
    #setAttr(k, v) {null===v || 'boolean'===this._.attrs[k].type && !this._.attrs[k].value ? this.removeAttribute(k) : this.setAttribute(k, 'bool'===this._.attrs[k].type ? '' : `${v}`);}
    #validColor(colorString) {// 色値の妥当性判定
        const s = new Option().style;// ダミー要素に所定の属性をセットして確認する
        s.color = colorString;
        return s.color !== '';// 設定が失敗した（無効な値だった）場合、プロパティは空文字列になる
    }
    #validSize(sizeString) {// サイズ値の妥当性判定
        const s = new Option().style;// ダミー要素に所定の属性をセットして確認する
        s.fontSize = sizeString;
        return s.fontSize !== '';// 設定が失敗した（無効な値だった）場合、プロパティは空文字列になる
    }
    //#updateDisplay() { this.style.display = !this.hidden ? 'inline-block' : 'none'; }
    //#updateDisplay() { this.style.display = !this.hidden ? 'flex' : 'none'; }
    #updateDisplay() { this.style.contentVisibility = this.hidden ? 'hidden' : 'visible'; }
}
customElements.define('loading-icon', LoadingIcon); // <loading-icon></loading-icon>
})();


