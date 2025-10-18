(function(){
class PageFooter {
    constructor() {
        this._ = {};
    }
    make(options) {
        this._.O = {...this.#defaultOptions, ...options};
        this.#makeEl();
    }
    get #defaultOptions() { return {
        isShowTime: true, // 全画面時現在時刻表示是非
//        timeFormat: ``, // 時刻表示方法(横書き:`10:59`, 縦書きは縦中横にするか否か、`:`が直立してしまわぬようにするか非表示にするか、漢字一〇:五九か一〇五九(自衛隊方式)のように表示するか等多数の選択肢がある)
        isShowChapterTitle: true, // 章タイトル表示是非
//        nombreType: `now/all`, // now/all, remain, rate, now        now-remain, now|rate
        digits: 0, // 読了率の内表示する小数点桁数。(0以上の整数)
        nombreFormat: `{now}/{all}`, // 現在頁数{now} 全頁数{all} 残り頁数{remain} 読了率{rate}(=(now/all).toFixed(2))
        isShowWorkTitle: true, // 作品タイトル表示是非
    } }
    
    get #isFullScreen() {return window.screen.height===window.outerHeight && window.screen.width===window.outerWidth}
    #makeEl() {
        const footer = this._.O.viewer.querySelector(`[name="footer"]`);
        if (footer) {footer.style.display = 'none'; footer.innerHTML = ''; return footer;}
        else {
            const f = Dom.tags.div({name:'footer', style:'display:none;justify-content:space-between;padding:0;margin:0;box-sizing:border-box;font-family:monoscape;font-size:16px;line-height:1em;'},
                Dom.tags.div({name:'first', style:'inline-size:33.33%;margin-inline-start:0;box-sizing:border-box;'}, 
                    Dom.tags.div({name:'time', style:`display:${this.#isFullScreen && this._.O.isShowTime ? 'block' : 'none'}`}, 
                        Dom.tags.span({name:'hours', style:'text-combine-upright:all;'}, '00'), 
                        //Dom.tags.span({name:'colon', style:'display:inline;'}, ':'), 
                        Dom.tags.span({name:'colon', style:'text-orientation:mixed;'}, ':'), 
                        Dom.tags.span({name:'minutes', style:'text-combine-upright:all;'}, '00'), 
                    ),
                    Dom.tags.div({name:'subTitle'}, '章タイトル'),
                ),
                Dom.tags.div({name:'center', style:'inline-size:33.33%;margin: auto;box-sizing:border-box;text-align:center;'}, 
                    Dom.tags.div({name:'nombre', style:'inline-size:33.33%;margin: auto;box-sizing:border-box;text-align:center;'}, 
                        Dom.tags.span({name:'nowPage'}, '0'),
                        '/',
                        Dom.tags.span({name:'allPage'}, '0'),
                    ),
                );
                Dom.tags.div({name:'last', style:`inline-size:33.33%;margin-inline-end:0;text-align:right;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`}, 
                    Dom.tags.div({name:'title', style:`inline-size:33.33%;margin-inline-end:0;text-align:right;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`}, '作品名０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９'),
                ),
            );
            this._.O.viewer.appendChild(f); return f;
        }

    }
}
})();
