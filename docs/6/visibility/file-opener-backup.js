(function(){
class FileOpener {
    constructor() {
        this.#listen();
    }
    #listen() {
        Dom.q(`[name="file"]`).addEventListener('change', async(e) => {
            Dom.q(`[name="manuscript"]`).value = await e.target.files[0].text(); // Chrome v76 以降
            if (Dom.q(`[name="isImmediatelyView"]`).checked) {Dom.q(`[name="view"]`).dispatchEvent(new Event('click'));}
            /*
            const blob = new Blob(e.target.files[0], {type:'text/plain'});
            Dom.q(`[name="manuscript"]`).value = await blob.text();
            if (Dom.q(`[name="isImmediatelyView"]`).checked) {Dom.q(`[name="view"]`).dispatchEvent(new Event('click'));}
            */
            /*
            const reader = new FileReader();
            reader.readAsText(e.target.files[0]);
            reader.onload = (event) => {
                Dom.q(`[name="manuscript"]`).value = reader.result;
                if (Dom.q(`[name="isImmediatelyView"]`).checked) {Dom.q(`[name="view"]`).dispatchEvent(new Event('click'));}
            };
            */
            /*
            Dom.q(`[name="manuscript"]`).value = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(reader.error);
                reader.onload = () => resolve(reader.result);
                reader.readAsText(e.target.files[0]);
            });
            if (Dom.q(`[name="isImmediatelyView"]`).checked) {Dom.q(`[name="view"]`).dispatchEvent(new Event('click'));}
            */
        });
        document.addEventListener('dragover', async(event)=>{event.preventDefault(); event.dataTransfer.dropEffect = "copy";});
        document.addEventListener('drop', async(event)=>{
            event.preventDefault();
            console.log('Drop !!', event);
            console.log(event.dataTransfer);
            console.log(event.dataTransfer.files);
            console.log(event.dataTransfer.files[0]);
            const file = event.dataTransfer.files[0];
            Dom.q(`[name="manuscript"]`).value = await file.text(); // Chrome v76 以降
    //        Dom.q(`[name="manuscript"]`).value = await event.dataTransfer.files[0].text(); // Chrome v76 以降
            if (Dom.q(`[name="isImmediatelyView"]`).checked) {Dom.q(`[name="view"]`).dispatchEvent(new Event('click'));}
            /*
            event.preventDefault();
            event.dataTransfer.files
            const files = event.dataTransfer.files;
            for (let i = 0; i < files.length; i++) {
                console.log(files[i].name);
            }
            */
            /*
            const blob = new Blob(event.dataTransfer.files[0], {type:'text/plain'});
            Dom.q(`[name="manuscript"]`).value = await blob.text();
            if (Dom.q(`[name="isImmediatelyView"]`).checked) {Dom.q(`[name="view"]`).dispatchEvent(new Event('click'));}
            */
            /*
            Dom.q(`[name="manuscript"]`).value = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(reader.error);
                reader.onload = () => resolve(reader.result);
                reader.readAsText(event.dataTransfer.files[0]);
            });
            if (Dom.q(`[name="isImmediatelyView"]`).checked) {Dom.q(`[name="view"]`).dispatchEvent(new Event('click'));}
            */
        });
        Dom.q(`[name="url"]`).addEventListener('change', async(e) => {
            if (e.target.value.startsWith('https://')) {
                const res = await fetch(e.target.value);
                Dom.q(`[name="manuscript"]`).value = await res.text(); // Chrome v76 以降
                if (Dom.q(`[name="isImmediatelyView"]`).checked) {Dom.q(`[name="view"]`).dispatchEvent(new Event('click'));}
            }
        });
    }
}
window.FileOpener = FileOpener;
})();
