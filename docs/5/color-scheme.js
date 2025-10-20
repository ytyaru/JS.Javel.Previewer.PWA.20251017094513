(function(){
class ColorScheme {
    constructor() {
        this._ = {
            scheme:{
                light:{
                    bg:'#ddd', fg:'#000', 
                    a:{link:'initial', visited:'initial', hover:'initial', active:'initial'},
                    selection:{bg:'initial', fg:'initial'},
                }, 
                dark:{
                    bg:'#000', fg:'#ff0',
                    a:{link:'pink', visited:'green', hover:'orange', active:'red'},
                    selection:{bg:'initial', fg:'initial'},
                }, 
            },
        };
        this._.name = Object.keys(this._.scheme)[0];
        this._.el = Dom.tags.div({name:'colorScheme', tabindex:'0', style:'cursor:pointer;'}, this.#darkEl, this.#lightEl);
        this.#listen();
        Dom.q(`[name="appHeader"] > div`).appendChild(this._.el);
        this.#set();
    }
    get el() {return this._.el}
    get names() {return Object.keys(this._.scheme)}
    set name(v) {if (this.#validName(v)) {this._.name=v; this.#set();}}
    #validName(v) {return Type.isStr(v) && Object.keys(this._.scheme).some(n=>n===v)}
    get #darkEl() {return this.#mkSvg('icon-dark')}
    get #lightEl() {return this.#mkSvg('icon-light')}
    #mkSvg(id) {
        console.log('id:', id)
        const {svg, use} = Dom.tags('http://www.w3.org/2000/svg');
        return svg({name:id, width:'2em', height:'2em', viewBox:'0 0 512 512'}, use({href:`#${id}`}));
    }
    toggle() {
        const names = this.names;
        const i = names.indexOf(this._.name);
        console.log('toggle!!!!!!!!!!!!!!!!:', i, this._.name);
        this.#set(names[names.length <= i+1 ? 0 : i+1]);
    }
    setDark() {this.#set('dark')}
    setLight() {this.#set('light')}
    #set(name=null) {
        const N = this.#validName(name) ? name : this._.name;
        this._.name = N;
        ['bg','fg'].map(v=>Css.set(`--${v}-color`, this._.scheme[N][v]));
//        Css.set('--bg-color', this._.scheme[N].bg);
//        Css.set('--fg-color', this._.scheme[N].fg);
        this.names.map(v=>Dom.q(`[name="icon-${v}"]`).style.display = (v===N ? 'inline' : 'none'));
//        Dom.q(`[name="icon-light"]`).style.display = 'inline' : 'none';
//        Dom.q(`[name="icon-dark"]`).style.display = 'inline' : 'none';
        Object.keys(this._.scheme[N].a).map(v=>Css.set(`--a-${v}`, this._.scheme[N].a[v]));
        Object.keys(this._.scheme[N].selection).map(v=>Css.set(`--selection-${v}`, this._.scheme[N].selection[v]));
    }
    #listen() {
        this._.el.addEventListener('click', async(event)=>{this.toggle();});
    }
}
window.ColorScheme = ColorScheme;
})();
