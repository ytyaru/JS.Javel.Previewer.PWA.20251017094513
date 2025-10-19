(function(){
class InstallButton {
    constructor() {this._={el:Dom.q(`button[name="install"]`), insPromptEv:null}; this.#setup();}
    #setup() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this._.insPromptEv = e;
            console.debug(`'beforeinstallprompt' event was fired.`);
        });
        window.addEventListener('appinstalled', ()=>this.#installed());
        this._.el.addEventListener('click', ()=>this.#install());
        if (navigator.getInstalledRelatedApps) { // getInstalledRelatedAppsが利用可能かチェック
            navigator.getInstalledRelatedApps()
            .then(apps => {(apps.length > 0) ? this.hide() : this.show();})
            .catch(error => {console.error('アプリのインストール状態の確認中にエラーが発生しました:', error);});
        } else {console.warn('アプリのインストール状態を確認できませんでした。`navigator.getInstalledRelatedApps()`がこのブラウザではサポートされていないためです。');}

    }
    get isShow() {return 'none'!==this._.el.style.display;}
    get isHide() {return 'none'===this._.el.style.display;}
    toggle() {this.isShow ? this.hide() : this.show();}
    show() {this._.el.style.display='inline-block';}
    hide() {this._.el.style.display='none';}
    #install() {
        if (!this._.insPromptEv) {return}
        console.debug('インストール開始');
        this._.insPromptEv.prompt();
        this._.insPromptEv.userChoice
        .then(function(choiceResult) {
            this._.insPromptEv = null;
            console.log('インストール成功：',choiceResult);
        })
        .catch(function(installError) {
            this._.insPromptEv = null;
            console.error('インストール失敗：',choiceResult);
        });
    }
    #installed() {this.hide();console.log('インストール完了!!');}
}
window.InstallButton = InstallButton;
})();
