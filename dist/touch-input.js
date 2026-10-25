// Pointer identities are independent: releasing the camera/jump finger must not
// release a held movement or run finger. Pure state is also regression tested.
export function createTouchInput(){
 const state={movePointer:null,runPointer:null,x:0,y:0,running:false};
 function move(id,x,y){if(id!==state.movePointer)return false;const n=Math.hypot(x,y);if(n<.1){state.x=state.y=0;}else{const strength=Math.min(1,(n-.1)/.9);state.x=x/n*strength;state.y=y/n*strength;}return true;}
 function beginMove(id,x=0,y=0){if(state.movePointer!==null)return false;state.movePointer=id;move(id,x,y);return true;}
 function beginRun(id){if(state.runPointer!==null)return false;state.runPointer=id;state.running=true;return true;}
 function end(id){if(id===state.movePointer){state.movePointer=null;state.x=state.y=0;}if(id===state.runPointer){state.runPointer=null;state.running=false;}}
 function reset(){state.movePointer=state.runPointer=null;state.x=state.y=0;state.running=false;}
 return {state,move,beginMove,beginRun,end,reset};
}
