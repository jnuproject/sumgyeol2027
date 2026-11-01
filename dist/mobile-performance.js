// Keep gameplay time independent of the renderer's frame rate. Long stalls
// are capped, while even 5fps retains elapsed movement time. Short spatial
// collision steps keep the faster phone run from passing through obstacles.
export function simulationDelta(seconds){return Math.max(0,Math.min(Number.isFinite(seconds)?seconds:0,.25));}
export function isTouchLayout({coarse=false,touches=0,width=1280,height=720}={}){return coarse||touches>0||width<=760||(width<=1100&&height<=500);}
export function renderProfile({mobile=false,quality='balanced',pixelRatio=1}={}){
 if(quality==='low')return {mobile,pixelRatio:Math.min(pixelRatio,1),shadows:false,shadowSize:512,staticShadows:true};
 if(mobile)return {mobile,pixelRatio:Math.min(pixelRatio,quality==='high'?2.25:1.75),shadows:true,shadowSize:quality==='high'?2048:1024,staticShadows:true};
 return {mobile,pixelRatio:Math.min(pixelRatio,quality==='high'?2:1.6),shadows:true,shadowSize:quality==='high'?2048:1024,staticShadows:false};
}
// Wait through loading and sustained slow frames before adjusting. Unlike the
// old one-way 0.75x fallback, recover detail when the device has headroom again.
export function adaptiveMobileResolution(state,{dt,frameMs,current,target}){
 const next={age:(state.age??0)+dt,slow:state.slow??0,fast:state.fast??0,ratio:current};
 const floor=Math.min(target,1.25);
 if(next.age<8)return next;
 next.slow=frameMs>55?next.slow+dt:0;next.fast=frameMs<32?next.fast+dt:0;
 if(next.slow>=8){next.ratio=Math.max(floor,Math.round((current-.1)*100)/100);next.slow=next.fast=0;}
 else if(next.fast>=12){next.ratio=Math.min(target,Math.round((current+.1)*100)/100);next.slow=next.fast=0;}
 return next;
}
// Touch pointers leave the DOM on finger-up. Releasing a camera/jump finger
// must not cancel another finger that still holds the movement joystick.
export function shouldClearPointerExit({pointerType,relatedTarget,buttons}){return pointerType==='mouse'&&relatedTarget===null&&!buttons;}
