(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const i of a)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function n(a){const i={};return a.integrity&&(i.integrity=a.integrity),a.referrerPolicy&&(i.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?i.credentials="include":a.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(a){if(a.ep)return;a.ep=!0;const i=n(a);fetch(a.href,i)}})();const In=globalThis,$a=In.ShadowRoot&&(In.ShadyCSS===void 0||In.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Sa=Symbol(),Eo=new WeakMap;let ar=class{constructor(t,n,s){if(this._$cssResult$=!0,s!==Sa)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=n}get styleSheet(){let t=this.o;const n=this.t;if($a&&t===void 0){const s=n!==void 0&&n.length===1;s&&(t=Eo.get(n)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&Eo.set(n,t))}return t}toString(){return this.cssText}};const ec=e=>new ar(typeof e=="string"?e:e+"",void 0,Sa),tc=(e,...t)=>{const n=e.length===1?e[0]:t.reduce((s,a,i)=>s+(r=>{if(r._$cssResult$===!0)return r.cssText;if(typeof r=="number")return r;throw Error("Value passed to 'css' function must be a 'css' function result: "+r+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(a)+e[i+1],e[0]);return new ar(n,e,Sa)},nc=(e,t)=>{if($a)e.adoptedStyleSheets=t.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(const n of t){const s=document.createElement("style"),a=In.litNonce;a!==void 0&&s.setAttribute("nonce",a),s.textContent=n.cssText,e.appendChild(s)}},Lo=$a?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let n="";for(const s of t.cssRules)n+=s.cssText;return ec(n)})(e):e;const{is:sc,defineProperty:ac,getOwnPropertyDescriptor:oc,getOwnPropertyNames:ic,getOwnPropertySymbols:rc,getPrototypeOf:lc}=Object,Qn=globalThis,Io=Qn.trustedTypes,cc=Io?Io.emptyScript:"",dc=Qn.reactiveElementPolyfillSupport,Yt=(e,t)=>e,Fn={toAttribute(e,t){switch(t){case Boolean:e=e?cc:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},ka=(e,t)=>!sc(e,t),Do={attribute:!0,type:String,converter:Fn,reflect:!1,useDefault:!1,hasChanged:ka};Symbol.metadata??=Symbol("metadata"),Qn.litPropertyMetadata??=new WeakMap;let Mt=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,n=Do){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(t,n),!n.noAccessor){const s=Symbol(),a=this.getPropertyDescriptor(t,s,n);a!==void 0&&ac(this.prototype,t,a)}}static getPropertyDescriptor(t,n,s){const{get:a,set:i}=oc(this.prototype,t)??{get(){return this[n]},set(r){this[n]=r}};return{get:a,set(r){const c=a?.call(this);i?.call(this,r),this.requestUpdate(t,c,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Do}static _$Ei(){if(this.hasOwnProperty(Yt("elementProperties")))return;const t=lc(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(Yt("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Yt("properties"))){const n=this.properties,s=[...ic(n),...rc(n)];for(const a of s)this.createProperty(a,n[a])}const t=this[Symbol.metadata];if(t!==null){const n=litPropertyMetadata.get(t);if(n!==void 0)for(const[s,a]of n)this.elementProperties.set(s,a)}this._$Eh=new Map;for(const[n,s]of this.elementProperties){const a=this._$Eu(n,s);a!==void 0&&this._$Eh.set(a,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const n=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const a of s)n.unshift(Lo(a))}else t!==void 0&&n.push(Lo(t));return n}static _$Eu(t,n){const s=n.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,n=this.constructor.elementProperties;for(const s of n.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return nc(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,n,s){this._$AK(t,s)}_$ET(t,n){const s=this.constructor.elementProperties.get(t),a=this.constructor._$Eu(t,s);if(a!==void 0&&s.reflect===!0){const i=(s.converter?.toAttribute!==void 0?s.converter:Fn).toAttribute(n,s.type);this._$Em=t,i==null?this.removeAttribute(a):this.setAttribute(a,i),this._$Em=null}}_$AK(t,n){const s=this.constructor,a=s._$Eh.get(t);if(a!==void 0&&this._$Em!==a){const i=s.getPropertyOptions(a),r=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:Fn;this._$Em=a;const c=r.fromAttribute(n,i.type);this[a]=c??this._$Ej?.get(a)??c,this._$Em=null}}requestUpdate(t,n,s,a=!1,i){if(t!==void 0){const r=this.constructor;if(a===!1&&(i=this[t]),s??=r.getPropertyOptions(t),!((s.hasChanged??ka)(i,n)||s.useDefault&&s.reflect&&i===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,s))))return;this.C(t,n,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,n,{useDefault:s,reflect:a,wrapped:i},r){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??n??this[t]),i!==!0||r!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(n=void 0),this._$AL.set(t,n)),a===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[a,i]of this._$Ep)this[a]=i;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[a,i]of s){const{wrapped:r}=i,c=this[a];r!==!0||this._$AL.has(a)||c===void 0||this.C(a,void 0,i,c)}}let t=!1;const n=this._$AL;try{t=this.shouldUpdate(n),t?(this.willUpdate(n),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(n)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(n)}willUpdate(t){}_$AE(t){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(t){}firstUpdated(t){}};Mt.elementStyles=[],Mt.shadowRootOptions={mode:"open"},Mt[Yt("elementProperties")]=new Map,Mt[Yt("finalized")]=new Map,dc?.({ReactiveElement:Mt}),(Qn.reactiveElementVersions??=[]).push("2.1.2");const Aa=globalThis,Ro=e=>e,On=Aa.trustedTypes,Po=On?On.createPolicy("lit-html",{createHTML:e=>e}):void 0,or="$lit$",Ye=`lit$${Math.random().toFixed(9).slice(2)}$`,ir="?"+Ye,uc=`<${ir}>`,mt=document,nn=()=>mt.createComment(""),sn=e=>e===null||typeof e!="object"&&typeof e!="function",Ca=Array.isArray,gc=e=>Ca(e)||typeof e?.[Symbol.iterator]=="function",$s=`[ 	
\f\r]`,Ut=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,No=/-->/g,Fo=/>/g,at=RegExp(`>|${$s}(?:([^\\s"'>=/]+)(${$s}*=${$s}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Oo=/'/g,Uo=/"/g,rr=/^(?:script|style|textarea|title)$/i,lr=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),l=lr(1),xn=lr(2),Ze=Symbol.for("lit-noChange"),v=Symbol.for("lit-nothing"),Bo=new WeakMap,gt=mt.createTreeWalker(mt,129);function cr(e,t){if(!Ca(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return Po!==void 0?Po.createHTML(t):t}const pc=(e,t)=>{const n=e.length-1,s=[];let a,i=t===2?"<svg>":t===3?"<math>":"",r=Ut;for(let c=0;c<n;c++){const d=e[c];let g,h,p=-1,f=0;for(;f<d.length&&(r.lastIndex=f,h=r.exec(d),h!==null);)f=r.lastIndex,r===Ut?h[1]==="!--"?r=No:h[1]!==void 0?r=Fo:h[2]!==void 0?(rr.test(h[2])&&(a=RegExp("</"+h[2],"g")),r=at):h[3]!==void 0&&(r=at):r===at?h[0]===">"?(r=a??Ut,p=-1):h[1]===void 0?p=-2:(p=r.lastIndex-h[2].length,g=h[1],r=h[3]===void 0?at:h[3]==='"'?Uo:Oo):r===Uo||r===Oo?r=at:r===No||r===Fo?r=Ut:(r=at,a=void 0);const u=r===at&&e[c+1].startsWith("/>")?" ":"";i+=r===Ut?d+uc:p>=0?(s.push(g),d.slice(0,p)+or+d.slice(p)+Ye+u):d+Ye+(p===-2?c:u)}return[cr(e,i+(e[n]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]};let Gs=class dr{constructor({strings:t,_$litType$:n},s){let a;this.parts=[];let i=0,r=0;const c=t.length-1,d=this.parts,[g,h]=pc(t,n);if(this.el=dr.createElement(g,s),gt.currentNode=this.el.content,n===2||n===3){const p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(a=gt.nextNode())!==null&&d.length<c;){if(a.nodeType===1){if(a.hasAttributes())for(const p of a.getAttributeNames())if(p.endsWith(or)){const f=h[r++],u=a.getAttribute(p).split(Ye),m=/([.?@])?(.*)/.exec(f);d.push({type:1,index:i,name:m[2],strings:u,ctor:m[1]==="."?hc:m[1]==="?"?fc:m[1]==="@"?vc:Jn}),a.removeAttribute(p)}else p.startsWith(Ye)&&(d.push({type:6,index:i}),a.removeAttribute(p));if(rr.test(a.tagName)){const p=a.textContent.split(Ye),f=p.length-1;if(f>0){a.textContent=On?On.emptyScript:"";for(let u=0;u<f;u++)a.append(p[u],nn()),gt.nextNode(),d.push({type:2,index:++i});a.append(p[f],nn())}}}else if(a.nodeType===8)if(a.data===ir)d.push({type:2,index:i});else{let p=-1;for(;(p=a.data.indexOf(Ye,p+1))!==-1;)d.push({type:7,index:i}),p+=Ye.length-1}i++}}static createElement(t,n){const s=mt.createElement("template");return s.innerHTML=t,s}};function It(e,t,n=e,s){if(t===Ze)return t;let a=s!==void 0?n._$Co?.[s]:n._$Cl;const i=sn(t)?void 0:t._$litDirective$;return a?.constructor!==i&&(a?._$AO?.(!1),i===void 0?a=void 0:(a=new i(e),a._$AT(e,n,s)),s!==void 0?(n._$Co??=[])[s]=a:n._$Cl=a),a!==void 0&&(t=It(e,a._$AS(e,t.values),a,s)),t}class mc{constructor(t,n){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:n},parts:s}=this._$AD,a=(t?.creationScope??mt).importNode(n,!0);gt.currentNode=a;let i=gt.nextNode(),r=0,c=0,d=s[0];for(;d!==void 0;){if(r===d.index){let g;d.type===2?g=new Yn(i,i.nextSibling,this,t):d.type===1?g=new d.ctor(i,d.name,d.strings,this,t):d.type===6&&(g=new bc(i,this,t)),this._$AV.push(g),d=s[++c]}r!==d?.index&&(i=gt.nextNode(),r++)}return gt.currentNode=mt,a}p(t){let n=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,n),n+=s.strings.length-2):s._$AI(t[n])),n++}}let Yn=class ur{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,n,s,a){this.type=2,this._$AH=v,this._$AN=void 0,this._$AA=t,this._$AB=n,this._$AM=s,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const n=this._$AM;return n!==void 0&&t?.nodeType===11&&(t=n.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,n=this){t=It(this,t,n),sn(t)?t===v||t==null||t===""?(this._$AH!==v&&this._$AR(),this._$AH=v):t!==this._$AH&&t!==Ze&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):gc(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==v&&sn(this._$AH)?this._$AA.nextSibling.data=t:this.T(mt.createTextNode(t)),this._$AH=t}$(t){const{values:n,_$litType$:s}=t,a=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=Gs.createElement(cr(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===a)this._$AH.p(n);else{const i=new mc(a,this),r=i.u(this.options);i.p(n),this.T(r),this._$AH=i}}_$AC(t){let n=Bo.get(t.strings);return n===void 0&&Bo.set(t.strings,n=new Gs(t)),n}k(t){Ca(this._$AH)||(this._$AH=[],this._$AR());const n=this._$AH;let s,a=0;for(const i of t)a===n.length?n.push(s=new ur(this.O(nn()),this.O(nn()),this,this.options)):s=n[a],s._$AI(i),a++;a<n.length&&(this._$AR(s&&s._$AB.nextSibling,a),n.length=a)}_$AR(t=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);t!==this._$AB;){const s=Ro(t).nextSibling;Ro(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}};class Jn{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,n,s,a,i){this.type=1,this._$AH=v,this._$AN=void 0,this.element=t,this.name=n,this._$AM=a,this.options=i,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=v}_$AI(t,n=this,s,a){const i=this.strings;let r=!1;if(i===void 0)t=It(this,t,n,0),r=!sn(t)||t!==this._$AH&&t!==Ze,r&&(this._$AH=t);else{const c=t;let d,g;for(t=i[0],d=0;d<i.length-1;d++)g=It(this,c[s+d],n,d),g===Ze&&(g=this._$AH[d]),r||=!sn(g)||g!==this._$AH[d],g===v?t=v:t!==v&&(t+=(g??"")+i[d+1]),this._$AH[d]=g}r&&!a&&this.j(t)}j(t){t===v?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}let hc=class extends Jn{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===v?void 0:t}},fc=class extends Jn{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==v)}},vc=class extends Jn{constructor(t,n,s,a,i){super(t,n,s,a,i),this.type=5}_$AI(t,n=this){if((t=It(this,t,n,0)??v)===Ze)return;const s=this._$AH,a=t===v&&s!==v||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,i=t!==v&&(s===v||a);a&&this.element.removeEventListener(this.name,this,s),i&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},bc=class{constructor(t,n,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=n,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){It(this,t)}};const yc={I:Yn},wc=Aa.litHtmlPolyfillSupport;wc?.(Gs,Yn),(Aa.litHtmlVersions??=[]).push("3.3.2");const xc=(e,t,n)=>{const s=n?.renderBefore??t;let a=s._$litPart$;if(a===void 0){const i=n?.renderBefore??null;s._$litPart$=a=new Yn(t.insertBefore(nn(),i),i,void 0,n??{})}return a._$AI(e),a};const Ta=globalThis;let Lt=class extends Mt{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=xc(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Ze}};Lt._$litElement$=!0,Lt.finalized=!0,Ta.litElementHydrateSupport?.({LitElement:Lt});const $c=Ta.litElementPolyfillSupport;$c?.({LitElement:Lt});(Ta.litElementVersions??=[]).push("4.2.2");const gr=e=>(t,n)=>{n!==void 0?n.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)};const Sc={attribute:!0,type:String,converter:Fn,reflect:!1,hasChanged:ka},kc=(e=Sc,t,n)=>{const{kind:s,metadata:a}=n;let i=globalThis.litPropertyMetadata.get(a);if(i===void 0&&globalThis.litPropertyMetadata.set(a,i=new Map),s==="setter"&&((e=Object.create(e)).wrapped=!0),i.set(n.name,e),s==="accessor"){const{name:r}=n;return{set(c){const d=t.get.call(this);t.set.call(this,c),this.requestUpdate(r,d,e,!0,c)},init(c){return c!==void 0&&this.C(r,void 0,e,c),c}}}if(s==="setter"){const{name:r}=n;return function(c){const d=this[r];t.call(this,c),this.requestUpdate(r,d,e,!0,c)}}throw Error("Unsupported decorator location: "+s)};function Zn(e){return(t,n)=>typeof n=="object"?kc(e,t,n):((s,a,i)=>{const r=a.hasOwnProperty(i);return a.constructor.createProperty(i,s),r?Object.getOwnPropertyDescriptor(a,i):void 0})(e,t,n)}function k(e){return Zn({...e,state:!0,attribute:!1})}async function we(e,t){if(!(!e.client||!e.connected)&&!e.channelsLoading){e.channelsLoading=!0,e.channelsError=null;try{const n=await e.client.request("channels.status",{probe:t,timeoutMs:8e3});e.channelsSnapshot=n,e.channelsLastSuccess=Date.now()}catch(n){e.channelsError=String(n)}finally{e.channelsLoading=!1}}}async function Ac(e,t){if(!(!e.client||!e.connected||e.whatsappBusy)){e.whatsappBusy=!0;try{const n=await e.client.request("web.login.start",{force:t,timeoutMs:3e4});e.whatsappLoginMessage=n.message??null,e.whatsappLoginQrDataUrl=n.qrDataUrl??null,e.whatsappLoginConnected=null}catch(n){e.whatsappLoginMessage=String(n),e.whatsappLoginQrDataUrl=null,e.whatsappLoginConnected=null}finally{e.whatsappBusy=!1}}}async function Cc(e){if(!(!e.client||!e.connected||e.whatsappBusy)){e.whatsappBusy=!0;try{const t=await e.client.request("web.login.wait",{timeoutMs:12e4});e.whatsappLoginMessage=t.message??null,e.whatsappLoginConnected=t.connected??null,t.connected&&(e.whatsappLoginQrDataUrl=null)}catch(t){e.whatsappLoginMessage=String(t),e.whatsappLoginConnected=null}finally{e.whatsappBusy=!1}}}async function Tc(e){if(!(!e.client||!e.connected||e.whatsappBusy)){e.whatsappBusy=!0;try{await e.client.request("channels.logout",{channel:"whatsapp"}),e.whatsappLoginMessage="Logged out.",e.whatsappLoginQrDataUrl=null,e.whatsappLoginConnected=null}catch(t){e.whatsappLoginMessage=String(t)}finally{e.whatsappBusy=!1}}}function ht(e){return typeof structuredClone=="function"?structuredClone(e):JSON.parse(JSON.stringify(e))}function Dt(e){return`${JSON.stringify(e,null,2).trimEnd()}
`}function pr(e,t,n){if(t.length===0)return;let s=e;for(let i=0;i<t.length-1;i+=1){const r=t[i],c=t[i+1];if(typeof r=="number"){if(!Array.isArray(s))return;s[r]==null&&(s[r]=typeof c=="number"?[]:{}),s=s[r]}else{if(typeof s!="object"||s==null)return;const d=s;d[r]==null&&(d[r]=typeof c=="number"?[]:{}),s=d[r]}}const a=t[t.length-1];if(typeof a=="number"){Array.isArray(s)&&(s[a]=n);return}typeof s=="object"&&s!=null&&(s[a]=n)}function mr(e,t){if(t.length===0)return;let n=e;for(let a=0;a<t.length-1;a+=1){const i=t[a];if(typeof i=="number"){if(!Array.isArray(n))return;n=n[i]}else{if(typeof n!="object"||n==null)return;n=n[i]}if(n==null)return}const s=t[t.length-1];if(typeof s=="number"){Array.isArray(n)&&n.splice(s,1);return}typeof n=="object"&&n!=null&&delete n[s]}async function Se(e){if(!(!e.client||!e.connected)){e.configLoading=!0,e.lastError=null;try{const t=await e.client.request("config.get",{});Mc(e,t)}catch(t){e.lastError=String(t)}finally{e.configLoading=!1}}}async function hr(e){if(!(!e.client||!e.connected)&&!e.configSchemaLoading){e.configSchemaLoading=!0;try{const t=await e.client.request("config.schema",{});_c(e,t)}catch(t){e.lastError=String(t)}finally{e.configSchemaLoading=!1}}}function _c(e,t){e.configSchema=t.schema??null,e.configUiHints=t.uiHints??{},e.configSchemaVersion=t.version??null}function Mc(e,t){e.configSnapshot=t;const n=typeof t.raw=="string"?t.raw:t.config&&typeof t.config=="object"?Dt(t.config):e.configRaw;!e.configFormDirty||e.configFormMode==="raw"?e.configRaw=n:e.configForm?e.configRaw=Dt(e.configForm):e.configRaw=n,e.configValid=typeof t.valid=="boolean"?t.valid:null,e.configIssues=Array.isArray(t.issues)?t.issues:[],e.configFormDirty||(e.configForm=ht(t.config??{}),e.configFormOriginal=ht(t.config??{}),e.configRawOriginal=n)}async function Dn(e){if(!(!e.client||!e.connected)){e.configSaving=!0,e.lastError=null;try{const t=e.configFormMode==="form"&&e.configForm?Dt(e.configForm):e.configRaw;let n=e.configSnapshot?.hash;if(n||(await Se(e),n=e.configSnapshot?.hash),!n){e.lastError="Config hash missing; reload and retry.";return}await e.client.request("config.set",{raw:t,baseHash:n}),e.configFormDirty=!1,await Se(e)}catch(t){e.lastError=String(t)}finally{e.configSaving=!1}}}async function Ec(e){if(!(!e.client||!e.connected)){e.configApplying=!0,e.lastError=null;try{const t=e.configFormMode==="form"&&e.configForm?Dt(e.configForm):e.configRaw;let n=e.configSnapshot?.hash;if(n||(await Se(e),n=e.configSnapshot?.hash),!n){e.lastError="Config hash missing; reload and retry.";return}await e.client.request("config.apply",{raw:t,baseHash:n,sessionKey:e.applySessionKey}),e.configFormDirty=!1,await Se(e)}catch(t){e.lastError=String(t)}finally{e.configApplying=!1}}}async function Lc(e){if(!(!e.client||!e.connected)){e.updateRunning=!0,e.lastError=null;try{await e.client.request("update.run",{sessionKey:e.applySessionKey})}catch(t){e.lastError=String(t)}finally{e.updateRunning=!1}}}function $e(e,t,n){const s=ht(e.configForm??e.configSnapshot?.config??{});pr(s,t,n),e.configForm=s,e.configFormDirty=!0,e.configFormMode==="form"&&(e.configRaw=Dt(s))}function We(e,t){const n=ht(e.configForm??e.configSnapshot?.config??{});mr(n,t),e.configForm=n,e.configFormDirty=!0,e.configFormMode==="form"&&(e.configRaw=Dt(n))}function _a(){return typeof document>"u"?"en":(document.documentElement?.lang?.toLowerCase()??"").startsWith("zh")?"zh":"en"}const Ic={tabGroupChat:"Chat",tabGroupControl:"Control",tabGroupAgent:"Agent",tabGroupSettings:"Settings",subtitleAgents:"Manage agent workspaces, tools, and identities.",subtitleOverview:"Gateway status, entry points, and a fast health read.",subtitleChannels:"Manage channels and settings.",subtitleInstances:"Presence beacons from connected clients and nodes.",subtitleSessions:"Inspect active sessions and adjust per-session defaults.",subtitleUsage:"",subtitleCron:"Schedule wakeups and recurring agent runs.",subtitleSkills:"Manage skill availability and API key injection.",subtitleNodes:"Paired devices, capabilities, and command exposure.",subtitleChat:"Direct gateway chat session for quick interventions.",subtitleAgentSwarm:"Multi-agent swarm collaboration for ops and SRE.",subtitleConfig:"Edit ~/.openclaw/openclaw.json safely.",subtitleDebug:"Gateway snapshots, events, and manual RPC calls.",subtitleLogs:"Live tail of the gateway file logs.",navTitleAgents:"Agents",navTitleOverview:"Overview",navTitleChannels:"Channels",navTitleInstances:"Instances",navTitleSessions:"Sessions",navTitleUsage:"Usage",navTitleCron:"Cron Jobs",navTitleSkills:"Skills",navTitleNodes:"Nodes",navTitleChat:"Chat",navTitleAgentSwarm:"Agent Swarm",agentSwarmDevBadge:"In Development",navTitleConfig:"Config",navTitleDebug:"Debug",navTitleLogs:"Logs",navTitleControl:"Control",overviewGatewayAccess:"Gateway Access",overviewGatewayAccessSub:"Where the dashboard connects and how it authenticates.",overviewWebSocketUrl:"WebSocket URL",overviewGatewayToken:"Gateway Token",overviewPassword:"Password (not stored)",overviewDefaultSessionKey:"Default Session Key",overviewConnect:"Connect",overviewRefresh:"Refresh",overviewConnectHint:"Click Connect to apply connection changes.",overviewSnapshot:"Snapshot",overviewSnapshotSub:"Latest gateway handshake information.",overviewStatus:"Status",overviewConnected:"Connected",overviewDisconnected:"Disconnected",overviewUptime:"Uptime",overviewTickInterval:"Tick Interval",overviewLastChannelsRefresh:"Last Channels Refresh",overviewChannelsHint:"Use Channels to link WhatsApp, Telegram, Discord, Signal, or iMessage.",overviewInstances:"Instances",overviewInstancesSub:"Presence beacons in the last 5 minutes.",overviewSessions:"Sessions",overviewSessionsSub:"Recent session keys tracked by the gateway.",overviewCron:"Cron",overviewCronNext:"Next wake",overviewCronEnabled:"Enabled",overviewCronDisabled:"Disabled",overviewNotes:"Notes",overviewNotesSub:"Quick reminders for remote control setups.",overviewNoteTailscale:"Tailscale serve",overviewNoteTailscaleSub:"Prefer serve mode to keep the gateway on loopback with tailnet auth.",overviewNoteSessionHygiene:"Session hygiene",overviewNoteSessionHygieneSub:"Use /new or sessions.patch to reset context.",overviewNoteCron:"Cron reminders",overviewNoteCronSub:"Use isolated sessions for recurring runs.",commonLoading:"Loading…",commonRefresh:"Refresh",commonRefreshing:"Refreshing…",commonSaving:"Saving…",commonDelete:"Delete",commonFilter:"Filter",commonOptional:"(optional)",commonInherit:"inherit",commonOffExplicit:"off (explicit)",commonNA:"n/a",commonYes:"Yes",commonNo:"No",channelsHealth:"Channel health",channelsHealthSub:"Channel status snapshots from the gateway.",channelsNoSnapshot:"No snapshot yet.",channelsSchemaUnavailable:"Schema unavailable. Use Raw.",channelsConfigSchemaUnavailable:"Channel config schema unavailable.",channelsLoadingConfigSchema:"Loading config schema…",commonSave:"Save",commonReload:"Reload",commonCancel:"Cancel",channelConfigured:"Configured",channelRunning:"Running",channelLastStart:"Last start",channelLastProbe:"Last probe",channelProbe:"Probe",channelProbeOk:"ok",channelProbeFailed:"failed",channelLinked:"Linked",channelConnected:"Connected",channelLastConnect:"Last connect",channelLastMessage:"Last message",channelAuthAge:"Auth age",channelBaseUrl:"Base URL",channelCredential:"Credential",channelAudience:"Audience",channelMode:"Mode",channelPublicKey:"Public Key",channelLastInbound:"Last inbound",channelActive:"Active",channelGenericSub:"Channel status and configuration.",channelAccounts:"Accounts",channelWhatsApp:"WhatsApp",channelWhatsAppSub:"Link WhatsApp Web and monitor connection health.",channelTelegram:"Telegram",channelTelegramSub:"Bot status and channel configuration.",channelDiscord:"Discord",channelDiscordSub:"Bot status and channel configuration.",channelGoogleChat:"Google Chat",channelGoogleChatSub:"Chat API webhook status and channel configuration.",channelIMessage:"iMessage",channelIMessageSub:"macOS bridge status and channel configuration.",channelSignal:"Signal",channelSignalSub:"signal-cli status and channel configuration.",channelSlack:"Slack",channelSlackSub:"Socket mode status and channel configuration.",channelNostr:"Nostr",channelNostrSub:"Decentralized DMs via Nostr relays (NIP-04).",channelWhatsAppWorking:"Working…",channelShowQr:"Show QR",channelRelink:"Relink",channelWaitForScan:"Wait for scan",channelLogout:"Logout",nostrEditProfile:"Edit Profile",nostrAccount:"Account",nostrUsername:"Username",nostrDisplayName:"Display Name",nostrBio:"Bio",nostrAvatarUrl:"Avatar URL",nostrBannerUrl:"Banner URL",nostrWebsite:"Website",nostrNip05:"NIP-05 Identifier",nostrLud16:"Lightning Address",nostrSavePublish:"Save & Publish",nostrImportRelays:"Import from Relays",nostrHideAdvanced:"Hide Advanced",nostrShowAdvanced:"Show Advanced",nostrUnsavedChanges:"You have unsaved changes",nostrProfilePreview:"Profile picture preview",nostrAdvanced:"Advanced",nostrImporting:"Importing…",nostrNoProfileSet:'No profile set. Click "Edit Profile" to add your name, bio, and avatar.',nostrProfile:"Profile",nostrAbout:"About",nostrName:"Name",instancesTitle:"Connected Instances",instancesSub:"Presence beacons from the gateway and clients.",instancesNoReported:"No instances reported yet.",instancesUnknownHost:"unknown host",instancesLastInput:"Last input",instancesReason:"Reason",instancesScopes:"scopes",sessionsTitle:"Sessions",sessionsSub:"Active session keys and per-session overrides.",sessionsActiveWithin:"Active within (minutes)",sessionsLimit:"Limit",sessionsIncludeGlobal:"Include global",sessionsIncludeUnknown:"Include unknown",sessionsStore:"Store",sessionsKey:"Key",sessionsLabel:"Label",sessionsKind:"Kind",sessionsUpdated:"Updated",sessionsTokens:"Tokens",sessionsThinking:"Thinking",sessionsVerbose:"Verbose",sessionsReasoning:"Reasoning",sessionsActions:"Actions",sessionsNoFound:"No sessions found.",usageNoTimeline:"No timeline data yet.",usageNoData:"No data",usageHours:"Hours",usageMidnight:"Midnight",usage4am:"4am",usage8am:"8am",usageNoon:"Noon",usage4pm:"4pm",usage8pm:"8pm",usageDailyToken:"Daily Token Usage",usageDailyCost:"Daily Cost Usage",usageOutput:"Output",usageInput:"Input",usageCacheWrite:"Cache Write",usageCacheRead:"Cache Read",usageClearFilters:"Clear filters",usageRemoveFilter:"Remove filter",usageDays:"Days",usageHoursLabel:"Hours",usageSession:"Session",usageFiltered:"filtered",usageVisible:"visible",usageExport:"Export",usageActivityByTime:"Activity by Time",usageMosaicSubNoData:"Estimates require session timestamps.",usageTokensUnit:"tokens",usageTimeZoneLocal:"Local",usageTimeZoneUtc:"UTC",usageDayOfWeek:"Day of Week",usageDailyUsage:"Daily Usage",usageTotal:"Total",usageByType:"By Type",usageTokensByType:"Tokens by Type",usageCostByType:"Cost by Type",usageTotalLabel:"Total",usageOverview:"Usage Overview",usageMessages:"Messages",usageToolCalls:"Tool Calls",usageErrors:"Errors",usageAvgTokensMsg:"Avg Tokens / Msg",usageAvgCostMsg:"Avg Cost / Msg",usageSessionsCard:"Sessions",usageThroughput:"Throughput",usageErrorRate:"Error Rate",usageCacheHitRate:"Cache Hit Rate",usageMessagesHint:"Total user + assistant messages in range.",usageToolCallsHint:"Total tool call count across sessions.",usageErrorsHint:"Total message/tool errors in range.",usageAvgTokensMsgHint:"Average tokens per message in this range.",usageSessionsHint:"Distinct sessions in the range.",usageThroughputHint:"Throughput shows tokens per minute over active time. Higher is better.",usageErrorRateHint:"Error rate = errors / total messages. Lower is better.",usageCacheHitRateHint:"Cache hit rate = cache read / (input + cache read). Higher is better.",usageTopModels:"Top Models",usageTopProviders:"Top Providers",usageTopTools:"Top Tools",usageTopAgents:"Top Agents",usageTopChannels:"Top Channels",usagePeakErrorDays:"Peak Error Days",usagePeakErrorHours:"Peak Error Hours",usageNoModelData:"No model data",usageNoProviderData:"No provider data",usageNoToolCalls:"No tool calls",usageNoAgentData:"No agent data",usageNoChannelData:"No channel data",usageNoErrorData:"No error data",usageShown:"shown",usageTotalSessions:"total",usageAvg:"avg",usageAll:"All",usageRecentlyViewed:"Recently viewed",usageSort:"Sort",usageCost:"Cost",usageErrorsCol:"Errors",usageMessagesCol:"Messages",usageRecent:"Recent",usageTokensCol:"Tokens",usageDescending:"Descending",usageAscending:"Ascending",usageClearSelection:"Clear Selection",usageNoRecentSessions:"No recent sessions",usageNoSessionsInRange:"No sessions in range",usageCopy:"Copy",usageCopySessionName:"Copy session name",usageSelectedCount:"Selected",usageMoreSessions:"more",usageUserAssistant:"user · assistant",usageToolsUsed:"tools used",usageToolResults:"tool results",usageAcrossMessages:"Across messages",usageInRange:"in range",usageCached:"cached",usagePrompt:"prompt",usageCacheHint:"Cache hit rate = cache read / (input + cache read). Higher is better.",usageErrorHint:"Error rate = errors / total messages. Lower is better.",usageTokensHint:"Average tokens per message in this range.",usageCostHint:"Average cost per message when providers report costs.",usageCostHintMissing:"Average cost per message when providers report costs. Cost data is missing for some or all sessions in this range.",usageModelMix:"Model Mix",usageDuration:"Duration",usageCloseSessionDetails:"Close session details",usageLoading:"Loading…",usageNoTimelineData:"No timeline data",usageNoDataInRange:"No data in range",usageUsageOverTime:"Usage Over Time",usagePerTurn:"Per Turn",usageCumulative:"Cumulative",usageNoContextData:"No context data",usageSystemPromptBreakdown:"System Prompt Breakdown",usageExpandAll:"Expand all",usageCollapseAll:"Collapse All",usageBaseContextPerMessage:"Base context per message",usageSys:"Sys",usageSkills:"Skills",usageToolsLabel:"Tools",usageFiles:"Files",usageConversation:"Conversation",usageNoMessages:"No messages",usageSearchConversation:"Search conversation",usageClear:"Clear",usageHasTools:"Has tools",usageUser:"User",usageAssistant:"Assistant",usageTool:"Tool",usageToolResult:"Tool result",usageMessagesCount:"messages",usageNoMessagesMatchFilters:"No messages match the filters.",usageTokenUsage:"Token Usage",usageToday:"Today",usage7d:"7d",usage30d:"30d",usageExportSessionsCsv:"Sessions (CSV)",usageExportDailyCsv:"Daily (CSV)",usageSessionsCount:"sessions",usageQueryHintMatch:"{count} of {total} sessions match",usageQueryHintInRange:"{total} sessions in range",usagePageSubtitle:"See where tokens go, when sessions spike, and what drives cost.",usageCalls:"calls",cronScheduler:"Scheduler",cronSchedulerSub:"Gateway-owned cron scheduler status.",cronEnabled:"Enabled",cronJobs:"Jobs",cronNewJob:"New Job",cronNewJobSub:"Create a scheduled wakeup or agent run.",cronName:"Name",cronDescription:"Description",cronAgentId:"Agent ID",cronSchedule:"Schedule",cronEvery:"Every",cronAt:"At",cronCron:"Cron",cronSession:"Session",cronMain:"Main",cronIsolated:"Isolated",cronWakeMode:"Wake mode",cronNextHeartbeat:"Next heartbeat",cronNow:"Now",cronPayload:"Payload",cronSystemEvent:"System event",cronAgentTurn:"Agent turn",cronSystemText:"System text",cronAgentMessage:"Agent message",cronDelivery:"Delivery",cronAnnounceSummary:"Announce summary (default)",cronNoneInternal:"None (internal)",cronChannel:"Channel",cronTo:"To",cronAddJob:"Add job",cronJobsTitle:"Jobs",cronJobsSub:"All scheduled jobs stored in the gateway.",cronNoJobsYet:"No jobs yet.",cronRunHistory:"Run history",cronRunHistorySub:"Latest runs for",cronSelectJob:"(select a job)",cronNoRunsYet:"No runs yet.",cronSelectJobToInspect:"Select a job to inspect run history.",cronRunAt:"Run at",cronUnit:"Unit",cronMinutes:"Minutes",cronHours:"Hours",cronDays:"Days",cronExpression:"Expression",cronTimeoutSeconds:"Timeout (seconds)",cronLast:"last",agentsFiles:"Files",agentsRuntime:"Runtime",agentsWeb:"Web",agentsMemory:"Memory",agentsSessions:"Sessions",agentsUi:"UI",agentsMessaging:"Messaging",agentsAutomation:"Automation",agentsReadFile:"Read file contents",agentsWriteFile:"Create or overwrite files",agentsEdit:"Make precise edits",agentsApplyPatch:"Patch files (OpenAI)",agentsExec:"Run shell commands",agentsProcess:"Manage background processes",agentsWebSearch:"Search the web",agentsWebFetch:"Fetch web content",agentsMemorySearch:"Semantic search",agentsMemoryGet:"Read memory files",agentsSessionsList:"List sessions",agentsSessionsHistory:"Session history",agentsSessionsSend:"Send to session",agentsSessionsSpawn:"Spawn sub-agent",agentsSessionStatus:"Session status",agentsBrowser:"Control web browser",agentsCanvas:"Control canvases",agentsMessage:"Send messages",agentsScheduleTasks:"Schedule tasks",agentsGatewayControl:"Gateway control",agentsNodesDevices:"Nodes + devices",agentsListAgents:"List agents",agentsImageUnderstanding:"Image understanding",agentsNodes:"Nodes",agentsAgents:"Agents",agentsMedia:"Media",agentsTitle:"Agents",agentsConfigured:"configured.",agentsNoFound:"No agents found.",agentsSelectAgent:"Select an agent",agentsSelectAgentSub:"Pick an agent to inspect its workspace and tools.",agentsWorkspaceRouting:"Agent workspace and routing.",agentsProfileMinimal:"Minimal",agentsProfileCoding:"Coding",agentsProfileMessaging:"Messaging",agentsProfileFull:"Full",agentsDefault:"default",agentsSelected:"selected",agentsAllSkills:"all skills",agentsCurrentModel:"Current",agentsInheritDefault:"Inherit default",agentsOverview:"Overview",agentsOverviewSub:"Workspace paths and identity metadata.",agentsWorkspace:"Workspace",agentsPrimaryModel:"Primary Model",agentsIdentityName:"Identity Name",agentsDefaultLabel:"Default",agentsIdentityEmoji:"Identity Emoji",agentsSkillsFilter:"Skills Filter",agentsModelSelection:"Model Selection",agentsPrimaryModelLabel:"Primary model",agentsPrimaryModelDefault:"(default)",agentsFallbacksLabel:"Fallbacks (comma-separated)",agentsReloadConfig:"Reload Config",agentsAgentContext:"Agent Context",agentsContextWorkspaceIdentity:"Workspace, identity, and model configuration.",agentsContextWorkspaceScheduling:"Workspace and scheduling targets.",agentsChannels:"Channels",agentsChannelsSub:"Gateway-wide channel status snapshot.",agentsLoadChannels:"Load channels to see live status.",agentsNoChannels:"No channels found.",agentsConnected:"connected",agentsConfiguredLabel:"configured",agentsEnabled:"enabled",agentsDisabled:"disabled",agentsNoAccounts:"no accounts",agentsNotConfigured:"not configured",agentsScheduler:"Scheduler",agentsSchedulerSub:"Gateway cron status.",agentsNextWake:"Next wake",agentsCronJobs:"Agent Cron Jobs",agentsCronJobsSub:"Scheduled jobs targeting this agent.",agentsNoJobsAssigned:"No jobs assigned.",agentsCoreFiles:"Core Files",agentsCoreFilesSub:"Bootstrap persona, identity, and tool guidance.",agentsLoadWorkspaceFiles:"Load the agent workspace files to edit core instructions.",agentsNoFilesFound:"No files found.",agentsSelectFileToEdit:"Select a file to edit.",agentsReset:"Reset",agentsFileMissingCreate:"This file is missing. Saving will create it in the agent workspace.",agentsUnavailable:"Unavailable",agentsTabOverview:"Overview",agentsTabFiles:"Files",agentsTabTools:"Tools",agentsTabSkills:"Skills",agentsTabChannels:"Channels",agentsTabCron:"Cron Jobs",agentsFallback:"fallback",agentsNever:"never",agentsLastRefresh:"Last refresh",agentsSkillsPanelSub:"Per-agent skill allowlist and workspace skills.",agentsUseAll:"Use All",agentsDisableAll:"Disable All",agentsLoadConfigForSkills:"Load the gateway config to set per-agent skills.",agentsCustomAllowlist:"This agent uses a custom skill allowlist.",agentsAllSkillsEnabled:"All skills are enabled. Disabling any skill will create a per-agent allowlist.",agentsLoadSkillsForAgent:"Load skills for this agent to view workspace-specific entries.",agentsFilter:"Filter",agentsNoSkillsFound:"No skills found.",agentsToolsGlobalAllow:"Global tools.allow is set. Agent overrides cannot enable tools that are globally blocked.",agentsProfile:"Profile",agentsSource:"Source",agentsStatus:"Status",agentsUnsaved:"unsaved",agentsQuickPresets:"Quick Presets",agentsInherit:"Inherit",agentsToolsTitle:"Tools",agentsToolsSub:"Per-agent tool profile and overrides.",agentsToolAccess:"Tool Access",agentsToolsSubText:"Profile + per-tool overrides for this agent.",agentsLoadConfigForTools:"Load the gateway config to adjust tool profiles.",agentsExplicitAllowlist:"This agent is using an explicit allowlist in config. Tool overrides are managed in the Config tab.",agentsEnableAll:"Enable All",agentsEnabledCount:"enabled.",skillsTitle:"Skills",skillsSub:"Bundled, managed, and workspace skills.",skillsSearchPlaceholder:"Search skills",skillsShown:"shown",skillsWorkspace:"Workspace Skills",skillsBuiltIn:"Built-in Skills",skillsInstalled:"Installed Skills",skillsExtra:"Extra Skills",skillsOther:"Other Skills",nodesTitle:"Nodes",nodesSub:"Paired devices and live links.",nodesNoFound:"No nodes found.",nodesDevices:"Devices",nodesDevicesSub:"Pairing requests + role tokens.",nodesPending:"Pending",nodesPaired:"Paired",nodesNoPairedDevices:"No paired devices.",nodesRoleLabel:"role: ",nodesRoleNone:"role: -",nodesRepairSuffix:" · repair",nodesRequested:"requested ",nodesApprove:"Approve",nodesReject:"Reject",nodesRolesLabel:"roles: ",nodesScopesLabel:"scopes: ",nodesTokensNone:"Tokens: none",nodesTokens:"Tokens",nodesTokenRevoked:"revoked",nodesTokenActive:"active",nodesRotate:"Rotate",nodesRevoke:"Revoke",nodesBindingTitle:"Exec node binding",nodesBindingSub:"Pin agents to a specific node when using ",nodesBindingFormModeHint:"Switch the Config tab to Form mode to edit bindings here.",nodesLoadConfigHint:"Load config to edit bindings.",nodesLoadConfig:"Load config",nodesDefaultBinding:"Default binding",nodesDefaultBindingSub:"Used when agents do not override a node binding.",nodesNodeLabel:"Node",nodesAnyNode:"Any node",nodesNoNodesSystemRun:"No nodes with system.run available.",nodesNoAgentsFound:"No agents found.",nodesExecApprovalsTitle:"Exec approvals",nodesExecApprovalsSub:"Allowlist and approval policy for exec host=gateway/node.",nodesLoadExecApprovalsHint:"Load exec approvals to edit allowlists.",nodesLoadApprovals:"Load approvals",nodesTarget:"Target",nodesTargetSub:"Gateway edits local approvals; node edits the selected node.",nodesHost:"Host",nodesHostGateway:"Gateway",nodesHostNode:"Node",nodesSelectNode:"Select node",nodesNoNodesExecApprovals:"No nodes advertise exec approvals yet.",nodesScope:"Scope",nodesDefaults:"Defaults",nodesSecurity:"Security",nodesSecurityDefaultSub:"Default security mode.",nodesSecurityAgentSubPrefix:"Default: ",nodesMode:"Mode",nodesUseDefaultPrefix:"Use default (",nodesUseDefaultButton:"Use default",nodesSecurityDeny:"Deny",nodesSecurityAllowlist:"Allowlist",nodesSecurityFull:"Full",nodesAsk:"Ask",nodesAskDefaultSub:"Default prompt policy.",nodesAskAgentSubPrefix:"Default: ",nodesAskOff:"Off",nodesAskOnMiss:"On miss",nodesAskAlways:"Always",nodesAskFallback:"Ask fallback",nodesAskFallbackDefaultSub:"Applied when the UI prompt is unavailable.",nodesAskFallbackAgentSubPrefix:"Default: ",nodesFallback:"Fallback",nodesAutoAllowSkills:"Auto-allow skill CLIs",nodesAutoAllowSkillsDefaultSub:"Allow skill executables listed by the Gateway.",nodesAutoAllowSkillsUsingDefault:"Using default (",nodesAutoAllowSkillsOverride:"Override (",nodesEnabled:"Enabled",nodesAllowlist:"Allowlist",nodesAllowlistSub:"Case-insensitive glob patterns.",nodesAddPattern:"Add pattern",nodesNoAllowlistEntries:"No allowlist entries yet.",nodesNewPattern:"New pattern",nodesLastUsedPrefix:"Last used: ",nodesPattern:"Pattern",nodesRemove:"Remove",nodesDefaultAgent:"default agent",nodesAgent:"agent",nodesUsesDefault:"uses default (",nodesOverride:"override: ",nodesBinding:"Binding",nodesChipPaired:"paired",nodesChipUnpaired:"unpaired",nodesConnected:"connected",nodesOffline:"offline",nodesNever:"never",configEnv:"Environment",configUpdate:"Updates",configAgents:"Agents",configAuth:"Authentication",configChannels:"Channels",configMessages:"Messages",configCommands:"Commands",configHooks:"Hooks",configSkills:"Skills",configTools:"Tools",configGateway:"Gateway",configWizard:"Setup Wizard",configMeta:"Metadata",configLogging:"Logging",configBrowser:"Browser",configUi:"UI",configModels:"Models",configBindings:"Bindings",configBroadcast:"Broadcast",configAudio:"Audio",configSession:"Session",configCron:"Cron",configWeb:"Web",configDiscovery:"Discovery",configCanvasHost:"Canvas Host",configTalk:"Talk",configPlugins:"Plugins",configEnvVars:"Environment Variables",configEnvVarsDesc:"Environment variables passed to the gateway process",configUpdatesDesc:"Auto-update settings and release channel",configAgentsDesc:"Agent configurations, models, and identities",configAuthDesc:"API keys and authentication profiles",configChannelsDesc:"Messaging channels (Telegram, Discord, Slack, etc.)",configMessagesDesc:"Message handling and routing settings",configCommandsDesc:"Custom slash commands",configHooksDesc:"Webhooks and event hooks",configSkillsDesc:"Skill packs and capabilities",configToolsDesc:"Tool configurations (browser, search, etc.)",configGatewayDesc:"Gateway server settings (port, auth, binding)",configWizardDesc:"Setup wizard state and history",configMetaDesc:"Gateway metadata and version information",configLoggingDesc:"Log levels and output configuration",configBrowserDesc:"Browser automation settings",configUiDesc:"User interface preferences",configModelsDesc:"AI model configurations and providers",configBindingsDesc:"Key bindings and shortcuts",configBroadcastDesc:"Broadcast and notification settings",configAudioDesc:"Audio input/output settings",configSessionDesc:"Session management and persistence",configCronDesc:"Scheduled tasks and automation",configWebDesc:"Web server and API settings",configDiscoveryDesc:"Service discovery and networking",configCanvasHostDesc:"Canvas rendering and display",configTalkDesc:"Voice and speech settings",configPluginsDesc:"Plugin management and extensions",configSettingsTitle:"Settings",configSearchPlaceholder:"Search settings…",configAllSettings:"All Settings",configForm:"Form",configRaw:"Raw",configUnsavedChanges:"Unsaved changes",configUnsavedChangesLabel:"unsaved changes",configOneUnsavedChange:"1 unsaved change",configNoChanges:"No changes",configApplying:"Applying…",configApply:"Apply",configUpdating:"Updating…",configUpdateButton:"Update",configViewPrefix:"View ",configPendingChange:"pending change",configPendingChanges:"pending changes",configLoadingSchema:"Loading schema…",configFormUnsafeWarning:"Form view can't safely edit some fields. Use Raw to avoid losing config entries.",configRawJson5:"Raw JSON5",configValidityValid:"valid",configValidityInvalid:"invalid",configValidityUnknown:"unknown",configSchemaUnavailable:"Schema unavailable.",configUnsupportedSchema:"Unsupported schema. Use Raw.",configNoSettingsMatchPrefix:'No settings match "',configNoSettingsMatchSuffix:'"',configNoSettingsInSection:"No settings in this section",configUnsupportedSchemaNode:"Unsupported schema node. Use Raw mode.",configSubnavAll:"All",debugSnapshots:"Snapshots",debugSnapshotsSub:"Status, health, and heartbeat data.",debugStatus:"Status",debugHealth:"Health",debugLastHeartbeat:"Last heartbeat",debugSecurityAudit:"Security audit",debugManualRpc:"Manual RPC",debugManualRpcSub:"Send a raw gateway method with JSON params.",debugMethod:"Method",debugParams:"Params",debugCall:"Call",debugCritical:"critical",debugWarnings:"warnings",debugNoCritical:"No critical issues",debugInfo:"info",debugSecurityAuditDetails:"Run openclaw security audit --deep for details.",debugModels:"Models",debugModelsSub:"Catalog from models.list.",debugEventLog:"Event Log",debugEventLogSub:"Latest gateway events.",debugNoEvents:"No events yet.",logsTitle:"Logs",logsSub:"Gateway file logs (JSONL).",logsExportFiltered:"Export filtered",logsExportVisible:"Export visible"},Dc={tabGroupChat:"聊天",tabGroupControl:"控制",tabGroupAgent:"代理",tabGroupSettings:"设置",subtitleAgents:"管理代理工作区、工具与身份。",subtitleOverview:"网关状态、入口与健康概览。",subtitleChannels:"管理通道与设置。",subtitleInstances:"已连接客户端与节点的在线状态。",subtitleSessions:"查看活跃会话并调整每会话默认值。",subtitleUsage:"",subtitleCron:"安排唤醒与定时代理任务。",subtitleSkills:"管理技能可用性与 API 密钥注入。",subtitleNodes:"已配对设备、能力与命令。",subtitleChat:"直接与网关聊天进行快速操作。",subtitleAgentSwarm:"多Agent集群协作，面向运维与 SRE。",subtitleConfig:"安全编辑 ~/.openocta/openocta.json。",subtitleDebug:"网关快照、事件与手动 RPC 调用。",subtitleLogs:"网关日志实时查看。",navTitleAgents:"代理",navTitleOverview:"概览",navTitleChannels:"通道",navTitleInstances:"实例",navTitleSessions:"会话",navTitleUsage:"用量",navTitleCron:"定时任务",navTitleSkills:"技能",navTitleNodes:"节点",navTitleChat:"Chat",navTitleAgentSwarm:"Agent Swarm",agentSwarmDevBadge:"开发中",navTitleConfig:"配置",navTitleDebug:"测试",navTitleLogs:"日志",navTitleControl:"控制",overviewGatewayAccess:"网关访问",overviewGatewayAccessSub:"控制台连接地址与认证方式。",overviewWebSocketUrl:"WebSocket 地址",overviewGatewayToken:"网关令牌",overviewPassword:"密码（不保存）",overviewDefaultSessionKey:"默认会话 Key",overviewConnect:"连接",overviewRefresh:"刷新",overviewConnectHint:"点击连接以应用连接变更。",overviewSnapshot:"快照",overviewSnapshotSub:"最近一次网关握手信息。",overviewStatus:"状态",overviewConnected:"已连接",overviewDisconnected:"未连接",overviewUptime:"运行时长",overviewTickInterval:"心跳间隔",overviewLastChannelsRefresh:"最近通道刷新",overviewChannelsHint:"在通道中关联 WhatsApp、Telegram、Discord、Signal 或 iMessage。",overviewInstances:"实例",overviewInstancesSub:"过去 5 分钟内的在线实例数。",overviewSessions:"会话",overviewSessionsSub:"网关跟踪的最近会话 Key。",overviewCron:"定时任务",overviewCronNext:"下次执行",overviewCronEnabled:"已启用",overviewCronDisabled:"已禁用",overviewNotes:"说明",overviewNotesSub:"远程控制相关简要提示。",overviewNoteTailscale:"Tailscale serve",overviewNoteTailscaleSub:"建议使用 serve 模式，使网关仅监听本机并由 tailnet 认证。",overviewNoteSessionHygiene:"会话清理",overviewNoteSessionHygieneSub:"使用 /new 或 sessions.patch 重置上下文。",overviewNoteCron:"定时提醒",overviewNoteCronSub:"定时任务请使用独立会话。",commonLoading:"加载中…",commonRefresh:"刷新",commonRefreshing:"刷新中…",commonSaving:"保存中…",commonDelete:"删除",commonFilter:"筛选",commonOptional:"（可选）",commonInherit:"继承",commonOffExplicit:"关闭（显式）",commonNA:"无",commonYes:"是",commonNo:"否",channelsHealth:"通道健康",channelsHealthSub:"网关返回的通道状态快照。",channelsNoSnapshot:"暂无快照。",channelsSchemaUnavailable:"Schema 不可用，请使用 Raw。",channelsConfigSchemaUnavailable:"通道配置 Schema 不可用。",channelsLoadingConfigSchema:"正在加载配置 Schema…",commonSave:"保存",commonReload:"重新加载",commonCancel:"取消",channelConfigured:"已配置",channelRunning:"运行中",channelLastStart:"最近启动",channelLastProbe:"最近探测",channelProbe:"探测",channelProbeOk:"正常",channelProbeFailed:"失败",channelLinked:"已链接",channelConnected:"已连接",channelLastConnect:"最近连接",channelLastMessage:"最近消息",channelAuthAge:"认证时长",channelBaseUrl:"Base URL",channelCredential:"凭证",channelAudience:"受众",channelMode:"模式",channelPublicKey:"公钥",channelLastInbound:"最近入站",channelActive:"活跃",channelGenericSub:"通道状态与配置。",channelAccounts:"账号",channelWhatsApp:"WhatsApp",channelWhatsAppSub:"链接 WhatsApp Web 并监控连接状态。",channelTelegram:"Telegram",channelTelegramSub:"机器人状态与通道配置。",channelDiscord:"Discord",channelDiscordSub:"机器人状态与通道配置。",channelGoogleChat:"Google Chat",channelGoogleChatSub:"Chat API Webhook 状态与通道配置。",channelIMessage:"iMessage",channelIMessageSub:"macOS 桥接状态与通道配置。",channelSignal:"Signal",channelSignalSub:"signal-cli 状态与通道配置。",channelSlack:"Slack",channelSlackSub:"Socket 模式状态与通道配置。",channelNostr:"Nostr",channelNostrSub:"通过 Nostr 中继的分布式私信（NIP-04）。",channelWhatsAppWorking:"处理中…",channelShowQr:"显示二维码",channelRelink:"重新链接",channelWaitForScan:"等待扫码",channelLogout:"登出",nostrEditProfile:"编辑资料",nostrAccount:"账号",nostrUsername:"用户名",nostrDisplayName:"显示名称",nostrBio:"简介",nostrAvatarUrl:"头像 URL",nostrBannerUrl:"横幅 URL",nostrWebsite:"网站",nostrNip05:"NIP-05 标识",nostrLud16:"Lightning 地址",nostrSavePublish:"保存并发布",nostrImportRelays:"从中继导入",nostrHideAdvanced:"隐藏高级",nostrShowAdvanced:"显示高级",nostrUnsavedChanges:"您有未保存的更改",nostrProfilePreview:"头像预览",nostrAdvanced:"高级",nostrImporting:"导入中…",nostrNoProfileSet:"未设置资料。点击「编辑资料」添加姓名、简介与头像。",nostrProfile:"资料",nostrAbout:"关于",nostrName:"名称",instancesTitle:"已连接实例",instancesSub:"网关与客户端的在线状态。",instancesNoReported:"暂无实例上报。",instancesUnknownHost:"未知主机",instancesLastInput:"最近输入",instancesReason:"原因",instancesScopes:"范围",sessionsTitle:"会话",sessionsSub:"活跃会话 Key 及每会话覆盖项。",sessionsActiveWithin:"活跃时间（分钟）",sessionsLimit:"数量上限",sessionsIncludeGlobal:"包含全局",sessionsIncludeUnknown:"包含未知",sessionsStore:"存储",sessionsKey:"Key",sessionsLabel:"标签",sessionsKind:"类型",sessionsUpdated:"更新时间",sessionsTokens:"Token",sessionsThinking:"思考",sessionsVerbose:"详细",sessionsReasoning:"推理",sessionsActions:"操作",sessionsNoFound:"未找到会话。",usageNoTimeline:"暂无时间线数据。",usageNoData:"暂无数据",usageHours:"小时",usageMidnight:"0 点",usage4am:"4 点",usage8am:"8 点",usageNoon:"12 点",usage4pm:"16 点",usage8pm:"20 点",usageDailyToken:"每日 Token 用量",usageDailyCost:"每日费用",usageOutput:"输出",usageInput:"输入",usageCacheWrite:"缓存写入",usageCacheRead:"缓存读取",usageClearFilters:"清除筛选",usageRemoveFilter:"移除筛选",usageDays:"天",usageHoursLabel:"小时",usageSession:"会话",usageFiltered:"已筛选",usageVisible:"当前可见",usageExport:"导出",usageActivityByTime:"按时间活动",usageMosaicSubNoData:"估算需要会话时间戳。",usageTokensUnit:"tokens",usageTimeZoneLocal:"本地",usageTimeZoneUtc:"UTC",usageDayOfWeek:"星期",usageDailyUsage:"每日用量",usageTotal:"合计",usageByType:"按类型",usageTokensByType:"按类型 Token",usageCostByType:"按类型费用",usageTotalLabel:"合计",usageOverview:"用量概览",usageMessages:"消息数",usageToolCalls:"工具调用",usageErrors:"错误数",usageAvgTokensMsg:"平均 Token/条",usageAvgCostMsg:"平均费用/条",usageSessionsCard:"会话",usageThroughput:"吞吐",usageErrorRate:"错误率",usageCacheHitRate:"缓存命中率",usageMessagesHint:"范围内用户+助手消息总数。",usageToolCallsHint:"会话中工具调用总次数。",usageErrorsHint:"范围内消息/工具错误总数。",usageAvgTokensMsgHint:"该范围内每条消息平均 token 数。",usageSessionsHint:"范围内的不同会话数。",usageThroughputHint:"吞吐为活跃时间内每分钟 token 数，越高越好。",usageErrorRateHint:"错误率 = 错误数/总消息数，越低越好。",usageCacheHitRateHint:"缓存命中率 = 缓存读取/(输入+缓存读取)，越高越好。",usageTopModels:"Top 模型",usageTopProviders:"Top 提供商",usageTopTools:"Top 工具",usageTopAgents:"Top 代理",usageTopChannels:"Top 渠道",usagePeakErrorDays:"错误高峰日",usagePeakErrorHours:"错误高峰时",usageNoModelData:"无模型数据",usageNoProviderData:"无提供商数据",usageNoToolCalls:"无工具调用",usageNoAgentData:"无代理数据",usageNoChannelData:"无渠道数据",usageNoErrorData:"无错误数据",usageShown:"显示",usageTotalSessions:"总计",usageAvg:"平均",usageAll:"全部",usageRecentlyViewed:"最近查看",usageSort:"排序",usageCost:"费用",usageErrorsCol:"错误",usageMessagesCol:"消息",usageRecent:"最近",usageTokensCol:"Token",usageDescending:"降序",usageAscending:"升序",usageClearSelection:"清除选择",usageNoRecentSessions:"无最近会话",usageNoSessionsInRange:"范围内无会话",usageCopy:"复制",usageCopySessionName:"复制会话名",usageSelectedCount:"已选",usageMoreSessions:"更多",usageUserAssistant:"用户 · 助手",usageToolsUsed:"使用工具数",usageToolResults:"工具结果",usageAcrossMessages:"跨消息",usageInRange:"范围内",usageCached:"缓存",usagePrompt:"提示",usageCacheHint:"缓存命中率 = 缓存读取/(输入+缓存读取)，越高越好。",usageErrorHint:"错误率 = 错误数/总消息数，越低越好。",usageTokensHint:"该范围内每条消息平均 token 数。",usageCostHint:"提供商上报费用时每条消息平均费用。",usageCostHintMissing:"提供商上报费用时每条消息平均费用。部分或全部会话缺少费用数据。",usageModelMix:"模型组合",usageDuration:"时长",usageCloseSessionDetails:"关闭会话详情",usageLoading:"加载中…",usageNoTimelineData:"无时间线数据",usageNoDataInRange:"范围内无数据",usageUsageOverTime:"用量随时间",usagePerTurn:"每轮",usageCumulative:"累计",usageNoContextData:"无上下文数据",usageSystemPromptBreakdown:"系统提示分解",usageExpandAll:"全部展开",usageCollapseAll:"全部折叠",usageBaseContextPerMessage:"每条消息的基础上下文",usageSys:"系统",usageSkills:"技能",usageToolsLabel:"工具",usageFiles:"文件",usageConversation:"对话",usageNoMessages:"无消息",usageSearchConversation:"搜索对话",usageClear:"清除",usageHasTools:"含工具",usageUser:"用户",usageAssistant:"助手",usageTool:"工具",usageToolResult:"工具结果",usageMessagesCount:"条消息",usageNoMessagesMatchFilters:"没有消息符合筛选条件。",usageTokenUsage:"Token 用量",usageToday:"今天",usage7d:"7 天",usage30d:"30 天",usageExportSessionsCsv:"会话 (CSV)",usageExportDailyCsv:"每日 (CSV)",usageSessionsCount:"会话",usageQueryHintMatch:"{count} / {total} 个会话匹配",usageQueryHintInRange:"{total} 个会话在范围内",usagePageSubtitle:"查看 token 消耗、会话高峰与费用驱动因素。",usageCalls:"次",cronScheduler:"调度器",cronSchedulerSub:"网关内置定时调度状态。",cronEnabled:"已启用",cronJobs:"任务数",cronNewJob:"新建任务",cronNewJobSub:"创建定时唤醒或代理运行任务。",cronName:"名称",cronDescription:"描述",cronAgentId:"代理 ID",cronSchedule:"调度",cronEvery:"每",cronAt:"在",cronCron:"Cron",cronSession:"会话",cronMain:"主会话",cronIsolated:"独立会话",cronWakeMode:"唤醒方式",cronNextHeartbeat:"下次心跳",cronNow:"立即",cronPayload:"负载",cronSystemEvent:"系统事件",cronAgentTurn:"代理轮次",cronSystemText:"系统文本",cronAgentMessage:"代理消息",cronDelivery:"投递",cronAnnounceSummary:"公布摘要（默认）",cronNoneInternal:"无（内部）",cronChannel:"通道",cronTo:"发送至",cronAddJob:"添加任务",cronJobsTitle:"任务列表",cronJobsSub:"网关中所有已调度任务。",cronNoJobsYet:"暂无任务。",cronRunHistory:"运行历史",cronRunHistorySub:"最近运行：",cronSelectJob:"（选择任务）",cronNoRunsYet:"暂无运行记录。",cronSelectJobToInspect:"选择任务以查看运行历史。",cronRunAt:"运行时间",cronUnit:"单位",cronMinutes:"分钟",cronHours:"小时",cronDays:"天",cronExpression:"表达式",cronTimeoutSeconds:"超时（秒）",cronLast:"上次",agentsFiles:"文件",agentsRuntime:"运行时",agentsWeb:"网页",agentsMemory:"记忆",agentsSessions:"会话",agentsUi:"界面",agentsMessaging:"消息",agentsAutomation:"自动化",agentsReadFile:"读取文件内容",agentsWriteFile:"创建或覆盖文件",agentsEdit:"精确编辑",agentsApplyPatch:"应用补丁（OpenAI）",agentsExec:"执行 shell 命令",agentsProcess:"管理后台进程",agentsWebSearch:"网页搜索",agentsWebFetch:"抓取网页内容",agentsMemorySearch:"语义搜索",agentsMemoryGet:"读取记忆文件",agentsSessionsList:"列出会话",agentsSessionsHistory:"会话历史",agentsSessionsSend:"发送到会话",agentsSessionsSpawn:"派生子代理",agentsSessionStatus:"会话状态",agentsBrowser:"控制浏览器",agentsCanvas:"控制画布",agentsMessage:"发送消息",agentsScheduleTasks:"安排任务",agentsGatewayControl:"网关控制",agentsNodesDevices:"节点与设备",agentsListAgents:"列出代理",agentsImageUnderstanding:"图像理解",agentsNodes:"节点",agentsAgents:"代理",agentsMedia:"媒体",agentsTitle:"代理",agentsConfigured:"已配置。",agentsNoFound:"未找到代理。",agentsSelectAgent:"选择代理",agentsSelectAgentSub:"选择一个代理以查看其工作区与工具。",agentsWorkspaceRouting:"代理工作区与路由。",agentsProfileMinimal:"最小",agentsProfileCoding:"编程",agentsProfileMessaging:"消息",agentsProfileFull:"完整",agentsDefault:"默认",agentsSelected:"已选",agentsAllSkills:"全部技能",agentsCurrentModel:"当前",agentsInheritDefault:"继承默认",agentsOverview:"概览",agentsOverviewSub:"工作区路径与身份元数据。",agentsWorkspace:"工作区",agentsPrimaryModel:"主模型",agentsIdentityName:"身份名称",agentsDefaultLabel:"默认",agentsIdentityEmoji:"身份表情",agentsSkillsFilter:"技能筛选",agentsModelSelection:"模型选择",agentsPrimaryModelLabel:"主模型",agentsPrimaryModelDefault:"（默认）",agentsFallbacksLabel:"备选（逗号分隔）",agentsReloadConfig:"重新加载配置",agentsAgentContext:"代理上下文",agentsContextWorkspaceIdentity:"工作区、身份与模型配置。",agentsContextWorkspaceScheduling:"工作区与调度目标。",agentsChannels:"渠道",agentsChannelsSub:"网关渠道状态快照。",agentsLoadChannels:"加载渠道以查看实时状态。",agentsNoChannels:"未找到渠道。",agentsConnected:"已连接",agentsConfiguredLabel:"已配置",agentsEnabled:"已启用",agentsDisabled:"已禁用",agentsNoAccounts:"无账号",agentsNotConfigured:"未配置",agentsScheduler:"调度器",agentsSchedulerSub:"网关定时状态。",agentsNextWake:"下次唤醒",agentsCronJobs:"代理定时任务",agentsCronJobsSub:"针对此代理的定时任务。",agentsNoJobsAssigned:"未分配任务。",agentsCoreFiles:"核心文件",agentsCoreFilesSub:"引导人设、身份与工具指引。",agentsLoadWorkspaceFiles:"加载代理工作区文件以编辑核心说明。",agentsNoFilesFound:"未找到文件。",agentsSelectFileToEdit:"选择要编辑的文件。",agentsReset:"重置",agentsFileMissingCreate:"该文件不存在。保存将在代理工作区中创建。",agentsUnavailable:"不可用",agentsTabOverview:"概览",agentsTabFiles:"文件",agentsTabTools:"工具",agentsTabSkills:"技能",agentsTabChannels:"渠道",agentsTabCron:"定时任务",agentsFallback:"备选",agentsNever:"从未",agentsLastRefresh:"上次刷新",agentsSkillsPanelSub:"每代理技能允许列表与工作区技能。",agentsUseAll:"全部启用",agentsDisableAll:"全部禁用",agentsLoadConfigForSkills:"加载网关配置以设置每代理技能。",agentsCustomAllowlist:"此代理使用自定义技能允许列表。",agentsAllSkillsEnabled:"所有技能已启用。禁用任意技能将创建每代理允许列表。",agentsLoadSkillsForAgent:"加载此代理的技能以查看工作区相关条目。",agentsFilter:"筛选",agentsNoSkillsFound:"未找到技能。",agentsToolsGlobalAllow:"已设置全局 tools.allow。代理覆盖无法启用被全局禁止的工具。",agentsProfile:"配置集",agentsSource:"来源",agentsStatus:"状态",agentsUnsaved:"未保存",agentsQuickPresets:"快捷预设",agentsInherit:"继承",agentsToolsTitle:"工具",agentsToolsSub:"每代理工具配置集与覆盖。",agentsToolAccess:"工具访问",agentsToolsSubText:"此代理的配置集与每工具覆盖。",agentsLoadConfigForTools:"加载网关配置以调整工具配置集。",agentsExplicitAllowlist:"此代理在配置中使用显式允许列表。工具覆盖在配置页管理。",agentsEnableAll:"全部启用",agentsEnabledCount:"已启用。",skillsTitle:"技能",skillsSub:"内置、托管与工作区技能。",skillsSearchPlaceholder:"搜索技能",skillsShown:"条显示",skillsWorkspace:"工作区技能",skillsBuiltIn:"内置技能",skillsInstalled:"已安装技能",skillsExtra:"额外技能",skillsOther:"其他技能",nodesTitle:"节点",nodesSub:"已配对设备与在线连接。",nodesNoFound:"未找到节点。",nodesDevices:"设备",nodesDevicesSub:"配对请求与角色令牌。",nodesPending:"待处理",nodesPaired:"已配对",nodesNoPairedDevices:"暂无已配对设备。",nodesRoleLabel:"角色：",nodesRoleNone:"角色：-",nodesRepairSuffix:" · 修复",nodesRequested:"请求于 ",nodesApprove:"批准",nodesReject:"拒绝",nodesRolesLabel:"角色：",nodesScopesLabel:"范围：",nodesTokensNone:"令牌：无",nodesTokens:"令牌",nodesTokenRevoked:"已撤销",nodesTokenActive:"有效",nodesRotate:"轮换",nodesRevoke:"撤销",nodesBindingTitle:"Exec 节点绑定",nodesBindingSub:"在使用 ",nodesBindingFormModeHint:"请在 Config 选项卡中切换到表单模式以在此编辑绑定。",nodesLoadConfigHint:"加载配置以编辑绑定。",nodesLoadConfig:"加载配置",nodesDefaultBinding:"默认绑定",nodesDefaultBindingSub:"当代理未覆盖节点绑定时使用。",nodesNodeLabel:"节点",nodesAnyNode:"任意节点",nodesNoNodesSystemRun:"没有支持 system.run 的节点。",nodesNoAgentsFound:"未找到代理。",nodesExecApprovalsTitle:"Exec 审批",nodesExecApprovalsSub:"exec host=gateway/node 的允许列表与审批策略。",nodesLoadExecApprovalsHint:"加载 exec 审批以编辑允许列表。",nodesLoadApprovals:"加载审批",nodesTarget:"目标",nodesTargetSub:"网关编辑本地审批；节点编辑所选节点。",nodesHost:"主机",nodesHostGateway:"网关",nodesHostNode:"节点",nodesSelectNode:"选择节点",nodesNoNodesExecApprovals:"尚无节点提供 exec 审批。",nodesScope:"范围",nodesDefaults:"默认",nodesSecurity:"安全",nodesSecurityDefaultSub:"默认安全模式。",nodesSecurityAgentSubPrefix:"默认：",nodesMode:"模式",nodesUseDefaultPrefix:"使用默认（",nodesUseDefaultButton:"使用默认",nodesSecurityDeny:"拒绝",nodesSecurityAllowlist:"允许列表",nodesSecurityFull:"完全",nodesAsk:"询问",nodesAskDefaultSub:"默认提示策略。",nodesAskAgentSubPrefix:"默认：",nodesAskOff:"关",nodesAskOnMiss:"缺失时",nodesAskAlways:"始终",nodesAskFallback:"询问回退",nodesAskFallbackDefaultSub:"当 UI 提示不可用时应用。",nodesAskFallbackAgentSubPrefix:"默认：",nodesFallback:"回退",nodesAutoAllowSkills:"自动允许技能 CLI",nodesAutoAllowSkillsDefaultSub:"允许网关列出的技能可执行文件。",nodesAutoAllowSkillsUsingDefault:"使用默认（",nodesAutoAllowSkillsOverride:"覆盖（",nodesEnabled:"启用",nodesAllowlist:"允许列表",nodesAllowlistSub:"不区分大小写的 glob 模式。",nodesAddPattern:"添加模式",nodesNoAllowlistEntries:"尚无允许列表条目。",nodesNewPattern:"新模式",nodesLastUsedPrefix:"上次使用：",nodesPattern:"模式",nodesRemove:"移除",nodesDefaultAgent:"默认代理",nodesAgent:"代理",nodesUsesDefault:"使用默认（",nodesOverride:"覆盖：",nodesBinding:"绑定",nodesChipPaired:"已配对",nodesChipUnpaired:"未配对",nodesConnected:"已连接",nodesOffline:"离线",nodesNever:"从未",configEnv:"环境",configUpdate:"更新",configAgents:"代理",configAuth:"认证",configChannels:"通道",configMessages:"消息",configCommands:"命令",configHooks:"钩子",configSkills:"技能",configTools:"工具",configGateway:"网关",configWizard:"设置向导",configMeta:"元数据",configLogging:"日志",configBrowser:"浏览器",configUi:"界面",configModels:"模型",configBindings:"绑定",configBroadcast:"广播",configAudio:"音频",configSession:"会话",configCron:"定时",configWeb:"Web",configDiscovery:"发现",configCanvasHost:"画布主机",configTalk:"语音",configPlugins:"插件",configEnvVars:"环境变量",configEnvVarsDesc:"传入网关进程的环境变量",configUpdatesDesc:"自动更新与发布渠道",configAgentsDesc:"代理配置、模型与身份",configAuthDesc:"API 密钥与认证配置",configChannelsDesc:"消息通道（Telegram、Discord、Slack 等）",configMessagesDesc:"消息处理与路由",configCommandsDesc:"自定义斜杠命令",configHooksDesc:"Webhook 与事件钩子",configSkillsDesc:"技能包与能力",configToolsDesc:"工具配置（浏览器、搜索等）",configGatewayDesc:"网关服务（端口、认证、绑定）",configWizardDesc:"设置向导状态与历史",configMetaDesc:"网关元数据与版本",configLoggingDesc:"日志级别与输出",configBrowserDesc:"浏览器自动化",configUiDesc:"界面偏好",configModelsDesc:"AI 模型与提供商",configBindingsDesc:"快捷键绑定",configBroadcastDesc:"广播与通知",configAudioDesc:"音频输入/输出",configSessionDesc:"会话管理与持久化",configCronDesc:"定时任务与自动化",configWebDesc:"Web 服务与 API",configDiscoveryDesc:"服务发现与网络",configCanvasHostDesc:"画布渲染与显示",configTalkDesc:"语音与朗读",configPluginsDesc:"插件管理",configSettingsTitle:"设置",configSearchPlaceholder:"搜索设置…",configAllSettings:"全部设置",configForm:"表单",configRaw:"原始",configUnsavedChanges:"未保存的更改",configUnsavedChangesLabel:"未保存的更改",configOneUnsavedChange:"1 项未保存的更改",configNoChanges:"无更改",configApplying:"应用中…",configApply:"应用",configUpdating:"更新中…",configUpdateButton:"更新",configViewPrefix:"查看 ",configPendingChange:"项待处理更改",configPendingChanges:"项待处理更改",configLoadingSchema:"正在加载架构…",configFormUnsafeWarning:"表单视图无法安全编辑部分字段，请使用原始模式以免丢失配置项。",configRawJson5:"原始 JSON5",configValidityValid:"有效",configValidityInvalid:"无效",configValidityUnknown:"未知",configSchemaUnavailable:"架构不可用。",configUnsupportedSchema:"不支持的架构，请使用原始模式。",configNoSettingsMatchPrefix:"没有匹配「",configNoSettingsMatchSuffix:"」的设置",configNoSettingsInSection:"本部分暂无设置",configUnsupportedSchemaNode:"不支持的架构节点，请使用原始模式。",configSubnavAll:"全部",debugSnapshots:"快照",debugSnapshotsSub:"状态、健康与心跳数据。",debugStatus:"状态",debugHealth:"健康",debugLastHeartbeat:"最近心跳",debugSecurityAudit:"安全审计",debugManualRpc:"手动 RPC",debugManualRpcSub:"使用 JSON 参数发送原始网关方法。",debugMethod:"方法",debugParams:"参数",debugCall:"调用",debugCritical:"严重",debugWarnings:"警告",debugNoCritical:"无严重问题",debugInfo:"信息",debugSecurityAuditDetails:"运行 openclaw security audit --deep 查看详细信息。",debugModels:"模型",debugModelsSub:"来自 models.list 的目录。",debugEventLog:"事件日志",debugEventLogSub:"最新的网关事件。",debugNoEvents:"暂无事件。",logsTitle:"日志",logsSub:"网关文件日志（JSONL）。",logsExportFiltered:"导出已筛选",logsExportVisible:"导出可见"},Rc={en:Ic,zh:Dc};function o(e){return Rc[_a()][e]}const Pc={env:{label:"configEnvVars",desc:"configEnvVarsDesc"},update:{label:"configUpdate",desc:"configUpdatesDesc"},agents:{label:"configAgents",desc:"configAgentsDesc"},auth:{label:"configAuth",desc:"configAuthDesc"},channels:{label:"configChannels",desc:"configChannelsDesc"},messages:{label:"configMessages",desc:"configMessagesDesc"},commands:{label:"configCommands",desc:"configCommandsDesc"},hooks:{label:"configHooks",desc:"configHooksDesc"},skills:{label:"configSkills",desc:"configSkillsDesc"},tools:{label:"configTools",desc:"configToolsDesc"},gateway:{label:"configGateway",desc:"configGatewayDesc"},wizard:{label:"configWizard",desc:"configWizardDesc"},meta:{label:"configMeta",desc:"configMetaDesc"},logging:{label:"configLogging",desc:"configLoggingDesc"},browser:{label:"configBrowser",desc:"configBrowserDesc"},ui:{label:"configUi",desc:"configUiDesc"},models:{label:"configModels",desc:"configModelsDesc"},bindings:{label:"configBindings",desc:"configBindingsDesc"},broadcast:{label:"configBroadcast",desc:"configBroadcastDesc"},audio:{label:"configAudio",desc:"configAudioDesc"},session:{label:"configSession",desc:"configSessionDesc"},cron:{label:"configCron",desc:"configCronDesc"},web:{label:"configWeb",desc:"configWebDesc"},discovery:{label:"configDiscovery",desc:"configDiscoveryDesc"},canvasHost:{label:"configCanvasHost",desc:"configCanvasHostDesc"},talk:{label:"configTalk",desc:"configTalkDesc"},plugins:{label:"configPlugins",desc:"configPluginsDesc"}};function Ma(e){const t=Pc[e];return t?{label:o(t.label),description:o(t.desc)}:{label:e,description:""}}function Nc(e){const{values:t,original:n}=e;return t.name!==n.name||t.displayName!==n.displayName||t.about!==n.about||t.picture!==n.picture||t.banner!==n.banner||t.website!==n.website||t.nip05!==n.nip05||t.lud16!==n.lud16}function Fc(e){const{state:t,callbacks:n,accountId:s}=e,a=Nc(t),i=(c,d,g={})=>{const{type:h="text",placeholder:p,maxLength:f,help:u}=g,m=t.values[c]??"",b=t.fieldErrors[c],x=`nostr-profile-${c}`;return h==="textarea"?l`
        <div class="form-field" style="margin-bottom: 12px;">
          <label for="${x}" style="display: block; margin-bottom: 4px; font-weight: 500;">
            ${d}
          </label>
          <textarea
            id="${x}"
            .value=${m}
            placeholder=${p??""}
            maxlength=${f??2e3}
            rows="3"
            style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; resize: vertical; font-family: inherit;"
            @input=${A=>{const $=A.target;n.onFieldChange(c,$.value)}}
            ?disabled=${t.saving}
          ></textarea>
          ${u?l`<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${u}</div>`:v}
          ${b?l`<div style="font-size: 12px; color: var(--danger-color); margin-top: 2px;">${b}</div>`:v}
        </div>
      `:l`
      <div class="form-field" style="margin-bottom: 12px;">
        <label for="${x}" style="display: block; margin-bottom: 4px; font-weight: 500;">
          ${d}
        </label>
        <input
          id="${x}"
          type=${h}
          .value=${m}
          placeholder=${p??""}
          maxlength=${f??256}
          style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;"
          @input=${A=>{const $=A.target;n.onFieldChange(c,$.value)}}
          ?disabled=${t.saving}
        />
        ${u?l`<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${u}</div>`:v}
        ${b?l`<div style="font-size: 12px; color: var(--danger-color); margin-top: 2px;">${b}</div>`:v}
      </div>
    `},r=()=>{const c=t.values.picture;return c?l`
      <div style="margin-bottom: 12px;">
        <img
          src=${c}
          alt=${o("nostrProfilePreview")}
          style="max-width: 80px; max-height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);"
          @error=${d=>{const g=d.target;g.style.display="none"}}
          @load=${d=>{const g=d.target;g.style.display="block"}}
        />
      </div>
    `:v};return l`
    <div class="nostr-profile-form" style="padding: 16px; background: var(--bg-secondary); border-radius: 8px; margin-top: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div style="font-weight: 600; font-size: 16px;">${o("nostrEditProfile")}</div>
        <div style="font-size: 12px; color: var(--text-muted);">${o("nostrAccount")}: ${s}</div>
      </div>

      ${t.error?l`<div class="callout danger" style="margin-bottom: 12px;">${t.error}</div>`:v}

      ${t.success?l`<div class="callout success" style="margin-bottom: 12px;">${t.success}</div>`:v}

      ${r()}

      ${i("name",o("nostrUsername"),{placeholder:"satoshi",maxLength:256,help:"Short username (e.g., satoshi)"})}

      ${i("displayName",o("nostrDisplayName"),{placeholder:"Satoshi Nakamoto",maxLength:256,help:"Your full display name"})}

      ${i("about",o("nostrBio"),{type:"textarea",placeholder:"Tell people about yourself...",maxLength:2e3,help:"A brief bio or description"})}

      ${i("picture",o("nostrAvatarUrl"),{type:"url",placeholder:"https://example.com/avatar.jpg",help:"HTTPS URL to your profile picture"})}

      ${t.showAdvanced?l`
            <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px;">
              <div style="font-weight: 500; margin-bottom: 12px; color: var(--text-muted);">${o("nostrAdvanced")}</div>

              ${i("banner",o("nostrBannerUrl"),{type:"url",placeholder:"https://example.com/banner.jpg",help:"HTTPS URL to a banner image"})}

              ${i("website",o("nostrWebsite"),{type:"url",placeholder:"https://example.com",help:"Your personal website"})}

              ${i("nip05",o("nostrNip05"),{placeholder:"you@example.com",help:"Verifiable identifier (e.g., you@domain.com)"})}

              ${i("lud16",o("nostrLud16"),{placeholder:"you@getalby.com",help:"Lightning address for tips (LUD-16)"})}
            </div>
          `:v}

      <div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
        <button
          class="btn primary"
          @click=${n.onSave}
          ?disabled=${t.saving||!a}
        >
          ${t.saving?o("commonSaving"):o("nostrSavePublish")}
        </button>

        <button
          class="btn"
          @click=${n.onImport}
          ?disabled=${t.importing||t.saving}
        >
          ${t.importing?o("nostrImporting"):o("nostrImportRelays")}
        </button>

        <button
          class="btn"
          @click=${n.onToggleAdvanced}
        >
          ${t.showAdvanced?o("nostrHideAdvanced"):o("nostrShowAdvanced")}
        </button>

        <button
          class="btn"
          @click=${n.onCancel}
          ?disabled=${t.saving}
        >
          ${o("commonCancel")}
        </button>
      </div>

      ${a?l`
              <div style="font-size: 12px; color: var(--warning-color); margin-top: 8px">
                ${o("nostrUnsavedChanges")}
              </div>
            `:v}
    </div>
  `}function Oc(e){const t={name:e?.name??"",displayName:e?.displayName??"",about:e?.about??"",picture:e?.picture??"",banner:e?.banner??"",website:e?.website??"",nip05:e?.nip05??"",lud16:e?.lud16??""};return{values:t,original:{...t},saving:!1,importing:!1,error:null,success:null,fieldErrors:{},showAdvanced:!!(e?.banner||e?.website||e?.nip05||e?.lud16)}}async function Uc(e,t){await Ac(e,t),await we(e,!0)}async function Bc(e){await Cc(e),await we(e,!0)}async function Hc(e){await Tc(e),await we(e,!0)}async function zc(e){await Dn(e),await Se(e),await we(e,!0)}async function Wc(e){await Se(e),await we(e,!0)}function Kc(e){if(!Array.isArray(e))return{};const t={};for(const n of e){if(typeof n!="string")continue;const[s,...a]=n.split(":");if(!s||a.length===0)continue;const i=s.trim(),r=a.join(":").trim();i&&r&&(t[i]=r)}return t}function fr(e){return(e.channelsSnapshot?.channelAccounts?.nostr??[])[0]?.accountId??e.nostrProfileAccountId??"default"}function vr(e,t=""){return`/api/channels/nostr/${encodeURIComponent(e)}/profile${t}`}function jc(e,t,n){e.nostrProfileAccountId=t,e.nostrProfileFormState=Oc(n??void 0)}function qc(e){e.nostrProfileFormState=null,e.nostrProfileAccountId=null}function Gc(e,t,n){const s=e.nostrProfileFormState;s&&(e.nostrProfileFormState={...s,values:{...s.values,[t]:n},fieldErrors:{...s.fieldErrors,[t]:""}})}function Vc(e){const t=e.nostrProfileFormState;t&&(e.nostrProfileFormState={...t,showAdvanced:!t.showAdvanced})}async function Qc(e){const t=e.nostrProfileFormState;if(!t||t.saving)return;const n=fr(e);e.nostrProfileFormState={...t,saving:!0,error:null,success:null,fieldErrors:{}};try{const s=await fetch(vr(n),{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(t.values)}),a=await s.json().catch(()=>null);if(!s.ok||a?.ok===!1||!a){const i=a?.error??`Profile update failed (${s.status})`;e.nostrProfileFormState={...t,saving:!1,error:i,success:null,fieldErrors:Kc(a?.details)};return}if(!a.persisted){e.nostrProfileFormState={...t,saving:!1,error:"Profile publish failed on all relays.",success:null};return}e.nostrProfileFormState={...t,saving:!1,error:null,success:"Profile published to relays.",fieldErrors:{},original:{...t.values}},await we(e,!0)}catch(s){e.nostrProfileFormState={...t,saving:!1,error:`Profile update failed: ${String(s)}`,success:null}}}async function Yc(e){const t=e.nostrProfileFormState;if(!t||t.importing)return;const n=fr(e);e.nostrProfileFormState={...t,importing:!0,error:null,success:null};try{const s=await fetch(vr(n,"/import"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({autoMerge:!0})}),a=await s.json().catch(()=>null);if(!s.ok||a?.ok===!1||!a){const d=a?.error??`Profile import failed (${s.status})`;e.nostrProfileFormState={...t,importing:!1,error:d,success:null};return}const i=a.merged??a.imported??null,r=i?{...t.values,...i}:t.values,c=!!(r.banner||r.website||r.nip05||r.lud16);e.nostrProfileFormState={...t,importing:!1,values:r,error:null,success:a.saved?"Profile imported from relays. Review and publish.":"Profile imported. Review and publish.",showAdvanced:c},a.saved&&await we(e,!0)}catch(s){e.nostrProfileFormState={...t,importing:!1,error:`Profile import failed: ${String(s)}`,success:null}}}function br(e){const t=(e??"").trim();if(!t)return null;const n=t.split(":").filter(Boolean);if(n.length<3||n[0]!=="agent")return null;const s=n[1]?.trim(),a=n.slice(2).join(":");return!s||!a?null:{agentId:s,rest:a}}const Vs=450;function cn(e,t=!1){e.chatScrollFrame&&cancelAnimationFrame(e.chatScrollFrame),e.chatScrollTimeout!=null&&(clearTimeout(e.chatScrollTimeout),e.chatScrollTimeout=null);const n=()=>{const s=e.querySelector(".chat-thread");if(s){const a=getComputedStyle(s).overflowY;if(a==="auto"||a==="scroll"||s.scrollHeight-s.clientHeight>1)return s}return document.scrollingElement??document.documentElement};e.updateComplete.then(()=>{e.chatScrollFrame=requestAnimationFrame(()=>{e.chatScrollFrame=null;const s=n();if(!s)return;const a=s.scrollHeight-s.scrollTop-s.clientHeight,i=t&&!e.chatHasAutoScrolled;if(!(i||e.chatUserNearBottom||a<Vs)){e.chatNewMessagesBelow=!0;return}i&&(e.chatHasAutoScrolled=!0),s.scrollTop=s.scrollHeight,e.chatUserNearBottom=!0,e.chatNewMessagesBelow=!1;const c=i?150:120;e.chatScrollTimeout=window.setTimeout(()=>{e.chatScrollTimeout=null;const d=n();if(!d)return;const g=d.scrollHeight-d.scrollTop-d.clientHeight;(i||e.chatUserNearBottom||g<Vs)&&(d.scrollTop=d.scrollHeight,e.chatUserNearBottom=!0)},c)})})}function yr(e,t=!1){e.logsScrollFrame&&cancelAnimationFrame(e.logsScrollFrame),e.updateComplete.then(()=>{e.logsScrollFrame=requestAnimationFrame(()=>{e.logsScrollFrame=null;const n=e.querySelector(".log-stream");if(!n)return;const s=n.scrollHeight-n.scrollTop-n.clientHeight;(t||s<80)&&(n.scrollTop=n.scrollHeight)})})}function Jc(e,t){const n=t.currentTarget;if(!n)return;const s=n.scrollHeight-n.scrollTop-n.clientHeight;e.chatUserNearBottom=s<Vs,e.chatUserNearBottom&&(e.chatNewMessagesBelow=!1)}function Zc(e,t){const n=t.currentTarget;if(!n)return;const s=n.scrollHeight-n.scrollTop-n.clientHeight;e.logsAtBottom=s<80}function Ho(e){e.chatHasAutoScrolled=!1,e.chatUserNearBottom=!0,e.chatNewMessagesBelow=!1}function Xc(e,t){if(e.length===0)return;const n=new Blob([`${e.join(`
`)}
`],{type:"text/plain"}),s=URL.createObjectURL(n),a=document.createElement("a"),i=new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");a.href=s,a.download=`openclaw-logs-${t}-${i}.log`,a.click(),URL.revokeObjectURL(s)}function ed(e){if(typeof ResizeObserver>"u")return;const t=e.querySelector(".topbar");if(!t)return;const n=()=>{const{height:s}=t.getBoundingClientRect();e.style.setProperty("--topbar-height",`${s}px`)};n(),e.topbarObserver=new ResizeObserver(()=>n()),e.topbarObserver.observe(t)}async function Xn(e){if(!(!e.client||!e.connected)&&!e.debugLoading){e.debugLoading=!0;try{const[t,n,s,a]=await Promise.all([e.client.request("status",{}),e.client.request("health",{}),e.client.request("models.list",{}),e.client.request("last-heartbeat",{})]);e.debugStatus=t,e.debugHealth=n;const i=s;e.debugModels=Array.isArray(i?.models)?i?.models:[],e.debugHeartbeat=a}catch(t){e.debugCallError=String(t)}finally{e.debugLoading=!1}}}async function td(e){if(!(!e.client||!e.connected)){e.debugCallError=null,e.debugCallResult=null;try{const t=e.debugCallParams.trim()?JSON.parse(e.debugCallParams):{},n=await e.client.request(e.debugCallMethod.trim(),t);e.debugCallResult=JSON.stringify(n,null,2)}catch(t){e.debugCallError=String(t)}}}const nd=2e3,sd=new Set(["trace","debug","info","warn","error","fatal"]);function ad(e){if(typeof e!="string")return null;const t=e.trim();if(!t.startsWith("{")||!t.endsWith("}"))return null;try{const n=JSON.parse(t);return!n||typeof n!="object"?null:n}catch{return null}}function od(e){if(typeof e!="string")return null;const t=e.toLowerCase();return sd.has(t)?t:null}function id(e){if(!e.trim())return{raw:e,message:e};try{const t=JSON.parse(e),n=t&&typeof t._meta=="object"&&t._meta!==null?t._meta:null,s=typeof t.time=="string"?t.time:typeof n?.date=="string"?n?.date:null,a=od(n?.logLevelName??n?.level),i=typeof t[0]=="string"?t[0]:typeof n?.name=="string"?n?.name:null,r=ad(i);let c=null;r&&(typeof r.subsystem=="string"?c=r.subsystem:typeof r.module=="string"&&(c=r.module)),!c&&i&&i.length<120&&(c=i);let d=null;return typeof t[1]=="string"?d=t[1]:!r&&typeof t[0]=="string"?d=t[0]:typeof t.message=="string"&&(d=t.message),{raw:e,time:s,level:a,subsystem:c,message:d??e,meta:n??void 0}}catch{return{raw:e,message:e}}}async function Ea(e,t){if(!(!e.client||!e.connected)&&!(e.logsLoading&&!t?.quiet)){t?.quiet||(e.logsLoading=!0),e.logsError=null;try{const s=await e.client.request("logs.tail",{cursor:t?.reset?void 0:e.logsCursor??void 0,limit:e.logsLimit,maxBytes:e.logsMaxBytes}),i=(Array.isArray(s.lines)?s.lines.filter(c=>typeof c=="string"):[]).map(id),r=!!(t?.reset||s.reset||e.logsCursor==null);e.logsEntries=r?i:[...e.logsEntries,...i].slice(-nd),typeof s.cursor=="number"&&(e.logsCursor=s.cursor),typeof s.file=="string"&&(e.logsFile=s.file),e.logsTruncated=!!s.truncated,e.logsLastFetchAt=Date.now()}catch(n){e.logsError=String(n)}finally{t?.quiet||(e.logsLoading=!1)}}}async function es(e,t){if(!(!e.client||!e.connected)&&!e.nodesLoading){e.nodesLoading=!0,t?.quiet||(e.lastError=null);try{const n=await e.client.request("node.list",{});e.nodes=Array.isArray(n.nodes)?n.nodes:[]}catch(n){t?.quiet||(e.lastError=String(n))}finally{e.nodesLoading=!1}}}function rd(e){e.nodesPollInterval==null&&(e.nodesPollInterval=window.setInterval(()=>{es(e,{quiet:!0})},5e3))}function ld(e){e.nodesPollInterval!=null&&(clearInterval(e.nodesPollInterval),e.nodesPollInterval=null)}function La(e){e.logsPollInterval==null&&(e.logsPollInterval=window.setInterval(()=>{e.tab==="logs"&&Ea(e,{quiet:!0})},2e3))}function Ia(e){e.logsPollInterval!=null&&(clearInterval(e.logsPollInterval),e.logsPollInterval=null)}function Da(e){e.debugPollInterval==null&&(e.debugPollInterval=window.setInterval(()=>{e.tab==="debug"&&Xn(e)},3e3))}function Ra(e){e.debugPollInterval!=null&&(clearInterval(e.debugPollInterval),e.debugPollInterval=null)}async function wr(e,t){if(!(!e.client||!e.connected||e.agentIdentityLoading)&&!e.agentIdentityById[t]){e.agentIdentityLoading=!0,e.agentIdentityError=null;try{const n=await e.client.request("agent.identity.get",{agentId:t});n&&(e.agentIdentityById={...e.agentIdentityById,[t]:n})}catch(n){e.agentIdentityError=String(n)}finally{e.agentIdentityLoading=!1}}}async function xr(e,t){if(!e.client||!e.connected||e.agentIdentityLoading)return;const n=t.filter(s=>!e.agentIdentityById[s]);if(n.length!==0){e.agentIdentityLoading=!0,e.agentIdentityError=null;try{for(const s of n){const a=await e.client.request("agent.identity.get",{agentId:s});a&&(e.agentIdentityById={...e.agentIdentityById,[s]:a})}}catch(s){e.agentIdentityError=String(s)}finally{e.agentIdentityLoading=!1}}}async function Rn(e,t){if(!(!e.client||!e.connected)&&!e.agentSkillsLoading){e.agentSkillsLoading=!0,e.agentSkillsError=null;try{const n=await e.client.request("skills.status",{agentId:t});n&&(e.agentSkillsReport=n,e.agentSkillsAgentId=t)}catch(n){e.agentSkillsError=String(n)}finally{e.agentSkillsLoading=!1}}}async function Pa(e){if(!(!e.client||!e.connected)&&!e.agentsLoading){e.agentsLoading=!0,e.agentsError=null;try{const t=await e.client.request("agents.list",{});if(t){e.agentsList=t;const n=e.agentsSelectedId,s=t.agents.some(a=>a.id===n);(!n||!s)&&(e.agentsSelectedId=t.defaultId??t.agents[0]?.id??null)}}catch(t){e.agentsError=String(t)}finally{e.agentsLoading=!1}}}const cd=/<\s*\/?\s*(?:think(?:ing)?|thought|antthinking|final)\b/i,$n=/<\s*\/?\s*final\b[^<>]*>/gi,zo=/<\s*(\/?)\s*(?:think(?:ing)?|thought|antthinking)\b[^<>]*>/gi;function Wo(e){const t=[],n=/(^|\n)(```|~~~)[^\n]*\n[\s\S]*?(?:\n\2(?:\n|$)|$)/g;for(const a of e.matchAll(n)){const i=(a.index??0)+a[1].length;t.push({start:i,end:i+a[0].length-a[1].length})}const s=/`+[^`]+`+/g;for(const a of e.matchAll(s)){const i=a.index??0,r=i+a[0].length;t.some(d=>i>=d.start&&r<=d.end)||t.push({start:i,end:r})}return t.sort((a,i)=>a.start-i.start),t}function Ko(e,t){return t.some(n=>e>=n.start&&e<n.end)}function dd(e,t){return e.trimStart()}function ud(e,t){if(!e||!cd.test(e))return e;let n=e;if($n.test(n)){$n.lastIndex=0;const c=[],d=Wo(n);for(const g of n.matchAll($n)){const h=g.index??0;c.push({start:h,length:g[0].length,inCode:Ko(h,d)})}for(let g=c.length-1;g>=0;g--){const h=c[g];h.inCode||(n=n.slice(0,h.start)+n.slice(h.start+h.length))}}else $n.lastIndex=0;const s=Wo(n);zo.lastIndex=0;let a="",i=0,r=!1;for(const c of n.matchAll(zo)){const d=c.index??0,g=c[1]==="/";Ko(d,s)||(r?g&&(r=!1):(a+=n.slice(i,d),g||(r=!0)),i=d+c[0].length)}return a+=n.slice(i),dd(a)}function ft(e){return!e&&e!==0?"n/a":new Date(e).toLocaleString()}function Q(e){if(!e&&e!==0)return"n/a";const t=Date.now()-e,n=Math.abs(t),s=t<0?"from now":"ago",a=Math.round(n/1e3);if(a<60)return t<0?"in <1m":`${a}s ago`;const i=Math.round(a/60);if(i<60)return`${i}m ${s}`;const r=Math.round(i/60);return r<48?`${r}h ${s}`:`${Math.round(r/24)}d ${s}`}function $r(e){if(!e&&e!==0)return"n/a";if(e<1e3)return`${e}ms`;const t=Math.round(e/1e3);if(t<60)return`${t}s`;const n=Math.round(t/60);if(n<60)return`${n}m`;const s=Math.round(n/60);return s<48?`${s}h`:`${Math.round(s/24)}d`}function Qs(e){return!e||e.length===0?"none":e.filter(t=>!!(t&&t.trim())).join(", ")}function Ys(e,t=120){return e.length<=t?e:`${e.slice(0,Math.max(0,t-1))}…`}function Sr(e,t){return e.length<=t?{text:e,truncated:!1,total:e.length}:{text:e.slice(0,Math.max(0,t)),truncated:!0,total:e.length}}function Un(e,t){const n=Number(e);return Number.isFinite(n)?n:t}function Ss(e){return ud(e)}async function dn(e){if(!(!e.client||!e.connected))try{const t=await e.client.request("cron.status",{});e.cronStatus=t}catch(t){e.cronError=String(t)}}async function ts(e){if(!(!e.client||!e.connected)&&!e.cronLoading){e.cronLoading=!0,e.cronError=null;try{const t=await e.client.request("cron.list",{includeDisabled:!0});e.cronJobs=Array.isArray(t.jobs)?t.jobs:[]}catch(t){e.cronError=String(t)}finally{e.cronLoading=!1}}}function gd(e){if(e.scheduleKind==="at"){const n=Date.parse(e.scheduleAt);if(!Number.isFinite(n))throw new Error("Invalid run time.");return{kind:"at",at:new Date(n).toISOString()}}if(e.scheduleKind==="every"){const n=Un(e.everyAmount,0);if(n<=0)throw new Error("Invalid interval amount.");const s=e.everyUnit;return{kind:"every",everyMs:n*(s==="minutes"?6e4:s==="hours"?36e5:864e5)}}const t=e.cronExpr.trim();if(!t)throw new Error("Cron expression required.");return{kind:"cron",expr:t,tz:e.cronTz.trim()||void 0}}function pd(e){if(e.payloadKind==="systemEvent"){const a=e.payloadText.trim();if(!a)throw new Error("System event text required.");return{kind:"systemEvent",text:a}}const t=e.payloadText.trim();if(!t)throw new Error("Agent message required.");const n={kind:"agentTurn",message:t},s=Un(e.timeoutSeconds,0);return s>0&&(n.timeoutSeconds=s),n}async function md(e){if(!(!e.client||!e.connected||e.cronBusy)){e.cronBusy=!0,e.cronError=null;try{const t=gd(e.cronForm),n=pd(e.cronForm),s=e.cronForm.sessionTarget==="isolated"&&e.cronForm.payloadKind==="agentTurn"&&e.cronForm.deliveryMode?{mode:e.cronForm.deliveryMode==="announce"?"announce":"none",channel:e.cronForm.deliveryChannel.trim()||"last",to:e.cronForm.deliveryTo.trim()||void 0}:void 0,a=e.cronForm.agentId.trim(),i={name:e.cronForm.name.trim(),description:e.cronForm.description.trim()||void 0,agentId:a||void 0,enabled:e.cronForm.enabled,schedule:t,sessionTarget:e.cronForm.sessionTarget,wakeMode:e.cronForm.wakeMode,payload:n,delivery:s};if(!i.name)throw new Error("Name required.");await e.client.request("cron.add",i),e.cronForm={...e.cronForm,name:"",description:"",payloadText:""},await ts(e),await dn(e)}catch(t){e.cronError=String(t)}finally{e.cronBusy=!1}}}async function hd(e,t,n){if(!(!e.client||!e.connected||e.cronBusy)){e.cronBusy=!0,e.cronError=null;try{await e.client.request("cron.update",{id:t.id,patch:{enabled:n}}),await ts(e),await dn(e)}catch(s){e.cronError=String(s)}finally{e.cronBusy=!1}}}async function fd(e,t){if(!(!e.client||!e.connected||e.cronBusy)){e.cronBusy=!0,e.cronError=null;try{await e.client.request("cron.run",{id:t.id,mode:"force"}),await kr(e,t.id)}catch(n){e.cronError=String(n)}finally{e.cronBusy=!1}}}async function vd(e,t){if(!(!e.client||!e.connected||e.cronBusy)){e.cronBusy=!0,e.cronError=null;try{await e.client.request("cron.remove",{id:t.id}),e.cronRunsJobId===t.id&&(e.cronRunsJobId=null,e.cronRuns=[]),await ts(e),await dn(e)}catch(n){e.cronError=String(n)}finally{e.cronBusy=!1}}}async function kr(e,t){if(!(!e.client||!e.connected))try{const n=await e.client.request("cron.runs",{id:t,limit:50});e.cronRunsJobId=t,e.cronRuns=Array.isArray(n.entries)?n.entries:[]}catch(n){e.cronError=String(n)}}const Ar="openclaw.device.auth.v1";function Na(e){return e.trim()}function bd(e){if(!Array.isArray(e))return[];const t=new Set;for(const n of e){const s=n.trim();s&&t.add(s)}return[...t].toSorted()}function Fa(){try{const e=window.localStorage.getItem(Ar);if(!e)return null;const t=JSON.parse(e);return!t||t.version!==1||!t.deviceId||typeof t.deviceId!="string"||!t.tokens||typeof t.tokens!="object"?null:t}catch{return null}}function Cr(e){try{window.localStorage.setItem(Ar,JSON.stringify(e))}catch{}}function yd(e){const t=Fa();if(!t||t.deviceId!==e.deviceId)return null;const n=Na(e.role),s=t.tokens[n];return!s||typeof s.token!="string"?null:s}function Tr(e){const t=Na(e.role),n={version:1,deviceId:e.deviceId,tokens:{}},s=Fa();s&&s.deviceId===e.deviceId&&(n.tokens={...s.tokens});const a={token:e.token,role:t,scopes:bd(e.scopes),updatedAtMs:Date.now()};return n.tokens[t]=a,Cr(n),a}function _r(e){const t=Fa();if(!t||t.deviceId!==e.deviceId)return;const n=Na(e.role);if(!t.tokens[n])return;const s={...t,tokens:{...t.tokens}};delete s.tokens[n],Cr(s)}const Mr={p:0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffedn,n:0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3edn,h:8n,a:0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffecn,d:0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3n,Gx:0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51an,Gy:0x6666666666666666666666666666666666666666666666666666666666666658n},{p:ge,n:Pn,Gx:jo,Gy:qo,a:ks,d:As,h:wd}=Mr,vt=32,Oa=64,xd=(...e)=>{"captureStackTrace"in Error&&typeof Error.captureStackTrace=="function"&&Error.captureStackTrace(...e)},re=(e="")=>{const t=new Error(e);throw xd(t,re),t},$d=e=>typeof e=="bigint",Sd=e=>typeof e=="string",kd=e=>e instanceof Uint8Array||ArrayBuffer.isView(e)&&e.constructor.name==="Uint8Array",Xe=(e,t,n="")=>{const s=kd(e),a=e?.length,i=t!==void 0;if(!s||i&&a!==t){const r=n&&`"${n}" `,c=i?` of length ${t}`:"",d=s?`length=${a}`:`type=${typeof e}`;re(r+"expected Uint8Array"+c+", got "+d)}return e},ns=e=>new Uint8Array(e),Er=e=>Uint8Array.from(e),Lr=(e,t)=>e.toString(16).padStart(t,"0"),Ir=e=>Array.from(Xe(e)).map(t=>Lr(t,2)).join(""),Ke={_0:48,_9:57,A:65,F:70,a:97,f:102},Go=e=>{if(e>=Ke._0&&e<=Ke._9)return e-Ke._0;if(e>=Ke.A&&e<=Ke.F)return e-(Ke.A-10);if(e>=Ke.a&&e<=Ke.f)return e-(Ke.a-10)},Dr=e=>{const t="hex invalid";if(!Sd(e))return re(t);const n=e.length,s=n/2;if(n%2)return re(t);const a=ns(s);for(let i=0,r=0;i<s;i++,r+=2){const c=Go(e.charCodeAt(r)),d=Go(e.charCodeAt(r+1));if(c===void 0||d===void 0)return re(t);a[i]=c*16+d}return a},Rr=()=>globalThis?.crypto,Ad=()=>Rr()?.subtle??re("crypto.subtle must be defined, consider polyfill"),an=(...e)=>{const t=ns(e.reduce((s,a)=>s+Xe(a).length,0));let n=0;return e.forEach(s=>{t.set(s,n),n+=s.length}),t},Cd=(e=vt)=>Rr().getRandomValues(ns(e)),Bn=BigInt,lt=(e,t,n,s="bad number: out of range")=>$d(e)&&t<=e&&e<n?e:re(s),N=(e,t=ge)=>{const n=e%t;return n>=0n?n:t+n},Pr=e=>N(e,Pn),Td=(e,t)=>{(e===0n||t<=0n)&&re("no inverse n="+e+" mod="+t);let n=N(e,t),s=t,a=0n,i=1n;for(;n!==0n;){const r=s/n,c=s%n,d=a-i*r;s=n,n=c,a=i,i=d}return s===1n?N(a,t):re("no inverse")},_d=e=>{const t=Ur[e];return typeof t!="function"&&re("hashes."+e+" not set"),t},Cs=e=>e instanceof Ce?e:re("Point expected"),Js=2n**256n;class Ce{static BASE;static ZERO;X;Y;Z;T;constructor(t,n,s,a){const i=Js;this.X=lt(t,0n,i),this.Y=lt(n,0n,i),this.Z=lt(s,1n,i),this.T=lt(a,0n,i),Object.freeze(this)}static CURVE(){return Mr}static fromAffine(t){return new Ce(t.x,t.y,1n,N(t.x*t.y))}static fromBytes(t,n=!1){const s=As,a=Er(Xe(t,vt)),i=t[31];a[31]=i&-129;const r=Fr(a);lt(r,0n,n?Js:ge);const d=N(r*r),g=N(d-1n),h=N(s*d+1n);let{isValid:p,value:f}=Ed(g,h);p||re("bad point: y not sqrt");const u=(f&1n)===1n,m=(i&128)!==0;return!n&&f===0n&&m&&re("bad point: x==0, isLastByteOdd"),m!==u&&(f=N(-f)),new Ce(f,r,1n,N(f*r))}static fromHex(t,n){return Ce.fromBytes(Dr(t),n)}get x(){return this.toAffine().x}get y(){return this.toAffine().y}assertValidity(){const t=ks,n=As,s=this;if(s.is0())return re("bad point: ZERO");const{X:a,Y:i,Z:r,T:c}=s,d=N(a*a),g=N(i*i),h=N(r*r),p=N(h*h),f=N(d*t),u=N(h*N(f+g)),m=N(p+N(n*N(d*g)));if(u!==m)return re("bad point: equation left != right (1)");const b=N(a*i),x=N(r*c);return b!==x?re("bad point: equation left != right (2)"):this}equals(t){const{X:n,Y:s,Z:a}=this,{X:i,Y:r,Z:c}=Cs(t),d=N(n*c),g=N(i*a),h=N(s*c),p=N(r*a);return d===g&&h===p}is0(){return this.equals(Et)}negate(){return new Ce(N(-this.X),this.Y,this.Z,N(-this.T))}double(){const{X:t,Y:n,Z:s}=this,a=ks,i=N(t*t),r=N(n*n),c=N(2n*N(s*s)),d=N(a*i),g=t+n,h=N(N(g*g)-i-r),p=d+r,f=p-c,u=d-r,m=N(h*f),b=N(p*u),x=N(h*u),A=N(f*p);return new Ce(m,b,A,x)}add(t){const{X:n,Y:s,Z:a,T:i}=this,{X:r,Y:c,Z:d,T:g}=Cs(t),h=ks,p=As,f=N(n*r),u=N(s*c),m=N(i*p*g),b=N(a*d),x=N((n+s)*(r+c)-f-u),A=N(b-m),$=N(b+m),T=N(u-h*f),C=N(x*A),_=N($*T),M=N(x*T),D=N(A*$);return new Ce(C,_,D,M)}subtract(t){return this.add(Cs(t).negate())}multiply(t,n=!0){if(!n&&(t===0n||this.is0()))return Et;if(lt(t,1n,Pn),t===1n)return this;if(this.equals(bt))return Hd(t).p;let s=Et,a=bt;for(let i=this;t>0n;i=i.double(),t>>=1n)t&1n?s=s.add(i):n&&(a=a.add(i));return s}multiplyUnsafe(t){return this.multiply(t,!1)}toAffine(){const{X:t,Y:n,Z:s}=this;if(this.equals(Et))return{x:0n,y:1n};const a=Td(s,ge);N(s*a)!==1n&&re("invalid inverse");const i=N(t*a),r=N(n*a);return{x:i,y:r}}toBytes(){const{x:t,y:n}=this.assertValidity().toAffine(),s=Nr(n);return s[31]|=t&1n?128:0,s}toHex(){return Ir(this.toBytes())}clearCofactor(){return this.multiply(Bn(wd),!1)}isSmallOrder(){return this.clearCofactor().is0()}isTorsionFree(){let t=this.multiply(Pn/2n,!1).double();return Pn%2n&&(t=t.add(this)),t.is0()}}const bt=new Ce(jo,qo,1n,N(jo*qo)),Et=new Ce(0n,1n,1n,0n);Ce.BASE=bt;Ce.ZERO=Et;const Nr=e=>Dr(Lr(lt(e,0n,Js),Oa)).reverse(),Fr=e=>Bn("0x"+Ir(Er(Xe(e)).reverse())),De=(e,t)=>{let n=e;for(;t-- >0n;)n*=n,n%=ge;return n},Md=e=>{const n=e*e%ge*e%ge,s=De(n,2n)*n%ge,a=De(s,1n)*e%ge,i=De(a,5n)*a%ge,r=De(i,10n)*i%ge,c=De(r,20n)*r%ge,d=De(c,40n)*c%ge,g=De(d,80n)*d%ge,h=De(g,80n)*d%ge,p=De(h,10n)*i%ge;return{pow_p_5_8:De(p,2n)*e%ge,b2:n}},Vo=0x2b8324804fc1df0b2b4d00993dfbd7a72f431806ad2fe478c4ee1b274a0ea0b0n,Ed=(e,t)=>{const n=N(t*t*t),s=N(n*n*t),a=Md(e*s).pow_p_5_8;let i=N(e*n*a);const r=N(t*i*i),c=i,d=N(i*Vo),g=r===e,h=r===N(-e),p=r===N(-e*Vo);return g&&(i=c),(h||p)&&(i=d),(N(i)&1n)===1n&&(i=N(-i)),{isValid:g||h,value:i}},Zs=e=>Pr(Fr(e)),Ua=(...e)=>Ur.sha512Async(an(...e)),Ld=(...e)=>_d("sha512")(an(...e)),Or=e=>{const t=e.slice(0,vt);t[0]&=248,t[31]&=127,t[31]|=64;const n=e.slice(vt,Oa),s=Zs(t),a=bt.multiply(s),i=a.toBytes();return{head:t,prefix:n,scalar:s,point:a,pointBytes:i}},Ba=e=>Ua(Xe(e,vt)).then(Or),Id=e=>Or(Ld(Xe(e,vt))),Dd=e=>Ba(e).then(t=>t.pointBytes),Rd=e=>Ua(e.hashable).then(e.finish),Pd=(e,t,n)=>{const{pointBytes:s,scalar:a}=e,i=Zs(t),r=bt.multiply(i).toBytes();return{hashable:an(r,s,n),finish:g=>{const h=Pr(i+Zs(g)*a);return Xe(an(r,Nr(h)),Oa)}}},Nd=async(e,t)=>{const n=Xe(e),s=await Ba(t),a=await Ua(s.prefix,n);return Rd(Pd(s,a,n))},Ur={sha512Async:async e=>{const t=Ad(),n=an(e);return ns(await t.digest("SHA-512",n.buffer))},sha512:void 0},Fd=(e=Cd(vt))=>e,Od={getExtendedPublicKeyAsync:Ba,getExtendedPublicKey:Id,randomSecretKey:Fd},Hn=8,Ud=256,Br=Math.ceil(Ud/Hn)+1,Xs=2**(Hn-1),Bd=()=>{const e=[];let t=bt,n=t;for(let s=0;s<Br;s++){n=t,e.push(n);for(let a=1;a<Xs;a++)n=n.add(t),e.push(n);t=n.double()}return e};let Qo;const Yo=(e,t)=>{const n=t.negate();return e?n:t},Hd=e=>{const t=Qo||(Qo=Bd());let n=Et,s=bt;const a=2**Hn,i=a,r=Bn(a-1),c=Bn(Hn);for(let d=0;d<Br;d++){let g=Number(e&r);e>>=c,g>Xs&&(g-=i,e+=1n);const h=d*Xs,p=h,f=h+Math.abs(g)-1,u=d%2!==0,m=g<0;g===0?s=s.add(Yo(u,t[p])):n=n.add(Yo(m,t[f]))}return e!==0n&&re("invalid wnaf"),{p:n,f:s}},Ts="openclaw-device-identity-v1";function ea(e){let t="";for(const n of e)t+=String.fromCharCode(n);return btoa(t).replaceAll("+","-").replaceAll("/","_").replace(/=+$/g,"")}function Hr(e){const t=e.replaceAll("-","+").replaceAll("_","/"),n=t+"=".repeat((4-t.length%4)%4),s=atob(n),a=new Uint8Array(s.length);for(let i=0;i<s.length;i+=1)a[i]=s.charCodeAt(i);return a}function zd(e){return Array.from(e).map(t=>t.toString(16).padStart(2,"0")).join("")}async function zr(e){const t=await crypto.subtle.digest("SHA-256",e.slice().buffer);return zd(new Uint8Array(t))}async function Wd(){const e=Od.randomSecretKey(),t=await Dd(e);return{deviceId:await zr(t),publicKey:ea(t),privateKey:ea(e)}}async function Ha(){try{const n=localStorage.getItem(Ts);if(n){const s=JSON.parse(n);if(s?.version===1&&typeof s.deviceId=="string"&&typeof s.publicKey=="string"&&typeof s.privateKey=="string"){const a=await zr(Hr(s.publicKey));if(a!==s.deviceId){const i={...s,deviceId:a};return localStorage.setItem(Ts,JSON.stringify(i)),{deviceId:a,publicKey:s.publicKey,privateKey:s.privateKey}}return{deviceId:s.deviceId,publicKey:s.publicKey,privateKey:s.privateKey}}}}catch{}const e=await Wd(),t={version:1,deviceId:e.deviceId,publicKey:e.publicKey,privateKey:e.privateKey,createdAtMs:Date.now()};return localStorage.setItem(Ts,JSON.stringify(t)),e}async function Kd(e,t){const n=Hr(e),s=new TextEncoder().encode(t),a=await Nd(s,n);return ea(a)}async function et(e,t){if(!(!e.client||!e.connected)&&!e.devicesLoading){e.devicesLoading=!0,t?.quiet||(e.devicesError=null);try{const n=await e.client.request("device.pair.list",{});e.devicesList={pending:Array.isArray(n?.pending)?n.pending:[],paired:Array.isArray(n?.paired)?n.paired:[]}}catch(n){t?.quiet||(e.devicesError=String(n))}finally{e.devicesLoading=!1}}}async function jd(e,t){if(!(!e.client||!e.connected))try{await e.client.request("device.pair.approve",{requestId:t}),await et(e)}catch(n){e.devicesError=String(n)}}async function qd(e,t){if(!(!e.client||!e.connected||!window.confirm("Reject this device pairing request?")))try{await e.client.request("device.pair.reject",{requestId:t}),await et(e)}catch(s){e.devicesError=String(s)}}async function Gd(e,t){if(!(!e.client||!e.connected))try{const n=await e.client.request("device.token.rotate",t);if(n?.token){const s=await Ha(),a=n.role??t.role;(n.deviceId===s.deviceId||t.deviceId===s.deviceId)&&Tr({deviceId:s.deviceId,role:a,token:n.token,scopes:n.scopes??t.scopes??[]}),window.prompt("New device token (copy and store securely):",n.token)}await et(e)}catch(n){e.devicesError=String(n)}}async function Vd(e,t){if(!(!e.client||!e.connected||!window.confirm(`Revoke token for ${t.deviceId} (${t.role})?`)))try{await e.client.request("device.token.revoke",t);const s=await Ha();t.deviceId===s.deviceId&&_r({deviceId:s.deviceId,role:t.role}),await et(e)}catch(s){e.devicesError=String(s)}}function Qd(e){if(!e||e.kind==="gateway")return{method:"exec.approvals.get",params:{}};const t=e.nodeId.trim();return t?{method:"exec.approvals.node.get",params:{nodeId:t}}:null}function Yd(e,t){if(!e||e.kind==="gateway")return{method:"exec.approvals.set",params:t};const n=e.nodeId.trim();return n?{method:"exec.approvals.node.set",params:{...t,nodeId:n}}:null}async function za(e,t){if(!(!e.client||!e.connected)&&!e.execApprovalsLoading){e.execApprovalsLoading=!0,e.lastError=null;try{const n=Qd(t);if(!n){e.lastError="Select a node before loading exec approvals.";return}const s=await e.client.request(n.method,n.params);Jd(e,s)}catch(n){e.lastError=String(n)}finally{e.execApprovalsLoading=!1}}}function Jd(e,t){e.execApprovalsSnapshot=t,e.execApprovalsDirty||(e.execApprovalsForm=ht(t.file??{}))}async function Zd(e,t){if(!(!e.client||!e.connected)){e.execApprovalsSaving=!0,e.lastError=null;try{const n=e.execApprovalsSnapshot?.hash;if(!n){e.lastError="Exec approvals hash missing; reload and retry.";return}const s=e.execApprovalsForm??e.execApprovalsSnapshot?.file??{},a=Yd(t,{file:s,baseHash:n});if(!a){e.lastError="Select a node before saving exec approvals.";return}await e.client.request(a.method,a.params),e.execApprovalsDirty=!1,await za(e,t)}catch(n){e.lastError=String(n)}finally{e.execApprovalsSaving=!1}}}function Xd(e,t,n){const s=ht(e.execApprovalsForm??e.execApprovalsSnapshot?.file??{});pr(s,t,n),e.execApprovalsForm=s,e.execApprovalsDirty=!0}function eu(e,t){const n=ht(e.execApprovalsForm??e.execApprovalsSnapshot?.file??{});mr(n,t),e.execApprovalsForm=n,e.execApprovalsDirty=!0}async function Wa(e){if(!(!e.client||!e.connected)&&!e.presenceLoading){e.presenceLoading=!0,e.presenceError=null,e.presenceStatus=null;try{const t=await e.client.request("system-presence",{});Array.isArray(t)?(e.presenceEntries=t,e.presenceStatus=t.length===0?"No instances yet.":null):(e.presenceEntries=[],e.presenceStatus="No presence payload.")}catch(t){e.presenceError=String(t)}finally{e.presenceLoading=!1}}}async function xt(e,t){if(!(!e.client||!e.connected)&&!e.sessionsLoading){e.sessionsLoading=!0,e.sessionsError=null;try{const n=t?.includeGlobal??e.sessionsIncludeGlobal,s=t?.includeUnknown??e.sessionsIncludeUnknown,a=t?.activeMinutes??Un(e.sessionsFilterActive,0),i=t?.limit??Un(e.sessionsFilterLimit,0),r={includeGlobal:n,includeUnknown:s};a>0&&(r.activeMinutes=a),i>0&&(r.limit=i);const c=await e.client.request("sessions.list",r);c&&(e.sessionsResult=c)}catch(n){e.sessionsError=String(n)}finally{e.sessionsLoading=!1}}}async function tu(e,t,n){if(!e.client||!e.connected)return;const s={key:t};"label"in n&&(s.label=n.label),"thinkingLevel"in n&&(s.thinkingLevel=n.thinkingLevel),"verboseLevel"in n&&(s.verboseLevel=n.verboseLevel),"reasoningLevel"in n&&(s.reasoningLevel=n.reasoningLevel);try{await e.client.request("sessions.patch",s),await xt(e)}catch(a){e.sessionsError=String(a)}}async function nu(e,t){if(!(!e.client||!e.connected||e.sessionsLoading||!window.confirm(`Delete session "${t}"?

Deletes the session entry and archives its transcript.`))){e.sessionsLoading=!0,e.sessionsError=null;try{await e.client.request("sessions.delete",{key:t,deleteTranscript:!0}),await xt(e)}catch(s){e.sessionsError=String(s)}finally{e.sessionsLoading=!1}}}function Rt(e,t,n){if(!t.trim())return;const s={...e.skillMessages};n?s[t]=n:delete s[t],e.skillMessages=s}function ss(e){return e instanceof Error?e.message:String(e)}async function un(e,t){if(t?.clearMessages&&Object.keys(e.skillMessages).length>0&&(e.skillMessages={}),!(!e.client||!e.connected)&&!e.skillsLoading){e.skillsLoading=!0,e.skillsError=null;try{const n=await e.client.request("skills.status",{});n&&(e.skillsReport=n)}catch(n){e.skillsError=ss(n)}finally{e.skillsLoading=!1}}}function su(e,t,n){e.skillEdits={...e.skillEdits,[t]:n}}async function au(e,t,n){if(!(!e.client||!e.connected)){e.skillsBusyKey=t,e.skillsError=null;try{await e.client.request("skills.update",{skillKey:t,enabled:n}),await un(e),Rt(e,t,{kind:"success",message:n?"Skill enabled":"Skill disabled"})}catch(s){const a=ss(s);e.skillsError=a,Rt(e,t,{kind:"error",message:a})}finally{e.skillsBusyKey=null}}}async function ou(e,t){if(!(!e.client||!e.connected)){e.skillsBusyKey=t,e.skillsError=null;try{const n=e.skillEdits[t]??"";await e.client.request("skills.update",{skillKey:t,apiKey:n}),await un(e),Rt(e,t,{kind:"success",message:"API key saved"})}catch(n){const s=ss(n);e.skillsError=s,Rt(e,t,{kind:"error",message:s})}finally{e.skillsBusyKey=null}}}async function iu(e,t,n,s){if(!(!e.client||!e.connected)){e.skillsBusyKey=t,e.skillsError=null;try{const a=await e.client.request("skills.install",{name:n,installId:s,timeoutMs:12e4});await un(e),Rt(e,t,{kind:"success",message:a?.message??"Installed"})}catch(a){const i=ss(a);e.skillsError=i,Rt(e,t,{kind:"error",message:i})}finally{e.skillsBusyKey=null}}}function ru(){return[{label:o("tabGroupChat"),tabs:["chat","agentSwarm"]},{label:o("tabGroupControl"),tabs:["overview","channels","instances","sessions","usage","cron"]},{label:o("tabGroupAgent"),tabs:["agents","skills","nodes"]},{label:o("tabGroupSettings"),tabs:["config","debug","logs"]}]}const Wr={agents:"/agents",overview:"/overview",channels:"/channels",instances:"/instances",sessions:"/sessions",usage:"/usage",cron:"/cron",skills:"/skills",nodes:"/nodes",chat:"/chat",agentSwarm:"/agent-swarm",config:"/config",debug:"/debug",logs:"/logs"},Kr=new Map(Object.entries(Wr).map(([e,t])=>[t,e]));function gn(e){if(!e)return"";let t=e.trim();return t.startsWith("/")||(t=`/${t}`),t==="/"?"":(t.endsWith("/")&&(t=t.slice(0,-1)),t)}function on(e){if(!e)return"/";let t=e.trim();return t.startsWith("/")||(t=`/${t}`),t.length>1&&t.endsWith("/")&&(t=t.slice(0,-1)),t}function as(e,t=""){const n=gn(t),s=Wr[e];return n?`${n}${s}`:s}function jr(e,t=""){const n=gn(t);let s=e||"/";n&&(s===n?s="/":s.startsWith(`${n}/`)&&(s=s.slice(n.length)));let a=on(s).toLowerCase();return a.endsWith("/index.html")&&(a="/"),a==="/"?"chat":Kr.get(a)??null}function lu(e){let t=on(e);if(t.endsWith("/index.html")&&(t=on(t.slice(0,-11))),t==="/")return"";const n=t.split("/").filter(Boolean);if(n.length===0)return"";for(let s=0;s<n.length;s++){const a=`/${n.slice(s).join("/")}`.toLowerCase();if(Kr.has(a)){const i=n.slice(0,s);return i.length?`/${i.join("/")}`:""}}return`/${n.join("/")}`}function cu(e){switch(e){case"agents":return"folder";case"chat":return"messageSquare";case"agentSwarm":return"brain";case"overview":return"barChart";case"channels":return"link";case"instances":return"radio";case"sessions":return"fileText";case"usage":return"barChart";case"cron":return"loader";case"skills":return"zap";case"nodes":return"monitor";case"config":return"settings";case"debug":return"bug";case"logs":return"scrollText";default:return"folder"}}function ta(e){switch(e){case"agents":return o("navTitleAgents");case"overview":return o("navTitleOverview");case"channels":return o("navTitleChannels");case"instances":return o("navTitleInstances");case"sessions":return o("navTitleSessions");case"usage":return o("navTitleUsage");case"cron":return o("navTitleCron");case"skills":return o("navTitleSkills");case"nodes":return o("navTitleNodes");case"chat":return o("navTitleChat");case"agentSwarm":return o("navTitleAgentSwarm");case"config":return o("navTitleConfig");case"debug":return o("navTitleDebug");case"logs":return o("navTitleLogs");default:return o("navTitleControl")}}function du(e){switch(e){case"agents":return o("subtitleAgents");case"overview":return o("subtitleOverview");case"channels":return o("subtitleChannels");case"instances":return o("subtitleInstances");case"sessions":return o("subtitleSessions");case"usage":return o("subtitleUsage");case"cron":return o("subtitleCron");case"skills":return o("subtitleSkills");case"nodes":return o("subtitleNodes");case"chat":return o("subtitleChat");case"agentSwarm":return o("subtitleAgentSwarm");case"config":return o("subtitleConfig");case"debug":return o("subtitleDebug");case"logs":return o("subtitleLogs");default:return""}}const qr="openclaw.control.settings.v1";function uu(){const t={gatewayUrl:`${location.protocol==="https:"?"wss":"ws"}://${location.host}`,token:"",sessionKey:"main",lastActiveSessionKey:"main",theme:"system",chatFocusMode:!1,chatShowThinking:!0,splitRatio:.6,navCollapsed:!1,navGroupsCollapsed:{}};try{const n=localStorage.getItem(qr);if(!n)return t;const s=JSON.parse(n);return{gatewayUrl:typeof s.gatewayUrl=="string"&&s.gatewayUrl.trim()?s.gatewayUrl.trim():t.gatewayUrl,token:typeof s.token=="string"?s.token:t.token,sessionKey:typeof s.sessionKey=="string"&&s.sessionKey.trim()?s.sessionKey.trim():t.sessionKey,lastActiveSessionKey:typeof s.lastActiveSessionKey=="string"&&s.lastActiveSessionKey.trim()?s.lastActiveSessionKey.trim():typeof s.sessionKey=="string"&&s.sessionKey.trim()||t.lastActiveSessionKey,theme:s.theme==="light"||s.theme==="dark"||s.theme==="system"?s.theme:t.theme,chatFocusMode:typeof s.chatFocusMode=="boolean"?s.chatFocusMode:t.chatFocusMode,chatShowThinking:typeof s.chatShowThinking=="boolean"?s.chatShowThinking:t.chatShowThinking,splitRatio:typeof s.splitRatio=="number"&&s.splitRatio>=.4&&s.splitRatio<=.7?s.splitRatio:t.splitRatio,navCollapsed:typeof s.navCollapsed=="boolean"?s.navCollapsed:t.navCollapsed,navGroupsCollapsed:typeof s.navGroupsCollapsed=="object"&&s.navGroupsCollapsed!==null?s.navGroupsCollapsed:t.navGroupsCollapsed}}catch{return t}}function gu(e){localStorage.setItem(qr,JSON.stringify(e))}const Sn=e=>Number.isNaN(e)?.5:e<=0?0:e>=1?1:e,pu=()=>typeof window>"u"||typeof window.matchMedia!="function"?!1:window.matchMedia("(prefers-reduced-motion: reduce)").matches??!1,kn=e=>{e.classList.remove("theme-transition"),e.style.removeProperty("--theme-switch-x"),e.style.removeProperty("--theme-switch-y")},mu=({nextTheme:e,applyTheme:t,context:n,currentTheme:s})=>{if(s===e)return;const a=globalThis.document??null;if(!a){t();return}const i=a.documentElement,r=a,c=pu();if(!!r.startViewTransition&&!c){let g=.5,h=.5;if(n?.pointerClientX!==void 0&&n?.pointerClientY!==void 0&&typeof window<"u")g=Sn(n.pointerClientX/window.innerWidth),h=Sn(n.pointerClientY/window.innerHeight);else if(n?.element){const p=n.element.getBoundingClientRect();p.width>0&&p.height>0&&typeof window<"u"&&(g=Sn((p.left+p.width/2)/window.innerWidth),h=Sn((p.top+p.height/2)/window.innerHeight))}i.style.setProperty("--theme-switch-x",`${g*100}%`),i.style.setProperty("--theme-switch-y",`${h*100}%`),i.classList.add("theme-transition");try{const p=r.startViewTransition?.(()=>{t()});p?.finished?p.finished.finally(()=>kn(i)):kn(i)}catch{kn(i),t()}return}t(),kn(i)};function hu(){return typeof window>"u"||typeof window.matchMedia!="function"||window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}function Ka(e){return e==="system"?hu():e}function yt(e,t){const n={...t,lastActiveSessionKey:t.lastActiveSessionKey?.trim()||t.sessionKey.trim()||"main"};e.settings=n,gu(n),t.theme!==e.theme&&(e.theme=t.theme,os(e,Ka(t.theme))),e.applySessionKey=e.settings.lastActiveSessionKey}function Gr(e,t){const n=t.trim();n&&e.settings.lastActiveSessionKey!==n&&yt(e,{...e.settings,lastActiveSessionKey:n})}function fu(e){if(!window.location.search)return;const t=new URLSearchParams(window.location.search),n=t.get("token"),s=t.get("password"),a=t.get("session"),i=t.get("gatewayUrl");let r=!1;if(n!=null&&(t.delete("token"),r=!0),s!=null){const d=s.trim();d&&(e.password=d),t.delete("password"),r=!0}if(a!=null){const d=a.trim();d&&(e.sessionKey=d,yt(e,{...e.settings,sessionKey:d,lastActiveSessionKey:d}))}if(i!=null){const d=i.trim();d&&d!==e.settings.gatewayUrl&&(e.pendingGatewayUrl=d),t.delete("gatewayUrl"),r=!0}if(!r)return;const c=new URL(window.location.href);c.search=t.toString(),window.history.replaceState({},"",c.toString())}function vu(e,t){e.tab!==t&&(e.tab=t),t==="chat"&&(e.chatHasAutoScrolled=!1),t==="logs"?La(e):Ia(e),t==="debug"?Da(e):Ra(e),ja(e),Qr(e,t,!1)}function bu(e,t,n){mu({nextTheme:t,applyTheme:()=>{e.theme=t,yt(e,{...e.settings,theme:t}),os(e,Ka(t))},context:n,currentTheme:e.theme})}async function ja(e){if(e.tab==="overview"&&await Yr(e),e.tab==="channels"&&await Cu(e),e.tab==="instances"&&await Wa(e),e.tab==="sessions"&&await xt(e),e.tab==="cron"&&await zn(e),e.tab==="skills"&&await un(e),e.tab==="agents"){await Pa(e),await Se(e);const t=e.agentsList?.agents?.map(s=>s.id)??[];t.length>0&&xr(e,t);const n=e.agentsSelectedId??e.agentsList?.defaultId??e.agentsList?.agents?.[0]?.id;n&&(wr(e,n),e.agentsPanel==="skills"&&Rn(e,n),e.agentsPanel==="channels"&&we(e,!1),e.agentsPanel==="cron"&&zn(e))}e.tab==="nodes"&&(await es(e),await et(e),await Se(e),await za(e)),e.tab==="chat"&&(await sl(e),cn(e,!e.chatHasAutoScrolled)),e.tab==="config"&&(await hr(e),await Se(e)),e.tab==="debug"&&(await Xn(e),e.eventLog=e.eventLogBuffer),e.tab==="logs"&&(e.logsAtBottom=!0,await Ea(e,{reset:!0}),yr(e,!0))}function yu(){if(typeof window>"u")return"";const e=window.__OPENCLAW_CONTROL_UI_BASE_PATH__;return typeof e=="string"&&e.trim()?gn(e):lu(window.location.pathname)}function wu(e){e.theme=e.settings.theme??"system",os(e,Ka(e.theme))}function os(e,t){if(e.themeResolved=t,typeof document>"u")return;const n=document.documentElement;n.dataset.theme=t,n.style.colorScheme=t}function xu(e){if(typeof window>"u"||typeof window.matchMedia!="function")return;if(e.themeMedia=window.matchMedia("(prefers-color-scheme: dark)"),e.themeMediaHandler=n=>{e.theme==="system"&&os(e,n.matches?"dark":"light")},typeof e.themeMedia.addEventListener=="function"){e.themeMedia.addEventListener("change",e.themeMediaHandler);return}e.themeMedia.addListener(e.themeMediaHandler)}function $u(e){if(!e.themeMedia||!e.themeMediaHandler)return;if(typeof e.themeMedia.removeEventListener=="function"){e.themeMedia.removeEventListener("change",e.themeMediaHandler);return}e.themeMedia.removeListener(e.themeMediaHandler),e.themeMedia=null,e.themeMediaHandler=null}function Su(e,t){if(typeof window>"u")return;const n=jr(window.location.pathname,e.basePath)??"chat";Vr(e,n),Qr(e,n,t)}function ku(e){if(typeof window>"u")return;const t=jr(window.location.pathname,e.basePath);if(!t)return;const s=new URL(window.location.href).searchParams.get("session")?.trim();s&&(e.sessionKey=s,yt(e,{...e.settings,sessionKey:s,lastActiveSessionKey:s})),Vr(e,t)}function Vr(e,t){e.tab!==t&&(e.tab=t),t==="chat"&&(e.chatHasAutoScrolled=!1),t==="logs"?La(e):Ia(e),t==="debug"?Da(e):Ra(e),e.connected&&ja(e)}function Qr(e,t,n){if(typeof window>"u")return;const s=on(as(t,e.basePath)),a=on(window.location.pathname),i=new URL(window.location.href);t==="chat"&&e.sessionKey?i.searchParams.set("session",e.sessionKey):i.searchParams.delete("session"),a!==s&&(i.pathname=s),n?window.history.replaceState({},"",i.toString()):window.history.pushState({},"",i.toString())}function Au(e,t,n){if(typeof window>"u")return;const s=new URL(window.location.href);s.searchParams.set("session",t),window.history.replaceState({},"",s.toString())}async function Yr(e){await Promise.all([we(e,!1),Wa(e),xt(e),dn(e),Xn(e)])}async function Cu(e){await Promise.all([we(e,!0),hr(e),Se(e)])}async function zn(e){await Promise.all([we(e,!1),dn(e),ts(e)])}const Jo=50,Tu=80,_u=12e4;function Mu(e){if(!e||typeof e!="object")return null;const t=e;if(typeof t.text=="string")return t.text;const n=t.content;if(!Array.isArray(n))return null;const s=n.map(a=>{if(!a||typeof a!="object")return null;const i=a;return i.type==="text"&&typeof i.text=="string"?i.text:null}).filter(a=>!!a);return s.length===0?null:s.join(`
`)}function Zo(e){if(e==null)return null;if(typeof e=="number"||typeof e=="boolean")return String(e);const t=Mu(e);let n;if(typeof e=="string")n=e;else if(t)n=t;else try{n=JSON.stringify(e,null,2)}catch{n=String(e)}const s=Sr(n,_u);return s.truncated?`${s.text}

… truncated (${s.total} chars, showing first ${s.text.length}).`:s.text}function Eu(e){const t=[];return t.push({type:"toolcall",name:e.name,arguments:e.args??{}}),e.output&&t.push({type:"toolresult",name:e.name,text:e.output}),{role:"assistant",toolCallId:e.toolCallId,runId:e.runId,content:t,timestamp:e.startedAt}}function Lu(e){if(e.toolStreamOrder.length<=Jo)return;const t=e.toolStreamOrder.length-Jo,n=e.toolStreamOrder.splice(0,t);for(const s of n)e.toolStreamById.delete(s)}function Iu(e){e.chatToolMessages=e.toolStreamOrder.map(t=>e.toolStreamById.get(t)?.message).filter(t=>!!t)}function na(e){e.toolStreamSyncTimer!=null&&(clearTimeout(e.toolStreamSyncTimer),e.toolStreamSyncTimer=null),Iu(e)}function Du(e,t=!1){if(t){na(e);return}e.toolStreamSyncTimer==null&&(e.toolStreamSyncTimer=window.setTimeout(()=>na(e),Tu))}function is(e){e.toolStreamById.clear(),e.toolStreamOrder=[],e.chatToolMessages=[],na(e)}const Ru=5e3;function Pu(e,t){const n=t.data??{},s=typeof n.phase=="string"?n.phase:"";e.compactionClearTimer!=null&&(window.clearTimeout(e.compactionClearTimer),e.compactionClearTimer=null),s==="start"?e.compactionStatus={active:!0,startedAt:Date.now(),completedAt:null}:s==="end"&&(e.compactionStatus={active:!1,startedAt:e.compactionStatus?.startedAt??null,completedAt:Date.now()},e.compactionClearTimer=window.setTimeout(()=>{e.compactionStatus=null,e.compactionClearTimer=null},Ru))}function Nu(e,t){if(!t)return;if(t.stream==="compaction"){Pu(e,t);return}if(t.stream!=="tool")return;const n=typeof t.sessionKey=="string"?t.sessionKey:void 0;if(n&&n!==e.sessionKey||!n&&e.chatRunId&&t.runId!==e.chatRunId||e.chatRunId&&t.runId!==e.chatRunId||!e.chatRunId)return;const s=t.data??{},a=typeof s.toolCallId=="string"?s.toolCallId:"";if(!a)return;const i=typeof s.name=="string"?s.name:"tool",r=typeof s.phase=="string"?s.phase:"",c=r==="start"?s.args:void 0,d=r==="update"?Zo(s.partialResult):r==="result"?Zo(s.result):void 0,g=Date.now();let h=e.toolStreamById.get(a);h?(h.name=i,c!==void 0&&(h.args=c),d!==void 0&&(h.output=d||void 0),h.updatedAt=g):(h={toolCallId:a,runId:t.runId,sessionKey:n,name:i,args:c,output:d||void 0,startedAt:typeof t.ts=="number"?t.ts:g,updatedAt:g,message:{}},e.toolStreamById.set(a,h),e.toolStreamOrder.push(a)),h.message=Eu(h),Lu(e),Du(e,r==="result")}const Fu=/^\[([^\]]+)\]\s*/,Ou=["WebChat","WhatsApp","Telegram","Signal","Slack","Discord","iMessage","Teams","Matrix","Zalo","Zalo Personal","BlueBubbles"],_s=new WeakMap,Ms=new WeakMap;function Uu(e){return/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z\b/.test(e)||/\d{4}-\d{2}-\d{2} \d{2}:\d{2}\b/.test(e)?!0:Ou.some(t=>e.startsWith(`${t} `))}function Es(e){const t=e.match(Fu);if(!t)return e;const n=t[1]??"";return Uu(n)?e.slice(t[0].length):e}function sa(e){const t=e,n=typeof t.role=="string"?t.role:"",s=t.content;if(typeof s=="string")return n==="assistant"?Ss(s):Es(s);if(Array.isArray(s)){const a=s.map(i=>{const r=i;return r.type==="text"&&typeof r.text=="string"?r.text:null}).filter(i=>typeof i=="string");if(a.length>0){const i=a.join(`
`);return n==="assistant"?Ss(i):Es(i)}}return typeof t.text=="string"?n==="assistant"?Ss(t.text):Es(t.text):null}function Jr(e){if(!e||typeof e!="object")return sa(e);const t=e;if(_s.has(t))return _s.get(t)??null;const n=sa(e);return _s.set(t,n),n}function Xo(e){const n=e.content,s=[];if(Array.isArray(n))for(const c of n){const d=c;if(d.type==="thinking"&&typeof d.thinking=="string"){const g=d.thinking.trim();g&&s.push(g)}}if(s.length>0)return s.join(`
`);const a=Hu(e);if(!a)return null;const r=[...a.matchAll(/<\s*think(?:ing)?\s*>([\s\S]*?)<\s*\/\s*think(?:ing)?\s*>/gi)].map(c=>(c[1]??"").trim()).filter(Boolean);return r.length>0?r.join(`
`):null}function Bu(e){if(!e||typeof e!="object")return Xo(e);const t=e;if(Ms.has(t))return Ms.get(t)??null;const n=Xo(e);return Ms.set(t,n),n}function Hu(e){const t=e,n=t.content;if(typeof n=="string")return n;if(Array.isArray(n)){const s=n.map(a=>{const i=a;return i.type==="text"&&typeof i.text=="string"?i.text:null}).filter(a=>typeof a=="string");if(s.length>0)return s.join(`
`)}return typeof t.text=="string"?t.text:null}function zu(e){const t=e.trim();if(!t)return"";const n=t.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(s=>`_${s}_`);return n.length?["_Reasoning:_",...n].join(`
`):""}let ei=!1;function ti(e){e[6]=e[6]&15|64,e[8]=e[8]&63|128;let t="";for(let n=0;n<e.length;n++)t+=e[n].toString(16).padStart(2,"0");return`${t.slice(0,8)}-${t.slice(8,12)}-${t.slice(12,16)}-${t.slice(16,20)}-${t.slice(20)}`}function Wu(){const e=new Uint8Array(16),t=Date.now();for(let n=0;n<e.length;n++)e[n]=Math.floor(Math.random()*256);return e[0]^=t&255,e[1]^=t>>>8&255,e[2]^=t>>>16&255,e[3]^=t>>>24&255,e}function Ku(){ei||(ei=!0,console.warn("[uuid] crypto API missing; falling back to weak randomness"))}function qa(e=globalThis.crypto){if(e&&typeof e.randomUUID=="function")return e.randomUUID();if(e&&typeof e.getRandomValues=="function"){const t=new Uint8Array(16);return e.getRandomValues(t),ti(t)}return Ku(),ti(Wu())}async function rn(e){if(!(!e.client||!e.connected)){e.chatLoading=!0,e.lastError=null;try{const t=await e.client.request("chat.history",{sessionKey:e.sessionKey,limit:200});e.chatMessages=Array.isArray(t.messages)?t.messages:[],e.chatThinkingLevel=t.thinkingLevel??null}catch(t){e.lastError=String(t)}finally{e.chatLoading=!1}}}function ju(e){const t=/^data:([^;]+);base64,(.+)$/.exec(e);return t?{mimeType:t[1],content:t[2]}:null}async function qu(e,t,n){if(!e.client||!e.connected)return null;const s=t.trim(),a=n&&n.length>0;if(!s&&!a)return null;const i=Date.now(),r=[];if(s&&r.push({type:"text",text:s}),a)for(const g of n)r.push({type:"image",source:{type:"base64",media_type:g.mimeType,data:g.dataUrl}});e.chatMessages=[...e.chatMessages,{role:"user",content:r,timestamp:i}],e.chatSending=!0,e.lastError=null;const c=qa();e.chatRunId=c,e.chatStream="",e.chatStreamStartedAt=i;const d=a?n.map(g=>{const h=ju(g.dataUrl);return h?{type:"image",mimeType:h.mimeType,content:h.content}:null}).filter(g=>g!==null):void 0;try{return await e.client.request("chat.send",{sessionKey:e.sessionKey,message:s,deliver:!1,idempotencyKey:c,attachments:d}),c}catch(g){const h=String(g);return e.chatRunId=null,e.chatStream=null,e.chatStreamStartedAt=null,e.lastError=h,e.chatMessages=[...e.chatMessages,{role:"assistant",content:[{type:"text",text:"Error: "+h}],timestamp:Date.now()}],null}finally{e.chatSending=!1}}async function Gu(e){if(!e.client||!e.connected)return!1;const t=e.chatRunId;try{return await e.client.request("chat.abort",t?{sessionKey:e.sessionKey,runId:t}:{sessionKey:e.sessionKey}),!0}catch(n){return e.lastError=String(n),!1}}function Vu(e,t){if(!t||t.sessionKey!==e.sessionKey)return null;if(t.runId&&e.chatRunId&&t.runId!==e.chatRunId)return t.state==="final"?"final":null;if(t.state==="delta"){const n=sa(t.message);if(typeof n=="string"){const s=e.chatStream??"";(!s||n.length>=s.length)&&(e.chatStream=n)}}else t.state==="final"||t.state==="aborted"?(e.chatStream=null,e.chatRunId=null,e.chatStreamStartedAt=null):t.state==="error"&&(e.chatStream=null,e.chatRunId=null,e.chatStreamStartedAt=null,e.lastError=t.errorMessage??"chat error");return t.state}const Zr=120;function Xr(e){return e.chatSending||!!e.chatRunId}function Qu(e){const t=e.trim();if(!t)return!1;const n=t.toLowerCase();return n==="/stop"?!0:n==="stop"||n==="esc"||n==="abort"||n==="wait"||n==="exit"}function Yu(e){const t=e.trim();if(!t)return!1;const n=t.toLowerCase();return n==="/new"||n==="/reset"?!0:n.startsWith("/new ")||n.startsWith("/reset ")}async function el(e){e.connected&&(e.chatMessage="",await Gu(e))}function Ju(e,t,n,s){const a=t.trim(),i=!!(n&&n.length>0);!a&&!i||(e.chatQueue=[...e.chatQueue,{id:qa(),text:a,createdAt:Date.now(),attachments:i?n?.map(r=>({...r})):void 0,refreshSessions:s}])}async function tl(e,t,n){is(e);const s=await qu(e,t,n?.attachments),a=!!s;return!a&&n?.previousDraft!=null&&(e.chatMessage=n.previousDraft),!a&&n?.previousAttachments&&(e.chatAttachments=n.previousAttachments),a&&Gr(e,e.sessionKey),a&&n?.restoreDraft&&n.previousDraft?.trim()&&(e.chatMessage=n.previousDraft),a&&n?.restoreAttachments&&n.previousAttachments?.length&&(e.chatAttachments=n.previousAttachments),cn(e),a&&!e.chatRunId&&nl(e),a&&n?.refreshSessions&&s&&e.refreshSessionsAfterChat.add(s),a}async function nl(e){if(!e.connected||Xr(e))return;const[t,...n]=e.chatQueue;if(!t)return;e.chatQueue=n,await tl(e,t.text,{attachments:t.attachments,refreshSessions:t.refreshSessions})||(e.chatQueue=[t,...e.chatQueue])}function Zu(e,t){e.chatQueue=e.chatQueue.filter(n=>n.id!==t)}async function Xu(e,t,n){if(!e.connected)return;const s=e.chatMessage,a=(t??e.chatMessage).trim(),i=e.chatAttachments??[],r=t==null?i:[],c=r.length>0;if(!a&&!c)return;if(Qu(a)){await el(e);return}const d=Yu(a);if(t==null&&(e.chatMessage="",e.chatAttachments=[]),Xr(e)){Ju(e,a,r,d);return}await tl(e,a,{previousDraft:t==null?s:void 0,restoreDraft:!!(t&&n?.restoreDraft),attachments:c?r:void 0,previousAttachments:t==null?i:void 0,restoreAttachments:!!(t&&n?.restoreDraft),refreshSessions:d})}async function sl(e){await Promise.all([rn(e),xt(e,{activeMinutes:Zr}),aa(e)]),cn(e)}const eg=nl;function tg(e){const t=br(e.sessionKey);return t?.agentId?t.agentId:e.hello?.snapshot?.sessionDefaults?.defaultAgentId?.trim()||"main"}function ng(e,t){const n=gn(e),s=encodeURIComponent(t);return n?`${n}/avatar/${s}?meta=1`:`/avatar/${s}?meta=1`}async function aa(e){if(!e.connected){e.chatAvatarUrl=null;return}const t=tg(e);if(!t){e.chatAvatarUrl=null;return}e.chatAvatarUrl=null;const n=ng(e.basePath,t);try{const s=await fetch(n,{method:"GET"});if(!s.ok){e.chatAvatarUrl=null;return}const a=await s.json(),i=typeof a.avatarUrl=="string"?a.avatarUrl.trim():"";e.chatAvatarUrl=i||null}catch{e.chatAvatarUrl=null}}const sg={trace:!0,debug:!0,info:!0,warn:!0,error:!0,fatal:!0},ag={name:"",description:"",agentId:"",enabled:!0,scheduleKind:"every",scheduleAt:"",everyAmount:"30",everyUnit:"minutes",cronExpr:"0 7 * * *",cronTz:"",sessionTarget:"isolated",wakeMode:"now",payloadKind:"agentTurn",payloadText:"",deliveryMode:"announce",deliveryChannel:"last",deliveryTo:"",timeoutSeconds:""},og=50,ig=200,rg="Assistant";function ni(e,t){if(typeof e!="string")return;const n=e.trim();if(n)return n.length<=t?n:n.slice(0,t)}function oa(e){const t=ni(e?.name,og)??rg,n=ni(e?.avatar??void 0,ig)??null;return{agentId:typeof e?.agentId=="string"&&e.agentId.trim()?e.agentId.trim():null,name:t,avatar:n}}function lg(){return oa(typeof window>"u"?{}:{name:window.__OPENCLAW_ASSISTANT_NAME__,avatar:window.__OPENCLAW_ASSISTANT_AVATAR__})}async function al(e,t){if(!e.client||!e.connected)return;const n=e.sessionKey.trim(),s=n?{sessionKey:n}:{};try{const a=await e.client.request("agent.identity.get",s);if(!a)return;const i=oa(a);e.assistantName=i.name,e.assistantAvatar=i.avatar,e.assistantAgentId=i.agentId??null}catch{}}function ia(e){return typeof e=="object"&&e!==null}function cg(e){if(!ia(e))return null;const t=typeof e.id=="string"?e.id.trim():"",n=e.request;if(!t||!ia(n))return null;const s=typeof n.command=="string"?n.command.trim():"";if(!s)return null;const a=typeof e.createdAtMs=="number"?e.createdAtMs:0,i=typeof e.expiresAtMs=="number"?e.expiresAtMs:0;return!a||!i?null:{id:t,request:{command:s,cwd:typeof n.cwd=="string"?n.cwd:null,host:typeof n.host=="string"?n.host:null,security:typeof n.security=="string"?n.security:null,ask:typeof n.ask=="string"?n.ask:null,agentId:typeof n.agentId=="string"?n.agentId:null,resolvedPath:typeof n.resolvedPath=="string"?n.resolvedPath:null,sessionKey:typeof n.sessionKey=="string"?n.sessionKey:null},createdAtMs:a,expiresAtMs:i}}function dg(e){if(!ia(e))return null;const t=typeof e.id=="string"?e.id.trim():"";return t?{id:t,decision:typeof e.decision=="string"?e.decision:null,resolvedBy:typeof e.resolvedBy=="string"?e.resolvedBy:null,ts:typeof e.ts=="number"?e.ts:null}:null}function ol(e){const t=Date.now();return e.filter(n=>n.expiresAtMs>t)}function ug(e,t){const n=ol(e).filter(s=>s.id!==t.id);return n.push(t),n}function si(e,t){return ol(e).filter(n=>n.id!==t)}function gg(e){const t=e.version??(e.nonce?"v2":"v1"),n=e.scopes.join(","),s=e.token??"",a=[t,e.deviceId,e.clientId,e.clientMode,e.role,n,String(e.signedAtMs),s];return t==="v2"&&a.push(e.nonce??""),a.join("|")}const il={WEBCHAT_UI:"webchat-ui",CONTROL_UI:"openclaw-control-ui",WEBCHAT:"webchat",CLI:"cli",GATEWAY_CLIENT:"gateway-client",MACOS_APP:"openclaw-macos",IOS_APP:"openclaw-ios",ANDROID_APP:"openclaw-android",NODE_HOST:"node-host",TEST:"test",FINGERPRINT:"fingerprint",PROBE:"openclaw-probe"},ai=il,ra={WEBCHAT:"webchat",CLI:"cli",UI:"ui",BACKEND:"backend",NODE:"node",PROBE:"probe",TEST:"test"};new Set(Object.values(il));new Set(Object.values(ra));const pg=4008;class mg{constructor(t){this.opts=t,this.ws=null,this.pending=new Map,this.closed=!1,this.lastSeq=null,this.connectNonce=null,this.connectSent=!1,this.connectTimer=null,this.backoffMs=800}start(){this.closed=!1,this.connect()}stop(){this.closed=!0,this.ws?.close(),this.ws=null,this.flushPending(new Error("gateway client stopped"))}get connected(){return this.ws?.readyState===WebSocket.OPEN}connect(){this.closed||(this.ws=new WebSocket(this.opts.url),this.ws.addEventListener("open",()=>this.queueConnect()),this.ws.addEventListener("message",t=>this.handleMessage(String(t.data??""))),this.ws.addEventListener("close",t=>{const n=String(t.reason??"");this.ws=null,this.flushPending(new Error(`gateway closed (${t.code}): ${n}`)),this.opts.onClose?.({code:t.code,reason:n}),this.scheduleReconnect()}),this.ws.addEventListener("error",()=>{}))}scheduleReconnect(){if(this.closed)return;const t=this.backoffMs;this.backoffMs=Math.min(this.backoffMs*1.7,15e3),window.setTimeout(()=>this.connect(),t)}flushPending(t){for(const[,n]of this.pending)n.reject(t);this.pending.clear()}async sendConnect(){if(this.connectSent)return;this.connectSent=!0,this.connectTimer!==null&&(window.clearTimeout(this.connectTimer),this.connectTimer=null);const t=typeof crypto<"u"&&!!crypto.subtle,n=["operator.admin","operator.approvals","operator.pairing"],s="operator";let a=null,i=!1,r=this.opts.token;if(t){a=await Ha();const h=yd({deviceId:a.deviceId,role:s})?.token;r=h??this.opts.token,i=!!(h&&this.opts.token)}const c=r||this.opts.password?{token:r,password:this.opts.password}:void 0;let d;if(t&&a){const h=Date.now(),p=this.connectNonce??void 0,f=gg({deviceId:a.deviceId,clientId:this.opts.clientName??ai.CONTROL_UI,clientMode:this.opts.mode??ra.WEBCHAT,role:s,scopes:n,signedAtMs:h,token:r??null,nonce:p}),u=await Kd(a.privateKey,f);d={id:a.deviceId,publicKey:a.publicKey,signature:u,signedAt:h,nonce:p}}const g={minProtocol:3,maxProtocol:3,client:{id:this.opts.clientName??ai.CONTROL_UI,version:this.opts.clientVersion??"dev",platform:this.opts.platform??navigator.platform??"web",mode:this.opts.mode??ra.WEBCHAT,instanceId:this.opts.instanceId},role:s,scopes:n,device:d,caps:[],auth:c,userAgent:navigator.userAgent,locale:navigator.language};this.request("connect",g).then(h=>{h?.auth?.deviceToken&&a&&Tr({deviceId:a.deviceId,role:h.auth.role??s,token:h.auth.deviceToken,scopes:h.auth.scopes??[]}),this.backoffMs=800,this.opts.onHello?.(h)}).catch(()=>{i&&a&&_r({deviceId:a.deviceId,role:s}),this.ws?.close(pg,"connect failed")})}handleMessage(t){let n;try{n=JSON.parse(t)}catch{return}const s=n;if(s.type==="event"){const a=n;if(a.event==="connect.challenge"){const r=a.payload,c=r&&typeof r.nonce=="string"?r.nonce:null;c&&(this.connectNonce=c,this.sendConnect());return}const i=typeof a.seq=="number"?a.seq:null;i!==null&&(this.lastSeq!==null&&i>this.lastSeq+1&&this.opts.onGap?.({expected:this.lastSeq+1,received:i}),this.lastSeq=i);try{this.opts.onEvent?.(a)}catch(r){console.error("[gateway] event handler error:",r)}return}if(s.type==="res"){const a=n,i=this.pending.get(a.id);if(!i)return;this.pending.delete(a.id),a.ok?i.resolve(a.payload):i.reject(new Error(a.error?.message??"request failed"));return}}request(t,n){if(!this.ws||this.ws.readyState!==WebSocket.OPEN)return Promise.reject(new Error("gateway not connected"));const s=qa(),a={type:"req",id:s,method:t,params:n},i=new Promise((r,c)=>{this.pending.set(s,{resolve:d=>r(d),reject:c})});return this.ws.send(JSON.stringify(a)),i}queueConnect(){this.connectNonce=null,this.connectSent=!1,this.connectTimer!==null&&window.clearTimeout(this.connectTimer),this.connectTimer=window.setTimeout(()=>{this.sendConnect()},750)}}function Ls(e,t){const n=(e??"").trim(),s=t.mainSessionKey?.trim();if(!s)return n;if(!n)return s;const a=t.mainKey?.trim()||"main",i=t.defaultAgentId?.trim();return n==="main"||n===a||i&&(n===`agent:${i}:main`||n===`agent:${i}:${a}`)?s:n}function hg(e,t){if(!t?.mainSessionKey)return;const n=Ls(e.sessionKey,t),s=Ls(e.settings.sessionKey,t),a=Ls(e.settings.lastActiveSessionKey,t),i=n||s||e.sessionKey,r={...e.settings,sessionKey:s||i,lastActiveSessionKey:a||i},c=r.sessionKey!==e.settings.sessionKey||r.lastActiveSessionKey!==e.settings.lastActiveSessionKey;i!==e.sessionKey&&(e.sessionKey=i),c&&yt(e,r)}function rl(e){e.lastError=null,e.hello=null,e.connected=!1,e.execApprovalQueue=[],e.execApprovalError=null,e.client?.stop(),e.client=new mg({url:e.settings.gatewayUrl,token:e.settings.token.trim()?e.settings.token:void 0,password:e.password.trim()?e.password:void 0,clientName:"openclaw-control-ui",mode:"webchat",onHello:t=>{e.connected=!0,e.lastError=null,e.hello=t,bg(e,t),e.chatRunId=null,e.chatStream=null,e.chatStreamStartedAt=null,is(e),al(e),Pa(e),es(e,{quiet:!0}),et(e,{quiet:!0}),ja(e)},onClose:({code:t,reason:n})=>{e.connected=!1,t!==1012&&(e.lastError=`disconnected (${t}): ${n||"no reason"}`)},onEvent:t=>fg(e,t),onGap:({expected:t,received:n})=>{e.lastError=`event gap detected (expected seq ${t}, got ${n}); refresh recommended`}}),e.client.start()}function fg(e,t){try{vg(e,t)}catch(n){console.error("[gateway] handleGatewayEvent error:",t.event,n)}}function vg(e,t){if(e.eventLogBuffer=[{ts:Date.now(),event:t.event,payload:t.payload},...e.eventLogBuffer].slice(0,250),e.tab==="debug"&&(e.eventLog=e.eventLogBuffer),t.event==="agent"){if(e.onboarding)return;Nu(e,t.payload);return}if(t.event==="chat"){const n=t.payload;n?.sessionKey&&Gr(e,n.sessionKey);const s=Vu(e,n);if(s==="final"||s==="error"||s==="aborted"){is(e),eg(e);const a=n?.runId;a&&e.refreshSessionsAfterChat.has(a)&&(e.refreshSessionsAfterChat.delete(a),s==="final"&&xt(e,{activeMinutes:Zr}))}s==="final"&&rn(e);return}if(t.event==="presence"){const n=t.payload;n?.presence&&Array.isArray(n.presence)&&(e.presenceEntries=n.presence,e.presenceError=null,e.presenceStatus=null);return}if(t.event==="cron"&&e.tab==="cron"&&zn(e),(t.event==="device.pair.requested"||t.event==="device.pair.resolved")&&et(e,{quiet:!0}),t.event==="exec.approval.requested"){const n=cg(t.payload);if(n){e.execApprovalQueue=ug(e.execApprovalQueue,n),e.execApprovalError=null;const s=Math.max(0,n.expiresAtMs-Date.now()+500);window.setTimeout(()=>{e.execApprovalQueue=si(e.execApprovalQueue,n.id)},s)}return}if(t.event==="exec.approval.resolved"){const n=dg(t.payload);n&&(e.execApprovalQueue=si(e.execApprovalQueue,n.id))}}function bg(e,t){const n=t.snapshot;n?.presence&&Array.isArray(n.presence)&&(e.presenceEntries=n.presence),n?.health&&(e.debugHealth=n.health),n?.sessionDefaults&&hg(e,n.sessionDefaults)}function yg(e){e.basePath=yu(),fu(e),Su(e,!0),wu(e),xu(e),window.addEventListener("popstate",e.popStateHandler),rl(e),rd(e),e.tab==="logs"&&La(e),e.tab==="debug"&&Da(e)}function wg(e){ed(e)}function xg(e){window.removeEventListener("popstate",e.popStateHandler),ld(e),Ia(e),Ra(e),$u(e),e.topbarObserver?.disconnect(),e.topbarObserver=null}function $g(e,t){if(e.tab==="chat"&&(t.has("chatMessages")||t.has("chatToolMessages")||t.has("chatStream")||t.has("chatLoading")||t.has("tab"))){const n=t.has("tab"),s=t.has("chatLoading")&&t.get("chatLoading")===!0&&!e.chatLoading;cn(e,n||s||!e.chatHasAutoScrolled)}e.tab==="logs"&&(t.has("logsEntries")||t.has("logsAutoFollow")||t.has("tab"))&&e.logsAutoFollow&&e.logsAtBottom&&yr(e,t.has("tab")||t.has("logsAutoFollow"))}const Ga={CHILD:2},Va=e=>(...t)=>({_$litDirective$:e,values:t});let Qa=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,n,s){this._$Ct=t,this._$AM=n,this._$Ci=s}_$AS(t,n){return this.update(t,n)}update(t,n){return this.render(...n)}};const{I:Sg}=yc,oi=e=>e,kg=e=>e.strings===void 0,ii=()=>document.createComment(""),Bt=(e,t,n)=>{const s=e._$AA.parentNode,a=t===void 0?e._$AB:t._$AA;if(n===void 0){const i=s.insertBefore(ii(),a),r=s.insertBefore(ii(),a);n=new Sg(i,r,e,e.options)}else{const i=n._$AB.nextSibling,r=n._$AM,c=r!==e;if(c){let d;n._$AQ?.(e),n._$AM=e,n._$AP!==void 0&&(d=e._$AU)!==r._$AU&&n._$AP(d)}if(i!==a||c){let d=n._$AA;for(;d!==i;){const g=oi(d).nextSibling;oi(s).insertBefore(d,a),d=g}}}return n},ot=(e,t,n=e)=>(e._$AI(t,n),e),Ag={},Cg=(e,t=Ag)=>e._$AH=t,Tg=e=>e._$AH,Is=e=>{e._$AR(),e._$AA.remove()};const ri=(e,t,n)=>{const s=new Map;for(let a=t;a<=n;a++)s.set(e[a],a);return s},ll=Va(class extends Qa{constructor(e){if(super(e),e.type!==Ga.CHILD)throw Error("repeat() can only be used in text expressions")}dt(e,t,n){let s;n===void 0?n=t:t!==void 0&&(s=t);const a=[],i=[];let r=0;for(const c of e)a[r]=s?s(c,r):r,i[r]=n(c,r),r++;return{values:i,keys:a}}render(e,t,n){return this.dt(e,t,n).values}update(e,[t,n,s]){const a=Tg(e),{values:i,keys:r}=this.dt(t,n,s);if(!Array.isArray(a))return this.ut=r,i;const c=this.ut??=[],d=[];let g,h,p=0,f=a.length-1,u=0,m=i.length-1;for(;p<=f&&u<=m;)if(a[p]===null)p++;else if(a[f]===null)f--;else if(c[p]===r[u])d[u]=ot(a[p],i[u]),p++,u++;else if(c[f]===r[m])d[m]=ot(a[f],i[m]),f--,m--;else if(c[p]===r[m])d[m]=ot(a[p],i[m]),Bt(e,d[m+1],a[p]),p++,m--;else if(c[f]===r[u])d[u]=ot(a[f],i[u]),Bt(e,a[p],a[f]),f--,u++;else if(g===void 0&&(g=ri(r,u,m),h=ri(c,p,f)),g.has(c[p]))if(g.has(c[f])){const b=h.get(r[u]),x=b!==void 0?a[b]:null;if(x===null){const A=Bt(e,a[p]);ot(A,i[u]),d[u]=A}else d[u]=ot(x,i[u]),Bt(e,a[p],x),a[b]=null;u++}else Is(a[f]),f--;else Is(a[p]),p++;for(;u<=m;){const b=Bt(e,d[m+1]);ot(b,i[u]),d[u++]=b}for(;p<=f;){const b=a[p++];b!==null&&Is(b)}return this.ut=r,Cg(e,d),Ze}}),ce={messageSquare:l`
    <svg viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  `,barChart:l`
    <svg viewBox="0 0 24 24">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  `,link:l`
    <svg viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  `,radio:l`
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="2" />
      <path
        d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"
      />
    </svg>
  `,fileText:l`
    <svg viewBox="0 0 24 24">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  `,zap:l`
    <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
  `,monitor:l`
    <svg viewBox="0 0 24 24">
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  `,settings:l`
    <svg viewBox="0 0 24 24">
      <path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  `,bug:l`
    <svg viewBox="0 0 24 24">
      <path d="m8 2 1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H2" />
      <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
      <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
      <path d="M22 13h-4" />
      <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </svg>
  `,scrollText:l`
    <svg viewBox="0 0 24 24">
      <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M15 8h-5" />
      <path d="M15 12h-5" />
    </svg>
  `,folder:l`
    <svg viewBox="0 0 24 24">
      <path
        d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      />
    </svg>
  `,menu:l`
    <svg viewBox="0 0 24 24">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  `,x:l`
    <svg viewBox="0 0 24 24">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  `,check:l`
    <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
  `,arrowDown:l`
    <svg viewBox="0 0 24 24">
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  `,copy:l`
    <svg viewBox="0 0 24 24">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  `,search:l`
    <svg viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  `,brain:l`
    <svg viewBox="0 0 24 24">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  `,book:l`
    <svg viewBox="0 0 24 24">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  `,loader:l`
    <svg viewBox="0 0 24 24">
      <path d="M12 2v4" />
      <path d="m16.2 7.8 2.9-2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 16.2 2.9 2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>
  `,wrench:l`
    <svg viewBox="0 0 24 24">
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      />
    </svg>
  `,fileCode:l`
    <svg viewBox="0 0 24 24">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m10 13-2 2 2 2" />
      <path d="m14 17 2-2-2-2" />
    </svg>
  `,edit:l`
    <svg viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  `,penLine:l`
    <svg viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  `,paperclip:l`
    <svg viewBox="0 0 24 24">
      <path
        d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"
      />
    </svg>
  `,globe:l`
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  `,image:l`
    <svg viewBox="0 0 24 24">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  `,smartphone:l`
    <svg viewBox="0 0 24 24">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  `,plug:l`
    <svg viewBox="0 0 24 24">
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </svg>
  `,circle:l`
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
  `,puzzle:l`
    <svg viewBox="0 0 24 24">
      <path
        d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.076.874.54 1.02 1.02a2.5 2.5 0 1 0 3.237-3.237c-.48-.146-.944-.505-1.02-1.02a.98.98 0 0 1 .303-.917l1.526-1.526A2.402 2.402 0 0 1 11.998 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.236 3.236c-.464.18-.894.527-.967 1.02Z"
      />
    </svg>
  `};function _g(e,t){const n=as(t,e.basePath);return l`
    <a
      href=${n}
      class="nav-item ${e.tab===t?"active":""}"
      @click=${s=>{s.defaultPrevented||s.button!==0||s.metaKey||s.ctrlKey||s.shiftKey||s.altKey||(s.preventDefault(),e.setTab(t))}}
      title=${ta(t)}
    >
      <span class="nav-item__icon" aria-hidden="true">${ce[cu(t)]}</span>
      <span class="nav-item__text">${ta(t)}</span>
    </a>
  `}function Mg(e){const t=Eg(e.hello,e.sessionsResult),n=Lg(e.sessionKey,e.sessionsResult,t),s=e.onboarding,a=e.onboarding,i=e.onboarding?!1:e.settings.chatShowThinking,r=e.onboarding?!0:e.settings.chatFocusMode,c=l`
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
      <path d="M21 3v5h-5"></path>
    </svg>
  `,d=l`
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M4 7V4h3"></path>
      <path d="M20 7V4h-3"></path>
      <path d="M4 17v3h3"></path>
      <path d="M20 17v3h-3"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;return l`
    <div class="chat-controls">
      <label class="field chat-controls__session">
        <select
          .value=${e.sessionKey}
          ?disabled=${!e.connected}
          @change=${g=>{const h=g.target.value;e.sessionKey=h,e.chatMessage="",e.chatStream=null,e.chatStreamStartedAt=null,e.chatRunId=null,e.resetToolStream(),e.resetChatScroll(),e.applySettings({...e.settings,sessionKey:h,lastActiveSessionKey:h}),e.loadAssistantIdentity(),Au(e,h),rn(e)}}
        >
          ${ll(n,g=>g.key,g=>l`<option value=${g.key}>
                ${g.displayName??g.key}
              </option>`)}
        </select>
      </label>
      <button
        class="btn btn--sm btn--icon"
        ?disabled=${e.chatLoading||!e.connected}
        @click=${()=>{e.resetToolStream(),sl(e)}}
        title="Refresh chat data"
      >
        ${c}
      </button>
      <span class="chat-controls__separator">|</span>
      <button
        class="btn btn--sm btn--icon ${i?"active":""}"
        ?disabled=${s}
        @click=${()=>{s||e.applySettings({...e.settings,chatShowThinking:!e.settings.chatShowThinking})}}
        aria-pressed=${i}
        title=${s?"Disabled during onboarding":"Toggle assistant thinking/working output"}
      >
        ${ce.brain}
      </button>
      <button
        class="btn btn--sm btn--icon ${r?"active":""}"
        ?disabled=${a}
        @click=${()=>{a||e.applySettings({...e.settings,chatFocusMode:!e.settings.chatFocusMode})}}
        aria-pressed=${r}
        title=${a?"Disabled during onboarding":"Toggle focus mode (hide sidebar + page header)"}
      >
        ${d}
      </button>
    </div>
  `}function Eg(e,t){const n=e?.snapshot,s=n?.sessionDefaults?.mainSessionKey?.trim();if(s)return s;const a=n?.sessionDefaults?.mainKey?.trim();return a||(t?.sessions?.some(i=>i.key==="main")?"main":null)}function Ds(e,t){const n=t?.label?.trim()||"",s=t?.displayName?.trim()||"";return n&&n!==e?`${n} (${e})`:s&&s!==e?`${e} (${s})`:e}function Lg(e,t,n){const s=new Set,a=[],i=n&&t?.sessions?.find(c=>c.key===n),r=t?.sessions?.find(c=>c.key===e);if(n&&(s.add(n),a.push({key:n,displayName:Ds(n,i||void 0)})),s.has(e)||(s.add(e),a.push({key:e,displayName:Ds(e,r)})),t?.sessions)for(const c of t.sessions)s.has(c.key)||(s.add(c.key),a.push({key:c.key,displayName:Ds(c.key,c)}));return a}const Ig=["system","light","dark"];function Dg(e){const t=Math.max(0,Ig.indexOf(e.theme)),n=s=>a=>{const r={element:a.currentTarget};(a.clientX||a.clientY)&&(r.pointerClientX=a.clientX,r.pointerClientY=a.clientY),e.setTheme(s,r)};return l`
    <div class="theme-toggle" style="--theme-index: ${t};">
      <div class="theme-toggle__track" role="group" aria-label="Theme">
        <span class="theme-toggle__indicator"></span>
        <button
          class="theme-toggle__button ${e.theme==="system"?"active":""}"
          @click=${n("system")}
          aria-pressed=${e.theme==="system"}
          aria-label="System theme"
          title="System"
        >
          ${Ng()}
        </button>
        <button
          class="theme-toggle__button ${e.theme==="light"?"active":""}"
          @click=${n("light")}
          aria-pressed=${e.theme==="light"}
          aria-label="Light theme"
          title="Light"
        >
          ${Rg()}
        </button>
        <button
          class="theme-toggle__button ${e.theme==="dark"?"active":""}"
          @click=${n("dark")}
          aria-pressed=${e.theme==="dark"}
          aria-label="Dark theme"
          title="Dark"
        >
          ${Pg()}
        </button>
      </div>
    </div>
  `}function Rg(){return l`
    <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2"></path>
      <path d="M12 20v2"></path>
      <path d="m4.93 4.93 1.41 1.41"></path>
      <path d="m17.66 17.66 1.41 1.41"></path>
      <path d="M2 12h2"></path>
      <path d="M20 12h2"></path>
      <path d="m6.34 17.66-1.41 1.41"></path>
      <path d="m19.07 4.93-1.41 1.41"></path>
    </svg>
  `}function Pg(){return l`
    <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
      ></path>
    </svg>
  `}function Ng(){return l`
    <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="20" height="14" x="2" y="3" rx="2"></rect>
      <line x1="8" x2="16" y1="21" y2="21"></line>
      <line x1="12" x2="12" y1="17" y2="21"></line>
    </svg>
  `}function cl(e,t){if(!e)return e;const s=e.files.some(a=>a.name===t.name)?e.files.map(a=>a.name===t.name?t:a):[...e.files,t];return{...e,files:s}}async function Rs(e,t){if(!(!e.client||!e.connected||e.agentFilesLoading)){e.agentFilesLoading=!0,e.agentFilesError=null;try{const n=await e.client.request("agents.files.list",{agentId:t});n&&(e.agentFilesList=n,e.agentFileActive&&!n.files.some(s=>s.name===e.agentFileActive)&&(e.agentFileActive=null))}catch(n){e.agentFilesError=String(n)}finally{e.agentFilesLoading=!1}}}async function Fg(e,t,n,s){if(!(!e.client||!e.connected||e.agentFilesLoading)&&!Object.hasOwn(e.agentFileContents,n)){e.agentFilesLoading=!0,e.agentFilesError=null;try{const a=await e.client.request("agents.files.get",{agentId:t,name:n});if(a?.file){const i=a.file.content??"",r=e.agentFileContents[n]??"",c=e.agentFileDrafts[n],d=s?.preserveDraft??!0;e.agentFilesList=cl(e.agentFilesList,a.file),e.agentFileContents={...e.agentFileContents,[n]:i},(!d||!Object.hasOwn(e.agentFileDrafts,n)||c===r)&&(e.agentFileDrafts={...e.agentFileDrafts,[n]:i})}}catch(a){e.agentFilesError=String(a)}finally{e.agentFilesLoading=!1}}}async function Og(e,t,n,s){if(!(!e.client||!e.connected||e.agentFileSaving)){e.agentFileSaving=!0,e.agentFilesError=null;try{const a=await e.client.request("agents.files.set",{agentId:t,name:n,content:s});a?.file&&(e.agentFilesList=cl(e.agentFilesList,a.file),e.agentFileContents={...e.agentFileContents,[n]:s},e.agentFileDrafts={...e.agentFileDrafts,[n]:s})}catch(a){e.agentFilesError=String(a)}finally{e.agentFileSaving=!1}}}async function dl(e,t){if(!(!e.client||!e.connected)&&!e.usageLoading){e.usageLoading=!0,e.usageError=null;try{const n=t?.startDate??e.usageStartDate,s=t?.endDate??e.usageEndDate,[a,i]=await Promise.all([e.client.request("sessions.usage",{startDate:n,endDate:s,limit:1e3,includeContextWeight:!0}),e.client.request("usage.cost",{startDate:n,endDate:s})]);a&&(e.usageResult=a),i&&(e.usageCostSummary=i)}catch(n){e.usageError=String(n)}finally{e.usageLoading=!1}}}async function Ug(e,t){if(!(!e.client||!e.connected)&&!e.usageTimeSeriesLoading){e.usageTimeSeriesLoading=!0,e.usageTimeSeries=null;try{const n=await e.client.request("sessions.usage.timeseries",{key:t});n&&(e.usageTimeSeries=n)}catch{e.usageTimeSeries=null}finally{e.usageTimeSeriesLoading=!1}}}async function Bg(e,t){if(!(!e.client||!e.connected)&&!e.usageSessionLogsLoading){e.usageSessionLogsLoading=!0,e.usageSessionLogs=null;try{const n=await e.client.request("sessions.usage.logs",{key:t,limit:500});n&&Array.isArray(n.logs)&&(e.usageSessionLogs=n.logs)}catch{e.usageSessionLogs=null}finally{e.usageSessionLogsLoading=!1}}}function Hg(){return l`
    <div class="agent-swarm">
      <div class="agent-swarm__mock">
        <aside class="agent-swarm__sidebar">
          <div class="agent-swarm__workspace">Workspace</div>
          <div class="agent-swarm__tree">
            <div class="agent-swarm__tree-node agent-swarm__tree-node--parent">
              <div class="agent-swarm__tree-node__header agent-swarm__tree-node__header--assistant">
                <span class="agent-swarm__tree-node__name">Assistant</span>
                <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--idle">IDLE</span>
              </div>
              <div class="agent-swarm__tree-children">
                <div class="agent-swarm__tree-node agent-swarm__tree-node--parent agent-swarm__tree-node--active">
                  <div class="agent-swarm__tree-node__header">
                    <span class="agent-swarm__tree-node__name">SRE高级运维工程师</span>
                    <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--busy">BUSY</span>
                  </div>
                  <div class="agent-swarm__tree-children">
                    <div class="agent-swarm__tree-node agent-swarm__tree-node--leaf">
                      <span class="agent-swarm__tree-node__name">日志采集 Agent</span>
                      <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--idle">IDLE</span>
                    </div>
                    <div class="agent-swarm__tree-node agent-swarm__tree-node--leaf">
                      <span class="agent-swarm__tree-node__name">指标采集 Agent</span>
                      <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--busy">BUSY</span>
                    </div>
                  </div>
                  <div class="agent-swarm__context">
                    <div class="agent-swarm__context-bar" style="width: 62%"></div>
                    <span class="agent-swarm__context-text">152,589 / 256,000 token</span>
                  </div>
                </div>
                <div class="agent-swarm__tree-node agent-swarm__tree-node--parent">
                  <div class="agent-swarm__tree-node__header">
                    <span class="agent-swarm__tree-node__name">故障分析工程师</span>
                    <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--busy">BUSY</span>
                  </div>
                  <div class="agent-swarm__tree-children">
                    <div class="agent-swarm__tree-node agent-swarm__tree-node--leaf">
                      <span class="agent-swarm__tree-node__name">根因分析 Agent</span>
                      <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--busy">BUSY</span>
                    </div>
                  </div>
                  <div class="agent-swarm__context">
                    <div class="agent-swarm__context-bar" style="width: 45%"></div>
                    <span class="agent-swarm__context-text">98,200 / 256,000 token</span>
                  </div>
                </div>
                <div class="agent-swarm__tree-node agent-swarm__tree-node--leaf">
                  <span class="agent-swarm__tree-node__name">安全分析工程师</span>
                  <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--idle">IDLE</span>
                </div>
                <div class="agent-swarm__tree-node agent-swarm__tree-node--leaf">
                  <span class="agent-swarm__tree-node__name">网络分析工程师</span>
                  <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--idle">IDLE</span>
                </div>
                <div class="agent-swarm__tree-node agent-swarm__tree-node--leaf">
                  <span class="agent-swarm__tree-node__name">云原生运维工程师</span>
                  <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--busy">BUSY</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main class="agent-swarm__main">
          <div class="agent-swarm__docs">
            <div class="agent-swarm__section-title">故障处理文档</div>
            <ul class="agent-swarm__doc-list">
              <li class="agent-swarm__doc agent-swarm__doc--done">INCIDENT-2024-0218_timeline.md ✓</li>
              <li class="agent-swarm__doc agent-swarm__doc--done">pod-api-gateway-7d8f9_logs.md ✓</li>
              <li class="agent-swarm__doc agent-swarm__doc--done">root_cause_analysis.md ✓</li>
              <li class="agent-swarm__doc agent-swarm__doc--done">rollback_verification.md ✓</li>
            </ul>
          </div>
          <div class="agent-swarm__actions">
            <div class="agent-swarm__section-title">下一步行动</div>
            <ol class="agent-swarm__action-list">
              <li>云原生运维: 执行 deployment 回滚至 v1.2.3</li>
              <li>故障分析: 输出最终根因报告并归档</li>
              <li>SRE: 更新 runbook 与告警规则</li>
              <li>安全/网络: 待命，如有异常立即介入</li>
            </ol>
            <div class="agent-swarm__status agent-swarm__status--ok">
              根因已定位，回滚方案已确认，执行中 🚀
            </div>
          </div>
          <div class="agent-swarm__viz">
            <div class="agent-swarm__graph">
              <div class="agent-swarm__graph-controls">
                <span class="agent-swarm__graph-zoom">缩放 70%</span>
                <button class="agent-swarm__graph-btn" disabled>+</button>
                <button class="agent-swarm__graph-btn" disabled>-</button>
                <button class="agent-swarm__graph-btn" disabled>Reset</button>
                <span class="agent-swarm__graph-hint">Ctrl/⌘ + 滚轮缩放</span>
              </div>
              <div class="agent-swarm__graph-canvas">
                <svg class="agent-swarm__graph-svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
                  <path class="agent-swarm__graph-line" d="M 40 60 L 200 60" />
                  <path class="agent-swarm__graph-line" d="M 200 60 L 200 92" />
                  <path class="agent-swarm__graph-line" d="M 40 92 L 360 92" />
                  <path class="agent-swarm__graph-line" d="M 40 92 L 40 155" />
                  <path class="agent-swarm__graph-line" d="M 120 92 L 120 155" />
                  <path class="agent-swarm__graph-line" d="M 200 92 L 200 155" />
                  <path class="agent-swarm__graph-line" d="M 280 92 L 280 155" />
                  <path class="agent-swarm__graph-line" d="M 360 92 L 360 155" />
                </svg>
                <div class="agent-swarm__graph-nodes">
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--human" style="left: 10%; top: 30%;">
                    <div class="agent-swarm__graph-node__circle agent-swarm__graph-node__circle--human"></div>
                    <div class="agent-swarm__graph-node__label">human</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--idle">IDLE</div>
                  </div>
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--assistant" style="left: 50%; top: 30%;">
                    <div class="agent-swarm__graph-node__circle agent-swarm__graph-node__circle--assistant"></div>
                    <div class="agent-swarm__graph-node__label">assistant</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--idle">IDLE</div>
                  </div>
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--child agent-swarm__graph-node--busy" style="left: 10%; top: 78%;">
                    <div class="agent-swarm__graph-node__circle"></div>
                    <div class="agent-swarm__graph-node__label">SRE高级运维</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--busy">BUSY</div>
                  </div>
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--child agent-swarm__graph-node--busy" style="left: 30%; top: 78%;">
                    <div class="agent-swarm__graph-node__circle"></div>
                    <div class="agent-swarm__graph-node__label">故障分析</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--busy">BUSY</div>
                  </div>
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--child agent-swarm__graph-node--idle" style="left: 50%; top: 78%;">
                    <div class="agent-swarm__graph-node__circle"></div>
                    <div class="agent-swarm__graph-node__label">安全分析</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--idle">IDLE</div>
                  </div>
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--child agent-swarm__graph-node--idle" style="left: 70%; top: 78%;">
                    <div class="agent-swarm__graph-node__circle"></div>
                    <div class="agent-swarm__graph-node__label">网络分析</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--idle">IDLE</div>
                  </div>
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--child agent-swarm__graph-node--busy" style="left: 90%; top: 78%;">
                    <div class="agent-swarm__graph-node__circle"></div>
                    <div class="agent-swarm__graph-node__label">云原生运维</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--busy">BUSY</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="agent-swarm__events">
              <div class="agent-swarm__section-title">事件流</div>
              <div class="agent-swarm__event agent-swarm__event--ok">16:05:22 故障已解决，服务恢复</div>
              <div class="agent-swarm__event agent-swarm__event--ok">16:04:58 回滚验证通过，健康检查 OK</div>
              <div class="agent-swarm__event">16:04:15 云原生运维: 执行 kubectl rollout undo</div>
              <div class="agent-swarm__event">16:03:40 故障分析: 根因报告已输出</div>
              <div class="agent-swarm__event">16:02:18 SRE: 定位到 api-gateway OOM，建议回滚</div>
              <div class="agent-swarm__event">16:01:45 故障分析: 解析 pod 日志完成</div>
              <div class="agent-swarm__event">16:00:30 SRE: 采集 api-gateway-7d8f9 日志</div>
              <div class="agent-swarm__event">15:59:12 告警触发: api-gateway pod CrashLoopBackOff</div>
              <div class="agent-swarm__event">15:58:50 监控: 收到 P1 告警 INCIDENT-2024-0218</div>
            </div>
          </div>
        </main>

        <aside class="agent-swarm__detail">
          <div class="agent-swarm__section-title">Agent Details</div>
          <div class="agent-swarm__stream-from">Streaming from: 故障分析工程师 (a7f2c1-...)</div>
          <div class="agent-swarm__llm">
            <span class="agent-swarm__llm-tag">SYSTEM</span>
            #1 - You are a fault analysis agent. Analyze logs, identify root cause, output report.
          </div>
          <div class="agent-swarm__realtime">
            <div class="agent-swarm__realtime-title">Realtime reasoning</div>
            <div class="agent-swarm__realtime-item">
              收到 SRE 采集的 api-gateway 日志，开始解析 OOM 相关堆栈与内存指标...
            </div>
            <div class="agent-swarm__realtime-title">Realtime content</div>
            <div class="agent-swarm__realtime-item agent-swarm__realtime-item--ok">
              root_cause_analysis.md 已生成 ✓
            </div>
            <div class="agent-swarm__realtime-item agent-swarm__realtime-item--ok">
              根因: 内存泄漏，建议回滚至 v1.2.3 ✓
            </div>
            <div class="agent-swarm__realtime-title">Realtime tools</div>
            <div class="agent-swarm__realtime-item agent-swarm__realtime-item--mono">
              tool_result [parse-logs]: {"oom": true, "heap": "512Mi/512Mi"}
            </div>
            <div class="agent-swarm__realtime-item agent-swarm__realtime-item--mono">
              tool_result [kubectl-get-pod]: api-gateway-7d8f9 CrashLoopBackOff
            </div>
          </div>
        </aside>
      </div>

      <div class="agent-swarm__input-bar">
        <input
          class="agent-swarm__input"
          type="text"
          placeholder="Type a message... (Ctrl/Cmd+Enter to send)"
          disabled
        />
        <button class="agent-swarm__send-btn" disabled>Send</button>
      </div>

      <div class="agent-swarm__overlay">
        <div class="agent-swarm__badge">${o("agentSwarmDevBadge")}</div>
      </div>
    </div>
  `}const zg={bash:"exec","apply-patch":"apply_patch"},Wg={"group:memory":["memory_search","memory_get"],"group:web":["web_search","web_fetch"],"group:fs":["read","write","edit","apply_patch"],"group:runtime":["exec","process"],"group:sessions":["sessions_list","sessions_history","sessions_send","sessions_spawn","session_status"],"group:ui":["browser","canvas"],"group:automation":["cron","gateway"],"group:messaging":["message"],"group:nodes":["nodes"],"group:openclaw":["browser","canvas","nodes","cron","message","gateway","agents_list","sessions_list","sessions_history","sessions_send","sessions_spawn","session_status","memory_search","memory_get","web_search","web_fetch","image"]},Kg={minimal:{allow:["session_status"]},coding:{allow:["group:fs","group:runtime","group:sessions","group:memory","image"]},messaging:{allow:["group:messaging","sessions_list","sessions_history","sessions_send","session_status"]},full:{}};function Pe(e){const t=e.trim().toLowerCase();return zg[t]??t}function jg(e){return e?e.map(Pe).filter(Boolean):[]}function qg(e){const t=jg(e),n=[];for(const s of t){const a=Wg[s];if(a){n.push(...a);continue}n.push(s)}return Array.from(new Set(n))}function Gg(e){if(!e)return;const t=Kg[e];if(t&&!(!t.allow&&!t.deny))return{allow:t.allow?[...t.allow]:void 0,deny:t.deny?[...t.deny]:void 0}}function Vg(e){const t=e.host??"unknown",n=e.ip?`(${e.ip})`:"",s=e.mode??"",a=e.version??"";return`${t} ${n} ${s} ${a}`.trim()}function Qg(e){const t=e.ts??null;return t?Q(t):"n/a"}function Ya(e){return e?`${ft(e)} (${Q(e)})`:"n/a"}function Yg(e){if(e.totalTokens==null)return"n/a";const t=e.totalTokens??0,n=e.contextTokens??0;return n?`${t} / ${n}`:String(t)}function Jg(e){if(e==null)return"";try{return JSON.stringify(e,null,2)}catch{return String(e)}}function Zg(e){const t=e.state??{},n=t.nextRunAtMs?ft(t.nextRunAtMs):"n/a",s=t.lastRunAtMs?ft(t.lastRunAtMs):"n/a";return`${t.lastStatus??"n/a"} · next ${n} · last ${s}`}function ul(e){const t=e.schedule;if(t.kind==="at"){const n=Date.parse(t.at);return Number.isFinite(n)?`At ${ft(n)}`:`At ${t.at}`}return t.kind==="every"?`Every ${$r(t.everyMs)}`:`Cron ${t.expr}${t.tz?` (${t.tz})`:""}`}function Xg(e){const t=e.payload;if(t.kind==="systemEvent")return`System: ${t.text}`;const n=`Agent: ${t.message}`,s=e.delivery;if(s&&s.mode!=="none"){const a=s.channel||s.to?` (${s.channel??"last"}${s.to?` -> ${s.to}`:""})`:"";return`${n} · ${s.mode}${a}`}return n}function li(){return[{id:"fs",label:o("agentsFiles"),tools:[{id:"read",label:"read",description:o("agentsReadFile")},{id:"write",label:"write",description:o("agentsWriteFile")},{id:"edit",label:"edit",description:o("agentsEdit")},{id:"apply_patch",label:"apply_patch",description:o("agentsApplyPatch")}]},{id:"runtime",label:o("agentsRuntime"),tools:[{id:"exec",label:"exec",description:o("agentsExec")},{id:"process",label:"process",description:o("agentsProcess")}]},{id:"web",label:o("agentsWeb"),tools:[{id:"web_search",label:"web_search",description:o("agentsWebSearch")},{id:"web_fetch",label:"web_fetch",description:o("agentsWebFetch")}]},{id:"memory",label:o("agentsMemory"),tools:[{id:"memory_search",label:"memory_search",description:o("agentsMemorySearch")},{id:"memory_get",label:"memory_get",description:o("agentsMemoryGet")}]},{id:"sessions",label:o("agentsSessions"),tools:[{id:"sessions_list",label:"sessions_list",description:o("agentsSessionsList")},{id:"sessions_history",label:"sessions_history",description:o("agentsSessionsHistory")},{id:"sessions_send",label:"sessions_send",description:o("agentsSessionsSend")},{id:"sessions_spawn",label:"sessions_spawn",description:o("agentsSessionsSpawn")},{id:"session_status",label:"session_status",description:o("agentsSessionStatus")}]},{id:"ui",label:o("agentsUi"),tools:[{id:"browser",label:"browser",description:o("agentsBrowser")},{id:"canvas",label:"canvas",description:o("agentsCanvas")}]},{id:"messaging",label:o("agentsMessaging"),tools:[{id:"message",label:"message",description:o("agentsMessage")}]},{id:"automation",label:o("agentsAutomation"),tools:[{id:"cron",label:"cron",description:o("agentsScheduleTasks")},{id:"gateway",label:"gateway",description:o("agentsGatewayControl")}]},{id:"nodes",label:o("agentsNodes"),tools:[{id:"nodes",label:"nodes",description:o("agentsNodesDevices")}]},{id:"agents",label:o("agentsAgents"),tools:[{id:"agents_list",label:"agents_list",description:o("agentsListAgents")}]},{id:"media",label:o("agentsMedia"),tools:[{id:"image",label:"image",description:o("agentsImageUnderstanding")}]}]}function ep(){return[{id:"minimal",label:o("agentsProfileMinimal")},{id:"coding",label:o("agentsProfileCoding")},{id:"messaging",label:o("agentsProfileMessaging")},{id:"full",label:o("agentsProfileFull")}]}function la(e){return e.name?.trim()||e.identity?.name?.trim()||e.id}function An(e){const t=e.trim();if(!t||t.length>16)return!1;let n=!1;for(let s=0;s<t.length;s+=1)if(t.charCodeAt(s)>127){n=!0;break}return!(!n||t.includes("://")||t.includes("/")||t.includes("."))}function rs(e,t){const n=t?.emoji?.trim();if(n&&An(n))return n;const s=e.identity?.emoji?.trim();if(s&&An(s))return s;const a=t?.avatar?.trim();if(a&&An(a))return a;const i=e.identity?.avatar?.trim();return i&&An(i)?i:""}function gl(e,t){return t&&e===t?o("agentsDefault"):null}function tp(e){if(e==null||!Number.isFinite(e))return"-";if(e<1024)return`${e} B`;const t=["KB","MB","GB","TB"];let n=e/1024,s=0;for(;n>=1024&&s<t.length-1;)n/=1024,s+=1;return`${n.toFixed(n<10?1:0)} ${t[s]}`}function ls(e,t){const n=e;return{entry:(n?.agents?.list??[]).find(i=>i?.id===t),defaults:n?.agents?.defaults,globalTools:n?.tools}}function pl(e,t,n,s,a){const i=ls(t,e.id),c=(n&&n.agentId===e.id?n.workspace:null)||i.entry?.workspace||i.defaults?.workspace||"default",d=i.entry?.model?Jt(i.entry?.model):Jt(i.defaults?.model),g=a?.name?.trim()||e.identity?.name?.trim()||e.name?.trim()||i.entry?.name||e.id,h=rs(e,a)||"-",p=Array.isArray(i.entry?.skills)?i.entry?.skills:null,f=p?.length??null;return{workspace:c,model:d,identityName:g,identityEmoji:h,skillsLabel:p?`${f} ${o("agentsSelected")}`:o("agentsAllSkills"),isDefault:!!(s&&e.id===s)}}function Jt(e){if(!e)return"-";if(typeof e=="string")return e.trim()||"-";if(typeof e=="object"&&e){const t=e,n=t.primary?.trim();if(n){const s=Array.isArray(t.fallbacks)?t.fallbacks.length:0;return s>0?`${n} (+${s} ${o("agentsFallback")})`:n}}return"-"}function ci(e){const t=e.match(/^(.+) \(\+\d+ fallback\)$/);return t?t[1]:e}function di(e){if(!e)return null;if(typeof e=="string")return e.trim()||null;if(typeof e=="object"&&e){const t=e;return(typeof t.primary=="string"?t.primary:typeof t.model=="string"?t.model:typeof t.id=="string"?t.id:typeof t.value=="string"?t.value:null)?.trim()||null}return null}function np(e){if(!e||typeof e=="string")return null;if(typeof e=="object"&&e){const t=e,n=Array.isArray(t.fallbacks)?t.fallbacks:Array.isArray(t.fallback)?t.fallback:null;return n?n.filter(s=>typeof s=="string"):null}return null}function sp(e){return e.split(",").map(t=>t.trim()).filter(Boolean)}function ap(e){const n=e?.agents?.defaults?.models;if(!n||typeof n!="object")return[];const s=[];for(const[a,i]of Object.entries(n)){const r=a.trim();if(!r)continue;const c=i&&typeof i=="object"&&"alias"in i&&typeof i.alias=="string"?i.alias?.trim():void 0,d=c&&c!==r?`${c} (${r})`:r;s.push({value:r,label:d})}return s}function op(e,t){const n=ap(e),s=t?n.some(a=>a.value===t):!1;return t&&!s&&n.unshift({value:t,label:`${o("agentsCurrentModel")} (${t})`}),n.length===0?l`
            <option value="" disabled>No configured models</option>
        `:n.map(a=>l`
        <option value=${a.value}>${a.label}</option>`)}function ip(e){const t=Pe(e);if(!t)return{kind:"exact",value:""};if(t==="*")return{kind:"all"};if(!t.includes("*"))return{kind:"exact",value:t};const n=t.replace(/[.*+?^${}()|[\\]\\]/g,"\\$&");return{kind:"regex",value:new RegExp(`^${n.replaceAll("\\*",".*")}$`)}}function ca(e){return Array.isArray(e)?qg(e).map(ip).filter(t=>t.kind!=="exact"||t.value.length>0):[]}function Zt(e,t){for(const n of t)if(n.kind==="all"||n.kind==="exact"&&e===n.value||n.kind==="regex"&&n.value.test(e))return!0;return!1}function rp(e,t){if(!t)return!0;const n=Pe(e),s=ca(t.deny);if(Zt(n,s))return!1;const a=ca(t.allow);return!!(a.length===0||Zt(n,a)||n==="apply_patch"&&Zt("exec",a))}function ui(e,t){if(!Array.isArray(t)||t.length===0)return!1;const n=Pe(e),s=ca(t);return!!(Zt(n,s)||n==="apply_patch"&&Zt("exec",s))}function lp(e){const t=e.agentsList?.agents??[],n=e.agentsList?.defaultId??null,s=e.selectedAgentId??n??t[0]?.id??null,a=s?t.find(i=>i.id===s)??null:null;return l`
        <div class="agents-layout">
            <section class="card agents-sidebar">
                <div class="row" style="justify-content: space-between;">
                    <div>
                        <div class="card-title">${o("agentsTitle")}</div>
                        <div class="card-sub">${t.length} ${o("agentsConfigured")}</div>
                    </div>
                    <button class="btn btn--sm" ?disabled=${e.loading} @click=${e.onRefresh}>
                        ${e.loading?o("commonLoading"):o("commonRefresh")}
                    </button>
                </div>
                ${e.error?l`
                                    <div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:v}
                <div class="agent-list" style="margin-top: 12px;">
                    ${t.length===0?l`
                                        <div class="muted">${o("agentsNoFound")}</div>
                                    `:t.map(i=>{const r=gl(i.id,n),c=rs(i,e.agentIdentityById[i.id]??null);return l`
                                            <button
                                                    type="button"
                                                    class="agent-row ${s===i.id?"active":""}"
                                                    @click=${()=>e.onSelectAgent(i.id)}
                                            >
                                                <div class="agent-avatar">
                                                    ${c||la(i).slice(0,1)}
                                                </div>
                                                <div class="agent-info">
                                                    <div class="agent-title">${la(i)}</div>
                                                    <div class="agent-sub mono">${i.id}</div>
                                                </div>
                                                ${r?l`<span class="agent-pill">${r}</span>`:v}
                                            </button>
                                        `})}
                </div>
            </section>
            <section class="agents-main">
                ${a?l`
                                    ${cp(a,n,e.agentIdentityById[a.id]??null)}
                                    ${dp(e.activePanel,i=>e.onSelectPanel(i))}
                                    ${e.activePanel==="overview"?up({agent:a,defaultId:n,configForm:e.configForm,agentFilesList:e.agentFilesList,agentIdentity:e.agentIdentityById[a.id]??null,agentIdentityError:e.agentIdentityError,agentIdentityLoading:e.agentIdentityLoading,configLoading:e.configLoading,configSaving:e.configSaving,configDirty:e.configDirty,onConfigReload:e.onConfigReload,onConfigSave:e.onConfigSave,onModelChange:e.onModelChange,onModelFallbacksChange:e.onModelFallbacksChange}):v}
                                    ${e.activePanel==="files"?xp({agentId:a.id,agentFilesList:e.agentFilesList,agentFilesLoading:e.agentFilesLoading,agentFilesError:e.agentFilesError,agentFileActive:e.agentFileActive,agentFileContents:e.agentFileContents,agentFileDrafts:e.agentFileDrafts,agentFileSaving:e.agentFileSaving,onLoadFiles:e.onLoadFiles,onSelectFile:e.onSelectFile,onFileDraftChange:e.onFileDraftChange,onFileReset:e.onFileReset,onFileSave:e.onFileSave}):v}
                                    ${e.activePanel==="tools"?Sp({agentId:a.id,configForm:e.configForm,configLoading:e.configLoading,configSaving:e.configSaving,configDirty:e.configDirty,onProfileChange:e.onToolsProfileChange,onOverridesChange:e.onToolsOverridesChange,onConfigReload:e.onConfigReload,onConfigSave:e.onConfigSave}):v}
                                    ${e.activePanel==="skills"?Cp({agentId:a.id,report:e.agentSkillsReport,loading:e.agentSkillsLoading,error:e.agentSkillsError,activeAgentId:e.agentSkillsAgentId,configForm:e.configForm,configLoading:e.configLoading,configSaving:e.configSaving,configDirty:e.configDirty,filter:e.skillsFilter,onFilterChange:e.onSkillsFilterChange,onRefresh:e.onSkillsRefresh,onToggle:e.onAgentSkillToggle,onClear:e.onAgentSkillsClear,onDisableAll:e.onAgentSkillsDisableAll,onConfigReload:e.onConfigReload,onConfigSave:e.onConfigSave}):v}
                                    ${e.activePanel==="channels"?yp({agent:a,defaultId:n,configForm:e.configForm,agentFilesList:e.agentFilesList,agentIdentity:e.agentIdentityById[a.id]??null,snapshot:e.channelsSnapshot,loading:e.channelsLoading,error:e.channelsError,lastSuccess:e.channelsLastSuccess,onRefresh:e.onChannelsRefresh}):v}
                                    ${e.activePanel==="cron"?wp({agent:a,defaultId:n,configForm:e.configForm,agentFilesList:e.agentFilesList,agentIdentity:e.agentIdentityById[a.id]??null,jobs:e.cronJobs,status:e.cronStatus,loading:e.cronLoading,error:e.cronError,onRefresh:e.onCronRefresh}):v}
                                `:l`
                                    <div class="card">
                                        <div class="card-title">${o("agentsSelectAgent")}</div>
                                        <div class="card-sub">${o("agentsSelectAgentSub")}</div>
                                    </div>
                                `}
            </section>
        </div>
    `}function cp(e,t,n){const s=gl(e.id,t),a=la(e),i=e.identity?.theme?.trim()||o("agentsWorkspaceRouting"),r=rs(e,n);return l`
        <section class="card agent-header">
            <div class="agent-header-main">
                <div class="agent-avatar agent-avatar--lg">
                    ${r||a.slice(0,1)}
                </div>
                <div>
                    <div class="card-title">${a}</div>
                    <div class="card-sub">${i}</div>
                </div>
            </div>
            <div class="agent-header-meta">
                <div class="mono">${e.id}</div>
                ${s?l`<span class="agent-pill">${s}</span>`:v}
            </div>
        </section>
    `}function dp(e,t){const n=[{id:"overview",label:o("agentsTabOverview")},{id:"files",label:o("agentsTabFiles")},{id:"tools",label:o("agentsTabTools")},{id:"skills",label:o("agentsTabSkills")},{id:"channels",label:o("agentsTabChannels")},{id:"cron",label:o("agentsTabCron")}];return l`
        <div class="agent-tabs">
            ${n.map(s=>l`
                        <button
                                class="agent-tab ${e===s.id?"active":""}"
                                type="button"
                                @click=${()=>t(s.id)}
                        >
                            ${s.label}
                        </button>
                    `)}
        </div>
    `}function up(e){const{agent:t,configForm:n,agentFilesList:s,agentIdentity:a,agentIdentityLoading:i,agentIdentityError:r,configLoading:c,configSaving:d,configDirty:g,onConfigReload:h,onConfigSave:p,onModelChange:f,onModelFallbacksChange:u}=e,m=ls(n,t.id),x=(s&&s.agentId===t.id?s.workspace:null)||m.entry?.workspace||m.defaults?.workspace||"default",A=m.entry?.model?Jt(m.entry?.model):Jt(m.defaults?.model),$=Jt(m.defaults?.model),T=di(m.entry?.model)||(A!=="-"?ci(A):null),C=di(m.defaults?.model)||($!=="-"?ci($):null),_=T??C??null,M=np(m.entry?.model),D=M?M.join(", "):"",z=a?.name?.trim()||t.identity?.name?.trim()||t.name?.trim()||m.entry?.name||"-",ae=rs(t,a)||"-",F=Array.isArray(m.entry?.skills)?m.entry?.skills:null,W=F?.length??null,de=i?o("commonLoading"):r?o("agentsUnavailable"):"",E=!!(e.defaultId&&t.id===e.defaultId);return l`
        <section class="card">
            <div class="card-title">${o("agentsOverview")}</div>
            <div class="card-sub">${o("agentsOverviewSub")}</div>
            <div class="agents-overview-grid" style="margin-top: 16px;">
                <div class="agent-kv">
                    <div class="label">${o("agentsWorkspace")}</div>
                    <div class="mono">${x}</div>
                </div>
                <div class="agent-kv">
                    <div class="label">${o("agentsPrimaryModel")}</div>
                    <div class="mono">${A}</div>
                </div>
                <div class="agent-kv">
                    <div class="label">${o("agentsIdentityName")}</div>
                    <div>${z}</div>
                    ${de?l`
                        <div class="agent-kv-sub muted">${de}</div>`:v}
                </div>
                <div class="agent-kv">
                    <div class="label">${o("agentsDefaultLabel")}</div>
                    <div>${o(E?"commonYes":"commonNo")}</div>
                </div>
                <div class="agent-kv">
                    <div class="label">${o("agentsIdentityEmoji")}</div>
                    <div>${ae}</div>
                </div>
                <div class="agent-kv">
                    <div class="label">${o("agentsSkillsFilter")}</div>
                    <div>${F?`${W} ${o("agentsSelected")}`:o("agentsAllSkills")}</div>
                </div>
            </div>

            <div class="agent-model-select" style="margin-top: 20px;">
                <div class="label">${o("agentsModelSelection")}</div>
                <div class="row" style="gap: 12px; flex-wrap: wrap;">
                    <label class="field" style="min-width: 260px; flex: 1;">
                        <span>${o("agentsPrimaryModelLabel")}${E?` ${o("agentsPrimaryModelDefault")}`:""}</span>
                        <select
                                .value=${_??""}
                                ?disabled=${!n||c||d}
                                @change=${B=>f(t.id,B.target.value||null)}
                        >
                            ${E?v:l`
                                                <option value="">
                                                    ${C?`${o("agentsInheritDefault")} (${C})`:o("agentsInheritDefault")}
                                                </option>
                                            `}
                            ${op(n,_??void 0)}
                        </select>
                    </label>
                    <label class="field" style="min-width: 260px; flex: 1;">
                        <span>${o("agentsFallbacksLabel")}</span>
                        <input
                                .value=${D}
                                ?disabled=${!n||c||d}
                                placeholder="provider/model, provider/model"
                                @input=${B=>u(t.id,sp(B.target.value))}
                        />
                    </label>
                </div>
                <div class="row" style="justify-content: flex-end; gap: 8px;">
                    <button
                            class="btn btn--sm"
                            ?disabled=${c}
                            @click=${h}
                    >
                        ${o("agentsReloadConfig")}
                    </button>
                    <button
                            class="btn btn--sm primary"
                            ?disabled=${d||!g}
                            @click=${p}
                    >
                        ${o(d?"commonSaving":"commonSave")}
                    </button>
                </div>
            </div>
        </section>
    `}function ml(e,t){return l`
        <section class="card">
            <div class="card-title">${o("agentsAgentContext")}</div>
            <div class="card-sub">${t}</div>
            <div class="agents-overview-grid" style="margin-top: 16px;">
                <div class="agent-kv">
                    <div class="label">${o("agentsWorkspace")}</div>
                    <div class="mono">${e.workspace}</div>
                </div>
                <div class="agent-kv">
                    <div class="label">${o("agentsPrimaryModel")}</div>
                    <div class="mono">${e.model}</div>
                </div>
                <div class="agent-kv">
                    <div class="label">${o("agentsIdentityName")}</div>
                    <div>${e.identityName}</div>
                </div>
                <div class="agent-kv">
                    <div class="label">${o("agentsIdentityEmoji")}</div>
                    <div>${e.identityEmoji}</div>
                </div>
                <div class="agent-kv">
                    <div class="label">${o("agentsSkillsFilter")}</div>
                    <div>${e.skillsLabel}</div>
                </div>
                <div class="agent-kv">
                    <div class="label">${o("agentsDefaultLabel")}</div>
                    <div>${e.isDefault?o("commonYes"):o("commonNo")}</div>
                </div>
            </div>
        </section>
    `}function gp(e,t){const n=e.channelMeta?.find(s=>s.id===t);return n?.label?n.label:e.channelLabels?.[t]??t}function pp(e){if(!e)return[];const t=new Set;for(const a of e.channelOrder??[])t.add(a);for(const a of e.channelMeta??[])t.add(a.id);for(const a of Object.keys(e.channelAccounts??{}))t.add(a);const n=[],s=e.channelOrder?.length?e.channelOrder:Array.from(t);for(const a of s)t.has(a)&&(n.push(a),t.delete(a));for(const a of t)n.push(a);return n.map(a=>({id:a,label:gp(e,a),accounts:e.channelAccounts?.[a]??[]}))}const mp=["groupPolicy","streamMode","dmPolicy"];function hp(e,t){if(!e)return null;const s=(e.channels??{})[t];if(s&&typeof s=="object")return s;const a=e[t];return a&&typeof a=="object"?a:null}function fp(e){if(e==null)return o("commonNA");if(typeof e=="string"||typeof e=="number"||typeof e=="boolean")return String(e);try{return JSON.stringify(e)}catch{return o("commonNA")}}function vp(e,t){const n=hp(e,t);return n?mp.flatMap(s=>s in n?[{label:s,value:fp(n[s])}]:[]):[]}function bp(e){let t=0,n=0,s=0;for(const a of e){const i=a.probe&&typeof a.probe=="object"&&"ok"in a.probe?!!a.probe.ok:!1;(a.connected===!0||a.running===!0||i)&&(t+=1),a.configured&&(n+=1),a.enabled&&(s+=1)}return{total:e.length,connected:t,configured:n,enabled:s}}function yp(e){const t=pl(e.agent,e.configForm,e.agentFilesList,e.defaultId,e.agentIdentity),n=pp(e.snapshot),s=e.lastSuccess?Q(e.lastSuccess):o("agentsNever");return l`
        <section class="grid grid-cols-2">
            ${ml(t,o("agentsContextWorkspaceIdentity"))}
            <section class="card">
                <div class="row" style="justify-content: space-between;">
                    <div>
                        <div class="card-title">${o("agentsChannels")}</div>
                        <div class="card-sub">${o("agentsChannelsSub")}</div>
                    </div>
                    <button class="btn btn--sm" ?disabled=${e.loading} @click=${e.onRefresh}>
                        ${e.loading?o("commonRefreshing"):o("commonRefresh")}
                    </button>
                </div>
                <div class="muted" style="margin-top: 8px;">
                    ${o("agentsLastRefresh")}: ${s}
                </div>
                ${e.error?l`
                                    <div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:v}
                ${e.snapshot?v:l`
                                    <div class="callout info" style="margin-top: 12px">${o("agentsLoadChannels")}</div>
                                `}
                ${n.length===0?l`
                                    <div class="muted" style="margin-top: 16px">${o("agentsNoChannels")}</div>
                                `:l`
                                    <div class="list" style="margin-top: 16px;">
                                        ${n.map(a=>{const i=bp(a.accounts),r=i.total?`${i.connected}/${i.total} ${o("agentsConnected")}`:o("agentsNoAccounts"),c=i.configured?`${i.configured} ${o("agentsConfiguredLabel")}`:o("agentsNotConfigured"),d=i.total?`${i.enabled} ${o("agentsEnabled")}`:o("agentsDisabled"),g=vp(e.configForm,a.id);return l`
                                                <div class="list-item">
                                                    <div class="list-main">
                                                        <div class="list-title">${a.label}</div>
                                                        <div class="list-sub mono">${a.id}</div>
                                                    </div>
                                                    <div class="list-meta">
                                                        <div>${r}</div>
                                                        <div>${c}</div>
                                                        <div>${d}</div>
                                                        ${g.length>0?g.map(h=>l`
                                                                            <div>${h.label}: ${h.value}</div>`):v}
                                                    </div>
                                                </div>
                                            `})}
                                    </div>
                                `}
            </section>
        </section>
    `}function wp(e){const t=pl(e.agent,e.configForm,e.agentFilesList,e.defaultId,e.agentIdentity),n=e.jobs.filter(s=>s.agentId===e.agent.id);return l`
        <section class="grid grid-cols-2">
            ${ml(t,o("agentsContextWorkspaceScheduling"))}
            <section class="card">
                <div class="row" style="justify-content: space-between;">
                    <div>
                        <div class="card-title">${o("agentsScheduler")}</div>
                        <div class="card-sub">${o("agentsSchedulerSub")}</div>
                    </div>
                    <button class="btn btn--sm" ?disabled=${e.loading} @click=${e.onRefresh}>
                        ${e.loading?o("commonRefreshing"):o("commonRefresh")}
                    </button>
                </div>
                <div class="stat-grid" style="margin-top: 16px;">
                    <div class="stat">
                        <div class="stat-label">${o("agentsEnabled")}</div>
                        <div class="stat-value">
                            ${e.status?e.status.enabled?o("commonYes"):o("commonNo"):o("commonNA")}
                        </div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">${o("cronJobs")}</div>
                        <div class="stat-value">${e.status?.jobs??o("commonNA")}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">${o("agentsNextWake")}</div>
                        <div class="stat-value">${Ya(e.status?.nextWakeAtMs??null)}</div>
                    </div>
                </div>
                ${e.error?l`
                                    <div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:v}
            </section>
        </section>
        <section class="card">
            <div class="card-title">${o("agentsCronJobs")}</div>
            <div class="card-sub">${o("agentsCronJobsSub")}</div>
            ${n.length===0?l`
                                <div class="muted" style="margin-top: 16px">${o("agentsNoJobsAssigned")}</div>
                            `:l`
                                <div class="list" style="margin-top: 16px;">
                                    ${n.map(s=>l`
                                                <div class="list-item">
                                                    <div class="list-main">
                                                        <div class="list-title">${s.name}</div>
                                                        ${s.description?l`
                                                            <div class="list-sub">${s.description}</div>`:v}
                                                        <div class="chip-row" style="margin-top: 6px;">
                                                            <span class="chip">${ul(s)}</span>
                                                            <span class="chip ${s.enabled?"chip-ok":"chip-warn"}">
                          ${s.enabled?o("agentsEnabled"):o("agentsDisabled")}
                        </span>
                                                            <span class="chip">${s.sessionTarget}</span>
                                                        </div>
                                                    </div>
                                                    <div class="list-meta">
                                                        <div class="mono">${Zg(s)}</div>
                                                        <div class="muted">${Xg(s)}</div>
                                                    </div>
                                                </div>
                                            `)}
                                </div>
                            `}
        </section>
    `}function xp(e){const t=e.agentFilesList?.agentId===e.agentId?e.agentFilesList:null,n=t?.files??[],s=e.agentFileActive??null,a=s?n.find(d=>d.name===s)??null:null,i=s?e.agentFileContents[s]??"":"",r=s?e.agentFileDrafts[s]??i:"",c=s?r!==i:!1;return l`
        <section class="card">
            <div class="row" style="justify-content: space-between;">
                <div>
                    <div class="card-title">${o("agentsCoreFiles")}</div>
                    <div class="card-sub">${o("agentsCoreFilesSub")}</div>
                </div>
                <button
                        class="btn btn--sm"
                        ?disabled=${e.agentFilesLoading}
                        @click=${()=>e.onLoadFiles(e.agentId)}
                >
                    ${e.agentFilesLoading?o("commonLoading"):o("commonRefresh")}
                </button>
            </div>
            ${t?l`
                <div class="muted mono" style="margin-top: 8px;">${o("agentsWorkspace")}: ${t.workspace}
                </div>`:v}
            ${e.agentFilesError?l`
                                <div class="callout danger" style="margin-top: 12px;">${e.agentFilesError}
                                </div>`:v}
            ${t?l`
                                <div class="agent-files-grid" style="margin-top: 16px;">
                                    <div class="agent-files-list">
                                        ${n.length===0?l`
                                                            <div class="muted">${o("agentsNoFilesFound")}</div>
                                                        `:n.map(d=>$p(d,s,()=>e.onSelectFile(d.name)))}
                                    </div>
                                    <div class="agent-files-editor">
                                        ${a?l`
                                                            <div class="agent-file-header">
                                                                <div>
                                                                    <div class="agent-file-title mono">${a.name}</div>
                                                                    <div class="agent-file-sub mono">${a.path}</div>
                                                                </div>
                                                                <div class="agent-file-actions">
                                                                    <button
                                                                            class="btn btn--sm"
                                                                            ?disabled=${!c}
                                                                            @click=${()=>e.onFileReset(a.name)}
                                                                    >
                                                                        ${o("agentsReset")}
                                                                    </button>
                                                                    <button
                                                                            class="btn btn--sm primary"
                                                                            ?disabled=${e.agentFileSaving||!c}
                                                                            @click=${()=>e.onFileSave(a.name)}
                                                                    >
                                                                        ${e.agentFileSaving?o("commonSaving"):o("commonSave")}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            ${a.missing?l`
                                                                                <div class="callout info" style="margin-top: 10px">
                                                                                    ${o("agentsFileMissingCreate")}
                                                                                </div>
                                                                            `:v}
                                                            <label class="field" style="margin-top: 12px;">
                                                                <span>Content</span>
                                                                <textarea
                                                                        .value=${r}
                                                                        @input=${d=>e.onFileDraftChange(a.name,d.target.value)}
                                                                ></textarea>
                                                            </label>
                                                        `:l`
                                                            <div class="muted">${o("agentsSelectFileToEdit")}</div>
                                                        `}
                                    </div>
                                </div>
                            `:l`
                                <div class="callout info" style="margin-top: 12px">
                                    ${o("agentsLoadWorkspaceFiles")}
                                </div>
                            `}
        </section>
    `}function $p(e,t,n){const s=e.missing?"Missing":`${tp(e.size)} · ${Q(e.updatedAtMs??null)}`;return l`
        <button
                type="button"
                class="agent-file-row ${t===e.name?"active":""}"
                @click=${n}
        >
            <div>
                <div class="agent-file-name mono">${e.name}</div>
                <div class="agent-file-meta">${s}</div>
            </div>
            ${e.missing?l`
                                <span class="agent-pill warn">missing</span>
                            `:v}
        </button>
    `}function Sp(e){const t=ls(e.configForm,e.agentId),n=t.entry?.tools??{},s=t.globalTools??{},a=n.profile??s.profile??"full",i=n.profile?"agent override":s.profile?"global default":"default",r=Array.isArray(n.allow)&&n.allow.length>0,c=Array.isArray(s.allow)&&s.allow.length>0,d=!!e.configForm&&!e.configLoading&&!e.configSaving&&!r,g=r?[]:Array.isArray(n.alsoAllow)?n.alsoAllow:[],h=r?[]:Array.isArray(n.deny)?n.deny:[],p=r?{allow:n.allow??[],deny:n.deny??[]}:Gg(a)??void 0,f=li().flatMap(A=>A.tools.map($=>$.id)),u=A=>{const $=rp(A,p),T=ui(A,g),C=ui(A,h);return{allowed:($||T)&&!C,baseAllowed:$,denied:C}},m=f.filter(A=>u(A).allowed).length,b=(A,$)=>{const T=new Set(g.map(D=>Pe(D)).filter(D=>D.length>0)),C=new Set(h.map(D=>Pe(D)).filter(D=>D.length>0)),_=u(A).baseAllowed,M=Pe(A);$?(C.delete(M),_||T.add(M)):(T.delete(M),C.add(M)),e.onOverridesChange(e.agentId,[...T],[...C])},x=A=>{const $=new Set(g.map(C=>Pe(C)).filter(C=>C.length>0)),T=new Set(h.map(C=>Pe(C)).filter(C=>C.length>0));for(const C of f){const _=u(C).baseAllowed,M=Pe(C);A?(T.delete(M),_||$.add(M)):($.delete(M),T.add(M))}e.onOverridesChange(e.agentId,[...$],[...T])};return l`
        <section class="card">
            <div class="row" style="justify-content: space-between;">
                <div>
                    <div class="card-title">${o("agentsToolAccess")}</div>
                    <div class="card-sub">
                        ${o("agentsToolsSubText")}
                        <span class="mono">${m}/${f.length}</span> ${o("agentsEnabledCount")}
                    </div>
                </div>
                <div class="row" style="gap: 8px;">
                    <button
                            class="btn btn--sm"
                            ?disabled=${!d}
                            @click=${()=>x(!0)}
                    >
                        ${o("agentsEnableAll")}
                    </button>
                    <button
                            class="btn btn--sm"
                            ?disabled=${!d}
                            @click=${()=>x(!1)}
                    >
                        ${o("agentsDisableAll")}
                    </button>
                    <button
                            class="btn btn--sm"
                            ?disabled=${e.configLoading}
                            @click=${e.onConfigReload}
                    >
                        ${o("agentsReloadConfig")}
                    </button>
                    <button
                            class="btn btn--sm primary"
                            ?disabled=${e.configSaving||!e.configDirty}
                            @click=${e.onConfigSave}
                    >
                        ${e.configSaving?o("commonSaving"):o("commonSave")}
                    </button>
                </div>
            </div>

            ${e.configForm?v:l`
                                <div class="callout info" style="margin-top: 12px">
                                    ${o("agentsLoadConfigForTools")}
                                </div>
                            `}
            ${r?l`
                                <div class="callout info" style="margin-top: 12px">
                                    ${o("agentsExplicitAllowlist")}
                                </div>
                            `:v}
            ${c?l`
                                <div class="callout info" style="margin-top: 12px">
                                    ${o("agentsToolsGlobalAllow")}
                                </div>
                            `:v}

            <div class="agent-tools-meta" style="margin-top: 16px;">
                <div class="agent-kv">
                    <div class="label">${o("agentsProfile")}</div>
                    <div class="mono">${a}</div>
                </div>
                <div class="agent-kv">
                    <div class="label">${o("agentsSource")}</div>
                    <div>${i}</div>
                </div>
                ${e.configDirty?l`
                                    <div class="agent-kv">
                                        <div class="label">${o("agentsStatus")}</div>
                                        <div class="mono">${o("agentsUnsaved")}</div>
                                    </div>
                                `:v}
            </div>

            <div class="agent-tools-presets" style="margin-top: 16px;">
                <div class="label">${o("agentsQuickPresets")}</div>
                <div class="agent-tools-buttons">
                    ${ep().map(A=>l`
                                <button
                                        class="btn btn--sm ${a===A.id?"active":""}"
                                        ?disabled=${!d}
                                        @click=${()=>e.onProfileChange(e.agentId,A.id,!0)}
                                >
                                    ${A.label}
                                </button>
                            `)}
                    <button
                            class="btn btn--sm"
                            ?disabled=${!d}
                            @click=${()=>e.onProfileChange(e.agentId,null,!1)}
                    >
                        ${o("agentsInherit")}
                    </button>
                </div>
            </div>

            <div class="agent-tools-grid" style="margin-top: 20px;">
                ${li().map(A=>l`
                                    <div class="agent-tools-section">
                                        <div class="agent-tools-header">${A.label}</div>
                                        <div class="agent-tools-list">
                                            ${A.tools.map($=>{const{allowed:T}=u($.id);return l`
                                                    <div class="agent-tool-row">
                                                        <div>
                                                            <div class="agent-tool-title mono">${$.label}</div>
                                                            <div class="agent-tool-sub">${$.description}</div>
                                                        </div>
                                                        <label class="cfg-toggle">
                                                            <input
                                                                    type="checkbox"
                                                                    .checked=${T}
                                                                    ?disabled=${!d}
                                                                    @change=${C=>b($.id,C.target.checked)}
                                                            />
                                                            <span class="cfg-toggle__track"></span>
                                                        </label>
                                                    </div>
                                                `})}
                                        </div>
                                    </div>
                                `)}
            </div>
        </section>
    `}function kp(){return[{id:"workspace",label:o("skillsWorkspace"),sources:["openclaw-workspace"]},{id:"built-in",label:o("skillsBuiltIn"),sources:["openclaw-bundled"]},{id:"installed",label:o("skillsInstalled"),sources:["openclaw-managed"]},{id:"extra",label:o("skillsExtra"),sources:["openclaw-extra"]}]}function Ap(e){const t=kp(),n=new Map;for(const r of t)n.set(r.id,{id:r.id,label:r.label,skills:[]});const s=t.find(r=>r.id==="built-in"),a={id:"other",label:o("skillsOther"),skills:[]};for(const r of e){const c=r.bundled?s:t.find(d=>d.sources.includes(r.source));c?n.get(c.id)?.skills.push(r):a.skills.push(r)}const i=t.map(r=>n.get(r.id)).filter(r=>!!(r&&r.skills.length>0));return a.skills.length>0&&i.push(a),i}function Cp(e){const t=!!e.configForm&&!e.configLoading&&!e.configSaving,n=ls(e.configForm,e.agentId),s=Array.isArray(n.entry?.skills)?n.entry?.skills:void 0,a=new Set((s??[]).map(u=>u.trim()).filter(Boolean)),i=s!==void 0,r=!!(e.report&&e.activeAgentId===e.agentId),c=r?e.report?.skills??[]:[],d=e.filter.trim().toLowerCase(),g=d?c.filter(u=>[u.name,u.description,u.source].join(" ").toLowerCase().includes(d)):c,h=Ap(g),p=i?c.filter(u=>a.has(u.name)).length:c.length,f=c.length;return l`
        <section class="card">
            <div class="row" style="justify-content: space-between;">
                <div>
                    <div class="card-title">${o("skillsTitle")}</div>
                    <div class="card-sub">
                        ${o("agentsSkillsPanelSub")}
                        ${f>0?l`<span class="mono">${p}/${f}</span>`:v}
                    </div>
                </div>
                <div class="row" style="gap: 8px;">
                    <button class="btn btn--sm" ?disabled=${!t} @click=${()=>e.onClear(e.agentId)}>
                        ${o("agentsUseAll")}
                    </button>
                    <button class="btn btn--sm" ?disabled=${!t}
                            @click=${()=>e.onDisableAll(e.agentId)}>
                        ${o("agentsDisableAll")}
                    </button>
                    <button
                            class="btn btn--sm"
                            ?disabled=${e.configLoading}
                            @click=${e.onConfigReload}
                    >
                        ${o("agentsReloadConfig")}
                    </button>
                    <button class="btn btn--sm" ?disabled=${e.loading} @click=${e.onRefresh}>
                        ${e.loading?o("commonLoading"):o("commonRefresh")}
                    </button>
                    <button
                            class="btn btn--sm primary"
                            ?disabled=${e.configSaving||!e.configDirty}
                            @click=${e.onConfigSave}
                    >
                        ${e.configSaving?o("commonSaving"):o("commonSave")}
                    </button>
                </div>
            </div>

            ${e.configForm?v:l`
                                <div class="callout info" style="margin-top: 12px">
                                    ${o("agentsLoadConfigForSkills")}
                                </div>
                            `}
            ${i?l`
                                <div class="callout info" style="margin-top: 12px">${o("agentsCustomAllowlist")}</div>
                            `:l`
                                <div class="callout info" style="margin-top: 12px">
                                    ${o("agentsAllSkillsEnabled")}
                                </div>
                            `}
            ${!r&&!e.loading?l`
                                <div class="callout info" style="margin-top: 12px">
                                    ${o("agentsLoadSkillsForAgent")}
                                </div>
                            `:v}
            ${e.error?l`
                                <div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:v}

            <div class="filters" style="margin-top: 14px;">
                <label class="field" style="flex: 1;">
                    <span>${o("agentsFilter")}</span>
                    <input
                            .value=${e.filter}
                            @input=${u=>e.onFilterChange(u.target.value)}
                            placeholder=${o("skillsSearchPlaceholder")}
                    />
                </label>
                <div class="muted">${g.length} ${o("skillsShown")}</div>
            </div>

            ${g.length===0?l`
                                <div class="muted" style="margin-top: 16px">${o("agentsNoSkillsFound")}</div>
                            `:l`
                                <div class="agent-skills-groups" style="margin-top: 16px;">
                                    ${h.map(u=>Tp(u,{agentId:e.agentId,allowSet:a,usingAllowlist:i,editable:t,onToggle:e.onToggle}))}
                                </div>
                            `}
        </section>
    `}function Tp(e,t){const n=e.id==="workspace"||e.id==="built-in";return l`
        <details class="agent-skills-group" ?open=${!n}>
            <summary class="agent-skills-header">
                <span>${e.label}</span>
                <span class="muted">${e.skills.length}</span>
            </summary>
            <div class="list skills-grid">
                ${e.skills.map(s=>_p(s,{agentId:t.agentId,allowSet:t.allowSet,usingAllowlist:t.usingAllowlist,editable:t.editable,onToggle:t.onToggle}))}
            </div>
        </details>
    `}function _p(e,t){const n=t.usingAllowlist?t.allowSet.has(e.name):!0,s=[...e.missing.bins.map(i=>`bin:${i}`),...e.missing.env.map(i=>`env:${i}`),...e.missing.config.map(i=>`config:${i}`),...e.missing.os.map(i=>`os:${i}`)],a=[];return e.disabled&&a.push("disabled"),e.blockedByAllowlist&&a.push("blocked by allowlist"),l`
        <div class="list-item agent-skill-row">
            <div class="list-main">
                <div class="list-title">
                    ${e.emoji?`${e.emoji} `:""}${e.name}
                </div>
                <div class="list-sub">${e.description}</div>
                <div class="chip-row" style="margin-top: 6px;">
                    <span class="chip">${e.source}</span>
                    <span class="chip ${e.eligible?"chip-ok":"chip-warn"}">
            ${e.eligible?"eligible":"blocked"}
          </span>
                    ${e.disabled?l`
                                        <span class="chip chip-warn">disabled</span>
                                    `:v}
                </div>
                ${s.length>0?l`
                                    <div class="muted" style="margin-top: 6px;">Missing: ${s.join(", ")}</div>`:v}
                ${a.length>0?l`
                                    <div class="muted" style="margin-top: 6px;">Reason: ${a.join(", ")}</div>`:v}
            </div>
            <div class="list-meta">
                <label class="cfg-toggle">
                    <input
                            type="checkbox"
                            .checked=${n}
                            ?disabled=${!t.editable}
                            @change=${i=>t.onToggle(t.agentId,e.name,i.target.checked)}
                    />
                    <span class="cfg-toggle__track"></span>
                </label>
            </div>
        </div>
    `}function Ne(e){if(e)return Array.isArray(e.type)?e.type.filter(n=>n!=="null")[0]??e.type[0]:e.type}function hl(e){if(!e)return"";if(e.default!==void 0)return e.default;switch(Ne(e)){case"object":return{};case"array":return[];case"boolean":return!1;case"number":case"integer":return 0;case"string":return"";default:return""}}function Nt(e){return e.filter(t=>typeof t=="string").join(".")}function ke(e,t){const n=Nt(e),s=t[n];if(s)return s;const a=n.split(".");for(const[i,r]of Object.entries(t)){if(!i.includes("*"))continue;const c=i.split(".");if(c.length!==a.length)continue;let d=!0;for(let g=0;g<a.length;g+=1)if(c[g]!=="*"&&c[g]!==a[g]){d=!1;break}if(d)return r}}function Fe(e){return e.replace(/_/g," ").replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/\s+/g," ").replace(/^./,t=>t.toUpperCase())}function Mp(e){const t=Nt(e).toLowerCase();return t.includes("token")||t.includes("password")||t.includes("secret")||t.includes("apikey")||t.endsWith("key")}function Ep(e){const t=Nt(e),n=e.map(a=>typeof a=="number"?"*":a).join("."),s=n.replace(/\.\*/g,"[]");return[t,n,s]}const Lp={en:{"meta.lastTouchedVersion":"Auto-set when OpenClaw writes the config.","meta.lastTouchedAt":"ISO timestamp of the last config write (auto-set).","update.channel":'Update channel for git + npm installs ("stable", "beta", or "dev").',"update.checkOnStart":"Check for npm updates when the gateway starts (default: true).","gateway.remote.url":"Remote Gateway WebSocket URL (ws:// or wss://).","gateway.remote.tlsFingerprint":"Expected sha256 TLS fingerprint for the remote gateway (pin to avoid MITM).","gateway.remote.sshTarget":"Remote gateway over SSH (tunnels the gateway port to localhost). Format: user@host or user@host:port.","gateway.remote.sshIdentity":"Optional SSH identity file path (passed to ssh -i).","agents.list.*.skills":"Optional allowlist of skills for this agent (omit = all skills; empty = no skills).","agents.list[].skills":"Optional allowlist of skills for this agent (omit = all skills; empty = no skills).","agents.list[].identity.avatar":"Avatar image path (relative to the agent workspace only) or a remote URL/data URL.","discovery.mdns.mode":'mDNS broadcast mode ("minimal" default, "full" includes cliPath/sshPort, "off" disables mDNS).',"gateway.auth.token":"Required by default for gateway access (unless using Tailscale Serve identity); required for non-loopback binds.","gateway.auth.password":"Required for Tailscale funnel.","gateway.controlUi.basePath":"Optional URL prefix where the Control UI is served (e.g. /openclaw).","gateway.controlUi.root":"Optional filesystem root for Control UI assets (defaults to dist/control-ui).","gateway.controlUi.allowedOrigins":"Allowed browser origins for Control UI/WebChat websocket connections (full origins only, e.g. https://control.example.com).","gateway.controlUi.allowInsecureAuth":"Allow Control UI auth over insecure HTTP (token-only; not recommended).","gateway.controlUi.dangerouslyDisableDeviceAuth":"DANGEROUS. Disable Control UI device identity checks (token/password only).","gateway.http.endpoints.chatCompletions.enabled":"Enable the OpenAI-compatible `POST /v1/chat/completions` endpoint (default: false).","gateway.reload.mode":'Hot reload strategy for config changes ("hybrid" recommended).',"gateway.reload.debounceMs":"Debounce window (ms) before applying config changes.","gateway.nodes.browser.mode":'Node browser routing ("auto" = pick single connected browser node, "manual" = require node param, "off" = disable).',"gateway.nodes.browser.node":"Pin browser routing to a specific node id or name (optional).","gateway.nodes.allowCommands":"Extra node.invoke commands to allow beyond the gateway defaults (array of command strings).","gateway.nodes.denyCommands":"Commands to block even if present in node claims or default allowlist.","nodeHost.browserProxy.enabled":"Expose the local browser control server via node proxy.","nodeHost.browserProxy.allowProfiles":"Optional allowlist of browser profile names exposed via the node proxy.","diagnostics.flags":'Enable targeted diagnostics logs by flag (e.g. ["telegram.http"]). Supports wildcards like "telegram.*" or "*".',"diagnostics.cacheTrace.enabled":"Log cache trace snapshots for embedded agent runs (default: false).","diagnostics.cacheTrace.filePath":"JSONL output path for cache trace logs (default: $OPENCLAW_STATE_DIR/logs/cache-trace.jsonl).","diagnostics.cacheTrace.includeMessages":"Include full message payloads in trace output (default: true).","diagnostics.cacheTrace.includePrompt":"Include prompt text in trace output (default: true).","diagnostics.cacheTrace.includeSystem":"Include system prompt in trace output (default: true).","tools.exec.applyPatch.enabled":"Experimental. Enables apply_patch for OpenAI models when allowed by tool policy.","tools.exec.applyPatch.allowModels":'Optional allowlist of model ids (e.g. "gpt-5.2" or "openai/gpt-5.2").',"tools.exec.notifyOnExit":"When true (default), backgrounded exec sessions enqueue a system event and request a heartbeat on exit.","tools.exec.pathPrepend":"Directories to prepend to PATH for exec runs (gateway/sandbox).","tools.exec.safeBins":"Allow stdin-only safe binaries to run without explicit allowlist entries.","tools.message.allowCrossContextSend":"Legacy override: allow cross-context sends across all providers.","tools.message.crossContext.allowWithinProvider":"Allow sends to other channels within the same provider (default: true).","tools.message.crossContext.allowAcrossProviders":"Allow sends across different providers (default: false).","tools.message.crossContext.marker.enabled":"Add a visible origin marker when sending cross-context (default: true).","tools.message.crossContext.marker.prefix":'Text prefix for cross-context markers (supports "{channel}").',"tools.message.crossContext.marker.suffix":'Text suffix for cross-context markers (supports "{channel}").',"tools.message.broadcast.enabled":"Enable broadcast action (default: true).","tools.web.search.enabled":"Enable the web_search tool (requires a provider API key).","tools.web.search.provider":'Search provider ("brave" or "perplexity").',"tools.web.search.apiKey":"Brave Search API key (fallback: BRAVE_API_KEY env var).","tools.web.search.maxResults":"Default number of results to return (1-10).","tools.web.search.timeoutSeconds":"Timeout in seconds for web_search requests.","tools.web.search.cacheTtlMinutes":"Cache TTL in minutes for web_search results.","tools.web.search.perplexity.apiKey":"Perplexity or OpenRouter API key (fallback: PERPLEXITY_API_KEY or OPENROUTER_API_KEY env var).","tools.web.search.perplexity.baseUrl":"Perplexity base URL override (default: https://openrouter.ai/api/v1 or https://api.perplexity.ai).","tools.web.search.perplexity.model":'Perplexity model override (default: "perplexity/sonar-pro").',"tools.web.fetch.enabled":"Enable the web_fetch tool (lightweight HTTP fetch).","tools.web.fetch.maxChars":"Max characters returned by web_fetch (truncated).","tools.web.fetch.maxCharsCap":"Hard cap for web_fetch maxChars (applies to config and tool calls).","tools.web.fetch.timeoutSeconds":"Timeout in seconds for web_fetch requests.","tools.web.fetch.cacheTtlMinutes":"Cache TTL in minutes for web_fetch results.","tools.web.fetch.maxRedirects":"Maximum redirects allowed for web_fetch (default: 3).","tools.web.fetch.userAgent":"Override User-Agent header for web_fetch requests.","tools.web.fetch.readability":"Use Readability to extract main content from HTML (fallbacks to basic HTML cleanup).","tools.web.fetch.firecrawl.enabled":"Enable Firecrawl fallback for web_fetch (if configured).","tools.web.fetch.firecrawl.apiKey":"Firecrawl API key (fallback: FIRECRAWL_API_KEY env var).","tools.web.fetch.firecrawl.baseUrl":"Firecrawl base URL (e.g. https://api.firecrawl.dev or custom endpoint).","tools.web.fetch.firecrawl.onlyMainContent":"When true, Firecrawl returns only the main content (default: true).","tools.web.fetch.firecrawl.maxAgeMs":"Firecrawl maxAge (ms) for cached results when supported by the API.","tools.web.fetch.firecrawl.timeoutSeconds":"Timeout in seconds for Firecrawl requests.","channels.slack.allowBots":"Allow bot-authored messages to trigger Slack replies (default: false).","channels.slack.thread.historyScope":'Scope for Slack thread history context ("thread" isolates per thread; "channel" reuses channel history).',"channels.slack.thread.inheritParent":"If true, Slack thread sessions inherit the parent channel transcript (default: false).","channels.mattermost.botToken":"Bot token from Mattermost System Console -> Integrations -> Bot Accounts.","channels.mattermost.baseUrl":"Base URL for your Mattermost server (e.g., https://chat.example.com).","channels.mattermost.chatmode":'Reply to channel messages on mention ("oncall"), on trigger chars (">" or "!") ("onchar"), or on every message ("onmessage").',"channels.mattermost.oncharPrefixes":'Trigger prefixes for onchar mode (default: [">", "!"]).',"channels.mattermost.requireMention":"Require @mention in channels before responding (default: true).","auth.profiles":"Named auth profiles (provider + mode + optional email).","auth.order":"Ordered auth profile IDs per provider (used for automatic failover).","auth.cooldowns.billingBackoffHours":"Base backoff (hours) when a profile fails due to billing/insufficient credits (default: 5).","auth.cooldowns.billingBackoffHoursByProvider":"Optional per-provider overrides for billing backoff (hours).","auth.cooldowns.billingMaxHours":"Cap (hours) for billing backoff (default: 24).","auth.cooldowns.failureWindowHours":"Failure window (hours) for backoff counters (default: 24).","agents.defaults.bootstrapMaxChars":"Max characters of each workspace bootstrap file injected into the system prompt before truncation (default: 20000).","agents.defaults.repoRoot":"Optional repository root shown in the system prompt runtime line (overrides auto-detect).","agents.defaults.envelopeTimezone":'Timezone for message envelopes ("utc", "local", "user", or an IANA timezone string).',"agents.defaults.envelopeTimestamp":'Include absolute timestamps in message envelopes ("on" or "off").',"agents.defaults.envelopeElapsed":'Include elapsed time in message envelopes ("on" or "off").',"agents.defaults.models":"Configured model catalog (keys are full provider/model IDs).","agents.defaults.memorySearch":"Vector search over MEMORY.md and memory/*.md (per-agent overrides supported).","agents.defaults.memorySearch.sources":'Sources to index for memory search (default: ["memory"]; add "sessions" to include session transcripts).',"agents.defaults.memorySearch.extraPaths":"Extra paths to include in memory search (directories or .md files; relative paths resolved from workspace).","agents.defaults.memorySearch.experimental.sessionMemory":"Enable experimental session transcript indexing for memory search (default: false).","agents.defaults.memorySearch.provider":'Embedding provider ("openai", "gemini", "voyage", or "local").',"agents.defaults.memorySearch.remote.baseUrl":"Custom base URL for remote embeddings (OpenAI-compatible proxies or Gemini overrides).","agents.defaults.memorySearch.remote.apiKey":"Custom API key for the remote embedding provider.","agents.defaults.memorySearch.remote.headers":"Extra headers for remote embeddings (merged; remote overrides OpenAI headers).","agents.defaults.memorySearch.remote.batch.enabled":"Enable batch API for memory embeddings (OpenAI/Gemini; default: true).","agents.defaults.memorySearch.remote.batch.wait":"Wait for batch completion when indexing (default: true).","agents.defaults.memorySearch.remote.batch.concurrency":"Max concurrent embedding batch jobs for memory indexing (default: 2).","agents.defaults.memorySearch.remote.batch.pollIntervalMs":"Polling interval in ms for batch status (default: 2000).","agents.defaults.memorySearch.remote.batch.timeoutMinutes":"Timeout in minutes for batch indexing (default: 60).","agents.defaults.memorySearch.local.modelPath":"Local GGUF model path or hf: URI (node-llama-cpp).","agents.defaults.memorySearch.fallback":'Fallback provider when embeddings fail ("openai", "gemini", "local", or "none").',"agents.defaults.memorySearch.store.path":"SQLite index path (default: ~/.openclaw/memory/{agentId}.sqlite).","agents.defaults.memorySearch.store.vector.enabled":"Enable sqlite-vec extension for vector search (default: true).","agents.defaults.memorySearch.store.vector.extensionPath":"Optional override path to sqlite-vec extension library (.dylib/.so/.dll).","agents.defaults.memorySearch.query.hybrid.enabled":"Enable hybrid BM25 + vector search for memory (default: true).","agents.defaults.memorySearch.query.hybrid.vectorWeight":"Weight for vector similarity when merging results (0-1).","agents.defaults.memorySearch.query.hybrid.textWeight":"Weight for BM25 text relevance when merging results (0-1).","agents.defaults.memorySearch.query.hybrid.candidateMultiplier":"Multiplier for candidate pool size (default: 4).","agents.defaults.memorySearch.cache.enabled":"Cache chunk embeddings in SQLite to speed up reindexing and frequent updates (default: true).",memory:"Memory backend configuration (global).","memory.backend":'Memory backend ("builtin" for OpenClaw embeddings, "qmd" for QMD sidecar).',"memory.citations":'Default citation behavior ("auto", "on", or "off").',"memory.qmd.command":"Path to the qmd binary (default: resolves from PATH).","memory.qmd.includeDefaultMemory":"Whether to automatically index MEMORY.md + memory/**/*.md (default: true).","memory.qmd.paths":"Additional directories/files to index with QMD (path + optional glob pattern).","memory.qmd.paths.path":"Absolute or ~-relative path to index via QMD.","memory.qmd.paths.pattern":"Glob pattern relative to the path root (default: **/*.md).","memory.qmd.paths.name":"Optional stable name for the QMD collection (default derived from path).","memory.qmd.sessions.enabled":"Enable QMD session transcript indexing (experimental, default: false).","memory.qmd.sessions.exportDir":"Override directory for sanitized session exports before indexing.","memory.qmd.sessions.retentionDays":"Retention window for exported sessions before pruning (default: unlimited).","memory.qmd.update.interval":"How often the QMD sidecar refreshes indexes (duration string, default: 5m).","memory.qmd.update.debounceMs":"Minimum delay between successive QMD refresh runs (default: 15000).","memory.qmd.update.onBoot":"Run QMD update once on gateway startup (default: true).","memory.qmd.update.embedInterval":"How often QMD embeddings are refreshed (duration string, default: 60m). Set to 0 to disable periodic embed.","memory.qmd.limits.maxResults":"Max QMD results returned to the agent loop (default: 6).","memory.qmd.limits.maxSnippetChars":"Max characters per snippet pulled from QMD (default: 700).","memory.qmd.limits.maxInjectedChars":"Max total characters injected from QMD hits per turn.","memory.qmd.limits.timeoutMs":"Per-query timeout for QMD searches (default: 4000).","memory.qmd.scope":"Session/channel scope for QMD recall (same syntax as session.sendPolicy; default: direct-only).","agents.defaults.memorySearch.cache.maxEntries":"Optional cap on cached embeddings (best-effort).","agents.defaults.memorySearch.sync.onSearch":"Lazy sync: schedule a reindex on search after changes.","agents.defaults.memorySearch.sync.watch":"Watch memory files for changes (chokidar).","agents.defaults.memorySearch.sync.sessions.deltaBytes":"Minimum appended bytes before session transcripts trigger reindex (default: 100000).","agents.defaults.memorySearch.sync.sessions.deltaMessages":"Minimum appended JSONL lines before session transcripts trigger reindex (default: 50).","plugins.enabled":"Enable plugin/extension loading (default: true).","plugins.allow":"Optional allowlist of plugin ids; when set, only listed plugins load.","plugins.deny":"Optional denylist of plugin ids; deny wins over allowlist.","plugins.load.paths":"Additional plugin files or directories to load.","plugins.slots":"Select which plugins own exclusive slots (memory, etc.).","plugins.slots.memory":'Select the active memory plugin by id, or "none" to disable memory plugins.',"plugins.entries":"Per-plugin settings keyed by plugin id (enable/disable + config payloads).","plugins.entries.*.enabled":"Overrides plugin enable/disable for this entry (restart required).","plugins.entries.*.config":"Plugin-defined config payload (schema is provided by the plugin).","plugins.installs":"CLI-managed install metadata (used by `openclaw plugins update` to locate install sources).","plugins.installs.*.source":'Install source ("npm", "archive", or "path").',"plugins.installs.*.spec":"Original npm spec used for install (if source is npm).","plugins.installs.*.sourcePath":"Original archive/path used for install (if any).","plugins.installs.*.installPath":"Resolved install directory (usually ~/.openclaw/extensions/<id>).","plugins.installs.*.version":"Version recorded at install time (if available).","plugins.installs.*.installedAt":"ISO timestamp of last install/update.","agents.list.*.identity.avatar":"Agent avatar (workspace-relative path, http(s) URL, or data URI).","agents.defaults.model.primary":"Primary model (provider/model).","agents.defaults.model.fallbacks":"Ordered fallback models (provider/model). Used when the primary model fails.","agents.defaults.imageModel.primary":"Optional image model (provider/model) used when the primary model lacks image input.","agents.defaults.imageModel.fallbacks":"Ordered fallback image models (provider/model).","agents.defaults.cliBackends":"Optional CLI backends for text-only fallback (claude-cli, etc.).","agents.defaults.humanDelay.mode":'Delay style for block replies ("off", "natural", "custom").',"agents.defaults.humanDelay.minMs":"Minimum delay in ms for custom humanDelay (default: 800).","agents.defaults.humanDelay.maxMs":"Maximum delay in ms for custom humanDelay (default: 2500).","commands.native":"Register native commands with channels that support it (Discord/Slack/Telegram).","commands.nativeSkills":"Register native skill commands (user-invocable skills) with channels that support it.","commands.text":"Allow text command parsing (slash commands only).","commands.bash":"Allow bash chat command (`!`; `/bash` alias) to run host shell commands (default: false; requires tools.elevated).","commands.bashForegroundMs":"How long bash waits before backgrounding (default: 2000; 0 backgrounds immediately).","commands.config":"Allow /config chat command to read/write config on disk (default: false).","commands.debug":"Allow /debug chat command for runtime-only overrides (default: false).","commands.restart":"Allow /restart and gateway restart tool actions (default: false).","commands.useAccessGroups":"Enforce access-group allowlists/policies for commands.","commands.ownerAllowFrom":`Explicit owner allowlist for owner-only tools/commands. Use channel-native IDs (optionally prefixed like "whatsapp:+15551234567"). '*' is ignored.`,"session.dmScope":'DM session scoping: "main" keeps continuity; "per-peer", "per-channel-peer", or "per-account-channel-peer" isolates DM history (recommended for shared inboxes/multi-account).',"session.identityLinks":"Map canonical identities to provider-prefixed peer IDs for DM session linking (example: telegram:123456).","channels.telegram.configWrites":"Allow Telegram to write config in response to channel events/commands (default: true).","channels.slack.configWrites":"Allow Slack to write config in response to channel events/commands (default: true).","channels.mattermost.configWrites":"Allow Mattermost to write config in response to channel events/commands (default: true).","channels.discord.configWrites":"Allow Discord to write config in response to channel events/commands (default: true).","channels.whatsapp.configWrites":"Allow WhatsApp to write config in response to channel events/commands (default: true).","channels.signal.configWrites":"Allow Signal to write config in response to channel events/commands (default: true).","channels.imessage.configWrites":"Allow iMessage to write config in response to channel events/commands (default: true).","channels.msteams.configWrites":"Allow Microsoft Teams to write config in response to channel events/commands (default: true).","channels.discord.commands.native":'Override native commands for Discord (bool or "auto").',"channels.discord.commands.nativeSkills":'Override native skill commands for Discord (bool or "auto").',"channels.telegram.commands.native":'Override native commands for Telegram (bool or "auto").',"channels.telegram.commands.nativeSkills":'Override native skill commands for Telegram (bool or "auto").',"channels.slack.commands.native":'Override native commands for Slack (bool or "auto").',"channels.slack.commands.nativeSkills":'Override native skill commands for Slack (bool or "auto").',"session.agentToAgent.maxPingPongTurns":"Max reply-back turns between requester and target (0–5).","channels.telegram.customCommands":"Additional Telegram bot menu commands (merged with native; conflicts ignored).","messages.ackReaction":"Emoji reaction used to acknowledge inbound messages (empty disables).","messages.ackReactionScope":'When to send ack reactions ("group-mentions", "group-all", "direct", "all").',"messages.inbound.debounceMs":"Debounce window (ms) for batching rapid inbound messages from the same sender (0 to disable).","channels.telegram.dmPolicy":'Direct message access control ("pairing" recommended). "open" requires channels.telegram.allowFrom=["*"].',"channels.telegram.streamMode":"Draft streaming mode for Telegram replies (off | partial | block). Separate from block streaming; requires private topics + sendMessageDraft.","channels.telegram.draftChunk.minChars":'Minimum chars before emitting a Telegram draft update when channels.telegram.streamMode="block" (default: 200).',"channels.telegram.draftChunk.maxChars":'Target max size for a Telegram draft update chunk when channels.telegram.streamMode="block" (default: 800; clamped to channels.telegram.textChunkLimit).',"channels.telegram.draftChunk.breakPreference":"Preferred breakpoints for Telegram draft chunks (paragraph | newline | sentence). Default: paragraph.","channels.telegram.retry.attempts":"Max retry attempts for outbound Telegram API calls (default: 3).","channels.telegram.retry.minDelayMs":"Minimum retry delay in ms for Telegram outbound calls.","channels.telegram.retry.maxDelayMs":"Maximum retry delay cap in ms for Telegram outbound calls.","channels.telegram.retry.jitter":"Jitter factor (0-1) applied to Telegram retry delays.","channels.telegram.network.autoSelectFamily":"Override Node autoSelectFamily for Telegram (true=enable, false=disable).","channels.telegram.timeoutSeconds":"Max seconds before Telegram API requests are aborted (default: 500 per grammY).","channels.whatsapp.dmPolicy":'Direct message access control ("pairing" recommended). "open" requires channels.whatsapp.allowFrom=["*"].',"channels.whatsapp.selfChatMode":"Same-phone setup (bot uses your personal WhatsApp number).","channels.whatsapp.debounceMs":"Debounce window (ms) for batching rapid consecutive messages from the same sender (0 to disable).","channels.signal.dmPolicy":'Direct message access control ("pairing" recommended). "open" requires channels.signal.allowFrom=["*"].',"channels.imessage.dmPolicy":'Direct message access control ("pairing" recommended). "open" requires channels.imessage.allowFrom=["*"].',"channels.bluebubbles.dmPolicy":'Direct message access control ("pairing" recommended). "open" requires channels.bluebubbles.allowFrom=["*"].',"channels.discord.dm.policy":'Direct message access control ("pairing" recommended). "open" requires channels.discord.dm.allowFrom=["*"].',"channels.discord.retry.attempts":"Max retry attempts for outbound Discord API calls (default: 3).","channels.discord.retry.minDelayMs":"Minimum retry delay in ms for Discord outbound calls.","channels.discord.retry.maxDelayMs":"Maximum retry delay cap in ms for Discord outbound calls.","channels.discord.retry.jitter":"Jitter factor (0-1) applied to Discord retry delays.","channels.discord.maxLinesPerMessage":"Soft max line count per Discord message (default: 17).","channels.discord.intents.presence":"Enable the Guild Presences privileged intent. Must also be enabled in the Discord Developer Portal. Allows tracking user activities (e.g. Spotify). Default: false.","channels.discord.intents.guildMembers":"Enable the Guild Members privileged intent. Must also be enabled in the Discord Developer Portal. Default: false.","channels.discord.pluralkit.enabled":"Resolve PluralKit proxied messages and treat system members as distinct senders.","channels.discord.pluralkit.token":"Optional PluralKit token for resolving private systems or members.","channels.slack.dm.policy":'Direct message access control ("pairing" recommended). "open" requires channels.slack.dm.allowFrom=["*"].'},zh:{"meta.lastTouchedVersion":"OpenClaw 写入配置时自动设置。","meta.lastTouchedAt":"最后一次配置写入的 ISO 时间戳（自动设置）。","update.channel":'git + npm 安装的更新渠道（"stable"、"beta" 或 "dev"）。',"update.checkOnStart":"网关启动时检查 npm 更新（默认：true）。","gateway.remote.url":"远程网关 WebSocket URL（ws:// 或 wss://）。","gateway.remote.tlsFingerprint":"远程网关的预期 sha256 TLS 指纹（固定以避免中间人攻击）。","gateway.remote.sshTarget":"通过 SSH 的远程网关（将网关端口隧道到 localhost）。格式：user@host 或 user@host:port。","gateway.remote.sshIdentity":"可选的 SSH 身份文件路径（传递给 ssh -i）。","agents.list.*.skills":"此代理的可选技能允许列表（省略 = 所有技能；空 = 无技能）。","agents.list[].skills":"此代理的可选技能允许列表（省略 = 所有技能；空 = 无技能）。","agents.list[].identity.avatar":"头像图片路径（仅相对于代理工作区）或远程 URL/data URL。","discovery.mdns.mode":'mDNS 广播模式（"minimal" 默认，"full" 包含 cliPath/sshPort，"off" 禁用 mDNS）。',"gateway.auth.token":"默认情况下网关访问所需（除非使用 Tailscale Serve 身份）；非回环绑定需要。","gateway.auth.password":"Tailscale funnel 需要。","gateway.controlUi.basePath":"控制台 UI 服务的可选 URL 前缀（例如 /openclaw）。","gateway.controlUi.root":"控制台 UI 资源的可选文件系统根目录（默认为 dist/control-ui）。","gateway.controlUi.allowedOrigins":"控制台 UI/WebChat websocket 连接允许的浏览器来源（仅完整来源，例如 https://control.example.com）。","gateway.controlUi.allowInsecureAuth":"允许通过不安全 HTTP 进行控制台 UI 认证（仅令牌；不推荐）。","gateway.controlUi.dangerouslyDisableDeviceAuth":"危险。禁用控制台 UI 设备身份检查（仅令牌/密码）。","gateway.http.endpoints.chatCompletions.enabled":"启用 OpenAI 兼容的 `POST /v1/chat/completions` 端点（默认：false）。","gateway.reload.mode":'配置更改的热重载策略（推荐 "hybrid"）。',"gateway.reload.debounceMs":"应用配置更改前的防抖窗口（毫秒）。","gateway.nodes.browser.mode":'节点浏览器路由（"auto" = 选择单个连接的浏览器节点，"manual" = 需要节点参数，"off" = 禁用）。',"gateway.nodes.browser.node":"将浏览器路由固定到特定节点 id 或名称（可选）。","gateway.nodes.allowCommands":"允许的额外 node.invoke 命令，超出网关默认值（命令字符串数组）。","gateway.nodes.denyCommands":"即使存在于节点声明或默认允许列表中也要阻止的命令。","nodeHost.browserProxy.enabled":"通过节点代理暴露本地浏览器控制服务器。","nodeHost.browserProxy.allowProfiles":"通过节点代理暴露的浏览器配置集名称的可选允许列表。","diagnostics.flags":'按标志启用目标诊断日志（例如 ["telegram.http"]）。支持通配符，如 "telegram.*" 或 "*"。',"diagnostics.cacheTrace.enabled":"记录嵌入代理运行的缓存跟踪快照（默认：false）。","diagnostics.cacheTrace.filePath":"缓存跟踪日志的 JSONL 输出路径（默认：$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl）。","diagnostics.cacheTrace.includeMessages":"在跟踪输出中包含完整消息负载（默认：true）。","diagnostics.cacheTrace.includePrompt":"在跟踪输出中包含提示文本（默认：true）。","diagnostics.cacheTrace.includeSystem":"在跟踪输出中包含系统提示（默认：true）。","tools.exec.applyPatch.enabled":"实验性。在工具策略允许时，为 OpenAI 模型启用 apply_patch。","tools.exec.applyPatch.allowModels":'模型 id 的可选允许列表（例如 "gpt-5.2" 或 "openai/gpt-5.2"）。',"tools.exec.notifyOnExit":"当为 true（默认）时，后台 exec 会话在退出时排队系统事件并请求心跳。","tools.exec.pathPrepend":"为 exec 运行前置到 PATH 的目录（网关/沙箱）。","tools.exec.safeBins":"允许仅 stdin 的安全二进制文件在没有显式允许列表条目的情况下运行。","tools.message.allowCrossContextSend":"遗留覆盖：允许跨所有提供方的跨上下文发送。","tools.message.crossContext.allowWithinProvider":"允许发送到同一提供方内的其他通道（默认：true）。","tools.message.crossContext.allowAcrossProviders":"允许跨不同提供方发送（默认：false）。","tools.message.crossContext.marker.enabled":"发送跨上下文时添加可见的来源标记（默认：true）。","tools.message.crossContext.marker.prefix":'跨上下文标记的文本前缀（支持 "{channel}"）。',"tools.message.crossContext.marker.suffix":'跨上下文标记的文本后缀（支持 "{channel}"）。',"tools.message.broadcast.enabled":"启用广播操作（默认：true）。","tools.web.search.enabled":"启用 web_search 工具（需要提供方 API 密钥）。","tools.web.search.provider":'搜索提供方（"brave" 或 "perplexity"）。',"tools.web.search.apiKey":"Brave Search API 密钥（回退：BRAVE_API_KEY 环境变量）。","tools.web.search.maxResults":"默认返回的结果数（1-10）。","tools.web.search.timeoutSeconds":"web_search 请求的超时（秒）。","tools.web.search.cacheTtlMinutes":"web_search 结果的缓存 TTL（分钟）。","tools.web.search.perplexity.apiKey":"Perplexity 或 OpenRouter API 密钥（回退：PERPLEXITY_API_KEY 或 OPENROUTER_API_KEY 环境变量）。","tools.web.search.perplexity.baseUrl":"Perplexity base URL 覆盖（默认：https://openrouter.ai/api/v1 或 https://api.perplexity.ai）。","tools.web.search.perplexity.model":'Perplexity 模型覆盖（默认："perplexity/sonar-pro"）。',"tools.web.fetch.enabled":"启用 web_fetch 工具（轻量级 HTTP 获取）。","tools.web.fetch.maxChars":"web_fetch 返回的最大字符数（截断）。","tools.web.fetch.maxCharsCap":"web_fetch maxChars 的硬上限（适用于配置和工具调用）。","tools.web.fetch.timeoutSeconds":"web_fetch 请求的超时（秒）。","tools.web.fetch.cacheTtlMinutes":"web_fetch 结果的缓存 TTL（分钟）。","tools.web.fetch.maxRedirects":"web_fetch 允许的最大重定向数（默认：3）。","tools.web.fetch.userAgent":"覆盖 web_fetch 请求的 User-Agent 头。","tools.web.fetch.readability":"使用 Readability 从 HTML 中提取主要内容（回退到基本 HTML 清理）。","tools.web.fetch.firecrawl.enabled":"启用 Firecrawl 回退用于 web_fetch（如果已配置）。","tools.web.fetch.firecrawl.apiKey":"Firecrawl API 密钥（回退：FIRECRAWL_API_KEY 环境变量）。","tools.web.fetch.firecrawl.baseUrl":"Firecrawl base URL（例如 https://api.firecrawl.dev 或自定义端点）。","tools.web.fetch.firecrawl.onlyMainContent":"当为 true 时，Firecrawl 仅返回主要内容（默认：true）。","tools.web.fetch.firecrawl.maxAgeMs":"Firecrawl maxAge（毫秒），用于 API 支持时的缓存结果。","tools.web.fetch.firecrawl.timeoutSeconds":"Firecrawl 请求的超时（秒）。","channels.slack.allowBots":"允许机器人撰写的消息触发 Slack 回复（默认：false）。","channels.slack.thread.historyScope":'Slack 线程历史上下文的范围（"thread" 隔离每个线程；"channel" 重用通道历史）。',"channels.slack.thread.inheritParent":"如果为 true，Slack 线程会话继承父通道转录（默认：false）。","channels.mattermost.botToken":"来自 Mattermost 系统控制台 -> 集成 -> 机器人账户的机器人令牌。","channels.mattermost.baseUrl":"您的 Mattermost 服务器的 Base URL（例如，https://chat.example.com）。","channels.mattermost.chatmode":'在提及（"oncall"）、触发字符（">" 或 "!"）（"onchar"）或每条消息（"onmessage"）时回复通道消息。',"channels.mattermost.oncharPrefixes":'onchar 模式的触发前缀（默认：[">", "!"]）。',"channels.mattermost.requireMention":"在回复前要求在通道中 @提及（默认：true）。","auth.profiles":"命名的认证配置集（提供方 + 模式 + 可选电子邮件）。","auth.order":"每个提供方的有序认证配置集 ID（用于自动故障转移）。","auth.cooldowns.billingBackoffHours":"当配置集因计费/积分不足而失败时的基本退避（小时）（默认：5）。","auth.cooldowns.billingBackoffHoursByProvider":"每个提供方的计费退避可选覆盖（小时）。","auth.cooldowns.billingMaxHours":"计费退避的上限（小时）（默认：24）。","auth.cooldowns.failureWindowHours":"退避计数器的故障窗口（小时）（默认：24）。","agents.defaults.bootstrapMaxChars":"在截断前注入系统提示的每个工作区引导文件的最大字符数（默认：20000）。","agents.defaults.repoRoot":"在系统提示运行时行中显示的可选仓库根目录（覆盖自动检测）。","agents.defaults.envelopeTimezone":'消息信封的时区（"utc"、"local"、"user" 或 IANA 时区字符串）。',"agents.defaults.envelopeTimestamp":'在消息信封中包含绝对时间戳（"on" 或 "off"）。',"agents.defaults.envelopeElapsed":'在消息信封中包含经过时间（"on" 或 "off"）。',"agents.defaults.models":"配置的模型目录（键是完整的提供方/模型 ID）。","agents.defaults.memorySearch":"对 MEMORY.md 和 memory/*.md 的向量搜索（支持每个代理的覆盖）。","agents.defaults.memorySearch.sources":'记忆搜索的索引来源（默认：["memory"]；添加 "sessions" 以包含会话转录）。',"agents.defaults.memorySearch.extraPaths":"记忆搜索中包含的额外路径（目录或 .md 文件；相对路径从工作区解析）。","agents.defaults.memorySearch.experimental.sessionMemory":"启用实验性会话转录索引用于记忆搜索（默认：false）。","agents.defaults.memorySearch.provider":'嵌入提供方（"openai"、"gemini"、"voyage" 或 "local"）。',"agents.defaults.memorySearch.remote.baseUrl":"远程嵌入的自定义 base URL（OpenAI 兼容代理或 Gemini 覆盖）。","agents.defaults.memorySearch.remote.apiKey":"远程嵌入提供方的自定义 API 密钥。","agents.defaults.memorySearch.remote.headers":"远程嵌入的额外请求头（合并；远程覆盖 OpenAI 请求头）。","agents.defaults.memorySearch.remote.batch.enabled":"启用记忆嵌入的批处理 API（OpenAI/Gemini；默认：true）。","agents.defaults.memorySearch.remote.batch.wait":"索引时等待批处理完成（默认：true）。","agents.defaults.memorySearch.remote.batch.concurrency":"记忆索引的最大并发嵌入批处理作业数（默认：2）。","agents.defaults.memorySearch.remote.batch.pollIntervalMs":"批处理状态轮询间隔（毫秒）（默认：2000）。","agents.defaults.memorySearch.remote.batch.timeoutMinutes":"批处理索引的超时（分钟）（默认：60）。","agents.defaults.memorySearch.local.modelPath":"本地 GGUF 模型路径或 hf: URI（node-llama-cpp）。","agents.defaults.memorySearch.fallback":'嵌入失败时的回退提供方（"openai"、"gemini"、"local" 或 "none"）。',"agents.defaults.memorySearch.store.path":"SQLite 索引路径（默认：~/.openclaw/memory/{agentId}.sqlite）。","agents.defaults.memorySearch.store.vector.enabled":"启用 sqlite-vec 扩展用于向量搜索（默认：true）。","agents.defaults.memorySearch.store.vector.extensionPath":"sqlite-vec 扩展库的可选覆盖路径（.dylib/.so/.dll）。","agents.defaults.memorySearch.query.hybrid.enabled":"启用混合 BM25 + 向量搜索用于记忆（默认：true）。","agents.defaults.memorySearch.query.hybrid.vectorWeight":"合并结果时向量相似度的权重（0-1）。","agents.defaults.memorySearch.query.hybrid.textWeight":"合并结果时 BM25 文本相关性的权重（0-1）。","agents.defaults.memorySearch.query.hybrid.candidateMultiplier":"候选池大小的倍数（默认：4）。","agents.defaults.memorySearch.cache.enabled":"在 SQLite 中缓存块嵌入以加速重新索引和频繁更新（默认：true）。",memory:"记忆后端配置（全局）。","memory.backend":'记忆后端（"builtin" 用于 OpenClaw 嵌入，"qmd" 用于 QMD 侧车）。',"memory.citations":'默认引用行为（"auto"、"on" 或 "off"）。',"memory.qmd.command":"qmd 可执行文件的路径（默认：从 PATH 解析）。","memory.qmd.includeDefaultMemory":"是否自动索引 MEMORY.md + memory/**/*.md（默认：true）。","memory.qmd.paths":"使用 QMD 索引的额外目录/文件（路径 + 可选 glob 模式）。","memory.qmd.paths.path":"通过 QMD 索引的绝对或 ~ 相对路径。","memory.qmd.paths.pattern":"相对于路径根的 Glob 模式（默认：**/*.md）。","memory.qmd.paths.name":"QMD 集合的可选稳定名称（默认从路径派生）。","memory.qmd.sessions.enabled":"启用 QMD 会话转录索引（实验性，默认：false）。","memory.qmd.sessions.exportDir":"索引前清理会话导出的覆盖目录。","memory.qmd.sessions.retentionDays":"修剪前导出会话的保留窗口（默认：无限制）。","memory.qmd.update.interval":"QMD 侧车刷新索引的频率（持续时间字符串，默认：5m）。","memory.qmd.update.debounceMs":"连续 QMD 刷新运行之间的最小延迟（默认：15000）。","memory.qmd.update.onBoot":"在网关启动时运行一次 QMD 更新（默认：true）。","memory.qmd.update.embedInterval":"QMD 嵌入刷新的频率（持续时间字符串，默认：60m）。设置为 0 以禁用定期嵌入。","memory.qmd.limits.maxResults":"返回到代理循环的最大 QMD 结果数（默认：6）。","memory.qmd.limits.maxSnippetChars":"从 QMD 拉取的每个片段的最大字符数（默认：700）。","memory.qmd.limits.maxInjectedChars":"每轮从 QMD 命中注入的最大总字符数。","memory.qmd.limits.timeoutMs":"QMD 搜索的每次查询超时（默认：4000）。","memory.qmd.scope":"QMD 召回会话/通道范围（与 session.sendPolicy 相同的语法；默认：仅直接）。","agents.defaults.memorySearch.cache.maxEntries":"缓存嵌入的可选上限（尽力而为）。","agents.defaults.memorySearch.sync.onSearch":"懒同步：在更改后搜索时安排重新索引。","agents.defaults.memorySearch.sync.watch":"监听记忆文件的更改（chokidar）。","agents.defaults.memorySearch.sync.sessions.deltaBytes":"会话转录触发重新索引前的最小追加字节数（默认：100000）。","agents.defaults.memorySearch.sync.sessions.deltaMessages":"会话转录触发重新索引前的最小追加 JSONL 行数（默认：50）。","plugins.enabled":"启用插件/扩展加载（默认：true）。","plugins.allow":"插件 id 的可选允许列表；设置时，仅加载列出的插件。","plugins.deny":"插件 id 的可选拒绝列表；拒绝优先于允许列表。","plugins.load.paths":"要加载的额外插件文件或目录。","plugins.slots":"选择哪些插件拥有独占槽位（记忆等）。","plugins.slots.memory":'按 id 选择活动记忆插件，或 "none" 以禁用记忆插件。',"plugins.entries":"按插件 id 键控的每个插件设置（启用/禁用 + 配置负载）。","plugins.entries.*.enabled":"覆盖此条目的插件启用/禁用（需要重启）。","plugins.entries.*.config":"插件定义的配置负载（模式由插件提供）。","plugins.installs":"CLI 管理的安装元数据（由 `openclaw plugins update` 用于定位安装来源）。","plugins.installs.*.source":'安装来源（"npm"、"archive" 或 "path"）。',"plugins.installs.*.spec":"用于安装的原始 npm 规格（如果来源是 npm）。","plugins.installs.*.sourcePath":"用于安装的原始存档/路径（如果有）。","plugins.installs.*.installPath":"解析的安装目录（通常是 ~/.openclaw/extensions/<id>）。","plugins.installs.*.version":"安装时记录的版本（如果可用）。","plugins.installs.*.installedAt":"最后一次安装/更新的 ISO 时间戳。","agents.list.*.identity.avatar":"代理头像（工作区相对路径、http(s) URL 或 data URI）。","agents.defaults.model.primary":"主模型（提供方/模型）。","agents.defaults.model.fallbacks":"有序回退模型（提供方/模型）。当主模型失败时使用。","agents.defaults.imageModel.primary":"当主模型缺少图像输入时使用的可选图像模型（提供方/模型）。","agents.defaults.imageModel.fallbacks":"有序回退图像模型（提供方/模型）。","agents.defaults.cliBackends":"用于仅文本回退的可选 CLI 后端（claude-cli 等）。","agents.defaults.humanDelay.mode":'块回复的延迟样式（"off"、"natural"、"custom"）。',"agents.defaults.humanDelay.minMs":"自定义 humanDelay 的最小延迟（毫秒）（默认：800）。","agents.defaults.humanDelay.maxMs":"自定义 humanDelay 的最大延迟（毫秒）（默认：2500）。","commands.native":"向支持它的通道注册原生命令（Discord/Slack/Telegram）。","commands.nativeSkills":"向支持它的通道注册原生技能命令（用户可调用的技能）。","commands.text":"允许文本命令解析（仅斜杠命令）。","commands.bash":"允许 bash 聊天命令（`!`；`/bash` 别名）运行主机 shell 命令（默认：false；需要 tools.elevated）。","commands.bashForegroundMs":"bash 在后台化之前等待的时间（默认：2000；0 立即后台化）。","commands.config":"允许 /config 聊天命令在磁盘上读取/写入配置（默认：false）。","commands.debug":"允许 /debug 聊天命令进行仅运行时覆盖（默认：false）。","commands.restart":"允许 /restart 和网关重启工具操作（默认：false）。","commands.useAccessGroups":"强制执行访问组允许列表/策略用于命令。","commands.ownerAllowFrom":`仅所有者工具/命令的显式所有者允许列表。使用通道原生 ID（可选前缀，如 "whatsapp:+15551234567"）。'*' 被忽略。`,"session.dmScope":'私信会话范围："main" 保持连续性；"per-peer"、"per-channel-peer" 或 "per-account-channel-peer" 隔离私信历史（推荐用于共享收件箱/多账户）。',"session.identityLinks":"将规范身份映射到提供方前缀的对等 ID 用于私信会话链接（示例：telegram:123456）。","channels.telegram.configWrites":"允许 Telegram 响应通道事件/命令写入配置（默认：true）。","channels.slack.configWrites":"允许 Slack 响应通道事件/命令写入配置（默认：true）。","channels.mattermost.configWrites":"允许 Mattermost 响应通道事件/命令写入配置（默认：true）。","channels.discord.configWrites":"允许 Discord 响应通道事件/命令写入配置（默认：true）。","channels.whatsapp.configWrites":"允许 WhatsApp 响应通道事件/命令写入配置（默认：true）。","channels.signal.configWrites":"允许 Signal 响应通道事件/命令写入配置（默认：true）。","channels.imessage.configWrites":"允许 iMessage 响应通道事件/命令写入配置（默认：true）。","channels.msteams.configWrites":"允许 Microsoft Teams 响应通道事件/命令写入配置（默认：true）。","channels.discord.commands.native":'覆盖 Discord 的原生命令（bool 或 "auto"）。',"channels.discord.commands.nativeSkills":'覆盖 Discord 的原生技能命令（bool 或 "auto"）。',"channels.telegram.commands.native":'覆盖 Telegram 的原生命令（bool 或 "auto"）。',"channels.telegram.commands.nativeSkills":'覆盖 Telegram 的原生技能命令（bool 或 "auto"）。',"channels.slack.commands.native":'覆盖 Slack 的原生命令（bool 或 "auto"）。',"channels.slack.commands.nativeSkills":'覆盖 Slack 的原生技能命令（bool 或 "auto"）。',"session.agentToAgent.maxPingPongTurns":"请求者和目标之间的最大回复轮数（0–5）。","channels.telegram.customCommands":"额外的 Telegram 机器人菜单命令（与原生命令合并；冲突被忽略）。","messages.ackReaction":"用于确认入站消息的表情符号反应（空则禁用）。","messages.ackReactionScope":'何时发送确认反应（"group-mentions"、"group-all"、"direct"、"all"）。',"messages.inbound.debounceMs":"批处理来自同一发送者的快速入站消息的防抖窗口（毫秒）（0 以禁用）。","channels.telegram.dmPolicy":'直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.telegram.allowFrom=["*"]。',"channels.telegram.streamMode":"Telegram 回复的草稿流模式（off | partial | block）。与块流分离；需要私有主题 + sendMessageDraft。","channels.telegram.draftChunk.minChars":'当 channels.telegram.streamMode="block" 时，发出 Telegram 草稿更新前的最小字符数（默认：200）。',"channels.telegram.draftChunk.maxChars":'当 channels.telegram.streamMode="block" 时，Telegram 草稿更新块的目标最大大小（默认：800；限制为 channels.telegram.textChunkLimit）。',"channels.telegram.draftChunk.breakPreference":"Telegram 草稿块的首选断点（paragraph | newline | sentence）。默认：paragraph。","channels.telegram.retry.attempts":"出站 Telegram API 调用的最大重试次数（默认：3）。","channels.telegram.retry.minDelayMs":"Telegram 出站调用的最小重试延迟（毫秒）。","channels.telegram.retry.maxDelayMs":"Telegram 出站调用的最大重试延迟上限（毫秒）。","channels.telegram.retry.jitter":"应用于 Telegram 重试延迟的抖动因子（0-1）。","channels.telegram.network.autoSelectFamily":"覆盖 Telegram 的 Node autoSelectFamily（true=启用，false=禁用）。","channels.telegram.timeoutSeconds":"Telegram API 请求中止前的最大秒数（默认：500 per grammY）。","channels.whatsapp.dmPolicy":'直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.whatsapp.allowFrom=["*"]。',"channels.whatsapp.selfChatMode":"同手机设置（机器人使用您的个人 WhatsApp 号码）。","channels.whatsapp.debounceMs":"批处理来自同一发送者的快速连续消息的防抖窗口（毫秒）（0 以禁用）。","channels.signal.dmPolicy":'直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.signal.allowFrom=["*"]。',"channels.imessage.dmPolicy":'直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.imessage.allowFrom=["*"]。',"channels.bluebubbles.dmPolicy":'直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.bluebubbles.allowFrom=["*"]。',"channels.discord.dm.policy":'直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.discord.dm.allowFrom=["*"]。',"channels.discord.retry.attempts":"出站 Discord API 调用的最大重试次数（默认：3）。","channels.discord.retry.minDelayMs":"Discord 出站调用的最小重试延迟（毫秒）。","channels.discord.retry.maxDelayMs":"Discord 出站调用的最大重试延迟上限（毫秒）。","channels.discord.retry.jitter":"应用于 Discord 重试延迟的抖动因子（0-1）。","channels.discord.maxLinesPerMessage":"每个 Discord 消息的软最大行数（默认：17）。","channels.discord.intents.presence":"启用 Guild Presences 特权意图。还必须在 Discord 开发者门户中启用。允许跟踪用户活动（例如 Spotify）。默认：false。","channels.discord.intents.guildMembers":"启用 Guild Members 特权意图。还必须在 Discord 开发者门户中启用。默认：false。","channels.discord.pluralkit.enabled":"解析 PluralKit 代理消息并将系统成员视为不同的发送者。","channels.discord.pluralkit.token":"用于解析私有系统或成员的可选 PluralKit 令牌。","channels.slack.dm.policy":'直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.slack.dm.allowFrom=["*"]。'}};function Ge(e,t){const n=_a(),s=Lp[n];for(const a of Ep(e)){const i=s[a];if(i)return i}return t}function Ip(e){const t=Nt(e),n=e.map(a=>typeof a=="number"?"*":a).join("."),s=n.replace(/\.\*/g,"[]");return[t,n,s]}const Dp={en:{"meta.lastTouchedVersion":"Config Last Touched Version","meta.lastTouchedAt":"Config Last Touched At","update.channel":"Update Channel","update.checkOnStart":"Update Check on Start","diagnostics.enabled":"Diagnostics Enabled","diagnostics.flags":"Diagnostics Flags","diagnostics.otel.enabled":"OpenTelemetry Enabled","diagnostics.otel.endpoint":"OpenTelemetry Endpoint","diagnostics.otel.protocol":"OpenTelemetry Protocol","diagnostics.otel.headers":"OpenTelemetry Headers","diagnostics.otel.serviceName":"OpenTelemetry Service Name","diagnostics.otel.traces":"OpenTelemetry Traces Enabled","diagnostics.otel.metrics":"OpenTelemetry Metrics Enabled","diagnostics.otel.logs":"OpenTelemetry Logs Enabled","diagnostics.otel.sampleRate":"OpenTelemetry Trace Sample Rate","diagnostics.otel.flushIntervalMs":"OpenTelemetry Flush Interval (ms)","diagnostics.cacheTrace.enabled":"Cache Trace Enabled","diagnostics.cacheTrace.filePath":"Cache Trace File Path","diagnostics.cacheTrace.includeMessages":"Cache Trace Include Messages","diagnostics.cacheTrace.includePrompt":"Cache Trace Include Prompt","diagnostics.cacheTrace.includeSystem":"Cache Trace Include System","agents.list.*.identity.avatar":"Identity Avatar","agents.list.*.skills":"Agent Skill Filter","gateway.remote.url":"Remote Gateway URL","gateway.remote.sshTarget":"Remote Gateway SSH Target","gateway.remote.sshIdentity":"Remote Gateway SSH Identity","gateway.remote.token":"Remote Gateway Token","gateway.remote.password":"Remote Gateway Password","gateway.remote.tlsFingerprint":"Remote Gateway TLS Fingerprint","gateway.auth.token":"Gateway Token","gateway.auth.password":"Gateway Password","tools.media.image.enabled":"Enable Image Understanding","tools.media.image.maxBytes":"Image Understanding Max Bytes","tools.media.image.maxChars":"Image Understanding Max Chars","tools.media.image.prompt":"Image Understanding Prompt","tools.media.image.timeoutSeconds":"Image Understanding Timeout (sec)","tools.media.image.attachments":"Image Understanding Attachment Policy","tools.media.image.models":"Image Understanding Models","tools.media.image.scope":"Image Understanding Scope","tools.media.models":"Media Understanding Shared Models","tools.media.concurrency":"Media Understanding Concurrency","tools.media.audio.enabled":"Enable Audio Understanding","tools.media.audio.maxBytes":"Audio Understanding Max Bytes","tools.media.audio.maxChars":"Audio Understanding Max Chars","tools.media.audio.prompt":"Audio Understanding Prompt","tools.media.audio.timeoutSeconds":"Audio Understanding Timeout (sec)","tools.media.audio.language":"Audio Understanding Language","tools.media.audio.attachments":"Audio Understanding Attachment Policy","tools.media.audio.models":"Audio Understanding Models","tools.media.audio.scope":"Audio Understanding Scope","tools.media.video.enabled":"Enable Video Understanding","tools.media.video.maxBytes":"Video Understanding Max Bytes","tools.media.video.maxChars":"Video Understanding Max Chars","tools.media.video.prompt":"Video Understanding Prompt","tools.media.video.timeoutSeconds":"Video Understanding Timeout (sec)","tools.media.video.attachments":"Video Understanding Attachment Policy","tools.media.video.models":"Video Understanding Models","tools.media.video.scope":"Video Understanding Scope","tools.links.enabled":"Enable Link Understanding","tools.links.maxLinks":"Link Understanding Max Links","tools.links.timeoutSeconds":"Link Understanding Timeout (sec)","tools.links.models":"Link Understanding Models","tools.links.scope":"Link Understanding Scope","tools.profile":"Tool Profile","tools.alsoAllow":"Tool Allowlist Additions","agents.list[].tools.profile":"Agent Tool Profile","agents.list[].tools.alsoAllow":"Agent Tool Allowlist Additions","tools.byProvider":"Tool Policy by Provider","agents.list[].tools.byProvider":"Agent Tool Policy by Provider","tools.exec.applyPatch.enabled":"Enable apply_patch","tools.exec.applyPatch.allowModels":"apply_patch Model Allowlist","tools.exec.notifyOnExit":"Exec Notify On Exit","tools.exec.approvalRunningNoticeMs":"Exec Approval Running Notice (ms)","tools.exec.host":"Exec Host","tools.exec.security":"Exec Security","tools.exec.ask":"Exec Ask","tools.exec.node":"Exec Node Binding","tools.exec.pathPrepend":"Exec PATH Prepend","tools.exec.safeBins":"Exec Safe Bins","tools.message.allowCrossContextSend":"Allow Cross-Context Messaging","tools.message.crossContext.allowWithinProvider":"Allow Cross-Context (Same Provider)","tools.message.crossContext.allowAcrossProviders":"Allow Cross-Context (Across Providers)","tools.message.crossContext.marker.enabled":"Cross-Context Marker","tools.message.crossContext.marker.prefix":"Cross-Context Marker Prefix","tools.message.crossContext.marker.suffix":"Cross-Context Marker Suffix","tools.message.broadcast.enabled":"Enable Message Broadcast","tools.web.search.enabled":"Enable Web Search Tool","tools.web.search.provider":"Web Search Provider","tools.web.search.apiKey":"Brave Search API Key","tools.web.search.maxResults":"Web Search Max Results","tools.web.search.timeoutSeconds":"Web Search Timeout (sec)","tools.web.search.cacheTtlMinutes":"Web Search Cache TTL (min)","tools.web.fetch.enabled":"Enable Web Fetch Tool","tools.web.fetch.maxChars":"Web Fetch Max Chars","tools.web.fetch.timeoutSeconds":"Web Fetch Timeout (sec)","tools.web.fetch.cacheTtlMinutes":"Web Fetch Cache TTL (min)","tools.web.fetch.maxRedirects":"Web Fetch Max Redirects","tools.web.fetch.userAgent":"Web Fetch User-Agent","gateway.controlUi.basePath":"Control UI Base Path","gateway.controlUi.root":"Control UI Assets Root","gateway.controlUi.allowedOrigins":"Control UI Allowed Origins","gateway.controlUi.allowInsecureAuth":"Allow Insecure Control UI Auth","gateway.controlUi.dangerouslyDisableDeviceAuth":"Dangerously Disable Control UI Device Auth","gateway.http.endpoints.chatCompletions.enabled":"OpenAI Chat Completions Endpoint","gateway.reload.mode":"Config Reload Mode","gateway.reload.debounceMs":"Config Reload Debounce (ms)","gateway.nodes.browser.mode":"Gateway Node Browser Mode","gateway.nodes.browser.node":"Gateway Node Browser Pin","gateway.nodes.allowCommands":"Gateway Node Allowlist (Extra Commands)","gateway.nodes.denyCommands":"Gateway Node Denylist","nodeHost.browserProxy.enabled":"Node Browser Proxy Enabled","nodeHost.browserProxy.allowProfiles":"Node Browser Proxy Allowed Profiles","skills.load.watch":"Watch Skills","skills.load.watchDebounceMs":"Skills Watch Debounce (ms)","agents.defaults.workspace":"Workspace","agents.defaults.repoRoot":"Repo Root","agents.defaults.bootstrapMaxChars":"Bootstrap Max Chars","agents.defaults.envelopeTimezone":"Envelope Timezone","agents.defaults.envelopeTimestamp":"Envelope Timestamp","agents.defaults.envelopeElapsed":"Envelope Elapsed","agents.defaults.memorySearch":"Memory Search","agents.defaults.memorySearch.enabled":"Enable Memory Search","agents.defaults.memorySearch.sources":"Memory Search Sources","agents.defaults.memorySearch.extraPaths":"Extra Memory Paths","agents.defaults.memorySearch.experimental.sessionMemory":"Memory Search Session Index (Experimental)","agents.defaults.memorySearch.provider":"Memory Search Provider","agents.defaults.memorySearch.remote.baseUrl":"Remote Embedding Base URL","agents.defaults.memorySearch.remote.apiKey":"Remote Embedding API Key","agents.defaults.memorySearch.remote.headers":"Remote Embedding Headers","agents.defaults.memorySearch.remote.batch.concurrency":"Remote Batch Concurrency","agents.defaults.memorySearch.model":"Memory Search Model","agents.defaults.memorySearch.fallback":"Memory Search Fallback","agents.defaults.memorySearch.local.modelPath":"Local Embedding Model Path","agents.defaults.memorySearch.store.path":"Memory Search Index Path","agents.defaults.memorySearch.store.vector.enabled":"Memory Search Vector Index","agents.defaults.memorySearch.store.vector.extensionPath":"Memory Search Vector Extension Path","agents.defaults.memorySearch.chunking.tokens":"Memory Chunk Tokens","agents.defaults.memorySearch.chunking.overlap":"Memory Chunk Overlap Tokens","agents.defaults.memorySearch.sync.onSessionStart":"Index on Session Start","agents.defaults.memorySearch.sync.onSearch":"Index on Search (Lazy)","agents.defaults.memorySearch.sync.watch":"Watch Memory Files","agents.defaults.memorySearch.sync.watchDebounceMs":"Memory Watch Debounce (ms)","agents.defaults.memorySearch.sync.sessions.deltaBytes":"Session Delta Bytes","agents.defaults.memorySearch.sync.sessions.deltaMessages":"Session Delta Messages","agents.defaults.memorySearch.query.maxResults":"Memory Search Max Results","agents.defaults.memorySearch.query.minScore":"Memory Search Min Score","agents.defaults.memorySearch.query.hybrid.enabled":"Memory Search Hybrid","agents.defaults.memorySearch.query.hybrid.vectorWeight":"Memory Search Vector Weight","agents.defaults.memorySearch.query.hybrid.textWeight":"Memory Search Text Weight","agents.defaults.memorySearch.query.hybrid.candidateMultiplier":"Memory Search Hybrid Candidate Multiplier","agents.defaults.memorySearch.cache.enabled":"Memory Search Embedding Cache","agents.defaults.memorySearch.cache.maxEntries":"Memory Search Embedding Cache Max Entries",memory:"Memory","memory.backend":"Memory Backend","memory.citations":"Memory Citations Mode","memory.qmd.command":"QMD Binary","memory.qmd.includeDefaultMemory":"QMD Include Default Memory","memory.qmd.paths":"QMD Extra Paths","memory.qmd.paths.path":"QMD Path","memory.qmd.paths.pattern":"QMD Path Pattern","memory.qmd.paths.name":"QMD Path Name","memory.qmd.sessions.enabled":"QMD Session Indexing","memory.qmd.sessions.exportDir":"QMD Session Export Directory","memory.qmd.sessions.retentionDays":"QMD Session Retention (days)","memory.qmd.update.interval":"QMD Update Interval","memory.qmd.update.debounceMs":"QMD Update Debounce (ms)","memory.qmd.update.onBoot":"QMD Update on Startup","memory.qmd.update.embedInterval":"QMD Embed Interval","memory.qmd.limits.maxResults":"QMD Max Results","memory.qmd.limits.maxSnippetChars":"QMD Max Snippet Chars","memory.qmd.limits.maxInjectedChars":"QMD Max Injected Chars","memory.qmd.limits.timeoutMs":"QMD Search Timeout (ms)","memory.qmd.scope":"QMD Surface Scope","auth.profiles":"Auth Profiles","auth.order":"Auth Profile Order","auth.cooldowns.billingBackoffHours":"Billing Backoff (hours)","auth.cooldowns.billingBackoffHoursByProvider":"Billing Backoff Overrides","auth.cooldowns.billingMaxHours":"Billing Backoff Cap (hours)","auth.cooldowns.failureWindowHours":"Failover Window (hours)","agents.defaults.models":"Models","agents.defaults.model.primary":"Primary Model","agents.defaults.model.fallbacks":"Model Fallbacks","agents.defaults.imageModel.primary":"Image Model","agents.defaults.imageModel.fallbacks":"Image Model Fallbacks","agents.defaults.humanDelay.mode":"Human Delay Mode","agents.defaults.humanDelay.minMs":"Human Delay Min (ms)","agents.defaults.humanDelay.maxMs":"Human Delay Max (ms)","agents.defaults.cliBackends":"CLI Backends","commands.native":"Native Commands","commands.nativeSkills":"Native Skill Commands","commands.text":"Text Commands","commands.bash":"Allow Bash Chat Command","commands.bashForegroundMs":"Bash Foreground Window (ms)","commands.config":"Allow /config","commands.debug":"Allow /debug","commands.restart":"Allow Restart","commands.useAccessGroups":"Use Access Groups","commands.ownerAllowFrom":"Command Owners","ui.seamColor":"Accent Color","ui.assistant.name":"Assistant Name","ui.assistant.avatar":"Assistant Avatar","browser.evaluateEnabled":"Browser Evaluate Enabled","browser.snapshotDefaults":"Browser Snapshot Defaults","browser.snapshotDefaults.mode":"Browser Snapshot Mode","browser.remoteCdpTimeoutMs":"Remote CDP Timeout (ms)","browser.remoteCdpHandshakeTimeoutMs":"Remote CDP Handshake Timeout (ms)","session.dmScope":"DM Session Scope","session.agentToAgent.maxPingPongTurns":"Agent-to-Agent Ping-Pong Turns","messages.ackReaction":"Ack Reaction Emoji","messages.ackReactionScope":"Ack Reaction Scope","messages.inbound.debounceMs":"Inbound Message Debounce (ms)","talk.apiKey":"Talk API Key","channels.whatsapp":"WhatsApp","channels.telegram":"Telegram","channels.telegram.customCommands":"Telegram Custom Commands","channels.discord":"Discord","channels.slack":"Slack","channels.mattermost":"Mattermost","channels.signal":"Signal","channels.imessage":"iMessage","channels.bluebubbles":"BlueBubbles","channels.msteams":"MS Teams","channels.telegram.botToken":"Telegram Bot Token","channels.telegram.dmPolicy":"Telegram DM Policy","channels.telegram.streamMode":"Telegram Draft Stream Mode","channels.telegram.draftChunk.minChars":"Telegram Draft Chunk Min Chars","channels.telegram.draftChunk.maxChars":"Telegram Draft Chunk Max Chars","channels.telegram.draftChunk.breakPreference":"Telegram Draft Chunk Break Preference","channels.telegram.retry.attempts":"Telegram Retry Attempts","channels.telegram.retry.minDelayMs":"Telegram Retry Min Delay (ms)","channels.telegram.retry.maxDelayMs":"Telegram Retry Max Delay (ms)","channels.telegram.retry.jitter":"Telegram Retry Jitter","channels.telegram.network.autoSelectFamily":"Telegram autoSelectFamily","channels.telegram.timeoutSeconds":"Telegram API Timeout (seconds)","channels.telegram.capabilities.inlineButtons":"Telegram Inline Buttons","channels.whatsapp.dmPolicy":"WhatsApp DM Policy","channels.whatsapp.selfChatMode":"WhatsApp Self-Phone Mode","channels.whatsapp.debounceMs":"WhatsApp Message Debounce (ms)","channels.signal.dmPolicy":"Signal DM Policy","channels.imessage.dmPolicy":"iMessage DM Policy","channels.bluebubbles.dmPolicy":"BlueBubbles DM Policy","channels.discord.dm.policy":"Discord DM Policy","channels.discord.retry.attempts":"Discord Retry Attempts","channels.discord.retry.minDelayMs":"Discord Retry Min Delay (ms)","channels.discord.retry.maxDelayMs":"Discord Retry Max Delay (ms)","channels.discord.retry.jitter":"Discord Retry Jitter","channels.discord.maxLinesPerMessage":"Discord Max Lines Per Message","channels.discord.intents.presence":"Discord Presence Intent","channels.discord.intents.guildMembers":"Discord Guild Members Intent","channels.discord.pluralkit.enabled":"Discord PluralKit Enabled","channels.discord.pluralkit.token":"Discord PluralKit Token","channels.slack.dm.policy":"Slack DM Policy","channels.slack.allowBots":"Slack Allow Bot Messages","channels.discord.token":"Discord Bot Token","channels.slack.botToken":"Slack Bot Token","channels.slack.appToken":"Slack App Token","channels.slack.userToken":"Slack User Token","channels.slack.userTokenReadOnly":"Slack User Token Read Only","channels.slack.thread.historyScope":"Slack Thread History Scope","channels.slack.thread.inheritParent":"Slack Thread Parent Inheritance","channels.mattermost.botToken":"Mattermost Bot Token","channels.mattermost.baseUrl":"Mattermost Base URL","channels.mattermost.chatmode":"Mattermost Chat Mode","channels.mattermost.oncharPrefixes":"Mattermost Onchar Prefixes","channels.mattermost.requireMention":"Mattermost Require Mention","channels.signal.account":"Signal Account","channels.imessage.cliPath":"iMessage CLI Path","agents.list[].skills":"Agent Skill Filter","agents.list[].identity.avatar":"Agent Avatar","discovery.mdns.mode":"mDNS Discovery Mode","plugins.enabled":"Enable Plugins","plugins.allow":"Plugin Allowlist","plugins.deny":"Plugin Denylist","plugins.load.paths":"Plugin Load Paths","plugins.slots":"Plugin Slots","plugins.slots.memory":"Memory Plugin","plugins.entries":"Plugin Entries","plugins.entries.*.enabled":"Plugin Enabled","plugins.entries.*.config":"Plugin Config","plugins.installs":"Plugin Install Records","plugins.installs.*.source":"Plugin Install Source","plugins.installs.*.spec":"Plugin Install Spec","plugins.installs.*.sourcePath":"Plugin Install Source Path","plugins.installs.*.installPath":"Plugin Install Path","plugins.installs.*.version":"Plugin Install Version","plugins.installs.*.installedAt":"Plugin Install Time"},zh:{"meta.lastTouchedVersion":"配置最后触及版本","meta.lastTouchedAt":"配置最后触及时间","update.channel":"更新渠道","update.checkOnStart":"启动时检查更新","diagnostics.enabled":"诊断已启用","diagnostics.flags":"诊断标志","diagnostics.otel.enabled":"OpenTelemetry 已启用","diagnostics.otel.endpoint":"OpenTelemetry 端点","diagnostics.otel.protocol":"OpenTelemetry 协议","diagnostics.otel.headers":"OpenTelemetry 请求头","diagnostics.otel.serviceName":"OpenTelemetry 服务名","diagnostics.otel.traces":"OpenTelemetry 链路已启用","diagnostics.otel.metrics":"OpenTelemetry 指标已启用","diagnostics.otel.logs":"OpenTelemetry 日志已启用","diagnostics.otel.sampleRate":"OpenTelemetry 采样率","diagnostics.otel.flushIntervalMs":"OpenTelemetry 刷新间隔（毫秒）","diagnostics.cacheTrace.enabled":"缓存追踪已启用","diagnostics.cacheTrace.filePath":"缓存追踪文件路径","diagnostics.cacheTrace.includeMessages":"缓存追踪包含消息","diagnostics.cacheTrace.includePrompt":"缓存追踪包含提示","diagnostics.cacheTrace.includeSystem":"缓存追踪包含系统","agents.list.*.identity.avatar":"身份头像","agents.list.*.skills":"代理技能筛选","gateway.remote.url":"远程网关 URL","gateway.remote.sshTarget":"远程网关 SSH 目标","gateway.remote.sshIdentity":"远程网关 SSH 身份","gateway.remote.token":"远程网关令牌","gateway.remote.password":"远程网关密码","gateway.remote.tlsFingerprint":"远程网关 TLS 指纹","gateway.auth.token":"网关令牌","gateway.auth.password":"网关密码","tools.media.image.enabled":"启用图像理解","tools.media.image.maxBytes":"图像理解最大字节","tools.media.image.maxChars":"图像理解最大字符","tools.media.image.prompt":"图像理解提示","tools.media.image.timeoutSeconds":"图像理解超时（秒）","tools.media.image.attachments":"图像理解附件策略","tools.media.image.models":"图像理解模型","tools.media.image.scope":"图像理解范围","tools.media.models":"媒体理解共享模型","tools.media.concurrency":"媒体理解并发数","tools.media.audio.enabled":"启用音频理解","tools.media.audio.maxBytes":"音频理解最大字节","tools.media.audio.maxChars":"音频理解最大字符","tools.media.audio.prompt":"音频理解提示","tools.media.audio.timeoutSeconds":"音频理解超时（秒）","tools.media.audio.language":"音频理解语言","tools.media.audio.attachments":"音频理解附件策略","tools.media.audio.models":"音频理解模型","tools.media.audio.scope":"音频理解范围","tools.media.video.enabled":"启用视频理解","tools.media.video.maxBytes":"视频理解最大字节","tools.media.video.maxChars":"视频理解最大字符","tools.media.video.prompt":"视频理解提示","tools.media.video.timeoutSeconds":"视频理解超时（秒）","tools.media.video.attachments":"视频理解附件策略","tools.media.video.models":"视频理解模型","tools.media.video.scope":"视频理解范围","tools.links.enabled":"启用链接理解","tools.links.maxLinks":"链接理解最大数量","tools.links.timeoutSeconds":"链接理解超时（秒）","tools.links.models":"链接理解模型","tools.links.scope":"链接理解范围","tools.profile":"工具配置集","tools.alsoAllow":"工具允许列表附加","agents.list[].tools.profile":"代理工具配置集","agents.list[].tools.alsoAllow":"代理工具允许列表附加","tools.byProvider":"按提供方的工具策略","agents.list[].tools.byProvider":"代理按提供方的工具策略","tools.exec.applyPatch.enabled":"启用 apply_patch","tools.exec.applyPatch.allowModels":"apply_patch 模型允许列表","tools.exec.notifyOnExit":"Exec 退出时通知","tools.exec.approvalRunningNoticeMs":"Exec 审批运行提示（毫秒）","tools.exec.host":"Exec 主机","tools.exec.security":"Exec 安全","tools.exec.ask":"Exec 询问","tools.exec.node":"Exec 节点绑定","tools.exec.pathPrepend":"Exec PATH 前置","tools.exec.safeBins":"Exec 安全二进制","tools.message.allowCrossContextSend":"允许跨上下文发送","tools.message.crossContext.allowWithinProvider":"允许跨上下文（同提供方）","tools.message.crossContext.allowAcrossProviders":"允许跨上下文（跨提供方）","tools.message.crossContext.marker.enabled":"跨上下文标记","tools.message.crossContext.marker.prefix":"跨上下文标记前缀","tools.message.crossContext.marker.suffix":"跨上下文标记后缀","tools.message.broadcast.enabled":"启用消息广播","tools.web.search.enabled":"启用网页搜索工具","tools.web.search.provider":"网页搜索提供方","tools.web.search.apiKey":"Brave 搜索 API 密钥","tools.web.search.maxResults":"网页搜索最大结果数","tools.web.search.timeoutSeconds":"网页搜索超时（秒）","tools.web.search.cacheTtlMinutes":"网页搜索缓存 TTL（分钟）","tools.web.fetch.enabled":"启用网页抓取工具","tools.web.fetch.maxChars":"网页抓取最大字符","tools.web.fetch.timeoutSeconds":"网页抓取超时（秒）","tools.web.fetch.cacheTtlMinutes":"网页抓取缓存 TTL（分钟）","tools.web.fetch.maxRedirects":"网页抓取最大重定向","tools.web.fetch.userAgent":"网页抓取 User-Agent","gateway.controlUi.basePath":"控制台 UI 基础路径","gateway.controlUi.root":"控制台 UI 资源根目录","gateway.controlUi.allowedOrigins":"控制台 UI 允许来源","gateway.controlUi.allowInsecureAuth":"允许控制台 UI 非安全认证","gateway.controlUi.dangerouslyDisableDeviceAuth":"危险：禁用控制台 UI 设备认证","gateway.http.endpoints.chatCompletions.enabled":"OpenAI 对话补全端点","gateway.reload.mode":"配置重载模式","gateway.reload.debounceMs":"配置重载防抖（毫秒）","gateway.nodes.browser.mode":"网关节点浏览器模式","gateway.nodes.browser.node":"网关节点浏览器固定","gateway.nodes.allowCommands":"网关节点允许列表（额外命令）","gateway.nodes.denyCommands":"网关节点拒绝列表","nodeHost.browserProxy.enabled":"节点浏览器代理已启用","nodeHost.browserProxy.allowProfiles":"节点浏览器代理允许配置集","skills.load.watch":"监听技能","skills.load.watchDebounceMs":"技能监听防抖（毫秒）","agents.defaults.workspace":"工作区","agents.defaults.repoRoot":"仓库根目录","agents.defaults.bootstrapMaxChars":"引导最大字符","agents.defaults.envelopeTimezone":"信封时区","agents.defaults.envelopeTimestamp":"信封时间戳","agents.defaults.envelopeElapsed":"信封耗时","agents.defaults.memorySearch":"记忆搜索","agents.defaults.memorySearch.enabled":"启用记忆搜索","agents.defaults.memorySearch.sources":"记忆搜索来源","agents.defaults.memorySearch.extraPaths":"记忆搜索额外路径","agents.defaults.memorySearch.experimental.sessionMemory":"记忆搜索会话索引（实验）","agents.defaults.memorySearch.provider":"记忆搜索提供方","agents.defaults.memorySearch.remote.baseUrl":"远程嵌入 Base URL","agents.defaults.memorySearch.remote.apiKey":"远程嵌入 API 密钥","agents.defaults.memorySearch.remote.headers":"远程嵌入请求头","agents.defaults.memorySearch.remote.batch.concurrency":"远程批处理并发数","agents.defaults.memorySearch.model":"记忆搜索模型","agents.defaults.memorySearch.fallback":"记忆搜索回退","agents.defaults.memorySearch.local.modelPath":"本地嵌入模型路径","agents.defaults.memorySearch.store.path":"记忆搜索索引路径","agents.defaults.memorySearch.store.vector.enabled":"记忆搜索向量索引","agents.defaults.memorySearch.store.vector.extensionPath":"记忆搜索向量扩展路径","agents.defaults.memorySearch.chunking.tokens":"记忆分块词数","agents.defaults.memorySearch.chunking.overlap":"记忆分块重叠词数","agents.defaults.memorySearch.sync.onSessionStart":"会话开始时建索引","agents.defaults.memorySearch.sync.onSearch":"搜索时建索引（懒加载）","agents.defaults.memorySearch.sync.watch":"监听记忆文件","agents.defaults.memorySearch.sync.watchDebounceMs":"记忆监听防抖（毫秒）","agents.defaults.memorySearch.sync.sessions.deltaBytes":"会话增量字节","agents.defaults.memorySearch.sync.sessions.deltaMessages":"会话增量消息","agents.defaults.memorySearch.query.maxResults":"记忆搜索最大结果数","agents.defaults.memorySearch.query.minScore":"记忆搜索最低分","agents.defaults.memorySearch.query.hybrid.enabled":"记忆搜索混合模式","agents.defaults.memorySearch.query.hybrid.vectorWeight":"记忆搜索向量权重","agents.defaults.memorySearch.query.hybrid.textWeight":"记忆搜索文本权重","agents.defaults.memorySearch.query.hybrid.candidateMultiplier":"记忆搜索混合候选倍数","agents.defaults.memorySearch.cache.enabled":"记忆搜索嵌入缓存","agents.defaults.memorySearch.cache.maxEntries":"记忆搜索嵌入缓存最大条数",memory:"记忆","memory.backend":"记忆后端","memory.citations":"记忆引用模式","memory.qmd.command":"QMD 可执行文件","memory.qmd.includeDefaultMemory":"QMD 包含默认记忆","memory.qmd.paths":"QMD 额外路径","memory.qmd.paths.path":"QMD 路径","memory.qmd.paths.pattern":"QMD 路径模式","memory.qmd.paths.name":"QMD 路径名称","memory.qmd.sessions.enabled":"QMD 会话索引","memory.qmd.sessions.exportDir":"QMD 会话导出目录","memory.qmd.sessions.retentionDays":"QMD 会话保留（天）","memory.qmd.update.interval":"QMD 更新间隔","memory.qmd.update.debounceMs":"QMD 更新防抖（毫秒）","memory.qmd.update.onBoot":"QMD 启动时更新","memory.qmd.update.embedInterval":"QMD 嵌入间隔","memory.qmd.limits.maxResults":"QMD 最大结果数","memory.qmd.limits.maxSnippetChars":"QMD 最大片段字符","memory.qmd.limits.maxInjectedChars":"QMD 最大注入字符","memory.qmd.limits.timeoutMs":"QMD 搜索超时（毫秒）","memory.qmd.scope":"QMD 作用范围","auth.profiles":"认证配置集","auth.order":"认证配置顺序","auth.cooldowns.billingBackoffHours":"计费退避（小时）","auth.cooldowns.billingBackoffHoursByProvider":"计费退避覆盖","auth.cooldowns.billingMaxHours":"计费退避上限（小时）","auth.cooldowns.failureWindowHours":"故障窗口（小时）","agents.defaults.models":"模型","agents.defaults.model.primary":"主模型","agents.defaults.model.fallbacks":"模型回退","agents.defaults.imageModel.primary":"图像模型","agents.defaults.imageModel.fallbacks":"图像模型回退","agents.defaults.humanDelay.mode":"人工延迟模式","agents.defaults.humanDelay.minMs":"人工延迟最小（毫秒）","agents.defaults.humanDelay.maxMs":"人工延迟最大（毫秒）","agents.defaults.cliBackends":"CLI 后端","commands.native":"原生命令","commands.nativeSkills":"原生技能命令","commands.text":"文本命令","commands.bash":"允许 Bash 聊天命令","commands.bashForegroundMs":"Bash 前台窗口（毫秒）","commands.config":"允许 /config","commands.debug":"允许 /debug","commands.restart":"允许重启","commands.useAccessGroups":"使用访问组","commands.ownerAllowFrom":"命令所有者","ui.seamColor":"强调色","ui.assistant.name":"助手名称","ui.assistant.avatar":"助手头像","browser.evaluateEnabled":"浏览器执行已启用","browser.snapshotDefaults":"浏览器快照默认","browser.snapshotDefaults.mode":"浏览器快照模式","browser.remoteCdpTimeoutMs":"远程 CDP 超时（毫秒）","browser.remoteCdpHandshakeTimeoutMs":"远程 CDP 握手超时（毫秒）","session.dmScope":"私信会话范围","session.agentToAgent.maxPingPongTurns":"代理间乒乓轮数","messages.ackReaction":"确认反应表情","messages.ackReactionScope":"确认反应范围","messages.inbound.debounceMs":"入站消息防抖（毫秒）","talk.apiKey":"语音 API 密钥","channels.whatsapp":"WhatsApp","channels.telegram":"Telegram","channels.telegram.customCommands":"Telegram 自定义命令","channels.discord":"Discord","channels.slack":"Slack","channels.mattermost":"Mattermost","channels.signal":"Signal","channels.imessage":"iMessage","channels.bluebubbles":"BlueBubbles","channels.msteams":"MS Teams","channels.telegram.botToken":"Telegram 机器人令牌","channels.telegram.dmPolicy":"Telegram 私信策略","channels.telegram.streamMode":"Telegram 草稿流模式","channels.telegram.draftChunk.minChars":"Telegram 草稿块最小字符","channels.telegram.draftChunk.maxChars":"Telegram 草稿块最大字符","channels.telegram.draftChunk.breakPreference":"Telegram 草稿块断行偏好","channels.telegram.retry.attempts":"Telegram 重试次数","channels.telegram.retry.minDelayMs":"Telegram 重试最小延迟（毫秒）","channels.telegram.retry.maxDelayMs":"Telegram 重试最大延迟（毫秒）","channels.telegram.retry.jitter":"Telegram 重试抖动","channels.telegram.network.autoSelectFamily":"Telegram autoSelectFamily","channels.telegram.timeoutSeconds":"Telegram API 超时（秒）","channels.telegram.capabilities.inlineButtons":"Telegram 内联按钮","channels.whatsapp.dmPolicy":"WhatsApp 私信策略","channels.whatsapp.selfChatMode":"WhatsApp 自聊模式","channels.whatsapp.debounceMs":"WhatsApp 消息防抖（毫秒）","channels.signal.dmPolicy":"Signal 私信策略","channels.imessage.dmPolicy":"iMessage 私信策略","channels.bluebubbles.dmPolicy":"BlueBubbles 私信策略","channels.discord.dm.policy":"Discord 私信策略","channels.discord.retry.attempts":"Discord 重试次数","channels.discord.retry.minDelayMs":"Discord 重试最小延迟（毫秒）","channels.discord.retry.maxDelayMs":"Discord 重试最大延迟（毫秒）","channels.discord.retry.jitter":"Discord 重试抖动","channels.discord.maxLinesPerMessage":"Discord 每消息最大行数","channels.discord.intents.presence":"Discord 在线状态意图","channels.discord.intents.guildMembers":"Discord 频道成员意图","channels.discord.pluralkit.enabled":"Discord PluralKit 已启用","channels.discord.pluralkit.token":"Discord PluralKit 令牌","channels.slack.dm.policy":"Slack 私信策略","channels.slack.allowBots":"Slack 允许机器人消息","channels.discord.token":"Discord 机器人令牌","channels.slack.botToken":"Slack 机器人令牌","channels.slack.appToken":"Slack 应用令牌","channels.slack.userToken":"Slack 用户令牌","channels.slack.userTokenReadOnly":"Slack 用户令牌只读","channels.slack.thread.historyScope":"Slack 线程历史范围","channels.slack.thread.inheritParent":"Slack 线程继承父级","channels.mattermost.botToken":"Mattermost 机器人令牌","channels.mattermost.baseUrl":"Mattermost Base URL","channels.mattermost.chatmode":"Mattermost 聊天模式","channels.mattermost.oncharPrefixes":"Mattermost 触发前缀","channels.mattermost.requireMention":"Mattermost 需要 @ 提及","channels.signal.account":"Signal 账号","channels.imessage.cliPath":"iMessage CLI 路径","agents.list[].skills":"代理技能筛选","agents.list[].identity.avatar":"代理头像","discovery.mdns.mode":"mDNS 发现模式","plugins.enabled":"启用插件","plugins.allow":"插件允许列表","plugins.deny":"插件拒绝列表","plugins.load.paths":"插件加载路径","plugins.slots":"插件槽位","plugins.slots.memory":"记忆插件","plugins.entries":"插件条目","plugins.entries.*.enabled":"插件已启用","plugins.entries.*.config":"插件配置","plugins.installs":"插件安装记录","plugins.installs.*.source":"插件安装来源","plugins.installs.*.spec":"插件安装规格","plugins.installs.*.sourcePath":"插件安装源路径","plugins.installs.*.installPath":"插件安装路径","plugins.installs.*.version":"插件安装版本","plugins.installs.*.installedAt":"插件安装时间"}};function Ve(e,t){const n=_a(),s=Dp[n];for(const a of Ip(e)){const i=s[a];if(i)return i}return t}const Rp=new Set(["title","description","default","nullable"]);function Pp(e){return Object.keys(e??{}).filter(n=>!Rp.has(n)).length===0}function da(e){if(e===void 0)return"";try{return JSON.stringify(e,null,2)??""}catch{return""}}const ln={chevronDown:l`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `,plus:l`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `,minus:l`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `,trash:l`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `,edit:l`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  `};function qe(e){const{schema:t,value:n,path:s,hints:a,unsupported:i,disabled:r,onPatch:c}=e,d=e.showLabel??!0,g=Ne(t),h=ke(s,a),p=Ve(s,h?.label??t.title??Fe(String(s.at(-1)))),f=Ge(s,h?.help??t.description??""),u=Nt(s);if(i.has(u))return l`<div class="cfg-field cfg-field--error">
      <div class="cfg-field__label">${p}</div>
      <div class="cfg-field__error">${o("configUnsupportedSchemaNode")}</div>
    </div>`;if(t.anyOf||t.oneOf){const b=(t.anyOf??t.oneOf??[]).filter(_=>!(_.type==="null"||Array.isArray(_.type)&&_.type.includes("null")));if(b.length===1)return qe({...e,schema:b[0]});const x=_=>{if(_.const!==void 0)return _.const;if(_.enum&&_.enum.length===1)return _.enum[0]},A=b.map(x),$=A.every(_=>_!==void 0);if($&&A.length>0&&A.length<=5){const _=n??t.default;return l`
        <div class="cfg-field">
          ${d?l`<label class="cfg-field__label">${p}</label>`:v}
          ${f?l`<div class="cfg-field__help">${f}</div>`:v}
          <div class="cfg-segmented">
            ${A.map(M=>l`
              <button
                type="button"
                class="cfg-segmented__btn ${M===_||String(M)===String(_)?"active":""}"
                ?disabled=${r}
                @click=${()=>c(s,M)}
              >
                ${String(M)}
              </button>
            `)}
          </div>
        </div>
      `}if($&&A.length>5)return pi({...e,options:A,value:n??t.default});const T=new Set(b.map(_=>Ne(_)).filter(Boolean)),C=new Set([...T].map(_=>_==="integer"?"number":_));if([...C].every(_=>["string","number","boolean"].includes(_))){const _=C.has("string"),M=C.has("number");if(C.has("boolean")&&C.size===1)return qe({...e,schema:{...t,type:"boolean",anyOf:void 0,oneOf:void 0}});if(_||M)return gi({...e,inputType:M&&!_?"number":"text"})}}if(t.enum){const m=t.enum;if(m.length<=5){const b=n??t.default;return l`
        <div class="cfg-field">
          ${d?l`<label class="cfg-field__label">${p}</label>`:v}
          ${f?l`<div class="cfg-field__help">${f}</div>`:v}
          <div class="cfg-segmented">
            ${m.map(x=>l`
              <button
                type="button"
                class="cfg-segmented__btn ${x===b||String(x)===String(b)?"active":""}"
                ?disabled=${r}
                @click=${()=>c(s,x)}
              >
                ${String(x)}
              </button>
            `)}
          </div>
        </div>
      `}return pi({...e,options:m,value:n??t.default})}if(g==="object")return Op(e);if(g==="array")return Up(e);if(g==="boolean"){const m=typeof n=="boolean"?n:typeof t.default=="boolean"?t.default:!1;return l`
      <label class="cfg-toggle-row ${r?"disabled":""}">
        <div class="cfg-toggle-row__content">
          <span class="cfg-toggle-row__label">${p}</span>
          ${f?l`<span class="cfg-toggle-row__help">${f}</span>`:v}
        </div>
        <div class="cfg-toggle">
          <input
            type="checkbox"
            .checked=${m}
            ?disabled=${r}
            @change=${b=>c(s,b.target.checked)}
          />
          <span class="cfg-toggle__track"></span>
        </div>
      </label>
    `}return g==="number"||g==="integer"?Fp(e):g==="string"?gi({...e,inputType:"text"}):l`
    <div class="cfg-field cfg-field--error">
      <div class="cfg-field__label">${p}</div>
      <div class="cfg-field__error">Unsupported type: ${g}. Use Raw mode.</div>
    </div>
  `}function gi(e){const{schema:t,value:n,path:s,hints:a,disabled:i,onPatch:r,inputType:c}=e,d=e.showLabel??!0,g=ke(s,a),h=Ve(s,g?.label??t.title??Fe(String(s.at(-1)))),p=Ge(s,g?.help??t.description??""),f=g?.sensitive??Mp(s),u=g?.placeholder??(f?"••••":t.default!==void 0?`Default: ${String(t.default)}`:""),m=n??"";return l`
    <div class="cfg-field">
      ${d?l`<label class="cfg-field__label">${h}</label>`:v}
      ${p?l`<div class="cfg-field__help">${p}</div>`:v}
      <div class="cfg-input-wrap">
        <input
          type=${f?"password":c}
          class="cfg-input"
          placeholder=${u}
          .value=${m==null?"":String(m)}
          ?disabled=${i}
          @input=${b=>{const x=b.target.value;if(c==="number"){if(x.trim()===""){r(s,void 0);return}const A=Number(x);r(s,Number.isNaN(A)?x:A);return}r(s,x)}}
          @change=${b=>{if(c==="number")return;const x=b.target.value;r(s,x.trim())}}
        />
        ${t.default!==void 0?l`
          <button
            type="button"
            class="cfg-input__reset"
            title="Reset to default"
            ?disabled=${i}
            @click=${()=>r(s,t.default)}
          >↺</button>
        `:v}
      </div>
    </div>
  `}function Np(e){const{schema:t,value:n,path:s,hints:a,disabled:i,onPatch:r}=e,c=e.showLabel??!0,d=ke(s,a),g=Ve(s,d?.label??t.title??Fe(String(s.at(-1)))),h=Ge(s,d?.help??t.description??""),p=n??t.default;let f;if(typeof p=="string")try{f=JSON.stringify(JSON.parse(p),null,2)}catch{f=p}else f=da(p);return l`
    <div class="cfg-field">
      ${c?l`<label class="cfg-field__label">${g}</label>`:v}
      ${h?l`<div class="cfg-field__help">${h}</div>`:v}
      <div class="cfg-input-wrap cfg-input-wrap--textarea">
        <textarea
          class="cfg-textarea cfg-textarea--json"
          rows="6"
          placeholder="{}"
          .value=${f}
          ?disabled=${i}
          @input=${u=>{const m=u.target.value;if(m.trim()===""){r(s,void 0);return}try{r(s,JSON.parse(m))}catch{}}}
          @change=${u=>{const m=u.target.value.trim();if(!m){r(s,void 0);return}try{r(s,JSON.parse(m))}catch{const b=u.target;b.value=da(n??t.default)}}}
        ></textarea>
        ${t.default!==void 0?l`
          <button
            type="button"
            class="cfg-input__reset"
            title="Reset to default"
            ?disabled=${i}
            @click=${()=>r(s,t.default)}
          >↺</button>
        `:v}
      </div>
    </div>
  `}function Fp(e){const{schema:t,value:n,path:s,hints:a,disabled:i,onPatch:r}=e,c=e.showLabel??!0,d=ke(s,a),g=Ve(s,d?.label??t.title??Fe(String(s.at(-1)))),h=Ge(s,d?.help??t.description??""),p=n??t.default??"",f=typeof p=="number"?p:0;return l`
    <div class="cfg-field">
      ${c?l`<label class="cfg-field__label">${g}</label>`:v}
      ${h?l`<div class="cfg-field__help">${h}</div>`:v}
      <div class="cfg-number">
        <button
          type="button"
          class="cfg-number__btn"
          ?disabled=${i}
          @click=${()=>r(s,f-1)}
        >−</button>
        <input
          type="number"
          class="cfg-number__input"
          .value=${p==null?"":String(p)}
          ?disabled=${i}
          @input=${u=>{const m=u.target.value,b=m===""?void 0:Number(m);r(s,b)}}
        />
        <button
          type="button"
          class="cfg-number__btn"
          ?disabled=${i}
          @click=${()=>r(s,f+1)}
        >+</button>
      </div>
    </div>
  `}function pi(e){const{schema:t,value:n,path:s,hints:a,disabled:i,options:r,onPatch:c}=e,d=e.showLabel??!0,g=ke(s,a),h=Ve(s,g?.label??t.title??Fe(String(s.at(-1)))),p=Ge(s,g?.help??t.description??""),f=n??t.default,u=r.findIndex(b=>b===f||String(b)===String(f)),m="__unset__";return l`
    <div class="cfg-field">
      ${d?l`<label class="cfg-field__label">${h}</label>`:v}
      ${p?l`<div class="cfg-field__help">${p}</div>`:v}
      <select
        class="cfg-select"
        ?disabled=${i}
        .value=${u>=0?String(u):m}
        @change=${b=>{const x=b.target.value;c(s,x===m?void 0:r[Number(x)])}}
      >
        <option value=${m}>Select...</option>
        ${r.map((b,x)=>l`
          <option value=${String(x)}>${String(b)}</option>
        `)}
      </select>
    </div>
  `}function Op(e){const{schema:t,value:n,path:s,hints:a,unsupported:i,disabled:r,onPatch:c}=e,d=t.properties??{};if(Object.keys(d).length===0&&t.additionalProperties===!0)return Np({schema:{...t,format:"json"},value:n,path:s,hints:a,disabled:r,showLabel:e.showLabel,onPatch:c});const h=ke(s,a),p=Ve(s,h?.label??t.title??Fe(String(s.at(-1)))),f=Ge(s,h?.help??t.description??""),u=n??t.default,m=u&&typeof u=="object"&&!Array.isArray(u)?u:{},x=Object.entries(d).toSorted((C,_)=>{const M=ke([...s,C[0]],a)?.order??0,D=ke([...s,_[0]],a)?.order??0;return M!==D?M-D:C[0].localeCompare(_[0])}),A=new Set(Object.keys(d)),$=t.additionalProperties,T=!!$&&typeof $=="object";return s.length===1?l`
      <div class="cfg-fields">
        ${x.map(([C,_])=>qe({schema:_,value:m[C],path:[...s,C],hints:a,unsupported:i,disabled:r,onPatch:c}))}
        ${T?mi({schema:$,value:m,path:s,hints:a,unsupported:i,disabled:r,reservedKeys:A,onPatch:c}):v}
      </div>
    `:l`
    <details class="cfg-object" open>
      <summary class="cfg-object__header">
        <span class="cfg-object__title">${p}</span>
        <span class="cfg-object__chevron">${ln.chevronDown}</span>
      </summary>
      ${f?l`<div class="cfg-object__help">${f}</div>`:v}
      <div class="cfg-object__content">
        ${x.map(([C,_])=>qe({schema:_,value:m[C],path:[...s,C],hints:a,unsupported:i,disabled:r,onPatch:c}))}
        ${T?mi({schema:$,value:m,path:s,hints:a,unsupported:i,disabled:r,reservedKeys:A,onPatch:c}):v}
      </div>
    </details>
  `}function Up(e){const{schema:t,value:n,path:s,hints:a,unsupported:i,disabled:r,onPatch:c}=e,d=e.showLabel??!0,g=ke(s,a),h=Ve(s,g?.label??t.title??Fe(String(s.at(-1)))),p=Ge(s,g?.help??t.description??""),f=Array.isArray(t.items)?t.items[0]:t.items;if(!f)return l`
      <div class="cfg-field cfg-field--error">
        <div class="cfg-field__label">${h}</div>
        <div class="cfg-field__error">Unsupported array schema. Use Raw mode.</div>
      </div>
    `;const u=Array.isArray(n)?n:Array.isArray(t.default)?t.default:[];return l`
    <div class="cfg-array">
      <div class="cfg-array__header">
        ${d?l`<span class="cfg-array__label">${h}</span>`:v}
        <span class="cfg-array__count">${u.length} item${u.length!==1?"s":""}</span>
        <button
          type="button"
          class="cfg-array__add"
          ?disabled=${r}
          @click=${()=>{const m=[...u,hl(f)];c(s,m)}}
        >
          <span class="cfg-array__add-icon">${ln.plus}</span>
          Add
        </button>
      </div>
      ${p?l`<div class="cfg-array__help">${p}</div>`:v}

      ${u.length===0?l`
              <div class="cfg-array__empty">No items yet. Click "Add" to create one.</div>
            `:l`
        <div class="cfg-array__items">
          ${u.map((m,b)=>l`
            <div class="cfg-array__item">
              <div class="cfg-array__item-header">
                <span class="cfg-array__item-index">#${b+1}</span>
                <button
                  type="button"
                  class="cfg-array__item-remove"
                  title="Remove item"
                  ?disabled=${r}
                  @click=${()=>{const x=[...u];x.splice(b,1),c(s,x)}}
                >
                  ${ln.trash}
                </button>
              </div>
              <div class="cfg-array__item-content">
                ${qe({schema:f,value:m,path:[...s,b],hints:a,unsupported:i,disabled:r,showLabel:!1,onPatch:c})}
              </div>
            </div>
          `)}
        </div>
      `}
    </div>
  `}function mi(e){const{schema:t,value:n,path:s,hints:a,unsupported:i,disabled:r,reservedKeys:c,onPatch:d}=e,g=Pp(t),h=Object.entries(n??{}).filter(([p])=>!c.has(p));return l`
    <div class="cfg-map">
      <div class="cfg-map__header">
        <span class="cfg-map__label">Custom entries</span>
        <button
          type="button"
          class="cfg-map__add"
          ?disabled=${r}
          @click=${()=>{const p={...n};let f=1,u=`custom-${f}`;for(;u in p;)f+=1,u=`custom-${f}`;p[u]=g?{}:hl(t),d(s,p)}}
        >
          <span class="cfg-map__add-icon">${ln.plus}</span>
          Add Entry
        </button>
      </div>

      ${h.length===0?l`
              <div class="cfg-map__empty">No custom entries.</div>
            `:l`
        <div class="cfg-map__items">
          ${h.map(([p,f])=>{const u=[...s,p],m=da(f);return l`
              <div class="cfg-map__item">
                <div class="cfg-map__item-key">
                  <input
                    type="text"
                    class="cfg-input cfg-input--sm"
                    placeholder="Key"
                    .value=${p}
                    ?disabled=${r}
                    @change=${b=>{const x=b.target.value.trim();if(!x||x===p)return;const A={...n};x in A||(A[x]=A[p],delete A[p],d(s,A))}}
                  />
                </div>
                <div class="cfg-map__item-value">
                  ${g?l`
                        <textarea
                          class="cfg-textarea cfg-textarea--sm"
                          placeholder="JSON value"
                          rows="2"
                          .value=${m}
                          ?disabled=${r}
                          @change=${b=>{const x=b.target,A=x.value.trim();if(!A){d(u,void 0);return}try{d(u,JSON.parse(A))}catch{x.value=m}}}
                        ></textarea>
                      `:qe({schema:t,value:f,path:u,hints:a,unsupported:i,disabled:r,showLabel:!1,onPatch:d})}
                </div>
                <button
                  type="button"
                  class="cfg-map__item-remove"
                  title="Remove entry"
                  ?disabled=${r}
                  @click=${()=>{const b={...n};delete b[p],d(s,b)}}
                >
                  ${ln.trash}
                </button>
              </div>
            `})}
        </div>
      `}
    </div>
  `}const hi={env:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="3"></circle>
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      ></path>
    </svg>
  `,update:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  `,agents:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path
        d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"
      ></path>
      <circle cx="8" cy="14" r="1"></circle>
      <circle cx="16" cy="14" r="1"></circle>
    </svg>
  `,auth:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  `,channels:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `,messages:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  `,commands:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  `,hooks:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  `,skills:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      ></polygon>
    </svg>
  `,tools:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      ></path>
    </svg>
  `,gateway:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      ></path>
    </svg>
  `,wizard:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M15 4V2"></path>
      <path d="M15 16v-2"></path>
      <path d="M8 9h2"></path>
      <path d="M20 9h2"></path>
      <path d="M17.8 11.8 19 13"></path>
      <path d="M15 9h0"></path>
      <path d="M17.8 6.2 19 5"></path>
      <path d="m3 21 9-9"></path>
      <path d="M12.2 6.2 11 5"></path>
    </svg>
  `,meta:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
    </svg>
  `,logging:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  `,browser:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="4"></circle>
      <line x1="21.17" y1="8" x2="12" y2="8"></line>
      <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
      <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
    </svg>
  `,ui:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
  `,models:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      ></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  `,bindings:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
  `,broadcast:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
      <circle cx="12" cy="12" r="2"></circle>
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
    </svg>
  `,audio:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>
  `,session:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  `,cron:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  `,web:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      ></path>
    </svg>
  `,discovery:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `,canvasHost:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  `,talk:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  `,plugins:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M12 2v6"></path>
      <path d="m4.93 10.93 4.24 4.24"></path>
      <path d="M2 12h6"></path>
      <path d="m4.93 13.07 4.24-4.24"></path>
      <path d="M12 22v-6"></path>
      <path d="m19.07 13.07-4.24-4.24"></path>
      <path d="M22 12h-6"></path>
      <path d="m19.07 10.93-4.24 4.24"></path>
    </svg>
  `,default:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  `};function fi(e){return hi[e]??hi.default}function Bp(e,t,n){if(!n)return!0;const s=n.toLowerCase(),a=Ma(e);return e.toLowerCase().includes(s)||a&&(a.label.toLowerCase().includes(s)||a.description.toLowerCase().includes(s))?!0:Vt(t,s)}function Vt(e,t){if(e.title?.toLowerCase().includes(t)||e.description?.toLowerCase().includes(t)||e.enum?.some(s=>String(s).toLowerCase().includes(t)))return!0;if(e.properties){for(const[s,a]of Object.entries(e.properties))if(s.toLowerCase().includes(t)||Vt(a,t))return!0}if(e.items){const s=Array.isArray(e.items)?e.items:[e.items];for(const a of s)if(a&&Vt(a,t))return!0}if(e.additionalProperties&&typeof e.additionalProperties=="object"&&Vt(e.additionalProperties,t))return!0;const n=e.anyOf??e.oneOf??e.allOf;if(n){for(const s of n)if(s&&Vt(s,t))return!0}return!1}function Hp(e){if(!e.schema)return l`
      <div class="muted">${o("configSchemaUnavailable")}</div>
    `;const t=e.schema,n=e.value??{};if(Ne(t)!=="object"||!t.properties)return l`
      <div class="callout danger">${o("configUnsupportedSchema")}</div>
    `;const s=new Set(e.unsupportedPaths??[]),a=t.properties,i=e.searchQuery??"",r=e.activeSection,c=e.activeSubsection??null,g=Object.entries(a).toSorted((p,f)=>{const u=ke([p[0]],e.uiHints)?.order??50,m=ke([f[0]],e.uiHints)?.order??50;return u!==m?u-m:p[0].localeCompare(f[0])}).filter(([p,f])=>!(r&&p!==r||i&&!Bp(p,f,i)));let h=null;if(r&&c&&g.length===1){const p=g[0]?.[1];p&&Ne(p)==="object"&&p.properties&&p.properties[c]&&(h={sectionKey:r,subsectionKey:c,schema:p.properties[c]})}return g.length===0?l`
      <div class="config-empty">
        <div class="config-empty__icon">${ce.search}</div>
        <div class="config-empty__text">
          ${i?`${o("configNoSettingsMatchPrefix")}${i}${o("configNoSettingsMatchSuffix")}`:o("configNoSettingsInSection")}
        </div>
      </div>
    `:l`
    <div class="config-form config-form--modern">
      ${h?(()=>{const{sectionKey:p,subsectionKey:f,schema:u}=h,m=ke([p,f],e.uiHints),b=Ve([p,f],m?.label??u.title??Fe(f)),x=Ge([p,f],m?.help??u.description??""),A=n[p],$=A&&typeof A=="object"?A[f]:void 0,T=`config-section-${p}-${f}`;return l`
              <section class="config-section-card" id=${T}>
                <div class="config-section-card__header">
                  <span class="config-section-card__icon">${fi(p)}</span>
                  <div class="config-section-card__titles">
                    <h3 class="config-section-card__title">${b}</h3>
                    ${x?l`<p class="config-section-card__desc">${x}</p>`:v}
                  </div>
                </div>
                <div class="config-section-card__content">
                  ${qe({schema:u,value:$,path:[p,f],hints:e.uiHints,unsupported:s,disabled:e.disabled??!1,showLabel:!1,onPatch:e.onPatch})}
                </div>
              </section>
            `})():g.map(([p,f])=>{const u=Ma(p),m=u.label||u.description?u:{label:p.charAt(0).toUpperCase()+p.slice(1),description:f.description??""};return l`
              <section class="config-section-card" id="config-section-${p}">
                <div class="config-section-card__header">
                  <span class="config-section-card__icon">${fi(p)}</span>
                  <div class="config-section-card__titles">
                    <h3 class="config-section-card__title">${m.label}</h3>
                    ${m.description?l`<p class="config-section-card__desc">${m.description}</p>`:v}
                  </div>
                </div>
                <div class="config-section-card__content">
                  ${qe({schema:f,value:n[p],path:[p],hints:e.uiHints,unsupported:s,disabled:e.disabled??!1,showLabel:!1,onPatch:e.onPatch})}
                </div>
              </section>
            `})}
    </div>
  `}const zp=new Set(["title","description","default","nullable"]);function Wp(e){return Object.keys(e??{}).filter(n=>!zp.has(n)).length===0}function fl(e){const t=e.filter(a=>a!=null),n=t.length!==e.length,s=[];for(const a of t)s.some(i=>Object.is(i,a))||s.push(a);return{enumValues:s,nullable:n}}function vl(e){return!e||typeof e!="object"?{schema:null,unsupportedPaths:["<root>"]}:Xt(e,[])}function Xt(e,t){const n=new Set,s={...e},a=Nt(t)||"<root>";if(e.anyOf||e.oneOf||e.allOf){const c=Kp(e,t);return c||{schema:e,unsupportedPaths:[a]}}const i=Array.isArray(e.type)&&e.type.includes("null"),r=Ne(e)??(e.properties||e.additionalProperties?"object":void 0);if(s.type=r??e.type,s.nullable=i||e.nullable,s.enum){const{enumValues:c,nullable:d}=fl(s.enum);s.enum=c,d&&(s.nullable=!0),c.length===0&&n.add(a)}if(r==="object"){const c=e.properties??{},d={};for(const[h,p]of Object.entries(c)){const f=Xt(p,[...t,h]);f.schema&&(d[h]=f.schema);for(const u of f.unsupportedPaths)n.add(u)}s.properties=d;const g=Object.keys(c).length===0;if(e.additionalProperties===!0)g||n.add(a);else if(e.additionalProperties===!1)s.additionalProperties=!1;else if(e.additionalProperties&&typeof e.additionalProperties=="object"&&!Wp(e.additionalProperties)){const h=Xt(e.additionalProperties,[...t,"*"]);s.additionalProperties=h.schema??e.additionalProperties,h.unsupportedPaths.length>0&&n.add(a)}}else if(r==="array"){const c=Array.isArray(e.items)?e.items[0]:e.items;if(!c)n.add(a);else{const d=Xt(c,[...t,"*"]);s.items=d.schema??c,d.unsupportedPaths.length>0&&n.add(a)}}else r!=="string"&&r!=="number"&&r!=="integer"&&r!=="boolean"&&!s.enum&&n.add(a);return{schema:s,unsupportedPaths:Array.from(n)}}function Kp(e,t){if(e.allOf)return null;const n=e.anyOf??e.oneOf;if(!n)return null;const s=[],a=[];let i=!1;for(const c of n){if(!c||typeof c!="object")return null;if(Array.isArray(c.enum)){const{enumValues:d,nullable:g}=fl(c.enum);s.push(...d),g&&(i=!0);continue}if("const"in c){if(c.const==null){i=!0;continue}s.push(c.const);continue}if(Ne(c)==="null"){i=!0;continue}a.push(c)}if(s.length>0&&a.length===0){const c=[];for(const d of s)c.some(g=>Object.is(g,d))||c.push(d);return{schema:{...e,enum:c,nullable:i,anyOf:void 0,oneOf:void 0,allOf:void 0},unsupportedPaths:[]}}if(a.length===1){const c=Xt(a[0],t);return c.schema&&(c.schema.nullable=i||c.schema.nullable),c}const r=new Set(["string","number","integer","boolean"]);return a.length>0&&s.length===0&&a.every(c=>c.type&&r.has(String(c.type)))?{schema:{...e,nullable:i},unsupportedPaths:[]}:null}function jp(e,t){let n=e;for(const s of t){if(!n)return null;const a=Ne(n);if(a==="object"){const i=n.properties??{};if(typeof s=="string"&&i[s]){n=i[s];continue}const r=n.additionalProperties;if(typeof s=="string"&&r&&typeof r=="object"){n=r;continue}return null}if(a==="array"){if(typeof s!="number")return null;n=(Array.isArray(n.items)?n.items[0]:n.items)??null;continue}return null}return n}function qp(e,t){const s=(e.channels??{})[t],a=e[t];return(s&&typeof s=="object"?s:null)??(a&&typeof a=="object"?a:null)??{}}const Gp=["groupPolicy","streamMode","dmPolicy"];function Vp(e){if(e==null)return o("commonNA");if(typeof e=="string"||typeof e=="number"||typeof e=="boolean")return String(e);try{return JSON.stringify(e)}catch{return o("commonNA")}}function Qp(e){const t=Gp.flatMap(n=>n in e?[[n,e[n]]]:[]);return t.length===0?null:l`
    <div class="status-list" style="margin-top: 12px;">
      ${t.map(([n,s])=>l`
          <div>
            <span class="label">${n}</span>
            <span>${Vp(s)}</span>
          </div>
        `)}
    </div>
  `}function Yp(e){const t=vl(e.schema),n=t.schema;if(!n)return l`
      <div class="callout danger">${o("channelsSchemaUnavailable")}</div>
    `;const s=jp(n,["channels",e.channelId]);if(!s)return l`
      <div class="callout danger">${o("channelsConfigSchemaUnavailable")}</div>
    `;const a=e.configValue??{},i=qp(a,e.channelId);return l`
    <div class="config-form">
      ${qe({schema:s,value:i,path:["channels",e.channelId],hints:e.uiHints,unsupported:new Set(t.unsupportedPaths),disabled:e.disabled,showLabel:!1,onPatch:e.onPatch})}
    </div>
    ${Qp(i)}
  `}function Qe(e){const{channelId:t,props:n}=e,s=n.configSaving||n.configSchemaLoading;return l`
    <div style="margin-top: 16px;">
      ${n.configSchemaLoading?l`
              <div class="muted">${o("channelsLoadingConfigSchema")}</div>
            `:Yp({channelId:t,configValue:n.configForm,schema:n.configSchema,uiHints:n.configUiHints,disabled:s,onPatch:n.onConfigPatch})}
      <div class="row" style="margin-top: 12px;">
        <button
          class="btn primary"
          ?disabled=${s||!n.configFormDirty}
          @click=${()=>n.onConfigSave()}
        >
          ${n.configSaving?o("commonSaving"):o("commonSave")}
        </button>
        <button
          class="btn"
          ?disabled=${s}
          @click=${()=>n.onConfigReload()}
        >
          ${o("commonReload")}
        </button>
      </div>
    </div>
  `}function Jp(e){const{props:t,discord:n,accountCountLabel:s}=e;return l`
    <div class="card">
      <div class="card-title">${o("channelDiscord")}</div>
      <div class="card-sub">${o("channelDiscordSub")}</div>
      ${s}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${o("channelConfigured")}</span>
          <span>${n?.configured?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelRunning")}</span>
          <span>${n?.running?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelLastStart")}</span>
          <span>${n?.lastStartAt?Q(n.lastStartAt):o("commonNA")}</span>
        </div>
        <div>
          <span class="label">${o("channelLastProbe")}</span>
          <span>${n?.lastProbeAt?Q(n.lastProbeAt):o("commonNA")}</span>
        </div>
      </div>

      ${n?.lastError?l`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:v}

      ${n?.probe?l`<div class="callout" style="margin-top: 12px;">
            ${o("channelProbe")} ${n.probe.ok?o("channelProbeOk"):o("channelProbeFailed")} ·
            ${n.probe.status??""} ${n.probe.error??""}
          </div>`:v}

      ${Qe({channelId:"discord",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          ${o("channelProbe")}
        </button>
      </div>
    </div>
  `}function Zp(e){const{props:t,googleChat:n,accountCountLabel:s}=e;return l`
    <div class="card">
      <div class="card-title">${o("channelGoogleChat")}</div>
      <div class="card-sub">${o("channelGoogleChatSub")}</div>
      ${s}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${o("channelConfigured")}</span>
          <span>${n?n.configured?o("commonYes"):o("commonNo"):o("commonNA")}</span>
        </div>
        <div>
          <span class="label">${o("channelRunning")}</span>
          <span>${n?n.running?o("commonYes"):o("commonNo"):o("commonNA")}</span>
        </div>
        <div>
          <span class="label">${o("channelCredential")}</span>
          <span>${n?.credentialSource??o("commonNA")}</span>
        </div>
        <div>
          <span class="label">${o("channelAudience")}</span>
          <span>
            ${n?.audienceType?`${n.audienceType}${n.audience?` · ${n.audience}`:""}`:o("commonNA")}
          </span>
        </div>
        <div>
          <span class="label">${o("channelLastStart")}</span>
          <span>${n?.lastStartAt?Q(n.lastStartAt):o("commonNA")}</span>
        </div>
        <div>
          <span class="label">${o("channelLastProbe")}</span>
          <span>${n?.lastProbeAt?Q(n.lastProbeAt):o("commonNA")}</span>
        </div>
      </div>

      ${n?.lastError?l`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:v}

      ${n?.probe?l`<div class="callout" style="margin-top: 12px;">
            ${o("channelProbe")} ${n.probe.ok?o("channelProbeOk"):o("channelProbeFailed")} ·
            ${n.probe.status??""} ${n.probe.error??""}
          </div>`:v}

      ${Qe({channelId:"googlechat",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          ${o("channelProbe")}
        </button>
      </div>
    </div>
  `}function Xp(e){const{props:t,imessage:n,accountCountLabel:s}=e;return l`
    <div class="card">
      <div class="card-title">${o("channelIMessage")}</div>
      <div class="card-sub">${o("channelIMessageSub")}</div>
      ${s}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${o("channelConfigured")}</span>
          <span>${n?.configured?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelRunning")}</span>
          <span>${n?.running?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelLastStart")}</span>
          <span>${n?.lastStartAt?Q(n.lastStartAt):o("commonNA")}</span>
        </div>
        <div>
          <span class="label">${o("channelLastProbe")}</span>
          <span>${n?.lastProbeAt?Q(n.lastProbeAt):o("commonNA")}</span>
        </div>
      </div>

      ${n?.lastError?l`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:v}

      ${n?.probe?l`<div class="callout" style="margin-top: 12px;">
            ${o("channelProbe")} ${n.probe.ok?o("channelProbeOk"):o("channelProbeFailed")} ·
            ${n.probe.error??""}
          </div>`:v}

      ${Qe({channelId:"imessage",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          ${o("channelProbe")}
        </button>
      </div>
    </div>
  `}function vi(e){return e?e.length<=20?e:`${e.slice(0,8)}...${e.slice(-8)}`:o("commonNA")}function em(e){const{props:t,nostr:n,nostrAccounts:s,accountCountLabel:a,profileFormState:i,profileFormCallbacks:r,onEditProfile:c}=e,d=s[0],g=n?.configured??d?.configured??!1,h=n?.running??d?.running??!1,p=n?.publicKey??d?.publicKey,f=n?.lastStartAt??d?.lastStartAt??null,u=n?.lastError??d?.lastError??null,m=s.length>1,b=i!=null,x=$=>{const T=$.publicKey,C=$.profile,_=C?.displayName??C?.name??$.name??$.accountId;return l`
      <div class="account-card">
        <div class="account-card-header">
          <div class="account-card-title">${_}</div>
          <div class="account-card-id">${$.accountId}</div>
        </div>
        <div class="status-list account-card-status">
          <div>
            <span class="label">${o("channelRunning")}</span>
            <span>${$.running?o("commonYes"):o("commonNo")}</span>
          </div>
          <div>
            <span class="label">${o("channelConfigured")}</span>
            <span>${$.configured?o("commonYes"):o("commonNo")}</span>
          </div>
          <div>
            <span class="label">${o("channelPublicKey")}</span>
            <span class="monospace" title="${T??""}">${vi(T)}</span>
          </div>
          <div>
            <span class="label">${o("channelLastInbound")}</span>
            <span>${$.lastInboundAt?Q($.lastInboundAt):o("commonNA")}</span>
          </div>
          ${$.lastError?l`
                <div class="account-card-error">${$.lastError}</div>
              `:v}
        </div>
      </div>
    `},A=()=>{if(b&&r)return Fc({state:i,callbacks:r,accountId:s[0]?.accountId??"default"});const $=d?.profile??n?.profile,{name:T,displayName:C,about:_,picture:M,nip05:D}=$??{},z=T||C||_||M||D;return l`
      <div style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-weight: 500;">${o("nostrProfile")}</div>
          ${g?l`
                <button
                  class="btn btn-sm"
                  @click=${c}
                  style="font-size: 12px; padding: 4px 8px;"
                >
                  ${o("nostrEditProfile")}
                </button>
              `:v}
        </div>
        ${z?l`
              <div class="status-list">
                ${M?l`
                      <div style="margin-bottom: 8px;">
                        <img
                          src=${M}
                          alt=${o("nostrProfilePreview")}
                          style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);"
                          @error=${J=>{J.target.style.display="none"}}
                        />
                      </div>
                    `:v}
                ${T?l`<div><span class="label">${o("nostrName")}</span><span>${T}</span></div>`:v}
                ${C?l`<div><span class="label">${o("nostrDisplayName")}</span><span>${C}</span></div>`:v}
                ${_?l`<div><span class="label">${o("nostrAbout")}</span><span style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${_}</span></div>`:v}
                ${D?l`<div><span class="label">${o("nostrNip05")}</span><span>${D}</span></div>`:v}
              </div>
            `:l`
                <div style="color: var(--text-muted); font-size: 13px">
                  ${o("nostrNoProfileSet")}
                </div>
              `}
      </div>
    `};return l`
    <div class="card">
      <div class="card-title">${o("channelNostr")}</div>
      <div class="card-sub">${o("channelNostrSub")}</div>
      ${a}

      ${m?l`
            <div class="account-card-list">
              ${s.map($=>x($))}
            </div>
          `:l`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">${o("channelConfigured")}</span>
                <span>${o(g?"commonYes":"commonNo")}</span>
              </div>
              <div>
                <span class="label">${o("channelRunning")}</span>
                <span>${o(h?"commonYes":"commonNo")}</span>
              </div>
              <div>
                <span class="label">${o("channelPublicKey")}</span>
                <span class="monospace" title="${p??""}"
                  >${vi(p)}</span
                >
              </div>
              <div>
                <span class="label">${o("channelLastStart")}</span>
                <span>${f?Q(f):o("commonNA")}</span>
              </div>
            </div>
          `}

      ${u?l`<div class="callout danger" style="margin-top: 12px;">${u}</div>`:v}

      ${A()}

      ${Qe({channelId:"nostr",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!1)}>${o("commonRefresh")}</button>
      </div>
    </div>
  `}function tm(e){if(!e&&e!==0)return o("commonNA");const t=Math.round(e/1e3);if(t<60)return`${t}s`;const n=Math.round(t/60);return n<60?`${n}m`:`${Math.round(n/60)}h`}function nm(e,t){const n=t.snapshot,s=n?.channels;if(!n||!s)return!1;const a=s[e],i=typeof a?.configured=="boolean"&&a.configured,r=typeof a?.running=="boolean"&&a.running,c=typeof a?.connected=="boolean"&&a.connected,g=(n.channelAccounts?.[e]??[]).some(h=>h.configured||h.running||h.connected);return i||r||c||g}function sm(e,t){return t?.[e]?.length??0}function bl(e,t){const n=sm(e,t);return n<2?v:l`<div class="account-count">${o("channelAccounts")} (${n})</div>`}function am(e){const{props:t,signal:n,accountCountLabel:s}=e;return l`
    <div class="card">
      <div class="card-title">${o("channelSignal")}</div>
      <div class="card-sub">${o("channelSignalSub")}</div>
      ${s}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${o("channelConfigured")}</span>
          <span>${n?.configured?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelRunning")}</span>
          <span>${n?.running?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelBaseUrl")}</span>
          <span>${n?.baseUrl??o("commonNA")}</span>
        </div>
        <div>
          <span class="label">${o("channelLastStart")}</span>
          <span>${n?.lastStartAt?Q(n.lastStartAt):o("commonNA")}</span>
        </div>
        <div>
          <span class="label">${o("channelLastProbe")}</span>
          <span>${n?.lastProbeAt?Q(n.lastProbeAt):o("commonNA")}</span>
        </div>
      </div>

      ${n?.lastError?l`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:v}

      ${n?.probe?l`<div class="callout" style="margin-top: 12px;">
            ${o("channelProbe")} ${n.probe.ok?o("channelProbeOk"):o("channelProbeFailed")} ·
            ${n.probe.status??""} ${n.probe.error??""}
          </div>`:v}

      ${Qe({channelId:"signal",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          ${o("channelProbe")}
        </button>
      </div>
    </div>
  `}function om(e){const{props:t,slack:n,accountCountLabel:s}=e;return l`
    <div class="card">
      <div class="card-title">${o("channelSlack")}</div>
      <div class="card-sub">${o("channelSlackSub")}</div>
      ${s}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${o("channelConfigured")}</span>
          <span>${n?.configured?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelRunning")}</span>
          <span>${n?.running?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelLastStart")}</span>
          <span>${n?.lastStartAt?Q(n.lastStartAt):o("commonNA")}</span>
        </div>
        <div>
          <span class="label">${o("channelLastProbe")}</span>
          <span>${n?.lastProbeAt?Q(n.lastProbeAt):o("commonNA")}</span>
        </div>
      </div>

      ${n?.lastError?l`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:v}

      ${n?.probe?l`<div class="callout" style="margin-top: 12px;">
            ${o("channelProbe")} ${n.probe.ok?o("channelProbeOk"):o("channelProbeFailed")} ·
            ${n.probe.status??""} ${n.probe.error??""}
          </div>`:v}

      ${Qe({channelId:"slack",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          ${o("channelProbe")}
        </button>
      </div>
    </div>
  `}function im(e){const{props:t,telegram:n,telegramAccounts:s,accountCountLabel:a}=e,i=s.length>1,r=c=>{const g=c.probe?.bot?.username,h=c.name||c.accountId;return l`
      <div class="account-card">
        <div class="account-card-header">
          <div class="account-card-title">
            ${g?`@${g}`:h}
          </div>
          <div class="account-card-id">${c.accountId}</div>
        </div>
        <div class="status-list account-card-status">
          <div>
            <span class="label">${o("channelRunning")}</span>
            <span>${c.running?o("commonYes"):o("commonNo")}</span>
          </div>
          <div>
            <span class="label">${o("channelConfigured")}</span>
            <span>${c.configured?o("commonYes"):o("commonNo")}</span>
          </div>
          <div>
            <span class="label">${o("channelLastInbound")}</span>
            <span>${c.lastInboundAt?Q(c.lastInboundAt):o("commonNA")}</span>
          </div>
          ${c.lastError?l`
                <div class="account-card-error">
                  ${c.lastError}
                </div>
              `:v}
        </div>
      </div>
    `};return l`
    <div class="card">
      <div class="card-title">${o("channelTelegram")}</div>
      <div class="card-sub">${o("channelTelegramSub")}</div>
      ${a}

      ${i?l`
            <div class="account-card-list">
              ${s.map(c=>r(c))}
            </div>
          `:l`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">${o("channelConfigured")}</span>
                <span>${n?.configured?o("commonYes"):o("commonNo")}</span>
              </div>
              <div>
                <span class="label">${o("channelRunning")}</span>
                <span>${n?.running?o("commonYes"):o("commonNo")}</span>
              </div>
              <div>
                <span class="label">${o("channelMode")}</span>
                <span>${n?.mode??o("commonNA")}</span>
              </div>
              <div>
                <span class="label">${o("channelLastStart")}</span>
                <span>${n?.lastStartAt?Q(n.lastStartAt):o("commonNA")}</span>
              </div>
              <div>
                <span class="label">${o("channelLastProbe")}</span>
                <span>${n?.lastProbeAt?Q(n.lastProbeAt):o("commonNA")}</span>
              </div>
            </div>
          `}

      ${n?.lastError?l`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:v}

      ${n?.probe?l`<div class="callout" style="margin-top: 12px;">
            ${o("channelProbe")} ${n.probe.ok?o("channelProbeOk"):o("channelProbeFailed")} ·
            ${n.probe.status??""} ${n.probe.error??""}
          </div>`:v}

      ${Qe({channelId:"telegram",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          ${o("channelProbe")}
        </button>
      </div>
    </div>
  `}function rm(e){const{props:t,whatsapp:n,accountCountLabel:s}=e;return l`
    <div class="card">
      <div class="card-title">${o("channelWhatsApp")}</div>
      <div class="card-sub">${o("channelWhatsAppSub")}</div>
      ${s}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${o("channelConfigured")}</span>
          <span>${n?.configured?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelLinked")}</span>
          <span>${n?.linked?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelRunning")}</span>
          <span>${n?.running?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelConnected")}</span>
          <span>${n?.connected?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelLastConnect")}</span>
          <span>
            ${n?.lastConnectedAt?Q(n.lastConnectedAt):o("commonNA")}
          </span>
        </div>
        <div>
          <span class="label">${o("channelLastMessage")}</span>
          <span>
            ${n?.lastMessageAt?Q(n.lastMessageAt):o("commonNA")}
          </span>
        </div>
        <div>
          <span class="label">${o("channelAuthAge")}</span>
          <span>
            ${n?.authAgeMs!=null?tm(n.authAgeMs):o("commonNA")}
          </span>
        </div>
      </div>

      ${n?.lastError?l`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:v}

      ${t.whatsappMessage?l`<div class="callout" style="margin-top: 12px;">
            ${t.whatsappMessage}
          </div>`:v}

      ${t.whatsappQrDataUrl?l`<div class="qr-wrap">
            <img src=${t.whatsappQrDataUrl} alt="WhatsApp QR" />
          </div>`:v}

      <div class="row" style="margin-top: 14px; flex-wrap: wrap;">
        <button
          class="btn primary"
          ?disabled=${t.whatsappBusy}
          @click=${()=>t.onWhatsAppStart(!1)}
        >
          ${t.whatsappBusy?o("channelWhatsAppWorking"):o("channelShowQr")}
        </button>
        <button
          class="btn"
          ?disabled=${t.whatsappBusy}
          @click=${()=>t.onWhatsAppStart(!0)}
        >
          ${o("channelRelink")}
        </button>
        <button
          class="btn"
          ?disabled=${t.whatsappBusy}
          @click=${()=>t.onWhatsAppWait()}
        >
          ${o("channelWaitForScan")}
        </button>
        <button
          class="btn danger"
          ?disabled=${t.whatsappBusy}
          @click=${()=>t.onWhatsAppLogout()}
        >
          ${o("channelLogout")}
        </button>
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          ${o("commonRefresh")}
        </button>
      </div>

      ${Qe({channelId:"whatsapp",props:t})}
    </div>
  `}function lm(e){const t=e.snapshot?.channels,n=t?.whatsapp??void 0,s=t?.telegram??void 0,a=t?.discord??null,i=t?.googlechat??null,r=t?.slack??null,c=t?.signal??null,d=t?.imessage??null,g=t?.nostr??null,p=cm(e.snapshot).map((f,u)=>({key:f,enabled:nm(f,e),order:u})).toSorted((f,u)=>f.enabled!==u.enabled?f.enabled?-1:1:f.order-u.order);return l`
    <section class="grid grid-cols-2">
      ${p.map(f=>dm(f.key,e,{whatsapp:n,telegram:s,discord:a,googlechat:i,slack:r,signal:c,imessage:d,nostr:g,channelAccounts:e.snapshot?.channelAccounts??null}))}
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${o("channelsHealth")}</div>
          <div class="card-sub">${o("channelsHealthSub")}</div>
        </div>
        <div class="muted">${e.lastSuccessAt?Q(e.lastSuccessAt):o("commonNA")}</div>
      </div>
      ${e.lastError?l`<div class="callout danger" style="margin-top: 12px;">
            ${e.lastError}
          </div>`:v}
      <pre class="code-block" style="margin-top: 12px;">
${e.snapshot?JSON.stringify(e.snapshot,null,2):o("channelsNoSnapshot")}
      </pre>
    </section>
  `}function cm(e){return e?.channelMeta?.length?e.channelMeta.map(t=>t.id):e?.channelOrder?.length?e.channelOrder:["whatsapp","telegram","discord","googlechat","slack","signal","imessage","nostr"]}function dm(e,t,n){const s=bl(e,n.channelAccounts);switch(e){case"whatsapp":return rm({props:t,whatsapp:n.whatsapp,accountCountLabel:s});case"telegram":return im({props:t,telegram:n.telegram,telegramAccounts:n.channelAccounts?.telegram??[],accountCountLabel:s});case"discord":return Jp({props:t,discord:n.discord,accountCountLabel:s});case"googlechat":return Zp({props:t,googleChat:n.googlechat,accountCountLabel:s});case"slack":return om({props:t,slack:n.slack,accountCountLabel:s});case"signal":return am({props:t,signal:n.signal,accountCountLabel:s});case"imessage":return Xp({props:t,imessage:n.imessage,accountCountLabel:s});case"nostr":{const a=n.channelAccounts?.nostr??[],i=a[0],r=i?.accountId??"default",c=i?.profile??null,d=t.nostrProfileAccountId===r?t.nostrProfileFormState:null,g=d?{onFieldChange:t.onNostrProfileFieldChange,onSave:t.onNostrProfileSave,onImport:t.onNostrProfileImport,onCancel:t.onNostrProfileCancel,onToggleAdvanced:t.onNostrProfileToggleAdvanced}:null;return em({props:t,nostr:n.nostr,nostrAccounts:a,accountCountLabel:s,profileFormState:d,profileFormCallbacks:g,onEditProfile:()=>t.onNostrProfileEdit(r,c)})}default:return um(e,t,n.channelAccounts??{})}}function um(e,t,n){const s=pm(t.snapshot,e),a=t.snapshot?.channels?.[e],i=typeof a?.configured=="boolean"?a.configured:void 0,r=typeof a?.running=="boolean"?a.running:void 0,c=typeof a?.connected=="boolean"?a.connected:void 0,d=typeof a?.lastError=="string"?a.lastError:void 0,g=n[e]??[],h=bl(e,n);return l`
    <div class="card">
      <div class="card-title">${s}</div>
      <div class="card-sub">${o("channelGenericSub")}</div>
      ${h}

      ${g.length>0?l`
            <div class="account-card-list">
              ${g.map(p=>vm(p))}
            </div>
          `:l`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">${o("channelConfigured")}</span>
                <span>${i==null?o("commonNA"):o(i?"commonYes":"commonNo")}</span>
              </div>
              <div>
                <span class="label">${o("channelRunning")}</span>
                <span>${r==null?o("commonNA"):o(r?"commonYes":"commonNo")}</span>
              </div>
              <div>
                <span class="label">${o("channelConnected")}</span>
                <span>${c==null?o("commonNA"):o(c?"commonYes":"commonNo")}</span>
              </div>
            </div>
          `}

      ${d?l`<div class="callout danger" style="margin-top: 12px;">
            ${d}
          </div>`:v}

      ${Qe({channelId:e,props:t})}
    </div>
  `}function gm(e){return e?.channelMeta?.length?Object.fromEntries(e.channelMeta.map(t=>[t.id,t])):{}}function pm(e,t){return gm(e)[t]?.label??e?.channelLabels?.[t]??t}const mm=600*1e3;function yl(e){return e.lastInboundAt?Date.now()-e.lastInboundAt<mm:!1}function hm(e){return e.running?"commonYes":yl(e)?"channelActive":"commonNo"}function fm(e){return e.connected===!0?"commonYes":e.connected===!1?"commonNo":yl(e)?"channelActive":"commonNA"}function vm(e){const t=hm(e),n=fm(e);return l`
    <div class="account-card">
      <div class="account-card-header">
        <div class="account-card-title">${e.name||e.accountId}</div>
        <div class="account-card-id">${e.accountId}</div>
      </div>
      <div class="status-list account-card-status">
        <div>
          <span class="label">${o("channelRunning")}</span>
          <span>${o(t)}</span>
        </div>
        <div>
          <span class="label">${o("channelConfigured")}</span>
          <span>${e.configured?o("commonYes"):o("commonNo")}</span>
        </div>
        <div>
          <span class="label">${o("channelConnected")}</span>
          <span>${o(n)}</span>
        </div>
        <div>
          <span class="label">${o("channelLastInbound")}</span>
          <span>${e.lastInboundAt?Q(e.lastInboundAt):o("commonNA")}</span>
        </div>
        ${e.lastError?l`
              <div class="account-card-error">
                ${e.lastError}
              </div>
            `:v}
      </div>
    </div>
  `}const en=(e,t)=>{const n=e._$AN;if(n===void 0)return!1;for(const s of n)s._$AO?.(t,!1),en(s,t);return!0},Wn=e=>{let t,n;do{if((t=e._$AM)===void 0)break;n=t._$AN,n.delete(e),e=t}while(n?.size===0)},wl=e=>{for(let t;t=e._$AM;e=t){let n=t._$AN;if(n===void 0)t._$AN=n=new Set;else if(n.has(e))break;n.add(e),wm(t)}};function bm(e){this._$AN!==void 0?(Wn(this),this._$AM=e,wl(this)):this._$AM=e}function ym(e,t=!1,n=0){const s=this._$AH,a=this._$AN;if(a!==void 0&&a.size!==0)if(t)if(Array.isArray(s))for(let i=n;i<s.length;i++)en(s[i],!1),Wn(s[i]);else s!=null&&(en(s,!1),Wn(s));else en(this,e)}const wm=e=>{e.type==Ga.CHILD&&(e._$AP??=ym,e._$AQ??=bm)};class xm extends Qa{constructor(){super(...arguments),this._$AN=void 0}_$AT(t,n,s){super._$AT(t,n,s),wl(this),this.isConnected=t._$AU}_$AO(t,n=!0){t!==this.isConnected&&(this.isConnected=t,t?this.reconnected?.():this.disconnected?.()),n&&(en(this,t),Wn(this))}setValue(t){if(kg(this._$Ct))this._$Ct._$AI(t,this);else{const n=[...this._$Ct._$AH];n[this._$Ci]=t,this._$Ct._$AI(n,this,0)}}disconnected(){}reconnected(){}}const Ps=new WeakMap,$m=Va(class extends xm{render(e){return v}update(e,[t]){const n=t!==this.G;return n&&this.G!==void 0&&this.rt(void 0),(n||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),v}rt(e){if(this.isConnected||(e=void 0),typeof this.G=="function"){const t=this.ht??globalThis;let n=Ps.get(t);n===void 0&&(n=new WeakMap,Ps.set(t,n)),n.get(this.G)!==void 0&&this.G.call(this.ht,void 0),n.set(this.G,e),e!==void 0&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){return typeof this.G=="function"?Ps.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}});class ua extends Qa{constructor(t){if(super(t),this.it=v,t.type!==Ga.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===v||t==null)return this._t=void 0,this.it=t;if(t===Ze)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const n=[t];return n.raw=n,this._t={_$litType$:this.constructor.resultType,strings:n,values:[]}}}ua.directiveName="unsafeHTML",ua.resultType=1;const ga=Va(ua);const{entries:xl,setPrototypeOf:bi,isFrozen:Sm,getPrototypeOf:km,getOwnPropertyDescriptor:Am}=Object;let{freeze:ve,seal:Te,create:pa}=Object,{apply:ma,construct:ha}=typeof Reflect<"u"&&Reflect;ve||(ve=function(t){return t});Te||(Te=function(t){return t});ma||(ma=function(t,n){for(var s=arguments.length,a=new Array(s>2?s-2:0),i=2;i<s;i++)a[i-2]=arguments[i];return t.apply(n,a)});ha||(ha=function(t){for(var n=arguments.length,s=new Array(n>1?n-1:0),a=1;a<n;a++)s[a-1]=arguments[a];return new t(...s)});const Cn=be(Array.prototype.forEach),Cm=be(Array.prototype.lastIndexOf),yi=be(Array.prototype.pop),Ht=be(Array.prototype.push),Tm=be(Array.prototype.splice),Nn=be(String.prototype.toLowerCase),Ns=be(String.prototype.toString),Fs=be(String.prototype.match),zt=be(String.prototype.replace),_m=be(String.prototype.indexOf),Mm=be(String.prototype.trim),_e=be(Object.prototype.hasOwnProperty),he=be(RegExp.prototype.test),Wt=Em(TypeError);function be(e){return function(t){t instanceof RegExp&&(t.lastIndex=0);for(var n=arguments.length,s=new Array(n>1?n-1:0),a=1;a<n;a++)s[a-1]=arguments[a];return ma(e,t,s)}}function Em(e){return function(){for(var t=arguments.length,n=new Array(t),s=0;s<t;s++)n[s]=arguments[s];return ha(e,n)}}function j(e,t){let n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:Nn;bi&&bi(e,null);let s=t.length;for(;s--;){let a=t[s];if(typeof a=="string"){const i=n(a);i!==a&&(Sm(t)||(t[s]=i),a=i)}e[a]=!0}return e}function Lm(e){for(let t=0;t<e.length;t++)_e(e,t)||(e[t]=null);return e}function Re(e){const t=pa(null);for(const[n,s]of xl(e))_e(e,n)&&(Array.isArray(s)?t[n]=Lm(s):s&&typeof s=="object"&&s.constructor===Object?t[n]=Re(s):t[n]=s);return t}function Kt(e,t){for(;e!==null;){const s=Am(e,t);if(s){if(s.get)return be(s.get);if(typeof s.value=="function")return be(s.value)}e=km(e)}function n(){return null}return n}const wi=ve(["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blink","blockquote","body","br","button","canvas","caption","center","cite","code","col","colgroup","content","data","datalist","dd","decorator","del","details","dfn","dialog","dir","div","dl","dt","element","em","fieldset","figcaption","figure","font","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","main","map","mark","marquee","menu","menuitem","meter","nav","nobr","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","search","section","select","shadow","slot","small","source","spacer","span","strike","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","track","tt","u","ul","var","video","wbr"]),Os=ve(["svg","a","altglyph","altglyphdef","altglyphitem","animatecolor","animatemotion","animatetransform","circle","clippath","defs","desc","ellipse","enterkeyhint","exportparts","filter","font","g","glyph","glyphref","hkern","image","inputmode","line","lineargradient","marker","mask","metadata","mpath","part","path","pattern","polygon","polyline","radialgradient","rect","stop","style","switch","symbol","text","textpath","title","tref","tspan","view","vkern"]),Us=ve(["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]),Im=ve(["animate","color-profile","cursor","discard","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignobject","hatch","hatchpath","mesh","meshgradient","meshpatch","meshrow","missing-glyph","script","set","solidcolor","unknown","use"]),Bs=ve(["math","menclose","merror","mfenced","mfrac","mglyph","mi","mlabeledtr","mmultiscripts","mn","mo","mover","mpadded","mphantom","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msup","msubsup","mtable","mtd","mtext","mtr","munder","munderover","mprescripts"]),Dm=ve(["maction","maligngroup","malignmark","mlongdiv","mscarries","mscarry","msgroup","mstack","msline","msrow","semantics","annotation","annotation-xml","mprescripts","none"]),xi=ve(["#text"]),$i=ve(["accept","action","align","alt","autocapitalize","autocomplete","autopictureinpicture","autoplay","background","bgcolor","border","capture","cellpadding","cellspacing","checked","cite","class","clear","color","cols","colspan","controls","controlslist","coords","crossorigin","datetime","decoding","default","dir","disabled","disablepictureinpicture","disableremoteplayback","download","draggable","enctype","enterkeyhint","exportparts","face","for","headers","height","hidden","high","href","hreflang","id","inert","inputmode","integrity","ismap","kind","label","lang","list","loading","loop","low","max","maxlength","media","method","min","minlength","multiple","muted","name","nonce","noshade","novalidate","nowrap","open","optimum","part","pattern","placeholder","playsinline","popover","popovertarget","popovertargetaction","poster","preload","pubdate","radiogroup","readonly","rel","required","rev","reversed","role","rows","rowspan","spellcheck","scope","selected","shape","size","sizes","slot","span","srclang","start","src","srcset","step","style","summary","tabindex","title","translate","type","usemap","valign","value","width","wrap","xmlns","slot"]),Hs=ve(["accent-height","accumulate","additive","alignment-baseline","amplitude","ascent","attributename","attributetype","azimuth","basefrequency","baseline-shift","begin","bias","by","class","clip","clippathunits","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","cx","cy","d","dx","dy","diffuseconstant","direction","display","divisor","dur","edgemode","elevation","end","exponent","fill","fill-opacity","fill-rule","filter","filterunits","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","fx","fy","g1","g2","glyph-name","glyphref","gradientunits","gradienttransform","height","href","id","image-rendering","in","in2","intercept","k","k1","k2","k3","k4","kerning","keypoints","keysplines","keytimes","lang","lengthadjust","letter-spacing","kernelmatrix","kernelunitlength","lighting-color","local","marker-end","marker-mid","marker-start","markerheight","markerunits","markerwidth","maskcontentunits","maskunits","max","mask","mask-type","media","method","mode","min","name","numoctaves","offset","operator","opacity","order","orient","orientation","origin","overflow","paint-order","path","pathlength","patterncontentunits","patterntransform","patternunits","points","preservealpha","preserveaspectratio","primitiveunits","r","rx","ry","radius","refx","refy","repeatcount","repeatdur","restart","result","rotate","scale","seed","shape-rendering","slope","specularconstant","specularexponent","spreadmethod","startoffset","stddeviation","stitchtiles","stop-color","stop-opacity","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke","stroke-width","style","surfacescale","systemlanguage","tabindex","tablevalues","targetx","targety","transform","transform-origin","text-anchor","text-decoration","text-rendering","textlength","type","u1","u2","unicode","values","viewbox","visibility","version","vert-adv-y","vert-origin-x","vert-origin-y","width","word-spacing","wrap","writing-mode","xchannelselector","ychannelselector","x","x1","x2","xmlns","y","y1","y2","z","zoomandpan"]),Si=ve(["accent","accentunder","align","bevelled","close","columnsalign","columnlines","columnspan","denomalign","depth","dir","display","displaystyle","encoding","fence","frame","height","href","id","largeop","length","linethickness","lspace","lquote","mathbackground","mathcolor","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","numalign","open","rowalign","rowlines","rowspacing","rowspan","rspace","rquote","scriptlevel","scriptminsize","scriptsizemultiplier","selection","separator","separators","stretchy","subscriptshift","supscriptshift","symmetric","voffset","width","xmlns"]),Tn=ve(["xlink:href","xml:id","xlink:title","xml:space","xmlns:xlink"]),Rm=Te(/\{\{[\w\W]*|[\w\W]*\}\}/gm),Pm=Te(/<%[\w\W]*|[\w\W]*%>/gm),Nm=Te(/\$\{[\w\W]*/gm),Fm=Te(/^data-[\-\w.\u00B7-\uFFFF]+$/),Om=Te(/^aria-[\-\w]+$/),$l=Te(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),Um=Te(/^(?:\w+script|data):/i),Bm=Te(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),Sl=Te(/^html$/i),Hm=Te(/^[a-z][.\w]*(-[.\w]+)+$/i);var ki=Object.freeze({__proto__:null,ARIA_ATTR:Om,ATTR_WHITESPACE:Bm,CUSTOM_ELEMENT:Hm,DATA_ATTR:Fm,DOCTYPE_NAME:Sl,ERB_EXPR:Pm,IS_ALLOWED_URI:$l,IS_SCRIPT_OR_DATA:Um,MUSTACHE_EXPR:Rm,TMPLIT_EXPR:Nm});const jt={element:1,text:3,progressingInstruction:7,comment:8,document:9},zm=function(){return typeof window>"u"?null:window},Wm=function(t,n){if(typeof t!="object"||typeof t.createPolicy!="function")return null;let s=null;const a="data-tt-policy-suffix";n&&n.hasAttribute(a)&&(s=n.getAttribute(a));const i="dompurify"+(s?"#"+s:"");try{return t.createPolicy(i,{createHTML(r){return r},createScriptURL(r){return r}})}catch{return console.warn("TrustedTypes policy "+i+" could not be created."),null}},Ai=function(){return{afterSanitizeAttributes:[],afterSanitizeElements:[],afterSanitizeShadowDOM:[],beforeSanitizeAttributes:[],beforeSanitizeElements:[],beforeSanitizeShadowDOM:[],uponSanitizeAttribute:[],uponSanitizeElement:[],uponSanitizeShadowNode:[]}};function kl(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:zm();const t=H=>kl(H);if(t.version="3.3.1",t.removed=[],!e||!e.document||e.document.nodeType!==jt.document||!e.Element)return t.isSupported=!1,t;let{document:n}=e;const s=n,a=s.currentScript,{DocumentFragment:i,HTMLTemplateElement:r,Node:c,Element:d,NodeFilter:g,NamedNodeMap:h=e.NamedNodeMap||e.MozNamedAttrMap,HTMLFormElement:p,DOMParser:f,trustedTypes:u}=e,m=d.prototype,b=Kt(m,"cloneNode"),x=Kt(m,"remove"),A=Kt(m,"nextSibling"),$=Kt(m,"childNodes"),T=Kt(m,"parentNode");if(typeof r=="function"){const H=n.createElement("template");H.content&&H.content.ownerDocument&&(n=H.content.ownerDocument)}let C,_="";const{implementation:M,createNodeIterator:D,createDocumentFragment:z,getElementsByTagName:J}=n,{importNode:ae}=s;let F=Ai();t.isSupported=typeof xl=="function"&&typeof T=="function"&&M&&M.createHTMLDocument!==void 0;const{MUSTACHE_EXPR:W,ERB_EXPR:de,TMPLIT_EXPR:E,DATA_ATTR:B,ARIA_ATTR:oe,IS_SCRIPT_OR_DATA:ie,ATTR_WHITESPACE:X,CUSTOM_ELEMENT:ne}=ki;let{IS_ALLOWED_URI:I}=ki,R=null;const P=j({},[...wi,...Os,...Us,...Bs,...xi]);let K=null;const xe=j({},[...$i,...Hs,...Si,...Tn]);let Y=Object.seal(pa(null,{tagNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},allowCustomizedBuiltInElements:{writable:!0,configurable:!1,enumerable:!0,value:!1}})),Ae=null,ee=null;const me=Object.seal(pa(null,{tagCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeCheck:{writable:!0,configurable:!1,enumerable:!0,value:null}}));let Oe=!0,Ue=!0,tt=!1,go=!0,St=!1,mn=!0,nt=!1,gs=!1,ps=!1,kt=!1,hn=!1,fn=!1,po=!0,mo=!1;const ql="user-content-";let ms=!0,Ft=!1,At={},Le=null;const hs=j({},["annotation-xml","audio","colgroup","desc","foreignobject","head","iframe","math","mi","mn","mo","ms","mtext","noembed","noframes","noscript","plaintext","script","style","svg","template","thead","title","video","xmp"]);let ho=null;const fo=j({},["audio","video","img","source","image","track"]);let fs=null;const vo=j({},["alt","class","for","id","label","name","pattern","placeholder","role","summary","title","value","style","xmlns"]),vn="http://www.w3.org/1998/Math/MathML",bn="http://www.w3.org/2000/svg",Be="http://www.w3.org/1999/xhtml";let Ct=Be,vs=!1,bs=null;const Gl=j({},[vn,bn,Be],Ns);let yn=j({},["mi","mo","mn","ms","mtext"]),wn=j({},["annotation-xml"]);const Vl=j({},["title","style","font","a","script"]);let Ot=null;const Ql=["application/xhtml+xml","text/html"],Yl="text/html";let se=null,Tt=null;const Jl=n.createElement("form"),bo=function(y){return y instanceof RegExp||y instanceof Function},ys=function(){let y=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};if(!(Tt&&Tt===y)){if((!y||typeof y!="object")&&(y={}),y=Re(y),Ot=Ql.indexOf(y.PARSER_MEDIA_TYPE)===-1?Yl:y.PARSER_MEDIA_TYPE,se=Ot==="application/xhtml+xml"?Ns:Nn,R=_e(y,"ALLOWED_TAGS")?j({},y.ALLOWED_TAGS,se):P,K=_e(y,"ALLOWED_ATTR")?j({},y.ALLOWED_ATTR,se):xe,bs=_e(y,"ALLOWED_NAMESPACES")?j({},y.ALLOWED_NAMESPACES,Ns):Gl,fs=_e(y,"ADD_URI_SAFE_ATTR")?j(Re(vo),y.ADD_URI_SAFE_ATTR,se):vo,ho=_e(y,"ADD_DATA_URI_TAGS")?j(Re(fo),y.ADD_DATA_URI_TAGS,se):fo,Le=_e(y,"FORBID_CONTENTS")?j({},y.FORBID_CONTENTS,se):hs,Ae=_e(y,"FORBID_TAGS")?j({},y.FORBID_TAGS,se):Re({}),ee=_e(y,"FORBID_ATTR")?j({},y.FORBID_ATTR,se):Re({}),At=_e(y,"USE_PROFILES")?y.USE_PROFILES:!1,Oe=y.ALLOW_ARIA_ATTR!==!1,Ue=y.ALLOW_DATA_ATTR!==!1,tt=y.ALLOW_UNKNOWN_PROTOCOLS||!1,go=y.ALLOW_SELF_CLOSE_IN_ATTR!==!1,St=y.SAFE_FOR_TEMPLATES||!1,mn=y.SAFE_FOR_XML!==!1,nt=y.WHOLE_DOCUMENT||!1,kt=y.RETURN_DOM||!1,hn=y.RETURN_DOM_FRAGMENT||!1,fn=y.RETURN_TRUSTED_TYPE||!1,ps=y.FORCE_BODY||!1,po=y.SANITIZE_DOM!==!1,mo=y.SANITIZE_NAMED_PROPS||!1,ms=y.KEEP_CONTENT!==!1,Ft=y.IN_PLACE||!1,I=y.ALLOWED_URI_REGEXP||$l,Ct=y.NAMESPACE||Be,yn=y.MATHML_TEXT_INTEGRATION_POINTS||yn,wn=y.HTML_INTEGRATION_POINTS||wn,Y=y.CUSTOM_ELEMENT_HANDLING||{},y.CUSTOM_ELEMENT_HANDLING&&bo(y.CUSTOM_ELEMENT_HANDLING.tagNameCheck)&&(Y.tagNameCheck=y.CUSTOM_ELEMENT_HANDLING.tagNameCheck),y.CUSTOM_ELEMENT_HANDLING&&bo(y.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)&&(Y.attributeNameCheck=y.CUSTOM_ELEMENT_HANDLING.attributeNameCheck),y.CUSTOM_ELEMENT_HANDLING&&typeof y.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements=="boolean"&&(Y.allowCustomizedBuiltInElements=y.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements),St&&(Ue=!1),hn&&(kt=!0),At&&(R=j({},xi),K=[],At.html===!0&&(j(R,wi),j(K,$i)),At.svg===!0&&(j(R,Os),j(K,Hs),j(K,Tn)),At.svgFilters===!0&&(j(R,Us),j(K,Hs),j(K,Tn)),At.mathMl===!0&&(j(R,Bs),j(K,Si),j(K,Tn))),y.ADD_TAGS&&(typeof y.ADD_TAGS=="function"?me.tagCheck=y.ADD_TAGS:(R===P&&(R=Re(R)),j(R,y.ADD_TAGS,se))),y.ADD_ATTR&&(typeof y.ADD_ATTR=="function"?me.attributeCheck=y.ADD_ATTR:(K===xe&&(K=Re(K)),j(K,y.ADD_ATTR,se))),y.ADD_URI_SAFE_ATTR&&j(fs,y.ADD_URI_SAFE_ATTR,se),y.FORBID_CONTENTS&&(Le===hs&&(Le=Re(Le)),j(Le,y.FORBID_CONTENTS,se)),y.ADD_FORBID_CONTENTS&&(Le===hs&&(Le=Re(Le)),j(Le,y.ADD_FORBID_CONTENTS,se)),ms&&(R["#text"]=!0),nt&&j(R,["html","head","body"]),R.table&&(j(R,["tbody"]),delete Ae.tbody),y.TRUSTED_TYPES_POLICY){if(typeof y.TRUSTED_TYPES_POLICY.createHTML!="function")throw Wt('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');if(typeof y.TRUSTED_TYPES_POLICY.createScriptURL!="function")throw Wt('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');C=y.TRUSTED_TYPES_POLICY,_=C.createHTML("")}else C===void 0&&(C=Wm(u,a)),C!==null&&typeof _=="string"&&(_=C.createHTML(""));ve&&ve(y),Tt=y}},yo=j({},[...Os,...Us,...Im]),wo=j({},[...Bs,...Dm]),Zl=function(y){let L=T(y);(!L||!L.tagName)&&(L={namespaceURI:Ct,tagName:"template"});const O=Nn(y.tagName),Z=Nn(L.tagName);return bs[y.namespaceURI]?y.namespaceURI===bn?L.namespaceURI===Be?O==="svg":L.namespaceURI===vn?O==="svg"&&(Z==="annotation-xml"||yn[Z]):!!yo[O]:y.namespaceURI===vn?L.namespaceURI===Be?O==="math":L.namespaceURI===bn?O==="math"&&wn[Z]:!!wo[O]:y.namespaceURI===Be?L.namespaceURI===bn&&!wn[Z]||L.namespaceURI===vn&&!yn[Z]?!1:!wo[O]&&(Vl[O]||!yo[O]):!!(Ot==="application/xhtml+xml"&&bs[y.namespaceURI]):!1},Ie=function(y){Ht(t.removed,{element:y});try{T(y).removeChild(y)}catch{x(y)}},st=function(y,L){try{Ht(t.removed,{attribute:L.getAttributeNode(y),from:L})}catch{Ht(t.removed,{attribute:null,from:L})}if(L.removeAttribute(y),y==="is")if(kt||hn)try{Ie(L)}catch{}else try{L.setAttribute(y,"")}catch{}},xo=function(y){let L=null,O=null;if(ps)y="<remove></remove>"+y;else{const te=Fs(y,/^[\r\n\t ]+/);O=te&&te[0]}Ot==="application/xhtml+xml"&&Ct===Be&&(y='<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>'+y+"</body></html>");const Z=C?C.createHTML(y):y;if(Ct===Be)try{L=new f().parseFromString(Z,Ot)}catch{}if(!L||!L.documentElement){L=M.createDocument(Ct,"template",null);try{L.documentElement.innerHTML=vs?_:Z}catch{}}const ue=L.body||L.documentElement;return y&&O&&ue.insertBefore(n.createTextNode(O),ue.childNodes[0]||null),Ct===Be?J.call(L,nt?"html":"body")[0]:nt?L.documentElement:ue},$o=function(y){return D.call(y.ownerDocument||y,y,g.SHOW_ELEMENT|g.SHOW_COMMENT|g.SHOW_TEXT|g.SHOW_PROCESSING_INSTRUCTION|g.SHOW_CDATA_SECTION,null)},ws=function(y){return y instanceof p&&(typeof y.nodeName!="string"||typeof y.textContent!="string"||typeof y.removeChild!="function"||!(y.attributes instanceof h)||typeof y.removeAttribute!="function"||typeof y.setAttribute!="function"||typeof y.namespaceURI!="string"||typeof y.insertBefore!="function"||typeof y.hasChildNodes!="function")},So=function(y){return typeof c=="function"&&y instanceof c};function He(H,y,L){Cn(H,O=>{O.call(t,y,L,Tt)})}const ko=function(y){let L=null;if(He(F.beforeSanitizeElements,y,null),ws(y))return Ie(y),!0;const O=se(y.nodeName);if(He(F.uponSanitizeElement,y,{tagName:O,allowedTags:R}),mn&&y.hasChildNodes()&&!So(y.firstElementChild)&&he(/<[/\w!]/g,y.innerHTML)&&he(/<[/\w!]/g,y.textContent)||y.nodeType===jt.progressingInstruction||mn&&y.nodeType===jt.comment&&he(/<[/\w]/g,y.data))return Ie(y),!0;if(!(me.tagCheck instanceof Function&&me.tagCheck(O))&&(!R[O]||Ae[O])){if(!Ae[O]&&Co(O)&&(Y.tagNameCheck instanceof RegExp&&he(Y.tagNameCheck,O)||Y.tagNameCheck instanceof Function&&Y.tagNameCheck(O)))return!1;if(ms&&!Le[O]){const Z=T(y)||y.parentNode,ue=$(y)||y.childNodes;if(ue&&Z){const te=ue.length;for(let ye=te-1;ye>=0;--ye){const ze=b(ue[ye],!0);ze.__removalCount=(y.__removalCount||0)+1,Z.insertBefore(ze,A(y))}}}return Ie(y),!0}return y instanceof d&&!Zl(y)||(O==="noscript"||O==="noembed"||O==="noframes")&&he(/<\/no(script|embed|frames)/i,y.innerHTML)?(Ie(y),!0):(St&&y.nodeType===jt.text&&(L=y.textContent,Cn([W,de,E],Z=>{L=zt(L,Z," ")}),y.textContent!==L&&(Ht(t.removed,{element:y.cloneNode()}),y.textContent=L)),He(F.afterSanitizeElements,y,null),!1)},Ao=function(y,L,O){if(po&&(L==="id"||L==="name")&&(O in n||O in Jl))return!1;if(!(Ue&&!ee[L]&&he(B,L))){if(!(Oe&&he(oe,L))){if(!(me.attributeCheck instanceof Function&&me.attributeCheck(L,y))){if(!K[L]||ee[L]){if(!(Co(y)&&(Y.tagNameCheck instanceof RegExp&&he(Y.tagNameCheck,y)||Y.tagNameCheck instanceof Function&&Y.tagNameCheck(y))&&(Y.attributeNameCheck instanceof RegExp&&he(Y.attributeNameCheck,L)||Y.attributeNameCheck instanceof Function&&Y.attributeNameCheck(L,y))||L==="is"&&Y.allowCustomizedBuiltInElements&&(Y.tagNameCheck instanceof RegExp&&he(Y.tagNameCheck,O)||Y.tagNameCheck instanceof Function&&Y.tagNameCheck(O))))return!1}else if(!fs[L]){if(!he(I,zt(O,X,""))){if(!((L==="src"||L==="xlink:href"||L==="href")&&y!=="script"&&_m(O,"data:")===0&&ho[y])){if(!(tt&&!he(ie,zt(O,X,"")))){if(O)return!1}}}}}}}return!0},Co=function(y){return y!=="annotation-xml"&&Fs(y,ne)},To=function(y){He(F.beforeSanitizeAttributes,y,null);const{attributes:L}=y;if(!L||ws(y))return;const O={attrName:"",attrValue:"",keepAttr:!0,allowedAttributes:K,forceKeepAttr:void 0};let Z=L.length;for(;Z--;){const ue=L[Z],{name:te,namespaceURI:ye,value:ze}=ue,_t=se(te),xs=ze;let le=te==="value"?xs:Mm(xs);if(O.attrName=_t,O.attrValue=le,O.keepAttr=!0,O.forceKeepAttr=void 0,He(F.uponSanitizeAttribute,y,O),le=O.attrValue,mo&&(_t==="id"||_t==="name")&&(st(te,y),le=ql+le),mn&&he(/((--!?|])>)|<\/(style|title|textarea)/i,le)){st(te,y);continue}if(_t==="attributename"&&Fs(le,"href")){st(te,y);continue}if(O.forceKeepAttr)continue;if(!O.keepAttr){st(te,y);continue}if(!go&&he(/\/>/i,le)){st(te,y);continue}St&&Cn([W,de,E],Mo=>{le=zt(le,Mo," ")});const _o=se(y.nodeName);if(!Ao(_o,_t,le)){st(te,y);continue}if(C&&typeof u=="object"&&typeof u.getAttributeType=="function"&&!ye)switch(u.getAttributeType(_o,_t)){case"TrustedHTML":{le=C.createHTML(le);break}case"TrustedScriptURL":{le=C.createScriptURL(le);break}}if(le!==xs)try{ye?y.setAttributeNS(ye,te,le):y.setAttribute(te,le),ws(y)?Ie(y):yi(t.removed)}catch{st(te,y)}}He(F.afterSanitizeAttributes,y,null)},Xl=function H(y){let L=null;const O=$o(y);for(He(F.beforeSanitizeShadowDOM,y,null);L=O.nextNode();)He(F.uponSanitizeShadowNode,L,null),ko(L),To(L),L.content instanceof i&&H(L.content);He(F.afterSanitizeShadowDOM,y,null)};return t.sanitize=function(H){let y=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},L=null,O=null,Z=null,ue=null;if(vs=!H,vs&&(H="<!-->"),typeof H!="string"&&!So(H))if(typeof H.toString=="function"){if(H=H.toString(),typeof H!="string")throw Wt("dirty is not a string, aborting")}else throw Wt("toString is not a function");if(!t.isSupported)return H;if(gs||ys(y),t.removed=[],typeof H=="string"&&(Ft=!1),Ft){if(H.nodeName){const ze=se(H.nodeName);if(!R[ze]||Ae[ze])throw Wt("root node is forbidden and cannot be sanitized in-place")}}else if(H instanceof c)L=xo("<!---->"),O=L.ownerDocument.importNode(H,!0),O.nodeType===jt.element&&O.nodeName==="BODY"||O.nodeName==="HTML"?L=O:L.appendChild(O);else{if(!kt&&!St&&!nt&&H.indexOf("<")===-1)return C&&fn?C.createHTML(H):H;if(L=xo(H),!L)return kt?null:fn?_:""}L&&ps&&Ie(L.firstChild);const te=$o(Ft?H:L);for(;Z=te.nextNode();)ko(Z),To(Z),Z.content instanceof i&&Xl(Z.content);if(Ft)return H;if(kt){if(hn)for(ue=z.call(L.ownerDocument);L.firstChild;)ue.appendChild(L.firstChild);else ue=L;return(K.shadowroot||K.shadowrootmode)&&(ue=ae.call(s,ue,!0)),ue}let ye=nt?L.outerHTML:L.innerHTML;return nt&&R["!doctype"]&&L.ownerDocument&&L.ownerDocument.doctype&&L.ownerDocument.doctype.name&&he(Sl,L.ownerDocument.doctype.name)&&(ye="<!DOCTYPE "+L.ownerDocument.doctype.name+`>
`+ye),St&&Cn([W,de,E],ze=>{ye=zt(ye,ze," ")}),C&&fn?C.createHTML(ye):ye},t.setConfig=function(){let H=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};ys(H),gs=!0},t.clearConfig=function(){Tt=null,gs=!1},t.isValidAttribute=function(H,y,L){Tt||ys({});const O=se(H),Z=se(y);return Ao(O,Z,L)},t.addHook=function(H,y){typeof y=="function"&&Ht(F[H],y)},t.removeHook=function(H,y){if(y!==void 0){const L=Cm(F[H],y);return L===-1?void 0:Tm(F[H],L,1)[0]}return yi(F[H])},t.removeHooks=function(H){F[H]=[]},t.removeAllHooks=function(){F=Ai()},t}var fa=kl();function Ja(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var $t=Ja();function Al(e){$t=e}var tn={exec:()=>null};function q(e,t=""){let n=typeof e=="string"?e:e.source,s={replace:(a,i)=>{let r=typeof i=="string"?i:i.source;return r=r.replace(fe.caret,"$1"),n=n.replace(a,r),s},getRegex:()=>new RegExp(n,t)};return s}var Km=(()=>{try{return!!new RegExp("(?<=1)(?<!1)")}catch{return!1}})(),fe={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceTabs:/^\t+/,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] +\S/,listReplaceTask:/^\[[ xX]\] +/,listTaskCheckbox:/\[[ xX]\]/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,unescapeTest:/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:e=>new RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),hrRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),fencesBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}(?:\`\`\`|~~~)`),headingBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}#`),htmlBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}<(?:[a-z].*>|!--)`,"i")},jm=/^(?:[ \t]*(?:\n|$))+/,qm=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,Gm=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,pn=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,Vm=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,Za=/(?:[*+-]|\d{1,9}[.)])/,Cl=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,Tl=q(Cl).replace(/bull/g,Za).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),Qm=q(Cl).replace(/bull/g,Za).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),Xa=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,Ym=/^[^\n]+/,eo=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,Jm=q(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",eo).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),Zm=q(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,Za).getRegex(),cs="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",to=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,Xm=q("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",to).replace("tag",cs).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),_l=q(Xa).replace("hr",pn).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",cs).getRegex(),eh=q(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",_l).getRegex(),no={blockquote:eh,code:qm,def:Jm,fences:Gm,heading:Vm,hr:pn,html:Xm,lheading:Tl,list:Zm,newline:jm,paragraph:_l,table:tn,text:Ym},Ci=q("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",pn).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",cs).getRegex(),th={...no,lheading:Qm,table:Ci,paragraph:q(Xa).replace("hr",pn).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",Ci).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",cs).getRegex()},nh={...no,html:q(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",to).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:tn,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:q(Xa).replace("hr",pn).replace("heading",` *#{1,6} *[^
]`).replace("lheading",Tl).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},sh=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,ah=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,Ml=/^( {2,}|\\)\n(?!\s*$)/,oh=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,ds=/[\p{P}\p{S}]/u,so=/[\s\p{P}\p{S}]/u,El=/[^\s\p{P}\p{S}]/u,ih=q(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,so).getRegex(),Ll=/(?!~)[\p{P}\p{S}]/u,rh=/(?!~)[\s\p{P}\p{S}]/u,lh=/(?:[^\s\p{P}\p{S}]|~)/u,ch=q(/link|precode-code|html/,"g").replace("link",/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-",Km?"(?<!`)()":"(^^|[^`])").replace("code",/(?<b>`+)[^`]+\k<b>(?!`)/).replace("html",/<(?! )[^<>]*?>/).getRegex(),Il=/^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/,dh=q(Il,"u").replace(/punct/g,ds).getRegex(),uh=q(Il,"u").replace(/punct/g,Ll).getRegex(),Dl="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",gh=q(Dl,"gu").replace(/notPunctSpace/g,El).replace(/punctSpace/g,so).replace(/punct/g,ds).getRegex(),ph=q(Dl,"gu").replace(/notPunctSpace/g,lh).replace(/punctSpace/g,rh).replace(/punct/g,Ll).getRegex(),mh=q("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,El).replace(/punctSpace/g,so).replace(/punct/g,ds).getRegex(),hh=q(/\\(punct)/,"gu").replace(/punct/g,ds).getRegex(),fh=q(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),vh=q(to).replace("(?:-->|$)","-->").getRegex(),bh=q("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",vh).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),Kn=/(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/,yh=q(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label",Kn).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),Rl=q(/^!?\[(label)\]\[(ref)\]/).replace("label",Kn).replace("ref",eo).getRegex(),Pl=q(/^!?\[(ref)\](?:\[\])?/).replace("ref",eo).getRegex(),wh=q("reflink|nolink(?!\\()","g").replace("reflink",Rl).replace("nolink",Pl).getRegex(),Ti=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,ao={_backpedal:tn,anyPunctuation:hh,autolink:fh,blockSkip:ch,br:Ml,code:ah,del:tn,emStrongLDelim:dh,emStrongRDelimAst:gh,emStrongRDelimUnd:mh,escape:sh,link:yh,nolink:Pl,punctuation:ih,reflink:Rl,reflinkSearch:wh,tag:bh,text:oh,url:tn},xh={...ao,link:q(/^!?\[(label)\]\((.*?)\)/).replace("label",Kn).getRegex(),reflink:q(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",Kn).getRegex()},va={...ao,emStrongRDelimAst:ph,emStrongLDelim:uh,url:q(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol",Ti).replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:q(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol",Ti).getRegex()},$h={...va,br:q(Ml).replace("{2,}","*").getRegex(),text:q(va.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},_n={normal:no,gfm:th,pedantic:nh},qt={normal:ao,gfm:va,breaks:$h,pedantic:xh},Sh={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},_i=e=>Sh[e];function je(e,t){if(t){if(fe.escapeTest.test(e))return e.replace(fe.escapeReplace,_i)}else if(fe.escapeTestNoEncode.test(e))return e.replace(fe.escapeReplaceNoEncode,_i);return e}function Mi(e){try{e=encodeURI(e).replace(fe.percentDecode,"%")}catch{return null}return e}function Ei(e,t){let n=e.replace(fe.findPipe,(i,r,c)=>{let d=!1,g=r;for(;--g>=0&&c[g]==="\\";)d=!d;return d?"|":" |"}),s=n.split(fe.splitPipe),a=0;if(s[0].trim()||s.shift(),s.length>0&&!s.at(-1)?.trim()&&s.pop(),t)if(s.length>t)s.splice(t);else for(;s.length<t;)s.push("");for(;a<s.length;a++)s[a]=s[a].trim().replace(fe.slashPipe,"|");return s}function Gt(e,t,n){let s=e.length;if(s===0)return"";let a=0;for(;a<s&&e.charAt(s-a-1)===t;)a++;return e.slice(0,s-a)}function kh(e,t){if(e.indexOf(t[1])===-1)return-1;let n=0;for(let s=0;s<e.length;s++)if(e[s]==="\\")s++;else if(e[s]===t[0])n++;else if(e[s]===t[1]&&(n--,n<0))return s;return n>0?-2:-1}function Li(e,t,n,s,a){let i=t.href,r=t.title||null,c=e[1].replace(a.other.outputLinkReplace,"$1");s.state.inLink=!0;let d={type:e[0].charAt(0)==="!"?"image":"link",raw:n,href:i,title:r,text:c,tokens:s.inlineTokens(c)};return s.state.inLink=!1,d}function Ah(e,t,n){let s=e.match(n.other.indentCodeCompensation);if(s===null)return t;let a=s[1];return t.split(`
`).map(i=>{let r=i.match(n.other.beginningSpace);if(r===null)return i;let[c]=r;return c.length>=a.length?i.slice(a.length):i}).join(`
`)}var jn=class{options;rules;lexer;constructor(e){this.options=e||$t}space(e){let t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return{type:"space",raw:t[0]}}code(e){let t=this.rules.block.code.exec(e);if(t){let n=t[0].replace(this.rules.other.codeRemoveIndent,"");return{type:"code",raw:t[0],codeBlockStyle:"indented",text:this.options.pedantic?n:Gt(n,`
`)}}}fences(e){let t=this.rules.block.fences.exec(e);if(t){let n=t[0],s=Ah(n,t[3]||"",this.rules);return{type:"code",raw:n,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):t[2],text:s}}}heading(e){let t=this.rules.block.heading.exec(e);if(t){let n=t[2].trim();if(this.rules.other.endingHash.test(n)){let s=Gt(n,"#");(this.options.pedantic||!s||this.rules.other.endingSpaceChar.test(s))&&(n=s.trim())}return{type:"heading",raw:t[0],depth:t[1].length,text:n,tokens:this.lexer.inline(n)}}}hr(e){let t=this.rules.block.hr.exec(e);if(t)return{type:"hr",raw:Gt(t[0],`
`)}}blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let n=Gt(t[0],`
`).split(`
`),s="",a="",i=[];for(;n.length>0;){let r=!1,c=[],d;for(d=0;d<n.length;d++)if(this.rules.other.blockquoteStart.test(n[d]))c.push(n[d]),r=!0;else if(!r)c.push(n[d]);else break;n=n.slice(d);let g=c.join(`
`),h=g.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");s=s?`${s}
${g}`:g,a=a?`${a}
${h}`:h;let p=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(h,i,!0),this.lexer.state.top=p,n.length===0)break;let f=i.at(-1);if(f?.type==="code")break;if(f?.type==="blockquote"){let u=f,m=u.raw+`
`+n.join(`
`),b=this.blockquote(m);i[i.length-1]=b,s=s.substring(0,s.length-u.raw.length)+b.raw,a=a.substring(0,a.length-u.text.length)+b.text;break}else if(f?.type==="list"){let u=f,m=u.raw+`
`+n.join(`
`),b=this.list(m);i[i.length-1]=b,s=s.substring(0,s.length-f.raw.length)+b.raw,a=a.substring(0,a.length-u.raw.length)+b.raw,n=m.substring(i.at(-1).raw.length).split(`
`);continue}}return{type:"blockquote",raw:s,tokens:i,text:a}}}list(e){let t=this.rules.block.list.exec(e);if(t){let n=t[1].trim(),s=n.length>1,a={type:"list",raw:"",ordered:s,start:s?+n.slice(0,-1):"",loose:!1,items:[]};n=s?`\\d{1,9}\\${n.slice(-1)}`:`\\${n}`,this.options.pedantic&&(n=s?n:"[*+-]");let i=this.rules.other.listItemRegex(n),r=!1;for(;e;){let d=!1,g="",h="";if(!(t=i.exec(e))||this.rules.block.hr.test(e))break;g=t[0],e=e.substring(g.length);let p=t[2].split(`
`,1)[0].replace(this.rules.other.listReplaceTabs,b=>" ".repeat(3*b.length)),f=e.split(`
`,1)[0],u=!p.trim(),m=0;if(this.options.pedantic?(m=2,h=p.trimStart()):u?m=t[1].length+1:(m=t[2].search(this.rules.other.nonSpaceChar),m=m>4?1:m,h=p.slice(m),m+=t[1].length),u&&this.rules.other.blankLine.test(f)&&(g+=f+`
`,e=e.substring(f.length+1),d=!0),!d){let b=this.rules.other.nextBulletRegex(m),x=this.rules.other.hrRegex(m),A=this.rules.other.fencesBeginRegex(m),$=this.rules.other.headingBeginRegex(m),T=this.rules.other.htmlBeginRegex(m);for(;e;){let C=e.split(`
`,1)[0],_;if(f=C,this.options.pedantic?(f=f.replace(this.rules.other.listReplaceNesting,"  "),_=f):_=f.replace(this.rules.other.tabCharGlobal,"    "),A.test(f)||$.test(f)||T.test(f)||b.test(f)||x.test(f))break;if(_.search(this.rules.other.nonSpaceChar)>=m||!f.trim())h+=`
`+_.slice(m);else{if(u||p.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||A.test(p)||$.test(p)||x.test(p))break;h+=`
`+f}!u&&!f.trim()&&(u=!0),g+=C+`
`,e=e.substring(C.length+1),p=_.slice(m)}}a.loose||(r?a.loose=!0:this.rules.other.doubleBlankLine.test(g)&&(r=!0)),a.items.push({type:"list_item",raw:g,task:!!this.options.gfm&&this.rules.other.listIsTask.test(h),loose:!1,text:h,tokens:[]}),a.raw+=g}let c=a.items.at(-1);if(c)c.raw=c.raw.trimEnd(),c.text=c.text.trimEnd();else return;a.raw=a.raw.trimEnd();for(let d of a.items){if(this.lexer.state.top=!1,d.tokens=this.lexer.blockTokens(d.text,[]),d.task){if(d.text=d.text.replace(this.rules.other.listReplaceTask,""),d.tokens[0]?.type==="text"||d.tokens[0]?.type==="paragraph"){d.tokens[0].raw=d.tokens[0].raw.replace(this.rules.other.listReplaceTask,""),d.tokens[0].text=d.tokens[0].text.replace(this.rules.other.listReplaceTask,"");for(let h=this.lexer.inlineQueue.length-1;h>=0;h--)if(this.rules.other.listIsTask.test(this.lexer.inlineQueue[h].src)){this.lexer.inlineQueue[h].src=this.lexer.inlineQueue[h].src.replace(this.rules.other.listReplaceTask,"");break}}let g=this.rules.other.listTaskCheckbox.exec(d.raw);if(g){let h={type:"checkbox",raw:g[0]+" ",checked:g[0]!=="[ ]"};d.checked=h.checked,a.loose?d.tokens[0]&&["paragraph","text"].includes(d.tokens[0].type)&&"tokens"in d.tokens[0]&&d.tokens[0].tokens?(d.tokens[0].raw=h.raw+d.tokens[0].raw,d.tokens[0].text=h.raw+d.tokens[0].text,d.tokens[0].tokens.unshift(h)):d.tokens.unshift({type:"paragraph",raw:h.raw,text:h.raw,tokens:[h]}):d.tokens.unshift(h)}}if(!a.loose){let g=d.tokens.filter(p=>p.type==="space"),h=g.length>0&&g.some(p=>this.rules.other.anyLine.test(p.raw));a.loose=h}}if(a.loose)for(let d of a.items){d.loose=!0;for(let g of d.tokens)g.type==="text"&&(g.type="paragraph")}return a}}html(e){let t=this.rules.block.html.exec(e);if(t)return{type:"html",block:!0,raw:t[0],pre:t[1]==="pre"||t[1]==="script"||t[1]==="style",text:t[0]}}def(e){let t=this.rules.block.def.exec(e);if(t){let n=t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal," "),s=t[2]?t[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",a=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):t[3];return{type:"def",tag:n,raw:t[0],href:s,title:a}}}table(e){let t=this.rules.block.table.exec(e);if(!t||!this.rules.other.tableDelimiter.test(t[2]))return;let n=Ei(t[1]),s=t[2].replace(this.rules.other.tableAlignChars,"").split("|"),a=t[3]?.trim()?t[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],i={type:"table",raw:t[0],header:[],align:[],rows:[]};if(n.length===s.length){for(let r of s)this.rules.other.tableAlignRight.test(r)?i.align.push("right"):this.rules.other.tableAlignCenter.test(r)?i.align.push("center"):this.rules.other.tableAlignLeft.test(r)?i.align.push("left"):i.align.push(null);for(let r=0;r<n.length;r++)i.header.push({text:n[r],tokens:this.lexer.inline(n[r]),header:!0,align:i.align[r]});for(let r of a)i.rows.push(Ei(r,i.header.length).map((c,d)=>({text:c,tokens:this.lexer.inline(c),header:!1,align:i.align[d]})));return i}}lheading(e){let t=this.rules.block.lheading.exec(e);if(t)return{type:"heading",raw:t[0],depth:t[2].charAt(0)==="="?1:2,text:t[1],tokens:this.lexer.inline(t[1])}}paragraph(e){let t=this.rules.block.paragraph.exec(e);if(t){let n=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return{type:"paragraph",raw:t[0],text:n,tokens:this.lexer.inline(n)}}}text(e){let t=this.rules.block.text.exec(e);if(t)return{type:"text",raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){let t=this.rules.inline.escape.exec(e);if(t)return{type:"escape",raw:t[0],text:t[1]}}tag(e){let t=this.rules.inline.tag.exec(e);if(t)return!this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:t[0]}}link(e){let t=this.rules.inline.link.exec(e);if(t){let n=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(n)){if(!this.rules.other.endAngleBracket.test(n))return;let i=Gt(n.slice(0,-1),"\\");if((n.length-i.length)%2===0)return}else{let i=kh(t[2],"()");if(i===-2)return;if(i>-1){let r=(t[0].indexOf("!")===0?5:4)+t[1].length+i;t[2]=t[2].substring(0,i),t[0]=t[0].substring(0,r).trim(),t[3]=""}}let s=t[2],a="";if(this.options.pedantic){let i=this.rules.other.pedanticHrefTitle.exec(s);i&&(s=i[1],a=i[3])}else a=t[3]?t[3].slice(1,-1):"";return s=s.trim(),this.rules.other.startAngleBracket.test(s)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(n)?s=s.slice(1):s=s.slice(1,-1)),Li(t,{href:s&&s.replace(this.rules.inline.anyPunctuation,"$1"),title:a&&a.replace(this.rules.inline.anyPunctuation,"$1")},t[0],this.lexer,this.rules)}}reflink(e,t){let n;if((n=this.rules.inline.reflink.exec(e))||(n=this.rules.inline.nolink.exec(e))){let s=(n[2]||n[1]).replace(this.rules.other.multipleSpaceGlobal," "),a=t[s.toLowerCase()];if(!a){let i=n[0].charAt(0);return{type:"text",raw:i,text:i}}return Li(n,a,n[0],this.lexer,this.rules)}}emStrong(e,t,n=""){let s=this.rules.inline.emStrongLDelim.exec(e);if(!(!s||s[3]&&n.match(this.rules.other.unicodeAlphaNumeric))&&(!(s[1]||s[2])||!n||this.rules.inline.punctuation.exec(n))){let a=[...s[0]].length-1,i,r,c=a,d=0,g=s[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(g.lastIndex=0,t=t.slice(-1*e.length+a);(s=g.exec(t))!=null;){if(i=s[1]||s[2]||s[3]||s[4]||s[5]||s[6],!i)continue;if(r=[...i].length,s[3]||s[4]){c+=r;continue}else if((s[5]||s[6])&&a%3&&!((a+r)%3)){d+=r;continue}if(c-=r,c>0)continue;r=Math.min(r,r+c+d);let h=[...s[0]][0].length,p=e.slice(0,a+s.index+h+r);if(Math.min(a,r)%2){let u=p.slice(1,-1);return{type:"em",raw:p,text:u,tokens:this.lexer.inlineTokens(u)}}let f=p.slice(2,-2);return{type:"strong",raw:p,text:f,tokens:this.lexer.inlineTokens(f)}}}}codespan(e){let t=this.rules.inline.code.exec(e);if(t){let n=t[2].replace(this.rules.other.newLineCharGlobal," "),s=this.rules.other.nonSpaceChar.test(n),a=this.rules.other.startingSpaceChar.test(n)&&this.rules.other.endingSpaceChar.test(n);return s&&a&&(n=n.substring(1,n.length-1)),{type:"codespan",raw:t[0],text:n}}}br(e){let t=this.rules.inline.br.exec(e);if(t)return{type:"br",raw:t[0]}}del(e){let t=this.rules.inline.del.exec(e);if(t)return{type:"del",raw:t[0],text:t[2],tokens:this.lexer.inlineTokens(t[2])}}autolink(e){let t=this.rules.inline.autolink.exec(e);if(t){let n,s;return t[2]==="@"?(n=t[1],s="mailto:"+n):(n=t[1],s=n),{type:"link",raw:t[0],text:n,href:s,tokens:[{type:"text",raw:n,text:n}]}}}url(e){let t;if(t=this.rules.inline.url.exec(e)){let n,s;if(t[2]==="@")n=t[0],s="mailto:"+n;else{let a;do a=t[0],t[0]=this.rules.inline._backpedal.exec(t[0])?.[0]??"";while(a!==t[0]);n=t[0],t[1]==="www."?s="http://"+t[0]:s=t[0]}return{type:"link",raw:t[0],text:n,href:s,tokens:[{type:"text",raw:n,text:n}]}}}inlineText(e){let t=this.rules.inline.text.exec(e);if(t){let n=this.lexer.state.inRawBlock;return{type:"text",raw:t[0],text:t[0],escaped:n}}}},Me=class ba{tokens;options;state;inlineQueue;tokenizer;constructor(t){this.tokens=[],this.tokens.links=Object.create(null),this.options=t||$t,this.options.tokenizer=this.options.tokenizer||new jn,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};let n={other:fe,block:_n.normal,inline:qt.normal};this.options.pedantic?(n.block=_n.pedantic,n.inline=qt.pedantic):this.options.gfm&&(n.block=_n.gfm,this.options.breaks?n.inline=qt.breaks:n.inline=qt.gfm),this.tokenizer.rules=n}static get rules(){return{block:_n,inline:qt}}static lex(t,n){return new ba(n).lex(t)}static lexInline(t,n){return new ba(n).inlineTokens(t)}lex(t){t=t.replace(fe.carriageReturn,`
`),this.blockTokens(t,this.tokens);for(let n=0;n<this.inlineQueue.length;n++){let s=this.inlineQueue[n];this.inlineTokens(s.src,s.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(t,n=[],s=!1){for(this.options.pedantic&&(t=t.replace(fe.tabCharGlobal,"    ").replace(fe.spaceLine,""));t;){let a;if(this.options.extensions?.block?.some(r=>(a=r.call({lexer:this},t,n))?(t=t.substring(a.raw.length),n.push(a),!0):!1))continue;if(a=this.tokenizer.space(t)){t=t.substring(a.raw.length);let r=n.at(-1);a.raw.length===1&&r!==void 0?r.raw+=`
`:n.push(a);continue}if(a=this.tokenizer.code(t)){t=t.substring(a.raw.length);let r=n.at(-1);r?.type==="paragraph"||r?.type==="text"?(r.raw+=(r.raw.endsWith(`
`)?"":`
`)+a.raw,r.text+=`
`+a.text,this.inlineQueue.at(-1).src=r.text):n.push(a);continue}if(a=this.tokenizer.fences(t)){t=t.substring(a.raw.length),n.push(a);continue}if(a=this.tokenizer.heading(t)){t=t.substring(a.raw.length),n.push(a);continue}if(a=this.tokenizer.hr(t)){t=t.substring(a.raw.length),n.push(a);continue}if(a=this.tokenizer.blockquote(t)){t=t.substring(a.raw.length),n.push(a);continue}if(a=this.tokenizer.list(t)){t=t.substring(a.raw.length),n.push(a);continue}if(a=this.tokenizer.html(t)){t=t.substring(a.raw.length),n.push(a);continue}if(a=this.tokenizer.def(t)){t=t.substring(a.raw.length);let r=n.at(-1);r?.type==="paragraph"||r?.type==="text"?(r.raw+=(r.raw.endsWith(`
`)?"":`
`)+a.raw,r.text+=`
`+a.raw,this.inlineQueue.at(-1).src=r.text):this.tokens.links[a.tag]||(this.tokens.links[a.tag]={href:a.href,title:a.title},n.push(a));continue}if(a=this.tokenizer.table(t)){t=t.substring(a.raw.length),n.push(a);continue}if(a=this.tokenizer.lheading(t)){t=t.substring(a.raw.length),n.push(a);continue}let i=t;if(this.options.extensions?.startBlock){let r=1/0,c=t.slice(1),d;this.options.extensions.startBlock.forEach(g=>{d=g.call({lexer:this},c),typeof d=="number"&&d>=0&&(r=Math.min(r,d))}),r<1/0&&r>=0&&(i=t.substring(0,r+1))}if(this.state.top&&(a=this.tokenizer.paragraph(i))){let r=n.at(-1);s&&r?.type==="paragraph"?(r.raw+=(r.raw.endsWith(`
`)?"":`
`)+a.raw,r.text+=`
`+a.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=r.text):n.push(a),s=i.length!==t.length,t=t.substring(a.raw.length);continue}if(a=this.tokenizer.text(t)){t=t.substring(a.raw.length);let r=n.at(-1);r?.type==="text"?(r.raw+=(r.raw.endsWith(`
`)?"":`
`)+a.raw,r.text+=`
`+a.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=r.text):n.push(a);continue}if(t){let r="Infinite loop on byte: "+t.charCodeAt(0);if(this.options.silent){console.error(r);break}else throw new Error(r)}}return this.state.top=!0,n}inline(t,n=[]){return this.inlineQueue.push({src:t,tokens:n}),n}inlineTokens(t,n=[]){let s=t,a=null;if(this.tokens.links){let d=Object.keys(this.tokens.links);if(d.length>0)for(;(a=this.tokenizer.rules.inline.reflinkSearch.exec(s))!=null;)d.includes(a[0].slice(a[0].lastIndexOf("[")+1,-1))&&(s=s.slice(0,a.index)+"["+"a".repeat(a[0].length-2)+"]"+s.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;(a=this.tokenizer.rules.inline.anyPunctuation.exec(s))!=null;)s=s.slice(0,a.index)+"++"+s.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);let i;for(;(a=this.tokenizer.rules.inline.blockSkip.exec(s))!=null;)i=a[2]?a[2].length:0,s=s.slice(0,a.index+i)+"["+"a".repeat(a[0].length-i-2)+"]"+s.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);s=this.options.hooks?.emStrongMask?.call({lexer:this},s)??s;let r=!1,c="";for(;t;){r||(c=""),r=!1;let d;if(this.options.extensions?.inline?.some(h=>(d=h.call({lexer:this},t,n))?(t=t.substring(d.raw.length),n.push(d),!0):!1))continue;if(d=this.tokenizer.escape(t)){t=t.substring(d.raw.length),n.push(d);continue}if(d=this.tokenizer.tag(t)){t=t.substring(d.raw.length),n.push(d);continue}if(d=this.tokenizer.link(t)){t=t.substring(d.raw.length),n.push(d);continue}if(d=this.tokenizer.reflink(t,this.tokens.links)){t=t.substring(d.raw.length);let h=n.at(-1);d.type==="text"&&h?.type==="text"?(h.raw+=d.raw,h.text+=d.text):n.push(d);continue}if(d=this.tokenizer.emStrong(t,s,c)){t=t.substring(d.raw.length),n.push(d);continue}if(d=this.tokenizer.codespan(t)){t=t.substring(d.raw.length),n.push(d);continue}if(d=this.tokenizer.br(t)){t=t.substring(d.raw.length),n.push(d);continue}if(d=this.tokenizer.del(t)){t=t.substring(d.raw.length),n.push(d);continue}if(d=this.tokenizer.autolink(t)){t=t.substring(d.raw.length),n.push(d);continue}if(!this.state.inLink&&(d=this.tokenizer.url(t))){t=t.substring(d.raw.length),n.push(d);continue}let g=t;if(this.options.extensions?.startInline){let h=1/0,p=t.slice(1),f;this.options.extensions.startInline.forEach(u=>{f=u.call({lexer:this},p),typeof f=="number"&&f>=0&&(h=Math.min(h,f))}),h<1/0&&h>=0&&(g=t.substring(0,h+1))}if(d=this.tokenizer.inlineText(g)){t=t.substring(d.raw.length),d.raw.slice(-1)!=="_"&&(c=d.raw.slice(-1)),r=!0;let h=n.at(-1);h?.type==="text"?(h.raw+=d.raw,h.text+=d.text):n.push(d);continue}if(t){let h="Infinite loop on byte: "+t.charCodeAt(0);if(this.options.silent){console.error(h);break}else throw new Error(h)}}return n}},qn=class{options;parser;constructor(e){this.options=e||$t}space(e){return""}code({text:e,lang:t,escaped:n}){let s=(t||"").match(fe.notSpaceStart)?.[0],a=e.replace(fe.endingNewline,"")+`
`;return s?'<pre><code class="language-'+je(s)+'">'+(n?a:je(a,!0))+`</code></pre>
`:"<pre><code>"+(n?a:je(a,!0))+`</code></pre>
`}blockquote({tokens:e}){return`<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}def(e){return""}heading({tokens:e,depth:t}){return`<h${t}>${this.parser.parseInline(e)}</h${t}>
`}hr(e){return`<hr>
`}list(e){let t=e.ordered,n=e.start,s="";for(let r=0;r<e.items.length;r++){let c=e.items[r];s+=this.listitem(c)}let a=t?"ol":"ul",i=t&&n!==1?' start="'+n+'"':"";return"<"+a+i+`>
`+s+"</"+a+`>
`}listitem(e){return`<li>${this.parser.parse(e.tokens)}</li>
`}checkbox({checked:e}){return"<input "+(e?'checked="" ':"")+'disabled="" type="checkbox"> '}paragraph({tokens:e}){return`<p>${this.parser.parseInline(e)}</p>
`}table(e){let t="",n="";for(let a=0;a<e.header.length;a++)n+=this.tablecell(e.header[a]);t+=this.tablerow({text:n});let s="";for(let a=0;a<e.rows.length;a++){let i=e.rows[a];n="";for(let r=0;r<i.length;r++)n+=this.tablecell(i[r]);s+=this.tablerow({text:n})}return s&&(s=`<tbody>${s}</tbody>`),`<table>
<thead>
`+t+`</thead>
`+s+`</table>
`}tablerow({text:e}){return`<tr>
${e}</tr>
`}tablecell(e){let t=this.parser.parseInline(e.tokens),n=e.header?"th":"td";return(e.align?`<${n} align="${e.align}">`:`<${n}>`)+t+`</${n}>
`}strong({tokens:e}){return`<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return`<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return`<code>${je(e,!0)}</code>`}br(e){return"<br>"}del({tokens:e}){return`<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,tokens:n}){let s=this.parser.parseInline(n),a=Mi(e);if(a===null)return s;e=a;let i='<a href="'+e+'"';return t&&(i+=' title="'+je(t)+'"'),i+=">"+s+"</a>",i}image({href:e,title:t,text:n,tokens:s}){s&&(n=this.parser.parseInline(s,this.parser.textRenderer));let a=Mi(e);if(a===null)return je(n);e=a;let i=`<img src="${e}" alt="${n}"`;return t&&(i+=` title="${je(t)}"`),i+=">",i}text(e){return"tokens"in e&&e.tokens?this.parser.parseInline(e.tokens):"escaped"in e&&e.escaped?e.text:je(e.text)}},oo=class{strong({text:e}){return e}em({text:e}){return e}codespan({text:e}){return e}del({text:e}){return e}html({text:e}){return e}text({text:e}){return e}link({text:e}){return""+e}image({text:e}){return""+e}br(){return""}checkbox({raw:e}){return e}},Ee=class ya{options;renderer;textRenderer;constructor(t){this.options=t||$t,this.options.renderer=this.options.renderer||new qn,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new oo}static parse(t,n){return new ya(n).parse(t)}static parseInline(t,n){return new ya(n).parseInline(t)}parse(t){let n="";for(let s=0;s<t.length;s++){let a=t[s];if(this.options.extensions?.renderers?.[a.type]){let r=a,c=this.options.extensions.renderers[r.type].call({parser:this},r);if(c!==!1||!["space","hr","heading","code","table","blockquote","list","html","def","paragraph","text"].includes(r.type)){n+=c||"";continue}}let i=a;switch(i.type){case"space":{n+=this.renderer.space(i);break}case"hr":{n+=this.renderer.hr(i);break}case"heading":{n+=this.renderer.heading(i);break}case"code":{n+=this.renderer.code(i);break}case"table":{n+=this.renderer.table(i);break}case"blockquote":{n+=this.renderer.blockquote(i);break}case"list":{n+=this.renderer.list(i);break}case"checkbox":{n+=this.renderer.checkbox(i);break}case"html":{n+=this.renderer.html(i);break}case"def":{n+=this.renderer.def(i);break}case"paragraph":{n+=this.renderer.paragraph(i);break}case"text":{n+=this.renderer.text(i);break}default:{let r='Token with "'+i.type+'" type was not found.';if(this.options.silent)return console.error(r),"";throw new Error(r)}}}return n}parseInline(t,n=this.renderer){let s="";for(let a=0;a<t.length;a++){let i=t[a];if(this.options.extensions?.renderers?.[i.type]){let c=this.options.extensions.renderers[i.type].call({parser:this},i);if(c!==!1||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(i.type)){s+=c||"";continue}}let r=i;switch(r.type){case"escape":{s+=n.text(r);break}case"html":{s+=n.html(r);break}case"link":{s+=n.link(r);break}case"image":{s+=n.image(r);break}case"checkbox":{s+=n.checkbox(r);break}case"strong":{s+=n.strong(r);break}case"em":{s+=n.em(r);break}case"codespan":{s+=n.codespan(r);break}case"br":{s+=n.br(r);break}case"del":{s+=n.del(r);break}case"text":{s+=n.text(r);break}default:{let c='Token with "'+r.type+'" type was not found.';if(this.options.silent)return console.error(c),"";throw new Error(c)}}}return s}},Qt=class{options;block;constructor(e){this.options=e||$t}static passThroughHooks=new Set(["preprocess","postprocess","processAllTokens","emStrongMask"]);static passThroughHooksRespectAsync=new Set(["preprocess","postprocess","processAllTokens"]);preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}emStrongMask(e){return e}provideLexer(){return this.block?Me.lex:Me.lexInline}provideParser(){return this.block?Ee.parse:Ee.parseInline}},Ch=class{defaults=Ja();options=this.setOptions;parse=this.parseMarkdown(!0);parseInline=this.parseMarkdown(!1);Parser=Ee;Renderer=qn;TextRenderer=oo;Lexer=Me;Tokenizer=jn;Hooks=Qt;constructor(...e){this.use(...e)}walkTokens(e,t){let n=[];for(let s of e)switch(n=n.concat(t.call(this,s)),s.type){case"table":{let a=s;for(let i of a.header)n=n.concat(this.walkTokens(i.tokens,t));for(let i of a.rows)for(let r of i)n=n.concat(this.walkTokens(r.tokens,t));break}case"list":{let a=s;n=n.concat(this.walkTokens(a.items,t));break}default:{let a=s;this.defaults.extensions?.childTokens?.[a.type]?this.defaults.extensions.childTokens[a.type].forEach(i=>{let r=a[i].flat(1/0);n=n.concat(this.walkTokens(r,t))}):a.tokens&&(n=n.concat(this.walkTokens(a.tokens,t)))}}return n}use(...e){let t=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach(n=>{let s={...n};if(s.async=this.defaults.async||s.async||!1,n.extensions&&(n.extensions.forEach(a=>{if(!a.name)throw new Error("extension name required");if("renderer"in a){let i=t.renderers[a.name];i?t.renderers[a.name]=function(...r){let c=a.renderer.apply(this,r);return c===!1&&(c=i.apply(this,r)),c}:t.renderers[a.name]=a.renderer}if("tokenizer"in a){if(!a.level||a.level!=="block"&&a.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let i=t[a.level];i?i.unshift(a.tokenizer):t[a.level]=[a.tokenizer],a.start&&(a.level==="block"?t.startBlock?t.startBlock.push(a.start):t.startBlock=[a.start]:a.level==="inline"&&(t.startInline?t.startInline.push(a.start):t.startInline=[a.start]))}"childTokens"in a&&a.childTokens&&(t.childTokens[a.name]=a.childTokens)}),s.extensions=t),n.renderer){let a=this.defaults.renderer||new qn(this.defaults);for(let i in n.renderer){if(!(i in a))throw new Error(`renderer '${i}' does not exist`);if(["options","parser"].includes(i))continue;let r=i,c=n.renderer[r],d=a[r];a[r]=(...g)=>{let h=c.apply(a,g);return h===!1&&(h=d.apply(a,g)),h||""}}s.renderer=a}if(n.tokenizer){let a=this.defaults.tokenizer||new jn(this.defaults);for(let i in n.tokenizer){if(!(i in a))throw new Error(`tokenizer '${i}' does not exist`);if(["options","rules","lexer"].includes(i))continue;let r=i,c=n.tokenizer[r],d=a[r];a[r]=(...g)=>{let h=c.apply(a,g);return h===!1&&(h=d.apply(a,g)),h}}s.tokenizer=a}if(n.hooks){let a=this.defaults.hooks||new Qt;for(let i in n.hooks){if(!(i in a))throw new Error(`hook '${i}' does not exist`);if(["options","block"].includes(i))continue;let r=i,c=n.hooks[r],d=a[r];Qt.passThroughHooks.has(i)?a[r]=g=>{if(this.defaults.async&&Qt.passThroughHooksRespectAsync.has(i))return(async()=>{let p=await c.call(a,g);return d.call(a,p)})();let h=c.call(a,g);return d.call(a,h)}:a[r]=(...g)=>{if(this.defaults.async)return(async()=>{let p=await c.apply(a,g);return p===!1&&(p=await d.apply(a,g)),p})();let h=c.apply(a,g);return h===!1&&(h=d.apply(a,g)),h}}s.hooks=a}if(n.walkTokens){let a=this.defaults.walkTokens,i=n.walkTokens;s.walkTokens=function(r){let c=[];return c.push(i.call(this,r)),a&&(c=c.concat(a.call(this,r))),c}}this.defaults={...this.defaults,...s}}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return Me.lex(e,t??this.defaults)}parser(e,t){return Ee.parse(e,t??this.defaults)}parseMarkdown(e){return(t,n)=>{let s={...n},a={...this.defaults,...s},i=this.onError(!!a.silent,!!a.async);if(this.defaults.async===!0&&s.async===!1)return i(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof t>"u"||t===null)return i(new Error("marked(): input parameter is undefined or null"));if(typeof t!="string")return i(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(t)+", string expected"));if(a.hooks&&(a.hooks.options=a,a.hooks.block=e),a.async)return(async()=>{let r=a.hooks?await a.hooks.preprocess(t):t,c=await(a.hooks?await a.hooks.provideLexer():e?Me.lex:Me.lexInline)(r,a),d=a.hooks?await a.hooks.processAllTokens(c):c;a.walkTokens&&await Promise.all(this.walkTokens(d,a.walkTokens));let g=await(a.hooks?await a.hooks.provideParser():e?Ee.parse:Ee.parseInline)(d,a);return a.hooks?await a.hooks.postprocess(g):g})().catch(i);try{a.hooks&&(t=a.hooks.preprocess(t));let r=(a.hooks?a.hooks.provideLexer():e?Me.lex:Me.lexInline)(t,a);a.hooks&&(r=a.hooks.processAllTokens(r)),a.walkTokens&&this.walkTokens(r,a.walkTokens);let c=(a.hooks?a.hooks.provideParser():e?Ee.parse:Ee.parseInline)(r,a);return a.hooks&&(c=a.hooks.postprocess(c)),c}catch(r){return i(r)}}}onError(e,t){return n=>{if(n.message+=`
Please report this to https://github.com/markedjs/marked.`,e){let s="<p>An error occurred:</p><pre>"+je(n.message+"",!0)+"</pre>";return t?Promise.resolve(s):s}if(t)return Promise.reject(n);throw n}}},wt=new Ch;function V(e,t){return wt.parse(e,t)}V.options=V.setOptions=function(e){return wt.setOptions(e),V.defaults=wt.defaults,Al(V.defaults),V};V.getDefaults=Ja;V.defaults=$t;V.use=function(...e){return wt.use(...e),V.defaults=wt.defaults,Al(V.defaults),V};V.walkTokens=function(e,t){return wt.walkTokens(e,t)};V.parseInline=wt.parseInline;V.Parser=Ee;V.parser=Ee.parse;V.Renderer=qn;V.TextRenderer=oo;V.Lexer=Me;V.lexer=Me.lex;V.Tokenizer=jn;V.Hooks=Qt;V.parse=V;V.options;V.setOptions;V.use;V.walkTokens;V.parseInline;Ee.parse;Me.lex;V.setOptions({gfm:!0,breaks:!0});const Ii=["a","b","blockquote","br","code","del","em","h1","h2","h3","h4","hr","i","li","ol","p","pre","strong","table","tbody","td","th","thead","tr","ul"],Di=["class","href","rel","target","title","start"];let Ri=!1;const Th=14e4,_h=4e4,Mh=200,zs=5e4,pt=new Map;function Eh(e){const t=pt.get(e);return t===void 0?null:(pt.delete(e),pt.set(e,t),t)}function Pi(e,t){if(pt.set(e,t),pt.size<=Mh)return;const n=pt.keys().next().value;n&&pt.delete(n)}function Lh(){Ri||(Ri=!0,fa.addHook("afterSanitizeAttributes",e=>{!(e instanceof HTMLAnchorElement)||!e.getAttribute("href")||(e.setAttribute("rel","noreferrer noopener"),e.setAttribute("target","_blank"))}))}function wa(e){const t=e.trim();if(!t)return"";if(Lh(),t.length<=zs){const r=Eh(t);if(r!==null)return r}const n=Sr(t,Th),s=n.truncated?`

… truncated (${n.total} chars, showing first ${n.text.length}).`:"";if(n.text.length>_h){const c=`<pre class="code-block">${Ih(`${n.text}${s}`)}</pre>`,d=fa.sanitize(c,{ALLOWED_TAGS:Ii,ALLOWED_ATTR:Di});return t.length<=zs&&Pi(t,d),d}const a=V.parse(`${n.text}${s}`),i=fa.sanitize(a,{ALLOWED_TAGS:Ii,ALLOWED_ATTR:Di});return t.length<=zs&&Pi(t,i),i}function Ih(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}const Dh=1500,Rh=2e3,Nl="Copy as markdown",Ph="Copied",Nh="Copy failed";async function Fh(e){if(!e)return!1;try{return await navigator.clipboard.writeText(e),!0}catch{return!1}}function Mn(e,t){e.title=t,e.setAttribute("aria-label",t)}function Oh(e){const t=e.label??Nl;return l`
    <button
      class="chat-copy-btn"
      type="button"
      title=${t}
      aria-label=${t}
      @click=${async n=>{const s=n.currentTarget;if(!s||s.dataset.copying==="1")return;s.dataset.copying="1",s.setAttribute("aria-busy","true"),s.disabled=!0;const a=await Fh(e.text());if(s.isConnected){if(delete s.dataset.copying,s.removeAttribute("aria-busy"),s.disabled=!1,!a){s.dataset.error="1",Mn(s,Nh),window.setTimeout(()=>{s.isConnected&&(delete s.dataset.error,Mn(s,t))},Rh);return}s.dataset.copied="1",Mn(s,Ph),window.setTimeout(()=>{s.isConnected&&(delete s.dataset.copied,Mn(s,t))},Dh)}}}
    >
      <span class="chat-copy-btn__icon" aria-hidden="true">
        <span class="chat-copy-btn__icon-copy">${ce.copy}</span>
        <span class="chat-copy-btn__icon-check">${ce.check}</span>
      </span>
    </button>
  `}function Uh(e){return Oh({text:()=>e,label:Nl})}function Fl(e){const t=e;let n=typeof t.role=="string"?t.role:"unknown";const s=typeof t.toolCallId=="string"||typeof t.tool_call_id=="string",a=t.content,i=Array.isArray(a)?a:null,r=Array.isArray(i)&&i.some(p=>{const f=p,u=(typeof f.type=="string"?f.type:"").toLowerCase();return u==="toolresult"||u==="tool_result"}),c=typeof t.toolName=="string"||typeof t.tool_name=="string";(s||r||c)&&(n="toolResult");let d=[];typeof t.content=="string"?d=[{type:"text",text:t.content}]:Array.isArray(t.content)?d=t.content.map(p=>({type:p.type||"text",text:p.text,name:p.name,args:p.args||p.arguments})):typeof t.text=="string"&&(d=[{type:"text",text:t.text}]);const g=typeof t.timestamp=="number"?t.timestamp:Date.now(),h=typeof t.id=="string"?t.id:void 0;return{role:n,content:d,timestamp:g,id:h}}function io(e){const t=e.toLowerCase();return e==="user"||e==="User"?e:e==="assistant"?"assistant":e==="system"?"system":t==="toolresult"||t==="tool_result"||t==="tool"||t==="function"?"tool":e}function Ol(e){const t=e,n=typeof t.role=="string"?t.role.toLowerCase():"";return n==="toolresult"||n==="tool_result"}const Bh={icon:"puzzle",detailKeys:["command","path","url","targetUrl","targetId","ref","element","node","nodeId","id","requestId","to","channelId","guildId","userId","name","query","pattern","messageId"]},Hh={bash:{icon:"wrench",title:"Bash",detailKeys:["command"]},process:{icon:"wrench",title:"Process",detailKeys:["sessionId"]},read:{icon:"fileText",title:"Read",detailKeys:["path"]},write:{icon:"edit",title:"Write",detailKeys:["path"]},edit:{icon:"penLine",title:"Edit",detailKeys:["path"]},attach:{icon:"paperclip",title:"Attach",detailKeys:["path","url","fileName"]},browser:{icon:"globe",title:"Browser",actions:{status:{label:"status"},start:{label:"start"},stop:{label:"stop"},tabs:{label:"tabs"},open:{label:"open",detailKeys:["targetUrl"]},focus:{label:"focus",detailKeys:["targetId"]},close:{label:"close",detailKeys:["targetId"]},snapshot:{label:"snapshot",detailKeys:["targetUrl","targetId","ref","element","format"]},screenshot:{label:"screenshot",detailKeys:["targetUrl","targetId","ref","element"]},navigate:{label:"navigate",detailKeys:["targetUrl","targetId"]},console:{label:"console",detailKeys:["level","targetId"]},pdf:{label:"pdf",detailKeys:["targetId"]},upload:{label:"upload",detailKeys:["paths","ref","inputRef","element","targetId"]},dialog:{label:"dialog",detailKeys:["accept","promptText","targetId"]},act:{label:"act",detailKeys:["request.kind","request.ref","request.selector","request.text","request.value"]}}},canvas:{icon:"image",title:"Canvas",actions:{present:{label:"present",detailKeys:["target","node","nodeId"]},hide:{label:"hide",detailKeys:["node","nodeId"]},navigate:{label:"navigate",detailKeys:["url","node","nodeId"]},eval:{label:"eval",detailKeys:["javaScript","node","nodeId"]},snapshot:{label:"snapshot",detailKeys:["format","node","nodeId"]},a2ui_push:{label:"A2UI push",detailKeys:["jsonlPath","node","nodeId"]},a2ui_reset:{label:"A2UI reset",detailKeys:["node","nodeId"]}}},nodes:{icon:"smartphone",title:"Nodes",actions:{status:{label:"status"},describe:{label:"describe",detailKeys:["node","nodeId"]},pending:{label:"pending"},approve:{label:"approve",detailKeys:["requestId"]},reject:{label:"reject",detailKeys:["requestId"]},notify:{label:"notify",detailKeys:["node","nodeId","title","body"]},camera_snap:{label:"camera snap",detailKeys:["node","nodeId","facing","deviceId"]},camera_list:{label:"camera list",detailKeys:["node","nodeId"]},camera_clip:{label:"camera clip",detailKeys:["node","nodeId","facing","duration","durationMs"]},screen_record:{label:"screen record",detailKeys:["node","nodeId","duration","durationMs","fps","screenIndex"]}}},cron:{icon:"loader",title:"Cron",actions:{status:{label:"status"},list:{label:"list"},add:{label:"add",detailKeys:["job.name","job.id","job.schedule","job.cron"]},update:{label:"update",detailKeys:["id"]},remove:{label:"remove",detailKeys:["id"]},run:{label:"run",detailKeys:["id"]},runs:{label:"runs",detailKeys:["id"]},wake:{label:"wake",detailKeys:["text","mode"]}}},gateway:{icon:"plug",title:"Gateway",actions:{restart:{label:"restart",detailKeys:["reason","delayMs"]},"config.get":{label:"config get"},"config.schema":{label:"config schema"},"config.apply":{label:"config apply",detailKeys:["restartDelayMs"]},"update.run":{label:"update run",detailKeys:["restartDelayMs"]}}},whatsapp_login:{icon:"circle",title:"WhatsApp Login",actions:{start:{label:"start"},wait:{label:"wait"}}},discord:{icon:"messageSquare",title:"Discord",actions:{react:{label:"react",detailKeys:["channelId","messageId","emoji"]},reactions:{label:"reactions",detailKeys:["channelId","messageId"]},sticker:{label:"sticker",detailKeys:["to","stickerIds"]},poll:{label:"poll",detailKeys:["question","to"]},permissions:{label:"permissions",detailKeys:["channelId"]},readMessages:{label:"read messages",detailKeys:["channelId","limit"]},sendMessage:{label:"send",detailKeys:["to","content"]},editMessage:{label:"edit",detailKeys:["channelId","messageId"]},deleteMessage:{label:"delete",detailKeys:["channelId","messageId"]},threadCreate:{label:"thread create",detailKeys:["channelId","name"]},threadList:{label:"thread list",detailKeys:["guildId","channelId"]},threadReply:{label:"thread reply",detailKeys:["channelId","content"]},pinMessage:{label:"pin",detailKeys:["channelId","messageId"]},unpinMessage:{label:"unpin",detailKeys:["channelId","messageId"]},listPins:{label:"list pins",detailKeys:["channelId"]},searchMessages:{label:"search",detailKeys:["guildId","content"]},memberInfo:{label:"member",detailKeys:["guildId","userId"]},roleInfo:{label:"roles",detailKeys:["guildId"]},emojiList:{label:"emoji list",detailKeys:["guildId"]},roleAdd:{label:"role add",detailKeys:["guildId","userId","roleId"]},roleRemove:{label:"role remove",detailKeys:["guildId","userId","roleId"]},channelInfo:{label:"channel",detailKeys:["channelId"]},channelList:{label:"channels",detailKeys:["guildId"]},voiceStatus:{label:"voice",detailKeys:["guildId","userId"]},eventList:{label:"events",detailKeys:["guildId"]},eventCreate:{label:"event create",detailKeys:["guildId","name"]},timeout:{label:"timeout",detailKeys:["guildId","userId"]},kick:{label:"kick",detailKeys:["guildId","userId"]},ban:{label:"ban",detailKeys:["guildId","userId"]}}},slack:{icon:"messageSquare",title:"Slack",actions:{react:{label:"react",detailKeys:["channelId","messageId","emoji"]},reactions:{label:"reactions",detailKeys:["channelId","messageId"]},sendMessage:{label:"send",detailKeys:["to","content"]},editMessage:{label:"edit",detailKeys:["channelId","messageId"]},deleteMessage:{label:"delete",detailKeys:["channelId","messageId"]},readMessages:{label:"read messages",detailKeys:["channelId","limit"]},pinMessage:{label:"pin",detailKeys:["channelId","messageId"]},unpinMessage:{label:"unpin",detailKeys:["channelId","messageId"]},listPins:{label:"list pins",detailKeys:["channelId"]},memberInfo:{label:"member",detailKeys:["userId"]},emojiList:{label:"emoji list"}}}},zh={fallback:Bh,tools:Hh},Ul=zh,Ni=Ul.fallback??{icon:"puzzle"},Wh=Ul.tools??{};function Kh(e){return(e??"tool").trim()}function jh(e){const t=e.replace(/_/g," ").trim();return t?t.split(/\s+/).map(n=>n.length<=2&&n.toUpperCase()===n?n:`${n.at(0)?.toUpperCase()??""}${n.slice(1)}`).join(" "):"Tool"}function qh(e){const t=e?.trim();if(t)return t.replace(/_/g," ")}function Bl(e){if(e!=null){if(typeof e=="string"){const t=e.trim();if(!t)return;const n=t.split(/\r?\n/)[0]?.trim()??"";return n?n.length>160?`${n.slice(0,157)}…`:n:void 0}if(typeof e=="number"||typeof e=="boolean")return String(e);if(Array.isArray(e)){const t=e.map(s=>Bl(s)).filter(s=>!!s);if(t.length===0)return;const n=t.slice(0,3).join(", ");return t.length>3?`${n}…`:n}}}function Gh(e,t){if(!e||typeof e!="object")return;let n=e;for(const s of t.split(".")){if(!s||!n||typeof n!="object")return;n=n[s]}return n}function Vh(e,t){for(const n of t){const s=Gh(e,n),a=Bl(s);if(a)return a}}function Qh(e){if(!e||typeof e!="object")return;const t=e,n=typeof t.path=="string"?t.path:void 0;if(!n)return;const s=typeof t.offset=="number"?t.offset:void 0,a=typeof t.limit=="number"?t.limit:void 0;return s!==void 0&&a!==void 0?`${n}:${s}-${s+a}`:n}function Yh(e){if(!e||typeof e!="object")return;const t=e;return typeof t.path=="string"?t.path:void 0}function Jh(e,t){if(!(!e||!t))return e.actions?.[t]??void 0}function Zh(e){const t=Kh(e.name),n=t.toLowerCase(),s=Wh[n],a=s?.icon??Ni.icon??"puzzle",i=s?.title??jh(t),r=s?.label??t,c=e.args&&typeof e.args=="object"?e.args.action:void 0,d=typeof c=="string"?c.trim():void 0,g=Jh(s,d),h=qh(g?.label??d);let p;n==="read"&&(p=Qh(e.args)),!p&&(n==="write"||n==="edit"||n==="attach")&&(p=Yh(e.args));const f=g?.detailKeys??s?.detailKeys??Ni.detailKeys??[];return!p&&f.length>0&&(p=Vh(e.args,f)),!p&&e.meta&&(p=e.meta),p&&(p=ef(p)),{name:t,icon:a,title:i,label:r,verb:h,detail:p}}function Xh(e){const t=[];if(e.verb&&t.push(e.verb),e.detail&&t.push(e.detail),t.length!==0)return t.join(" · ")}function ef(e){return e&&e.replace(/\/Users\/[^/]+/g,"~").replace(/\/home\/[^/]+/g,"~")}const tf=80,nf=2,Fi=100;function sf(e){const t=e.trim();if(t.startsWith("{")||t.startsWith("["))try{const n=JSON.parse(t);return"```json\n"+JSON.stringify(n,null,2)+"\n```"}catch{}return e}function af(e){const t=e.split(`
`),n=t.slice(0,nf),s=n.join(`
`);return s.length>Fi?s.slice(0,Fi)+"…":n.length<t.length?s+"…":s}function of(e){const t=e,n=rf(t.content),s=[];for(const a of n){const i=(typeof a.type=="string"?a.type:"").toLowerCase();(["toolcall","tool_call","tooluse","tool_use"].includes(i)||typeof a.name=="string"&&a.arguments!=null)&&s.push({kind:"call",name:a.name??"tool",args:lf(a.arguments??a.args)})}for(const a of n){const i=(typeof a.type=="string"?a.type:"").toLowerCase();if(i!=="toolresult"&&i!=="tool_result")continue;const r=cf(a),c=typeof a.name=="string"?a.name:"tool";s.push({kind:"result",name:c,text:r})}if(Ol(e)&&!s.some(a=>a.kind==="result")){const a=typeof t.toolName=="string"&&t.toolName||typeof t.tool_name=="string"&&t.tool_name||"tool",i=Jr(e)??void 0;s.push({kind:"result",name:a,text:i})}return s}function Oi(e,t){const n=Zh({name:e.name,args:e.args}),s=Xh(n),a=!!e.text?.trim(),i=!!t,r=i?()=>{if(a){t(sf(e.text));return}const p=`## ${n.label}

${s?`**Command:** \`${s}\`

`:""}*No output — tool completed successfully.*`;t(p)}:void 0,c=a&&(e.text?.length??0)<=tf,d=a&&!c,g=a&&c,h=!a;return l`
    <div
      class="chat-tool-card ${i?"chat-tool-card--clickable":""}"
      @click=${r}
      role=${i?"button":v}
      tabindex=${i?"0":v}
      @keydown=${i?p=>{p.key!=="Enter"&&p.key!==" "||(p.preventDefault(),r?.())}:v}
    >
      <div class="chat-tool-card__header">
        <div class="chat-tool-card__title">
          <span class="chat-tool-card__icon">${ce[n.icon]}</span>
          <span>${n.label}</span>
        </div>
        ${i?l`<span class="chat-tool-card__action">${a?"View":""} ${ce.check}</span>`:v}
        ${h&&!i?l`<span class="chat-tool-card__status">${ce.check}</span>`:v}
      </div>
      ${s?l`<div class="chat-tool-card__detail">${s}</div>`:v}
      ${h?l`
              <div class="chat-tool-card__status-text muted">Completed</div>
            `:v}
      ${d?l`<div class="chat-tool-card__preview mono">${af(e.text)}</div>`:v}
      ${g?l`<div class="chat-tool-card__inline mono">${e.text}</div>`:v}
    </div>
  `}function rf(e){return Array.isArray(e)?e.filter(Boolean):[]}function lf(e){if(typeof e!="string")return e;const t=e.trim();if(!t||!t.startsWith("{")&&!t.startsWith("["))return e;try{return JSON.parse(t)}catch{return e}}function cf(e){if(typeof e.text=="string")return e.text;if(typeof e.content=="string")return e.content}function df(e){const n=e.content,s=[];if(Array.isArray(n))for(const a of n){if(typeof a!="object"||a===null)continue;const i=a;if(i.type==="image"){const r=i.source;if(r?.type==="base64"&&typeof r.data=="string"){const c=r.data,d=r.media_type||"image/png",g=c.startsWith("data:")?c:`data:${d};base64,${c}`;s.push({url:g})}else typeof i.url=="string"&&s.push({url:i.url})}else if(i.type==="image_url"){const r=i.image_url;typeof r?.url=="string"&&s.push({url:r.url})}}return s}function uf(e){return l`
    <div class="chat-group assistant">
      ${ro("assistant",e)}
      <div class="chat-group-messages">
        <div class="chat-bubble chat-reading-indicator" aria-hidden="true">
          <span class="chat-reading-indicator__dots">
            <span></span><span></span><span></span>
          </span>
        </div>
      </div>
    </div>
  `}function gf(e,t,n,s){const a=new Date(t).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}),i=s?.name??"Assistant";return l`
    <div class="chat-group assistant">
      ${ro("assistant",s)}
      <div class="chat-group-messages">
        ${Hl({role:"assistant",content:[{type:"text",text:e}],timestamp:t},{isStreaming:!0,showReasoning:!1},n)}
        <div class="chat-group-footer">
          <span class="chat-sender-name">${i}</span>
          <span class="chat-group-timestamp">${a}</span>
        </div>
      </div>
    </div>
  `}function pf(e,t){const n=io(e.role),s=t.assistantName??"Assistant",a=n==="user"?"You":n==="assistant"?s:n,i=n==="user"?"user":n==="assistant"?"assistant":"other",r=new Date(e.timestamp).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});return l`
    <div class="chat-group ${i}">
      ${ro(e.role,{name:s,avatar:t.assistantAvatar??null})}
      <div class="chat-group-messages">
        ${e.messages.map((c,d)=>Hl(c.message,{isStreaming:e.isStreaming&&d===e.messages.length-1,showReasoning:t.showReasoning},t.onOpenSidebar))}
        <div class="chat-group-footer">
          <span class="chat-sender-name">${a}</span>
          <span class="chat-group-timestamp">${r}</span>
        </div>
      </div>
    </div>
  `}function ro(e,t){const n=io(e),s=t?.name?.trim()||"Assistant",a=t?.avatar?.trim()||"",i=n==="user"?"U":n==="assistant"?s.charAt(0).toUpperCase()||"A":n==="tool"?"⚙":"?",r=n==="user"?"user":n==="assistant"?"assistant":n==="tool"?"tool":"other";return a&&n==="assistant"?mf(a)?l`<img
        class="chat-avatar ${r}"
        src="${a}"
        alt="${s}"
      />`:l`<div class="chat-avatar ${r}">${a}</div>`:l`<div class="chat-avatar ${r}">${i}</div>`}function mf(e){return/^https?:\/\//i.test(e)||/^data:image\//i.test(e)||e.startsWith("/")}function hf(e){return e.length===0?v:l`
    <div class="chat-message-images">
      ${e.map(t=>l`
          <img
            src=${t.url}
            alt=${t.alt??"Attached image"}
            class="chat-message-image"
            @click=${()=>window.open(t.url,"_blank")}
          />
        `)}
    </div>
  `}function Hl(e,t,n){const s=e,a=typeof s.role=="string"?s.role:"unknown",i=Ol(e)||a.toLowerCase()==="toolresult"||a.toLowerCase()==="tool_result"||typeof s.toolCallId=="string"||typeof s.tool_call_id=="string",r=of(e),c=r.length>0,d=df(e),g=d.length>0,h=Jr(e),p=t.showReasoning&&a==="assistant"?Bu(e):null,f=h?.trim()?h:null,u=p?zu(p):null,m=f,b=a==="assistant"&&!!m?.trim(),x=["chat-bubble",b?"has-copy":"",t.isStreaming?"streaming":"","fade-in"].filter(Boolean).join(" ");return!m&&c&&i?l`${r.map(A=>Oi(A,n))}`:!m&&!c&&!g?v:l`
    <div class="${x}">
      ${b?Uh(m):v}
      ${hf(d)}
      ${u?l`<div class="chat-thinking">${ga(wa(u))}</div>`:v}
      ${m?l`<div class="chat-text">${ga(wa(m))}</div>`:v}
      ${r.map(A=>Oi(A,n))}
    </div>
  `}function ff(e){return l`
    <div class="sidebar-panel">
      <div class="sidebar-header">
        <div class="sidebar-title">Tool Output</div>
        <button @click=${e.onClose} class="btn" title="Close sidebar">
          ${ce.x}
        </button>
      </div>
      <div class="sidebar-content">
        ${e.error?l`
              <div class="callout danger">${e.error}</div>
              <button @click=${e.onViewRawText} class="btn" style="margin-top: 12px;">
                View Raw Text
              </button>
            `:e.content?l`<div class="sidebar-markdown">${ga(wa(e.content))}</div>`:l`
                  <div class="muted">No content available</div>
                `}
      </div>
    </div>
  `}var vf=Object.defineProperty,bf=Object.getOwnPropertyDescriptor,us=(e,t,n,s)=>{for(var a=s>1?void 0:s?bf(t,n):t,i=e.length-1,r;i>=0;i--)(r=e[i])&&(a=(s?r(t,n,a):r(a))||a);return s&&a&&vf(t,n,a),a};let Pt=class extends Lt{constructor(){super(...arguments),this.splitRatio=.6,this.minRatio=.4,this.maxRatio=.7,this.isDragging=!1,this.startX=0,this.startRatio=0,this.handleMouseDown=e=>{this.isDragging=!0,this.startX=e.clientX,this.startRatio=this.splitRatio,this.classList.add("dragging"),document.addEventListener("mousemove",this.handleMouseMove),document.addEventListener("mouseup",this.handleMouseUp),e.preventDefault()},this.handleMouseMove=e=>{if(!this.isDragging)return;const t=this.parentElement;if(!t)return;const n=t.getBoundingClientRect().width,a=(e.clientX-this.startX)/n;let i=this.startRatio+a;i=Math.max(this.minRatio,Math.min(this.maxRatio,i)),this.dispatchEvent(new CustomEvent("resize",{detail:{splitRatio:i},bubbles:!0,composed:!0}))},this.handleMouseUp=()=>{this.isDragging=!1,this.classList.remove("dragging"),document.removeEventListener("mousemove",this.handleMouseMove),document.removeEventListener("mouseup",this.handleMouseUp)}}render(){return v}connectedCallback(){super.connectedCallback(),this.addEventListener("mousedown",this.handleMouseDown)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("mousedown",this.handleMouseDown),document.removeEventListener("mousemove",this.handleMouseMove),document.removeEventListener("mouseup",this.handleMouseUp)}};Pt.styles=tc`
    :host {
      width: 4px;
      cursor: col-resize;
      background: var(--border, #333);
      transition: background 150ms ease-out;
      flex-shrink: 0;
      position: relative;
    }
    :host::before {
      content: "";
      position: absolute;
      top: 0;
      left: -4px;
      right: -4px;
      bottom: 0;
    }
    :host(:hover) {
      background: var(--accent, #007bff);
    }
    :host(.dragging) {
      background: var(--accent, #007bff);
    }
  `;us([Zn({type:Number})],Pt.prototype,"splitRatio",2);us([Zn({type:Number})],Pt.prototype,"minRatio",2);us([Zn({type:Number})],Pt.prototype,"maxRatio",2);Pt=us([gr("resizable-divider")],Pt);const yf=5e3;function Ui(e){e.style.height="auto",e.style.height=`${e.scrollHeight}px`}function wf(e){return e?e.active?l`
      <div class="callout info compaction-indicator compaction-indicator--active">
        ${ce.loader} Compacting context...
      </div>
    `:e.completedAt&&Date.now()-e.completedAt<yf?l`
        <div class="callout success compaction-indicator compaction-indicator--complete">
          ${ce.check} Context compacted
        </div>
      `:v:v}function xf(){return`att-${Date.now()}-${Math.random().toString(36).slice(2,9)}`}function $f(e,t){const n=e.clipboardData?.items;if(!n||!t.onAttachmentsChange)return;const s=[];for(let a=0;a<n.length;a++){const i=n[a];i.type.startsWith("image/")&&s.push(i)}if(s.length!==0){e.preventDefault();for(const a of s){const i=a.getAsFile();if(!i)continue;const r=new FileReader;r.addEventListener("load",()=>{const c=r.result,d={id:xf(),dataUrl:c,mimeType:i.type},g=t.attachments??[];t.onAttachmentsChange?.([...g,d])}),r.readAsDataURL(i)}}}function Sf(e){const t=e.attachments??[];return t.length===0?v:l`
    <div class="chat-attachments">
      ${t.map(n=>l`
          <div class="chat-attachment">
            <img
              src=${n.dataUrl}
              alt="Attachment preview"
              class="chat-attachment__img"
            />
            <button
              class="chat-attachment__remove"
              type="button"
              aria-label="Remove attachment"
              @click=${()=>{const s=(e.attachments??[]).filter(a=>a.id!==n.id);e.onAttachmentsChange?.(s)}}
            >
              ${ce.x}
            </button>
          </div>
        `)}
    </div>
  `}function kf(e){const t=e.connected,n=e.sending||e.stream!==null,s=!!(e.canAbort&&e.onAbort),i=e.sessions?.sessions?.find(u=>u.key===e.sessionKey)?.reasoningLevel??"off",r=e.showThinking&&i!=="off",c={name:e.assistantName,avatar:e.assistantAvatar??e.assistantAvatarUrl??null},d=(e.attachments?.length??0)>0,g=e.connected?d?"Add a message or paste more images...":"Message (↩ to send, Shift+↩ for line breaks, paste images)":"Connect to the gateway to start chatting…",h=e.splitRatio??.6,p=!!(e.sidebarOpen&&e.onCloseSidebar),f=l`
    <div
      class="chat-thread"
      role="log"
      aria-live="polite"
      @scroll=${e.onChatScroll}
    >
      ${e.loading?l`
              <div class="muted">Loading chat…</div>
            `:v}
      ${ll(Cf(e),u=>u.key,u=>u.kind==="reading-indicator"?uf(c):u.kind==="stream"?gf(u.text,u.startedAt,e.onOpenSidebar,c):u.kind==="group"?pf(u,{onOpenSidebar:e.onOpenSidebar,showReasoning:r,assistantName:e.assistantName,assistantAvatar:c.avatar}):v)}
    </div>
  `;return l`
    <section class="card chat">
      ${e.disabledReason?l`<div class="callout">${e.disabledReason}</div>`:v}

      ${e.error?l`<div class="callout danger">${e.error}</div>`:v}

      ${wf(e.compactionStatus)}

      ${e.focusMode?l`
            <button
              class="chat-focus-exit"
              type="button"
              @click=${e.onToggleFocusMode}
              aria-label="Exit focus mode"
              title="Exit focus mode"
            >
              ${ce.x}
            </button>
          `:v}

      <div
        class="chat-split-container ${p?"chat-split-container--open":""}"
      >
        <div
          class="chat-main"
          style="flex: ${p?`0 0 ${h*100}%`:"1 1 100%"}"
        >
          ${f}
        </div>

        ${p?l`
              <resizable-divider
                .splitRatio=${h}
                @resize=${u=>e.onSplitRatioChange?.(u.detail.splitRatio)}
              ></resizable-divider>
              <div class="chat-sidebar">
                ${ff({content:e.sidebarContent??null,error:e.sidebarError??null,onClose:e.onCloseSidebar,onViewRawText:()=>{!e.sidebarContent||!e.onOpenSidebar||e.onOpenSidebar(`\`\`\`
${e.sidebarContent}
\`\`\``)}})}
              </div>
            `:v}
      </div>

      ${e.queue.length?l`
            <div class="chat-queue" role="status" aria-live="polite">
              <div class="chat-queue__title">Queued (${e.queue.length})</div>
              <div class="chat-queue__list">
                ${e.queue.map(u=>l`
                    <div class="chat-queue__item">
                      <div class="chat-queue__text">
                        ${u.text||(u.attachments?.length?`Image (${u.attachments.length})`:"")}
                      </div>
                      <button
                        class="btn chat-queue__remove"
                        type="button"
                        aria-label="Remove queued message"
                        @click=${()=>e.onQueueRemove(u.id)}
                      >
                        ${ce.x}
                      </button>
                    </div>
                  `)}
              </div>
            </div>
          `:v}

      ${e.showNewMessages?l`
            <button
              class="btn chat-new-messages"
              type="button"
              @click=${e.onScrollToBottom}
            >
              New messages ${ce.arrowDown}
            </button>
          `:v}

      <div class="chat-compose">
        ${Sf(e)}
        <div class="chat-compose__row">
          <label class="field chat-compose__field">
            <span>Message</span>
            <textarea
              ${$m(u=>u&&Ui(u))}
              .value=${e.draft}
              ?disabled=${!e.connected}
              @keydown=${u=>{u.key==="Enter"&&(u.isComposing||u.keyCode===229||u.shiftKey||e.connected&&(u.preventDefault(),t&&e.onSend()))}}
              @input=${u=>{const m=u.target;Ui(m),e.onDraftChange(m.value)}}
              @paste=${u=>$f(u,e)}
              placeholder=${g}
            ></textarea>
          </label>
          <div class="chat-compose__actions">
            <button
              class="btn"
              ?disabled=${!e.connected||!s&&e.sending}
              @click=${s?e.onAbort:e.onNewSession}
            >
              ${s?"Stop":"New session"}
            </button>
            <button
              class="btn primary"
              ?disabled=${!e.connected}
              @click=${e.onSend}
            >
              ${n?"Queue":"Send"}<kbd class="btn-kbd">↵</kbd>
            </button>
          </div>
        </div>
      </div>
    </section>
  `}const Bi=200;function Af(e){const t=[];let n=null;for(const s of e){if(s.kind!=="message"){n&&(t.push(n),n=null),t.push(s);continue}const a=Fl(s.message),i=io(a.role),r=a.timestamp||Date.now();!n||n.role!==i?(n&&t.push(n),n={kind:"group",key:`group:${i}:${s.key}`,role:i,messages:[{message:s.message,key:s.key}],timestamp:r,isStreaming:!1}):n.messages.push({message:s.message,key:s.key})}return n&&t.push(n),t}function Cf(e){const t=[],n=Array.isArray(e.messages)?e.messages:[],s=Array.isArray(e.toolMessages)?e.toolMessages:[],a=Math.max(0,n.length-Bi);a>0&&t.push({kind:"message",key:"chat:history:notice",message:{role:"system",content:`Showing last ${Bi} messages (${a} hidden).`,timestamp:Date.now()}});for(let i=a;i<n.length;i++){const r=n[i],c=Fl(r);!e.showThinking&&c.role.toLowerCase()==="toolresult"||t.push({kind:"message",key:Hi(r,i),message:r})}if(e.showThinking)for(let i=0;i<s.length;i++)t.push({kind:"message",key:Hi(s[i],i+n.length),message:s[i]});if(e.stream!==null){const i=`stream:${e.sessionKey}:${e.streamStartedAt??"live"}`;e.stream.trim().length>0?t.push({kind:"stream",key:i,text:e.stream,startedAt:e.streamStartedAt??Date.now()}):t.push({kind:"reading-indicator",key:i})}return Af(t)}function Hi(e,t){const n=e,s=typeof n.toolCallId=="string"?n.toolCallId:"";if(s)return`tool:${s}`;const a=typeof n.id=="string"?n.id:"";if(a)return`msg:${a}`;const i=typeof n.messageId=="string"?n.messageId:"";if(i)return`msg:${i}`;const r=typeof n.timestamp=="number"?n.timestamp:null,c=typeof n.role=="string"?n.role:"unknown";return r!=null?`msg:${c}:${r}:${t}`:`msg:${c}:${t}`}const xa={all:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  `,env:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"></circle>
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      ></path>
    </svg>
  `,update:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  `,agents:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path
        d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"
      ></path>
      <circle cx="8" cy="14" r="1"></circle>
      <circle cx="16" cy="14" r="1"></circle>
    </svg>
  `,auth:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  `,channels:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `,messages:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  `,commands:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  `,hooks:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  `,skills:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      ></polygon>
    </svg>
  `,tools:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      ></path>
    </svg>
  `,gateway:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      ></path>
    </svg>
  `,wizard:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 4V2"></path>
      <path d="M15 16v-2"></path>
      <path d="M8 9h2"></path>
      <path d="M20 9h2"></path>
      <path d="M17.8 11.8 19 13"></path>
      <path d="M15 9h0"></path>
      <path d="M17.8 6.2 19 5"></path>
      <path d="m3 21 9-9"></path>
      <path d="M12.2 6.2 11 5"></path>
    </svg>
  `,meta:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
    </svg>
  `,logging:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  `,browser:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="4"></circle>
      <line x1="21.17" y1="8" x2="12" y2="8"></line>
      <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
      <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
    </svg>
  `,ui:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
  `,models:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      ></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  `,bindings:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
  `,broadcast:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
      <circle cx="12" cy="12" r="2"></circle>
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
    </svg>
  `,audio:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>
  `,session:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  `,cron:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  `,web:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      ></path>
    </svg>
  `,discovery:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `,canvasHost:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  `,talk:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  `,plugins:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2v6"></path>
      <path d="m4.93 10.93 4.24 4.24"></path>
      <path d="M2 12h6"></path>
      <path d="m4.93 13.07 4.24-4.24"></path>
      <path d="M12 22v-6"></path>
      <path d="m19.07 13.07-4.24-4.24"></path>
      <path d="M22 12h-6"></path>
      <path d="m19.07 10.93-4.24 4.24"></path>
    </svg>
  `,default:l`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  `};function zi(){return[{key:"env",label:o("configEnv")},{key:"update",label:o("configUpdate")},{key:"agents",label:o("configAgents")},{key:"auth",label:o("configAuth")},{key:"channels",label:o("configChannels")},{key:"messages",label:o("configMessages")},{key:"commands",label:o("configCommands")},{key:"hooks",label:o("configHooks")},{key:"skills",label:o("configSkills")},{key:"tools",label:o("configTools")},{key:"gateway",label:o("configGateway")},{key:"wizard",label:o("configWizard")},{key:"meta",label:o("configMeta")},{key:"logging",label:o("configLogging")},{key:"browser",label:o("configBrowser")},{key:"ui",label:o("configUi")},{key:"models",label:o("configModels")},{key:"bindings",label:o("configBindings")},{key:"broadcast",label:o("configBroadcast")},{key:"audio",label:o("configAudio")},{key:"session",label:o("configSession")},{key:"cron",label:o("configCron")},{key:"web",label:o("configWeb")},{key:"discovery",label:o("configDiscovery")},{key:"canvasHost",label:o("configCanvasHost")},{key:"talk",label:o("configTalk")},{key:"plugins",label:o("configPlugins")}]}const Wi="__all__";function Ki(e){return xa[e]??xa.default}function Tf(e,t){const n=Ma(e);return n||{label:t?.title??Fe(e),description:t?.description??""}}function _f(e){const{key:t,schema:n,uiHints:s}=e;if(!n||Ne(n)!=="object"||!n.properties)return[];const a=Object.entries(n.properties).map(([i,r])=>{const c=ke([t,i],s),d=Ve([t,i],c?.label??r.title??Fe(i)),g=Ge([t,i],c?.help??r.description??""),h=c?.order??50;return{key:i,label:d,description:g,order:h}});return a.sort((i,r)=>i.order!==r.order?i.order-r.order:i.key.localeCompare(r.key)),a}function Mf(e,t){if(!e||!t)return[];const n=[];function s(a,i,r){if(a===i)return;if(typeof a!=typeof i){n.push({path:r,from:a,to:i});return}if(typeof a!="object"||a===null||i===null){a!==i&&n.push({path:r,from:a,to:i});return}if(Array.isArray(a)&&Array.isArray(i)){JSON.stringify(a)!==JSON.stringify(i)&&n.push({path:r,from:a,to:i});return}const c=a,d=i,g=new Set([...Object.keys(c),...Object.keys(d)]);for(const h of g)s(c[h],d[h],r?`${r}.${h}`:h)}return s(e,t,""),n}function ji(e,t=40){let n;try{n=JSON.stringify(e)??String(e)}catch{n=String(e)}return n.length<=t?n:n.slice(0,t-3)+"..."}function Ef(e){const t=e.valid==null?"unknown":e.valid?"valid":"invalid",n=vl(e.schema),s=n.schema?n.unsupportedPaths.length>0:!1,a=n.schema?.properties??{},i=zi().filter(M=>M.key in a),r=new Set(zi().map(M=>M.key)),c=Object.keys(a).filter(M=>!r.has(M)).map(M=>({key:M,label:M.charAt(0).toUpperCase()+M.slice(1)})),d=[...i,...c],g=e.activeSection&&n.schema&&Ne(n.schema)==="object"?n.schema.properties?.[e.activeSection]:void 0,h=e.activeSection?Tf(e.activeSection,g):null,p=e.activeSection?_f({key:e.activeSection,schema:g,uiHints:e.uiHints}):[],f=e.formMode==="form"&&!!e.activeSection&&p.length>0,u=e.activeSubsection===Wi,m=e.searchQuery||u?null:e.activeSubsection??p[0]?.key??null,b=e.formMode==="form"?Mf(e.originalValue,e.formValue):[],x=e.formMode==="raw"&&e.raw!==e.originalRaw,A=e.formMode==="form"?b.length>0:x,$=!!e.formValue&&!e.loading&&!!n.schema,T=e.connected&&!e.saving&&A&&(e.formMode==="raw"?!0:$),C=e.connected&&!e.applying&&!e.updating&&A&&(e.formMode==="raw"?!0:$),_=e.connected&&!e.applying&&!e.updating;return l`
    <div class="config-layout">
      <!-- Sidebar -->
      <aside class="config-sidebar">
        <div class="config-sidebar__header">
          <div class="config-sidebar__title">${o("configSettingsTitle")}</div>
          <span
            class="pill pill--sm ${t==="valid"?"pill--ok":t==="invalid"?"pill--danger":""}"
            >${o(t==="valid"?"configValidityValid":t==="invalid"?"configValidityInvalid":"configValidityUnknown")}</span
          >
        </div>

        <!-- Search -->
        <div class="config-search">
          <svg
            class="config-search__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            class="config-search__input"
            placeholder=${o("configSearchPlaceholder")}
            .value=${e.searchQuery}
            @input=${M=>e.onSearchChange(M.target.value)}
          />
          ${e.searchQuery?l`
                <button
                  class="config-search__clear"
                  @click=${()=>e.onSearchChange("")}
                >
                  ×
                </button>
              `:v}
        </div>

        <!-- Section nav -->
        <nav class="config-nav">
          <button
            class="config-nav__item ${e.activeSection===null?"active":""}"
            @click=${()=>e.onSectionChange(null)}
          >
            <span class="config-nav__icon">${xa.all}</span>
            <span class="config-nav__label">${o("configAllSettings")}</span>
          </button>
          ${d.map(M=>l`
              <button
                class="config-nav__item ${e.activeSection===M.key?"active":""}"
                @click=${()=>e.onSectionChange(M.key)}
              >
                <span class="config-nav__icon"
                  >${Ki(M.key)}</span
                >
                <span class="config-nav__label">${M.label}</span>
              </button>
            `)}
        </nav>

        <!-- Mode toggle at bottom -->
        <div class="config-sidebar__footer">
          <div class="config-mode-toggle">
            <button
              class="config-mode-toggle__btn ${e.formMode==="form"?"active":""}"
              ?disabled=${e.schemaLoading||!e.schema}
              @click=${()=>e.onFormModeChange("form")}
            >
              ${o("configForm")}
            </button>
            <button
              class="config-mode-toggle__btn ${e.formMode==="raw"?"active":""}"
              @click=${()=>e.onFormModeChange("raw")}
            >
              ${o("configRaw")}
            </button>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main class="config-main">
        <!-- Action bar -->
        <div class="config-actions">
          <div class="config-actions__left">
            ${A?l`
                  <span class="config-changes-badge"
                    >${e.formMode==="raw"?o("configUnsavedChanges"):b.length===1?o("configOneUnsavedChange"):`${b.length} ${o("configUnsavedChangesLabel")}`}</span
                  >
                `:l`
                    <span class="config-status muted">${o("configNoChanges")}</span>
                  `}
          </div>
          <div class="config-actions__right">
            <button
              class="btn btn--sm"
              ?disabled=${e.loading}
              @click=${e.onReload}
            >
              ${e.loading?o("commonLoading"):o("commonReload")}
            </button>
            <button
              class="btn btn--sm primary"
              ?disabled=${!T}
              @click=${e.onSave}
            >
              ${e.saving?o("commonSaving"):o("commonSave")}
            </button>
            <button
              class="btn btn--sm"
              ?disabled=${!C}
              @click=${e.onApply}
            >
              ${e.applying?o("configApplying"):o("configApply")}
            </button>
            <button
              class="btn btn--sm"
              ?disabled=${!_}
              @click=${e.onUpdate}
            >
              ${e.updating?o("configUpdating"):o("configUpdateButton")}
            </button>
          </div>
        </div>

        <!-- Diff panel (form mode only - raw mode doesn't have granular diff) -->
        ${A&&e.formMode==="form"?l`
              <details class="config-diff">
                <summary class="config-diff__summary">
                  <span
                    >${o("configViewPrefix")}${b.length}
                    ${b.length===1?o("configPendingChange"):o("configPendingChanges")}</span
                  >
                  <svg
                    class="config-diff__chevron"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </summary>
                <div class="config-diff__content">
                  ${b.map(M=>l`
                      <div class="config-diff__item">
                        <div class="config-diff__path">${M.path}</div>
                        <div class="config-diff__values">
                          <span class="config-diff__from"
                            >${ji(M.from)}</span
                          >
                          <span class="config-diff__arrow">→</span>
                          <span class="config-diff__to"
                            >${ji(M.to)}</span
                          >
                        </div>
                      </div>
                    `)}
                </div>
              </details>
            `:v}
        ${h&&e.formMode==="form"?l`
              <div class="config-section-hero">
                <div class="config-section-hero__icon">
                  ${Ki(e.activeSection??"")}
                </div>
                <div class="config-section-hero__text">
                  <div class="config-section-hero__title">
                    ${h.label}
                  </div>
                  ${h.description?l`<div class="config-section-hero__desc">
                        ${h.description}
                      </div>`:v}
                </div>
              </div>
            `:v}
        ${f?l`
              <div class="config-subnav">
                <button
                  class="config-subnav__item ${m===null?"active":""}"
                  @click=${()=>e.onSubsectionChange(Wi)}
                >
                  ${o("configSubnavAll")}
                </button>
                ${p.map(M=>l`
                    <button
                      class="config-subnav__item ${m===M.key?"active":""}"
                      title=${M.description||M.label}
                      @click=${()=>e.onSubsectionChange(M.key)}
                    >
                      ${M.label}
                    </button>
                  `)}
              </div>
            `:v}

        <!-- Form content -->
        <div class="config-content">
          ${e.formMode==="form"?l`
                ${e.schemaLoading?l`
                        <div class="config-loading">
                          <div class="config-loading__spinner"></div>
                          <span>${o("configLoadingSchema")}</span>
                        </div>
                      `:Hp({schema:n.schema,uiHints:e.uiHints,value:e.formValue,disabled:e.loading||!e.formValue,unsupportedPaths:n.unsupportedPaths,onPatch:e.onFormPatch,searchQuery:e.searchQuery,activeSection:e.activeSection,activeSubsection:m})}
                ${s?l`
                        <div class="callout danger" style="margin-top: 12px">
                          ${o("configFormUnsafeWarning")}
                        </div>
                      `:v}
              `:l`
                <label class="field config-raw-field">
                  <span>${o("configRawJson5")}</span>
                  <textarea
                    .value=${e.raw}
                    @input=${M=>e.onRawChange(M.target.value)}
                  ></textarea>
                </label>
              `}
        </div>

        ${e.issues.length>0?l`<div class="callout danger" style="margin-top: 12px;">
              <pre class="code-block">
${JSON.stringify(e.issues,null,2)}</pre
              >
            </div>`:v}
      </main>
    </div>
  `}function Lf(e){const t=["last",...e.channels.filter(Boolean)],n=e.form.deliveryChannel?.trim();n&&!t.includes(n)&&t.push(n);const s=new Set;return t.filter(a=>s.has(a)?!1:(s.add(a),!0))}function If(e,t){if(t==="last")return o("cronLast");const n=e.channelMeta?.find(s=>s.id===t);return n?.label?n.label:e.channelLabels?.[t]??t}function Df(e){const t=Lf(e);(e.runsJobId==null?void 0:e.jobs.find(a=>a.id===e.runsJobId))?.name??e.runsJobId;const s=e.runs.toSorted((a,i)=>i.ts-a.ts);return l`
    <section class="grid grid-cols-2">
      <div class="card">
        <div class="card-title">${o("cronScheduler")}</div>
        <div class="card-sub">${o("cronSchedulerSub")}</div>
        <div class="stat-grid" style="margin-top: 16px;">
          <div class="stat">
            <div class="stat-label">${o("cronEnabled")}</div>
            <div class="stat-value">
              ${e.status?e.status.enabled?o("commonYes"):o("commonNo"):o("commonNA")}
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">${o("cronJobs")}</div>
            <div class="stat-value">${e.status?.jobs??o("commonNA")}</div>
          </div>
          <div class="stat">
            <div class="stat-label">${o("overviewCronNext")}</div>
            <div class="stat-value">${Ya(e.status?.nextWakeAtMs??null)}</div>
          </div>
        </div>
        <div class="row" style="margin-top: 12px;">
          <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
            ${e.loading?o("commonRefreshing"):o("commonRefresh")}
          </button>
          ${e.error?l`<span class="muted">${e.error}</span>`:v}
        </div>
      </div>

      <div class="card">
        <div class="card-title">${o("cronNewJob")}</div>
        <div class="card-sub">${o("cronNewJobSub")}</div>
        <div class="form-grid" style="margin-top: 16px;">
          <label class="field">
            <span>${o("cronName")}</span>
            <input
              .value=${e.form.name}
              @input=${a=>e.onFormChange({name:a.target.value})}
            />
          </label>
          <label class="field">
            <span>${o("cronDescription")}</span>
            <input
              .value=${e.form.description}
              @input=${a=>e.onFormChange({description:a.target.value})}
            />
          </label>
          <label class="field">
            <span>${o("cronAgentId")}</span>
            <input
              .value=${e.form.agentId}
              @input=${a=>e.onFormChange({agentId:a.target.value})}
              placeholder="default"
            />
          </label>
          <label class="field checkbox">
            <span>${o("cronEnabled")}</span>
            <input
              type="checkbox"
              .checked=${e.form.enabled}
              @change=${a=>e.onFormChange({enabled:a.target.checked})}
            />
          </label>
          <label class="field">
            <span>${o("cronSchedule")}</span>
            <select
              .value=${e.form.scheduleKind}
              @change=${a=>e.onFormChange({scheduleKind:a.target.value})}
            >
              <option value="every">${o("cronEvery")}</option>
              <option value="at">${o("cronAt")}</option>
              <option value="cron">${o("cronCron")}</option>
            </select>
          </label>
        </div>
        ${Rf(e)}
        <div class="form-grid" style="margin-top: 12px;">
          <label class="field">
            <span>${o("cronSession")}</span>
            <select
              .value=${e.form.sessionTarget}
              @change=${a=>e.onFormChange({sessionTarget:a.target.value})}
            >
              <option value="main">${o("cronMain")}</option>
              <option value="isolated">${o("cronIsolated")}</option>
            </select>
          </label>
          <label class="field">
            <span>${o("cronWakeMode")}</span>
            <select
              .value=${e.form.wakeMode}
              @change=${a=>e.onFormChange({wakeMode:a.target.value})}
            >
              <option value="next-heartbeat">${o("cronNextHeartbeat")}</option>
              <option value="now">${o("cronNow")}</option>
            </select>
          </label>
          <label class="field">
            <span>${o("cronPayload")}</span>
            <select
              .value=${e.form.payloadKind}
              @change=${a=>e.onFormChange({payloadKind:a.target.value})}
            >
              <option value="systemEvent">${o("cronSystemEvent")}</option>
              <option value="agentTurn">${o("cronAgentTurn")}</option>
            </select>
          </label>
        </div>
        <label class="field" style="margin-top: 12px;">
          <span>${e.form.payloadKind==="systemEvent"?o("cronSystemText"):o("cronAgentMessage")}</span>
          <textarea
            .value=${e.form.payloadText}
            @input=${a=>e.onFormChange({payloadText:a.target.value})}
            rows="4"
          ></textarea>
        </label>
        ${e.form.payloadKind==="agentTurn"?l`
                <div class="form-grid" style="margin-top: 12px;">
                  <label class="field">
                    <span>${o("cronDelivery")}</span>
                    <select
                      .value=${e.form.deliveryMode}
                      @change=${a=>e.onFormChange({deliveryMode:a.target.value})}
                    >
                      <option value="announce">${o("cronAnnounceSummary")}</option>
                      <option value="none">${o("cronNoneInternal")}</option>
                    </select>
                  </label>
                  <label class="field">
                    <span>${o("cronTimeoutSeconds")}</span>
                    <input
                      .value=${e.form.timeoutSeconds}
                      @input=${a=>e.onFormChange({timeoutSeconds:a.target.value})}
                    />
                  </label>
                  ${e.form.deliveryMode==="announce"?l`
                          <label class="field">
                            <span>${o("cronChannel")}</span>
                            <select
                              .value=${e.form.deliveryChannel||"last"}
                              @change=${a=>e.onFormChange({deliveryChannel:a.target.value})}
                            >
                              ${t.map(a=>l`<option value=${a}>
                                    ${If(e,a)}
                                  </option>`)}
                            </select>
                          </label>
                          <label class="field">
                            <span>${o("cronTo")}</span>
                            <input
                              .value=${e.form.deliveryTo}
                              @input=${a=>e.onFormChange({deliveryTo:a.target.value})}
                              placeholder="+1555… or chat id"
                            />
                          </label>
                        `:v}
                </div>
              `:v}
        <div class="row" style="margin-top: 14px;">
          <button class="btn primary" ?disabled=${e.busy} @click=${e.onAdd}>
            ${e.busy?o("commonSaving"):o("cronAddJob")}
          </button>
        </div>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">${o("cronJobsTitle")}</div>
      <div class="card-sub">${o("cronJobsSub")}</div>
      ${e.jobs.length===0?l`
              <div class="muted" style="margin-top: 12px">${o("cronNoJobsYet")}</div>
            `:l`
            <div class="list" style="margin-top: 12px;">
              ${e.jobs.map(a=>Pf(a,e))}
            </div>
          `}
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">${o("cronRunHistory")}</div>
      <div class="card-sub">${o("cronRunHistorySub")} ${e.runsJobId??o("cronSelectJob")}.</div>
      ${e.runsJobId==null?l`
              <div class="muted" style="margin-top: 12px">${o("cronSelectJobToInspect")}</div>
            `:s.length===0?l`
                <div class="muted" style="margin-top: 12px">${o("cronNoRunsYet")}</div>
              `:l`
              <div class="list" style="margin-top: 12px;">
                ${s.map(a=>Of(a,e.basePath))}
              </div>
            `}
    </section>
  `}function Rf(e){const t=e.form;return t.scheduleKind==="at"?l`
      <label class="field" style="margin-top: 12px;">
        <span>${o("cronRunAt")}</span>
        <input
          type="datetime-local"
          .value=${t.scheduleAt}
          @input=${n=>e.onFormChange({scheduleAt:n.target.value})}
        />
      </label>
    `:t.scheduleKind==="every"?l`
      <div class="form-grid" style="margin-top: 12px;">
        <label class="field">
          <span>${o("cronEvery")}</span>
          <input
            .value=${t.everyAmount}
            @input=${n=>e.onFormChange({everyAmount:n.target.value})}
          />
        </label>
        <label class="field">
          <span>${o("cronUnit")}</span>
          <select
            .value=${t.everyUnit}
            @change=${n=>e.onFormChange({everyUnit:n.target.value})}
          >
            <option value="minutes">${o("cronMinutes")}</option>
            <option value="hours">${o("cronHours")}</option>
            <option value="days">${o("cronDays")}</option>
          </select>
        </label>
      </div>
    `:l`
    <div class="form-grid" style="margin-top: 12px;">
      <label class="field">
        <span>${o("cronExpression")}</span>
        <input
          .value=${t.cronExpr}
          @input=${n=>e.onFormChange({cronExpr:n.target.value})}
        />
      </label>
      <label class="field">
        <span>Timezone (optional)</span>
        <input
          .value=${t.cronTz}
          @input=${n=>e.onFormChange({cronTz:n.target.value})}
        />
      </label>
    </div>
  `}function Pf(e,t){const s=`list-item list-item-clickable cron-job${t.runsJobId===e.id?" list-item-selected":""}`;return l`
    <div class=${s} @click=${()=>t.onLoadRuns(e.id)}>
      <div class="list-main">
        <div class="list-title">${e.name}</div>
        <div class="list-sub">${ul(e)}</div>
        ${Nf(e)}
        ${e.agentId?l`<div class="muted cron-job-agent">Agent: ${e.agentId}</div>`:v}
      </div>
      <div class="list-meta">
        ${Ff(e)}
      </div>
      <div class="cron-job-footer">
        <div class="chip-row cron-job-chips">
          <span class=${`chip ${e.enabled?"chip-ok":"chip-danger"}`}>
            ${e.enabled?"enabled":"disabled"}
          </span>
          <span class="chip">${e.sessionTarget}</span>
          <span class="chip">${e.wakeMode}</span>
        </div>
        <div class="row cron-job-actions">
          <button
            class="btn"
            ?disabled=${t.busy}
            @click=${a=>{a.stopPropagation(),t.onToggle(e,!e.enabled)}}
          >
            ${e.enabled?"Disable":"Enable"}
          </button>
          <button
            class="btn"
            ?disabled=${t.busy}
            @click=${a=>{a.stopPropagation(),t.onRun(e)}}
          >
            Run
          </button>
          <button
            class="btn"
            ?disabled=${t.busy}
            @click=${a=>{a.stopPropagation(),t.onLoadRuns(e.id)}}
          >
            History
          </button>
          <button
            class="btn danger"
            ?disabled=${t.busy}
            @click=${a=>{a.stopPropagation(),t.onRemove(e)}}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  `}function Nf(e){if(e.payload.kind==="systemEvent")return l`<div class="cron-job-detail">
      <span class="cron-job-detail-label">System</span>
      <span class="muted cron-job-detail-value">${e.payload.text}</span>
    </div>`;const t=e.delivery,n=t?.channel||t?.to?` (${t.channel??"last"}${t.to?` -> ${t.to}`:""})`:"";return l`
    <div class="cron-job-detail">
      <span class="cron-job-detail-label">Prompt</span>
      <span class="muted cron-job-detail-value">${e.payload.message}</span>
    </div>
    ${t?l`<div class="cron-job-detail">
            <span class="cron-job-detail-label">Delivery</span>
            <span class="muted cron-job-detail-value">${t.mode}${n}</span>
          </div>`:v}
  `}function qi(e){return typeof e!="number"||!Number.isFinite(e)?"n/a":Q(e)}function Ff(e){const t=e.state?.lastStatus??"n/a",n=t==="ok"?"cron-job-status-ok":t==="error"?"cron-job-status-error":t==="skipped"?"cron-job-status-skipped":"cron-job-status-na",s=e.state?.nextRunAtMs,a=e.state?.lastRunAtMs;return l`
    <div class="cron-job-state">
      <div class="cron-job-state-row">
        <span class="cron-job-state-key">Status</span>
        <span class=${`cron-job-status-pill ${n}`}>${t}</span>
      </div>
      <div class="cron-job-state-row">
        <span class="cron-job-state-key">Next</span>
        <span class="cron-job-state-value" title=${ft(s)}>
          ${qi(s)}
        </span>
      </div>
      <div class="cron-job-state-row">
        <span class="cron-job-state-key">Last</span>
        <span class="cron-job-state-value" title=${ft(a)}>
          ${qi(a)}
        </span>
      </div>
    </div>
  `}function Of(e,t){const n=typeof e.sessionKey=="string"&&e.sessionKey.trim().length>0?`${as("chat",t)}?session=${encodeURIComponent(e.sessionKey)}`:null;return l`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${e.status}</div>
        <div class="list-sub">${e.summary??""}</div>
      </div>
      <div class="list-meta">
        <div>${ft(e.ts)}</div>
        <div class="muted">${e.durationMs??0}ms</div>
        ${n?l`<div><a class="session-link" href=${n}>Open run chat</a></div>`:v}
        ${e.error?l`<div class="muted">${e.error}</div>`:v}
      </div>
    </div>
  `}function Uf(e){const n=(e.status&&typeof e.status=="object"?e.status.securityAudit:null)?.summary??null,s=n?.critical??0,a=n?.warn??0,i=n?.info??0,r=s>0?"danger":a>0?"warn":"success",c=s>0?`${s} ${o("debugCritical")}`:a>0?`${a} ${o("debugWarnings")}`:o("debugNoCritical");return l`
    <section class="grid grid-cols-2">
      <div class="card">
        <div class="row" style="justify-content: space-between;">
          <div>
            <div class="card-title">${o("debugSnapshots")}</div>
            <div class="card-sub">${o("debugSnapshotsSub")}</div>
          </div>
          <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
            ${e.loading?o("commonRefreshing"):o("commonRefresh")}
          </button>
        </div>
        <div class="stack" style="margin-top: 12px;">
          <div>
            <div class="muted">${o("debugStatus")}</div>
            ${n?l`<div class="callout ${r}" style="margin-top: 8px;">
                  ${o("debugSecurityAudit")}: ${c}${i>0?` · ${i} ${o("debugInfo")}`:""}. ${o("debugSecurityAuditDetails")}
                </div>`:v}
            <pre class="code-block">${JSON.stringify(e.status??{},null,2)}</pre>
          </div>
          <div>
            <div class="muted">${o("debugHealth")}</div>
            <pre class="code-block">${JSON.stringify(e.health??{},null,2)}</pre>
          </div>
          <div>
            <div class="muted">${o("debugLastHeartbeat")}</div>
            <pre class="code-block">${JSON.stringify(e.heartbeat??{},null,2)}</pre>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${o("debugManualRpc")}</div>
        <div class="card-sub">${o("debugManualRpcSub")}</div>
        <div class="form-grid" style="margin-top: 16px;">
          <label class="field">
            <span>${o("debugMethod")}</span>
            <input
              .value=${e.callMethod}
              @input=${d=>e.onCallMethodChange(d.target.value)}
              placeholder="system-presence"
            />
          </label>
          <label class="field">
            <span>${o("debugParams")} (JSON)</span>
            <textarea
              .value=${e.callParams}
              @input=${d=>e.onCallParamsChange(d.target.value)}
              rows="6"
            ></textarea>
          </label>
        </div>
        <div class="row" style="margin-top: 12px;">
          <button class="btn primary" @click=${e.onCall}>${o("debugCall")}</button>
        </div>
        ${e.callError?l`<div class="callout danger" style="margin-top: 12px;">
              ${e.callError}
            </div>`:v}
        ${e.callResult?l`<pre class="code-block" style="margin-top: 12px;">${e.callResult}</pre>`:v}
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">${o("debugModels")}</div>
      <div class="card-sub">${o("debugModelsSub")}</div>
      <pre class="code-block" style="margin-top: 12px;">${JSON.stringify(e.models??[],null,2)}</pre>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">${o("debugEventLog")}</div>
      <div class="card-sub">${o("debugEventLogSub")}</div>
      ${e.eventLog.length===0?l`
              <div class="muted" style="margin-top: 12px">${o("debugNoEvents")}</div>
            `:l`
            <div class="list" style="margin-top: 12px;">
              ${e.eventLog.map(d=>l`
                  <div class="list-item">
                    <div class="list-main">
                      <div class="list-title">${d.event}</div>
                      <div class="list-sub">${new Date(d.ts).toLocaleTimeString()}</div>
                    </div>
                    <div class="list-meta">
                      <pre class="code-block">${Jg(d.payload)}</pre>
                    </div>
                  </div>
                `)}
            </div>
          `}
    </section>
  `}function Bf(e){const t=Math.max(0,e),n=Math.floor(t/1e3);if(n<60)return`${n}s`;const s=Math.floor(n/60);return s<60?`${s}m`:`${Math.floor(s/60)}h`}function it(e,t){return t?l`<div class="exec-approval-meta-row"><span>${e}</span><span>${t}</span></div>`:v}function Hf(e){const t=e.execApprovalQueue[0];if(!t)return v;const n=t.request,s=t.expiresAtMs-Date.now(),a=s>0?`expires in ${Bf(s)}`:"expired",i=e.execApprovalQueue.length;return l`
    <div class="exec-approval-overlay" role="dialog" aria-live="polite">
      <div class="exec-approval-card">
        <div class="exec-approval-header">
          <div>
            <div class="exec-approval-title">Exec approval needed</div>
            <div class="exec-approval-sub">${a}</div>
          </div>
          ${i>1?l`<div class="exec-approval-queue">${i} pending</div>`:v}
        </div>
        <div class="exec-approval-command mono">${n.command}</div>
        <div class="exec-approval-meta">
          ${it("Host",n.host)}
          ${it("Agent",n.agentId)}
          ${it("Session",n.sessionKey)}
          ${it("CWD",n.cwd)}
          ${it("Resolved",n.resolvedPath)}
          ${it("Security",n.security)}
          ${it("Ask",n.ask)}
        </div>
        ${e.execApprovalError?l`<div class="exec-approval-error">${e.execApprovalError}</div>`:v}
        <div class="exec-approval-actions">
          <button
            class="btn primary"
            ?disabled=${e.execApprovalBusy}
            @click=${()=>e.handleExecApprovalDecision("allow-once")}
          >
            Allow once
          </button>
          <button
            class="btn"
            ?disabled=${e.execApprovalBusy}
            @click=${()=>e.handleExecApprovalDecision("allow-always")}
          >
            Always allow
          </button>
          <button
            class="btn danger"
            ?disabled=${e.execApprovalBusy}
            @click=${()=>e.handleExecApprovalDecision("deny")}
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  `}function zf(e){const{pendingGatewayUrl:t}=e;return t?l`
    <div class="exec-approval-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div class="exec-approval-card">
        <div class="exec-approval-header">
          <div>
            <div class="exec-approval-title">Change Gateway URL</div>
            <div class="exec-approval-sub">This will reconnect to a different gateway server</div>
          </div>
        </div>
        <div class="exec-approval-command mono">${t}</div>
        <div class="callout danger" style="margin-top: 12px;">
          Only confirm if you trust this URL. Malicious URLs can compromise your system.
        </div>
        <div class="exec-approval-actions">
          <button
            class="btn primary"
            @click=${()=>e.handleGatewayUrlConfirm()}
          >
            Confirm
          </button>
          <button
            class="btn"
            @click=${()=>e.handleGatewayUrlCancel()}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  `:v}function Wf(e){return l`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${o("instancesTitle")}</div>
          <div class="card-sub">${o("instancesSub")}</div>
        </div>
        <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
          ${e.loading?o("commonLoading"):o("commonRefresh")}
        </button>
      </div>
      ${e.lastError?l`<div class="callout danger" style="margin-top: 12px;">
            ${e.lastError}
          </div>`:v}
      ${e.statusMessage?l`<div class="callout" style="margin-top: 12px;">
            ${e.statusMessage}
          </div>`:v}
      <div class="list" style="margin-top: 16px;">
        ${e.entries.length===0?l`
                <div class="muted">${o("instancesNoReported")}</div>
              `:e.entries.map(t=>Kf(t))}
      </div>
    </section>
  `}function Kf(e){const t=e.lastInputSeconds!=null?`${e.lastInputSeconds}s ago`:"n/a",n=e.mode??"unknown",s=Array.isArray(e.roles)?e.roles.filter(Boolean):[],a=Array.isArray(e.scopes)?e.scopes.filter(Boolean):[],i=a.length>0?a.length>3?`${a.length} scopes`:`scopes: ${a.join(", ")}`:null;return l`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${e.host??o("instancesUnknownHost")}</div>
        <div class="list-sub">${Vg(e)}</div>
        <div class="chip-row">
          <span class="chip">${n}</span>
          ${s.map(r=>l`<span class="chip">${r}</span>`)}
          ${i?l`<span class="chip">${i}</span>`:v}
          ${e.platform?l`<span class="chip">${e.platform}</span>`:v}
          ${e.deviceFamily?l`<span class="chip">${e.deviceFamily}</span>`:v}
          ${e.modelIdentifier?l`<span class="chip">${e.modelIdentifier}</span>`:v}
          ${e.version?l`<span class="chip">${e.version}</span>`:v}
        </div>
      </div>
      <div class="list-meta">
        <div>${Qg(e)}</div>
        <div class="muted">${o("instancesLastInput")} ${t}</div>
        <div class="muted">${o("instancesReason")} ${e.reason??""}</div>
      </div>
    </div>
  `}const Gi=["trace","debug","info","warn","error","fatal"];function jf(e){if(!e)return"";const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleTimeString()}function qf(e,t){return t?[e.message,e.subsystem,e.raw].filter(Boolean).join(" ").toLowerCase().includes(t):!0}function Gf(e){const t=e.filterText.trim().toLowerCase(),n=Gi.some(i=>!e.levelFilters[i]),s=e.entries.filter(i=>i.level&&!e.levelFilters[i.level]?!1:qf(i,t)),a=t||n?"filtered":"visible";return l`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${o("logsTitle")}</div>
          <div class="card-sub">${o("logsSub")}</div>
        </div>
        <div class="row" style="gap: 8px;">
          <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
            ${e.loading?o("commonLoading"):o("commonRefresh")}
          </button>
          <button
            class="btn"
            ?disabled=${s.length===0}
            @click=${()=>e.onExport(s.map(i=>i.raw),a)}
          >
            ${o(a==="filtered"?"logsExportFiltered":"logsExportVisible")}
          </button>
        </div>
      </div>

      <div class="filters" style="margin-top: 14px;">
        <label class="field" style="min-width: 220px;">
          <span>Filter</span>
          <input
            .value=${e.filterText}
            @input=${i=>e.onFilterTextChange(i.target.value)}
            placeholder="Search logs"
          />
        </label>
        <label class="field checkbox">
          <span>Auto-follow</span>
          <input
            type="checkbox"
            .checked=${e.autoFollow}
            @change=${i=>e.onToggleAutoFollow(i.target.checked)}
          />
        </label>
      </div>

      <div class="chip-row" style="margin-top: 12px;">
        ${Gi.map(i=>l`
            <label class="chip log-chip ${i}">
              <input
                type="checkbox"
                .checked=${e.levelFilters[i]}
                @change=${r=>e.onLevelToggle(i,r.target.checked)}
              />
              <span>${i}</span>
            </label>
          `)}
      </div>

      ${e.file?l`<div class="muted" style="margin-top: 10px;">File: ${e.file}</div>`:v}
      ${e.truncated?l`
              <div class="callout" style="margin-top: 10px">Log output truncated; showing latest chunk.</div>
            `:v}
      ${e.error?l`<div class="callout danger" style="margin-top: 10px;">${e.error}</div>`:v}

      <div class="log-stream" style="margin-top: 12px;" @scroll=${e.onScroll}>
        ${s.length===0?l`
                <div class="muted" style="padding: 12px">No log entries.</div>
              `:s.map(i=>l`
                <div class="log-row">
                  <div class="log-time mono">${jf(i.time)}</div>
                  <div class="log-level ${i.level??""}">${i.level??""}</div>
                  <div class="log-subsystem mono">${i.subsystem??""}</div>
                  <div class="log-message mono">${i.message??i.raw}</div>
                </div>
              `)}
      </div>
    </section>
  `}function Vf(e){const t=ev(e),n=iv(e);return l`
    ${lv(n)}
    ${rv(t)}
    ${Qf(e)}
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${o("nodesTitle")}</div>
          <div class="card-sub">${o("nodesSub")}</div>
        </div>
        <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
          ${e.loading?o("commonLoading"):o("commonRefresh")}
        </button>
      </div>
      <div class="list" style="margin-top: 16px;">
        ${e.nodes.length===0?l`
                <div class="muted">${o("nodesNoFound")}</div>
              `:e.nodes.map(s=>bv(s))}
      </div>
    </section>
  `}function Qf(e){const t=e.devicesList??{pending:[],paired:[]},n=Array.isArray(t.pending)?t.pending:[],s=Array.isArray(t.paired)?t.paired:[];return l`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${o("nodesDevices")}</div>
          <div class="card-sub">${o("nodesDevicesSub")}</div>
        </div>
        <button class="btn" ?disabled=${e.devicesLoading} @click=${e.onDevicesRefresh}>
          ${e.devicesLoading?o("commonLoading"):o("commonRefresh")}
        </button>
      </div>
      ${e.devicesError?l`<div class="callout danger" style="margin-top: 12px;">${e.devicesError}</div>`:v}
      <div class="list" style="margin-top: 16px;">
        ${n.length>0?l`
              <div class="muted" style="margin-bottom: 8px;">${o("nodesPending")}</div>
              ${n.map(a=>Yf(a,e))}
            `:v}
        ${s.length>0?l`
              <div class="muted" style="margin-top: 12px; margin-bottom: 8px;">${o("nodesPaired")}</div>
              ${s.map(a=>Jf(a,e))}
            `:v}
        ${n.length===0&&s.length===0?l`
                <div class="muted">${o("nodesNoPairedDevices")}</div>
              `:v}
      </div>
    </section>
  `}function Yf(e,t){const n=e.displayName?.trim()||e.deviceId,s=typeof e.ts=="number"?Q(e.ts):o("commonNA"),a=e.role?.trim()?`${o("nodesRoleLabel")}${e.role}`:o("nodesRoleNone"),i=e.isRepair?o("nodesRepairSuffix"):"",r=e.remoteIp?` · ${e.remoteIp}`:"";return l`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${n}</div>
        <div class="list-sub">${e.deviceId}${r}</div>
        <div class="muted" style="margin-top: 6px;">
          ${a} · ${o("nodesRequested")}${s}${i}
        </div>
      </div>
      <div class="list-meta">
        <div class="row" style="justify-content: flex-end; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn--sm primary" @click=${()=>t.onDeviceApprove(e.requestId)}>
            ${o("nodesApprove")}
          </button>
          <button class="btn btn--sm" @click=${()=>t.onDeviceReject(e.requestId)}>
            ${o("nodesReject")}
          </button>
        </div>
      </div>
    </div>
  `}function Jf(e,t){const n=e.displayName?.trim()||e.deviceId,s=e.remoteIp?` · ${e.remoteIp}`:"",a=`${o("nodesRolesLabel")}${Qs(e.roles)}`,i=`${o("nodesScopesLabel")}${Qs(e.scopes)}`,r=Array.isArray(e.tokens)?e.tokens:[];return l`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${n}</div>
        <div class="list-sub">${e.deviceId}${s}</div>
        <div class="muted" style="margin-top: 6px;">${a} · ${i}</div>
        ${r.length===0?l`
                <div class="muted" style="margin-top: 6px">${o("nodesTokensNone")}</div>
              `:l`
              <div class="muted" style="margin-top: 10px;">${o("nodesTokens")}</div>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                ${r.map(c=>Zf(e.deviceId,c,t))}
              </div>
            `}
      </div>
    </div>
  `}function Zf(e,t,n){const s=t.revokedAtMs?o("nodesTokenRevoked"):o("nodesTokenActive"),a=`${o("nodesScopesLabel")}${Qs(t.scopes)}`,i=Q(t.rotatedAtMs??t.createdAtMs??t.lastUsedAtMs??null);return l`
    <div class="row" style="justify-content: space-between; gap: 8px;">
      <div class="list-sub">${t.role} · ${s} · ${a} · ${i}</div>
      <div class="row" style="justify-content: flex-end; gap: 6px; flex-wrap: wrap;">
        <button
          class="btn btn--sm"
          @click=${()=>n.onDeviceRotate(e,t.role,t.scopes)}
        >
          ${o("nodesRotate")}
        </button>
        ${t.revokedAtMs?v:l`
              <button
                class="btn btn--sm danger"
                @click=${()=>n.onDeviceRevoke(e,t.role)}
              >
                ${o("nodesRevoke")}
              </button>
            `}
      </div>
    </div>
  `}const Je="__defaults__",Vi=[{value:"deny",labelKey:"nodesSecurityDeny"},{value:"allowlist",labelKey:"nodesSecurityAllowlist"},{value:"full",labelKey:"nodesSecurityFull"}],Xf=[{value:"off",labelKey:"nodesAskOff"},{value:"on-miss",labelKey:"nodesAskOnMiss"},{value:"always",labelKey:"nodesAskAlways"}];function ev(e){const t=e.configForm,n=hv(e.nodes),{defaultBinding:s,agents:a}=vv(t),i=!!t,r=e.configSaving||e.configFormMode==="raw";return{ready:i,disabled:r,configDirty:e.configDirty,configLoading:e.configLoading,configSaving:e.configSaving,defaultBinding:s,agents:a,nodes:n,onBindDefault:e.onBindDefault,onBindAgent:e.onBindAgent,onSave:e.onSaveBindings,onLoadConfig:e.onLoadConfig,formMode:e.configFormMode}}function Qi(e){return e==="allowlist"||e==="full"||e==="deny"?e:"deny"}function tv(e){return e==="always"||e==="off"||e==="on-miss"?e:"on-miss"}function nv(e){const t=e?.defaults??{};return{security:Qi(t.security),ask:tv(t.ask),askFallback:Qi(t.askFallback??"deny"),autoAllowSkills:!!(t.autoAllowSkills??!1)}}function sv(e){const t=e?.agents??{},n=Array.isArray(t.list)?t.list:[],s=[];return n.forEach(a=>{if(!a||typeof a!="object")return;const i=a,r=typeof i.id=="string"?i.id.trim():"";if(!r)return;const c=typeof i.name=="string"?i.name.trim():void 0,d=i.default===!0;s.push({id:r,name:c||void 0,isDefault:d})}),s}function av(e,t){const n=sv(e),s=Object.keys(t?.agents??{}),a=new Map;n.forEach(r=>a.set(r.id,r)),s.forEach(r=>{a.has(r)||a.set(r,{id:r})});const i=Array.from(a.values());return i.length===0&&i.push({id:"main",isDefault:!0}),i.sort((r,c)=>{if(r.isDefault&&!c.isDefault)return-1;if(!r.isDefault&&c.isDefault)return 1;const d=r.name?.trim()?r.name:r.id,g=c.name?.trim()?c.name:c.id;return d.localeCompare(g)}),i}function ov(e,t){return e===Je?Je:e&&t.some(n=>n.id===e)?e:Je}function iv(e){const t=e.execApprovalsForm??e.execApprovalsSnapshot?.file??null,n=!!t,s=nv(t),a=av(e.configForm,t),i=fv(e.nodes),r=e.execApprovalsTarget;let c=r==="node"&&e.execApprovalsTargetNodeId?e.execApprovalsTargetNodeId:null;r==="node"&&c&&!i.some(p=>p.id===c)&&(c=null);const d=ov(e.execApprovalsSelectedAgent,a),g=d!==Je?(t?.agents??{})[d]??null:null,h=Array.isArray(g?.allowlist)?g.allowlist??[]:[];return{ready:n,disabled:e.execApprovalsSaving||e.execApprovalsLoading,dirty:e.execApprovalsDirty,loading:e.execApprovalsLoading,saving:e.execApprovalsSaving,form:t,defaults:s,selectedScope:d,selectedAgent:g,agents:a,allowlist:h,target:r,targetNodeId:c,targetNodes:i,onSelectScope:e.onExecApprovalsSelectAgent,onSelectTarget:e.onExecApprovalsTargetChange,onPatch:e.onExecApprovalsPatch,onRemove:e.onExecApprovalsRemove,onLoad:e.onLoadExecApprovals,onSave:e.onSaveExecApprovals}}function rv(e){const t=e.nodes.length>0,n=e.defaultBinding??"";return l`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">${o("nodesBindingTitle")}</div>
          <div class="card-sub">
            ${o("nodesBindingSub")}<span class="mono">exec host=node</span>.
          </div>
        </div>
        <button
          class="btn"
          ?disabled=${e.disabled||!e.configDirty}
          @click=${e.onSave}
        >
          ${e.configSaving?o("commonSaving"):o("commonSave")}
        </button>
      </div>

      ${e.formMode==="raw"?l`
              <div class="callout warn" style="margin-top: 12px">
                ${o("nodesBindingFormModeHint")}
              </div>
            `:v}

      ${e.ready?l`
            <div class="list" style="margin-top: 16px;">
              <div class="list-item">
                <div class="list-main">
                  <div class="list-title">${o("nodesDefaultBinding")}</div>
                  <div class="list-sub">${o("nodesDefaultBindingSub")}</div>
                </div>
                <div class="list-meta">
                  <label class="field">
                    <span>${o("nodesNodeLabel")}</span>
                    <select
                      ?disabled=${e.disabled||!t}
                      @change=${s=>{const i=s.target.value.trim();e.onBindDefault(i||null)}}
                    >
                      <option value="" ?selected=${n===""}>${o("nodesAnyNode")}</option>
                      ${e.nodes.map(s=>l`<option
                            value=${s.id}
                            ?selected=${n===s.id}
                          >
                            ${s.label}
                          </option>`)}
                    </select>
                  </label>
                  ${t?v:l`
                          <div class="muted">${o("nodesNoNodesSystemRun")}</div>
                        `}
                </div>
              </div>

              ${e.agents.length===0?l`
                      <div class="muted">${o("nodesNoAgentsFound")}</div>
                    `:e.agents.map(s=>mv(s,e))}
            </div>
          `:l`<div class="row" style="margin-top: 12px; gap: 12px;">
            <div class="muted">${o("nodesLoadConfigHint")}</div>
            <button class="btn" ?disabled=${e.configLoading} @click=${e.onLoadConfig}>
              ${e.configLoading?o("commonLoading"):o("nodesLoadConfig")}
            </button>
          </div>`}
    </section>
  `}function lv(e){const t=e.ready,n=e.target!=="node"||!!e.targetNodeId;return l`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">${o("nodesExecApprovalsTitle")}</div>
          <div class="card-sub">
            ${o("nodesExecApprovalsSub")}
          </div>
        </div>
        <button
          class="btn"
          ?disabled=${e.disabled||!e.dirty||!n}
          @click=${e.onSave}
        >
          ${e.saving?o("commonSaving"):o("commonSave")}
        </button>
      </div>

      ${cv(e)}

      ${t?l`
            ${dv(e)}
            ${uv(e)}
            ${e.selectedScope===Je?v:gv(e)}
          `:l`<div class="row" style="margin-top: 12px; gap: 12px;">
            <div class="muted">${o("nodesLoadExecApprovalsHint")}</div>
            <button class="btn" ?disabled=${e.loading||!n} @click=${e.onLoad}>
              ${e.loading?o("commonLoading"):o("nodesLoadApprovals")}
            </button>
          </div>`}
    </section>
  `}function cv(e){const t=e.targetNodes.length>0,n=e.targetNodeId??"";return l`
    <div class="list" style="margin-top: 12px;">
      <div class="list-item">
        <div class="list-main">
          <div class="list-title">${o("nodesTarget")}</div>
          <div class="list-sub">
            ${o("nodesTargetSub")}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>${o("nodesHost")}</span>
            <select
              ?disabled=${e.disabled}
              @change=${s=>{if(s.target.value==="node"){const r=e.targetNodes[0]?.id??null;e.onSelectTarget("node",n||r)}else e.onSelectTarget("gateway",null)}}
            >
              <option value="gateway" ?selected=${e.target==="gateway"}>${o("nodesHostGateway")}</option>
              <option value="node" ?selected=${e.target==="node"}>${o("nodesHostNode")}</option>
            </select>
          </label>
          ${e.target==="node"?l`
                <label class="field">
                  <span>${o("nodesNodeLabel")}</span>
                  <select
                    ?disabled=${e.disabled||!t}
                    @change=${s=>{const i=s.target.value.trim();e.onSelectTarget("node",i||null)}}
                  >
                    <option value="" ?selected=${n===""}>${o("nodesSelectNode")}</option>
                    ${e.targetNodes.map(s=>l`<option
                          value=${s.id}
                          ?selected=${n===s.id}
                        >
                          ${s.label}
                        </option>`)}
                  </select>
                </label>
              `:v}
        </div>
      </div>
      ${e.target==="node"&&!t?l`
              <div class="muted">${o("nodesNoNodesExecApprovals")}</div>
            `:v}
    </div>
  `}function dv(e){return l`
    <div class="row" style="margin-top: 12px; gap: 8px; flex-wrap: wrap;">
      <span class="label">${o("nodesScope")}</span>
      <div class="row" style="gap: 8px; flex-wrap: wrap;">
        <button
          class="btn btn--sm ${e.selectedScope===Je?"active":""}"
          @click=${()=>e.onSelectScope(Je)}
        >
          ${o("nodesDefaults")}
        </button>
        ${e.agents.map(t=>{const n=t.name?.trim()?`${t.name} (${t.id})`:t.id;return l`
            <button
              class="btn btn--sm ${e.selectedScope===t.id?"active":""}"
              @click=${()=>e.onSelectScope(t.id)}
            >
              ${n}
            </button>
          `})}
      </div>
    </div>
  `}function uv(e){const t=e.selectedScope===Je,n=e.defaults,s=e.selectedAgent??{},a=t?["defaults"]:["agents",e.selectedScope],i=typeof s.security=="string"?s.security:void 0,r=typeof s.ask=="string"?s.ask:void 0,c=typeof s.askFallback=="string"?s.askFallback:void 0,d=t?n.security:i??"__default__",g=t?n.ask:r??"__default__",h=t?n.askFallback:c??"__default__",p=typeof s.autoAllowSkills=="boolean"?s.autoAllowSkills:void 0,f=p??n.autoAllowSkills,u=p==null;return l`
    <div class="list" style="margin-top: 16px;">
      <div class="list-item">
        <div class="list-main">
          <div class="list-title">${o("nodesSecurity")}</div>
          <div class="list-sub">
            ${t?o("nodesSecurityDefaultSub"):`${o("nodesSecurityAgentSubPrefix")}${n.security}.`}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>${o("nodesMode")}</span>
            <select
              ?disabled=${e.disabled}
              @change=${m=>{const x=m.target.value;!t&&x==="__default__"?e.onRemove([...a,"security"]):e.onPatch([...a,"security"],x)}}
            >
              ${t?v:l`<option value="__default__" ?selected=${d==="__default__"}>
                    ${o("nodesUseDefaultPrefix")}${n.security})
                  </option>`}
              ${Vi.map(m=>l`<option
                    value=${m.value}
                    ?selected=${d===m.value}
                  >
                    ${o(m.labelKey)}
                  </option>`)}
            </select>
          </label>
        </div>
      </div>

      <div class="list-item">
        <div class="list-main">
          <div class="list-title">${o("nodesAsk")}</div>
          <div class="list-sub">
            ${t?o("nodesAskDefaultSub"):`${o("nodesAskAgentSubPrefix")}${n.ask}.`}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>${o("nodesMode")}</span>
            <select
              ?disabled=${e.disabled}
              @change=${m=>{const x=m.target.value;!t&&x==="__default__"?e.onRemove([...a,"ask"]):e.onPatch([...a,"ask"],x)}}
            >
              ${t?v:l`<option value="__default__" ?selected=${g==="__default__"}>
                    ${o("nodesUseDefaultPrefix")}${n.ask})
                  </option>`}
              ${Xf.map(m=>l`<option
                    value=${m.value}
                    ?selected=${g===m.value}
                  >
                    ${o(m.labelKey)}
                  </option>`)}
            </select>
          </label>
        </div>
      </div>

      <div class="list-item">
        <div class="list-main">
          <div class="list-title">${o("nodesAskFallback")}</div>
          <div class="list-sub">
            ${t?o("nodesAskFallbackDefaultSub"):`${o("nodesAskFallbackAgentSubPrefix")}${n.askFallback}.`}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>${o("nodesFallback")}</span>
            <select
              ?disabled=${e.disabled}
              @change=${m=>{const x=m.target.value;!t&&x==="__default__"?e.onRemove([...a,"askFallback"]):e.onPatch([...a,"askFallback"],x)}}
            >
              ${t?v:l`<option value="__default__" ?selected=${h==="__default__"}>
                    ${o("nodesUseDefaultPrefix")}${n.askFallback})
                  </option>`}
              ${Vi.map(m=>l`<option
                    value=${m.value}
                    ?selected=${h===m.value}
                  >
                    ${o(m.labelKey)}
                  </option>`)}
            </select>
          </label>
        </div>
      </div>

      <div class="list-item">
        <div class="list-main">
          <div class="list-title">${o("nodesAutoAllowSkills")}</div>
          <div class="list-sub">
            ${t?o("nodesAutoAllowSkillsDefaultSub"):u?`${o("nodesAutoAllowSkillsUsingDefault")}${n.autoAllowSkills?"on":"off"}).`:`${o("nodesAutoAllowSkillsOverride")}${f?"on":"off"}).`}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>${o("nodesEnabled")}</span>
            <input
              type="checkbox"
              ?disabled=${e.disabled}
              .checked=${f}
              @change=${m=>{const b=m.target;e.onPatch([...a,"autoAllowSkills"],b.checked)}}
            />
          </label>
          ${!t&&!u?l`<button
                class="btn btn--sm"
                ?disabled=${e.disabled}
                @click=${()=>e.onRemove([...a,"autoAllowSkills"])}
              >
                ${o("nodesUseDefaultButton")}
              </button>`:v}
        </div>
      </div>
    </div>
  `}function gv(e){const t=["agents",e.selectedScope,"allowlist"],n=e.allowlist;return l`
    <div class="row" style="margin-top: 18px; justify-content: space-between;">
      <div>
        <div class="card-title">${o("nodesAllowlist")}</div>
        <div class="card-sub">${o("nodesAllowlistSub")}</div>
      </div>
      <button
        class="btn btn--sm"
        ?disabled=${e.disabled}
        @click=${()=>{const s=[...n,{pattern:""}];e.onPatch(t,s)}}
      >
        ${o("nodesAddPattern")}
      </button>
    </div>
    <div class="list" style="margin-top: 12px;">
      ${n.length===0?l`
              <div class="muted">${o("nodesNoAllowlistEntries")}</div>
            `:n.map((s,a)=>pv(e,s,a))}
    </div>
  `}function pv(e,t,n){const s=t.lastUsedAt?Q(t.lastUsedAt):o("nodesNever"),a=t.lastUsedCommand?Ys(t.lastUsedCommand,120):null,i=t.lastResolvedPath?Ys(t.lastResolvedPath,120):null;return l`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${t.pattern?.trim()?t.pattern:o("nodesNewPattern")}</div>
        <div class="list-sub">${o("nodesLastUsedPrefix")}${s}</div>
        ${a?l`<div class="list-sub mono">${a}</div>`:v}
        ${i?l`<div class="list-sub mono">${i}</div>`:v}
      </div>
      <div class="list-meta">
        <label class="field">
          <span>${o("nodesPattern")}</span>
          <input
            type="text"
            .value=${t.pattern??""}
            ?disabled=${e.disabled}
            @input=${r=>{const c=r.target;e.onPatch(["agents",e.selectedScope,"allowlist",n,"pattern"],c.value)}}
          />
        </label>
        <button
          class="btn btn--sm danger"
          ?disabled=${e.disabled}
          @click=${()=>{if(e.allowlist.length<=1){e.onRemove(["agents",e.selectedScope,"allowlist"]);return}e.onRemove(["agents",e.selectedScope,"allowlist",n])}}
        >
          ${o("nodesRemove")}
        </button>
      </div>
    </div>
  `}function mv(e,t){const n=e.binding??"__default__",s=e.name?.trim()?`${e.name} (${e.id})`:e.id,a=t.nodes.length>0;return l`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${s}</div>
        <div class="list-sub">
          ${e.isDefault?o("nodesDefaultAgent"):o("nodesAgent")} ·
          ${n==="__default__"?`${o("nodesUsesDefault")}${t.defaultBinding??"any"})`:`${o("nodesOverride")}${e.binding}`}
        </div>
      </div>
      <div class="list-meta">
        <label class="field">
          <span>${o("nodesBinding")}</span>
          <select
            ?disabled=${t.disabled||!a}
            @change=${i=>{const c=i.target.value.trim();t.onBindAgent(e.index,c==="__default__"?null:c)}}
          >
            <option value="__default__" ?selected=${n==="__default__"}>
              ${o("nodesUseDefaultButton")}
            </option>
            ${t.nodes.map(i=>l`<option
                  value=${i.id}
                  ?selected=${n===i.id}
                >
                  ${i.label}
                </option>`)}
          </select>
        </label>
      </div>
    </div>
  `}function hv(e){const t=[];for(const n of e){if(!(Array.isArray(n.commands)?n.commands:[]).some(c=>String(c)==="system.run"))continue;const i=typeof n.nodeId=="string"?n.nodeId.trim():"";if(!i)continue;const r=typeof n.displayName=="string"&&n.displayName.trim()?n.displayName.trim():i;t.push({id:i,label:r===i?i:`${r} · ${i}`})}return t.sort((n,s)=>n.label.localeCompare(s.label)),t}function fv(e){const t=[];for(const n of e){if(!(Array.isArray(n.commands)?n.commands:[]).some(c=>String(c)==="system.execApprovals.get"||String(c)==="system.execApprovals.set"))continue;const i=typeof n.nodeId=="string"?n.nodeId.trim():"";if(!i)continue;const r=typeof n.displayName=="string"&&n.displayName.trim()?n.displayName.trim():i;t.push({id:i,label:r===i?i:`${r} · ${i}`})}return t.sort((n,s)=>n.label.localeCompare(s.label)),t}function vv(e){const t={id:"main",name:void 0,index:0,isDefault:!0,binding:null};if(!e||typeof e!="object")return{defaultBinding:null,agents:[t]};const s=(e.tools??{}).exec??{},a=typeof s.node=="string"&&s.node.trim()?s.node.trim():null,i=e.agents??{},r=Array.isArray(i.list)?i.list:[];if(r.length===0)return{defaultBinding:a,agents:[t]};const c=[];return r.forEach((d,g)=>{if(!d||typeof d!="object")return;const h=d,p=typeof h.id=="string"?h.id.trim():"";if(!p)return;const f=typeof h.name=="string"?h.name.trim():void 0,u=h.default===!0,b=(h.tools??{}).exec??{},x=typeof b.node=="string"&&b.node.trim()?b.node.trim():null;c.push({id:p,name:f||void 0,index:g,isDefault:u,binding:x})}),c.length===0&&c.push(t),{defaultBinding:a,agents:c}}function bv(e){const t=!!e.connected,n=!!e.paired,s=typeof e.displayName=="string"&&e.displayName.trim()||(typeof e.nodeId=="string"?e.nodeId:"unknown"),a=Array.isArray(e.caps)?e.caps:[],i=Array.isArray(e.commands)?e.commands:[];return l`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${s}</div>
        <div class="list-sub">
          ${typeof e.nodeId=="string"?e.nodeId:""}
          ${typeof e.remoteIp=="string"?` · ${e.remoteIp}`:""}
          ${typeof e.version=="string"?` · ${e.version}`:""}
        </div>
        <div class="chip-row" style="margin-top: 6px;">
          <span class="chip">${o(n?"nodesChipPaired":"nodesChipUnpaired")}</span>
          <span class="chip ${t?"chip-ok":"chip-warn"}">
            ${o(t?"nodesConnected":"nodesOffline")}
          </span>
          ${a.slice(0,12).map(r=>l`<span class="chip">${String(r)}</span>`)}
          ${i.slice(0,8).map(r=>l`<span class="chip">${String(r)}</span>`)}
        </div>
      </div>
    </div>
  `}function yv(e){const t=e.hello?.snapshot,n=t?.uptimeMs?$r(t.uptimeMs):"n/a",s=t?.policy?.tickIntervalMs?`${t.policy.tickIntervalMs}ms`:"n/a",a=(()=>{if(e.connected||!e.lastError)return null;const r=e.lastError.toLowerCase();if(!(r.includes("unauthorized")||r.includes("connect failed")))return null;const d=!!e.settings.token.trim(),g=!!e.password.trim();return!d&&!g?l`
        <div class="muted" style="margin-top: 8px">
          This gateway requires auth. Add a token or password, then click Connect.
          <div style="margin-top: 6px">
            <span class="mono">openclaw dashboard --no-open</span> → open the Control UI<br />
            <span class="mono">openclaw doctor --generate-gateway-token</span> → set token
          </div>
          <div style="margin-top: 6px">
            <a
              class="session-link"
              href="https://docs.openclaw.ai/web/dashboard"
              target="_blank"
              rel="noreferrer"
              title="Control UI auth docs (opens in new tab)"
              >Docs: Control UI auth</a
            >
          </div>
        </div>
      `:l`
      <div class="muted" style="margin-top: 8px">
        Auth failed. Update the token or password in Control UI settings, then click Connect.
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/dashboard"
            target="_blank"
            rel="noreferrer"
            title="Control UI auth docs (opens in new tab)"
            >Docs: Control UI auth</a
          >
        </div>
      </div>
    `})(),i=(()=>{if(e.connected||!e.lastError||(typeof window<"u"?window.isSecureContext:!0))return null;const c=e.lastError.toLowerCase();return!c.includes("secure context")&&!c.includes("device identity required")?null:l`
      <div class="muted" style="margin-top: 8px">
        This page is HTTP, so the browser blocks device identity. Use HTTPS (Tailscale Serve) or open
        <span class="mono">http://127.0.0.1:18789</span> on the gateway host.
        <div style="margin-top: 6px">
          If you must stay on HTTP, set
          <span class="mono">gateway.controlUi.allowInsecureAuth: true</span> (token-only).
        </div>
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.openclaw.ai/gateway/tailscale"
            target="_blank"
            rel="noreferrer"
            title="Tailscale Serve docs (opens in new tab)"
            >Docs: Tailscale Serve</a
          >
          <span class="muted"> · </span>
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/control-ui#insecure-http"
            target="_blank"
            rel="noreferrer"
            title="Insecure HTTP docs (opens in new tab)"
            >Docs: Insecure HTTP</a
          >
        </div>
      </div>
    `})();return l`
    <section class="grid grid-cols-2">
      <div class="card">
        <div class="card-title">${o("overviewGatewayAccess")}</div>
        <div class="card-sub">${o("overviewGatewayAccessSub")}</div>
        <div class="form-grid" style="margin-top: 16px;">
          <label class="field">
            <span>${o("overviewWebSocketUrl")}</span>
            <input
              .value=${e.settings.gatewayUrl}
              @input=${r=>{const c=r.target.value;e.onSettingsChange({...e.settings,gatewayUrl:c})}}
              placeholder="ws://100.x.y.z:18789"
            />
          </label>
          <label class="field">
            <span>${o("overviewGatewayToken")}</span>
            <input
              .value=${e.settings.token}
              @input=${r=>{const c=r.target.value;e.onSettingsChange({...e.settings,token:c})}}
              placeholder="OPENCLAW_GATEWAY_TOKEN"
            />
          </label>
          <label class="field">
            <span>${o("overviewPassword")}</span>
            <input
              type="password"
              .value=${e.password}
              @input=${r=>{const c=r.target.value;e.onPasswordChange(c)}}
              placeholder="system or shared password"
            />
          </label>
          <label class="field">
            <span>${o("overviewDefaultSessionKey")}</span>
            <input
              .value=${e.settings.sessionKey}
              @input=${r=>{const c=r.target.value;e.onSessionKeyChange(c)}}
            />
          </label>
        </div>
        <div class="row" style="margin-top: 14px;">
          <button class="btn" @click=${()=>e.onConnect()}>${o("overviewConnect")}</button>
          <button class="btn" @click=${()=>e.onRefresh()}>${o("overviewRefresh")}</button>
          <span class="muted">${o("overviewConnectHint")}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${o("overviewSnapshot")}</div>
        <div class="card-sub">${o("overviewSnapshotSub")}</div>
        <div class="stat-grid" style="margin-top: 16px;">
          <div class="stat">
            <div class="stat-label">${o("overviewStatus")}</div>
            <div class="stat-value ${e.connected?"ok":"warn"}">
              ${e.connected?o("overviewConnected"):o("overviewDisconnected")}
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">${o("overviewUptime")}</div>
            <div class="stat-value">${n}</div>
          </div>
          <div class="stat">
            <div class="stat-label">${o("overviewTickInterval")}</div>
            <div class="stat-value">${s}</div>
          </div>
          <div class="stat">
            <div class="stat-label">${o("overviewLastChannelsRefresh")}</div>
            <div class="stat-value">
              ${e.lastChannelsRefresh?Q(e.lastChannelsRefresh):"n/a"}
            </div>
          </div>
        </div>
        ${e.lastError?l`<div class="callout danger" style="margin-top: 14px;">
              <div>${e.lastError}</div>
              ${a??""}
              ${i??""}
            </div>`:l`
                <div class="callout" style="margin-top: 14px">
                  ${o("overviewChannelsHint")}
                </div>
              `}
      </div>
    </section>

    <section class="grid grid-cols-3" style="margin-top: 18px;">
      <div class="card stat-card">
        <div class="stat-label">${o("overviewInstances")}</div>
        <div class="stat-value">${e.presenceCount}</div>
        <div class="muted">${o("overviewInstancesSub")}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">${o("overviewSessions")}</div>
        <div class="stat-value">${e.sessionsCount??"n/a"}</div>
        <div class="muted">${o("overviewSessionsSub")}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">${o("overviewCron")}</div>
        <div class="stat-value">
          ${e.cronEnabled==null?"n/a":e.cronEnabled?o("overviewCronEnabled"):o("overviewCronDisabled")}
        </div>
        <div class="muted">${o("overviewCronNext")} ${Ya(e.cronNext)}</div>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">${o("overviewNotes")}</div>
      <div class="card-sub">${o("overviewNotesSub")}</div>
      <div class="note-grid" style="margin-top: 14px;">
        <div>
          <div class="note-title">${o("overviewNoteTailscale")}</div>
          <div class="muted">${o("overviewNoteTailscaleSub")}</div>
        </div>
        <div>
          <div class="note-title">${o("overviewNoteSessionHygiene")}</div>
          <div class="muted">${o("overviewNoteSessionHygieneSub")}</div>
        </div>
        <div>
          <div class="note-title">${o("overviewNoteCron")}</div>
          <div class="muted">${o("overviewNoteCronSub")}</div>
        </div>
      </div>
    </section>
  `}const wv=["","off","minimal","low","medium","high","xhigh"],xv=["","off","on"];function $v(){return[{value:"",label:o("commonInherit")},{value:"off",label:o("commonOffExplicit")},{value:"on",label:"on"}]}const Yi=["","off","on","stream"];function Sv(e){if(!e)return"";const t=e.trim().toLowerCase();return t==="z.ai"||t==="z-ai"?"zai":t}function zl(e){return Sv(e)==="zai"}function kv(e){return zl(e)?xv:wv}function Ji(e,t){return t?e.includes(t)?[...e]:[...e,t]:[...e]}function Av(e,t){return!t||!e||e==="off"?e:"on"}function Cv(e,t){return e?t&&e==="on"?"low":e:null}function Tv(e){const t=e.result?.sessions??[];return l`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${o("sessionsTitle")}</div>
          <div class="card-sub">${o("sessionsSub")}</div>
        </div>
        <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
          ${e.loading?o("commonLoading"):o("commonRefresh")}
        </button>
      </div>

      <div class="filters" style="margin-top: 14px;">
        <label class="field">
          <span>${o("sessionsActiveWithin")}</span>
          <input
            .value=${e.activeMinutes}
            @input=${n=>e.onFiltersChange({activeMinutes:n.target.value,limit:e.limit,includeGlobal:e.includeGlobal,includeUnknown:e.includeUnknown})}
          />
        </label>
        <label class="field">
          <span>${o("sessionsLimit")}</span>
          <input
            .value=${e.limit}
            @input=${n=>e.onFiltersChange({activeMinutes:e.activeMinutes,limit:n.target.value,includeGlobal:e.includeGlobal,includeUnknown:e.includeUnknown})}
          />
        </label>
        <label class="field checkbox">
          <span>${o("sessionsIncludeGlobal")}</span>
          <input
            type="checkbox"
            .checked=${e.includeGlobal}
            @change=${n=>e.onFiltersChange({activeMinutes:e.activeMinutes,limit:e.limit,includeGlobal:n.target.checked,includeUnknown:e.includeUnknown})}
          />
        </label>
        <label class="field checkbox">
          <span>${o("sessionsIncludeUnknown")}</span>
          <input
            type="checkbox"
            .checked=${e.includeUnknown}
            @change=${n=>e.onFiltersChange({activeMinutes:e.activeMinutes,limit:e.limit,includeGlobal:e.includeGlobal,includeUnknown:n.target.checked})}
          />
        </label>
      </div>

      ${e.error?l`<div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:v}

      <div class="muted" style="margin-top: 12px;">
        ${e.result?`${o("sessionsStore")}: ${e.result.path}`:""}
      </div>

      <div class="table" style="margin-top: 16px;">
        <div class="table-head">
          <div>${o("sessionsKey")}</div>
          <div>${o("sessionsLabel")}</div>
          <div>${o("sessionsKind")}</div>
          <div>${o("sessionsUpdated")}</div>
          <div>${o("sessionsTokens")}</div>
          <div>${o("sessionsThinking")}</div>
          <div>${o("sessionsVerbose")}</div>
          <div>${o("sessionsReasoning")}</div>
          <div>${o("sessionsActions")}</div>
        </div>
        ${t.length===0?l`
                <div class="muted">${o("sessionsNoFound")}</div>
              `:t.map(n=>_v(n,e.basePath,e.onPatch,e.onDelete,e.loading))}
      </div>
    </section>
  `}function _v(e,t,n,s,a){const i=e.updatedAt?Q(e.updatedAt):"n/a",r=e.thinkingLevel??"",c=zl(e.modelProvider),d=Av(r,c),g=Ji(kv(e.modelProvider),d);e.verboseLevel;const h=e.reasoningLevel??"";Ji(Yi,h);const p=typeof e.displayName=="string"&&e.displayName.trim().length>0?e.displayName.trim():null,f=typeof e.label=="string"?e.label.trim():"",u=!!(p&&p!==e.key&&p!==f),m=e.kind!=="global",b=m?`${as("chat",t)}?session=${encodeURIComponent(e.key)}`:null;return l`
    <div class="table-row">
      <div class="mono session-key-cell">
        ${m?l`<a href=${b} class="session-link">${e.key}</a>`:e.key}
        ${u?l`<span class="muted session-key-display-name">${p}</span>`:v}
      </div>
      <div>
        <input
          .value=${e.label??""}
          ?disabled=${a}
          placeholder=${o("commonOptional")}
          @change=${x=>{const A=x.target.value.trim();n(e.key,{label:A||null})}}
        />
      </div>
      <div>${e.kind}</div>
      <div>${i}</div>
      <div>${Yg(e)}</div>
      <div>
        <select
          ?disabled=${a}
          @change=${x=>{const A=x.target.value;n(e.key,{thinkingLevel:Cv(A,c)})}}
        >
          ${g.map(x=>l`<option value=${x}>${x||o("commonInherit")}</option>`)}
        </select>
      </div>
      <div>
        <select
          ?disabled=${a}
          @change=${x=>{const A=x.target.value;n(e.key,{verboseLevel:A||null})}}
        >
          ${$v().map(x=>l`<option value=${x.value}>${x.label}</option>`)}
        </select>
      </div>
      <div>
        <select
          ?disabled=${a}
          @change=${x=>{const A=x.target.value;n(e.key,{reasoningLevel:A||null})}}
        >
          ${Yi.map(x=>l`<option value=${x}>${x||o("commonInherit")}</option>`)}
        </select>
      </div>
      <div>
        <button class="btn danger" ?disabled=${a} @click=${()=>s(e.key)}>
          ${o("commonDelete")}
        </button>
      </div>
    </div>
  `}function Mv(){return[{id:"workspace",label:o("skillsWorkspace"),sources:["openclaw-workspace"]},{id:"built-in",label:o("skillsBuiltIn"),sources:["openclaw-bundled"]},{id:"installed",label:o("skillsInstalled"),sources:["openclaw-managed"]},{id:"extra",label:o("skillsExtra"),sources:["openclaw-extra"]}]}function Ev(e){const t=Mv(),n=new Map;for(const r of t)n.set(r.id,{id:r.id,label:r.label,skills:[]});const s=t.find(r=>r.id==="built-in"),a={id:"other",label:o("skillsOther"),skills:[]};for(const r of e){const c=r.bundled?s:t.find(d=>d.sources.includes(r.source));c?n.get(c.id)?.skills.push(r):a.skills.push(r)}const i=t.map(r=>n.get(r.id)).filter(r=>!!(r&&r.skills.length>0));return a.skills.length>0&&i.push(a),i}function Lv(e){const t=e.report?.skills??[],n=e.filter.trim().toLowerCase(),s=n?t.filter(i=>[i.name,i.description,i.source].join(" ").toLowerCase().includes(n)):t,a=Ev(s);return l`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${o("skillsTitle")}</div>
          <div class="card-sub">${o("skillsSub")}</div>
        </div>
        <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
          ${e.loading?o("commonLoading"):o("commonRefresh")}
        </button>
      </div>

      <div class="filters" style="margin-top: 14px;">
        <label class="field" style="flex: 1;">
          <span>${o("commonFilter")}</span>
          <input
            .value=${e.filter}
            @input=${i=>e.onFilterChange(i.target.value)}
            placeholder=${o("skillsSearchPlaceholder")}
          />
        </label>
        <div class="muted">${s.length} ${o("skillsShown")}</div>
      </div>

      ${e.error?l`<div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:v}

      ${s.length===0?l`
              <div class="muted" style="margin-top: 16px">No skills found.</div>
            `:l`
            <div class="agent-skills-groups" style="margin-top: 16px;">
              ${a.map(i=>{const r=i.id==="workspace"||i.id==="built-in";return l`
                  <details class="agent-skills-group" ?open=${!r}>
                    <summary class="agent-skills-header">
                      <span>${i.label}</span>
                      <span class="muted">${i.skills.length}</span>
                    </summary>
                    <div class="list skills-grid">
                      ${i.skills.map(c=>Iv(c,e))}
                    </div>
                  </details>
                `})}
            </div>
          `}
    </section>
  `}function Iv(e,t){const n=t.busyKey===e.skillKey,s=t.edits[e.skillKey]??"",a=t.messages[e.skillKey]??null,i=e.install.length>0&&e.missing.bins.length>0,r=!!(e.bundled&&e.source!=="openclaw-bundled"),c=[...e.missing.bins.map(g=>`bin:${g}`),...e.missing.env.map(g=>`env:${g}`),...e.missing.config.map(g=>`config:${g}`),...e.missing.os.map(g=>`os:${g}`)],d=[];return e.disabled&&d.push("disabled"),e.blockedByAllowlist&&d.push("blocked by allowlist"),l`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">
          ${e.emoji?`${e.emoji} `:""}${e.name}
        </div>
        <div class="list-sub">${Ys(e.description,140)}</div>
        <div class="chip-row" style="margin-top: 6px;">
          <span class="chip">${e.source}</span>
          ${r?l`
                  <span class="chip">bundled</span>
                `:v}
          <span class="chip ${e.eligible?"chip-ok":"chip-warn"}">
            ${e.eligible?"eligible":"blocked"}
          </span>
          ${e.disabled?l`
                  <span class="chip chip-warn">disabled</span>
                `:v}
        </div>
        ${c.length>0?l`
              <div class="muted" style="margin-top: 6px;">
                Missing: ${c.join(", ")}
              </div>
            `:v}
        ${d.length>0?l`
              <div class="muted" style="margin-top: 6px;">
                Reason: ${d.join(", ")}
              </div>
            `:v}
      </div>
      <div class="list-meta">
        <div class="row" style="justify-content: flex-end; flex-wrap: wrap;">
          <button
            class="btn"
            ?disabled=${n}
            @click=${()=>t.onToggle(e.skillKey,e.disabled)}
          >
            ${e.disabled?"Enable":"Disable"}
          </button>
          ${i?l`<button
                class="btn"
                ?disabled=${n}
                @click=${()=>t.onInstall(e.skillKey,e.name,e.install[0].id)}
              >
                ${n?"Installing…":e.install[0].label}
              </button>`:v}
        </div>
        ${a?l`<div
              class="muted"
              style="margin-top: 8px; color: ${a.kind==="error"?"var(--danger-color, #d14343)":"var(--success-color, #0a7f5a)"};"
            >
              ${a.message}
            </div>`:v}
        ${e.primaryEnv?l`
              <div class="field" style="margin-top: 10px;">
                <span>API key</span>
                <input
                  type="password"
                  .value=${s}
                  @input=${g=>t.onEdit(e.skillKey,g.target.value)}
                />
              </div>
              <button
                class="btn primary"
                style="margin-top: 8px;"
                ?disabled=${n}
                @click=${()=>t.onSaveKey(e.skillKey)}
              >
                Save key
              </button>
            `:v}
      </div>
    </div>
  `}const Dv=new Set(["agent","channel","chat","provider","model","tool","label","key","session","id","has","mintokens","maxtokens","mincost","maxcost","minmessages","maxmessages"]),Gn=e=>e.trim().toLowerCase(),Rv=e=>{const t=e.replace(/[.+^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*").replace(/\?/g,".");return new RegExp(`^${t}$`,"i")},ct=e=>{let t=e.trim().toLowerCase();if(!t)return null;t.startsWith("$")&&(t=t.slice(1));let n=1;t.endsWith("k")?(n=1e3,t=t.slice(0,-1)):t.endsWith("m")&&(n=1e6,t=t.slice(0,-1));const s=Number(t);return Number.isFinite(s)?s*n:null},lo=e=>(e.match(/"[^"]+"|\S+/g)??[]).map(n=>{const s=n.replace(/^"|"$/g,""),a=s.indexOf(":");if(a>0){const i=s.slice(0,a),r=s.slice(a+1);return{key:i,value:r,raw:s}}return{value:s,raw:s}}),Pv=e=>[e.label,e.key,e.sessionId].filter(n=>!!n).map(n=>n.toLowerCase()),Zi=e=>{const t=new Set;e.modelProvider&&t.add(e.modelProvider.toLowerCase()),e.providerOverride&&t.add(e.providerOverride.toLowerCase()),e.origin?.provider&&t.add(e.origin.provider.toLowerCase());for(const n of e.usage?.modelUsage??[])n.provider&&t.add(n.provider.toLowerCase());return Array.from(t)},Xi=e=>{const t=new Set;e.model&&t.add(e.model.toLowerCase());for(const n of e.usage?.modelUsage??[])n.model&&t.add(n.model.toLowerCase());return Array.from(t)},Nv=e=>(e.usage?.toolUsage?.tools??[]).map(t=>t.name.toLowerCase()),Fv=(e,t)=>{const n=Gn(t.value??"");if(!n)return!0;if(!t.key)return Pv(e).some(a=>a.includes(n));switch(Gn(t.key)){case"agent":return e.agentId?.toLowerCase().includes(n)??!1;case"channel":return e.channel?.toLowerCase().includes(n)??!1;case"chat":return e.chatType?.toLowerCase().includes(n)??!1;case"provider":return Zi(e).some(a=>a.includes(n));case"model":return Xi(e).some(a=>a.includes(n));case"tool":return Nv(e).some(a=>a.includes(n));case"label":return e.label?.toLowerCase().includes(n)??!1;case"key":case"session":case"id":if(n.includes("*")||n.includes("?")){const a=Rv(n);return a.test(e.key)||(e.sessionId?a.test(e.sessionId):!1)}return e.key.toLowerCase().includes(n)||(e.sessionId?.toLowerCase().includes(n)??!1);case"has":switch(n){case"tools":return(e.usage?.toolUsage?.totalCalls??0)>0;case"errors":return(e.usage?.messageCounts?.errors??0)>0;case"context":return!!e.contextWeight;case"usage":return!!e.usage;case"model":return Xi(e).length>0;case"provider":return Zi(e).length>0;default:return!0}case"mintokens":{const a=ct(n);return a===null?!0:(e.usage?.totalTokens??0)>=a}case"maxtokens":{const a=ct(n);return a===null?!0:(e.usage?.totalTokens??0)<=a}case"mincost":{const a=ct(n);return a===null?!0:(e.usage?.totalCost??0)>=a}case"maxcost":{const a=ct(n);return a===null?!0:(e.usage?.totalCost??0)<=a}case"minmessages":{const a=ct(n);return a===null?!0:(e.usage?.messageCounts?.total??0)>=a}case"maxmessages":{const a=ct(n);return a===null?!0:(e.usage?.messageCounts?.total??0)<=a}default:return!0}},Ov=(e,t)=>{const n=lo(t);if(n.length===0)return{sessions:e,warnings:[]};const s=[];for(const i of n){if(!i.key)continue;const r=Gn(i.key);if(!Dv.has(r)){s.push(`Unknown filter: ${i.key}`);continue}if(i.value===""&&s.push(`Missing value for ${i.key}`),r==="has"){const c=new Set(["tools","errors","context","usage","model","provider"]);i.value&&!c.has(Gn(i.value))&&s.push(`Unknown has:${i.value}`)}["mintokens","maxtokens","mincost","maxcost","minmessages","maxmessages"].includes(r)&&i.value&&ct(i.value)===null&&s.push(`Invalid number for ${i.key}`)}return{sessions:e.filter(i=>n.every(r=>Fv(i,r))),warnings:s}};function Uv(e){const t=e.split(`
`),n=new Map,s=[];for(const c of t){const d=/^\[Tool:\s*([^\]]+)\]/.exec(c.trim());if(d){const g=d[1];n.set(g,(n.get(g)??0)+1);continue}c.trim().startsWith("[Tool Result]")||s.push(c)}const a=Array.from(n.entries()).toSorted((c,d)=>d[1]-c[1]),i=a.reduce((c,[,d])=>c+d,0),r=a.length>0?`Tools: ${a.map(([c,d])=>`${c}×${d}`).join(", ")} (${i} calls)`:"";return{tools:a,summary:r,cleanContent:s.join(`
`).trim()}}const Bv=`
  .usage-page-header {
    margin: 4px 0 12px;
  }
  .usage-page-title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }
  .usage-page-subtitle {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0 0 12px;
  }
  /* ===== FILTERS & HEADER ===== */
  .usage-filters-inline {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .usage-filters-inline select {
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    font-size: 13px;
  }
  .usage-filters-inline input[type="date"] {
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    font-size: 13px;
  }
  .usage-filters-inline input[type="text"] {
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    font-size: 13px;
    min-width: 180px;
  }
  .usage-filters-inline .btn-sm {
    padding: 6px 12px;
    font-size: 14px;
  }
  .usage-refresh-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(255, 77, 77, 0.1);
    border-radius: 4px;
    font-size: 12px;
    color: #ff4d4d;
  }
  .usage-refresh-indicator::before {
    content: "";
    width: 10px;
    height: 10px;
    border: 2px solid #ff4d4d;
    border-top-color: transparent;
    border-radius: 50%;
    animation: usage-spin 0.6s linear infinite;
  }
  @keyframes usage-spin {
    to { transform: rotate(360deg); }
  }
  .active-filters {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .filter-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px 4px 12px;
    background: var(--accent-subtle);
    border: 1px solid var(--accent);
    border-radius: 16px;
    font-size: 12px;
  }
  .filter-chip-label {
    color: var(--accent);
    font-weight: 500;
  }
  .filter-chip-remove {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    padding: 2px 4px;
    font-size: 14px;
    line-height: 1;
    opacity: 0.7;
    transition: opacity 0.15s;
  }
  .filter-chip-remove:hover {
    opacity: 1;
  }
  .filter-clear-btn {
    padding: 4px 10px !important;
    font-size: 12px !important;
    line-height: 1 !important;
    margin-left: 8px;
  }
  .usage-query-bar {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) auto;
    gap: 10px;
    align-items: center;
    /* Keep the dropdown filter row from visually touching the query row. */
    margin-bottom: 10px;
  }
  .usage-query-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
    justify-self: end;
  }
  .usage-query-actions .btn {
    height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 13px;
    line-height: 1;
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    color: var(--text);
    box-shadow: none;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .usage-query-actions .btn:hover {
    background: var(--bg);
    border-color: var(--border-strong);
  }
  .usage-action-btn {
    height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 13px;
    line-height: 1;
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    color: var(--text);
    box-shadow: none;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .usage-action-btn:hover {
    background: var(--bg);
    border-color: var(--border-strong);
  }
  .usage-primary-btn {
    background: #ff4d4d;
    color: #fff;
    border-color: #ff4d4d;
    box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.12);
  }
  .btn.usage-primary-btn {
    background: #ff4d4d !important;
    border-color: #ff4d4d !important;
    color: #fff !important;
  }
  .usage-primary-btn:hover {
    background: #e64545;
    border-color: #e64545;
  }
  .btn.usage-primary-btn:hover {
    background: #e64545 !important;
    border-color: #e64545 !important;
  }
  .usage-primary-btn:disabled {
    background: rgba(255, 77, 77, 0.18);
    border-color: rgba(255, 77, 77, 0.3);
    color: #ff4d4d;
    box-shadow: none;
    cursor: default;
    opacity: 1;
  }
  .usage-primary-btn[disabled] {
    background: rgba(255, 77, 77, 0.18) !important;
    border-color: rgba(255, 77, 77, 0.3) !important;
    color: #ff4d4d !important;
    opacity: 1 !important;
  }
  .usage-secondary-btn {
    background: var(--bg-secondary);
    color: var(--text);
    border-color: var(--border);
  }
  .usage-query-input {
    width: 100%;
    min-width: 220px;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    font-size: 13px;
  }
  .usage-query-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .usage-query-suggestion {
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    font-size: 11px;
    color: var(--text);
    cursor: pointer;
    transition: background 0.15s;
  }
  .usage-query-suggestion:hover {
    background: var(--bg-hover);
  }
  .usage-filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-top: 14px;
  }
  details.usage-filter-select {
    position: relative;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 6px 10px;
    background: var(--bg);
    font-size: 12px;
    min-width: 140px;
  }
  details.usage-filter-select summary {
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    font-weight: 500;
  }
  details.usage-filter-select summary::-webkit-details-marker {
    display: none;
  }
  .usage-filter-badge {
    font-size: 11px;
    color: var(--text-muted);
  }
  .usage-filter-popover {
    position: absolute;
    left: 0;
    top: calc(100% + 6px);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    min-width: 220px;
    z-index: 20;
  }
  .usage-filter-actions {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
  }
  .usage-filter-actions button {
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 11px;
  }
  .usage-filter-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 200px;
    overflow: auto;
  }
  .usage-filter-option {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  .usage-query-hint {
    font-size: 11px;
    color: var(--text-muted);
  }
  .usage-query-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .usage-query-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    font-size: 11px;
  }
  .usage-query-chip button {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  .usage-header {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: var(--bg);
  }
  .usage-header.pinned {
    position: sticky;
    top: 12px;
    z-index: 6;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  }
  .usage-pin-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    font-size: 11px;
    color: var(--text);
    cursor: pointer;
  }
  .usage-pin-btn.active {
    background: var(--accent-subtle);
    border-color: var(--accent);
    color: var(--accent);
  }
  .usage-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .usage-header-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .usage-header-metrics {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .usage-metric-badge {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: transparent;
    font-size: 11px;
    color: var(--text-muted);
  }
  .usage-metric-badge strong {
    font-size: 12px;
    color: var(--text);
  }
  .usage-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .usage-controls .active-filters {
    flex: 1 1 100%;
  }
  .usage-controls input[type="date"] {
    min-width: 140px;
  }
  .usage-presets {
    display: inline-flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .usage-presets .btn {
    padding: 4px 8px;
    font-size: 11px;
  }
  .usage-quick-filters {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .usage-select {
    min-width: 120px;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    font-size: 12px;
  }
  .usage-export-menu summary {
    cursor: pointer;
    font-weight: 500;
    color: var(--text);
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .usage-export-menu summary::-webkit-details-marker {
    display: none;
  }
  .usage-export-menu {
    position: relative;
  }
  .usage-export-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg);
    font-size: 12px;
  }
  .usage-export-popover {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    min-width: 160px;
    z-index: 10;
  }
  .usage-export-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .usage-export-item {
    text-align: left;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    font-size: 12px;
  }
  .usage-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }
  .usage-summary-card {
    padding: 12px;
    border-radius: 8px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
  }
  .usage-mosaic {
    margin-top: 16px;
    padding: 16px;
  }
  .usage-mosaic-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  .usage-mosaic-title {
    font-weight: 600;
  }
  .usage-mosaic-sub {
    font-size: 12px;
    color: var(--text-muted);
  }
  .usage-mosaic-grid {
    display: grid;
    grid-template-columns: minmax(200px, 1fr) minmax(260px, 2fr);
    gap: 16px;
    align-items: start;
  }
  .usage-mosaic-section {
    background: var(--bg-subtle);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
  }
  .usage-mosaic-section-title {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .usage-mosaic-total {
    font-size: 20px;
    font-weight: 700;
  }
  .usage-daypart-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 8px;
  }
  .usage-daypart-cell {
    border-radius: 8px;
    padding: 10px;
    color: var(--text);
    background: rgba(255, 77, 77, 0.08);
    border: 1px solid rgba(255, 77, 77, 0.2);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .usage-daypart-label {
    font-size: 12px;
    font-weight: 600;
  }
  .usage-daypart-value {
    font-size: 14px;
  }
  .usage-hour-grid {
    display: grid;
    grid-template-columns: repeat(24, minmax(6px, 1fr));
    gap: 4px;
  }
  .usage-hour-cell {
    height: 28px;
    border-radius: 6px;
    background: rgba(255, 77, 77, 0.1);
    border: 1px solid rgba(255, 77, 77, 0.2);
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .usage-hour-cell.selected {
    border-color: rgba(255, 77, 77, 0.8);
    box-shadow: 0 0 0 2px rgba(255, 77, 77, 0.2);
  }
  .usage-hour-labels {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 6px;
    margin-top: 8px;
    font-size: 11px;
    color: var(--text-muted);
  }
  .usage-hour-legend {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 10px;
    font-size: 11px;
    color: var(--text-muted);
  }
  .usage-hour-legend span {
    display: inline-block;
    width: 14px;
    height: 10px;
    border-radius: 4px;
    background: rgba(255, 77, 77, 0.15);
    border: 1px solid rgba(255, 77, 77, 0.2);
  }
  .usage-calendar-labels {
    display: grid;
    grid-template-columns: repeat(7, minmax(10px, 1fr));
    gap: 6px;
    font-size: 10px;
    color: var(--text-muted);
    margin-bottom: 6px;
  }
  .usage-calendar {
    display: grid;
    grid-template-columns: repeat(7, minmax(10px, 1fr));
    gap: 6px;
  }
  .usage-calendar-cell {
    height: 18px;
    border-radius: 4px;
    border: 1px solid rgba(255, 77, 77, 0.2);
    background: rgba(255, 77, 77, 0.08);
  }
  .usage-calendar-cell.empty {
    background: transparent;
    border-color: transparent;
  }
  .usage-summary-title {
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 6px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .usage-info {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-left: 6px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg);
    font-size: 10px;
    color: var(--text-muted);
    cursor: help;
  }
  .usage-summary-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-strong);
  }
  .usage-summary-value.good {
    color: #1f8f4e;
  }
  .usage-summary-value.warn {
    color: #c57a00;
  }
  .usage-summary-value.bad {
    color: #c9372c;
  }
  .usage-summary-hint {
    font-size: 10px;
    color: var(--text-muted);
    cursor: help;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0 6px;
    line-height: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .usage-summary-sub {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
  }
  .usage-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .usage-list-item {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    color: var(--text);
    align-items: flex-start;
  }
  .usage-list-value {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    text-align: right;
  }
  .usage-list-sub {
    font-size: 11px;
    color: var(--text-muted);
  }
  .usage-list-item.button {
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    cursor: pointer;
  }
  .usage-list-item.button:hover {
    color: var(--text-strong);
  }
  .usage-list-item .muted {
    font-size: 11px;
  }
  .usage-error-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .usage-error-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    font-size: 12px;
  }
  .usage-error-date {
    font-weight: 600;
  }
  .usage-error-rate {
    font-variant-numeric: tabular-nums;
  }
  .usage-error-sub {
    grid-column: 1 / -1;
    font-size: 11px;
    color: var(--text-muted);
  }
  .usage-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }
  .usage-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 11px;
    background: var(--bg);
    color: var(--text);
  }
  .usage-meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  }
  .usage-meta-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
  }
  .usage-meta-item span {
    color: var(--text-muted);
    font-size: 11px;
  }
  .usage-insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-top: 12px;
  }
  .usage-insight-card {
    padding: 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg-secondary);
  }
  .usage-insight-title {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 10px;
  }
  .usage-insight-subtitle {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 6px;
  }
  /* ===== CHART TOGGLE ===== */
  .chart-toggle {
    display: flex;
    background: var(--bg);
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .chart-toggle .toggle-btn {
    padding: 6px 14px;
    font-size: 13px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
  }
  .chart-toggle .toggle-btn:hover {
    color: var(--text);
  }
  .chart-toggle .toggle-btn.active {
    background: #ff4d4d;
    color: white;
  }
  .chart-toggle.small .toggle-btn {
    padding: 4px 8px;
    font-size: 11px;
  }
  .sessions-toggle {
    border-radius: 4px;
  }
  .sessions-toggle .toggle-btn {
    border-radius: 4px;
  }
  .daily-chart-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    margin-bottom: 6px;
  }

  /* ===== DAILY BAR CHART ===== */
  .daily-chart {
    margin-top: 12px;
  }
  .daily-chart-bars {
    display: flex;
    align-items: flex-end;
    height: 200px;
    gap: 4px;
    padding: 8px 4px 36px;
  }
  .daily-bar-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
    cursor: pointer;
    position: relative;
    border-radius: 4px 4px 0 0;
    transition: background 0.15s;
    min-width: 0;
  }
  .daily-bar-wrapper:hover {
    background: var(--bg-hover);
  }
  .daily-bar-wrapper.selected {
    background: var(--accent-subtle);
  }
  .daily-bar-wrapper.selected .daily-bar {
    background: var(--accent);
  }
  .daily-bar {
    width: 100%;
    max-width: var(--bar-max-width, 32px);
    background: #ff4d4d;
    border-radius: 3px 3px 0 0;
    min-height: 2px;
    transition: all 0.15s;
    overflow: hidden;
  }
  .daily-bar-wrapper:hover .daily-bar {
    background: #cc3d3d;
  }
  .daily-bar-label {
    position: absolute;
    bottom: -28px;
    font-size: 10px;
    color: var(--text-muted);
    white-space: nowrap;
    text-align: center;
    transform: rotate(-35deg);
    transform-origin: top center;
  }
  .daily-bar-total {
    position: absolute;
    top: -16px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .daily-bar-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .daily-bar-wrapper:hover .daily-bar-tooltip {
    opacity: 1;
  }

  /* ===== COST/TOKEN BREAKDOWN BAR ===== */
  .cost-breakdown {
    margin-top: 18px;
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: 8px;
  }
  .cost-breakdown-header {
    font-weight: 600;
    font-size: 15px;
    letter-spacing: -0.02em;
    margin-bottom: 12px;
    color: var(--text-strong);
  }
  .cost-breakdown-bar {
    height: 28px;
    background: var(--bg);
    border-radius: 6px;
    overflow: hidden;
    display: flex;
  }
  .cost-segment {
    height: 100%;
    transition: width 0.3s ease;
    position: relative;
  }
  .cost-segment.output {
    background: #ef4444;
  }
  .cost-segment.input {
    background: #f59e0b;
  }
  .cost-segment.cache-write {
    background: #10b981;
  }
  .cost-segment.cache-read {
    background: #06b6d4;
  }
  .cost-breakdown-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 12px;
  }
  .cost-breakdown-total {
    margin-top: 10px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text);
    cursor: help;
  }
  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .legend-dot.output {
    background: #ef4444;
  }
  .legend-dot.input {
    background: #f59e0b;
  }
  .legend-dot.cache-write {
    background: #10b981;
  }
  .legend-dot.cache-read {
    background: #06b6d4;
  }
  .legend-dot.system {
    background: #ff4d4d;
  }
  .legend-dot.skills {
    background: #8b5cf6;
  }
  .legend-dot.tools {
    background: #ec4899;
  }
  .legend-dot.files {
    background: #f59e0b;
  }
  .cost-breakdown-note {
    margin-top: 10px;
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.4;
  }

  /* ===== SESSION BARS (scrollable list) ===== */
  .session-bars {
    margin-top: 16px;
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
  }
  .session-bar-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.15s;
  }
  .session-bar-row:last-child {
    border-bottom: none;
  }
  .session-bar-row:hover {
    background: var(--bg-hover);
  }
  .session-bar-row.selected {
    background: var(--accent-subtle);
  }
  .session-bar-label {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 13px;
    color: var(--text);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .session-bar-title {
    /* Prefer showing the full name; wrap instead of truncating. */
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .session-bar-meta {
    font-size: 10px;
    color: var(--text-muted);
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .session-bar-track {
    flex: 0 0 90px;
    height: 6px;
    background: var(--bg-secondary);
    border-radius: 4px;
    overflow: hidden;
    opacity: 0.6;
  }
  .session-bar-fill {
    height: 100%;
    background: rgba(255, 77, 77, 0.7);
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  .session-bar-value {
    flex: 0 0 70px;
    text-align: right;
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-muted);
  }
  .session-bar-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
  }
  .session-copy-btn {
    height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .session-copy-btn:hover {
    background: var(--bg);
    border-color: var(--border-strong);
    color: var(--text);
  }

  /* ===== TIME SERIES CHART ===== */
  .session-timeseries {
    margin-top: 24px;
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: 8px;
  }
  .timeseries-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .timeseries-controls {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .timeseries-header {
    font-weight: 600;
    color: var(--text);
  }
  .timeseries-chart {
    width: 100%;
    overflow: hidden;
  }
  .timeseries-svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .timeseries-svg .axis-label {
    font-size: 10px;
    fill: var(--text-muted);
  }
  .timeseries-svg .ts-area {
    fill: #ff4d4d;
    fill-opacity: 0.1;
  }
  .timeseries-svg .ts-line {
    fill: none;
    stroke: #ff4d4d;
    stroke-width: 2;
  }
  .timeseries-svg .ts-dot {
    fill: #ff4d4d;
    transition: r 0.15s, fill 0.15s;
  }
  .timeseries-svg .ts-dot:hover {
    r: 5;
  }
  .timeseries-svg .ts-bar {
    fill: #ff4d4d;
    transition: fill 0.15s;
  }
  .timeseries-svg .ts-bar:hover {
    fill: #cc3d3d;
  }
  .timeseries-svg .ts-bar.output { fill: #ef4444; }
  .timeseries-svg .ts-bar.input { fill: #f59e0b; }
  .timeseries-svg .ts-bar.cache-write { fill: #10b981; }
  .timeseries-svg .ts-bar.cache-read { fill: #06b6d4; }
  .timeseries-summary {
    margin-top: 12px;
    font-size: 13px;
    color: var(--text-muted);
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .timeseries-loading {
    padding: 24px;
    text-align: center;
    color: var(--text-muted);
  }

  /* ===== SESSION LOGS ===== */
  .session-logs {
    margin-top: 24px;
    background: var(--bg-secondary);
    border-radius: 8px;
    overflow: hidden;
  }
  .session-logs-header {
    padding: 10px 14px;
    font-weight: 600;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    background: var(--bg-secondary);
  }
  .session-logs-loading {
    padding: 24px;
    text-align: center;
    color: var(--text-muted);
  }
  .session-logs-list {
    max-height: 400px;
    overflow-y: auto;
  }
  .session-log-entry {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--bg);
  }
  .session-log-entry:last-child {
    border-bottom: none;
  }
  .session-log-entry.user {
    border-left: 3px solid var(--accent);
  }
  .session-log-entry.assistant {
    border-left: 3px solid var(--border-strong);
  }
  .session-log-meta {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 11px;
    color: var(--text-muted);
    flex-wrap: wrap;
  }
  .session-log-role {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
  }
  .session-log-entry.user .session-log-role {
    color: var(--accent);
  }
  .session-log-entry.assistant .session-log-role {
    color: var(--text-muted);
  }
  .session-log-content {
    font-size: 13px;
    line-height: 1.5;
    color: var(--text);
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    max-height: 220px;
    overflow-y: auto;
  }

  /* ===== CONTEXT WEIGHT BREAKDOWN ===== */
  .context-weight-breakdown {
    margin-top: 24px;
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: 8px;
  }
  .context-weight-breakdown .context-weight-header {
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 4px;
    color: var(--text);
  }
  .context-weight-desc {
    font-size: 12px;
    color: var(--text-muted);
    margin: 0 0 12px 0;
  }
  .context-stacked-bar {
    height: 24px;
    background: var(--bg);
    border-radius: 6px;
    overflow: hidden;
    display: flex;
  }
  .context-segment {
    height: 100%;
    transition: width 0.3s ease;
  }
  .context-segment.system {
    background: #ff4d4d;
  }
  .context-segment.skills {
    background: #8b5cf6;
  }
  .context-segment.tools {
    background: #ec4899;
  }
  .context-segment.files {
    background: #f59e0b;
  }
  .context-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 12px;
  }
  .context-total {
    margin-top: 10px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
  }
  .context-details {
    margin-top: 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .context-details summary {
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }
  .context-details[open] summary {
    border-bottom: 1px solid var(--border);
  }
  .context-list {
    max-height: 200px;
    overflow-y: auto;
  }
  .context-list-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 14px;
    font-size: 11px;
    text-transform: uppercase;
    color: var(--text-muted);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
  }
  .context-list-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 14px;
    font-size: 12px;
    border-bottom: 1px solid var(--border);
  }
  .context-list-item:last-child {
    border-bottom: none;
  }
  .context-list-item .mono {
    font-family: var(--font-mono);
    color: var(--text);
  }
  .context-list-item .muted {
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  /* ===== NO CONTEXT NOTE ===== */
  .no-context-note {
    margin-top: 24px;
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: 8px;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  /* ===== TWO COLUMN LAYOUT ===== */
  .usage-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-top: 18px;
    align-items: stretch;
  }
  .usage-grid-left {
    display: flex;
    flex-direction: column;
  }
  .usage-grid-right {
    display: flex;
    flex-direction: column;
  }
  
  /* ===== LEFT CARD (Daily + Breakdown) ===== */
  .usage-left-card {
    /* inherits background, border, shadow from .card */
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .usage-left-card .daily-chart-bars {
    flex: 1;
    min-height: 200px;
  }
  .usage-left-card .sessions-panel-title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 12px;
  }
  
  /* ===== COMPACT DAILY CHART ===== */
  .daily-chart-compact {
    margin-bottom: 16px;
  }
  .daily-chart-compact .sessions-panel-title {
    margin-bottom: 8px;
  }
  .daily-chart-compact .daily-chart-bars {
    height: 100px;
    padding-bottom: 20px;
  }
  
  /* ===== COMPACT COST BREAKDOWN ===== */
  .cost-breakdown-compact {
    padding: 0;
    margin: 0;
    background: transparent;
    border-top: 1px solid var(--border);
    padding-top: 12px;
  }
  .cost-breakdown-compact .cost-breakdown-header {
    margin-bottom: 8px;
  }
  .cost-breakdown-compact .cost-breakdown-legend {
    gap: 12px;
  }
  .cost-breakdown-compact .cost-breakdown-note {
    display: none;
  }
  
  /* ===== SESSIONS CARD ===== */
  .sessions-card {
    /* inherits background, border, shadow from .card */
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .sessions-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .sessions-card-title {
    font-weight: 600;
    font-size: 14px;
  }
  .sessions-card-count {
    font-size: 12px;
    color: var(--text-muted);
  }
  .sessions-card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 8px 0 10px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .sessions-card-stats {
    display: inline-flex;
    gap: 12px;
  }
  .sessions-sort {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .sessions-sort select {
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    font-size: 12px;
  }
  .sessions-action-btn {
    height: 28px;
    padding: 0 10px;
    border-radius: 8px;
    font-size: 12px;
    line-height: 1;
  }
  .sessions-action-btn.icon {
    width: 32px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .sessions-card-hint {
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }
  .sessions-card .session-bars {
    max-height: 280px;
    background: var(--bg);
    border-radius: 6px;
    border: 1px solid var(--border);
    margin: 0;
    overflow-y: auto;
    padding: 8px;
  }
  .sessions-card .session-bar-row {
    padding: 6px 8px;
    border-radius: 6px;
    margin-bottom: 3px;
    border: 1px solid transparent;
    transition: all 0.15s;
  }
  .sessions-card .session-bar-row:hover {
    border-color: var(--border);
    background: var(--bg-hover);
  }
  .sessions-card .session-bar-row.selected {
    border-color: var(--accent);
    background: var(--accent-subtle);
    box-shadow: inset 0 0 0 1px rgba(255, 77, 77, 0.15);
  }
  .sessions-card .session-bar-label {
    flex: 1 1 auto;
    min-width: 140px;
    font-size: 12px;
  }
  .sessions-card .session-bar-value {
    flex: 0 0 60px;
    font-size: 11px;
    font-weight: 600;
  }
  .sessions-card .session-bar-track {
    flex: 0 0 70px;
    height: 5px;
    opacity: 0.5;
  }
  .sessions-card .session-bar-fill {
    background: rgba(255, 77, 77, 0.55);
  }
  .sessions-clear-btn {
    margin-left: auto;
  }
  
  /* ===== EMPTY DETAIL STATE ===== */
  .session-detail-empty {
    margin-top: 18px;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 2px dashed var(--border);
    padding: 32px;
    text-align: center;
  }
  .session-detail-empty-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 8px;
  }
  .session-detail-empty-desc {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 16px;
    line-height: 1.5;
  }
  .session-detail-empty-features {
    display: flex;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;
  }
  .session-detail-empty-feature {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .session-detail-empty-feature .icon {
    font-size: 16px;
  }
  
  /* ===== SESSION DETAIL PANEL ===== */
  .session-detail-panel {
    margin-top: 12px;
    /* inherits background, border-radius, shadow from .card */
    border: 2px solid var(--accent) !important;
  }
  .session-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
  }
  .session-detail-header:hover {
    background: var(--bg-hover);
  }
  .session-detail-title {
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .session-detail-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .session-close-btn {
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    cursor: pointer;
    padding: 2px 8px;
    font-size: 16px;
    line-height: 1;
    border-radius: 4px;
    transition: background 0.15s, color 0.15s;
  }
  .session-close-btn:hover {
    background: var(--bg-hover);
    color: var(--text);
    border-color: var(--accent);
  }
  .session-detail-stats {
    display: flex;
    gap: 10px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .session-detail-stats strong {
    color: var(--text);
    font-family: var(--font-mono);
  }
  .session-detail-content {
    padding: 12px;
  }
  .session-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
    margin-bottom: 12px;
  }
  .session-summary-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px;
    background: var(--bg-secondary);
  }
  .session-summary-title {
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 4px;
  }
  .session-summary-value {
    font-size: 14px;
    font-weight: 600;
  }
  .session-summary-meta {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
  }
  .session-detail-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    /* Separate "Usage Over Time" from the summary + Top Tools/Model Mix cards above. */
    margin-top: 12px;
    margin-bottom: 10px;
  }
  .session-detail-bottom {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr);
    gap: 10px;
    align-items: stretch;
  }
  .session-detail-bottom .session-logs-compact {
    margin: 0;
    display: flex;
    flex-direction: column;
  }
  .session-detail-bottom .session-logs-compact .session-logs-list {
    flex: 1 1 auto;
    max-height: none;
  }
  .context-details-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--bg);
    border-radius: 6px;
    border: 1px solid var(--border);
    padding: 12px;
  }
  .context-breakdown-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
    margin-top: 8px;
  }
  .context-breakdown-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px;
    background: var(--bg-secondary);
  }
  .context-breakdown-title {
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .context-breakdown-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 11px;
  }
  .context-breakdown-item {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .context-breakdown-more {
    font-size: 10px;
    color: var(--text-muted);
    margin-top: 4px;
  }
  .context-breakdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .context-expand-btn {
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    color: var(--text-muted);
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .context-expand-btn:hover {
    color: var(--text);
    border-color: var(--border-strong);
    background: var(--bg);
  }
  
  /* ===== COMPACT TIMESERIES ===== */
  .session-timeseries-compact {
    background: var(--bg);
    border-radius: 6px;
    border: 1px solid var(--border);
    padding: 12px;
    margin: 0;
  }
  .session-timeseries-compact .timeseries-header-row {
    margin-bottom: 8px;
  }
  .session-timeseries-compact .timeseries-header {
    font-size: 12px;
  }
  .session-timeseries-compact .timeseries-summary {
    font-size: 11px;
    margin-top: 8px;
  }
  
  /* ===== COMPACT CONTEXT ===== */
  .context-weight-compact {
    background: var(--bg);
    border-radius: 6px;
    border: 1px solid var(--border);
    padding: 12px;
    margin: 0;
  }
  .context-weight-compact .context-weight-header {
    font-size: 12px;
    margin-bottom: 4px;
  }
  .context-weight-compact .context-weight-desc {
    font-size: 11px;
    margin-bottom: 8px;
  }
  .context-weight-compact .context-stacked-bar {
    height: 16px;
  }
  .context-weight-compact .context-legend {
    font-size: 11px;
    gap: 10px;
    margin-top: 8px;
  }
  .context-weight-compact .context-total {
    font-size: 11px;
    margin-top: 6px;
  }
  .context-weight-compact .context-details {
    margin-top: 8px;
  }
  .context-weight-compact .context-details summary {
    font-size: 12px;
    padding: 6px 10px;
  }
  
  /* ===== COMPACT LOGS ===== */
  .session-logs-compact {
    background: var(--bg);
    border-radius: 10px;
    border: 1px solid var(--border);
    overflow: hidden;
    margin: 0;
    display: flex;
    flex-direction: column;
  }
  .session-logs-compact .session-logs-header {
    padding: 10px 12px;
    font-size: 12px;
  }
  .session-logs-compact .session-logs-list {
    max-height: none;
    flex: 1 1 auto;
    overflow: auto;
  }
  .session-logs-compact .session-log-entry {
    padding: 8px 12px;
  }
  .session-logs-compact .session-log-content {
    font-size: 12px;
    max-height: 160px;
  }
  .session-log-tools {
    margin-top: 6px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg-secondary);
    padding: 6px 8px;
    font-size: 11px;
    color: var(--text);
  }
  .session-log-tools summary {
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }
  .session-log-tools summary::-webkit-details-marker {
    display: none;
  }
  .session-log-tools-list {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .session-log-tools-pill {
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 2px 8px;
    font-size: 10px;
    background: var(--bg);
    color: var(--text);
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 900px) {
    .usage-grid {
      grid-template-columns: 1fr;
    }
    .session-detail-row {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 600px) {
    .session-bar-label {
      flex: 0 0 100px;
    }
    .cost-breakdown-legend {
      gap: 10px;
    }
    .legend-item {
      font-size: 11px;
    }
    .daily-chart-bars {
      height: 170px;
      gap: 6px;
      padding-bottom: 40px;
    }
    .daily-bar-label {
      font-size: 8px;
      bottom: -30px;
      transform: rotate(-45deg);
    }
    .usage-mosaic-grid {
      grid-template-columns: 1fr;
    }
    .usage-hour-grid {
      grid-template-columns: repeat(12, minmax(10px, 1fr));
    }
    .usage-hour-cell {
      height: 22px;
    }
  }
`,Hv=4;function rt(e){return Math.round(e/Hv)}function U(e){return e>=1e6?`${(e/1e6).toFixed(1)}M`:e>=1e3?`${(e/1e3).toFixed(1)}K`:String(e)}function zv(e){const t=new Date;return t.setHours(e,0,0,0),t.toLocaleTimeString(void 0,{hour:"numeric"})}function Wv(e,t){const n=Array.from({length:24},()=>0),s=Array.from({length:24},()=>0);for(const a of e){const i=a.usage;if(!i?.messageCounts||i.messageCounts.total===0)continue;const r=i.firstActivity??a.updatedAt,c=i.lastActivity??a.updatedAt;if(!r||!c)continue;const d=Math.min(r,c),g=Math.max(r,c),p=Math.max(g-d,1)/6e4;let f=d;for(;f<g;){const u=new Date(f),m=co(u,t),b=uo(u,t),x=Math.min(b.getTime(),g),$=Math.max((x-f)/6e4,0)/p;n[m]+=i.messageCounts.errors*$,s[m]+=i.messageCounts.total*$,f=x+1}}return s.map((a,i)=>{const r=n[i],c=a>0?r/a:0;return{hour:i,rate:c,errors:r,msgs:a}}).filter(a=>a.msgs>0&&a.errors>0).toSorted((a,i)=>i.rate-a.rate).slice(0,5).map(a=>({label:zv(a.hour),value:`${(a.rate*100).toFixed(2)}%`,sub:`${Math.round(a.errors)} ${o("usageErrors").toLowerCase()} · ${Math.round(a.msgs)} ${o("usageMessagesCount")}`}))}const Kv=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];function co(e,t){return t==="utc"?e.getUTCHours():e.getHours()}function jv(e,t){return t==="utc"?e.getUTCDay():e.getDay()}function uo(e,t){const n=new Date(e);return t==="utc"?n.setUTCMinutes(59,59,999):n.setMinutes(59,59,999),n}function qv(e,t){const n=Array.from({length:24},()=>0),s=Array.from({length:7},()=>0);let a=0,i=!1;for(const c of e){const d=c.usage;if(!d||!d.totalTokens||d.totalTokens<=0)continue;a+=d.totalTokens;const g=d.firstActivity??c.updatedAt,h=d.lastActivity??c.updatedAt;if(!g||!h)continue;i=!0;const p=Math.min(g,h),f=Math.max(g,h),m=Math.max(f-p,1)/6e4;let b=p;for(;b<f;){const x=new Date(b),A=co(x,t),$=jv(x,t),T=uo(x,t),C=Math.min(T.getTime(),f),M=Math.max((C-b)/6e4,0)/m;n[A]+=d.totalTokens*M,s[$]+=d.totalTokens*M,b=C+1}}const r=Kv.map((c,d)=>({label:c,tokens:s[d]}));return{hasData:i,totalTokens:a,hourTotals:n,weekdayTotals:r}}function Gv(e,t,n,s){const a=qv(e,t);if(!a.hasData)return l`
      <div class="card usage-mosaic">
        <div class="usage-mosaic-header">
          <div>
            <div class="usage-mosaic-title">${o("usageActivityByTime")}</div>
            <div class="usage-mosaic-sub">${o("usageMosaicSubNoData")}</div>
          </div>
          <div class="usage-mosaic-total">${U(0)} ${o("usageTokensUnit")}</div>
        </div>
        <div class="muted" style="padding: 12px; text-align: center;">${o("usageNoTimeline")}</div>
      </div>
    `;const i=Math.max(...a.hourTotals,1),r=Math.max(...a.weekdayTotals.map(c=>c.tokens),1);return l`
    <div class="card usage-mosaic">
      <div class="usage-mosaic-header">
        <div>
          <div class="usage-mosaic-title">${o("usageActivityByTime")}</div>
          <div class="usage-mosaic-sub">
            Estimated from session spans (first/last activity). Time zone: ${o(t==="utc"?"usageTimeZoneUtc":"usageTimeZoneLocal")}.
          </div>
        </div>
        <div class="usage-mosaic-total">${U(a.totalTokens)} ${o("usageTokensUnit")}</div>
      </div>
      <div class="usage-mosaic-grid">
        <div class="usage-mosaic-section">
          <div class="usage-mosaic-section-title">${o("usageDayOfWeek")}</div>
          <div class="usage-daypart-grid">
            ${a.weekdayTotals.map(c=>{const d=Math.min(c.tokens/r,1),g=c.tokens>0?`rgba(255, 77, 77, ${.12+d*.6})`:"transparent";return l`
                <div class="usage-daypart-cell" style="background: ${g};">
                  <div class="usage-daypart-label">${c.label}</div>
                  <div class="usage-daypart-value">${U(c.tokens)}</div>
                </div>
              `})}
          </div>
        </div>
        <div class="usage-mosaic-section">
          <div class="usage-mosaic-section-title">
            <span>${o("usageHours")}</span>
            <span class="usage-mosaic-sub">0 → 23</span>
          </div>
          <div class="usage-hour-grid">
            ${a.hourTotals.map((c,d)=>{const g=Math.min(c/i,1),h=c>0?`rgba(255, 77, 77, ${.08+g*.7})`:"transparent",p=`${d}:00 · ${U(c)} ${o("usageTokensUnit")}`,f=g>.7?"rgba(255, 77, 77, 0.6)":"rgba(255, 77, 77, 0.2)",u=n.includes(d);return l`
                <div
                  class="usage-hour-cell ${u?"selected":""}"
                  style="background: ${h}; border-color: ${f};"
                  title="${p}"
                  @click=${m=>s(d,m.shiftKey)}
                ></div>
              `})}
          </div>
          <div class="usage-hour-labels">
            <span>${o("usageMidnight")}</span>
            <span>${o("usage4am")}</span>
            <span>${o("usage8am")}</span>
            <span>${o("usageNoon")}</span>
            <span>${o("usage4pm")}</span>
            <span>${o("usage8pm")}</span>
          </div>
          <div class="usage-hour-legend">
            <span></span>
            Low → High token density
          </div>
        </div>
      </div>
    </div>
  `}function G(e,t=2){return`$${e.toFixed(t)}`}function Ws(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function Vv(e){return!e||e<=0?"0s":e>=6e4?`${Math.round(e/6e4)}m`:e>=1e3?`${Math.round(e/1e3)}s`:`${Math.round(e)}ms`}function Wl(e){const t=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e);if(!t)return null;const[,n,s,a]=t,i=new Date(Date.UTC(Number(n),Number(s)-1,Number(a)));return Number.isNaN(i.valueOf())?null:i}function Kl(e){const t=Wl(e);return t?t.toLocaleDateString(void 0,{month:"short",day:"numeric"}):e}function Qv(e){const t=Wl(e);return t?t.toLocaleDateString(void 0,{month:"long",day:"numeric",year:"numeric"}):e}function jl(e){if(!e||e<=0)return"—";const t=Math.round(e/1e3),n=t%60,s=Math.floor(t/60)%60,a=Math.floor(t/3600);return a>0?`${a}h ${s}m`:s>0?`${s}m ${n}s`:`${n}s`}function Ks(e,t,n="text/plain"){const s=new Blob([t],{type:n}),a=URL.createObjectURL(s),i=document.createElement("a");i.href=a,i.download=e,i.click(),URL.revokeObjectURL(a)}function Yv(e){return e.includes('"')||e.includes(",")||e.includes(`
`)?`"${e.replace(/"/g,'""')}"`:e}function Vn(e){return e.map(t=>t==null?"":Yv(String(t))).join(",")}const En=()=>({input:0,output:0,cacheRead:0,cacheWrite:0,totalTokens:0,totalCost:0,inputCost:0,outputCost:0,cacheReadCost:0,cacheWriteCost:0,missingCostEntries:0}),Ln=(e,t)=>{e.input+=t.input??0,e.output+=t.output??0,e.cacheRead+=t.cacheRead??0,e.cacheWrite+=t.cacheWrite??0,e.totalTokens+=t.totalTokens??0,e.totalCost+=t.totalCost??0,e.inputCost+=t.inputCost??0,e.outputCost+=t.outputCost??0,e.cacheReadCost+=t.cacheReadCost??0,e.cacheWriteCost+=t.cacheWriteCost??0,e.missingCostEntries+=t.missingCostEntries??0},Jv=(e,t)=>{if(e.length===0)return t??{messages:{total:0,user:0,assistant:0,toolCalls:0,toolResults:0,errors:0},tools:{totalCalls:0,uniqueTools:0,tools:[]},byModel:[],byProvider:[],byAgent:[],byChannel:[],daily:[]};const n={total:0,user:0,assistant:0,toolCalls:0,toolResults:0,errors:0},s=new Map,a=new Map,i=new Map,r=new Map,c=new Map,d=new Map,g=new Map,h=new Map,p={count:0,sum:0,min:Number.POSITIVE_INFINITY,max:0,p95Max:0};for(const f of e){const u=f.usage;if(u){if(u.messageCounts&&(n.total+=u.messageCounts.total,n.user+=u.messageCounts.user,n.assistant+=u.messageCounts.assistant,n.toolCalls+=u.messageCounts.toolCalls,n.toolResults+=u.messageCounts.toolResults,n.errors+=u.messageCounts.errors),u.toolUsage)for(const m of u.toolUsage.tools)s.set(m.name,(s.get(m.name)??0)+m.count);if(u.modelUsage)for(const m of u.modelUsage){const b=`${m.provider??"unknown"}::${m.model??"unknown"}`,x=a.get(b)??{provider:m.provider,model:m.model,count:0,totals:En()};x.count+=m.count,Ln(x.totals,m.totals),a.set(b,x);const A=m.provider??"unknown",$=i.get(A)??{provider:m.provider,model:void 0,count:0,totals:En()};$.count+=m.count,Ln($.totals,m.totals),i.set(A,$)}if(u.latency){const{count:m,avgMs:b,minMs:x,maxMs:A,p95Ms:$}=u.latency;m>0&&(p.count+=m,p.sum+=b*m,p.min=Math.min(p.min,x),p.max=Math.max(p.max,A),p.p95Max=Math.max(p.p95Max,$))}if(f.agentId){const m=r.get(f.agentId)??En();Ln(m,u),r.set(f.agentId,m)}if(f.channel){const m=c.get(f.channel)??En();Ln(m,u),c.set(f.channel,m)}for(const m of u.dailyBreakdown??[]){const b=d.get(m.date)??{date:m.date,tokens:0,cost:0,messages:0,toolCalls:0,errors:0};b.tokens+=m.tokens,b.cost+=m.cost,d.set(m.date,b)}for(const m of u.dailyMessageCounts??[]){const b=d.get(m.date)??{date:m.date,tokens:0,cost:0,messages:0,toolCalls:0,errors:0};b.messages+=m.total,b.toolCalls+=m.toolCalls,b.errors+=m.errors,d.set(m.date,b)}for(const m of u.dailyLatency??[]){const b=g.get(m.date)??{date:m.date,count:0,sum:0,min:Number.POSITIVE_INFINITY,max:0,p95Max:0};b.count+=m.count,b.sum+=m.avgMs*m.count,b.min=Math.min(b.min,m.minMs),b.max=Math.max(b.max,m.maxMs),b.p95Max=Math.max(b.p95Max,m.p95Ms),g.set(m.date,b)}for(const m of u.dailyModelUsage??[]){const b=`${m.date}::${m.provider??"unknown"}::${m.model??"unknown"}`,x=h.get(b)??{date:m.date,provider:m.provider,model:m.model,tokens:0,cost:0,count:0};x.tokens+=m.tokens,x.cost+=m.cost,x.count+=m.count,h.set(b,x)}}}return{messages:n,tools:{totalCalls:Array.from(s.values()).reduce((f,u)=>f+u,0),uniqueTools:s.size,tools:Array.from(s.entries()).map(([f,u])=>({name:f,count:u})).toSorted((f,u)=>u.count-f.count)},byModel:Array.from(a.values()).toSorted((f,u)=>u.totals.totalCost-f.totals.totalCost),byProvider:Array.from(i.values()).toSorted((f,u)=>u.totals.totalCost-f.totals.totalCost),byAgent:Array.from(r.entries()).map(([f,u])=>({agentId:f,totals:u})).toSorted((f,u)=>u.totals.totalCost-f.totals.totalCost),byChannel:Array.from(c.entries()).map(([f,u])=>({channel:f,totals:u})).toSorted((f,u)=>u.totals.totalCost-f.totals.totalCost),latency:p.count>0?{count:p.count,avgMs:p.sum/p.count,minMs:p.min===Number.POSITIVE_INFINITY?0:p.min,maxMs:p.max,p95Ms:p.p95Max}:void 0,dailyLatency:Array.from(g.values()).map(f=>({date:f.date,count:f.count,avgMs:f.count?f.sum/f.count:0,minMs:f.min===Number.POSITIVE_INFINITY?0:f.min,maxMs:f.max,p95Ms:f.p95Max})).toSorted((f,u)=>f.date.localeCompare(u.date)),modelDaily:Array.from(h.values()).toSorted((f,u)=>f.date.localeCompare(u.date)||u.cost-f.cost),daily:Array.from(d.values()).toSorted((f,u)=>f.date.localeCompare(u.date))}},Zv=(e,t,n)=>{let s=0,a=0;for(const h of e){const p=h.usage?.durationMs??0;p>0&&(s+=p,a+=1)}const i=a?s/a:0,r=t&&s>0?t.totalTokens/(s/6e4):void 0,c=t&&s>0?t.totalCost/(s/6e4):void 0,d=n.messages.total?n.messages.errors/n.messages.total:0,g=n.daily.filter(h=>h.messages>0&&h.errors>0).map(h=>({date:h.date,errors:h.errors,messages:h.messages,rate:h.errors/h.messages})).toSorted((h,p)=>p.rate-h.rate||p.errors-h.errors)[0];return{durationSumMs:s,durationCount:a,avgDurationMs:i,throughputTokensPerMin:r,throughputCostPerMin:c,errorRate:d,peakErrorDay:g}},Xv=e=>{const t=[Vn(["key","label","agentId","channel","provider","model","updatedAt","durationMs","messages","errors","toolCalls","inputTokens","outputTokens","cacheReadTokens","cacheWriteTokens","totalTokens","totalCost"])];for(const n of e){const s=n.usage;t.push(Vn([n.key,n.label??"",n.agentId??"",n.channel??"",n.modelProvider??n.providerOverride??"",n.model??n.modelOverride??"",n.updatedAt?new Date(n.updatedAt).toISOString():"",s?.durationMs??"",s?.messageCounts?.total??"",s?.messageCounts?.errors??"",s?.messageCounts?.toolCalls??"",s?.input??"",s?.output??"",s?.cacheRead??"",s?.cacheWrite??"",s?.totalTokens??"",s?.totalCost??""]))}return t.join(`
`)},eb=e=>{const t=[Vn(["date","inputTokens","outputTokens","cacheReadTokens","cacheWriteTokens","totalTokens","inputCost","outputCost","cacheReadCost","cacheWriteCost","totalCost"])];for(const n of e)t.push(Vn([n.date,n.input,n.output,n.cacheRead,n.cacheWrite,n.totalTokens,n.inputCost??"",n.outputCost??"",n.cacheReadCost??"",n.cacheWriteCost??"",n.totalCost]));return t.join(`
`)},tb=(e,t,n)=>{const s=e.trim();if(!s)return[];const a=s.length?s.split(/\s+/):[],i=a.length?a[a.length-1]:"",[r,c]=i.includes(":")?[i.slice(0,i.indexOf(":")),i.slice(i.indexOf(":")+1)]:["",""],d=r.toLowerCase(),g=c.toLowerCase(),h=$=>{const T=new Set;for(const C of $)C&&T.add(C);return Array.from(T)},p=h(t.map($=>$.agentId)).slice(0,6),f=h(t.map($=>$.channel)).slice(0,6),u=h([...t.map($=>$.modelProvider),...t.map($=>$.providerOverride),...n?.byProvider.map($=>$.provider)??[]]).slice(0,6),m=h([...t.map($=>$.model),...n?.byModel.map($=>$.model)??[]]).slice(0,6),b=h(n?.tools.tools.map($=>$.name)??[]).slice(0,6);if(!d)return[{label:"agent:",value:"agent:"},{label:"channel:",value:"channel:"},{label:"provider:",value:"provider:"},{label:"model:",value:"model:"},{label:"tool:",value:"tool:"},{label:"has:errors",value:"has:errors"},{label:"has:tools",value:"has:tools"},{label:"minTokens:",value:"minTokens:"},{label:"maxCost:",value:"maxCost:"}];const x=[],A=($,T)=>{for(const C of T)(!g||C.toLowerCase().includes(g))&&x.push({label:`${$}:${C}`,value:`${$}:${C}`})};switch(d){case"agent":A("agent",p);break;case"channel":A("channel",f);break;case"provider":A("provider",u);break;case"model":A("model",m);break;case"tool":A("tool",b);break;case"has":["errors","tools","context","usage","model","provider"].forEach($=>{(!g||$.includes(g))&&x.push({label:`has:${$}`,value:`has:${$}`})});break}return x},nb=(e,t)=>{const n=e.trim();if(!n)return`${t} `;const s=n.split(/\s+/);return s[s.length-1]=t,`${s.join(" ")} `},dt=e=>e.trim().toLowerCase(),sb=(e,t)=>{const n=e.trim();if(!n)return`${t} `;const s=n.split(/\s+/),a=s[s.length-1]??"",i=t.includes(":")?t.split(":")[0]:null,r=a.includes(":")?a.split(":")[0]:null;return a.endsWith(":")&&i&&r===i?(s[s.length-1]=t,`${s.join(" ")} `):s.includes(t)?`${s.join(" ")} `:`${s.join(" ")} ${t} `},er=(e,t)=>{const s=e.trim().split(/\s+/).filter(Boolean).filter(a=>a!==t);return s.length?`${s.join(" ")} `:""},tr=(e,t,n)=>{const s=dt(t),i=[...lo(e).filter(r=>dt(r.key??"")!==s).map(r=>r.raw),...n.map(r=>`${t}:${r}`)];return i.length?`${i.join(" ")} `:""};function pe(e,t){return t===0?0:e/t*100}function ab(e){const t=e.totalCost||0;return{input:{tokens:e.input,cost:e.inputCost||0,pct:pe(e.inputCost||0,t)},output:{tokens:e.output,cost:e.outputCost||0,pct:pe(e.outputCost||0,t)},cacheRead:{tokens:e.cacheRead,cost:e.cacheReadCost||0,pct:pe(e.cacheReadCost||0,t)},cacheWrite:{tokens:e.cacheWrite,cost:e.cacheWriteCost||0,pct:pe(e.cacheWriteCost||0,t)},totalCost:t}}function ob(e,t,n,s,a,i,r,c){if(!(e.length>0||t.length>0||n.length>0))return v;const g=n.length===1?s.find(m=>m.key===n[0]):null,h=g?(g.label||g.key).slice(0,20)+((g.label||g.key).length>20?"…":""):n.length===1?n[0].slice(0,8)+"…":`${n.length} ${o("usageSessionsCount")}`,p=g?g.label||g.key:n.length===1?n[0]:n.join(", "),f=e.length===1?e[0]:`${e.length} days`,u=t.length===1?`${t[0]}:00`:`${t.length} hours`;return l`
    <div class="active-filters">
      ${e.length>0?l`
            <div class="filter-chip">
              <span class="filter-chip-label">${o("usageDays")}: ${f}</span>
              <button class="filter-chip-remove" @click=${a} title=${o("usageRemoveFilter")}>×</button>
            </div>
          `:v}
      ${t.length>0?l`
            <div class="filter-chip">
              <span class="filter-chip-label">${o("usageHoursLabel")}: ${u}</span>
              <button class="filter-chip-remove" @click=${i} title=${o("usageRemoveFilter")}>×</button>
            </div>
          `:v}
      ${n.length>0?l`
            <div class="filter-chip" title="${p}">
              <span class="filter-chip-label">${o("usageSession")}: ${h}</span>
              <button class="filter-chip-remove" @click=${r} title=${o("usageRemoveFilter")}>×</button>
            </div>
          `:v}
      ${(e.length>0||t.length>0)&&n.length>0?l`
            <button class="btn btn-sm filter-clear-btn" @click=${c}>
              ${o("usageClearFilters")}
            </button>
          `:v}
    </div>
  `}function ib(e,t,n,s,a,i){if(!e.length)return l`
      <div class="daily-chart-compact">
        <div class="sessions-panel-title">${o("usageDailyUsage")}</div>
        <div class="muted" style="padding: 20px; text-align: center">${o("usageNoData")}</div>
      </div>
    `;const r=n==="tokens",c=e.map(p=>r?p.totalTokens:p.totalCost),d=Math.max(...c,r?1:1e-4),g=e.length>30?12:e.length>20?18:e.length>14?24:32,h=e.length<=14;return l`
    <div class="daily-chart-compact">
      <div class="daily-chart-header">
        <div class="chart-toggle small sessions-toggle">
          <button
            class="toggle-btn ${s==="total"?"active":""}"
            @click=${()=>a("total")}
          >
            ${o("usageTotal")}
          </button>
          <button
            class="toggle-btn ${s==="by-type"?"active":""}"
            @click=${()=>a("by-type")}
          >
            ${o("usageByType")}
          </button>
        </div>
        <div class="card-title">${o(r?"usageDailyToken":"usageDailyCost")}</div>
      </div>
      <div class="daily-chart">
        <div class="daily-chart-bars" style="--bar-max-width: ${g}px">
          ${e.map((p,f)=>{const m=c[f]/d*100,b=t.includes(p.date),x=Kl(p.date),A=e.length>20?String(parseInt(p.date.slice(8),10)):x,$=e.length>20?"font-size: 8px":"",T=s==="by-type"?r?[{value:p.output,class:"output"},{value:p.input,class:"input"},{value:p.cacheWrite,class:"cache-write"},{value:p.cacheRead,class:"cache-read"}]:[{value:p.outputCost??0,class:"output"},{value:p.inputCost??0,class:"input"},{value:p.cacheWriteCost??0,class:"cache-write"},{value:p.cacheReadCost??0,class:"cache-read"}]:[],C=s==="by-type"?r?[`Output ${U(p.output)}`,`Input ${U(p.input)}`,`Cache write ${U(p.cacheWrite)}`,`Cache read ${U(p.cacheRead)}`]:[`Output ${G(p.outputCost??0)}`,`Input ${G(p.inputCost??0)}`,`Cache write ${G(p.cacheWriteCost??0)}`,`Cache read ${G(p.cacheReadCost??0)}`]:[],_=r?U(p.totalTokens):G(p.totalCost);return l`
              <div
                class="daily-bar-wrapper ${b?"selected":""}"
                @click=${M=>i(p.date,M.shiftKey)}
              >
                ${s==="by-type"?l`
                        <div
                          class="daily-bar"
                          style="height: ${m.toFixed(1)}%; display: flex; flex-direction: column;"
                        >
                          ${(()=>{const M=T.reduce((D,z)=>D+z.value,0)||1;return T.map(D=>l`
                                <div
                                  class="cost-segment ${D.class}"
                                  style="height: ${D.value/M*100}%"
                                ></div>
                              `)})()}
                        </div>
                      `:l`
                        <div class="daily-bar" style="height: ${m.toFixed(1)}%"></div>
                      `}
                ${h?l`<div class="daily-bar-total">${_}</div>`:v}
                <div class="daily-bar-label" style="${$}">${A}</div>
                <div class="daily-bar-tooltip">
                  <strong>${Qv(p.date)}</strong><br />
                  ${U(p.totalTokens)} ${o("usageTokensUnit")}<br />
                  ${G(p.totalCost)}
                  ${C.length?l`${C.map(M=>l`<div>${M}</div>`)}`:v}
                </div>
              </div>
            `})}
        </div>
      </div>
    </div>
  `}function rb(e,t){const n=ab(e),s=t==="tokens",a=e.totalTokens||1,i={output:pe(e.output,a),input:pe(e.input,a),cacheWrite:pe(e.cacheWrite,a),cacheRead:pe(e.cacheRead,a)};return l`
    <div class="cost-breakdown cost-breakdown-compact">
      <div class="cost-breakdown-header">${o(s?"usageTokensByType":"usageCostByType")}</div>
      <div class="cost-breakdown-bar">
        <div class="cost-segment output" style="width: ${(s?i.output:n.output.pct).toFixed(1)}%"
          title="Output: ${s?U(e.output):G(n.output.cost)}"></div>
        <div class="cost-segment input" style="width: ${(s?i.input:n.input.pct).toFixed(1)}%"
          title="Input: ${s?U(e.input):G(n.input.cost)}"></div>
        <div class="cost-segment cache-write" style="width: ${(s?i.cacheWrite:n.cacheWrite.pct).toFixed(1)}%"
          title="Cache Write: ${s?U(e.cacheWrite):G(n.cacheWrite.cost)}"></div>
        <div class="cost-segment cache-read" style="width: ${(s?i.cacheRead:n.cacheRead.pct).toFixed(1)}%"
          title="Cache Read: ${s?U(e.cacheRead):G(n.cacheRead.cost)}"></div>
      </div>
      <div class="cost-breakdown-legend">
        <span class="legend-item"><span class="legend-dot output"></span>${o("usageOutput")} ${s?U(e.output):G(n.output.cost)}</span>
        <span class="legend-item"><span class="legend-dot input"></span>${o("usageInput")} ${s?U(e.input):G(n.input.cost)}</span>
        <span class="legend-item"><span class="legend-dot cache-write"></span>${o("usageCacheWrite")} ${s?U(e.cacheWrite):G(n.cacheWrite.cost)}</span>
        <span class="legend-item"><span class="legend-dot cache-read"></span>${o("usageCacheRead")} ${s?U(e.cacheRead):G(n.cacheRead.cost)}</span>
      </div>
      <div class="cost-breakdown-total">
        ${o("usageTotalLabel")}: ${s?U(e.totalTokens):G(e.totalCost)}
      </div>
    </div>
  `}function ut(e,t,n){return l`
    <div class="usage-insight-card">
      <div class="usage-insight-title">${e}</div>
      ${t.length===0?l`<div class="muted">${n}</div>`:l`
              <div class="usage-list">
                ${t.map(s=>l`
                    <div class="usage-list-item">
                      <span>${s.label}</span>
                      <span class="usage-list-value">
                        <span>${s.value}</span>
                        ${s.sub?l`<span class="usage-list-sub">${s.sub}</span>`:v}
                      </span>
                    </div>
                  `)}
              </div>
            `}
    </div>
  `}function nr(e,t,n){return l`
    <div class="usage-insight-card">
      <div class="usage-insight-title">${e}</div>
      ${t.length===0?l`<div class="muted">${n}</div>`:l`
              <div class="usage-error-list">
                ${t.map(s=>l`
                    <div class="usage-error-row">
                      <div class="usage-error-date">${s.label}</div>
                      <div class="usage-error-rate">${s.value}</div>
                      ${s.sub?l`<div class="usage-error-sub">${s.sub}</div>`:v}
                    </div>
                  `)}
              </div>
            `}
    </div>
  `}function lb(e,t,n,s,a,i,r){if(!e)return v;const c=t.messages.total?Math.round(e.totalTokens/t.messages.total):0,d=t.messages.total?e.totalCost/t.messages.total:0,g=e.input+e.cacheRead,h=g>0?e.cacheRead/g:0,p=g>0?`${(h*100).toFixed(1)}%`:"—",f=n.errorRate*100,u=n.throughputTokensPerMin!==void 0?`${U(Math.round(n.throughputTokensPerMin))} tok/min`:"—",m=n.throughputCostPerMin!==void 0?`${G(n.throughputCostPerMin,4)} / min`:"—",b=n.durationCount>0?Vv(n.avgDurationMs):"—",x=o("usageCacheHitRateHint"),A=o("usageErrorRateHint"),$=o("usageThroughputHint"),T=o("usageTokensHint"),C=o(s?"usageCostHintMissing":"usageCostHint"),_=t.daily.filter(F=>F.messages>0&&F.errors>0).map(F=>{const W=F.errors/F.messages;return{label:Kl(F.date),value:`${(W*100).toFixed(2)}%`,sub:`${F.errors} ${o("usageErrors").toLowerCase()} · ${F.messages} ${o("usageMessagesCount")} · ${U(F.tokens)}`,rate:W}}).toSorted((F,W)=>W.rate-F.rate).slice(0,5).map(({rate:F,...W})=>W),M=t.byModel.slice(0,5).map(F=>({label:F.model??"unknown",value:G(F.totals.totalCost),sub:`${U(F.totals.totalTokens)} · ${F.count} ${o("usageMessagesCount")}`})),D=t.byProvider.slice(0,5).map(F=>({label:F.provider??"unknown",value:G(F.totals.totalCost),sub:`${U(F.totals.totalTokens)} · ${F.count} ${o("usageMessagesCount")}`})),z=t.tools.tools.slice(0,6).map(F=>({label:F.name,value:`${F.count}`,sub:o("usageCalls")})),J=t.byAgent.slice(0,5).map(F=>({label:F.agentId,value:G(F.totals.totalCost),sub:U(F.totals.totalTokens)})),ae=t.byChannel.slice(0,5).map(F=>({label:F.channel,value:G(F.totals.totalCost),sub:U(F.totals.totalTokens)}));return l`
    <section class="card" style="margin-top: 16px;">
      <div class="card-title">${o("usageOverview")}</div>
      <div class="usage-summary-grid">
        <div class="usage-summary-card">
          <div class="usage-summary-title">
            ${o("usageMessages")}
            <span class="usage-summary-hint" title=${o("usageMessagesHint")}>?</span>
          </div>
          <div class="usage-summary-value">${t.messages.total}</div>
          <div class="usage-summary-sub">
            ${t.messages.user} ${o("usageUser").toLowerCase()} · ${t.messages.assistant} ${o("usageAssistant").toLowerCase()}
          </div>
        </div>
        <div class="usage-summary-card">
          <div class="usage-summary-title">
            ${o("usageToolCalls")}
            <span class="usage-summary-hint" title=${o("usageToolCallsHint")}>?</span>
          </div>
          <div class="usage-summary-value">${t.tools.totalCalls}</div>
          <div class="usage-summary-sub">${t.tools.uniqueTools} ${o("usageToolsUsed")}</div>
        </div>
        <div class="usage-summary-card">
          <div class="usage-summary-title">
            ${o("usageErrors")}
            <span class="usage-summary-hint" title=${o("usageErrorsHint")}>?</span>
          </div>
          <div class="usage-summary-value">${t.messages.errors}</div>
          <div class="usage-summary-sub">${t.messages.toolResults} ${o("usageToolResults")}</div>
        </div>
        <div class="usage-summary-card">
          <div class="usage-summary-title">
            ${o("usageAvgTokensMsg")}
            <span class="usage-summary-hint" title=${T}>?</span>
          </div>
          <div class="usage-summary-value">${U(c)}</div>
          <div class="usage-summary-sub">${o("usageAcrossMessages")} ${t.messages.total||0} ${o("usageMessagesCount")}</div>
        </div>
        <div class="usage-summary-card">
          <div class="usage-summary-title">
            ${o("usageAvgCostMsg")}
            <span class="usage-summary-hint" title=${C}>?</span>
          </div>
          <div class="usage-summary-value">${G(d,4)}</div>
          <div class="usage-summary-sub">${G(e.totalCost)} ${o("usageTotalLabel").toLowerCase()}</div>
        </div>
        <div class="usage-summary-card">
          <div class="usage-summary-title">
            ${o("usageSessionsCard")}
            <span class="usage-summary-hint" title=${o("usageSessionsHint")}>?</span>
          </div>
          <div class="usage-summary-value">${i}</div>
          <div class="usage-summary-sub">${o("usageInRange")} ${r}</div>
        </div>
        <div class="usage-summary-card">
          <div class="usage-summary-title">
            ${o("usageThroughput")}
            <span class="usage-summary-hint" title=${$}>?</span>
          </div>
          <div class="usage-summary-value">${u}</div>
          <div class="usage-summary-sub">${m}</div>
        </div>
        <div class="usage-summary-card">
          <div class="usage-summary-title">
            ${o("usageErrorRate")}
            <span class="usage-summary-hint" title=${A}>?</span>
          </div>
          <div class="usage-summary-value ${f>5?"bad":f>1?"warn":"good"}">${f.toFixed(2)}%</div>
          <div class="usage-summary-sub">
            ${t.messages.errors} ${o("usageErrors").toLowerCase()} · ${b} ${o("usageAvg")} ${o("usageSession").toLowerCase()}
          </div>
        </div>
        <div class="usage-summary-card">
          <div class="usage-summary-title">
            ${o("usageCacheHitRate")}
            <span class="usage-summary-hint" title=${x}>?</span>
          </div>
          <div class="usage-summary-value ${h>.6?"good":h>.3?"warn":"bad"}">${p}</div>
          <div class="usage-summary-sub">
            ${U(e.cacheRead)} ${o("usageCached")} · ${U(g)} ${o("usagePrompt")}
          </div>
        </div>
      </div>
      <div class="usage-insights-grid">
        ${ut(o("usageTopModels"),M,o("usageNoModelData"))}
        ${ut(o("usageTopProviders"),D,o("usageNoProviderData"))}
        ${ut(o("usageTopTools"),z,o("usageNoToolCalls"))}
        ${ut(o("usageTopAgents"),J,o("usageNoAgentData"))}
        ${ut(o("usageTopChannels"),ae,o("usageNoChannelData"))}
        ${nr(o("usagePeakErrorDays"),_,o("usageNoErrorData"))}
        ${nr(o("usagePeakErrorHours"),a,o("usageNoErrorData"))}
      </div>
    </section>
  `}function cb(e,t,n,s,a,i,r,c,d,g,h,p,f,u,m){const b=E=>f.includes(E),x=E=>{const B=E.label||E.key;return B.startsWith("agent:")&&B.includes("?token=")?B.slice(0,B.indexOf("?token=")):B},A=async E=>{const B=x(E);try{await navigator.clipboard.writeText(B)}catch{}},$=E=>{const B=[];return b("channel")&&E.channel&&B.push(`channel:${E.channel}`),b("agent")&&E.agentId&&B.push(`agent:${E.agentId}`),b("provider")&&(E.modelProvider||E.providerOverride)&&B.push(`provider:${E.modelProvider??E.providerOverride}`),b("model")&&E.model&&B.push(`model:${E.model}`),b("messages")&&E.usage?.messageCounts&&B.push(`msgs:${E.usage.messageCounts.total}`),b("tools")&&E.usage?.toolUsage&&B.push(`tools:${E.usage.toolUsage.totalCalls}`),b("errors")&&E.usage?.messageCounts&&B.push(`errors:${E.usage.messageCounts.errors}`),b("duration")&&E.usage?.durationMs&&B.push(`dur:${jl(E.usage.durationMs)}`),B},T=E=>{const B=E.usage;if(!B)return 0;if(n.length>0&&B.dailyBreakdown&&B.dailyBreakdown.length>0){const oe=B.dailyBreakdown.filter(ie=>n.includes(ie.date));return s?oe.reduce((ie,X)=>ie+X.tokens,0):oe.reduce((ie,X)=>ie+X.cost,0)}return s?B.totalTokens??0:B.totalCost??0},C=[...e].toSorted((E,B)=>{switch(a){case"recent":return(B.updatedAt??0)-(E.updatedAt??0);case"messages":return(B.usage?.messageCounts?.total??0)-(E.usage?.messageCounts?.total??0);case"errors":return(B.usage?.messageCounts?.errors??0)-(E.usage?.messageCounts?.errors??0);case"cost":return T(B)-T(E);default:return T(B)-T(E)}}),_=i==="asc"?C.toReversed():C,M=_.reduce((E,B)=>E+T(B),0),D=_.length?M/_.length:0,z=_.reduce((E,B)=>E+(B.usage?.messageCounts?.errors??0),0),J=new Set(t),ae=_.filter(E=>J.has(E.key)),F=ae.length,W=new Map(_.map(E=>[E.key,E])),de=r.map(E=>W.get(E)).filter(E=>!!E);return l`
    <div class="card sessions-card">
      <div class="sessions-card-header">
        <div class="card-title">${o("usageSessionsCard")}</div>
        <div class="sessions-card-count">
          ${e.length} ${o("usageShown")}${u!==e.length?` · ${u} ${o("usageTotalSessions")}`:""}
        </div>
      </div>
      <div class="sessions-card-meta">
        <div class="sessions-card-stats">
          <span>${s?U(D):G(D)} ${o("usageAvg")}</span>
          <span>${z} ${o("usageErrors").toLowerCase()}</span>
        </div>
        <div class="chart-toggle small">
          <button
            class="toggle-btn ${c==="all"?"active":""}"
            @click=${()=>p("all")}
          >
            ${o("usageAll")}
          </button>
          <button
            class="toggle-btn ${c==="recent"?"active":""}"
            @click=${()=>p("recent")}
          >
            ${o("usageRecentlyViewed")}
          </button>
        </div>
        <label class="sessions-sort">
          <span>${o("usageSort")}</span>
          <select
            @change=${E=>g(E.target.value)}
          >
            <option value="cost" ?selected=${a==="cost"}>${o("usageCost")}</option>
            <option value="errors" ?selected=${a==="errors"}>${o("usageErrorsCol")}</option>
            <option value="messages" ?selected=${a==="messages"}>${o("usageMessagesCol")}</option>
            <option value="recent" ?selected=${a==="recent"}>${o("usageRecent")}</option>
            <option value="tokens" ?selected=${a==="tokens"}>${o("usageTokensCol")}</option>
          </select>
        </label>
        <button
          class="btn btn-sm sessions-action-btn icon"
          @click=${()=>h(i==="desc"?"asc":"desc")}
          title=${o(i==="desc"?"usageDescending":"usageAscending")}
        >
          ${i==="desc"?"↓":"↑"}
        </button>
        ${F>0?l`
                <button class="btn btn-sm sessions-action-btn sessions-clear-btn" @click=${m}>
                  ${o("usageClearSelection")}
                </button>
              `:v}
      </div>
      ${c==="recent"?de.length===0?l`
                <div class="muted" style="padding: 20px; text-align: center">${o("usageNoRecentSessions")}</div>
              `:l`
                <div class="session-bars" style="max-height: 220px; margin-top: 6px;">
                  ${de.map(E=>{const B=T(E),oe=J.has(E.key),ie=x(E),X=$(E);return l`
                      <div
                        class="session-bar-row ${oe?"selected":""}"
                        @click=${ne=>d(E.key,ne.shiftKey)}
                        title="${E.key}"
                      >
                        <div class="session-bar-label">
                          <div class="session-bar-title">${ie}</div>
                          ${X.length>0?l`<div class="session-bar-meta">${X.join(" · ")}</div>`:v}
                        </div>
                        <div class="session-bar-track" style="display: none;"></div>
                        <div class="session-bar-actions">
                          <button
                            class="session-copy-btn"
                            title=${o("usageCopySessionName")}
                            @click=${ne=>{ne.stopPropagation(),A(E)}}
                          >
                            ${o("usageCopy")}
                          </button>
                          <div class="session-bar-value">${s?U(B):G(B)}</div>
                        </div>
                      </div>
                    `})}
                </div>
              `:e.length===0?l`
                <div class="muted" style="padding: 20px; text-align: center">${o("usageNoSessionsInRange")}</div>
              `:l`
                <div class="session-bars">
                  ${_.slice(0,50).map(E=>{const B=T(E),oe=t.includes(E.key),ie=x(E),X=$(E);return l`
                      <div
                        class="session-bar-row ${oe?"selected":""}"
                        @click=${ne=>d(E.key,ne.shiftKey)}
                        title="${E.key}"
                      >
                        <div class="session-bar-label">
                          <div class="session-bar-title">${ie}</div>
                          ${X.length>0?l`<div class="session-bar-meta">${X.join(" · ")}</div>`:v}
                        </div>
                        <div class="session-bar-track" style="display: none;"></div>
                        <div class="session-bar-actions">
                          <button
                            class="session-copy-btn"
                            title=${o("usageCopySessionName")}
                            @click=${ne=>{ne.stopPropagation(),A(E)}}
                          >
                            ${o("usageCopy")}
                          </button>
                          <div class="session-bar-value">${s?U(B):G(B)}</div>
                        </div>
                      </div>
                    `})}
                  ${e.length>50?l`<div class="muted" style="padding: 8px; text-align: center; font-size: 11px;">+${e.length-50} ${o("usageMoreSessions")}</div>`:v}
                </div>
              `}
      ${F>1?l`
              <div style="margin-top: 10px;">
                <div class="sessions-card-count">${o("usageSelectedCount")} (${F})</div>
                <div class="session-bars" style="max-height: 160px; margin-top: 6px;">
                  ${ae.map(E=>{const B=T(E),oe=x(E),ie=$(E);return l`
                      <div
                        class="session-bar-row selected"
                        @click=${X=>d(E.key,X.shiftKey)}
                        title="${E.key}"
                      >
                        <div class="session-bar-label">
                          <div class="session-bar-title">${oe}</div>
                          ${ie.length>0?l`<div class="session-bar-meta">${ie.join(" · ")}</div>`:v}
                        </div>
                  <div class="session-bar-track" style="display: none;"></div>
                        <div class="session-bar-actions">
                          <button
                            class="session-copy-btn"
                            title=${o("usageCopySessionName")}
                            @click=${X=>{X.stopPropagation(),A(E)}}
                          >
                            ${o("usageCopy")}
                          </button>
                          <div class="session-bar-value">${s?U(B):G(B)}</div>
                        </div>
                      </div>
                    `})}
                </div>
              </div>
            `:v}
    </div>
  `}function db(){return v}function ub(e){const t=e.usage;if(!t)return l`
      <div class="muted">No usage data for this session.</div>
    `;const n=r=>r?new Date(r).toLocaleString():"—",s=[];e.channel&&s.push(`channel:${e.channel}`),e.agentId&&s.push(`agent:${e.agentId}`),(e.modelProvider||e.providerOverride)&&s.push(`provider:${e.modelProvider??e.providerOverride}`),e.model&&s.push(`model:${e.model}`);const a=t.toolUsage?.tools.slice(0,6).map(r=>({label:r.name,value:`${r.count}`,sub:o("usageCalls")}))??[],i=t.modelUsage?.slice(0,6).map(r=>({label:r.model??"unknown",value:G(r.totals.totalCost),sub:U(r.totals.totalTokens)}))??[];return l`
    ${s.length>0?l`<div class="usage-badges">${s.map(r=>l`<span class="usage-badge">${r}</span>`)}</div>`:v}
    <div class="session-summary-grid">
      <div class="session-summary-card">
        <div class="session-summary-title">${o("usageMessages")}</div>
        <div class="session-summary-value">${t.messageCounts?.total??0}</div>
        <div class="session-summary-meta">${t.messageCounts?.user??0} ${o("usageUser").toLowerCase()} · ${t.messageCounts?.assistant??0} ${o("usageAssistant").toLowerCase()}</div>
      </div>
      <div class="session-summary-card">
        <div class="session-summary-title">${o("usageToolCalls")}</div>
        <div class="session-summary-value">${t.toolUsage?.totalCalls??0}</div>
        <div class="session-summary-meta">${t.toolUsage?.uniqueTools??0} ${o("usageToolsLabel").toLowerCase()}</div>
      </div>
      <div class="session-summary-card">
        <div class="session-summary-title">${o("usageErrors")}</div>
        <div class="session-summary-value">${t.messageCounts?.errors??0}</div>
        <div class="session-summary-meta">${t.messageCounts?.toolResults??0} ${o("usageToolResults")}</div>
      </div>
      <div class="session-summary-card">
        <div class="session-summary-title">${o("usageDuration")}</div>
        <div class="session-summary-value">${jl(t.durationMs)}</div>
        <div class="session-summary-meta">${n(t.firstActivity)} → ${n(t.lastActivity)}</div>
      </div>
    </div>
    <div class="usage-insights-grid" style="margin-top: 12px;">
      ${ut(o("usageTopTools"),a,o("usageNoToolCalls"))}
      ${ut(o("usageModelMix"),i,o("usageNoModelData"))}
    </div>
  `}function gb(e,t,n,s,a,i,r,c,d,g,h,p,f,u,m,b,x,A,$,T,C,_,M){const D=e.label||e.key,z=D.length>50?D.slice(0,50)+"…":D,J=e.usage;return l`
    <div class="card session-detail-panel">
      <div class="session-detail-header">
        <div class="session-detail-header-left">
          <div class="session-detail-title">${z}</div>
        </div>
        <div class="session-detail-stats">
          ${J?l`
            <span><strong>${U(J.totalTokens)}</strong> ${o("usageTokensUnit")}</span>
            <span><strong>${G(J.totalCost)}</strong></span>
          `:v}
        </div>
        <button class="session-close-btn" @click=${M} title=${o("usageCloseSessionDetails")}>×</button>
      </div>
      <div class="session-detail-content">
        ${ub(e)}
        <div class="session-detail-row">
          ${pb(t,n,s,a,i,r,c,d,g)}
        </div>
        <div class="session-detail-bottom">
          ${hb(h,p,f,u,m,b,x,A,$,T)}
          ${mb(e.contextWeight,J,C,_)}
        </div>
      </div>
    </div>
  `}function pb(e,t,n,s,a,i,r,c,d){if(t)return l`
      <div class="session-timeseries-compact">
        <div class="muted" style="padding: 20px; text-align: center">${o("usageLoading")}</div>
      </div>
    `;if(!e||e.points.length<2)return l`
      <div class="session-timeseries-compact">
        <div class="muted" style="padding: 20px; text-align: center">${o("usageNoTimelineData")}</div>
      </div>
    `;let g=e.points;if(r||c||d&&d.length>0){const W=r?new Date(r+"T00:00:00").getTime():0,de=c?new Date(c+"T23:59:59").getTime():1/0;g=e.points.filter(E=>{if(E.timestamp<W||E.timestamp>de)return!1;if(d&&d.length>0){const B=new Date(E.timestamp),oe=`${B.getFullYear()}-${String(B.getMonth()+1).padStart(2,"0")}-${String(B.getDate()).padStart(2,"0")}`;return d.includes(oe)}return!0})}if(g.length<2)return l`
      <div class="session-timeseries-compact">
        <div class="muted" style="padding: 20px; text-align: center">${o("usageNoDataInRange")}</div>
      </div>
    `;let h=0,p=0,f=0,u=0,m=0,b=0;g=g.map(W=>(h+=W.totalTokens,p+=W.cost,f+=W.output,u+=W.input,m+=W.cacheRead,b+=W.cacheWrite,{...W,cumulativeTokens:h,cumulativeCost:p}));const x=400,A=80,$={top:16,right:10,bottom:20,left:40},T=x-$.left-$.right,C=A-$.top-$.bottom,_=n==="cumulative",M=n==="per-turn"&&a==="by-type",D=f+u+m+b,z=g.map(W=>_?W.cumulativeTokens:M?W.input+W.output+W.cacheRead+W.cacheWrite:W.totalTokens),J=Math.max(...z,1),ae=Math.max(2,Math.min(8,T/g.length*.7)),F=Math.max(1,(T-ae*g.length)/(g.length-1||1));return l`
    <div class="session-timeseries-compact">
      <div class="timeseries-header-row">
        <div class="card-title" style="font-size: 13px;">${o("usageUsageOverTime")}</div>
        <div class="timeseries-controls">
          <div class="chart-toggle small">
            <button
              class="toggle-btn ${_?"":"active"}"
              @click=${()=>s("per-turn")}
            >
              ${o("usagePerTurn")}
            </button>
            <button
              class="toggle-btn ${_?"active":""}"
              @click=${()=>s("cumulative")}
            >
              ${o("usageCumulative")}
            </button>
          </div>
          ${_?v:l`
                  <div class="chart-toggle small">
                    <button
                      class="toggle-btn ${a==="total"?"active":""}"
                      @click=${()=>i("total")}
                    >
                      ${o("usageTotal")}
                    </button>
                    <button
                      class="toggle-btn ${a==="by-type"?"active":""}"
                      @click=${()=>i("by-type")}
                    >
                      ${o("usageByType")}
                    </button>
                  </div>
                `}
        </div>
      </div>
      <svg viewBox="0 0 ${x} ${A+15}" class="timeseries-svg" style="width: 100%; height: auto;">
        <!-- Y axis -->
        <line x1="${$.left}" y1="${$.top}" x2="${$.left}" y2="${$.top+C}" stroke="var(--border)" />
        <!-- X axis -->
        <line x1="${$.left}" y1="${$.top+C}" x2="${x-$.right}" y2="${$.top+C}" stroke="var(--border)" />
        <!-- Y axis labels -->
        <text x="${$.left-4}" y="${$.top+4}" text-anchor="end" class="axis-label" style="font-size: 9px; fill: var(--text-muted)">${U(J)}</text>
        <text x="${$.left-4}" y="${$.top+C}" text-anchor="end" class="axis-label" style="font-size: 9px; fill: var(--text-muted)">0</text>
        <!-- X axis labels (first and last) -->
        ${g.length>0?xn`
          <text x="${$.left}" y="${$.top+C+12}" text-anchor="start" style="font-size: 8px; fill: var(--text-muted)">${new Date(g[0].timestamp).toLocaleDateString(void 0,{month:"short",day:"numeric"})}</text>
          <text x="${x-$.right}" y="${$.top+C+12}" text-anchor="end" style="font-size: 8px; fill: var(--text-muted)">${new Date(g[g.length-1].timestamp).toLocaleDateString(void 0,{month:"short",day:"numeric"})}</text>
        `:v}
        <!-- Bars -->
        ${g.map((W,de)=>{const E=z[de],B=$.left+de*(ae+F),oe=E/J*C,ie=$.top+C-oe,ne=[new Date(W.timestamp).toLocaleDateString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),`${U(E)} ${o("usageTokensUnit")}`];M&&(ne.push(`Output ${U(W.output)}`),ne.push(`Input ${U(W.input)}`),ne.push(`Cache write ${U(W.cacheWrite)}`),ne.push(`Cache read ${U(W.cacheRead)}`));const I=ne.join(" · ");if(!M)return xn`<rect x="${B}" y="${ie}" width="${ae}" height="${oe}" class="ts-bar" rx="1" style="cursor: pointer;"><title>${I}</title></rect>`;const R=[{value:W.output,class:"output"},{value:W.input,class:"input"},{value:W.cacheWrite,class:"cache-write"},{value:W.cacheRead,class:"cache-read"}];let P=$.top+C;return xn`
            ${R.map(K=>{if(K.value<=0||E<=0)return v;const xe=oe*(K.value/E);return P-=xe,xn`<rect x="${B}" y="${P}" width="${ae}" height="${xe}" class="ts-bar ${K.class}" rx="1"><title>${I}</title></rect>`})}
          `})}
      </svg>
      <div class="timeseries-summary">${g.length} ${o("usageMessagesCount")} · ${U(h)} ${o("usageTokensUnit")} · ${G(p)}</div>
      ${M?l`
              <div style="margin-top: 8px;">
                <div class="card-title" style="font-size: 12px; margin-bottom: 6px;">${o("usageTokensByType")}</div>
                <div class="cost-breakdown-bar" style="height: 18px;">
                  <div class="cost-segment output" style="width: ${pe(f,D).toFixed(1)}%"></div>
                  <div class="cost-segment input" style="width: ${pe(u,D).toFixed(1)}%"></div>
                  <div class="cost-segment cache-write" style="width: ${pe(b,D).toFixed(1)}%"></div>
                  <div class="cost-segment cache-read" style="width: ${pe(m,D).toFixed(1)}%"></div>
                </div>
                <div class="cost-breakdown-legend">
                  <div class="legend-item" title="Assistant output tokens">
                    <span class="legend-dot output"></span>Output ${U(f)}
                  </div>
                  <div class="legend-item" title="User + tool input tokens">
                    <span class="legend-dot input"></span>Input ${U(u)}
                  </div>
                  <div class="legend-item" title="Tokens written to cache">
                    <span class="legend-dot cache-write"></span>Cache Write ${U(b)}
                  </div>
                  <div class="legend-item" title="Tokens read from cache">
                    <span class="legend-dot cache-read"></span>Cache Read ${U(m)}
                  </div>
                </div>
                <div class="cost-breakdown-total">${o("usageTotalLabel")}: ${U(D)}</div>
              </div>
            `:v}
    </div>
  `}function mb(e,t,n,s){if(!e)return l`
      <div class="context-details-panel">
        <div class="muted" style="padding: 20px; text-align: center">${o("usageNoContextData")}</div>
      </div>
    `;const a=rt(e.systemPrompt.chars),i=rt(e.skills.promptChars),r=rt(e.tools.listChars+e.tools.schemaChars),c=rt(e.injectedWorkspaceFiles.reduce((T,C)=>T+C.injectedChars,0)),d=a+i+r+c;let g="";if(t&&t.totalTokens>0){const T=t.input+t.cacheRead;T>0&&(g=`~${Math.min(d/T*100,100).toFixed(0)}% of input`)}const h=e.skills.entries.toSorted((T,C)=>C.blockChars-T.blockChars),p=e.tools.entries.toSorted((T,C)=>C.summaryChars+C.schemaChars-(T.summaryChars+T.schemaChars)),f=e.injectedWorkspaceFiles.toSorted((T,C)=>C.injectedChars-T.injectedChars),u=4,m=n,b=m?h:h.slice(0,u),x=m?p:p.slice(0,u),A=m?f:f.slice(0,u),$=h.length>u||p.length>u||f.length>u;return l`
    <div class="context-details-panel">
      <div class="context-breakdown-header">
        <div class="card-title" style="font-size: 13px;">${o("usageSystemPromptBreakdown")}</div>
        ${$?l`<button class="context-expand-btn" @click=${s}>
                ${o(m?"usageCollapseAll":"usageExpandAll")}
              </button>`:v}
      </div>
      <p class="context-weight-desc">${g||o("usageBaseContextPerMessage")}</p>
      <div class="context-stacked-bar">
        <div class="context-segment system" style="width: ${pe(a,d).toFixed(1)}%" title="System: ~${U(a)}"></div>
        <div class="context-segment skills" style="width: ${pe(i,d).toFixed(1)}%" title="Skills: ~${U(i)}"></div>
        <div class="context-segment tools" style="width: ${pe(r,d).toFixed(1)}%" title="Tools: ~${U(r)}"></div>
        <div class="context-segment files" style="width: ${pe(c,d).toFixed(1)}%" title="Files: ~${U(c)}"></div>
      </div>
      <div class="context-legend">
        <span class="legend-item"><span class="legend-dot system"></span>Sys ~${U(a)}</span>
        <span class="legend-item"><span class="legend-dot skills"></span>Skills ~${U(i)}</span>
        <span class="legend-item"><span class="legend-dot tools"></span>Tools ~${U(r)}</span>
        <span class="legend-item"><span class="legend-dot files"></span>Files ~${U(c)}</span>
      </div>
      <div class="context-total">${o("usageTotalLabel")}: ~${U(d)}</div>
      <div class="context-breakdown-grid">
        ${h.length>0?(()=>{const T=h.length-b.length;return l`
                  <div class="context-breakdown-card">
                    <div class="context-breakdown-title">${o("usageSkills")} (${h.length})</div>
                    <div class="context-breakdown-list">
                      ${b.map(C=>l`
                          <div class="context-breakdown-item">
                            <span class="mono">${C.name}</span>
                            <span class="muted">~${U(rt(C.blockChars))}</span>
                          </div>
                        `)}
                    </div>
                    ${T>0?l`<div class="context-breakdown-more">+${T} ${o("usageMoreSessions")}</div>`:v}
                  </div>
                `})():v}
        ${p.length>0?(()=>{const T=p.length-x.length;return l`
                  <div class="context-breakdown-card">
                    <div class="context-breakdown-title">${o("usageToolsLabel")} (${p.length})</div>
                    <div class="context-breakdown-list">
                      ${x.map(C=>l`
                          <div class="context-breakdown-item">
                            <span class="mono">${C.name}</span>
                            <span class="muted">~${U(rt(C.summaryChars+C.schemaChars))}</span>
                          </div>
                        `)}
                    </div>
                    ${T>0?l`<div class="context-breakdown-more">+${T} ${o("usageMoreSessions")}</div>`:v}
                  </div>
                `})():v}
        ${f.length>0?(()=>{const T=f.length-A.length;return l`
                  <div class="context-breakdown-card">
                    <div class="context-breakdown-title">${o("usageFiles")} (${f.length})</div>
                    <div class="context-breakdown-list">
                      ${A.map(C=>l`
                          <div class="context-breakdown-item">
                            <span class="mono">${C.name}</span>
                            <span class="muted">~${U(rt(C.injectedChars))}</span>
                          </div>
                        `)}
                    </div>
                    ${T>0?l`<div class="context-breakdown-more">+${T} ${o("usageMoreSessions")}</div>`:v}
                  </div>
                `})():v}
      </div>
    </div>
  `}function hb(e,t,n,s,a,i,r,c,d,g){if(t)return l`
      <div class="session-logs-compact">
        <div class="session-logs-header">${o("usageConversation")}</div>
        <div class="muted" style="padding: 20px; text-align: center">${o("usageLoading")}</div>
      </div>
    `;if(!e||e.length===0)return l`
      <div class="session-logs-compact">
        <div class="session-logs-header">${o("usageConversation")}</div>
        <div class="muted" style="padding: 20px; text-align: center">${o("usageNoMessages")}</div>
      </div>
    `;const h=a.query.trim().toLowerCase(),p=e.map(A=>{const $=Uv(A.content),T=$.cleanContent||A.content;return{log:A,toolInfo:$,cleanContent:T}}),f=Array.from(new Set(p.flatMap(A=>A.toolInfo.tools.map(([$])=>$)))).toSorted((A,$)=>A.localeCompare($)),u=p.filter(A=>!(a.roles.length>0&&!a.roles.includes(A.log.role)||a.hasTools&&A.toolInfo.tools.length===0||a.tools.length>0&&!A.toolInfo.tools.some(([T])=>a.tools.includes(T))||h&&!A.cleanContent.toLowerCase().includes(h))),m=a.roles.length>0||a.tools.length>0||a.hasTools||h?`${u.length} of ${e.length}`:`${e.length}`,b=new Set(a.roles),x=new Set(a.tools);return l`
    <div class="session-logs-compact">
      <div class="session-logs-header">
        <span>${o("usageConversation")} <span style="font-weight: normal; color: var(--text-muted);">(${m} ${o("usageMessagesCount")})</span></span>
        <button class="btn btn-sm usage-action-btn usage-secondary-btn" @click=${s}>
          ${o(n?"usageCollapseAll":"usageExpandAll")}
        </button>
      </div>
      <div class="usage-filters-inline" style="margin: 10px 12px;">
        <select
          multiple
          size="4"
          @change=${A=>i(Array.from(A.target.selectedOptions).map($=>$.value))}
        >
          <option value="user" ?selected=${b.has("user")}>${o("usageUser")}</option>
          <option value="assistant" ?selected=${b.has("assistant")}>${o("usageAssistant")}</option>
          <option value="tool" ?selected=${b.has("tool")}>${o("usageTool")}</option>
          <option value="toolResult" ?selected=${b.has("toolResult")}>${o("usageToolResult")}</option>
        </select>
        <select
          multiple
          size="4"
          @change=${A=>r(Array.from(A.target.selectedOptions).map($=>$.value))}
        >
          ${f.map(A=>l`<option value=${A} ?selected=${x.has(A)}>${A}</option>`)}
        </select>
        <label class="usage-filters-inline" style="gap: 6px;">
          <input
            type="checkbox"
            .checked=${a.hasTools}
            @change=${A=>c(A.target.checked)}
          />
          ${o("usageHasTools")}
        </label>
        <input
          type="text"
          placeholder=${o("usageSearchConversation")}
          .value=${a.query}
          @input=${A=>d(A.target.value)}
        />
        <button class="btn btn-sm usage-action-btn usage-secondary-btn" @click=${g}>
          ${o("usageClear")}
        </button>
      </div>
      <div class="session-logs-list">
        ${u.map(A=>{const{log:$,toolInfo:T,cleanContent:C}=A,_=$.role==="user"?"user":"assistant",M=$.role==="user"?o("usageUser"):$.role==="assistant"?o("usageAssistant"):o("usageTool");return l`
          <div class="session-log-entry ${_}">
            <div class="session-log-meta">
              <span class="session-log-role">${M}</span>
              <span>${new Date($.timestamp).toLocaleString()}</span>
              ${$.tokens?l`<span>${U($.tokens)}</span>`:v}
            </div>
            <div class="session-log-content">${C}</div>
            ${T.tools.length>0?l`
                    <details class="session-log-tools" ?open=${n}>
                      <summary>${T.summary}</summary>
                      <div class="session-log-tools-list">
                        ${T.tools.map(([D,z])=>l`
                            <span class="session-log-tools-pill">${D} × ${z}</span>
                          `)}
                      </div>
                    </details>
                  `:v}
          </div>
        `})}
        ${u.length===0?l`
                <div class="muted" style="padding: 12px">${o("usageNoMessagesMatchFilters")}</div>
              `:v}
      </div>
    </div>
  `}function fb(e){if(e.loading&&!e.totals)return l`
      <style>
        @keyframes initial-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes initial-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      </style>
      <section class="card">
        <div class="row" style="justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
          <div style="flex: 1; min-width: 250px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 2px;">
              <div class="card-title" style="margin: 0;">${o("usageTokenUsage")}</div>
              <span style="
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                background: rgba(255, 77, 77, 0.1);
                border-radius: 4px;
                font-size: 12px;
                color: #ff4d4d;
              ">
                <span style="
                  width: 10px;
                  height: 10px;
                  border: 2px solid #ff4d4d;
                  border-top-color: transparent;
                  border-radius: 50%;
                  animation: initial-spin 0.6s linear infinite;
                "></span>
                ${o("usageLoading")}
              </span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="date" .value=${e.startDate} disabled style="padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--text); font-size: 13px; opacity: 0.6;" />
              <span style="color: var(--text-muted);">to</span>
              <input type="date" .value=${e.endDate} disabled style="padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--text); font-size: 13px; opacity: 0.6;" />
            </div>
          </div>
        </div>
      </section>
    `;const t=e.chartMode==="tokens",n=e.query.trim().length>0,s=e.queryDraft.trim().length>0,a=[...e.sessions].toSorted((I,R)=>{const P=t?I.usage?.totalTokens??0:I.usage?.totalCost??0;return(t?R.usage?.totalTokens??0:R.usage?.totalCost??0)-P}),i=e.selectedDays.length>0?a.filter(I=>{if(I.usage?.activityDates?.length)return I.usage.activityDates.some(K=>e.selectedDays.includes(K));if(!I.updatedAt)return!1;const R=new Date(I.updatedAt),P=`${R.getFullYear()}-${String(R.getMonth()+1).padStart(2,"0")}-${String(R.getDate()).padStart(2,"0")}`;return e.selectedDays.includes(P)}):a,r=(I,R)=>{if(R.length===0)return!0;const P=I.usage,K=P?.firstActivity??I.updatedAt,xe=P?.lastActivity??I.updatedAt;if(!K||!xe)return!1;const Y=Math.min(K,xe),Ae=Math.max(K,xe);let ee=Y;for(;ee<=Ae;){const me=new Date(ee),Oe=co(me,e.timeZone);if(R.includes(Oe))return!0;const Ue=uo(me,e.timeZone);ee=Math.min(Ue.getTime(),Ae)+1}return!1},c=e.selectedHours.length>0?i.filter(I=>r(I,e.selectedHours)):i,d=Ov(c,e.query),g=d.sessions,h=d.warnings,p=tb(e.queryDraft,a,e.aggregates),f=lo(e.query),u=I=>{const R=dt(I);return f.filter(P=>dt(P.key??"")===R).map(P=>P.value).filter(Boolean)},m=I=>{const R=new Set;for(const P of I)P&&R.add(P);return Array.from(R)},b=m(a.map(I=>I.agentId)).slice(0,12),x=m(a.map(I=>I.channel)).slice(0,12),A=m([...a.map(I=>I.modelProvider),...a.map(I=>I.providerOverride),...e.aggregates?.byProvider.map(I=>I.provider)??[]]).slice(0,12),$=m([...a.map(I=>I.model),...e.aggregates?.byModel.map(I=>I.model)??[]]).slice(0,12),T=m(e.aggregates?.tools.tools.map(I=>I.name)??[]).slice(0,12),C=e.selectedSessions.length===1?e.sessions.find(I=>I.key===e.selectedSessions[0])??g.find(I=>I.key===e.selectedSessions[0]):null,_=I=>I.reduce((R,P)=>(P.usage&&(R.input+=P.usage.input,R.output+=P.usage.output,R.cacheRead+=P.usage.cacheRead,R.cacheWrite+=P.usage.cacheWrite,R.totalTokens+=P.usage.totalTokens,R.totalCost+=P.usage.totalCost,R.inputCost+=P.usage.inputCost??0,R.outputCost+=P.usage.outputCost??0,R.cacheReadCost+=P.usage.cacheReadCost??0,R.cacheWriteCost+=P.usage.cacheWriteCost??0,R.missingCostEntries+=P.usage.missingCostEntries??0),R),{input:0,output:0,cacheRead:0,cacheWrite:0,totalTokens:0,totalCost:0,inputCost:0,outputCost:0,cacheReadCost:0,cacheWriteCost:0,missingCostEntries:0}),M=I=>e.costDaily.filter(P=>I.includes(P.date)).reduce((P,K)=>(P.input+=K.input,P.output+=K.output,P.cacheRead+=K.cacheRead,P.cacheWrite+=K.cacheWrite,P.totalTokens+=K.totalTokens,P.totalCost+=K.totalCost,P.inputCost+=K.inputCost??0,P.outputCost+=K.outputCost??0,P.cacheReadCost+=K.cacheReadCost??0,P.cacheWriteCost+=K.cacheWriteCost??0,P),{input:0,output:0,cacheRead:0,cacheWrite:0,totalTokens:0,totalCost:0,inputCost:0,outputCost:0,cacheReadCost:0,cacheWriteCost:0,missingCostEntries:0});let D,z;const J=a.length;if(e.selectedSessions.length>0){const I=g.filter(R=>e.selectedSessions.includes(R.key));D=_(I),z=I.length}else e.selectedDays.length>0&&e.selectedHours.length===0?(D=M(e.selectedDays),z=g.length):e.selectedHours.length>0||n?(D=_(g),z=g.length):(D=e.totals,z=J);const ae=e.selectedSessions.length>0?g.filter(I=>e.selectedSessions.includes(I.key)):n||e.selectedHours.length>0?g:e.selectedDays.length>0?i:a,F=Jv(ae,e.aggregates),W=e.selectedSessions.length>0?(()=>{const I=g.filter(P=>e.selectedSessions.includes(P.key)),R=new Set;for(const P of I)for(const K of P.usage?.activityDates??[])R.add(K);return R.size>0?e.costDaily.filter(P=>R.has(P.date)):e.costDaily})():e.costDaily,de=Zv(ae,D,F),E=!e.loading&&!e.totals&&e.sessions.length===0,B=(D?.missingCostEntries??0)>0||(D?D.totalTokens>0&&D.totalCost===0&&D.input+D.output+D.cacheRead+D.cacheWrite>0:!1),oe=[{label:o("usageToday"),days:1},{label:o("usage7d"),days:7},{label:o("usage30d"),days:30}],ie=I=>{const R=new Date,P=new Date;P.setDate(P.getDate()-(I-1)),e.onStartDateChange(Ws(P)),e.onEndDateChange(Ws(R))},X=(I,R,P)=>{if(P.length===0)return v;const K=u(I),xe=new Set(K.map(ee=>dt(ee))),Y=P.length>0&&P.every(ee=>xe.has(dt(ee))),Ae=K.length;return l`
      <details
        class="usage-filter-select"
        @toggle=${ee=>{const me=ee.currentTarget;if(!me.open)return;const Oe=Ue=>{Ue.composedPath().includes(me)||(me.open=!1,window.removeEventListener("click",Oe,!0))};window.addEventListener("click",Oe,!0)}}
      >
        <summary>
          <span>${R}</span>
          ${Ae>0?l`<span class="usage-filter-badge">${Ae}</span>`:l`
                  <span class="usage-filter-badge">All</span>
                `}
        </summary>
        <div class="usage-filter-popover">
          <div class="usage-filter-actions">
            <button
              class="btn btn-sm"
              @click=${ee=>{ee.preventDefault(),ee.stopPropagation(),e.onQueryDraftChange(tr(e.queryDraft,I,P))}}
              ?disabled=${Y}
            >
              Select All
            </button>
            <button
              class="btn btn-sm"
              @click=${ee=>{ee.preventDefault(),ee.stopPropagation(),e.onQueryDraftChange(tr(e.queryDraft,I,[]))}}
              ?disabled=${Ae===0}
            >
              Clear
            </button>
          </div>
          <div class="usage-filter-options">
            ${P.map(ee=>{const me=xe.has(dt(ee));return l`
                <label class="usage-filter-option">
                  <input
                    type="checkbox"
                    .checked=${me}
                    @change=${Oe=>{const Ue=Oe.target,tt=`${I}:${ee}`;e.onQueryDraftChange(Ue.checked?sb(e.queryDraft,tt):er(e.queryDraft,tt))}}
                  />
                  <span>${ee}</span>
                </label>
              `})}
          </div>
        </div>
      </details>
    `},ne=Ws(new Date);return l`
    <style>${Bv}</style>

    <section class="usage-page-header">
      <div class="usage-page-title">Usage</div>
      <div class="usage-page-subtitle">${o("usagePageSubtitle")}</div>
    </section>

    <section class="card usage-header ${e.headerPinned?"pinned":""}">
      <div class="usage-header-row">
        <div class="usage-header-title">
          <div class="card-title" style="margin: 0;">Filters</div>
          ${e.loading?l`
                  <span class="usage-refresh-indicator">Loading</span>
                `:v}
          ${E?l`
                  <span class="usage-query-hint">Select a date range and click Refresh to load usage.</span>
                `:v}
        </div>
        <div class="usage-header-metrics">
          ${D?l`
                <span class="usage-metric-badge">
                  <strong>${U(D.totalTokens)}</strong> ${o("usageTokensUnit")}
                </span>
                <span class="usage-metric-badge">
                  <strong>${G(D.totalCost)}</strong> cost
                </span>
                <span class="usage-metric-badge">
                  <strong>${z}</strong>
                  session${z!==1?"s":""}
                </span>
              `:v}
          <button
            class="usage-pin-btn ${e.headerPinned?"active":""}"
            title=${e.headerPinned?"Unpin filters":"Pin filters"}
            @click=${e.onToggleHeaderPinned}
          >
            ${e.headerPinned?"Pinned":"Pin"}
          </button>
          <details
            class="usage-export-menu"
            @toggle=${I=>{const R=I.currentTarget;if(!R.open)return;const P=K=>{K.composedPath().includes(R)||(R.open=!1,window.removeEventListener("click",P,!0))};window.addEventListener("click",P,!0)}}
          >
            <summary class="usage-export-button">${o("usageExport")} ▾</summary>
            <div class="usage-export-popover">
              <div class="usage-export-list">
                <button
                  class="usage-export-item"
                  @click=${()=>Ks(`openclaw-usage-sessions-${ne}.csv`,Xv(g),"text/csv")}
                  ?disabled=${g.length===0}
                >
                  ${o("usageExportSessionsCsv")}
                </button>
                <button
                  class="usage-export-item"
                  @click=${()=>Ks(`openclaw-usage-daily-${ne}.csv`,eb(W),"text/csv")}
                  ?disabled=${W.length===0}
                >
                  ${o("usageExportDailyCsv")}
                </button>
                <button
                  class="usage-export-item"
                  @click=${()=>Ks(`openclaw-usage-${ne}.json`,JSON.stringify({totals:D,sessions:g,daily:W,aggregates:F},null,2),"application/json")}
                  ?disabled=${g.length===0&&W.length===0}
                >
                  JSON
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
      <div class="usage-header-row">
        <div class="usage-controls">
          ${ob(e.selectedDays,e.selectedHours,e.selectedSessions,e.sessions,e.onClearDays,e.onClearHours,e.onClearSessions,e.onClearFilters)}
          <div class="usage-presets">
            ${oe.map(I=>l`
                <button class="btn btn-sm" @click=${()=>ie(I.days)}>
                  ${I.label}
                </button>
              `)}
          </div>
          <input
            type="date"
            .value=${e.startDate}
            title="Start Date"
            @change=${I=>e.onStartDateChange(I.target.value)}
          />
          <span style="color: var(--text-muted);">to</span>
          <input
            type="date"
            .value=${e.endDate}
            title="End Date"
            @change=${I=>e.onEndDateChange(I.target.value)}
          />
          <select
            title="Time zone"
            .value=${e.timeZone}
            @change=${I=>e.onTimeZoneChange(I.target.value)}
          >
            <option value="local">Local</option>
            <option value="utc">UTC</option>
          </select>
          <div class="chart-toggle">
            <button
              class="toggle-btn ${t?"active":""}"
              @click=${()=>e.onChartModeChange("tokens")}
            >
              Tokens
            </button>
            <button
              class="toggle-btn ${t?"":"active"}"
              @click=${()=>e.onChartModeChange("cost")}
            >
              Cost
            </button>
          </div>
          <button
            class="btn btn-sm usage-action-btn usage-primary-btn"
            @click=${e.onRefresh}
            ?disabled=${e.loading}
          >
            Refresh
          </button>
        </div>
        
      </div>

      <div style="margin-top: 12px;">
          <div class="usage-query-bar">
          <input
            class="usage-query-input"
            type="text"
            .value=${e.queryDraft}
            placeholder="Filter sessions (e.g. key:agent:main:cron* model:gpt-4o has:errors minTokens:2000)"
            @input=${I=>e.onQueryDraftChange(I.target.value)}
            @keydown=${I=>{I.key==="Enter"&&(I.preventDefault(),e.onApplyQuery())}}
          />
          <div class="usage-query-actions">
            <button
              class="btn btn-sm usage-action-btn usage-secondary-btn"
              @click=${e.onApplyQuery}
              ?disabled=${e.loading||!s&&!n}
            >
              Filter (client-side)
            </button>
            ${s||n?l`<button class="btn btn-sm usage-action-btn usage-secondary-btn" @click=${e.onClearQuery}>${o("usageClear")}</button>`:v}
            <span class="usage-query-hint">
              ${n?o("usageQueryHintMatch").replace("{count}",String(g.length)).replace("{total}",String(J)):o("usageQueryHintInRange").replace("{total}",String(J))}
            </span>
          </div>
        </div>
        <div class="usage-filter-row">
          ${X("agent","Agent",b)}
          ${X("channel","Channel",x)}
          ${X("provider","Provider",A)}
          ${X("model","Model",$)}
          ${X("tool","Tool",T)}
          <span class="usage-query-hint">
            Tip: use filters or click bars to filter days.
          </span>
        </div>
        ${f.length>0?l`
                <div class="usage-query-chips">
                  ${f.map(I=>{const R=I.raw;return l`
                      <span class="usage-query-chip">
                        ${R}
                        <button
                          title="Remove filter"
                          @click=${()=>e.onQueryDraftChange(er(e.queryDraft,R))}
                        >
                          ×
                        </button>
                      </span>
                    `})}
                </div>
              `:v}
        ${p.length>0?l`
                <div class="usage-query-suggestions">
                  ${p.map(I=>l`
                      <button
                        class="usage-query-suggestion"
                        @click=${()=>e.onQueryDraftChange(nb(e.queryDraft,I.value))}
                      >
                        ${I.label}
                      </button>
                    `)}
                </div>
              `:v}
        ${h.length>0?l`
                <div class="callout warning" style="margin-top: 8px;">
                  ${h.join(" · ")}
                </div>
              `:v}
      </div>

      ${e.error?l`<div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:v}

      ${e.sessionsLimitReached?l`
              <div class="callout warning" style="margin-top: 12px">
                Showing first 1,000 sessions. Narrow date range for complete results.
              </div>
            `:v}
    </section>

    ${lb(D,F,de,B,Wv(ae,e.timeZone),z,J)}

    ${Gv(ae,e.timeZone,e.selectedHours,e.onSelectHour)}

    <!-- Two-column layout: Daily+Breakdown on left, Sessions on right -->
    <div class="usage-grid">
      <div class="usage-grid-left">
        <div class="card usage-left-card">
          ${ib(W,e.selectedDays,e.chartMode,e.dailyChartMode,e.onDailyChartModeChange,e.onSelectDay)}
          ${D?rb(D,e.chartMode):v}
        </div>
      </div>
      <div class="usage-grid-right">
        ${cb(g,e.selectedSessions,e.selectedDays,t,e.sessionSort,e.sessionSortDir,e.recentSessions,e.sessionsTab,e.onSelectSession,e.onSessionSortChange,e.onSessionSortDirChange,e.onSessionsTabChange,e.visibleColumns,J,e.onClearSessions)}
      </div>
    </div>

    <!-- Session Detail Panel (when selected) or Empty State -->
    ${C?gb(C,e.timeSeries,e.timeSeriesLoading,e.timeSeriesMode,e.onTimeSeriesModeChange,e.timeSeriesBreakdownMode,e.onTimeSeriesBreakdownChange,e.startDate,e.endDate,e.selectedDays,e.sessionLogs,e.sessionLogsLoading,e.sessionLogsExpanded,e.onToggleSessionLogsExpanded,{roles:e.logFilterRoles,tools:e.logFilterTools,hasTools:e.logFilterHasTools,query:e.logFilterQuery},e.onLogFilterRolesChange,e.onLogFilterToolsChange,e.onLogFilterHasToolsChange,e.onLogFilterQueryChange,e.onLogFilterClear,e.contextExpanded,e.onToggleContextExpanded,e.onClearSessions):db()}
  `}let js=null;const sr=e=>{js&&clearTimeout(js),js=window.setTimeout(()=>{dl(e)},400)},vb=/^data:/i,bb=/^https?:\/\//i;function yb(e){const t=e.agentsList?.agents??[],s=br(e.sessionKey)?.agentId??e.agentsList?.defaultId??"main",i=t.find(c=>c.id===s)?.identity,r=i?.avatarUrl??i?.avatar;if(r)return vb.test(r)||bb.test(r)?r:i?.avatarUrl}function wb(e){const t=e.presenceEntries.length,n=e.sessionsResult?.count??null,s=e.cronStatus?.nextWakeAtMs??null,a=e.connected?null:"Disconnected from gateway.",i=e.tab==="chat",r=i&&(e.settings.chatFocusMode||e.onboarding),c=e.onboarding?!1:e.settings.chatShowThinking,d=yb(e),g=e.chatAvatarUrl??d??null,h=e.configForm??e.configSnapshot?.config,p=gn(e.basePath??""),f=e.agentsSelectedId??e.agentsList?.defaultId??e.agentsList?.agents?.[0]?.id??null;return l`
    <div class="shell ${i?"shell--chat":""} ${r?"shell--chat-focus":""} ${e.settings.navCollapsed?"shell--nav-collapsed":""} ${e.onboarding?"shell--onboarding":""}">
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="nav-collapse-toggle"
            @click=${()=>e.applySettings({...e.settings,navCollapsed:!e.settings.navCollapsed})}
            title="${e.settings.navCollapsed?"Expand sidebar":"Collapse sidebar"}"
            aria-label="${e.settings.navCollapsed?"Expand sidebar":"Collapse sidebar"}"
          >
            <span class="nav-collapse-toggle__icon">${ce.menu}</span>
          </button>
          <div class="brand">
            <div class="brand-logo">
              <img src=${p?`${p}/favicon.svg`:"/favicon.svg"} alt="OpenClaw" />
            </div>
            <div class="brand-text">
              <div class="brand-title">OPENOCTA</div>
              <div class="brand-sub">Gateway Dashboard</div>
            </div>
          </div>
        </div>
        <div class="topbar-status">
          <div class="pill">
            <span class="statusDot ${e.connected?"ok":""}"></span>
            <span>Health</span>
            <span class="mono">${e.connected?"OK":"Offline"}</span>
          </div>
          ${Dg(e)}
        </div>
      </header>
      <aside class="nav ${e.settings.navCollapsed?"nav--collapsed":""}">
        ${ru().map(u=>{const m=e.settings.navGroupsCollapsed[u.label]??!1,b=u.tabs.some(x=>x===e.tab);return l`
            <div class="nav-group ${m&&!b?"nav-group--collapsed":""}">
              <button
                class="nav-label"
                @click=${()=>{const x={...e.settings.navGroupsCollapsed};x[u.label]=!m,e.applySettings({...e.settings,navGroupsCollapsed:x})}}
                aria-expanded=${!m}
              >
                <span class="nav-label__text">${u.label}</span>
                <span class="nav-label__chevron">${m?"+":"−"}</span>
              </button>
              <div class="nav-group__items">
                ${u.tabs.map(x=>_g(e,x))}
              </div>
            </div>
          `})}
        <div class="nav-group nav-group--links">
          <div class="nav-label nav-label--static">
            <span class="nav-label__text">Resources</span>
          </div>
          <div class="nav-group__items">
            <a
              class="nav-item nav-item--external"
              href="https://docs.openclaw.ai"
              target="_blank"
              rel="noreferrer"
              title="Docs (opens in new tab)"
            >
              <span class="nav-item__icon" aria-hidden="true">${ce.book}</span>
              <span class="nav-item__text">Docs</span>
            </a>
          </div>
        </div>
      </aside>
      <main class="content ${i?"content--chat":""} ${e.tab==="agentSwarm"?"content--agent-swarm":""}">
        <section class="content-header">
          <div>
            ${e.tab==="usage"?v:l`<div class="page-title">${ta(e.tab)}</div>`}
            ${e.tab==="usage"?v:l`<div class="page-sub">${du(e.tab)}</div>`}
          </div>
          <div class="page-meta">
            ${e.lastError?l`<div class="pill danger">${e.lastError}</div>`:v}
            ${i?Mg(e):v}
          </div>
        </section>

        ${e.tab==="overview"?yv({connected:e.connected,hello:e.hello,settings:e.settings,password:e.password,lastError:e.lastError,presenceCount:t,sessionsCount:n,cronEnabled:e.cronStatus?.enabled??null,cronNext:s,lastChannelsRefresh:e.channelsLastSuccess,onSettingsChange:u=>e.applySettings(u),onPasswordChange:u=>e.password=u,onSessionKeyChange:u=>{e.sessionKey=u,e.chatMessage="",e.resetToolStream(),e.applySettings({...e.settings,sessionKey:u,lastActiveSessionKey:u}),e.loadAssistantIdentity()},onConnect:()=>e.connect(),onRefresh:()=>e.loadOverview()}):v}

        ${e.tab==="channels"?lm({connected:e.connected,loading:e.channelsLoading,snapshot:e.channelsSnapshot,lastError:e.channelsError,lastSuccessAt:e.channelsLastSuccess,whatsappMessage:e.whatsappLoginMessage,whatsappQrDataUrl:e.whatsappLoginQrDataUrl,whatsappConnected:e.whatsappLoginConnected,whatsappBusy:e.whatsappBusy,configSchema:e.configSchema,configSchemaLoading:e.configSchemaLoading,configForm:e.configForm,configUiHints:e.configUiHints,configSaving:e.configSaving,configFormDirty:e.configFormDirty,nostrProfileFormState:e.nostrProfileFormState,nostrProfileAccountId:e.nostrProfileAccountId,onRefresh:u=>we(e,u),onWhatsAppStart:u=>e.handleWhatsAppStart(u),onWhatsAppWait:()=>e.handleWhatsAppWait(),onWhatsAppLogout:()=>e.handleWhatsAppLogout(),onConfigPatch:(u,m)=>$e(e,u,m),onConfigSave:()=>e.handleChannelConfigSave(),onConfigReload:()=>e.handleChannelConfigReload(),onNostrProfileEdit:(u,m)=>e.handleNostrProfileEdit(u,m),onNostrProfileCancel:()=>e.handleNostrProfileCancel(),onNostrProfileFieldChange:(u,m)=>e.handleNostrProfileFieldChange(u,m),onNostrProfileSave:()=>e.handleNostrProfileSave(),onNostrProfileImport:()=>e.handleNostrProfileImport(),onNostrProfileToggleAdvanced:()=>e.handleNostrProfileToggleAdvanced()}):v}

        ${e.tab==="instances"?Wf({loading:e.presenceLoading,entries:e.presenceEntries,lastError:e.presenceError,statusMessage:e.presenceStatus,onRefresh:()=>Wa(e)}):v}

        ${e.tab==="sessions"?Tv({loading:e.sessionsLoading,result:e.sessionsResult,error:e.sessionsError,activeMinutes:e.sessionsFilterActive,limit:e.sessionsFilterLimit,includeGlobal:e.sessionsIncludeGlobal,includeUnknown:e.sessionsIncludeUnknown,basePath:e.basePath,onFiltersChange:u=>{e.sessionsFilterActive=u.activeMinutes,e.sessionsFilterLimit=u.limit,e.sessionsIncludeGlobal=u.includeGlobal,e.sessionsIncludeUnknown=u.includeUnknown},onRefresh:()=>xt(e),onPatch:(u,m)=>tu(e,u,m),onDelete:u=>nu(e,u)}):v}

        ${e.tab==="usage"?fb({loading:e.usageLoading,error:e.usageError,startDate:e.usageStartDate,endDate:e.usageEndDate,sessions:e.usageResult?.sessions??[],sessionsLimitReached:(e.usageResult?.sessions?.length??0)>=1e3,totals:e.usageResult?.totals??null,aggregates:e.usageResult?.aggregates??null,costDaily:e.usageCostSummary?.daily??[],selectedSessions:e.usageSelectedSessions,selectedDays:e.usageSelectedDays,selectedHours:e.usageSelectedHours,chartMode:e.usageChartMode,dailyChartMode:e.usageDailyChartMode,timeSeriesMode:e.usageTimeSeriesMode,timeSeriesBreakdownMode:e.usageTimeSeriesBreakdownMode,timeSeries:e.usageTimeSeries,timeSeriesLoading:e.usageTimeSeriesLoading,sessionLogs:e.usageSessionLogs,sessionLogsLoading:e.usageSessionLogsLoading,sessionLogsExpanded:e.usageSessionLogsExpanded,logFilterRoles:e.usageLogFilterRoles,logFilterTools:e.usageLogFilterTools,logFilterHasTools:e.usageLogFilterHasTools,logFilterQuery:e.usageLogFilterQuery,query:e.usageQuery,queryDraft:e.usageQueryDraft,sessionSort:e.usageSessionSort,sessionSortDir:e.usageSessionSortDir,recentSessions:e.usageRecentSessions,sessionsTab:e.usageSessionsTab,visibleColumns:e.usageVisibleColumns,timeZone:e.usageTimeZone,contextExpanded:e.usageContextExpanded,headerPinned:e.usageHeaderPinned,onStartDateChange:u=>{e.usageStartDate=u,e.usageSelectedDays=[],e.usageSelectedHours=[],e.usageSelectedSessions=[],sr(e)},onEndDateChange:u=>{e.usageEndDate=u,e.usageSelectedDays=[],e.usageSelectedHours=[],e.usageSelectedSessions=[],sr(e)},onRefresh:()=>dl(e),onTimeZoneChange:u=>{e.usageTimeZone=u},onToggleContextExpanded:()=>{e.usageContextExpanded=!e.usageContextExpanded},onToggleSessionLogsExpanded:()=>{e.usageSessionLogsExpanded=!e.usageSessionLogsExpanded},onLogFilterRolesChange:u=>{e.usageLogFilterRoles=u},onLogFilterToolsChange:u=>{e.usageLogFilterTools=u},onLogFilterHasToolsChange:u=>{e.usageLogFilterHasTools=u},onLogFilterQueryChange:u=>{e.usageLogFilterQuery=u},onLogFilterClear:()=>{e.usageLogFilterRoles=[],e.usageLogFilterTools=[],e.usageLogFilterHasTools=!1,e.usageLogFilterQuery=""},onToggleHeaderPinned:()=>{e.usageHeaderPinned=!e.usageHeaderPinned},onSelectHour:(u,m)=>{if(m&&e.usageSelectedHours.length>0){const b=Array.from({length:24},(T,C)=>C),x=e.usageSelectedHours[e.usageSelectedHours.length-1],A=b.indexOf(x),$=b.indexOf(u);if(A!==-1&&$!==-1){const[T,C]=A<$?[A,$]:[$,A],_=b.slice(T,C+1);e.usageSelectedHours=[...new Set([...e.usageSelectedHours,..._])]}}else e.usageSelectedHours.includes(u)?e.usageSelectedHours=e.usageSelectedHours.filter(b=>b!==u):e.usageSelectedHours=[...e.usageSelectedHours,u]},onQueryDraftChange:u=>{e.usageQueryDraft=u,e.usageQueryDebounceTimer&&window.clearTimeout(e.usageQueryDebounceTimer),e.usageQueryDebounceTimer=window.setTimeout(()=>{e.usageQuery=e.usageQueryDraft,e.usageQueryDebounceTimer=null},250)},onApplyQuery:()=>{e.usageQueryDebounceTimer&&(window.clearTimeout(e.usageQueryDebounceTimer),e.usageQueryDebounceTimer=null),e.usageQuery=e.usageQueryDraft},onClearQuery:()=>{e.usageQueryDebounceTimer&&(window.clearTimeout(e.usageQueryDebounceTimer),e.usageQueryDebounceTimer=null),e.usageQueryDraft="",e.usageQuery=""},onSessionSortChange:u=>{e.usageSessionSort=u},onSessionSortDirChange:u=>{e.usageSessionSortDir=u},onSessionsTabChange:u=>{e.usageSessionsTab=u},onToggleColumn:u=>{e.usageVisibleColumns.includes(u)?e.usageVisibleColumns=e.usageVisibleColumns.filter(m=>m!==u):e.usageVisibleColumns=[...e.usageVisibleColumns,u]},onSelectSession:(u,m)=>{if(e.usageTimeSeries=null,e.usageSessionLogs=null,e.usageRecentSessions=[u,...e.usageRecentSessions.filter(b=>b!==u)].slice(0,8),m&&e.usageSelectedSessions.length>0){const b=e.usageChartMode==="tokens",A=[...e.usageResult?.sessions??[]].toSorted((_,M)=>{const D=b?_.usage?.totalTokens??0:_.usage?.totalCost??0;return(b?M.usage?.totalTokens??0:M.usage?.totalCost??0)-D}).map(_=>_.key),$=e.usageSelectedSessions[e.usageSelectedSessions.length-1],T=A.indexOf($),C=A.indexOf(u);if(T!==-1&&C!==-1){const[_,M]=T<C?[T,C]:[C,T],D=A.slice(_,M+1),z=[...new Set([...e.usageSelectedSessions,...D])];e.usageSelectedSessions=z}}else e.usageSelectedSessions.length===1&&e.usageSelectedSessions[0]===u?e.usageSelectedSessions=[]:e.usageSelectedSessions=[u];e.usageSelectedSessions.length===1&&(Ug(e,e.usageSelectedSessions[0]),Bg(e,e.usageSelectedSessions[0]))},onSelectDay:(u,m)=>{if(m&&e.usageSelectedDays.length>0){const b=(e.usageCostSummary?.daily??[]).map(T=>T.date),x=e.usageSelectedDays[e.usageSelectedDays.length-1],A=b.indexOf(x),$=b.indexOf(u);if(A!==-1&&$!==-1){const[T,C]=A<$?[A,$]:[$,A],_=b.slice(T,C+1),M=[...new Set([...e.usageSelectedDays,..._])];e.usageSelectedDays=M}}else e.usageSelectedDays.includes(u)?e.usageSelectedDays=e.usageSelectedDays.filter(b=>b!==u):e.usageSelectedDays=[u]},onChartModeChange:u=>{e.usageChartMode=u},onDailyChartModeChange:u=>{e.usageDailyChartMode=u},onTimeSeriesModeChange:u=>{e.usageTimeSeriesMode=u},onTimeSeriesBreakdownChange:u=>{e.usageTimeSeriesBreakdownMode=u},onClearDays:()=>{e.usageSelectedDays=[]},onClearHours:()=>{e.usageSelectedHours=[]},onClearSessions:()=>{e.usageSelectedSessions=[],e.usageTimeSeries=null,e.usageSessionLogs=null},onClearFilters:()=>{e.usageSelectedDays=[],e.usageSelectedHours=[],e.usageSelectedSessions=[],e.usageTimeSeries=null,e.usageSessionLogs=null}}):v}

        ${e.tab==="cron"?Df({basePath:e.basePath,loading:e.cronLoading,status:e.cronStatus,jobs:e.cronJobs,error:e.cronError,busy:e.cronBusy,form:e.cronForm,channels:e.channelsSnapshot?.channelMeta?.length?e.channelsSnapshot.channelMeta.map(u=>u.id):e.channelsSnapshot?.channelOrder??[],channelLabels:e.channelsSnapshot?.channelLabels??{},channelMeta:e.channelsSnapshot?.channelMeta??[],runsJobId:e.cronRunsJobId,runs:e.cronRuns,onFormChange:u=>e.cronForm={...e.cronForm,...u},onRefresh:()=>e.loadCron(),onAdd:()=>md(e),onToggle:(u,m)=>hd(e,u,m),onRun:u=>fd(e,u),onRemove:u=>vd(e,u),onLoadRuns:u=>kr(e,u)}):v}

        ${e.tab==="agents"?lp({loading:e.agentsLoading,error:e.agentsError,agentsList:e.agentsList,selectedAgentId:f,activePanel:e.agentsPanel,configForm:h,configLoading:e.configLoading,configSaving:e.configSaving,configDirty:e.configFormDirty,channelsLoading:e.channelsLoading,channelsError:e.channelsError,channelsSnapshot:e.channelsSnapshot,channelsLastSuccess:e.channelsLastSuccess,cronLoading:e.cronLoading,cronStatus:e.cronStatus,cronJobs:e.cronJobs,cronError:e.cronError,agentFilesLoading:e.agentFilesLoading,agentFilesError:e.agentFilesError,agentFilesList:e.agentFilesList,agentFileActive:e.agentFileActive,agentFileContents:e.agentFileContents,agentFileDrafts:e.agentFileDrafts,agentFileSaving:e.agentFileSaving,agentIdentityLoading:e.agentIdentityLoading,agentIdentityError:e.agentIdentityError,agentIdentityById:e.agentIdentityById,agentSkillsLoading:e.agentSkillsLoading,agentSkillsReport:e.agentSkillsReport,agentSkillsError:e.agentSkillsError,agentSkillsAgentId:e.agentSkillsAgentId,skillsFilter:e.skillsFilter,onRefresh:async()=>{await Pa(e);const u=e.agentsList?.agents?.map(m=>m.id)??[];u.length>0&&xr(e,u)},onSelectAgent:u=>{e.agentsSelectedId!==u&&(e.agentsSelectedId=u,e.agentFilesList=null,e.agentFilesError=null,e.agentFilesLoading=!1,e.agentFileActive=null,e.agentFileContents={},e.agentFileDrafts={},e.agentSkillsReport=null,e.agentSkillsError=null,e.agentSkillsAgentId=null,wr(e,u),e.agentsPanel==="files"&&Rs(e,u),e.agentsPanel==="skills"&&Rn(e,u))},onSelectPanel:u=>{e.agentsPanel=u,u==="files"&&f&&e.agentFilesList?.agentId!==f&&(e.agentFilesList=null,e.agentFilesError=null,e.agentFileActive=null,e.agentFileContents={},e.agentFileDrafts={},Rs(e,f)),u==="skills"&&f&&Rn(e,f),u==="channels"&&we(e,!1),u==="cron"&&e.loadCron()},onLoadFiles:u=>Rs(e,u),onSelectFile:u=>{e.agentFileActive=u,f&&Fg(e,f,u)},onFileDraftChange:(u,m)=>{e.agentFileDrafts={...e.agentFileDrafts,[u]:m}},onFileReset:u=>{const m=e.agentFileContents[u]??"";e.agentFileDrafts={...e.agentFileDrafts,[u]:m}},onFileSave:u=>{if(!f)return;const m=e.agentFileDrafts[u]??e.agentFileContents[u]??"";Og(e,f,u,m)},onToolsProfileChange:(u,m,b)=>{if(!h)return;const x=h.agents?.list;if(!Array.isArray(x))return;const A=x.findIndex(T=>T&&typeof T=="object"&&"id"in T&&T.id===u);if(A<0)return;const $=["agents","list",A,"tools"];m?$e(e,[...$,"profile"],m):We(e,[...$,"profile"]),b&&We(e,[...$,"allow"])},onToolsOverridesChange:(u,m,b)=>{if(!h)return;const x=h.agents?.list;if(!Array.isArray(x))return;const A=x.findIndex(T=>T&&typeof T=="object"&&"id"in T&&T.id===u);if(A<0)return;const $=["agents","list",A,"tools"];m.length>0?$e(e,[...$,"alsoAllow"],m):We(e,[...$,"alsoAllow"]),b.length>0?$e(e,[...$,"deny"],b):We(e,[...$,"deny"])},onConfigReload:()=>Se(e),onConfigSave:()=>Dn(e),onChannelsRefresh:()=>we(e,!1),onCronRefresh:()=>e.loadCron(),onSkillsFilterChange:u=>e.skillsFilter=u,onSkillsRefresh:()=>{f&&Rn(e,f)},onAgentSkillToggle:(u,m,b)=>{if(!h)return;const x=h.agents?.list;if(!Array.isArray(x))return;const A=x.findIndex(z=>z&&typeof z=="object"&&"id"in z&&z.id===u);if(A<0)return;const $=x[A],T=m.trim();if(!T)return;const C=e.agentSkillsReport?.skills?.map(z=>z.name).filter(Boolean)??[],M=(Array.isArray($.skills)?$.skills.map(z=>String(z).trim()).filter(Boolean):void 0)??C,D=new Set(M);b?D.add(T):D.delete(T),$e(e,["agents","list",A,"skills"],[...D])},onAgentSkillsClear:u=>{if(!h)return;const m=h.agents?.list;if(!Array.isArray(m))return;const b=m.findIndex(x=>x&&typeof x=="object"&&"id"in x&&x.id===u);b<0||We(e,["agents","list",b,"skills"])},onAgentSkillsDisableAll:u=>{if(!h)return;const m=h.agents?.list;if(!Array.isArray(m))return;const b=m.findIndex(x=>x&&typeof x=="object"&&"id"in x&&x.id===u);b<0||$e(e,["agents","list",b,"skills"],[])},onModelChange:(u,m)=>{if(!h)return;const b=h.agents?.list;if(!Array.isArray(b))return;const x=b.findIndex(C=>C&&typeof C=="object"&&"id"in C&&C.id===u);if(x<0)return;const A=["agents","list",x,"model"];if(!m){We(e,A);return}const T=b[x]?.model;if(T&&typeof T=="object"&&!Array.isArray(T)){const C=T.fallbacks,_={primary:m,...Array.isArray(C)?{fallbacks:C}:{}};$e(e,A,_)}else $e(e,A,m)},onModelFallbacksChange:(u,m)=>{if(!h)return;const b=h.agents?.list;if(!Array.isArray(b))return;const x=b.findIndex(z=>z&&typeof z=="object"&&"id"in z&&z.id===u);if(x<0)return;const A=["agents","list",x,"model"],$=b[x],T=m.map(z=>z.trim()).filter(Boolean),C=$.model,M=(()=>{if(typeof C=="string")return C.trim()||null;if(C&&typeof C=="object"&&!Array.isArray(C)){const z=C.primary;if(typeof z=="string")return z.trim()||null}return null})();if(T.length===0){M?$e(e,A,M):We(e,A);return}$e(e,A,M?{primary:M,fallbacks:T}:{fallbacks:T})}}):v}

        ${e.tab==="skills"?Lv({loading:e.skillsLoading,report:e.skillsReport,error:e.skillsError,filter:e.skillsFilter,edits:e.skillEdits,messages:e.skillMessages,busyKey:e.skillsBusyKey,onFilterChange:u=>e.skillsFilter=u,onRefresh:()=>un(e,{clearMessages:!0}),onToggle:(u,m)=>au(e,u,m),onEdit:(u,m)=>su(e,u,m),onSaveKey:u=>ou(e,u),onInstall:(u,m,b)=>iu(e,u,m,b)}):v}

        ${e.tab==="nodes"?Vf({loading:e.nodesLoading,nodes:e.nodes,devicesLoading:e.devicesLoading,devicesError:e.devicesError,devicesList:e.devicesList,configForm:e.configForm??e.configSnapshot?.config,configLoading:e.configLoading,configSaving:e.configSaving,configDirty:e.configFormDirty,configFormMode:e.configFormMode,execApprovalsLoading:e.execApprovalsLoading,execApprovalsSaving:e.execApprovalsSaving,execApprovalsDirty:e.execApprovalsDirty,execApprovalsSnapshot:e.execApprovalsSnapshot,execApprovalsForm:e.execApprovalsForm,execApprovalsSelectedAgent:e.execApprovalsSelectedAgent,execApprovalsTarget:e.execApprovalsTarget,execApprovalsTargetNodeId:e.execApprovalsTargetNodeId,onRefresh:()=>es(e),onDevicesRefresh:()=>et(e),onDeviceApprove:u=>jd(e,u),onDeviceReject:u=>qd(e,u),onDeviceRotate:(u,m,b)=>Gd(e,{deviceId:u,role:m,scopes:b}),onDeviceRevoke:(u,m)=>Vd(e,{deviceId:u,role:m}),onLoadConfig:()=>Se(e),onLoadExecApprovals:()=>{const u=e.execApprovalsTarget==="node"&&e.execApprovalsTargetNodeId?{kind:"node",nodeId:e.execApprovalsTargetNodeId}:{kind:"gateway"};return za(e,u)},onBindDefault:u=>{u?$e(e,["tools","exec","node"],u):We(e,["tools","exec","node"])},onBindAgent:(u,m)=>{const b=["agents","list",u,"tools","exec","node"];m?$e(e,b,m):We(e,b)},onSaveBindings:()=>Dn(e),onExecApprovalsTargetChange:(u,m)=>{e.execApprovalsTarget=u,e.execApprovalsTargetNodeId=m,e.execApprovalsSnapshot=null,e.execApprovalsForm=null,e.execApprovalsDirty=!1,e.execApprovalsSelectedAgent=null},onExecApprovalsSelectAgent:u=>{e.execApprovalsSelectedAgent=u},onExecApprovalsPatch:(u,m)=>Xd(e,u,m),onExecApprovalsRemove:u=>eu(e,u),onSaveExecApprovals:()=>{const u=e.execApprovalsTarget==="node"&&e.execApprovalsTargetNodeId?{kind:"node",nodeId:e.execApprovalsTargetNodeId}:{kind:"gateway"};return Zd(e,u)}}):v}

        ${e.tab==="chat"?kf({sessionKey:e.sessionKey,onSessionKeyChange:u=>{e.sessionKey=u,e.chatMessage="",e.chatAttachments=[],e.chatStream=null,e.chatStreamStartedAt=null,e.chatRunId=null,e.chatQueue=[],e.resetToolStream(),e.resetChatScroll(),e.applySettings({...e.settings,sessionKey:u,lastActiveSessionKey:u}),e.loadAssistantIdentity(),rn(e),aa(e)},thinkingLevel:e.chatThinkingLevel,showThinking:c,loading:e.chatLoading,sending:e.chatSending,compactionStatus:e.compactionStatus,assistantAvatarUrl:g,messages:e.chatMessages,toolMessages:e.chatToolMessages,stream:e.chatStream,streamStartedAt:e.chatStreamStartedAt,draft:e.chatMessage,queue:e.chatQueue,connected:e.connected,canSend:e.connected,disabledReason:a,error:e.lastError,sessions:e.sessionsResult,focusMode:r,onRefresh:()=>(e.resetToolStream(),Promise.all([rn(e),aa(e)])),onToggleFocusMode:()=>{e.onboarding||e.applySettings({...e.settings,chatFocusMode:!e.settings.chatFocusMode})},onChatScroll:u=>e.handleChatScroll(u),onDraftChange:u=>e.chatMessage=u,attachments:e.chatAttachments,onAttachmentsChange:u=>e.chatAttachments=u,onSend:()=>e.handleSendChat(),canAbort:!!e.chatRunId,onAbort:()=>{e.handleAbortChat()},onQueueRemove:u=>e.removeQueuedMessage(u),onNewSession:()=>e.handleSendChat("/new",{restoreDraft:!0}),showNewMessages:e.chatNewMessagesBelow,onScrollToBottom:()=>e.scrollToBottom(),sidebarOpen:e.sidebarOpen,sidebarContent:e.sidebarContent,sidebarError:e.sidebarError,splitRatio:e.splitRatio,onOpenSidebar:u=>e.handleOpenSidebar(u),onCloseSidebar:()=>e.handleCloseSidebar(),onSplitRatioChange:u=>e.handleSplitRatioChange(u),assistantName:e.assistantName,assistantAvatar:e.assistantAvatar}):v}

        ${e.tab==="agentSwarm"?Hg():v}

        ${e.tab==="config"?Ef({raw:e.configRaw,originalRaw:e.configRawOriginal,valid:e.configValid,issues:e.configIssues,loading:e.configLoading,saving:e.configSaving,applying:e.configApplying,updating:e.updateRunning,connected:e.connected,schema:e.configSchema,schemaLoading:e.configSchemaLoading,uiHints:e.configUiHints,formMode:e.configFormMode,formValue:e.configForm,originalValue:e.configFormOriginal,searchQuery:e.configSearchQuery,activeSection:e.configActiveSection,activeSubsection:e.configActiveSubsection,onRawChange:u=>{e.configRaw=u},onFormModeChange:u=>e.configFormMode=u,onFormPatch:(u,m)=>$e(e,u,m),onSearchChange:u=>e.configSearchQuery=u,onSectionChange:u=>{e.configActiveSection=u,e.configActiveSubsection=null},onSubsectionChange:u=>e.configActiveSubsection=u,onReload:()=>Se(e),onSave:()=>Dn(e),onApply:()=>Ec(e),onUpdate:()=>Lc(e)}):v}

        ${e.tab==="debug"?Uf({loading:e.debugLoading,status:e.debugStatus,health:e.debugHealth,models:e.debugModels,heartbeat:e.debugHeartbeat,eventLog:e.eventLog,callMethod:e.debugCallMethod,callParams:e.debugCallParams,callResult:e.debugCallResult,callError:e.debugCallError,onCallMethodChange:u=>e.debugCallMethod=u,onCallParamsChange:u=>e.debugCallParams=u,onRefresh:()=>Xn(e),onCall:()=>td(e)}):v}

        ${e.tab==="logs"?Gf({loading:e.logsLoading,error:e.logsError,file:e.logsFile,entries:e.logsEntries,filterText:e.logsFilterText,levelFilters:e.logsLevelFilters,autoFollow:e.logsAutoFollow,truncated:e.logsTruncated,onFilterTextChange:u=>e.logsFilterText=u,onLevelToggle:(u,m)=>{e.logsLevelFilters={...e.logsLevelFilters,[u]:m}},onToggleAutoFollow:u=>e.logsAutoFollow=u,onRefresh:()=>Ea(e,{reset:!0}),onExport:(u,m)=>e.exportLogs(u,m),onScroll:u=>e.handleLogsScroll(u)}):v}
      </main>
      ${Hf(e)}
      ${zf(e)}
    </div>
  `}var xb=Object.defineProperty,$b=Object.getOwnPropertyDescriptor,S=(e,t,n,s)=>{for(var a=s>1?void 0:s?$b(t,n):t,i=e.length-1,r;i>=0;i--)(r=e[i])&&(a=(s?r(t,n,a):r(a))||a);return s&&a&&xb(t,n,a),a};const qs=lg();function Sb(){if(!window.location.search)return!1;const t=new URLSearchParams(window.location.search).get("onboarding");if(!t)return!1;const n=t.trim().toLowerCase();return n==="1"||n==="true"||n==="yes"||n==="on"}let w=class extends Lt{constructor(){super(...arguments),this.settings=uu(),this.password="",this.tab="chat",this.onboarding=Sb(),this.connected=!1,this.theme=this.settings.theme??"system",this.themeResolved="dark",this.hello=null,this.lastError=null,this.eventLog=[],this.eventLogBuffer=[],this.toolStreamSyncTimer=null,this.sidebarCloseTimer=null,this.assistantName=qs.name,this.assistantAvatar=qs.avatar,this.assistantAgentId=qs.agentId??null,this.sessionKey=this.settings.sessionKey,this.chatLoading=!1,this.chatSending=!1,this.chatMessage="",this.chatMessages=[],this.chatToolMessages=[],this.chatStream=null,this.chatStreamStartedAt=null,this.chatRunId=null,this.compactionStatus=null,this.chatAvatarUrl=null,this.chatThinkingLevel=null,this.chatQueue=[],this.chatAttachments=[],this.sidebarOpen=!1,this.sidebarContent=null,this.sidebarError=null,this.splitRatio=this.settings.splitRatio,this.nodesLoading=!1,this.nodes=[],this.devicesLoading=!1,this.devicesError=null,this.devicesList=null,this.execApprovalsLoading=!1,this.execApprovalsSaving=!1,this.execApprovalsDirty=!1,this.execApprovalsSnapshot=null,this.execApprovalsForm=null,this.execApprovalsSelectedAgent=null,this.execApprovalsTarget="gateway",this.execApprovalsTargetNodeId=null,this.execApprovalQueue=[],this.execApprovalBusy=!1,this.execApprovalError=null,this.pendingGatewayUrl=null,this.configLoading=!1,this.configRaw=`{
}
`,this.configRawOriginal="",this.configValid=null,this.configIssues=[],this.configSaving=!1,this.configApplying=!1,this.updateRunning=!1,this.applySessionKey=this.settings.lastActiveSessionKey,this.configSnapshot=null,this.configSchema=null,this.configSchemaVersion=null,this.configSchemaLoading=!1,this.configUiHints={},this.configForm=null,this.configFormOriginal=null,this.configFormDirty=!1,this.configFormMode="form",this.configSearchQuery="",this.configActiveSection=null,this.configActiveSubsection=null,this.channelsLoading=!1,this.channelsSnapshot=null,this.channelsError=null,this.channelsLastSuccess=null,this.whatsappLoginMessage=null,this.whatsappLoginQrDataUrl=null,this.whatsappLoginConnected=null,this.whatsappBusy=!1,this.nostrProfileFormState=null,this.nostrProfileAccountId=null,this.presenceLoading=!1,this.presenceEntries=[],this.presenceError=null,this.presenceStatus=null,this.agentsLoading=!1,this.agentsList=null,this.agentsError=null,this.agentsSelectedId=null,this.agentsPanel="overview",this.agentFilesLoading=!1,this.agentFilesError=null,this.agentFilesList=null,this.agentFileContents={},this.agentFileDrafts={},this.agentFileActive=null,this.agentFileSaving=!1,this.agentIdentityLoading=!1,this.agentIdentityError=null,this.agentIdentityById={},this.agentSkillsLoading=!1,this.agentSkillsError=null,this.agentSkillsReport=null,this.agentSkillsAgentId=null,this.sessionsLoading=!1,this.sessionsResult=null,this.sessionsError=null,this.sessionsFilterActive="",this.sessionsFilterLimit="120",this.sessionsIncludeGlobal=!0,this.sessionsIncludeUnknown=!1,this.usageLoading=!1,this.usageResult=null,this.usageCostSummary=null,this.usageError=null,this.usageStartDate=(()=>{const e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`})(),this.usageEndDate=(()=>{const e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`})(),this.usageSelectedSessions=[],this.usageSelectedDays=[],this.usageSelectedHours=[],this.usageChartMode="tokens",this.usageDailyChartMode="by-type",this.usageTimeSeriesMode="per-turn",this.usageTimeSeriesBreakdownMode="by-type",this.usageTimeSeries=null,this.usageTimeSeriesLoading=!1,this.usageSessionLogs=null,this.usageSessionLogsLoading=!1,this.usageSessionLogsExpanded=!1,this.usageQuery="",this.usageQueryDraft="",this.usageSessionSort="recent",this.usageSessionSortDir="desc",this.usageRecentSessions=[],this.usageTimeZone="local",this.usageContextExpanded=!1,this.usageHeaderPinned=!1,this.usageSessionsTab="all",this.usageVisibleColumns=["channel","agent","provider","model","messages","tools","errors","duration"],this.usageLogFilterRoles=[],this.usageLogFilterTools=[],this.usageLogFilterHasTools=!1,this.usageLogFilterQuery="",this.usageQueryDebounceTimer=null,this.cronLoading=!1,this.cronJobs=[],this.cronStatus=null,this.cronError=null,this.cronForm={...ag},this.cronRunsJobId=null,this.cronRuns=[],this.cronBusy=!1,this.skillsLoading=!1,this.skillsReport=null,this.skillsError=null,this.skillsFilter="",this.skillEdits={},this.skillsBusyKey=null,this.skillMessages={},this.debugLoading=!1,this.debugStatus=null,this.debugHealth=null,this.debugModels=[],this.debugHeartbeat=null,this.debugCallMethod="",this.debugCallParams="{}",this.debugCallResult=null,this.debugCallError=null,this.logsLoading=!1,this.logsError=null,this.logsFile=null,this.logsEntries=[],this.logsFilterText="",this.logsLevelFilters={...sg},this.logsAutoFollow=!0,this.logsTruncated=!1,this.logsCursor=null,this.logsLastFetchAt=null,this.logsLimit=500,this.logsMaxBytes=25e4,this.logsAtBottom=!0,this.client=null,this.chatScrollFrame=null,this.chatScrollTimeout=null,this.chatHasAutoScrolled=!1,this.chatUserNearBottom=!0,this.chatNewMessagesBelow=!1,this.nodesPollInterval=null,this.logsPollInterval=null,this.debugPollInterval=null,this.logsScrollFrame=null,this.toolStreamById=new Map,this.toolStreamOrder=[],this.refreshSessionsAfterChat=new Set,this.basePath="",this.popStateHandler=()=>ku(this),this.themeMedia=null,this.themeMediaHandler=null,this.topbarObserver=null}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),yg(this)}firstUpdated(){wg(this)}disconnectedCallback(){xg(this),super.disconnectedCallback()}updated(e){$g(this,e)}connect(){rl(this)}handleChatScroll(e){Jc(this,e)}handleLogsScroll(e){Zc(this,e)}exportLogs(e,t){Xc(e,t)}resetToolStream(){is(this)}resetChatScroll(){Ho(this)}scrollToBottom(){Ho(this),cn(this,!0)}async loadAssistantIdentity(){await al(this)}applySettings(e){yt(this,e)}setTab(e){vu(this,e)}setTheme(e,t){bu(this,e,t)}async loadOverview(){await Yr(this)}async loadCron(){await zn(this)}async handleAbortChat(){await el(this)}removeQueuedMessage(e){Zu(this,e)}async handleSendChat(e,t){await Xu(this,e,t)}async handleWhatsAppStart(e){await Uc(this,e)}async handleWhatsAppWait(){await Bc(this)}async handleWhatsAppLogout(){await Hc(this)}async handleChannelConfigSave(){await zc(this)}async handleChannelConfigReload(){await Wc(this)}handleNostrProfileEdit(e,t){jc(this,e,t)}handleNostrProfileCancel(){qc(this)}handleNostrProfileFieldChange(e,t){Gc(this,e,t)}async handleNostrProfileSave(){await Qc(this)}async handleNostrProfileImport(){await Yc(this)}handleNostrProfileToggleAdvanced(){Vc(this)}async handleExecApprovalDecision(e){const t=this.execApprovalQueue[0];if(!(!t||!this.client||this.execApprovalBusy)){this.execApprovalBusy=!0,this.execApprovalError=null;try{await this.client.request("exec.approval.resolve",{id:t.id,decision:e}),this.execApprovalQueue=this.execApprovalQueue.filter(n=>n.id!==t.id)}catch(n){this.execApprovalError=`Exec approval failed: ${String(n)}`}finally{this.execApprovalBusy=!1}}}handleGatewayUrlConfirm(){const e=this.pendingGatewayUrl;e&&(this.pendingGatewayUrl=null,yt(this,{...this.settings,gatewayUrl:e}),this.connect())}handleGatewayUrlCancel(){this.pendingGatewayUrl=null}handleOpenSidebar(e){this.sidebarCloseTimer!=null&&(window.clearTimeout(this.sidebarCloseTimer),this.sidebarCloseTimer=null),this.sidebarContent=e,this.sidebarError=null,this.sidebarOpen=!0}handleCloseSidebar(){this.sidebarOpen=!1,this.sidebarCloseTimer!=null&&window.clearTimeout(this.sidebarCloseTimer),this.sidebarCloseTimer=window.setTimeout(()=>{this.sidebarOpen||(this.sidebarContent=null,this.sidebarError=null,this.sidebarCloseTimer=null)},200)}handleSplitRatioChange(e){const t=Math.max(.4,Math.min(.7,e));this.splitRatio=t,this.applySettings({...this.settings,splitRatio:t})}render(){return wb(this)}};S([k()],w.prototype,"settings",2);S([k()],w.prototype,"password",2);S([k()],w.prototype,"tab",2);S([k()],w.prototype,"onboarding",2);S([k()],w.prototype,"connected",2);S([k()],w.prototype,"theme",2);S([k()],w.prototype,"themeResolved",2);S([k()],w.prototype,"hello",2);S([k()],w.prototype,"lastError",2);S([k()],w.prototype,"eventLog",2);S([k()],w.prototype,"assistantName",2);S([k()],w.prototype,"assistantAvatar",2);S([k()],w.prototype,"assistantAgentId",2);S([k()],w.prototype,"sessionKey",2);S([k()],w.prototype,"chatLoading",2);S([k()],w.prototype,"chatSending",2);S([k()],w.prototype,"chatMessage",2);S([k()],w.prototype,"chatMessages",2);S([k()],w.prototype,"chatToolMessages",2);S([k()],w.prototype,"chatStream",2);S([k()],w.prototype,"chatStreamStartedAt",2);S([k()],w.prototype,"chatRunId",2);S([k()],w.prototype,"compactionStatus",2);S([k()],w.prototype,"chatAvatarUrl",2);S([k()],w.prototype,"chatThinkingLevel",2);S([k()],w.prototype,"chatQueue",2);S([k()],w.prototype,"chatAttachments",2);S([k()],w.prototype,"sidebarOpen",2);S([k()],w.prototype,"sidebarContent",2);S([k()],w.prototype,"sidebarError",2);S([k()],w.prototype,"splitRatio",2);S([k()],w.prototype,"nodesLoading",2);S([k()],w.prototype,"nodes",2);S([k()],w.prototype,"devicesLoading",2);S([k()],w.prototype,"devicesError",2);S([k()],w.prototype,"devicesList",2);S([k()],w.prototype,"execApprovalsLoading",2);S([k()],w.prototype,"execApprovalsSaving",2);S([k()],w.prototype,"execApprovalsDirty",2);S([k()],w.prototype,"execApprovalsSnapshot",2);S([k()],w.prototype,"execApprovalsForm",2);S([k()],w.prototype,"execApprovalsSelectedAgent",2);S([k()],w.prototype,"execApprovalsTarget",2);S([k()],w.prototype,"execApprovalsTargetNodeId",2);S([k()],w.prototype,"execApprovalQueue",2);S([k()],w.prototype,"execApprovalBusy",2);S([k()],w.prototype,"execApprovalError",2);S([k()],w.prototype,"pendingGatewayUrl",2);S([k()],w.prototype,"configLoading",2);S([k()],w.prototype,"configRaw",2);S([k()],w.prototype,"configRawOriginal",2);S([k()],w.prototype,"configValid",2);S([k()],w.prototype,"configIssues",2);S([k()],w.prototype,"configSaving",2);S([k()],w.prototype,"configApplying",2);S([k()],w.prototype,"updateRunning",2);S([k()],w.prototype,"applySessionKey",2);S([k()],w.prototype,"configSnapshot",2);S([k()],w.prototype,"configSchema",2);S([k()],w.prototype,"configSchemaVersion",2);S([k()],w.prototype,"configSchemaLoading",2);S([k()],w.prototype,"configUiHints",2);S([k()],w.prototype,"configForm",2);S([k()],w.prototype,"configFormOriginal",2);S([k()],w.prototype,"configFormDirty",2);S([k()],w.prototype,"configFormMode",2);S([k()],w.prototype,"configSearchQuery",2);S([k()],w.prototype,"configActiveSection",2);S([k()],w.prototype,"configActiveSubsection",2);S([k()],w.prototype,"channelsLoading",2);S([k()],w.prototype,"channelsSnapshot",2);S([k()],w.prototype,"channelsError",2);S([k()],w.prototype,"channelsLastSuccess",2);S([k()],w.prototype,"whatsappLoginMessage",2);S([k()],w.prototype,"whatsappLoginQrDataUrl",2);S([k()],w.prototype,"whatsappLoginConnected",2);S([k()],w.prototype,"whatsappBusy",2);S([k()],w.prototype,"nostrProfileFormState",2);S([k()],w.prototype,"nostrProfileAccountId",2);S([k()],w.prototype,"presenceLoading",2);S([k()],w.prototype,"presenceEntries",2);S([k()],w.prototype,"presenceError",2);S([k()],w.prototype,"presenceStatus",2);S([k()],w.prototype,"agentsLoading",2);S([k()],w.prototype,"agentsList",2);S([k()],w.prototype,"agentsError",2);S([k()],w.prototype,"agentsSelectedId",2);S([k()],w.prototype,"agentsPanel",2);S([k()],w.prototype,"agentFilesLoading",2);S([k()],w.prototype,"agentFilesError",2);S([k()],w.prototype,"agentFilesList",2);S([k()],w.prototype,"agentFileContents",2);S([k()],w.prototype,"agentFileDrafts",2);S([k()],w.prototype,"agentFileActive",2);S([k()],w.prototype,"agentFileSaving",2);S([k()],w.prototype,"agentIdentityLoading",2);S([k()],w.prototype,"agentIdentityError",2);S([k()],w.prototype,"agentIdentityById",2);S([k()],w.prototype,"agentSkillsLoading",2);S([k()],w.prototype,"agentSkillsError",2);S([k()],w.prototype,"agentSkillsReport",2);S([k()],w.prototype,"agentSkillsAgentId",2);S([k()],w.prototype,"sessionsLoading",2);S([k()],w.prototype,"sessionsResult",2);S([k()],w.prototype,"sessionsError",2);S([k()],w.prototype,"sessionsFilterActive",2);S([k()],w.prototype,"sessionsFilterLimit",2);S([k()],w.prototype,"sessionsIncludeGlobal",2);S([k()],w.prototype,"sessionsIncludeUnknown",2);S([k()],w.prototype,"usageLoading",2);S([k()],w.prototype,"usageResult",2);S([k()],w.prototype,"usageCostSummary",2);S([k()],w.prototype,"usageError",2);S([k()],w.prototype,"usageStartDate",2);S([k()],w.prototype,"usageEndDate",2);S([k()],w.prototype,"usageSelectedSessions",2);S([k()],w.prototype,"usageSelectedDays",2);S([k()],w.prototype,"usageSelectedHours",2);S([k()],w.prototype,"usageChartMode",2);S([k()],w.prototype,"usageDailyChartMode",2);S([k()],w.prototype,"usageTimeSeriesMode",2);S([k()],w.prototype,"usageTimeSeriesBreakdownMode",2);S([k()],w.prototype,"usageTimeSeries",2);S([k()],w.prototype,"usageTimeSeriesLoading",2);S([k()],w.prototype,"usageSessionLogs",2);S([k()],w.prototype,"usageSessionLogsLoading",2);S([k()],w.prototype,"usageSessionLogsExpanded",2);S([k()],w.prototype,"usageQuery",2);S([k()],w.prototype,"usageQueryDraft",2);S([k()],w.prototype,"usageSessionSort",2);S([k()],w.prototype,"usageSessionSortDir",2);S([k()],w.prototype,"usageRecentSessions",2);S([k()],w.prototype,"usageTimeZone",2);S([k()],w.prototype,"usageContextExpanded",2);S([k()],w.prototype,"usageHeaderPinned",2);S([k()],w.prototype,"usageSessionsTab",2);S([k()],w.prototype,"usageVisibleColumns",2);S([k()],w.prototype,"usageLogFilterRoles",2);S([k()],w.prototype,"usageLogFilterTools",2);S([k()],w.prototype,"usageLogFilterHasTools",2);S([k()],w.prototype,"usageLogFilterQuery",2);S([k()],w.prototype,"cronLoading",2);S([k()],w.prototype,"cronJobs",2);S([k()],w.prototype,"cronStatus",2);S([k()],w.prototype,"cronError",2);S([k()],w.prototype,"cronForm",2);S([k()],w.prototype,"cronRunsJobId",2);S([k()],w.prototype,"cronRuns",2);S([k()],w.prototype,"cronBusy",2);S([k()],w.prototype,"skillsLoading",2);S([k()],w.prototype,"skillsReport",2);S([k()],w.prototype,"skillsError",2);S([k()],w.prototype,"skillsFilter",2);S([k()],w.prototype,"skillEdits",2);S([k()],w.prototype,"skillsBusyKey",2);S([k()],w.prototype,"skillMessages",2);S([k()],w.prototype,"debugLoading",2);S([k()],w.prototype,"debugStatus",2);S([k()],w.prototype,"debugHealth",2);S([k()],w.prototype,"debugModels",2);S([k()],w.prototype,"debugHeartbeat",2);S([k()],w.prototype,"debugCallMethod",2);S([k()],w.prototype,"debugCallParams",2);S([k()],w.prototype,"debugCallResult",2);S([k()],w.prototype,"debugCallError",2);S([k()],w.prototype,"logsLoading",2);S([k()],w.prototype,"logsError",2);S([k()],w.prototype,"logsFile",2);S([k()],w.prototype,"logsEntries",2);S([k()],w.prototype,"logsFilterText",2);S([k()],w.prototype,"logsLevelFilters",2);S([k()],w.prototype,"logsAutoFollow",2);S([k()],w.prototype,"logsTruncated",2);S([k()],w.prototype,"logsCursor",2);S([k()],w.prototype,"logsLastFetchAt",2);S([k()],w.prototype,"logsLimit",2);S([k()],w.prototype,"logsMaxBytes",2);S([k()],w.prototype,"logsAtBottom",2);S([k()],w.prototype,"chatNewMessagesBelow",2);w=S([gr("openclaw-app")],w);
//# sourceMappingURL=index-2c6Q_PGm.js.map
