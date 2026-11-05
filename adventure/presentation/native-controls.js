/* Sneaky Unicorn native DOM chrome only. Keep result map/loot art, labels, controls and handlers. */
(() => {
  'use strict';
  const sprite='./presentation/icons.svg';
  function swap(node,key){
    const api=window.UWPresentationIcons;
    if(!node||node.classList?.contains('uw-icon')||node.classList?.contains('uw-refresh-icon')||!api?.replace)return;
    const tag=node.tagName?.toUpperCase();
    if(tag==='SVG'&&node.getAttribute('aria-hidden')!=='true')return;
    if(tag==='IMG'&&node.getAttribute('alt')!=='')return;
    api.replace(node,key,{sprite});
  }
  function apply(){
    const $=s=>document.querySelectorAll(s);
    $('#gameMenu > svg').forEach(n=>swap(n,'settings'));
    // imageHTML() emits a decorative IMG with empty alt and no data-img attribute.
    $('#gameMenu > img[alt=""]').forEach(n=>swap(n,'settings'));
    $('#finishLevel > svg').forEach(n=>swap(n,'check'));
    $('#ui-resume .menu-art > svg').forEach(n=>swap(n,'play'));
    // Places keeps its original house/level picture; the icon-only Places actions below use nav/home.
    $('#ui-help .menu-art > img').forEach(n=>swap(n,'help'));
    $('#help-back > svg').forEach(n=>swap(n,'back'));
    $('#rotate-picture > svg').forEach(n=>swap(n,'rotate'));
    const soundButton=document.getElementById('sound'),soundKey=soundButton?.getAttribute('aria-pressed')==='true'?'sound':'mute';
    $('#sound .menu-art > img').forEach(n=>swap(n,soundKey));
    $('#sound .menu-art > svg.uw-icon').forEach(n=>{
      const use=n.querySelector('use'),expected='./presentation/icons.svg#uw-'+soundKey;
      if(use?.getAttribute('href')!==expected)window.UWPresentationIcons?.replace(n,soundKey,{sprite:'./presentation/icons.svg'});
    });
    const resultIcons={Again:'retry','Next place':'right',Places:'nav','Keep playing':'play','Back to places':'home','Costume closet':'wardrobe','Treasure room':'star'};
    for(const [label,key] of Object.entries(resultIcons))$(`#resultButtons > button.bigButton[aria-label="${label}"] > svg`).forEach(n=>swap(n,key));
  }
  function start(){
    apply();
    // Menus/results/settings are rebuilt dynamically; observe only known native chrome roots.
    for(const root of [document.querySelector('#gameMenu'),document.querySelector('#finishLevel'),document.querySelector('#ui-resume'),document.querySelector('#ui-help'),document.querySelector('#help-back'),document.querySelector('#rotate-picture'),document.querySelector('#sound'),document.querySelector('#resultButtons')]){
      if(!root)continue;new MutationObserver(apply).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
