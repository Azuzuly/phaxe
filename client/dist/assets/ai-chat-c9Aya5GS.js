function ce(c){return c&&c.__esModule&&Object.prototype.hasOwnProperty.call(c,"default")?c.default:c}var B={exports:{}},z={},H={exports:{}},n={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var G;function le(){if(G)return n;G=1;var c=Symbol.for("react.element"),h=Symbol.for("react.portal"),m=Symbol.for("react.fragment"),w=Symbol.for("react.strict_mode"),j=Symbol.for("react.profiler"),_=Symbol.for("react.provider"),g=Symbol.for("react.context"),R=Symbol.for("react.forward_ref"),u=Symbol.for("react.suspense"),C=Symbol.for("react.memo"),x=Symbol.for("react.lazy"),b=Symbol.iterator;function A(e){return e===null||typeof e!="object"?null:(e=b&&e[b]||e["@@iterator"],typeof e=="function"?e:null)}var $={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},O=Object.assign,q={};function o(e,t,a){this.props=e,this.context=t,this.refs=q,this.updater=a||$}o.prototype.isReactComponent={},o.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")},o.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function N(){}N.prototype=o.prototype;function S(e,t,a){this.props=e,this.context=t,this.refs=q,this.updater=a||$}var E=S.prototype=new N;E.constructor=S,O(E,o.prototype),E.isPureReactComponent=!0;var L=Array.isArray,I=Object.prototype.hasOwnProperty,T={current:null},K={key:!0,ref:!0,__self:!0,__source:!0};function Z(e,t,a){var i,l={},y=null,p=null;if(t!=null)for(i in t.ref!==void 0&&(p=t.ref),t.key!==void 0&&(y=""+t.key),t)I.call(t,i)&&!K.hasOwnProperty(i)&&(l[i]=t[i]);var f=arguments.length-2;if(f===1)l.children=a;else if(1<f){for(var d=Array(f),M=0;M<f;M++)d[M]=arguments[M+2];l.children=d}if(e&&e.defaultProps)for(i in f=e.defaultProps,f)l[i]===void 0&&(l[i]=f[i]);return{$$typeof:c,type:e,key:y,ref:p,props:l,_owner:T.current}}function ne(e,t){return{$$typeof:c,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function F(e){return typeof e=="object"&&e!==null&&e.$$typeof===c}function oe(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(a){return t[a]})}var J=/\/+/g;function U(e,t){return typeof e=="object"&&e!==null&&e.key!=null?oe(""+e.key):t.toString(36)}function D(e,t,a,i,l){var y=typeof e;(y==="undefined"||y==="boolean")&&(e=null);var p=!1;if(e===null)p=!0;else switch(y){case"string":case"number":p=!0;break;case"object":switch(e.$$typeof){case c:case h:p=!0}}if(p)return p=e,l=l(p),e=i===""?"."+U(p,0):i,L(l)?(a="",e!=null&&(a=e.replace(J,"$&/")+"/"),D(l,t,a,"",function(M){return M})):l!=null&&(F(l)&&(l=ne(l,a+(!l.key||p&&p.key===l.key?"":(""+l.key).replace(J,"$&/")+"/")+e)),t.push(l)),1;if(p=0,i=i===""?".":i+":",L(e))for(var f=0;f<e.length;f++){y=e[f];var d=i+U(y,f);p+=D(y,t,a,d,l)}else if(d=A(e),typeof d=="function")for(e=d.call(e),f=0;!(y=e.next()).done;)y=y.value,d=i+U(y,f++),p+=D(y,t,a,d,l);else if(y==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return p}function P(e,t,a){if(e==null)return e;var i=[],l=0;return D(e,i,"","",function(y){return t.call(a,y,l++)}),i}function ae(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(a){(e._status===0||e._status===-1)&&(e._status=1,e._result=a)},function(a){(e._status===0||e._status===-1)&&(e._status=2,e._result=a)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var v={current:null},V={transition:null},se={ReactCurrentDispatcher:v,ReactCurrentBatchConfig:V,ReactCurrentOwner:T};function W(){throw Error("act(...) is not supported in production builds of React.")}return n.Children={map:P,forEach:function(e,t,a){P(e,function(){t.apply(this,arguments)},a)},count:function(e){var t=0;return P(e,function(){t++}),t},toArray:function(e){return P(e,function(t){return t})||[]},only:function(e){if(!F(e))throw Error("React.Children.only expected to receive a single React element child.");return e}},n.Component=o,n.Fragment=m,n.Profiler=j,n.PureComponent=S,n.StrictMode=w,n.Suspense=u,n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=se,n.act=W,n.cloneElement=function(e,t,a){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var i=O({},e.props),l=e.key,y=e.ref,p=e._owner;if(t!=null){if(t.ref!==void 0&&(y=t.ref,p=T.current),t.key!==void 0&&(l=""+t.key),e.type&&e.type.defaultProps)var f=e.type.defaultProps;for(d in t)I.call(t,d)&&!K.hasOwnProperty(d)&&(i[d]=t[d]===void 0&&f!==void 0?f[d]:t[d])}var d=arguments.length-2;if(d===1)i.children=a;else if(1<d){f=Array(d);for(var M=0;M<d;M++)f[M]=arguments[M+2];i.children=f}return{$$typeof:c,type:e.type,key:l,ref:y,props:i,_owner:p}},n.createContext=function(e){return e={$$typeof:g,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:_,_context:e},e.Consumer=e},n.createElement=Z,n.createFactory=function(e){var t=Z.bind(null,e);return t.type=e,t},n.createRef=function(){return{current:null}},n.forwardRef=function(e){return{$$typeof:R,render:e}},n.isValidElement=F,n.lazy=function(e){return{$$typeof:x,_payload:{_status:-1,_result:e},_init:ae}},n.memo=function(e,t){return{$$typeof:C,type:e,compare:t===void 0?null:t}},n.startTransition=function(e){var t=V.transition;V.transition={};try{e()}finally{V.transition=t}},n.unstable_act=W,n.useCallback=function(e,t){return v.current.useCallback(e,t)},n.useContext=function(e){return v.current.useContext(e)},n.useDebugValue=function(){},n.useDeferredValue=function(e){return v.current.useDeferredValue(e)},n.useEffect=function(e,t){return v.current.useEffect(e,t)},n.useId=function(){return v.current.useId()},n.useImperativeHandle=function(e,t,a){return v.current.useImperativeHandle(e,t,a)},n.useInsertionEffect=function(e,t){return v.current.useInsertionEffect(e,t)},n.useLayoutEffect=function(e,t){return v.current.useLayoutEffect(e,t)},n.useMemo=function(e,t){return v.current.useMemo(e,t)},n.useReducer=function(e,t,a){return v.current.useReducer(e,t,a)},n.useRef=function(e){return v.current.useRef(e)},n.useState=function(e){return v.current.useState(e)},n.useSyncExternalStore=function(e,t,a){return v.current.useSyncExternalStore(e,t,a)},n.useTransition=function(){return v.current.useTransition()},n.version="18.3.1",n}var Y;function te(){return Y||(Y=1,H.exports=le()),H.exports}/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Q;function ie(){if(Q)return z;Q=1;var c=te(),h=Symbol.for("react.element"),m=Symbol.for("react.fragment"),w=Object.prototype.hasOwnProperty,j=c.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,_={key:!0,ref:!0,__self:!0,__source:!0};function g(R,u,C){var x,b={},A=null,$=null;C!==void 0&&(A=""+C),u.key!==void 0&&(A=""+u.key),u.ref!==void 0&&($=u.ref);for(x in u)w.call(u,x)&&!_.hasOwnProperty(x)&&(b[x]=u[x]);if(R&&R.defaultProps)for(x in u=R.defaultProps,u)b[x]===void 0&&(b[x]=u[x]);return{$$typeof:h,type:R,key:A,ref:$,props:b,_owner:j.current}}return z.Fragment=m,z.jsx=g,z.jsxs=g,z}var X;function ue(){return X||(X=1,B.exports=ie()),B.exports}var r=ue(),k=te();const ke=ce(k);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=c=>c.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),re=(...c)=>c.filter((h,m,w)=>!!h&&h.trim()!==""&&w.indexOf(h)===m).join(" ").trim();/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var ye={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe=k.forwardRef(({color:c="currentColor",size:h=24,strokeWidth:m=2,absoluteStrokeWidth:w,className:j="",children:_,iconNode:g,...R},u)=>k.createElement("svg",{ref:u,...ye,width:h,height:h,stroke:c,strokeWidth:w?Number(m)*24/Number(h):m,className:re("lucide",j),...R},[...g.map(([C,x])=>k.createElement(C,x)),...Array.isArray(_)?_:[_]]));/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s=(c,h)=>{const m=k.forwardRef(({className:w,...j},_)=>k.createElement(fe,{ref:_,iconNode:h,className:re(`lucide-${de(c)}`,w),...j}));return m.displayName=`${c}`,m};/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ge=s("Activity",[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=s("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const we=s("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const je=s("Bookmark",[["path",{d:"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",key:"1fy3hk"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=s("Bot",[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Se=s("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Re=s("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Me=s("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ce=s("Folder",[["path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",key:"1kt360"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ne=s("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pe=s("Image",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ee=s("Key",[["path",{d:"m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4",key:"g0fldk"}],["path",{d:"m21 2-9.6 9.6",key:"1j0ho8"}],["circle",{cx:"7.5",cy:"15.5",r:"5.5",key:"yqb3hr"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae=s("Keyboard",[["path",{d:"M10 8h.01",key:"1r9ogq"}],["path",{d:"M12 12h.01",key:"1mp3jc"}],["path",{d:"M14 8h.01",key:"1primd"}],["path",{d:"M16 12h.01",key:"1l6xoz"}],["path",{d:"M18 8h.01",key:"emo2bl"}],["path",{d:"M6 8h.01",key:"x9i8wu"}],["path",{d:"M7 16h10",key:"wp8him"}],["path",{d:"M8 12h.01",key:"czm47f"}],["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const he=s("Mic",[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=s("Monitor",[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e=s("Moon",[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ie=s("Palette",[["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor",key:"1okk4w"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor",key:"f64h9f"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor",key:"fotxhn"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor",key:"qy21gx"}],["path",{d:"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",key:"12rzf8"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qe=s("RotateCw",[["path",{d:"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8",key:"1p45f6"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Le=s("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const me=s("Send",[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=s("Settings2",[["path",{d:"M20 7h-9",key:"3s1dr2"}],["path",{d:"M14 17H5",key:"gfn3mx"}],["circle",{cx:"17",cy:"17",r:"3",key:"18b49y"}],["circle",{cx:"7",cy:"7",r:"3",key:"dfmy0x"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ze=s("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oe=s("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ve=s("Square",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const De=s("Star",[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pe=s("Sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=s("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Te=s("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fe=s("Zap",[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]]);function Ue(){const[c,h]=k.useState([]),[m,w]=k.useState(""),[j,_]=k.useState(!1),[g,R]=k.useState(!1),[u,C]=k.useState(null),x=k.useRef(null),b=k.useRef(null);k.useEffect(()=>{var o;(o=x.current)==null||o.scrollIntoView({behavior:"smooth"})},[c]),k.useEffect(()=>{b.current&&u&&(b.current.srcObject=u)},[u]);const A=async()=>{try{const o=await navigator.mediaDevices.getDisplayMedia({video:{cursor:"always"},audio:!1});C(o),o.getVideoTracks()[0].onended=()=>{C(null),R(!1)}}catch(o){console.error("Screen capture failed:",o)}},$=()=>{u==null||u.getTracks().forEach(o=>o.stop()),C(null),R(!1)},O=()=>new Promise(o=>{if(!b.current||!u){o(null);return}const N=b.current,S=document.createElement("canvas");S.width=N.videoWidth,S.height=N.videoHeight;const E=S.getContext("2d");if(!E){o(null);return}E.drawImage(N,0,0),S.toBlob(L=>{if(L){const I=new FileReader;I.onloadend=()=>o(I.result),I.readAsDataURL(L)}else o(null)},"image/jpeg",.8)}),q=async()=>{if(!m.trim()||j)return;const o={id:Date.now().toString(),role:"user",content:m.trim(),timestamp:Date.now()};let N=null;g&&u&&(N=await O(),o.screenshot=N||void 0),h(S=>[...S,o]),w(""),_(!0),setTimeout(()=>{const S={id:(Date.now()+1).toString(),role:"assistant",content:N?"I can see your screen. Based on what you're showing me, here's my analysis...":"I'm ready to help! Connect your AI API in Settings to get started.",timestamp:Date.now()};h(E=>[...E,S]),_(!1)},1500)};return r.jsxs("div",{className:"h-full flex flex-col",children:[r.jsx("video",{ref:b,autoPlay:!0,playsInline:!0,muted:!0,className:"hidden"}),r.jsxs("div",{className:"flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]",children:[r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("h2",{className:"text-sm font-semibold text-[var(--color-text-primary)]",children:"AI Assistant"}),g&&r.jsxs("span",{className:"flex items-center gap-1.5 text-xs text-emerald-500",children:[r.jsx("span",{className:"w-2 h-2 rounded-full bg-emerald-500 animate-pulse"}),"Screen sharing"]})]}),r.jsxs("div",{className:"flex items-center gap-2",children:[r.jsxs("button",{onClick:g?$:A,className:`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${g?"bg-rose-500/10 text-rose-500 hover:bg-rose-500/20":"bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`,children:[g?r.jsx(ve,{size:12}):r.jsx(ee,{size:12}),g?"Stop":"Live Screen"]}),r.jsx("button",{className:"p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors",children:r.jsx(xe,{size:14})})]})]}),r.jsxs("div",{className:"flex-1 overflow-auto p-4 space-y-4",children:[c.length===0&&r.jsxs("div",{className:"flex flex-col items-center justify-center h-full text-center",children:[r.jsx("div",{className:"w-16 h-16 rounded-2xl bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-4",children:r.jsx(ee,{size:24,className:"text-[var(--color-text-tertiary)]"})}),r.jsx("h3",{className:"text-lg font-semibold text-[var(--color-text-primary)] mb-2",children:"AI Assistant"}),r.jsxs("p",{className:"text-sm text-[var(--color-text-secondary)] max-w-sm",children:["Ask anything. Use ",r.jsx("strong",{children:"Live Screen"})," to share your screen for context-aware responses."]}),r.jsxs("div",{className:"flex gap-2 mt-4",children:[r.jsx("button",{className:"px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors",children:'"What am I looking at?"'}),r.jsx("button",{className:"px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors",children:'"Help me fill this form"'}),r.jsx("button",{className:"px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors",children:'"Find the error"'})]})]}),c.map(o=>r.jsx("div",{className:`flex ${o.role==="user"?"justify-end":"justify-start"} animate-slide-up`,children:r.jsxs("div",{className:`max-w-[80%] rounded-2xl px-4 py-3 ${o.role==="user"?"bg-primary-600 text-white rounded-br-md":"bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-bl-md"}`,children:[r.jsx("p",{className:"text-sm whitespace-pre-wrap",children:o.content}),o.screenshot&&r.jsx("img",{src:o.screenshot,alt:"Screenshot",className:"mt-2 rounded-lg max-w-full h-auto max-h-48 object-contain"})]})},o.id)),j&&r.jsx("div",{className:"flex justify-start animate-slide-up",children:r.jsx("div",{className:"bg-[var(--color-bg-tertiary)] rounded-2xl rounded-bl-md px-4 py-3",children:r.jsxs("div",{className:"flex gap-1",children:[r.jsx("span",{className:"w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-pulse",style:{animationDelay:"0ms"}}),r.jsx("span",{className:"w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-pulse",style:{animationDelay:"200ms"}}),r.jsx("span",{className:"w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-pulse",style:{animationDelay:"400ms"}})]})})}),r.jsx("div",{ref:x})]}),r.jsx("div",{className:"px-4 py-3 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]",children:r.jsxs("div",{className:"flex items-center gap-2",children:[r.jsx("button",{className:"p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors",title:"Attach image",children:r.jsx(pe,{size:18})}),r.jsx("button",{className:"p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors",title:"Voice input",children:r.jsx(he,{size:18})}),r.jsx("input",{type:"text",value:m,onChange:o=>w(o.target.value),onKeyDown:o=>o.key==="Enter"&&!o.shiftKey&&q(),placeholder:"Ask anything...",className:"flex-1 input",disabled:j}),r.jsx("button",{onClick:q,disabled:!m.trim()||j,className:"p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",children:r.jsx(me,{size:18})})]})})]})}export{be as A,_e as B,Re as C,Me as D,Ce as F,Ne as G,Ee as K,ee as M,Ie as P,ke as R,Oe as S,Ve as T,Te as U,Fe as Z,Ae as a,Pe as b,$e as c,te as d,we as e,qe as f,ce as g,De as h,ze as i,r as j,je as k,Se as l,Le as m,ge as n,Ue as o,k as r};
