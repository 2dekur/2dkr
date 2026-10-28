const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let now=Date.parse('2026-10-28T12:00:00+01:00');
class Clock extends Date { static now(){return now;} }
const c=vm.createContext({Date:Clock,document:{addEventListener(){},querySelectorAll(){return[];}},localStorage:{getItem(){return null;},setItem(){}},location:{search:''},URLSearchParams});
c.window=c;c.addEventListener=()=>{};
for(const f of ['assets/catalogue.js','assets/panier.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const d=c.DKR,p=c.DKRPanier;
assert.equal(d.halloweenActif(Date.parse('2026-10-31T23:59:59+01:00')),true);
assert.equal(d.halloweenActif(Date.parse('2026-11-01T00:00:00+01:00')),false);
assert.equal(d.halloweenActif(Date.parse('2026-10-24T20:00:00Z')),false);
assert.deepEqual(Array.from(d.catalogue.packs,x=>d.prixFinalArticle(x)),[9,14,20,28,75]);
assert.deepEqual(Array.from(d.catalogue.comptes,x=>d.prixFinalArticle(x)),[24,18]);
assert.deepEqual(Array.from(d.catalogue.menus,x=>d.prixFinalArticle(x)),[26,51,111,131]);
p.ajouter('bronze');p.ajouter('cherax-standard');
assert.equal(p.totalAvecCommission().total,35);
assert.equal(p.totalAvecCommission().reductionHalloween,1);
now=Date.parse('2026-11-01T00:00:00+01:00');
assert.equal(p.totalAvecCommission().total,36);
assert.equal(p.totalAvecCommission().reductionHalloween,0);
assert.deepEqual(Array.from(d.catalogue.packs,x=>d.prixFinalArticle(x)),[10,16,23,32,84]);
for(const name of ['index','boutique','services','commande','conditions','avis','paiements','404']){
 const html=fs.readFileSync(path.join(root,name+'.html'),'utf8');
 assert.ok(html.includes('assets/halloween.css'));
 assert.ok(html.includes('assets/halloween.js'));
}
console.log('OK : dates Paris, remise services/comptes, menus inchangés, panier mixte et retour normal à minuit ; thème présent sur les 8 pages.');
