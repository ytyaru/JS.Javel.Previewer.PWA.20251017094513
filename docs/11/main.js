// サービスワーカーを登録する
if ('serviceWorker' in navigator) {navigator.serviceWorker.register('sw.js').then(
    (registration) => {console.log('Service worker registration successful:', registration);},
    (error) => {console.error(`Service worker registration failed: ${error}`);},
);} else {console.error("Service workers are not supported.");}
window.addEventListener('DOMContentLoaded', async(event) => {
    console.log('DOMContentLoaded!!');
    MicroModal.init();
    focusLooper.setup();
    const colorScheme = new ColorScheme();
    const installButton = new InstallButton();
    const appHeader = new AppHeader();
    const fileOpener = new FileOpener();
    const parser = new JavelParser();
    const viewer = new JavelViewer();
    viewer.showScrollbar();
    appHeader.hide();
    appHeader.resizeTextarea();
    const clock = document.createElement('digital-clock');
    clock.style.display = 'inline';
    clock.style.gap = '0';
    clock.style.padding = '0';
    clock.style.margin = '0';
    clock.style.fontFamily = 'monoscape';
    Dom.q(`[name="appSummary"]`).appendChild(clock);
    Dom.q(`[name="view"]`).addEventListener('click', async(e) => {
        viewer.hideScrollbar();
        Dom.q(`[name="review"]`).style.display = 'inline';
        Dom.q(`[name="appHeader"]`).style.display = 'none';
        Dom.q(`[name="input"]`).style.display = 'none';
        const isAuto = Dom.q(`[name="isAutoTypography"]`).checked;
        const viewEl = Dom.q(`[name="book"]`);
        viewEl.style.display = 'block';
        await viewer.make({
            javel: Dom.q(`[name="manuscript"]`).value,
            viewer: viewEl, 
            writingMode: Dom.q(`[name="writingMode"]`).value, 
            width: Number(Dom.q(`[name="width"]`).value), 
            height: Number(Dom.q(`[name="height"]`).value),
            lineOfChars: Number(Dom.q(`[name="lineOfChars"]`).value),
            minFontSize: Number(Dom.q(`[name="minFontSize"]`).value),
            columnCount: isAuto ? null : Number(Dom.q(`[name="columnCount"]`).value),
            columnGap: isAuto ? null : Number(Dom.q(`[name="columnGap"]`).value),
            lineHeight: Number(Dom.q(`[name="lineHeight"]`).value),
            letterSpacing: Number(Dom.q(`[name="letterSpacing"]`).value),
            footer: {
                isShowTime: Dom.q(`[name="isShowTime"]`).checked, // 全画面化時現在時刻表示是非
                isShowSubTitle: Dom.q(`[name="isShowSubTitle"]`).checked, // 章タイトル表示是非
                isShowTitle: Dom.q(`[name="isShowTitle"]`).checked, // 作品タイトル表示是非
                isShowNowPage: Dom.q(`[name="isShowNowPage"]`).checked,
                isShowAllPage: Dom.q(`[name="isShowAllPage"]`).checked,
                isShowRemain: Dom.q(`[name="isShowRemain"]`).checked,
                isShowPercent: Dom.q(`[name="isShowPercent"]`).checked,
            },
            pageMakeMethod: Dom.q(`[name="pageMakeMethod"]`).value,
            intervalSec: Number(Dom.q(`[name="intervalSec"]`).value),
            onClosed: ()=>{//閲覧から戻る
                viewer.showScrollbar();
                Dom.q(`[name="book"]`).style.display = 'none';
                Dom.q(`[name="appHeader"]`).style.display = 'block';
                Dom.q(`[name="input"]`).style.display = 'block';
                Dom.q(`[name="review"]`).focus();
                Dom.q('[name="appSummary"]').append(Dom.q('digital-clock'));
            },
        });
        Dom.q('[name="footer"] > [name="first"]').prepend(Dom.q('digital-clock'));
        viewEl.focus();
    });
    Dom.q(`[name="review"]`).addEventListener('click', async(e) => {//再び開く
        console.log('click:')
        viewer.hideScrollbar();
        Dom.q(`[name="appHeader"]`).style.display = 'none';
        Dom.q(`[name="input"]`).style.display = 'none';
        const viewEl = Dom.q(`[name="book"]`)
        viewEl.style.display = 'block';
        viewEl.focus();
        Dom.q(`.page.show:not(dummy)`).scrollIntoView({behavior:'smooth'});
        viewer._.footer.resetContent();
        Dom.q('[name="footer"] > [name="first"]').prepend(Dom.q('digital-clock'));
    });
    Dom.q(`[name="review"]`).addEventListener('keydown', async(e) => {//再び開く
        console.log('keydown:', e.key)
        if ('Enter'===e.key) {e.preventDefault();}//ページ遷移されてしまうのを防ぐ
    });
    Dom.q(`[name="review"]`).addEventListener('keyup', async(e) => {//再び開く
        if ([' ','Enter'].some(k=>k===e.key)) {e.target.dispatchEvent(new Event('click'));}
    });
    Dom.q(`[name="pageMakeMethod"]`).addEventListener('change', async(e) => {//再び開く
        Dom.q(`[name="pageMakeMethodDescription"]`).textContent = e.target.querySelector(`[value="${e.target.value}"]`).dataset.desc;
        Dom.q(`[name="intervalSecArea"]`).style.display = 'split'===e.target.value ? 'inline' : 'none';
    });
    Dom.q(`[name="pageMakeMethod"]`).value = 'bulk';
    Dom.q(`[name="pageMakeMethod"]`).dispatchEvent(new Event('change'));
    Dom.q(`[name="fullscreen"]`).addEventListener('click', async(e) => {
        if (screenfull.enabled) {e.target.innerHTML=screenfull.isFullscreen ? '非全画面' : '全画面'; screenfull.toggle(document.documentElement,{navigationUI:'hide'});}
    });
    Dom.q(`[name="size"]`).addEventListener('input', async(e) => {
        console.log('****************', e.target.value, e, screenfull.enabled);
        const isW = 'window'===e.target.value;
        Dom.q(`[name="width"]`).value = isW ? document.body.clientWidth : screen.width;
        Dom.q(`[name="height"]`).value = isW ? document.documentElement.clientHeight : screen.height;
    });
    window.addEventListener('resize', async(event) => {
        if ('window'===Dom.q(`[name="size"]`).value) {
            Dom.q(`[name="width"]`).value = document.body.clientWidth;
            Dom.q(`[name="height"]`).value = document.documentElement.clientHeight;
        }
        appHeader.resizeTextarea();
    });
    Dom.q(`[name="size"]`).value = Dom.q(`[name="size"] option:first-child`).value;
    Dom.q(`[name="size"]`).dispatchEvent(new Event('input'));
    Dom.q(`[name="isAutoTypography"]`).addEventListener('input', async(e) => {'size column whitespace'.split(' ').map(n=>Dom.q(`[name="${n}Field"]`).disabled=e.target.checked);});//おまかせ
    // 初期化
    viewer.showScrollbar();
    Dom.q(`[name="fullscreen"]`).innerHTML=screenfull.isFullscreen ? '非全画面' : '全画面';
    Dom.q(`[name="isAutoTypography"]`).dispatchEvent(new Event('input'));
    Dom.q(`[name="view"]`).focus();
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});
