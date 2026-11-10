import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { join,resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
if(!process.env.TRAILQUEST_BROWSER_TOOLS)throw new Error('Set TRAILQUEST_BROWSER_TOOLS to the package.json of explicitly installed ephemeral Playwright/axe tools.');
const require=createRequire(resolve(process.env.TRAILQUEST_BROWSER_TOOLS));
const {chromium,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;

// Original tiny raster fixture: exercise fetch/blob decoding without live tiles.
function syntheticPng(){
  const chunk=(type,data)=>{const label=Buffer.from(type);const payload=Buffer.concat([label,data]);let crc=0xffffffff;for(const byte of payload){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}const size=Buffer.alloc(4),checksum=Buffer.alloc(4);size.writeUInt32BE(data.length);checksum.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([size,payload,checksum]);};
  const header=Buffer.alloc(13);header.writeUInt32BE(1,0);header.writeUInt32BE(1,4);header[8]=8;header[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.from([0,72,137,119,255]))),chunk('IEND',Buffer.alloc(0))]);
}

export async function run({origin,owner,artifacts,dashboard}){
  if(new URL(origin).hostname!=='localhost'||!artifacts.includes('trailquest-container-'))throw new Error('This helper is only for the isolated synthetic container smoke test.');
  const output=join(artifacts,'browser');await mkdir(output,{recursive:true});
  const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];const audits=[];
  try{
    const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1440,height:900}});
    let successfulTiles=false;
    await context.route('https://tile.openstreetmap.org/**',route=>successfulTiles
      ? route.fulfill({status:200,contentType:'image/png',headers:{'Access-Control-Allow-Origin':'*'},body:syntheticPng()})
      : route.fulfill({status:403,headers:{'Access-Control-Allow-Origin':'*'},body:'Synthetic provider unavailable'}));
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error'&&!message.text().includes('403 (Forbidden)'))errors.push(message.text());});
    await page.goto(origin);await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:join(output,'login-1440.png'),fullPage:true,animations:'disabled'});
    await page.getByLabel('Usuario',{exact:true}).fill(owner.username);await page.getByLabel('Contraseña',{exact:true}).fill(owner.password);await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Mi aventura',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Prueba',exact:true})).toHaveCount(0);
    for(const viewport of [{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]){
      await page.setViewportSize(viewport);
      for(const path of ['/passport','/health','/activities','/friends','/settings','/explore']){
        await page.goto(origin+path);await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);await page.mouse.move(0,0);
        const titles={'/passport':'Pasaportes','/health':'Salud','/activities':'Actividad','/friends':'Amistades','/settings':'Ajustes','/explore':'Explorar rutas'};
        await expect(page.getByRole('heading',{name:titles[path],exact:true})).toBeVisible();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width+1);
        await expect(page.getByRole('heading',{name:'No se ha podido abrir esta vista',exact:true})).toHaveCount(0);
        await page.screenshot({path:join(output,`${path.slice(1)}-${viewport.width}.png`),fullPage:true,animations:'disabled'});
        const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
        audits.push({path,viewport,violations:axe.violations.map(item=>({id:item.id,impact:item.impact,nodes:item.nodes.map(node=>({target:node.target,summary:node.failureSummary}))}))});
      }
    }
    await page.goto(origin+'/passport');await page.waitForLoadState('networkidle');
    const start=dashboard.currentJourney.definition.checkpoints.find(item=>item.distanceKm===0);
    await page.getByRole('button',{name:new RegExp(`${start.name}, inicio`)}).click();const place=page.getByRole('dialog',{name:start.name,exact:true});await expect(place).toBeVisible();
    const bounds=await place.boundingBox(),action=await place.getByRole('button',{name:'Compartir sello',exact:true}).boundingBox();expect(action.y+action.height).toBeLessThanOrEqual(bounds.y+bounds.height);
    await page.screenshot({path:join(output,'stamp-dialog-1440.png'),fullPage:false,animations:'disabled'});
    await place.getByRole('button',{name:'Compartir sello',exact:true}).click();const share=page.getByRole('dialog',{name:'Compartir',exact:true});await expect(share.getByRole('button',{name:'Publicar',exact:true})).toBeVisible();
    await page.screenshot({path:join(output,'personal-share-preview.png'),fullPage:false,animations:'disabled'});
    await share.getByRole('button',{name:'Publicar',exact:true}).click();await expect(share).toHaveCount(0);await expect(place).toHaveCount(0);
    await expect(page.locator('.toast')).toBeVisible();await page.mouse.move(0,0);await expect(page.locator('.toast')).toHaveCount(0,{timeout:7500});
    await page.goto(origin+'/settings');await page.waitForLoadState('networkidle');await page.getByText('Acerca de TrailQuest',{exact:true}).click();await expect(page.getByRole('link',{name:'Licencias y créditos'})).toBeVisible();
    const legal=await context.request.get(origin+'/licenses/index.html');expect(legal.status()).toBe(200);expect(await legal.text()).toContain('Hippocratic-2.1');
    successfulTiles=true;
    await page.goto(origin+'/activities');await page.waitForLoadState('networkidle');await page.locator('.activity-list .activity-record').first().click();
    await page.getByRole('dialog').getByRole('button',{name:'Abrir callejero',exact:true}).click();
    await expect(page.locator('.leaflet-tile-loaded[src^="blob:"]').first()).toBeVisible({timeout:15000});
    await page.screenshot({path:join(output,'synthetic-map-csp-1440.png'),fullPage:false,animations:'disabled'});await page.keyboard.press('Escape');
    await writeFile(join(output,'accessibility.json'),JSON.stringify(audits,null,2));await writeFile(join(output,'errors.json'),JSON.stringify(errors,null,2));
    const serious=audits.flatMap(item=>item.violations.filter(value=>['serious','critical'].includes(value.impact)).map(value=>({path:item.path,width:item.viewport.width,...value})));
    expect(serious).toEqual([]);expect(errors).toEqual([]);
    await writeFile(join(output,'summary.json'),JSON.stringify({browser:'Chrome',syntheticOnly:true,defaultDemoDisabled:true,interceptedTileFetchAndBlobImages:true,screenshots:22,axeChecks:audits.length,seriousViolations:serious,errors},null,2));
  }finally{await browser.close();}
}
