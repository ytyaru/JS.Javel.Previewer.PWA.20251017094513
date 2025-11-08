(function(){
class FullscreenButton extends HTMLElement {// 全画面ON/OFF切替（screenFullライブラリで管理し、F11キーイベント時もそうする）
    constructor() {
        super();
        this._ = {root:null, timer:0, attrs:{hidden:{type:'boolean', value:false}}, listened:false, keyDisabled:false, clickDisabled:false};
    }
    static get observedAttributes() {return ['hidden'];}
    connectedCallback() {
        if (!this._.root) {this._.root = this.attachShadow({mode:'closed', delegatesFocus:true}); console.log('shadowRoot:', this._.root, this._.root); this.#makeEl(); this.#addListener();}
        /*
        if (!this.querySelector('[name="hours"]')) {
            this.style.lineHeight = '1em';
            this.style.letterSpacing = '0em';
            this.append(
                Dom.tags.span({name:'hours', style:'writing-mode:vertical-rl;text-combine-upright:all;'}, '--'), 
                Dom.tags.span({name:'colon', style:'text-orientation:mixed;'}, ':'), 
                Dom.tags.span({name:'minutes', style:'writing-mode:vertical-rl;text-combine-upright:all;'}, '--'), 
            );
        }
        this.#createTimer();
        this.#addListener();
        this.#setNowTime();
        window.dispatchEvent(new Event('resize'));
        */
    }
    #makeEl() {
//        if ('screenfull' in window) {console.error('https://github.com/sindresorhus/screenfull をロードしてください！');}
        if (!screenfull.isEnabled) {console.error('FullScreen API が未実装です！');}
        if (this._.root.querySelector('full')) {return}
        console.log(document.fullscreenEnabled, screenfull.isEnabled, screenfull.isEnabled, screenfull);
        this._.root.innerHTML = '<style>:host {cursor:pointer;}</style>';
//        this._.root.title = 'Fullscreen';
        //this._.root.innerHTML = '<style>:host {cursor: pointer;} :host:hover{color:red;}</style>';
//        if (this._.root.querySelector('button')) {return}
        const {svg, path} = Dom.tags('http://www.w3.org/2000/svg');
//        const full = svg({name:'full', width:'512', height:'512', viewBox:'0 0 512 512', style:`display:${screenfull.isFullscreen ? 'inline' :'none'}`}, path({fill:'currentColor', d:'M329.142 512H512V329.142h-65.828v117.03H329.14Zm-146.284 0v-65.828H65.828V329.14H0V512ZM329.14 65.828h117.03V182.86H512V0H329.142ZM182.86 0v65.828H65.828V182.86H0V0Z'}));
//        const exist = svg({name:'exist', width:'512', height:'512', viewBox:'0 0 512 512', style:`display:${screenfull.isFullscreen ? 'none' :'inline'}`}, path({fill:'currentColor', d:'M0 182.858h182.858V0h-65.83v117.028H0Zm512 146.284H329.142V512h65.83V394.972H512ZM182.858 512V329.142H0v65.83h117.028V512ZM329.14 0v182.858H512v-65.83H394.972V0Z'}));
        const full = svg({name:'full', width:'2em', height:'2em', viewBox:'0 0 512 512'}, path({fill:'currentColor', d:'M329.142 512H512V329.142h-65.828v117.03H329.14Zm-146.284 0v-65.828H65.828V329.14H0V512ZM329.14 65.828h117.03V182.86H512V0H329.142ZM182.86 0v65.828H65.828V182.86H0V0Z'}));
        const exist = svg({name:'exist', width:'2em', height:'2em', viewBox:'0 0 512 512'}, path({fill:'currentColor', d:'M0 182.858h182.858V0h-65.83v117.028H0Zm512 146.284H329.142V512h65.83V394.972H512ZM182.858 512V329.142H0v65.83h117.028V512ZM329.14 0v182.858H512v-65.83H394.972V0Z'}));
//        this._.root.append(Dom.tags.button({name:'button', onclick:(e)=>screenfull.toggle(e, {navigationUI:'hide'})}, full, exist));
//        this._.root.append(Dom.tags.button({name:'button', onclick:(e)=>{screenfull.toggle(e, {navigationUI:'hide'}); console.log('全画面化ボタンを押した！'); }}, full, exist));
//        this._.root.append(Dom.tags.button({name:'button', onclick:this.#onClick.bind(this)}, full, exist));
        this._.root.append(full, exist);
        console.log('this._.root:', this._.root); 
        this.#toggleIcon();
    }
    //#onClick(e) {screenfull.toggle(e, {navigationUI:'hide'}); console.log('全画面化ボタンを押した！');}
//    #onClick(e) {screenfull.toggle(); console.log('全画面化ボタンを押した！');}
//    #onClick(e) {screenfull.toggle(document.documentElement,{navigationUI:'hide'}); console.log('全画面化ボタンを押した！');}
    async #onClick(e) {
//        window.dispatchEvent(new KeyboardEvent('keydown', {'key':'F11'}));
//        window.dispatchEvent(new KeyboardEvent('keyup', {'key':'F11'}));
        if (!this._.clickDisabled) {
            await screenfull.toggle(document.documentElement,{navigationUI:'hide'});
            console.log('全画面化ボタンを押した！');
        }
    }
    get #fullIcon() {return this._.root.querySelector('[name="full"]')}
    get #existIcon() {return this._.root.querySelector('[name="exist"]')}
    update() {
        this.#fullIcon.style.display = screenfull.isFullscreen ? 'inline' : 'none';
        this.#existIcon.style.display = screenfull.isFullscreen ? 'none' : 'inline';
    }
    #toggleIcon() {
        this.#fullIcon.style.display = screenfull.isFullscreen ? 'inline' : 'none';
        this.#existIcon.style.display = screenfull.isFullscreen ? 'none' : 'inline';
    }



    //disconnectedCallback() {this.#removeTimer(); this.#removeListener();}
    disconnectedCallback() {this.#removeListener();}
    attributeChangedCallback(property, oldValue, newValue) {
        if (!this.#isHas(property)) {return}
        const v = this.#parse(property, newValue);
        this._.attrs[property].value = v;
        if ('hidden'===property) { this.#updateDisplay(); }
    }
    #isHas(k) {return this._.attrs.hasOwnProperty(k)}
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
//        v ? this.#removeTimer() : this.#createTimer();
    }
    #setAttr(k, v) {null===v || 'boolean'===this._.attrs[k].type && !this._.attrs[k].value ? this.removeAttribute(k) : this.setAttribute(k, 'bool'===this._.attrs[k].type ? '' : `${v}`);}
    #updateDisplay() { this.style.display = !this.hidden ? 'inline' : 'none'; }
    /*
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
    get #isFullScreen() {return window.screen.height===window.innerHeight;}
    #updateDisplay() { this.style.display = !this.hidden && this.#isFullScreen ? 'inline' : 'none'; }
    #createTimer() {if (!this._.timer && !this._.attrs.hidden.value) {this._.timer = setInterval(this.#setNowTime.bind(this), 1000);}}
    #removeTimer() {if (this._.timer) {clearInterval(this._.timer); this._.timer=null;}}
    #onFocusIn(e) {this.#setNowTime(); this.#createTimer();}
    #onFocusOut(e) {this.#removeTimer();}
    #onResize(e) {this.#updateDisplay();}
    */
    //#onKeyUp(e) {if ('F11'===e.key) {e.prevendDefault(); screenfull.toggle(e,{navigationUI:'hide'})}}
    //#onKeyDown(e) {if ('F11'===e.key){e.preventDefault(); console.log('F11 keydown e.preventDefault()');}}
    async #onKeyDown(e) {
        if ('F11'===e.key){
            e.preventDefault();
//            console.log('F11 keydown e.preventDefault()');
//            await screenfull.toggle(document.documentElement,{navigationUI:'hide'});
//            console.log('F11キーで全画面化ボタンを押した！:', screenfull.isFullscreen, e);
        }
    }
    async #onKeyUp(e) {
        if ('F11'===e.key) {
            e.preventDefault();
            if (!this._.keyDisabled) {
    //            await screenfull.toggle(e,{navigationUI:'hide'})
                await screenfull.toggle(document.documentElement,{navigationUI:'hide'});
                console.log('F11キーで全画面化ボタンを押した！:', screenfull.isFullscreen, e);
            }
        }
        /*
        if ('F11'===e.key) {e.preventDefault();}
        await screenfull.toggle(document.documentElement,{navigationUI:'hide'});
        console.log('キーで全画面化ボタンを押した！:', screenfull.isFullscreen);
        */
    }
    #onChange(e) {
        this.#toggleIcon();
        console.log('全画面化change:', screenfull.isFullscreen, e);
    }
    //#onResize(e) {this.#toggleIcon();console.log('resize:', screen)}
//    get #isFullScreen() {return window.screen.height===window.innerHeight;}
    #onResize(e) {
//        const isFull = window.screen.height===window.innerHeight;
//        this.#fullIcon.style.display = isFull ? 'inline' : 'none';
//        this.#existIcon.style.display = isFull ? 'none' : 'inline';
        if (this._.timer) {clearTimeout(this._.timer);}
        this._.timer = setTimeout(this.#onResizeTimeout.bind(this), 200);
    }
    #onResizeTimeout() {
        const isFull = window.screen.height===window.innerHeight;
        this.#fullIcon.style.display = isFull ? 'inline' : 'none';
        this.#existIcon.style.display = isFull ? 'none' : 'inline';
    }
    #addListener() {// フォーカスの取得・喪失に合わせてタイマーON/OFF切替。focus/blurだとバブリングして複数回呼び出される。visibilitychangeだと他窓遷移時発火せず。
        if (this._.listened) {return}
        /*
        window.addEventListener('focusin', this.#onFocusIn.bind(this));// 他のウインドウに遷移したときは発火する。最小化したりタブ遷移した時も！
        window.addEventListener('focusout', this.#onFocusOut.bind(this));// 他のウインドウに遷移したときは発火する。最小化したりタブ遷移した時も！
        window.addEventListener('resize', this.#onResize.bind(this));
        */
        //document.addEventListener('keyup', (e)=>{if ('F11'===e.key) {e.prevendDefault(); screenfull.toggle(e,{navigationUI:'hide'})}});
        //window.addEventListener('click', this.#onClick.bind(this));
        this._.root.addEventListener('click', this.#onClick.bind(this));
//        window.addEventListener('keydown', this.#onKeyDown.bind(this));
//        window.addEventListener('keyup', this.#onKeyUp.bind(this));
        window.addEventListener('resize', this.#onResize.bind(this));
        screenfull.onchange(this.#onChange.bind(this));
        this._.listened = true;
    }
    #removeListener() {
        if (!this._.listened) {return}
        //window.removeEventListener('focusin', this.#onFocusIn.bind(this));// 他のウインドウに遷移したときは発火する。最小化したりタブ遷移した時も！
        //window.removeEventListener('focusout', this.#onFocusOut.bind(this));// 他のウインドウに遷移したときは発火する。最小化したりタブ遷移した時も！
        //window.removeEventListener('resize', this.#onResize.bind(this));
        //window.removeEventListener('click', this.#onClick.bind(this));
        this._.root.removeEventListener('click', this.#onClick.bind(this));
//        window.removeEventListener('keydown', this.#onKeyDown.bind(this));
//        window.removeEventListener('keyup', this.#onKeyUp.bind(this));
        window.removeEventListener('resize', this.#onResize.bind(this));
        screenfull.off('change', this.#onChange.bind(this));
        this._.listened = false;
    }
}
customElements.define('fullscreen-button', FullscreenButton); // <fullscreen-button></fullscreen-button>
})();

