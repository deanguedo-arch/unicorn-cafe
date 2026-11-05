/* Version router. All new outings remain geometry2 until separate acceptance. */
(function(root){'use strict';const factories=new Map();
function register(version,factory){if(!Number.isInteger(version)||version<2||factories.has(version)||factory.geometry!==version)throw Error('Invalid or duplicate map factory');factories.set(version,factory);}
function versionFor(run){if(!run)return 2;if(run.schema!==1||!Number.isInteger(run.geometry))throw Error('Unsupported outing header; preserve original bytes');const version=run.mapVersion===undefined?run.geometry:run.mapVersion;if(version!==run.geometry)throw Error('Conflicting outing version; preserve original bytes');if(!factories.has(version))throw Error('Unavailable outing version; preserve original bytes');return version;}
function newVersionFor(levelId){return 2;}// Deliberately no acceptance setter; never globally upgrade other levels.
function expected(levelId,seed,run=null){const version=run?versionFor(run):newVersionFor(levelId),factory=factories.get(version);if(!factory)throw Error('No accepted factory');return factory.expected(levelId,seed);}
function validate(run){try{return factories.get(versionFor(run)).validate(run);}catch(e){return e.message;}}
function resume(run){const error=validate(run);if(error)throw Error(error);return{version:versionFor(run),scene:expected(run.levelId,run.seed,run),run};}
function create(levelId,seed){const version=newVersionFor(levelId);return{geometry:version,mapVersion:version,scene:expected(levelId,seed)};}
root.UnicornMapVersions=Object.freeze({register,versionFor,expected,validate,resume,create,newVersionFor,newVersion:()=>2});
})(typeof window!=='undefined'?window:globalThis);
