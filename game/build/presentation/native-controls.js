/* Café native DOM controls only. Exact decorative children are swapped; control nodes/text stay intact. */
(() => {
  'use strict';
  const sprite=()=>window.UW_INLINE_PRESENTATION?'':'./presentation/icons.svg';
  function swap(node,key){
    const api=window.UWPresentationIcons;
    if(!node||node.classList?.contains('uw-icon')||!api?.replace)return;
    const tag=node.tagName?.toUpperCase();
    if(tag==='SVG'&&node.getAttribute('aria-hidden')!=='true')return;
    if(tag==='IMG'&&node.getAttribute('alt')!=='')return;
    api.replace(node,key,{sprite:sprite()});
  }
  function apply(){
    const $=s=>document.querySelector(s);
    // Static menu/settings icon; its button ID, label and menu listener never change.
    swap($('#menu > svg'),'settings');
    // Stable action-only child within cooking tools; ingredient pictures and copy are retained.
    document.querySelectorAll('#kitchen-screen .action-arrow > svg').forEach(n=>swap(n,'right'));
    document.querySelectorAll('#kitchen-screen .kitchen-header > button[data-action="leave-kitchen"] > svg').forEach(n=>swap(n,'back'));
    document.querySelectorAll('#kitchen-screen .kitchen-header > button[data-action="restart-recipe"] > svg').forEach(n=>swap(n,'retry'));
    document.querySelectorAll('#kitchen-screen button[data-action="wash-return"] > svg').forEach(n=>swap(n,'check'));
    document.querySelectorAll('#day-screen .day-heading > button[data-action="settings"] > svg').forEach(n=>swap(n,'settings'));
    document.querySelectorAll('#day-screen .day-heading button[data-action="day-return"] > svg').forEach(n=>swap(n,'back'));
    document.querySelectorAll('#day-screen button[data-action="lunch-return"] > svg').forEach(n=>swap(n,'home'));
    document.querySelectorAll('#customizer .designer-open > svg').forEach(n=>swap(n,'play'));
    // Only actual back glyphs are styled. Resume chef/play/check semantics stay intact.
    document.querySelectorAll('button > svg.uw-back-icon').forEach(n=>n.parentElement.classList.add('cafe-back-control'));
    document.querySelectorAll('#modal-root .dialog-buttons > button[data-action="fix-meal"] > svg').forEach(n=>swap(n,'retry'));
    document.querySelectorAll('#modal-root .dialog-buttons > button[data-action="reset-confirm"] > svg').forEach(n=>swap(n,'check'));
    document.querySelectorAll('#modal-root .helper-hire-cost > svg').forEach(n=>swap(n,'coin'));
    document.querySelectorAll('#modal-root button[data-action="confirm-helper-hire"] > svg:first-child').forEach(n=>swap(n,'check'));
    document.querySelectorAll('#modal-root button[data-action="confirm-helper-hire"] > svg:nth-child(2)').forEach(n=>swap(n,'coin'));
    document.querySelectorAll('#modal-root .dialog-buttons > button[data-action="replay"] > svg').forEach(n=>swap(n,'play'));
  }
  function start(){
    apply();
    // UI generation replaces child markup. Observe only the four known presentation containers.
    for(const root of [document.querySelector('#menu'),document.querySelector('#kitchen-screen'),document.querySelector('#day-screen'),document.querySelector('#customizer'),document.querySelector('#modal-root')]){
      if(!root)continue;new MutationObserver(apply).observe(root,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
