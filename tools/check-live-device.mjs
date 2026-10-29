// Verificação física opt-in. Não participa de npm test, Playwright ou build.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

if(!process.argv.includes('--read-usb')){
  console.log('Use node tools/check-live-device.mjs --read-usb para ler o aparelho real.');
  process.exit(0);
}
const base='http://127.0.0.1:3000';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1080}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await page.getByRole('button',{name:'Conectar teclado',exact:true}).click();
  await page.getByText('Teclado conectado',{exact:true}).waitFor({timeout:30000});
  await mkdir('.runtime',{recursive:true});
  await page.screenshot({path:'.runtime/real-web-connected.png',fullPage:true,animations:'disabled'});
  async function request(command){
    const response=await page.request.post(base+'/api/device',{data:command});
    const result=await response.json();if(!response.ok())throw new Error(result.error);return result;
  }
  const state=await request({operation:'read'});
  // O perfil vem dessa mesma leitura: o serviço detecta zero mudanças e não envia FD.
  const applied=await request({operation:'apply',profile:state.profile,revision:state.revision});
  if(applied.message!=='O mapeamento já está atualizado.')throw new Error('A verificação sem alterações não devolveu o resultado esperado.');
  const exported=await request({operation:'backup_export',revision:applied.revision});
  const summary={browserConnected:true,identity:state.identity,layerLengths:state.profile.layers.map(layer=>layer.length),mapping:applied.message,
    rawReports:Object.values(exported.backup.files).reduce((n,hex)=>n+hex.length/2/65,0),consoleErrors:errors,configurationChanges:false,ledSent:false};
  await writeFile('.runtime/web-usb-verification.json',JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary));
  if(errors.length||summary.rawReports!==72)process.exitCode=1;
}finally{await browser.close();}
