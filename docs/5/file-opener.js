(function(){
class FileOpener {
    constructor() {this.#listen();}
    #listen() {
        // File Open
        Dom.q(`[name="file"]`).addEventListener('change', async(e)=>{this.#action(await e.target.files[0].text());});
        // DnD
        document.addEventListener('dragover', async(event)=>{event.preventDefault(); event.dataTransfer.dropEffect = "copy";});
        document.addEventListener('drop', async(event)=>{
            event.preventDefault();
            this.#action(await event.dataTransfer.files[0].text());
        });
        // URL
        Dom.q(`[name="url"]`).addEventListener('change', async(e) => {
            if (e.target.value.startsWith('https://')) {
                const res = await fetch(e.target.value);
                this.#action(await res.text());
            }
        });
    }
    #action(text) {
        Dom.q(`[name="manuscript"]`).value = text;
        if (Dom.q(`[name="isImmediatelyView"]`).checked) {Dom.q(`[name="view"]`).dispatchEvent(new Event('click'));}
    }
}
window.FileOpener = FileOpener;
})();
