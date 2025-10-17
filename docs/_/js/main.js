window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded!!');
    const author = 'ytyaru';
    van.add(document.querySelector('main'), 
        van.tags.h1(van.tags.a({href:`https://github.com/${author}/JS.Javel.Viewer.PWA.20251017094513/`}, 'Javel.Viewer.PWA')),
        van.tags.p('日本語小説を簡易マークアップしたテキストファイルからHTML表示するPWA。'),
//        van.tags.p('A PWA that displays HTML from a text file with simple markup of a Japanese novel.'),
    );
    van.add(document.querySelector('footer'),  new Footer('ytyaru', '../').make());

    const a = new Assertion();
    a.t(true);
    a.f(false);
    a.e(TypeError, `msg`, ()=>{throw new TypeError(`msg`)});
    a.fin();
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

