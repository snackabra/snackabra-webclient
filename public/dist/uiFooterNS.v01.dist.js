// TS Namespace version of uiFooter.v01.ts
// (that's the ONLY thing that should differ)
var uiFooter;
(function (uiFooter) {
    function init() {
        // Add event listeners for each copy button
        const copyBtns = Array.from(document.querySelectorAll('.copy-btn'));
        copyBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const codeBlock = btn.parentNode?.querySelector('code');
                const textToCopy = codeBlock?.textContent;
                if (textToCopy) {
                    navigator.clipboard.writeText(textToCopy)
                        .then(() => {
                        console.log('Text copied to clipboard');
                        btn.textContent = 'Copied!';
                        btn.style.backgroundColor = '#01ba00';
                        setTimeout(() => {
                            btn.textContent = 'Copy to Clipboard';
                            btn.style.backgroundColor = '#188fff';
                        }, 2000); // reset button text after 2 seconds
                    })
                        .catch((err) => {
                        console.error('Error in copying text: ', err);
                    });
                }
            });
        });
        // Add an onclick event listener to all details elements
        document.querySelectorAll("details").forEach((detailsElement) => {
            detailsElement.addEventListener("toggle", function () {
                if (this.open) {
                    // Scroll the window to the top of the expanded element
                    window.scrollTo({
                        top: this.offsetTop,
                        behavior: "smooth"
                    });
                }
            });
        });
    }
    uiFooter.init = init;
})(uiFooter || (uiFooter = {}));
// Expose the namespace as a global variable in the UMD pattern
(function (global) {
    global.uiFooter = uiFooter;
}(this));
// export {};
//# sourceMappingURL=uiFooterNS.v01.js.map