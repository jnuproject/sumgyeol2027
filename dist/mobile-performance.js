// Keep gameplay time independent of the renderer's frame rate. Long stalls
// are capped, while normal15/20/30fps frames retain all elapsed movement time.
export function simulationDelta(seconds){return Math.max(0,Math.min(Number.isFinite(seconds)?seconds:0,.12));}
export function isTouchLayout({coarse=false,touches=0,width=1280,height=720}={}){return coarse||touches>0||width<=760||(width<=1100&&height<=500);}
export function renderProfile({mobile=false,quality='balanced',pixelRatio=1}={}){
 if(quality==='low')return {mobile,pixelRatio:Math.min(pixelRatio,1),shadows:false,shadowSize:512,staticShadows:true};
 if(mobile)return {mobile,pixelRatio:Math.min(pixelRatio,quality==='high'?1.35:1),shadows:true,shadowSize:quality==='high'?1024:512,staticShadows:quality!=='high'};
 return {mobile,pixelRatio:Math.min(pixelRatio,quality==='high'?2:1.6),shadows:true,shadowSize:quality==='high'?2048:1024,staticShadows:false};
}
// Touch pointers leave the DOM on finger-up. Releasing a camera/jump finger
// must not cancel another finger that still holds the movement joystick.
export function shouldClearPointerExit({pointerType,relatedTarget,buttons}){return pointerType==='mouse'&&relatedTarget===null&&!buttons;}
