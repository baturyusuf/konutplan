import {DEFAULTS,FIELDS,evaluate,dateOffset,normalize} from './engine.mjs';
let state=normalize(DEFAULTS);
let tab='income';
let comparison=[];
const $=(id)=>document.getElementById(id);
const currencies={TRY:'₺',USD:'$',EUR:'€'};
const fmt=n=>Number(n).toLocaleString('tr-TR',{maximumFractionDigits:0});
const money=n=>`${currencies[state.currency]}${fmt(n)}`;
const shorter=n=>Math.abs(n)>=1e6?`${(n/1e6).toLocaleString('tr-TR',{maximumFractionDigits:2})} Mn ${currencies[state.currency]}`:money(n);
const percent=n=>`%${Number(n).toLocaleString('tr-TR',{maximumFractionDigits:2})}`;
const duration=n=>n===null||n===undefined?'Ulaşılamadı':n===0?'Bugün':`${fmt(n)} ay`;
const fields={
 salary:{name:'Aylık net maaş',step:1000,note:'Bankanın gelir hesabında yalnızca bu maaş kullanılır.'},
 expenses:{name:'Aylık yaşam giderleri',step:1000},
 savings:{name:'Mevcut birikim',step:10000},
 goldAllocation:{name:'Birikimin altında tutulan payı',step:5,kind:'percent',note:'Altın değeri ayrı artış varsayımıyla hesaplanır.'},
 freelance:{name:'Aylık net ek iş geliri',step:2500,note:'Bankanın kredi onayı hesabına eklenmez.'},
 freelanceDelay:{name:'Ek gelirin başlayacağı ay',step:1,kind:'months'},
 freelanceConfidence:{name:'Planlamada sayılacak ek gelir oranı',step:5,kind:'percent',note:'Örneğin %50, düzensiz gelir riskine karşı yalnızca yarısını sayar.'},
 freelanceHours:{name:'Haftalık ek iş saati',step:1,kind:'hours',note:'Bilgilendirme amaçlı; gelir otomatik tahmin edilmez.'},
 housePrice:{name:'Evin satış fiyatı',step:50000},
 mortgage:{name:'Konut kredisi tutarı',step:50000},
 monthlyRate:{name:'Aylık kredi faizi',step:0.05,kind:'percent',note:'Bankadan güncel teklif alıp oranı kendiniz girin.'},
 mortgageYears:{name:'Konut kredisi vadesi',step:1,kind:'years'},
 maxDebtToIncome:{name:'Bankanın kabul edeceği taksit / maaş üst sınırı',step:5,kind:'percent',note:'Yasal garanti değil; bankanın uygulaması değişebilir.'},
 maxLtv:{name:'Azami kredi / ekspertiz oranı',step:5,kind:'percent',note:'Konut türüne, enerji sınıfına, sahiplik durumuna göre değişebilir.'},
 appraisalRatio:{name:'Ekspertiz / satış fiyatı oranı',step:5,kind:'percent'},
 privateDebt:{name:'Yakın çevreden alınacak faizsiz borç',step:25000,note:'Borç, ev satın alınacağı tarihte alınır.'},
 privateMonths:{name:'Özel borç geri ödeme süresi',step:1,kind:'months'},
 rent:{name:'Aylık brüt kira',step:1000},
 usableRentPercent:{name:'Kiranın kullanılabilir kabul edilen payı',step:5,kind:'percent',note:'Vergi, boş kalma ve bakım riskine karşı iskontodur.'},
 occupancy:{name:'Öngörülen doluluk oranı',step:5,kind:'percent'},
 earlyRepaymentPercent:{name:'Fazla nakdin erken kredi ödemesine ayrılan payı',step:10,kind:'percent'},
 monthlyBuffer:{name:'Aylık elde tutulacak nakit tampon',step:1000},
 transactionFees:{name:'Alım masrafları / konut fiyatı',step:0.5,kind:'percent'},
 reserve:{name:'Satın alma sonrasında korunacak rezerv',step:25000},
 salaryGrowth:{name:'Yıllık maaş değişimi',step:1,kind:'percent'},
 expenseGrowth:{name:'Yıllık gider değişimi',step:1,kind:'percent'},
 houseGrowth:{name:'Yıllık ev fiyatı değişimi',step:1,kind:'percent'},
 goldGrowth:{name:'Yıllık altın değer değişimi',step:1,kind:'percent'}
};
const groups={
 income:[{heading:'Aylık bütçeniz',caption:'Gelir, gider ve mevcut birikiminizi belirleyin.',keys:['salary','expenses','savings','goldAllocation']},{heading:'Esnek ek iş geliri',caption:'Düzensiz freelance gelir için temkinli bir plan oluşturun.',keys:['freelance','freelanceDelay','freelanceConfidence','freelanceHours']}],
 house:[{heading:'Satın alınacak konut',caption:'Fiyat ve kredi kullanılabilirliğini belirleyin.',keys:['housePrice','creditEligible']},{heading:'Banka konut kredisi',caption:'5–10 yıl vade, aylık faiz ve kredi üst sınırları.',keys:['mortgage','monthlyRate','mortgageYears','maxDebtToIncome','maxLtv','appraisalRatio']}],
 debt:[{heading:'Özel borç',caption:'Faizsiz borç ve geri ödeme planı.',keys:['privateDebt','privateMonths']},{heading:'Kiraya verme',caption:'Kira yalnızca satın alma sonrasında gelir sayılır.',keys:['rented','rent','usableRentPercent','occupancy']},{heading:'Erken kredi kapatma',caption:'Aylık güvenlik tamponundan sonra kalan tutar kullanılır.',keys:['earlyRepaymentPercent','monthlyBuffer']}],
 risk:[{heading:'Satın alma masrafları ve güvenlik',caption:'Tapu, komisyon, diğer masraflar ve acil durum rezervi.',keys:['transactionFees','reserve']},{heading:'Yıllık değişim varsayımları',caption:'Oranların tümü senaryodur; fiyatlar nominal değerlerle modellenir.',keys:['salaryGrowth','expenseGrowth','houseGrowth','goldGrowth']}]
};
function formatValue(k,v){const kind=fields[k].kind;return kind==='percent'?percent(v):kind==='years'?`${fmt(v)} yıl`:kind==='months'?`${fmt(v)} ay`:kind==='hours'?`${fmt(v)} saat`:money(v)}
function renderControls(){
 const html=groups[tab].map(group=>`<div class="field-group"><h3>${group.heading}</h3><p>${group.caption}</p></div>${group.keys.map(key=>{
   if(key==='creditEligible'||key==='rented'){
     let label=key==='creditEligible'?'Konut bankadan kredi çekmeye uygun':'Satın alınan ev kiraya verilecek';
     let help=key==='creditEligible'?'Kapalıysa banka kredisi kullanılmaz.':'Kapalıysa kira katkısı sıfırdır.';
     return `<div class="toggle-field"><label for="c-${key}">${label}<small>${help}</small></label><input id="c-${key}" type="checkbox" data-key="${key}" ${state[key]?'checked':''}></div>`;
   }
   if(!state.creditEligible&&['mortgage','monthlyRate','mortgageYears','maxDebtToIncome','maxLtv','appraisalRatio'].includes(key))return '';
   if(!state.rented&&['rent','usableRentPercent','occupancy'].includes(key))return '';
   const f=fields[key],range=FIELDS[key];
   return `<div class="field"><div class="field-head"><label for="n-${key}">${f.name}</label><input id="n-${key}" data-key="${key}" data-type="number" class="numeric-input" type="number" min="${range[0]}" max="${range[1]}" step="${f.step}" value="${state[key]}" aria-label="${f.name}"></div><input class="range" data-key="${key}" data-type="range" type="range" min="${range[0]}" max="${range[1]}" step="${f.step}" value="${state[key]}" aria-label="${f.name} kaydırıcı"><div class="range-limits"><span>${formatValue(key,range[0])}</span><span>${formatValue(key,range[1])}</span></div>${f.note?`<div class="field-help">${f.note}</div>`:''}</div>`;
 }).join('')}`).join('');
 $('panel-fields').innerHTML=html;
 $('panel-fields').setAttribute('aria-labelledby','tab-'+tab);
 document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false');b.tabIndex=active?0:-1;});
}
let toastTimeout;
function toast(message){const t=$('toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.remove('visible'),3500)}
function setText(id,value,cls=''){const node=$(id);node.textContent=value;node.classList.toggle('danger-value',cls==='danger');node.classList.toggle('success-value',cls==='success')}
function rows(items){return items.map(([label,value,isDanger])=>`<div class="detail-row"><span>${label}</span><strong class="${isDanger?'danger-value':''}">${value}</strong></div>`).join('')}
function graph(res){
 const data=res.timeline.filter(d=>d.month<=60);
 const width=960,height=285,pl=64,pr=15,pt=25,pb=34;
 const w=width-pl-pr,h=height-pt-pb;
 let maxValue=Math.max(1,...data.flatMap(x=>[x.savings,x.target]))*1.12;
 const sx=m=>pl+w*m/60;
 const sy=v=>pt+h*(1-v/maxValue);
 const build=key=>data.map((d,i)=>(i?'L':'M')+sx(d.month).toFixed(1)+' '+sy(Math.max(0,d[key])).toFixed(1)).join(' ');
 const grid=[0,.25,.5,.75,1].map(fr=>`<line x1="${pl}" x2="${width-pr}" y1="${sy(maxValue*fr)}" y2="${sy(maxValue*fr)}" stroke="#e9eef0" stroke-dasharray="4 4"/><text x="${pl-11}" y="${sy(maxValue*fr)+4}" text-anchor="end">${(maxValue*fr/1000000).toLocaleString('tr-TR',{maximumFractionDigits:1})} Mn</text>`).join('');
 const xlabel=[0,12,24,36,48,60].map(m=>`<text x="${sx(m)}" y="${height-5}" text-anchor="middle">${m===0?'Bugün':m+' ay'}</text>`).join('');
 const buy=res.purchase?.month;
 const marker=buy!==undefined&&buy<=60?`<line x1="${sx(buy)}" x2="${sx(buy)}" y1="${pt}" y2="${pt+h}" stroke="#7da69d" stroke-dasharray="4 4"/><text x="${Math.min(width-100,Math.max(80,sx(buy)+8))}" y="${pt+15}" fill="#147f70">Alım: ${buy} ay</text>`:'';
 $('chart').innerHTML=`<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${grid}${xlabel}${marker}<path d="${build('target')}" stroke="#f0aa63" stroke-width="3.5" fill="none" stroke-linejoin="round"/><path d="${build('savings')}" stroke="#147f70" stroke-width="3.5" fill="none" stroke-linejoin="round"/></svg>`;
}
function recalc(){
 const e=evaluate(state),b=e.purchase,c=e.cashflow,r=e.repayment;
 setText('kpiPurchase',duration(b?.month));
 setText('kpiPurchaseNote',b?dateOffset(b.month):'240 ay içinde uygun alım yok');
 setText('kpiGap',shorter(e.shortageNow));
 setText('kpiNet',c?shorter(c.monthlyNet):'—',c&&c.monthlyNet<0?'danger':'');
 setText('kpiFree',r?duration(r.calendarMonths):'—');
 setText('purchaseCash',money(e.neededNow));
 const progress=e.neededNow===0?100:Math.max(0,Math.min(100,state.savings/e.neededNow*100));
 setText('progressPct',percent(progress));$('progressBar').style.width=progress+'%';
 setText('monthMortgage',money(e.installment));setText('monthPrivate',money(e.personalPayment));setText('monthRent',money(e.rentCounted));
 setText('monthNet',c?money(c.monthlyNet):'—',c&&c.monthlyNet<0?'danger':'');
 setText('monthStress',c?money(c.stressNet):'—',c&&c.stressNet<0?'danger':'success');
 const bankInfo=state.creditEligible?`Tahmini kredi üst sınırları (bugünkü koşullar): maaşa göre <b>${money(e.bankLimitNow)}</b>, ekspertize göre <b>${money(e.ltvLimitNow)}</b>. Freelance ve gelecekteki kira dahil değil.`:'Bu konut banka kredisine uygun değil; hesap yalnızca nakit ve özel borçla yapılır.';
 $('bankInfo').innerHTML=bankInfo;
 const risk=$('riskBanner');risk.className='risk-banner';
 let title='Gelir kesintilerine karşı planınızı test edin',detail='Maaş, kira ve freelance tutarlarını değiştirerek farklı olasılıkları karşılaştırın.';
 if(e.errors.length){risk.classList.add('danger');title='Finansman koşullarında uyarı';detail=e.errors.join(' ');}
 else if(!b){risk.classList.add('warning');title='Öngörülen sürede satın alma koşulu sağlanmıyor';detail='Birikim, ev fiyatı, banka kredi/değer sınırı veya taksit/gelir koşullarını inceleyin.';}
 else if(c?.stressNet<0||r?.insolvency!==null){risk.classList.add('danger');title='Aylık nakit akışında yüksek risk';detail=`Kira ve ek gelir olmadan aylık ${money(c.stressNet)} kalıyor. ${r?.insolvency?`Rezerv simülasyonda ${r.insolvency}. ayda tükeniyor.`:''}`;}
 else if(c?.stressNet<state.monthlyBuffer){risk.classList.add('warning');title='Nakit tamponunuz dar';detail=`Kira ve ek gelir olmadan ayda ${money(c.stressNet)} kalıyor. Beklenmedik giderleri ayrıca değerlendirin.`;}
 else{title='Stres testinde pozitif nakit akışı';detail=`Kira ve ek gelir sıfır olsa da ayda yaklaşık ${money(c.stressNet)} kalıyor. Kredi için banka onayı ayrıca gerekir.`;}
 setText('riskTitle',title);setText('riskDetail',detail);setText('riskIcon',risk.classList.contains('danger')?'!':risk.classList.contains('warning')?'!':'✓');
 graph(e);
 const noExtra=evaluate({...state,freelance:0}),noPrivate=evaluate({...state,privateDebt:0});
 setText('comparisonCurrent',duration(b?.month));setText('comparisonNoFreelance',duration(noExtra.purchase?.month));setText('comparisonNoDebt',duration(noPrivate.purchase?.month));
 $('purchaseBreakdown').innerHTML=rows([
  ['Konut fiyatı',money(state.housePrice)],['Alım masrafları',money(e.purchaseCost-state.housePrice)],
  ['Konut kredisi',`− ${money(e.loan)}`],['Özel borç',`− ${money(state.privateDebt)}`],
  ['Korunacak rezerv',money(state.reserve)],['Gerekli özkaynak',money(e.neededNow)]]);
 $('creditBreakdown').innerHTML=rows([
  ['Konut kredisi vadesi',`${state.mortgageYears} yıl`],['Kredi taksiti',money(e.installment)],
  ['Vade sonuna dek faiz',money(e.fullInterest)],['Özel borç taksiti',money(e.personalPayment)],
  ['Erken ödeme ile kapanış',r?duration(r.mortgageMonths):'—'],['Tahmini erken ödemeli faiz',r?money(r.interestPaid):'—']
 ])+'<p class="detail-foot">Erken kapama cezası ve bankanın ek masrafları dahil değildir.</p>';
 $('stressBreakdown').innerHTML=rows([
  ['Freelance olmadan',b?money(b.salary+c.rent-c.expenses-e.installment-e.personalPayment):'—'],
  ['Kira olmadan',b?money(c.salary+c.freelance-c.expenses-e.installment-e.personalPayment):'—'],
  ['İkisi de olmadan',b?money(c.stressNet):'—',c?.stressNet<0],
  ['Rezerv eşiği aşımı',r?.reserveBreach?`${r.reserveBreach}. ay`:'Yok'],
  ['Nakdin tükenmesi',r?.insolvency?`${r.insolvency}. ay`:'Gözlenmedi'],
  ['Borçsuz mülkiyet',r?dateOffset(r.calendarMonths):'—']
 ])+'<p class="detail-foot">Birikim ayda bir güncellenir. Kira tutarına yalnızca satın alma sonrası katkı eklenir.</p>';
}
function renderComparisons(){
 if(!comparison.length){$('scenarioList').innerHTML='<p class="empty-message">Bir plan eklediğinizde karşılaştırma burada görünecek.</p>';return;}
 $('scenarioList').innerHTML=comparison.map((item,i)=>{
   const e=evaluate(item.state),c=e.cashflow;
   return `<article class="scenario-card"><strong>Plan ${i+1}</strong><button type="button" data-remove="${i}" title="Planı kaldır" aria-label="Plan ${i+1} kaldır">×</button>
   <div><span>Konut fiyatı</span><b>${moneyWith(item.state,item.state.housePrice)}</b></div>
   <div><span>Eve giriş</span><b>${duration(e.purchase?.month)}</b></div>
   <div><span>Aylık kredi</span><b>${moneyWith(item.state,e.installment)}</b></div>
   <div><span>Özel borç taksiti</span><b>${moneyWith(item.state,e.personalPayment)}</b></div>
   <div><span>Aylık net</span><b>${c?moneyWith(item.state,c.monthlyNet):'—'}</b></div>
   <div><span>Borçsuz mülkiyet</span><b>${duration(e.repayment?.calendarMonths)}</b></div></article>`;
 }).join('');
}
function moneyWith(st,n){return currencies[st.currency]+fmt(n)}
$('panel-fields').addEventListener('input',ev=>{
 const input=ev.target,k=input.dataset.key;if(!k)return;
 if(input.type==='checkbox'){state[k]=input.checked;renderControls();recalc();return;}
 if(input.value.trim()==='')return;
 const bounds=FIELDS[k],raw=Number(input.value);if(!Number.isFinite(raw))return;
 const v=Math.max(bounds[0],Math.min(bounds[1],raw));state[k]=v;
 document.querySelectorAll(`[data-key="${k}"]`).forEach(node=>{if(node!==input)node.value=String(v)});
 recalc();
});
$('panel-fields').addEventListener('change',ev=>{
 const input=ev.target;if(input.dataset.type==='number'){input.value=String(state[input.dataset.key])}
});
document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{tab=btn.dataset.tab;renderControls()}));
$('currency').addEventListener('change',ev=>{state.currency=ev.target.value;renderControls();recalc();renderComparisons();toast('Para birimi etiketi değişti; tutarlar kurdan çevrilmez.')});
$('resetBtn').addEventListener('click',()=>{state=normalize(DEFAULTS);comparison=[];tab='income';$('currency').value=state.currency;renderControls();recalc();renderComparisons();toast('Örnek ayarlar yüklendi. Cihazda saklanan kayıt değiştirilmedi.')});
$('addScenarioBtn').addEventListener('click',()=>{if(comparison.length===3){toast('En fazla 3 senaryo eklenebilir; önce birini kaldırın.');return;}comparison.push({state:{...state}});renderComparisons();toast('Plan karşılaştırmaya eklendi.')});
$('scenarioList').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(!b)return;comparison.splice(Number(b.dataset.remove),1);renderComparisons()});
$('clearCompareBtn').addEventListener('click',()=>{comparison=[];renderComparisons();toast('Karşılaştırma temizlendi.')});
const STORAGE_KEY='konutplan:preferences:v1';
$('saveLocalBtn').addEventListener('click',()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));toast('Plan yalnızca bu tarayıcıya kaydedildi.')}catch{toast('Tarayıcı yerel kayda izin vermedi.')}});
$('loadLocalBtn').addEventListener('click',()=>{try{const saved=localStorage.getItem(STORAGE_KEY);if(!saved){toast('Bu cihazda kayıt bulunamadı.');return;}state=normalize(JSON.parse(saved));$('currency').value=state.currency;renderControls();recalc();toast('Yerel kayıt yüklendi.')}catch{toast('Kayıt okunamadı.')}});
$('deleteLocalBtn').addEventListener('click',()=>{try{localStorage.removeItem(STORAGE_KEY);toast('Bu sitenin yerel ayar kaydı silindi.')}catch{toast('Yerel kayıt temizlenemedi.')}});
$('exportBtn').addEventListener('click',()=>{
 const data=JSON.stringify({application:'KonutPlan',version:1,settings:state},null,2);
 const blob=new Blob([data],{type:'application/json;charset=utf-8'});
 const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download='konutplan-senaryo.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),500);
 toast('Plan JSON dosyası indirildi. Dosya kişisel finansal değerler içerebilir.');
});
$('currency').value=state.currency;renderControls();recalc();renderComparisons();
