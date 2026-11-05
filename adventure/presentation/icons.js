/* Icon-only DOM helper. It never edits a button, label, handler, price, or ARIA contract. */
(() => {
  'use strict';
  const aliases = {
    door:'door', enter:'door', return:'back', back:'back', close:'close', play:'play', start:'play', resume:'play',
    pause:'pause', settings:'settings', sound:'sound', music:'sound', mute:'mute', 'sound-off':'mute', hand:'hand', grid:'grid', grid4:'grid4', grid9:'grid9', grid16:'grid16', rotate:'rotate', bag:'bag', backpack:'bag', coin:'coin', buy:'coin', check:'check',
    home:'home', places:'nav', help:'help', camera:'photo', album:'photo', puzzle:'puzzle', paint:'paint', mirror:'mirror',
    hanger:'wardrobe', head:'headwear', body:'shirt', accessory:'accessory', outfits:'wardrobe', next:'right',
    arrow:'right', prev:'left', star:'star', reward:'star', save:'check', done:'check', retry:'retry'
  };
  const allowed = new Set(['nav','door','back','close','play','pause','retry','settings','sound','mute','hand','grid','grid4','grid9','grid16','rotate','bag','coin','check','home','help','photo','puzzle','paint','wardrobe','mirror','headwear','shirt','accessory','left','right','star']);
  function iconName(key) { const n=aliases[key]||key; return allowed.has(n)?n:null; }
  function create(key, options={}) {
    const doc=options.document||document, name=iconName(key), ns='http://www.w3.org/2000/svg';
    if(!name) return null;
    const svg=doc.createElementNS(ns,'svg'); svg.setAttribute('viewBox','0 0 48 48'); svg.setAttribute('aria-hidden','true'); svg.setAttribute('focusable','false'); svg.classList.add('uw-icon');
    if(name==='back'){svg.setAttribute('viewBox','0 0 16 16');svg.setAttribute('shape-rendering','crispEdges');svg.classList.add('uw-back-icon');svg.innerHTML='<path style="stroke:none;fill:#352C46" d="M2 7H4V5H6V3H8V6H14V10H8V13H6V11H4V9H2Z"/><path style="stroke:none;fill:#FFF2D4" d="M4 7H6V5H7V7H13V9H7V11H6V9H4Z"/><path style="stroke:none;fill:#D9AF52" d="M7 8H13V9H7Z"/>';return svg;}
    const use=doc.createElementNS(ns,'use'); use.setAttribute('href',`${options.sprite??'./presentation/icons.svg'}#uw-${name}`); svg.append(use); return svg;
  }
  function replace(oldDecorativeNode,key,options={}) {
    if(!oldDecorativeNode?.parentNode) return null;
    const next=create(key,options); if(!next) return null; oldDecorativeNode.replaceWith(next); return next;
  }
  window.UWPresentationIcons={iconName,create,replace};
})();
