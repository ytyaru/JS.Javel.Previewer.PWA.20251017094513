// サービスワーカーを登録する
if ('serviceWorker' in navigator) {navigator.serviceWorker.register('sw.js').then(
    (registration) => {console.log('Service worker registration successful:', registration);},
    (error) => {console.error(`Service worker registration failed: ${error}`);},
);} else {console.error("Service workers are not supported.");}
window.addEventListener('DOMContentLoaded', async(event) => {
    console.log('DOMContentLoaded!!');
    /*
    if (960 < document.body.clientWidth) {
        const r = Dom.q(`[name="manuscript"]`).getBoundingClientRect();
        Dom.q(`[name="manuscript"]`).style.height = `${Math.max(120, window.innerHeight - r.y - 2)}px`;
        console.log(Math.max(120, window.innerHeight - r.y), window.innerHeight, r);
    }
    // 監視できず
    const observer = new MutationObserver((mutationsList, observer)=>{
        for(const mutation of mutationsList) {
            if (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                if (960 < document.body.clientWidth) {
                    const r = Dom.q(`[name="manuscript"]`).getBoundingClientRect();
                    Dom.q(`[name="manuscript"]`).style.height = `${Math.max(120, window.innerHeight - r.y - 2)}px`;
                    console.log(Math.max(120, window.innerHeight - r.y), window.innerHeight, r);
                }
            }
        }
    });
    observer.observe(Dom.q(`[name="manuscript"]`), {attributes:true, attributeFilter:['style']});
    */
    
    const installButton = new InstallButton();
    const appHeader = new AppHeader();
    const parser = new JavelParser();
    const splitter = new PageSplitter(parser);
    const viewer = new JavelViewer();
    appHeader.resizeTextarea();
    /*
    await viewer.make({
        javel: 'asset/javel/intro.jv',
        viewer: Dom.q(`[name="demo-view"]`), 
        editor: Dom.q(`[name="demo-edit"]`), 
        writingMode:'horizontal-tb', 
//        writingMode:'vertical-rl', 
        width: Css.getInt('width', Dom.q(`[name="demo-edit"]`)), 
        height: Css.getInt('height', Dom.q(`[name="demo-edit"]`)),
        columnCount: 2,
    });
    */
    Dom.q(`[name="view"]`).addEventListener('click', async(e) => {
        //appHeader.hide();
        Dom.q(`[name="appHeader"]`).style.display = 'none';
        Dom.q(`[name="input"]`).style.display = 'none';
        const isAuto = Dom.q(`[name="isAutoTypography"]`).checked;
        const viewEl = Dom.q(`[name="book"]`);
        await viewer.make({
            javel: 'asset/javel/intro.jv',
            viewer: viewEl, 
//            editor: Dom.q(`[name="demo-edit"]`), 
            writingMode: Dom.q(`[name="writingMode"]`).value, 
//            writingMode:'horizontal-tb', 
//            writingMode:'vertical-rl', 
            width: Number(Dom.q(`[name="width"]`).value), 
            height: Number(Dom.q(`[name="height"]`).value),
            lineOfChars: Number(Dom.q(`[name="lineOfChars"]`).value),
            minFontSize: Number(Dom.q(`[name="minFontSize"]`).value),
            columnCount: isAuto ? null : Number(Dom.q(`[name="columnCount"]`).value),
            columnGap: isAuto ? null : Number(Dom.q(`[name="columnGap"]`).value),
            lineHeight: Number(Dom.q(`[name="lineHeight"]`).value),
            letterSpacing: Number(Dom.q(`[name="letterSpacing"]`).value),
//            width: Css.getInt('width', Dom.q(`[name="demo-edit"]`)), 
//            height: Css.getInt('height', Dom.q(`[name="demo-edit"]`)),
//            columnCount: 2,
        });
        viewEl.focus();
    });
    Dom.q(`[name="size"]`).addEventListener('input', async(e) => {
        console.log('****************', e.target.value, e);
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
//    Dom.q(`[name="width"]`).value = document.body.clientWidth;
//    Dom.q(`[name="height"]`).value = document.documentElement.clientHeight;
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});
