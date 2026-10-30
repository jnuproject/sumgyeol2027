import * as THREE from './three.module.js';

// A nearby ground guide identifies the game boundary, without inventing fences
// on the real campus or hiding scenery outside the walking route.
export function addWalkBoundary(scene,area,heightAt){
 const edges=area.outline(.9),positions=edges.flatMap(edge=>edge.flatMap(([x,z])=>[x,heightAt(x,z)+.065,z]));
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{walker:{value:new THREE.Vector2()}},
  vertexShader:'varying vec2 groundPoint; void main(){groundPoint=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec2 walker;varying vec2 groundPoint;void main(){float alpha=(1.-smoothstep(3.,13.,distance(walker,groundPoint)))*.65;if(alpha<.015)discard;gl_FragColor=vec4(.38,.73,.80,alpha);}' });
 const line=new THREE.LineSegments(geometry,material);line.name='Nearby walking boundary';line.visible=false;scene.add(line);
 return {edges,update(x,z,visible){line.visible=visible;material.uniforms.walker.value.set(x,z);}};
}
