(function(){
class PageFooter {
    constructor() {this._ = {el:null, setupedTimerSwitch:false};}
    make(viewer, calc, options={}) {
        this._.O = {...this.#defaultOptions, ...options};
        this._.viewer = viewer;
        this._.calc = calc;
        this._.el = this.#makeEl(viewer);
        this._.timer = null;
        this.#place(viewer, calc);
        this.#setDisplay();
        this.#updateTime();
        this.#setupTimerSwitch();
        this._.setupedTimerSwitch = true;
    }
    get el() {return this._.el}
    set title(v) {this._.title=v; this._.el.querySelector(`[name="title"]`).textContent = v}
    set subTitle(v) {this._.subTitle=v; this._.el.querySelector(`[name="subTitle"]`).textContent = v}
    set nowPage(v) {if(Number.isInteger(v)){this._.nowPage=v; this._.el.querySelector(`[name="nowPage"]`).textContent = v;}}
    set allPage(v) {if(Number.isInteger(v)){this._.allPage=v; this._.el.querySelector(`[name="allPage"]`).textContent = v;}}
    get title() {return this._.title}
    get subTitle() {return this._.subTitle}
    get rate() {return this._.nowPage===this._.allPage ? 1 : this._.nowPage/this._.allPage}
    get percent() {return this.rate * 100}
    get nowPage() {return this._.nowPage}
    get allPage() {return this._.allPage}
    get remain() {return this._.allPage - this._.nowPage}
    resetContent() {// ページ遷移時に現在ページ数と章タイトルを変更する
        const page = this._.viewer.querySelector('.page.show:not(dummy)');
        console.log(page.dataset.page, page);
        this._.el.style.display = (page.classList.contains('spread')) ? 'none' : 'flex';//見開きページならフッタ非表示
        this.#updateSubTitle(page);
        this.nowPage = parseInt(page.dataset.page);
        const els = Object.fromEntries('remainUnit remain integer decimal finished'.split(' ').map(n=>[n, this._.el.querySelector(`[name="${n}"]`)]));
        // あと
        if (0 < this.remain) {
            els.remainUnit.style.display = 'inline';
            els.remain.textContent = this.remain;
        } else {
            els.remainUnit.style.display = 'none';
            els.remain.textContent = '完';
        }
        // 読了率
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
        //isShowNowAllPage: true, // 現在ページ／全ページ
        isShowNowPage: true, // 現在ページ
        isShowAllPage: true, // 全ページ
        isShowRemain: false, // あとNページ
        isShowPercent: false, // 読了率
//        timeFormat: ``, // 時刻表示方法(横書き:`10:59`, 縦書きは縦中横にするか否か、`:`が直立してしまわぬようにするか非表示にするか、漢字一〇:五九か一〇五九(自衛隊方式)のように表示するか等多数の選択肢がある)
        //isShowChapterTitle: true, // 章タイトル表示是非
//        nombreType: `now/all`, // now/all, remain, rate, now        now-remain, now|rate
//        digits: 0, // 読了率の内表示する小数点桁数。(0以上の整数)
//        nombreFormat: `{now}/{all}`, // 現在頁数{now} 全頁数{all} 残り頁数{remain} 読了率{rate}(=(now/all).toFixed(2))
//        isShowWorkTitle: true, // 作品タイトル表示是非
    } }
    get #isFullScreen() {return window.screen.height===window.outerHeight && window.screen.width===window.outerWidth}
    #makeEl(viewer) {
        const footer = viewer.querySelector(`[name="footer"]`);
        if (footer) {footer.style.display = 'none'; footer.innerHTML = ''; return footer;}
        else {
//            return Dom.tags.div({name:'footer', style:'display:none;justify-content:space-between;padding:0;margin:0;box-sizing:border-box;font-family:monoscape;font-size:16px;line-height:1em;'},
            const f = Dom.tags.div({name:'footer', style:'display:none;justify-content:space-between;padding:0;margin:0;box-sizing:border-box;font-family:monoscape;font-size:16px;line-height:1em;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'},
                Dom.tags.div({name:'first', style:'display:flex;gap:1em;inline-size:33.33%;margin-inline-start:0;box-sizing:border-box;'}, 
                    Dom.tags.div({name:'time', style:`gap:0em;display:${this.#isFullScreen && this._.O.isShowTime ? 'block' : 'none'}`}, 
                        Dom.tags.span({name:'hours', style:'writing-mode:vertical-rl;text-combine-upright:all;'}, '00'), 
                        //Dom.tags.span({name:'colon', style:'display:inline;'}, ':'), 
                        Dom.tags.span({name:'colon', style:'text-orientation:mixed;'}, ':'), 
                        Dom.tags.span({name:'minutes', style:'writing-mode:vertical-rl;text-combine-upright:all;'}, '00'), 
                    ),
                    Dom.tags.div({name:'subTitle', style:'box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'}, '章タイトル'),
                ),
                Dom.tags.div({name:'center', style:'inline-size:33.33%;margin:auto;box-sizing:border-box;text-align:center;display:flex;justify-content:center;'}, 
                    Dom.tags.div({name:'nombre', style:'display:flex;gap:1em;margin:auto;box-sizing:border-box;text-align:center;;justify-content:center;'}, 
                        Dom.tags.div({name:'nowAllPage', style:'display:flex;gap:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'}, 
                            Dom.tags.span({name:'nowPage'}, this.nowPage),
                            //'/',
                            Dom.tags.span({name:'slash', style:'text-orientation:mixed;'}, '/'), 
//                            Dom.tags.span({name:'slash', style:'text-orientation:sideways;'}, '/'), 
                            Dom.tags.span({name:'allPage'}, this.allPage),
                        ),
                        //Dom.tags.div({name:'remain'}, this.remain),
                        Dom.tags.div({name:'remainArea', style:'display:flex;gap:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'}, 
                            Dom.tags.span({name: 'remainUnit', style:'writing-mode:vertical-rl;text-combine-upright:all;'}, 'あと'),
                            Dom.tags.span({name:'remain'}, this.remain),
                        ),
                        //Dom.tags.div({name:'percent'}, this.percent.toFixed(1), '%'),
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
            viewer.appendChild(f); return f;
        }
    }
    #place(viewer, calc) {// フッタ配置（本文が横書き二段ならフッタは縦書き中央に配置する等。H1=下部H, H2=中央V, V1=下部H, V2=中央H）
        if (2===calc.columnCount) {
            this._.el.style.writingMode = calc.isVertical ? 'horizontal-tb' : 'vertical-rl';
            this._.el.style.textOrientation = calc.isVertical ? 'mixed' : 'upright';
            viewer.style.position = 'relative';
            this._.el.style.display = 'flex';
            const r = this._.el.getBoundingClientRect();
            this._.el.style.display = 'none';
            console.log('footer:', r);
            this._.el.style.position = 'absolute';
            this._.el.style.top = `${calc.isVertical ? (calc.height/2)-(16/2)+(calc.columnGap.px/2) : 0}px`;
            this._.el.style.left = `${calc.isVertical ? ((calc.width/2)-(r.width/2)) : (calc.width/2)-(16/2)}px`;
            this._.el.style.width = `${calc.isVertical ? calc.width : 16}px`;
            this._.el.style.height = `${calc.isVertical ? 16 : calc.height}px`;
        } else {
            this._.el.style.writingMode = 'horizontal-tb';
            this._.el.style.textOrientation = 'mixed';
            viewer.style.position = null;
            this._.el.style.position = null;
            this._.el.style.top = null;
            this._.el.style.left = null;
            this._.el.style.transform = null;
            this._.el.style.width = `${calc.width}px`;
            this._.el.style.height = `16px`;
        }
        this._.el.style.zIndex = '10';
    }
    #setDisplay() {
        this._.el.querySelector(`[name="time"]`).style.display = this._.O.isShowTime ? 'block' : 'none';
        this._.el.querySelector(`[name="subTitle"]`).style.display = this._.O.isShowSubTitle ? 'block' : 'none';
        this._.el.querySelector(`[name="title"]`).style.display = this._.O.isShowTitle ? 'block' : 'none';
        //this._.el.querySelector(`[name="nowAllPage"]`).style.display = this._.O.isShowNowAllPage ? 'flex' : 'none';
        this._.el.querySelector(`[name="nowPage"]`).style.display = this._.O.isShowNowPage ? 'inline' : 'none';
        this._.el.querySelector(`[name="allPage"]`).style.display = this._.O.isShowAllPage ? 'inline' : 'none';
        this._.el.querySelector(`[name="slash"]`).style.display = this._.O.isShowNowPage && this._.O.isShowAllPage ? 'inline' : 'none';
        this._.el.querySelector(`[name="remainArea"]`).style.display = this._.O.isShowRemain ? 'flex' : 'none';
        this._.el.querySelector(`[name="percent"]`).style.display = this._.O.isShowPercent ? 'flex' : 'none';
    }
    #setNowTime() {
        const now = new Date();
        this._.el.querySelector(`[name="hours"]`).textContent = `${now.getHours()}`.padStart(2, '0');
        this._.el.querySelector(`[name="minutes"]`).textContent = `${now.getMinutes()}`.padStart(2, '0');
    }
    #createTimer() {if (!this._.timer && this.#isFullScreen && this._.O.isShowTime) {this._.timer = setInterval(this.#setNowTime.bind(this), 1000);}}
    #removeTimer() {if (this._.timer && !(this.#isFullScreen && this._.O.isShowTime)) {clearInterval(this._.timer); this._.timer=null;}}
    #updateTime() {this.#createTimer(); this.#removeTimer();}
    #setupTimerSwitch() {// フォーカスの取得・喪失に合わせてタイマーON/OFF切替。focus/blurだとバブリングして複数回呼び出される。visibilitychangeだと他窓遷移時発火せず。
        window.addEventListener('focusin', (e)=>{this.#setNowTime(); this.#createTimer();console.log('お帰り');});// 他のウインドウに遷移したときは発火する。最小化したりタブ遷移した時も！
        window.addEventListener('focusout', (e)=>{this.#removeTimer();console.log('いってらっしゃい');});// 他のウインドウに遷移したときは発火する。最小化したりタブ遷移した時も！
    }
}
window.PageFooter = PageFooter;
})();
