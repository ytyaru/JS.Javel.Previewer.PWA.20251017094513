class PageLoadingDialog {// ページ一括生成時に表示するダイアログ
    constructor() {this._ = {elNms:{this:'loading', page:'loadingAllPage', rate:'loadingRate', message:'loadingMessage'}, manuscript:null, page:{all:0, rate:0}};}
    //constructor() {this._ = {elNm:'loading', manuscript:null, els:{viewer:null, editor:null, this:null}, page:{all:0, rate:0}};}
    //get el() {return this._.els.this}
    get el() {return Dom.q(`[name="${this._.elNms.this}"]`)}
    get page() {return Dom.q(`[name="${this._.elNms.page}"]`)}
    get rate() {return Dom.q(`[name="${this._.elNms.rate}"]`)}
    show() {this.el.style.display = 'block';}
    hide() {this.el.style.display = 'none';}
//    async setup() { this.#make(); await this.#load(); }
    update(allPage, rate) {
        this._.page.all = allPage;
        this._.page.rate = rate;
        this.page.textContent = `${allPage}`;//page.dataset.page;
        this.rate.textContent = `${rate.toFixed(100===rate ? 0 : 1)} %`;
        //Dom.q('[name="loading-rate"]').textContent = `${this._.parser.body.progress.rate.toFixed(100===this._.parser.body.progress.rate ? 0 : 1)}%`;
        //`${this._.parser.body.progress.rate.toFixed(100===this._.parser.body.progress.rate ? 0 : 1)}%`;
    }
    make() {
        //if (!Dom.q('[name="loading"]')) {
        if (!this.el) {
            Dom.q(`[name="overlay"]`).append(
                Dom.tags.div({name:this._.elNms.this, style:'display:none; font-size:1.25em; color:var(--fg-color); background-color:var(--bg-color); border:8px ridge var(--fg-color);'}, 
                //Dom.tags.div({name:'loading', style:'display:none; font-size:1.25em; color:var(--fg-color); background-color:var(--bg-color); border:8px ridge var(--fg-color);'}, 
                    Dom.tags.span({name:this._.elNms.rate}, '0 %'),
                    '　', Dom.tags.span({name:this._.elNms.page}, '0'), 'ページ', 
                    Dom.tags.br(),
                    Dom.tags.span({name:this._.elNms.message}, '読込中……しばしお待ち下さい'),
                ),
            );
        }
//        this.show();
        //this.hide();
        //Dom.q('[name="loading"]').display = 'none';
    }
    /*
    async #load(manuscript, viewer, editor) {
    //async #load() {
        if (!this._.O.viewer.querySelector('[name="error"]')) {
            this._.O.viewer.append(Dom.tags.div({name:'error', style:'display:none; widht:100%; height:100%;'}, 
                Dom.tags.p('パースに失敗しました。Javel原稿の冒頭にはYAML形式のメタ情報が必要です。次のような形式にしてください。'),
                Dom.tags.pre(`---
title: 小説のタイトル
catch: 小説のキャッチコピー
obi: |-
小説の帯文。

Javel形式《けいしき》で書けるよ。
author:
name: 著者名
---

# 見出し

　本文。`),
            ));
        }
        try {
            if (this._.O.javel.startsWith('https://') || 0===(this._.O.javel.trim().match(new RegExp('\n', 'g')) || []).length) {
                const res = await fetch(this._.O.javel);
                const txt = await res.text();
                if (this._.O.editor) {this._.O.editor.value = txt}
                this._.parser.manuscript = txt;
            } else { console.log(this._.O.javel); this._.parser.manuscript = this._.O.javel; }
            if (this._.O.editor) {this._.O.editor.value = this._.parser.manuscript;}
        } catch (err) {
            console.error(err);
            this._.O.viewer.querySelector('[name="error"]').style.display = 'block';
            throw err;
        }
    }
    */
}
