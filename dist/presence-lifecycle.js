// A hidden page leaves immediately; a visible but unfocused window gets a short grace period.
export function bindPresenceLifecycle({onEnter,onLeave,doc=document,win=window,delay=5000,setTimer=setTimeout,clearTimer=clearTimeout}){
 let disposed=false,visiblePage=true,online=win.navigator?.onLine!==false,timer=null,blurExpired=false;
 let focused=doc.hasFocus?.()??true,active=null;
 const clear=()=>{if(timer!==null)clearTimer(timer);timer=null;};
 function sync(){
  if(disposed)return;
  const next=visiblePage&&!doc.hidden&&online&&!blurExpired;
  if(next===active)return;active=next;(next?onEnter:onLeave)();
 }
 function scheduleBlur(){clear();timer=setTimer(()=>{timer=null;blurExpired=true;sync();},delay);}
 const blur=()=>{focused=false;scheduleBlur();};
 const focus=()=>{focused=true;blurExpired=false;clear();sync();};
 const visibility=()=>{
  clear();focused=doc.hasFocus?.()??true;
  if(doc.hidden){sync();return;}
  blurExpired=!focused;sync();
 };
 const pagehide=()=>{visiblePage=false;clear();sync();};
 const pageshow=()=>{visiblePage=true;visibility();};
 const offline=()=>{online=false;sync();};
 const onlineEvent=()=>{online=true;sync();};
 const freeze=()=>{visiblePage=false;clear();sync();};
 const resume=()=>{visiblePage=true;visibility();};
 const events=[[win,'blur',blur],[win,'focus',focus],[win,'pagehide',pagehide],[win,'pageshow',pageshow],[win,'offline',offline],[win,'online',onlineEvent],[doc,'visibilitychange',visibility],[doc,'freeze',freeze],[doc,'resume',resume]];
 for(const [target,event,handler]of events)target.addEventListener(event,handler);
 blurExpired=!focused;sync();
 return {get active(){return active===true;},dispose(){disposed=true;clear();for(const [target,event,handler]of events)target.removeEventListener(event,handler);}};
}
