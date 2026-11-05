/* Preserve top-level extensions the current engine does not interpret. */
(()=>{'use strict';const R=window.RR,Base=R.Engine;
class PreserveExtensions extends Base{
 constructor(raw){super(raw);const known=super.snapshot();this.recoveryExtensions=Object.create(null);if(raw&&typeof raw==='object'&&!Array.isArray(raw))for(const key of Object.keys(raw))if(!Object.prototype.hasOwnProperty.call(known,key))this.recoveryExtensions[key]=JSON.parse(JSON.stringify(raw[key]));}
 snapshot(){return {...this.recoveryExtensions,...super.snapshot()};}
}
R.Engine=PreserveExtensions;
})();
