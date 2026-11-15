// Shared with the server-rendered pre-paint script (components/site/FxInit).
export const FX_KEY = 'fx';

/** Mirrors the saved FX: LITE choice onto <html data-fx="lite"> before first paint. */
export const FX_INLINE = `(function(){try{if(localStorage.getItem('${FX_KEY}')==='lite')document.documentElement.setAttribute('data-fx','lite')}catch(e){}})();`;
