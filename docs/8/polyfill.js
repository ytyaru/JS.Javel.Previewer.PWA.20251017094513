// structuredClone(), Array.prototype.at(), Blob.prototype.text()
if (!('structuredClone' in window)) {window.structuredClone = function() {return JSON.parse(JSON.stringify(obj));}}
if (!('at' in Array.prototype)) {Array.prototype.at = function(i) {return this[(i < 0 ? index + array.length : i)]}}
if (!('text' in Blob.prototype)) { // Promiseが実装された以降のバージョンのみ有効 (ES2015〜) Chrome v32〜 ES5以前は未実装
    Blob.prototype.text = function() {
        return new Promise((resolve, reject)=>{
            const reader = new FileReader();
            reader.onerror = () => reject(reader.error);
            reader.onload = () => resolve(reader.result);
            reader.readAsText(this);
        });
    }
}
