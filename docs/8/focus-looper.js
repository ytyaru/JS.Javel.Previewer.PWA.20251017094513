(function(){
class FocusLooper {
    #FOCUSABLE_ELEMENTS = [
        'a[href]:not([display="none"])',
        'area[href]:not([display="none"])',
        'input:not([disabled]):not([type="hidden"]):not([aria-hidden]):not([display="none"])',
        'select:not([disabled]):not([aria-hidden]):not([display="none"])',
        'textarea:not([disabled]):not([aria-hidden]):not([display="none"])',
        'button:not([disabled]):not([aria-hidden]):not([display="none"])',
        'iframe:not([display="none"])',
        'object:not([display="none"])',
        'embed:not([display="none"])',
        '[contenteditable]:not([display="none"])',
        '[tabindex]:not([tabindex^="-"]):not([display="none"])',
        '*.focusable'
    ]
    setup() {
    //setup(textarea) {
//        this.textarea = textarea
        window.addEventListener('keydown', async(e) => {
            if ('Esc'===e.code) return
            if ('Tab'===e.code) this.#retainFocus(e)
        })
        // ボタンは矢印キーを押すとフォーカスがbodyに飛んでしまうので、矢印キーの操作を殺した
        for (let button of document.querySelectorAll('button')) {
            button.addEventListener('keydown', async(e) => {
                if (['Right','Left','Up','Down'].some((key)=>`Arrow${key}`===e.code)) e.preventDefault()
                //else if ('Esc'===e.code) this.textarea.focus()
            })
        }
        this.#setFocusToFirstNode()
    }
    reset() { this.#setFocusToFirstNode() }
    #getFocusableNodes() { return [...document.querySelectorAll(this.#FOCUSABLE_ELEMENTS)] }
    //#getShowNode() { return document.querySelector(`[data-sid]:not([display="none"]`) || document } // 動的変更したdisplay値が取得できない！
    /*
    #getShowNode() {
        for (let el of document.querySelectorAll(`[data-sid]`)) {
            const display = Css.get('display', el)
            console.log('display:', display)
            if ('none'!==display) { return el }
        }
        return document
    }
    #getFocusableNodes() { console.log(this.#getShowNode());return [...this.#getShowNode().querySelectorAll(this.#FOCUSABLE_ELEMENTS)] }
    */
    #setFocusToFirstNode() {
        const nodes = this.#getFocusableNodes()
        if (nodes.length > 0) nodes[0].focus()
        console.log(nodes)
    }
    #retainFocus(e) {
        console.log(`e.code:${e.code}`, e)
        let nodes = this.#getFocusableNodes()
        console.log(nodes)
        if (nodes.length === 0) return
        nodes = nodes.filter(node=>(node.offsetParent !== null))
        if (!document.contains(document.activeElement)) { nodes[0].focus() }
        else {
            const focusedItemIndex = nodes.indexOf(document.activeElement)
            if (e.shiftKey && focusedItemIndex === 0) {
                nodes[nodes.length - 1].focus()
                e.preventDefault()
            }
            if (!e.shiftKey && nodes.length > 0 && focusedItemIndex === nodes.length - 1) {
                nodes[0].focus()
                e.preventDefault()
            }
        }
    }
}
window.focusLooper = new FocusLooper()
})()
