(function(){
class PageFooter {
    constructor() {this._ = {el:null, setupedTimerSwitch:false, allPage:0, allPageLoaded:false};}
    make(viewer, calc, options={}) {
        console.log('PageFooter.make() options:', options);
        this._.O = {...this.#defaultOptions, ...options};
        console.log('PageFooter.make() this._.O:', this._.O);
        this._.viewer = viewer;
        this._.calc = calc;
        this._.el = this.#makeEl(viewer);
//        this._.timer = null;
        this.#place(viewer, calc);
        console.log('PageFooter.make() this._.O:', this._.O);
        this.#setDisplay();
//        this.#updateTime();
//        this.#setupTimerSwitch();
//        this._.setupedTimerSwitch = true;
//        this.#timeIsShow();
    }
    get el() {return this._.el}
    set title(v) {this._.title=v; this._.el.querySelector(`[name="title"]`).textContent = v}
    set subTitle(v) {this._.subTitle=v; this._.el.querySelector(`[name="subTitle"]`).textContent = v}
    set nowPage(v) {if(Number.isInteger(v)){this._.nowPage=v; if(this._.el){this._.el.querySelector(`[name="nowPage"]`).textContent = v;}}}
    set allPage(v) {
        if(Number.isInteger(v)){
            this._.allPage = v;
            if (this._.el) {
                this._.el.querySelector(`[name="allPage"]`).textContent = v;
                this.#updateRemain();// あと
                this.#updateRate();// 読了率
            }
        }
    }
    //set allPageLoaded(v) {this._.allPageLoaded=!!v; if(this._.el){this._.el.querySelector(`[name="allPageLoaded"]`).style.display=(!!v ? 'none' : 'inline');}}
    set allPageLoaded(v) {
        this._.allPageLoaded=!!v; 
//        if(this._.el){this._.el.querySelector(`[name="allPageLoaded"]`).style.display=(!!v ? 'none' : 'inline');}
//        if(this._.el){this._.el.querySelector(`[name="allPageLoaded"]`).style.display=(!!v ? 'none' : 'inline'); this.#updateLoader();}
        if(this._.el){this.#updateLoader();}
    }
    #updateLoader() {
        if (this._.allPageLoaded) {
            this._.el.querySelector(`[name="loading"]`).style.display = 'none';
            this._.el.querySelector(`[name="loading"]`).style.contentVisibility = 'hidden';
        } else {
            this._.el.querySelector(`[name="loading"]`).style.display = 'block';
            this._.el.querySelector(`[name="loading"]`).style.contentVisibility = 'auto';
        }
    }
    get title() {return this._.title}
    get subTitle() {return this._.subTitle}
    get rate() {return this._.nowPage===this._.allPage ? 1 : this._.nowPage/this._.allPage}
    get percent() {return this.rate * 100}
    get nowPage() {return this._.nowPage}
    get allPage() {return this._.allPage}
    get remain() {return this._.allPage - this._.nowPage}
    hide() {this._.el.style.visibility = 'hidden';}
    show() {this._.el.style.visibility = 'visible';}
//    #timeIsShow() {this._.el.querySelector('[name="time"]').style.display = `${this.#isFullScreen && this._.O.isShowTime ? 'block' : 'none'}`}
    resetContent() {// ページ遷移時に現在ページ数と章タイトルを変更する
        const page = this._.viewer.querySelector('.page.show:not(dummy)');
        this._.el.style.visibility = (page.classList.contains('spread')) ? 'hidden' : 'visible';//見開きページならフッタ非表示
        this.#updateSubTitle(page);
        this.nowPage = parseInt(page.dataset.page);
        this.#updateRemain();// あと
        this.#updateRate();// 読了率
    }
    #updateRemain() {// あと
        const els = Object.fromEntries('remainUnit remain'.split(' ').map(n=>[n, this._.el.querySelector(`[name="${n}"]`)]));
        if (0 < this.remain) {
            els.remainUnit.style.display = 'inline';
            els.remain.textContent = this.remain;
        } else {
            els.remainUnit.style.display = 'none';
            els.remain.textContent = '完';
        }
    }
    #updateRate() {// 読了率
        const els = Object.fromEntries('integer decimal finished'.split(' ').map(n=>[n, this._.el.querySelector(`[name="${n}"]`)]));
        if (this.rate < 1) {
            els.integer.style.display = 'inline';
            els.decimal.style.display = 'inline';
            els.finished.style.display = 'none';
            const vs = this.percent.toFixed(1).split('.');
            els.integer.textContent = vs[0];
            els.decimal.textContent = `.${vs[1]}`;
        } else {
            els.integer.style.display = 'none';
            els.decimal.style.display = 'none';
            els.finished.style.display = 'inline';
        }
    }
    #updateSubTitle(page) {
        if (['cover', 'back-cover'].some(v=>page.classList.contains(v))) {return}
        const headings = page.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (0 < headings.length) {
            const lastHeading = headings[headings.length - 1].cloneNode(true);
            lastHeading.querySelectorAll('rp, rt').forEach(el=>{el.remove()});
            this.subTitle = lastHeading.textContent;
        }
    }
    get #defaultOptions() { return {
        isShowTime: true, // 全画面時現在時刻表示是非
        isShowSubTitle: true, // 章タイトル表示是非
        isShowTitle: true, // 作品タイトル表示是非
        isShowNowPage: true, // 現在ページ
        isShowAllPage: true, // 全ページ
        isShowRemain: false, // あとNページ
        isShowPercent: false, // 読了率
        // 将来拡張する可能性がある項目
//        timeFormat: ``, // 時刻表示方法(横書き:`10:59`, 縦書きは縦中横にするか否か、`:`が直立してしまわぬようにするか非表示にするか、漢字一〇:五九か一〇五九(自衛隊方式)のように表示するか等多数の選択肢がある)
//        digits: 0, // 読了率の内表示する小数点桁数。(0以上の整数)。でも縦表記でtext-combine-upright:all;で2文字表記するなら小数点と合わせた1桁だけが望ましい。それ以上は小さすぎて読めない。
//        nombreFormat: `{now}/{all}`, // 現在頁数{now} 全頁数{all} 残り頁数{remain} 読了率{rate}(=(now/all).toFixed(2))  「あとn/全n」のような組合せも可能になる。
    } }
    //get #isFullScreen() {return window.screen.height===window.outerHeight && window.screen.width===window.outerWidth}
    get #isFullScreen() {return window.screen.height===window.innerHeight && window.screen.width===window.innerWidth}
    #makeEl(viewer) {
        const footer = Dom.q(`[name="overlay"]`).querySelector(`[name="footer"]`);
        if (footer) {this.hide(); return footer;}
        else {
            const f = Dom.tags.div({name:'footer', style:'visibility:hidden;display:flex;justify-content:space-between;padding:0;margin:0;box-sizing:border-box;font-family:monoscape;font-size:16px;line-height:1em;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'},
                Dom.tags.div({name:'first', style:'display:flex;gap:1em;inline-size:33.33%;margin-inline-start:0;box-sizing:border-box;'}, 
                    /*
                    Dom.tags.div({name:'time', style:`gap:0em;display:${this.#isFullScreen && this._.O.isShowTime ? 'block' : 'none'}`}, 
                        Dom.tags.span({name:'hours', style:'writing-mode:vertical-rl;text-combine-upright:all;'}, '00'), 
                        Dom.tags.span({name:'colon', style:'text-orientation:mixed;'}, ':'), 
                        Dom.tags.span({name:'minutes', style:'writing-mode:vertical-rl;text-combine-upright:all;'}, '00'), 
                    ),
                    */
                    Dom.tags.div({name:'subTitle', style:'box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'}, '章タイトル'),
                ),
                Dom.tags.div({name:'center', style:'inline-size:33.33%;margin:auto;box-sizing:border-box;text-align:center;display:flex;justify-content:center;'}, 
                    //Dom.tags.div({name:'loading', class:'loading'}),
                    //Dom.tags.div({name:'loading', class:'loading-box'}, Dom.tags.div({class:'loading-item'})),
                    Dom.tags.div({name:'nombre', style:'display:flex;gap:1em;margin:auto;box-sizing:border-box;text-align:center;;justify-content:center;'}, 
                        Dom.tags.div({name:'loading', class:'loading-item'}),
                        Dom.tags.div({name:'nowAllPage', style:'display:flex;gap:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'}, 
                            Dom.tags.span({name:'nowPage'}, this.nowPage),
                            Dom.tags.span({name:'slash', style:'text-orientation:mixed;'}, '/'), 
                            Dom.tags.span({name:'allPage'}, this.allPage),
//                            Dom.tags.span({name:'allPageLoaded'}, '?'), 
                        ),
                        Dom.tags.div({name:'remainArea', style:'display:flex;gap:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'}, 
                            Dom.tags.span({name: 'remainUnit', style:'writing-mode:vertical-rl;text-combine-upright:all;'}, 'あと'),
                            Dom.tags.span({name:'remain'}, this.remain),
                        ),
                        Dom.tags.div({name:'percent', style:'display:flex;gap:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'}, 
                            Dom.tags.span({name:'finished'}, '100'),
                            Dom.tags.span({name:'integer', style:'writing-mode:vertical-rl;text-combine-upright:all;'}, '0'),
                            Dom.tags.span({name:'decimal', style:'writing-mode:vertical-rl;text-combine-upright:all;'}, '0'),
                            '%'
                        ),
                    ),
                ),
                Dom.tags.div({name:'last', style:`inline-size:33.33%;margin-inline-end:0;text-align:right;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`}, 
                    Dom.tags.div({name:'title', style:`margin-inline-end:0;text-align:right;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`}, '作品名'),
                ),
            );
            Dom.q(`[name="overlay"]`).appendChild(f);
            return f;
        }
    }
    #place(viewer, calc) {// フッタ配置（本文が横書き二段ならフッタは縦書き中央に配置する等。H1=下部H, H2=中央V, V1=下部H, V2=中央H）
        const H = 16; // フッタの高さ／幅
        viewer.style.position = 'relative';
        this._.el.style.position = 'fixed';
        if (2===calc.columnCount) {// 画面中央
            this._.el.style.writingMode = calc.isVertical ? 'horizontal-tb' : 'vertical-rl';
            this._.el.style.textOrientation = calc.isVertical ? 'mixed' : 'upright';
            this.show();
            const r = this._.el.getBoundingClientRect();
            this.hide();
            console.log('footer:', r);
            this._.el.style.top = `${calc.isVertical ? (calc.height/2)-(H/2) : 0}px`;
            this._.el.style.left = `${calc.isVertical ? ((calc.width/2)-(r.width/2)) : (calc.width/2)-(H/2)}px`;
            this._.el.style.width = `${calc.isVertical ? calc.width : H}px`;
            this._.el.style.height = `${calc.isVertical ? H : calc.height}px`;
        } else {// 画面下部
            this._.el.style.writingMode = 'horizontal-tb';
            this._.el.style.textOrientation = 'mixed';
            this._.el.style.top = `${calc.height-H}px`;
            this._.el.style.left = `0px`;
            this._.el.style.width = `${calc.width}px`;
            this._.el.style.height = `${H}px`;
        }
        this._.el.style.zIndex = '10';
    }
    #setDisplay() {
        console.log('PageFooter.#setDisplay(): this._.O:', this._.O);
        document.querySelector(`digital-clock`).hidden = !this._.O.isShowTime;
        console.log('PageFooter.#setDisplay():', !this._.O.isShowTime, Dom.q('[name="isShowTime"]').checked, document.querySelector(`digital-clock`).hidden, document.querySelector(`digital-clock`).style.contentVisibility, [...document.querySelectorAll(`digital-clock`)].length);
//        if (this._.el.querySelector(`digital-clock`)) {this._.el.querySelector(`digital-clock`).hidden = !this._.O.isShowTime;}
//        this._.el.querySelector(`[name="time"]`).style.display = this._.O.isShowTime ? 'block' : 'none';
        this._.el.querySelector(`[name="subTitle"]`).style.display = this._.O.isShowSubTitle ? 'block' : 'none';
        this._.el.querySelector(`[name="title"]`).style.display = this._.O.isShowTitle ? 'block' : 'none';
        this._.el.querySelector(`[name="nowPage"]`).style.display = this._.O.isShowNowPage ? 'inline' : 'none';
        this._.el.querySelector(`[name="allPage"]`).style.display = this._.O.isShowAllPage ? 'inline' : 'none';
        this._.el.querySelector(`[name="slash"]`).style.display = this._.O.isShowNowPage && this._.O.isShowAllPage ? 'inline' : 'none';
        this._.el.querySelector(`[name="remainArea"]`).style.display = this._.O.isShowRemain ? 'flex' : 'none';
        this._.el.querySelector(`[name="percent"]`).style.display = this._.O.isShowPercent ? 'flex' : 'none';
        this.#updateLoader();
//        this._.el.querySelector(`[name="loading"]`).style.display = 'block';
//        this._.el.querySelector(`[name="loading"]`).style.contentVisibility = 'auto';
    }
    /*
    #setNowTime() {
        const now = new Date();
        const H = this._.el.querySelector(`[name="hours"]`);
        const M = this._.el.querySelector(`[name="minutes"]`);
        const h = `${now.getHours()}`.padStart(2, '0');
        const m = `${now.getMinutes()}`.padStart(2, '0');
        if (m!==M.textContent) {H.textContent = h; M.textContent = m;}
//        this._.el.querySelector(`[name="hours"]`).textContent = `${now.getHours()}`.padStart(2, '0');
//        this._.el.querySelector(`[name="minutes"]`).textContent = `${now.getMinutes()}`.padStart(2, '0');
    }
    #createTimer() {if (!this._.timer && this.#isFullScreen && this._.O.isShowTime) {this._.timer = setInterval(this.#setNowTime.bind(this), 1000);}}
    #removeTimer() {if (this._.timer && !(this.#isFullScreen && this._.O.isShowTime)) {clearInterval(this._.timer); this._.timer=null;}}
    #updateTime() {this.#createTimer(); this.#removeTimer();}
    #setupTimerSwitch() {// フォーカスの取得・喪失に合わせてタイマーON/OFF切替。focus/blurだとバブリングして複数回呼び出される。visibilitychangeだと他窓遷移時発火せず。
        window.addEventListener('focusin', (e)=>{this.#setNowTime(); this.#createTimer();});// 他のウインドウに遷移したときは発火する。最小化したりタブ遷移した時も！
        window.addEventListener('focusout', (e)=>{this.#removeTimer();});// 他のウインドウに遷移したときは発火する。最小化したりタブ遷移した時も！
    }
    */
}
window.PageFooter = PageFooter;
})();
