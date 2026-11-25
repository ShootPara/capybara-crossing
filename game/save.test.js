import assert from 'node:assert/strict';
import test from 'node:test';
import {code,decode} from './save.js';
test('every checkpoint round trips and rejects single digit edits',()=>{
 for(let n=0;n<=48;n++){
  const s=code(n).replace('-','');assert.equal(decode(s),n);
  for(let i=0;i<s.length;i++)for(const d of '0123456789')if(d!==s[i])assert.equal(decode(s.slice(0,i)+d+s.slice(i+1)),null);
 }
 assert.equal(decode('100-AA'),0);assert.equal(decode('bad'),null);
});
