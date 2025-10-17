(function(){// ヘッダをクリック・タップ・キー入力すると詳細情報の表示／非表示を切り替える
class AppHeader {
    constructor() {
        this._={
            el: {
                name: Dom.q(`[name="app-name"]`), 
                catch: Dom.q(`[name="app-catch"]`), 
                status: Dom.q(`[name="app-status"]`),
                feature: Dom.q(`[name="app-feature"]`),
                policy: Dom.q(`[name="app-policy"]`),
            },
            display: {
                status: Dom.q(`[name="app-status"]`).style.display,
                feature: Dom.q(`[name="app-feature"]`).style.display,
                policy: Dom.q(`[name="app-policy"]`).style.display,
            }
        };
        this.#setup();
    }
    #setup() {
        for (let d of [{el:this._.el.name, names:['feature', 'policy']}, {el:this._.el.catch, names:['status']}]) {
            for (let evNm of ['click']) {//, 'touchend'
                d.el.addEventListener(evNm, async(event)=>{ for(let name of d.names){this.#toggle(name);} });
            }
            d.el.addEventListener('keyup', async(event)=>{ if([' ','Enter'].some(v=>v===event.key)){for(let name of d.names){this.#toggle(name);}} });
        }
    }
    #toggle(name) {this._.el[name].style.display = ('none'===this._.el[name].style.display) ? this._.display[name] : 'none';}
//    show(name) {for(let n of Type.isStr(name) ? [name] : [...Object.keys(this._.display)]){this._.el[name].style.display = this._.display[n]}}
//    hide(name) {for(let n of Type.isStr(name) ? [name] : [...Object.keys(this._.display)]){this._.el[name].style.display = this._.display[n]}}
    #set(name, isShow=false) {for(let n of Type.isStr(name) ? [name] : [...Object.keys(this._.display)]){this._.el[n].style.display = isShow ? this._.display[n] : 'none'}}
    show(name) {this.#set(name,true)}
    hide(name) {this.#set(name,false)}
}
window.AppHeader = AppHeader;
})();
