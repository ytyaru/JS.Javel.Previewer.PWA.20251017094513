class PageLoadingDialog {// ページ一括生成時に表示するダイアログ
    constructor() {this._ = {elNms:{this:'loading', page:'loadingAllPage', rate:'loadingRate', message:'loadingMessage'}, manuscript:null, page:{all:0, rate:0}};}
    get el() {return Dom.q(`[name="${this._.elNms.this}"]`)}
    get page() {return Dom.q(`[name="${this._.elNms.page}"]`)}
    get rate() {return Dom.q(`[name="${this._.elNms.rate}"]`)}
    show() {this.el.style.display = 'block';}
    hide() {this.el.style.display = 'none';}
    update(allPage, rate) {
        this._.page.all = allPage;
        this._.page.rate = rate;
        this.page.textContent = `${allPage}`;
        this.rate.textContent = `${rate.toFixed(100===rate ? 0 : 1)} %`;
    }
    make() {
        if (!this.el) {
            Dom.q(`[name="overlay"]`).append(
                Dom.tags.div({name:this._.elNms.this, style:'display:none; font-size:1.25em; color:var(--fg-color); background-color:var(--bg-color); border:8px ridge var(--fg-color);'}, 
                    Dom.tags.span({name:this._.elNms.rate}, '0 %'),
                    '　', Dom.tags.span({name:this._.elNms.page}, '0'), 'ページ', 
                    Dom.tags.br(),
                    Dom.tags.span({name:this._.elNms.message}, '読込中……しばしお待ち下さい'),
                ),
            );
        }
    }
}
