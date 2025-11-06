(function(){
class PageGenerator {
    constructor() {
        this._={els:{viewer:null, pages:null}, splitter:{all:null, one:null}, types:'Bulk Flip Interval FlipInterval'.split(' '), type:'Bulk'};
    }
    get types() {return [...this._.types]}
    get type() {return this._.type}
    set type(v) {
        if (this._.types.some(t=>t===v)) {this._.type=v;}
    }
}

//get #isSelection() {return 0 < window.getSelection().toString().length;}

class BulkPageGenerator {// 最初に一括で全ページを生成する
    async setup() {
        // 表紙
        if (this._.O.viewer.querySelector('.cover')) {this._.O.viewer.querySelector('.cover').remove();}
        book.prepend(this._.splitter.makeCover());
        this._.footer.allPage++;

        for await (let page of this._.splitter.generateAsync(this._.O.viewer)) {
            console.log('ページ数:',page.dataset.page)
            book.appendChild(page);
            Dom.q('[name="loading-all-page"]').textContent = page.dataset.page;
            Dom.q('[name="loading-rate"]').textContent = `${this._.parser.body.progress.rate.toFixed(100===this._.parser.body.progress.rate ? 0 : 1)}%`;
        }

        // 裏表紙
//        if (this._.O.viewer.querySelector('.back-cover')) {this._.O.viewer.querySelector('.back-cover').remove();}
//        this._.O.viewer.appendChild(this._.splitter.makeBackCover());
        if (this._.O.viewer.querySelector('.back-cover')) {this._.O.viewer.querySelector('.back-cover').remove();}
        book.appendChild(this._.splitter.makeBackCover());
    }
    nextPage() {
        if (this.#isSelection) {return}
        if (this._.pagingDisabled) {return}
        console.log('次に進む', nowPage);
        const nextPage = nowPage.nextElementSibling;
        if (nextPage) {
            this._.pagingDisabled = true;
            nextPage.classList.add('show');
            // visibility対応（スクロールする）
//            nowPage.classList.remove('show');
            this._.hidePage = nowPage;
            this._.footer.hide();
            nextPage.scrollIntoView({behavior:'smooth'});// instant:即時, smooth:ぬるっと
//            this._.footer.resetContent();
        }
    }
    prevPage() {
        console.log('前に戻る', nowPage);
        if (this.#isSelection) {return}
        if (this._.pagingDisabled) {return}
        const prevPage = nowPage.previousElementSibling;
        if (prevPage && !prevPage.classList.contains('dummy')) {
            this._.pagingDisabled = true;
            prevPage.classList.add('show');
            // visibility対応（スクロールする）
//            nowPage.classList.remove('show');
            this._.hidePage = nowPage;
            this._.footer.hide();
            prevPage.scrollIntoView({behavior:'smooth'});// instant:即時, smooth:ぬるっと
//            this._.footer.resetContent();
        }
    }
    interval() {}
}
class FlipPageGenerator {// 次ページ遷移する度に一ページずつ生成する
    async setup() {
        // 表紙
        if (this._.O.viewer.querySelector('.cover')) {this._.O.viewer.querySelector('.cover').remove();}
        book.prepend(this._.splitter.makeCover());
        this._.footer.allPage++;
        book.append(...this._.splitter.make(book, this._.parser.body.manuscript));
    }
    nextPage() {
        console.log('次に進む', nowPage, this.#isSelection, this._.pagingDisabled);
        if (this.#isSelection) {console.log('テキスト選択中につき遷移無視する。');return}
        if (this._.pagingDisabled) {console.log('ページ遷移中につき遷移無視する。');return}
        let nextPage = nowPage.nextElementSibling;
        console.log('finished:', this._.splitter.finished, 'nextPage:', !!nextPage);
        if (!this._.splitter.finished) {// 次ページに遷移した時点で一ページずつ追加する
            const bookInPages = this._.O.viewer.querySelector('[name="book-in-pages"]');
            const pages = this._.splitter.make(bookInPages);
            console.log('生成したページ数:', pages.length);
            console.log('生成したページのうち最後のページ番号:', pages.at(-1).dataset.page);
            if (0 < pages.length) {
                bookInPages.append(...pages);
                if (!nextPage) {nextPage = pages[0];}
                console.log('次ページ番号:', nextPage.dataset.page);
                this._.footer.allPage += pages.length;
            }
        } else {this._.footer.allPageLoaded=true;console.warn('Finished!!!!!!!!!');}
        console.log('nextPage:', !!nextPage)
        if (nextPage) {// 次ページに遷移する（今ページを非表示にして次ページを表示する）
            console.log('次ページを表示する:', 'nowPage:', nowPage.dataset.page, 'nextPage:', nextPage.dataset.page);
            this._.pagingDisabled = true;
            nextPage.classList.add('show'); // なぜか次ページがここで表示されてしまいscrollIntoViewが実行できずscrollend発火できないので
            nowPage.scrollIntoView({behavior:'instant'}); // 元ページに戻す
            // visibility対応（スクロールする）
//            nowPage.classList.remove('show');
            this._.hidePage = nowPage;
            this._.footer.hide();
            nextPage.scrollIntoView({behavior:'smooth'});// instant:即時, smooth:ぬるっと
//            this._.footer.resetContent();
        }
    }
    prevPage() {
        console.log('前に戻る', nowPage);
        if (this.#isSelection) {return}
        if (this._.pagingDisabled) {return}
        const prevPage = nowPage.previousElementSibling;
        if (prevPage && !prevPage.classList.contains('dummy')) {
            this._.pagingDisabled = true;
            prevPage.classList.add('show');
            // visibility対応（スクロールする）
//            nowPage.classList.remove('show');
            this._.hidePage = nowPage;
            this._.footer.hide();
            prevPage.scrollIntoView({behavior:'smooth'});// instant:即時, smooth:ぬるっと
//            this._.footer.resetContent();
        }
    }
    interval() {}
}
class IntervalPageGenerator {// 指定時間毎に一ページずつ生成する

}
class FlipIntervalPageGenerator {// 次ページ遷移か指定時間毎に一ページずつ生成する

}



})();

