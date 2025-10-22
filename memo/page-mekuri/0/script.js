// --- ★★★ 簡単カスタマイズエリア ★★★ ---

// HTMLで設定したページの総数を設定
const totalPages = 3;

// --------------------------------------

// ここから下は変更不要です
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pages = document.querySelectorAll('.page');

let currentPage = 0;
let zIndexCounter = totalPages;

// 初期状態の設定
function updateButtons() {
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage === totalPages;
}
pages.forEach((page, index) => {
    page.style.zIndex = totalPages - index;
});
updateButtons();


// 「次へ」ボタンの処理
nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
        const pageToFlip = pages[currentPage];
        pageToFlip.classList.add('flipped');
        pageToFlip.style.zIndex = zIndexCounter++;
        currentPage++;
        updateButtons();
    }
});

// 「前へ」ボタンの処理
prevBtn.addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        const pageToFlip = pages[currentPage];
        pageToFlip.classList.remove('flipped');
        // z-indexを元の階層に戻すために少し複雑なことをする必要があるが、
        // 今回はシンプルに戻すアニメーションのみ実装
        // pageToFlip.style.zIndex = totalPages - currentPage;
        updateButtons();
    }
});
