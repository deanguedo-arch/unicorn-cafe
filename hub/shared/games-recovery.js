/* Navigation registry only. Legacy game records and ownership remain untouched. */
window.UWGames=Object.freeze({picture(id){const stroke='#58415f',ball=id==='tennis'?'#b9d77a':'#fff1d1';return '<svg viewBox="0 0 120 120" aria-hidden="true"><g fill="none" stroke="'+stroke+'" stroke-width="5">'+(id==='tennis'?'<ellipse cx="48" cy="43" rx="27" ry="34" fill="#eee1c9"/><path d="M34 17v51m14-58v67m14-60v51M23 32h50M21 45h54M27 58h42M48 77v31"/><circle cx="92" cy="86" r="18" fill="'+ball+'"/><path d="M80 73q22 8 23 25"/>':'<path d="M12 36v70m96-70v70M12 42h96M12 54h96M12 66h96M28 42v24m16-24v24m16-24v24m16-24v24m16-24v24"/><circle cx="64" cy="24" r="19" fill="'+ball+'"/><path d="M49 12q20 6 26 26M47 29q14-15 31-10"/>')+'</g></svg>';},choices:Object.freeze([
{id:'tennis',icon:'ball',label:'Tennis',kind:'court'},
{id:'volleyball',icon:'ball',label:'Volleyball',kind:'court'},
{id:'bowling',icon:'pins',label:'Bowling',kind:'panel'}
])});
