class PageViewer {
    constructor(target) {
        this._ = {};
        this._.target = Type.isEl(target) ? target : Dom.q(`[name="book"]`);
    }
    get firstPage() {return this._.target.querySelector(`.page:first-child`)}
    get lastPage() {return this._.target.querySelector(`.page:last-child`)}
    get nowPage() {return this._.target.querySelector(`.page.show`)}
    get nowPageNum() {return parseInt(this.nowPage?.dataset.page)}
    get allPageNum() {return parseInt(this.lastPage?.dataset.page)}
    showNextPage() {return this.#showNeary(false)}
    showPrevPage() {return this.#showNeary(true)}
    #showNeary(isPrev=false) {
        const target = this._.target.querySelector(`.page.show`)[`${isPrev ? 'previous' : 'next'}ElementSibling`];
        this._.target.querySelector(`.page.show`).classList.remove('show');
        (target ?? (isPrev ? this.lastPage : this.firstPage)).classList.add('show');
    }
    showPage(p) {//p:自然数
        const pages = [...this._.target.querySelectorAll(`.page`)];
        if (!(Number.isSafeInteger(p) && 0<p && p<=pages.length)) {throw new RangeError(`範囲外です。`)}
        for (let i=0; i<pages.length; i++) {
            if (p===Number(pages[i].dataset.page)) {pages[i].classList.add('show');}
            else {pages[i].classList.remove('show');}
        }
    }
}
