const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const nodes = new Map();
let openCount = 0;
const node = selector => {
  if (!nodes.has(selector)) nodes.set(selector, {
    innerHTML: '', textContent: '', events: {},
    addEventListener(type, fn) { this.events[type] = fn; },
    click() { if (selector === '#cart-open') openCount++; }
  });
  return nodes.get(selector);
};
const context = vm.createContext({
  document: { querySelector: node, querySelectorAll: () => [], addEventListener() {} },
  localStorage: { getItem() { return null; }, setItem() {} },
  location: { search: '' }, URLSearchParams, setTimeout,
});
context.window = context;
context.addEventListener = () => {};
for (const f of ['assets/catalogue.js', 'assets/panier.js', 'assets/services.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), context, { filename: f });
}
assert.equal((node('#sv-packs').innerHTML.match(/<article /g) || []).length, 5);
for (const total of ['10€', '16€', '23€', '32€', '84€']) {
  assert.ok(node('#sv-packs').innerHTML.includes(total), `Prix total absent : ${total}`);
  assert.ok(node('#sv-compare').innerHTML.includes(total), `Comparateur incohérent : ${total}`);
}
assert.equal((node('#sv-options').innerHTML.match(/data-service-add=/g) || []).length, 12);
assert.equal((node('#sv-accounts').innerHTML.match(/<article /g) || []).length, 2);
const packs = context.DKR.catalogue.packs;
assert.ok(packs[1].bonus.includes('Toutes les armes'));
assert.ok(packs[2].bonus.includes('Business'));
assert.ok(packs[3].bonus.includes('Tous déblocages'));
assert.ok(packs[4].compteNeuf);
function add(id) {
  node('main').events.click({ target: { closest() { return { dataset: { serviceAdd: id } }; } } });
}
add('bronze');
add('m20');
assert.equal(context.DKRPanier.liste().length, 2);
assert.equal(context.DKRPanier.sousTotal(), 13);
assert.equal(context.DKRPanier.totalAvecCommission().total, 16);
assert.equal(context.DKR.prixAvecCommission(21), 26);
assert.equal(context.DKR.prixAvecCommission(42), 51);
assert.equal(context.DKR.prixAvecCommission(92), 111);
assert.equal(context.DKR.prixAvecCommission(109), 131);
context.DKRPanier.vider();
add('cherax-standard'); add('cherax-standard');
assert.equal(context.DKRPanier.totalAvecCommission().total, 52);
assert.equal(context.DKRPanier.totalAvecCommission().com, 10);
assert.equal(openCount, 4);
assert.ok(node('#sv-feedback').textContent.includes('Cherax'));
assert.ok(!node('#sv-packs').innerHTML.includes('data-service-add="cherax'));
assert.ok(node('#sv-accounts').innerHTML.includes('<strong>20€</strong>'));
assert.ok(node('#sv-accounts').innerHTML.includes('<strong>27€</strong>'));
assert.ok(node('#sv-accounts').innerHTML.includes('30M GTA$ + RP 120 + stats max'));
context.DKRPanier.vider();
context.DKRPanier.ajouter('compte-simple');
assert.equal(context.DKRPanier.totalAvecCommission().total, 20);
context.DKRPanier.ajouter('bronze');
assert.equal(context.DKRPanier.totalAvecCommission().total, 30);
context.DKRPanier.vider();
context.DKRPanier.ajouter('compte-complet');
assert.equal(context.DKRPanier.totalAvecCommission().total, 27);
console.log('OK : 5 packs, 12 options, 2 comptes, comparateur et panier partagé et prix entiers (2 × Cherax Standard = 52 €).');
