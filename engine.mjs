/** Deterministic, dependency-free housing finance calculations. No network calls. */
export const DEFAULTS = Object.freeze({
  currency:'TRY', salary:70000, expenses:30000, savings:250000, goldAllocation:50,
  housePrice:3000000, creditEligible:true, mortgage:1100000, monthlyRate:2.6,
  mortgageYears:10, maxDebtToIncome:45, maxLtv:80, appraisalRatio:100,
  privateDebt:200000, privateMonths:24, freelance:0, freelanceDelay:3, freelanceConfidence:50,
  freelanceHours:18, rented:true, rent:16000, usableRentPercent:50, occupancy:90,
  transactionFees:5, reserve:200000, salaryGrowth:0, expenseGrowth:0,
  houseGrowth:0, goldGrowth:0, earlyRepaymentPercent:50, monthlyBuffer:10000,
  maxForecastMonths:240
});
export const FIELDS = {
  salary:[0,500000],expenses:[0,300000],savings:[0,15000000],goldAllocation:[0,100],
  housePrice:[100000,30000000],mortgage:[0,20000000],monthlyRate:[0,7],mortgageYears:[5,10],
  maxDebtToIncome:[10,80],maxLtv:[0,100],appraisalRatio:[40,130],privateDebt:[0,10000000],
  privateMonths:[1,60],freelance:[0,250000],freelanceDelay:[0,36],freelanceConfidence:[0,100],
  freelanceHours:[1,60],rent:[0,200000],usableRentPercent:[0,100],occupancy:[0,100],
  transactionFees:[0,15],reserve:[0,5000000],salaryGrowth:[-20,100],expenseGrowth:[-20,100],
  houseGrowth:[-30,100],goldGrowth:[-50,100],earlyRepaymentPercent:[0,100],monthlyBuffer:[0,150000]
};
export function normalize(input={}){
 const s={...DEFAULTS};
 for(const [k,[min,max]] of Object.entries(FIELDS)){
   const n=Number(input[k]); if(input[k]!==undefined && input[k]!==null && Number.isFinite(n))s[k]=Math.min(max,Math.max(min,n));
 }
 for(const k of ['creditEligible','rented'])if(typeof input[k]==='boolean')s[k]=input[k];
 if(['TRY','USD','EUR'].includes(input.currency))s.currency=input.currency;
 for(const k of ['mortgageYears','privateMonths','freelanceDelay','maxForecastMonths'])s[k]=Math.round(s[k]);
 return s;
}
export function annualFactor(rate,months){return Math.pow(1+rate/100,months/12)}
export function payment(principal,monthlyPercent,termMonths){
 if(principal<=0)return 0;
 const n=Math.max(1,termMonths),r=monthlyPercent/100;
 return r===0?principal/n:principal*r/(1-Math.pow(1+r,-n));
}
export function dateOffset(months,reference=new Date()){
 const d=new Date(reference.getFullYear(),reference.getMonth()+Math.round(months),1);
 return d.toLocaleDateString('tr-TR',{month:'long',year:'numeric'});
}
function futureSalary(s,m){return s.salary*annualFactor(s.salaryGrowth,m)}
function futureExpenses(s,m){return s.expenses*annualFactor(s.expenseGrowth,m)}
function freelance(s,m){return m>s.freelanceDelay?s.freelance*s.freelanceConfidence/100:0}
function rentValue(s){return s.rented?s.rent*s.usableRentPercent/100*s.occupancy/100:0}
export function evaluate(raw){
 const s=normalize(raw),loan=s.creditEligible?s.mortgage:0;
 const loanMonths=s.mortgageYears*12, installment=payment(loan,s.monthlyRate,loanMonths);
 const personalPayment=s.privateDebt/s.privateMonths;
 const capNow=payment(1,s.monthlyRate,loanMonths);
 const bankLimitNow=capNow>0?s.salary*s.maxDebtToIncome/100/capNow:0;
 const ltvLimitNow=s.housePrice*s.appraisalRatio/100*s.maxLtv/100;
 const rentCounted=rentValue(s);
 const purchaseCost=s.housePrice*(1+s.transactionFees/100);
 const neededNow=Math.max(0,purchaseCost+s.reserve-loan-s.privateDebt);
 const shortageNow=Math.max(0,neededNow-s.savings);
 let cash=s.savings*(1-s.goldAllocation/100),gold=s.savings*s.goldAllocation/100;
 const timeline=[];let purchase=null;
 for(let m=0;m<=s.maxForecastMonths;m++){
   const house=s.housePrice*annualFactor(s.houseGrowth,m);
   const closing=house*(1+s.transactionFees/100);
   const target=Math.max(0,closing+s.reserve-loan-s.privateDebt);
   const creditLimit=house*s.appraisalRatio/100*s.maxLtv/100;
   const salaryLimit=futureSalary(s,m)*s.maxDebtToIncome/100;
   const bankOk=!loan || (installment<=salaryLimit+0.00001 && loan<=creditLimit+0.00001);
   const freeCash=cash+gold;
   if(m%3===0||m===s.maxForecastMonths)timeline.push({month:m,savings:freeCash,target,home:house});
   if(!purchase&&freeCash>=target-0.01&&bankOk&&loan<=house+0.01&&loan+s.privateDebt<=closing+0.01){
      purchase={month:m,house,closing,target,savings:freeCash,salary:futureSalary(s,m),balanceAfter:freeCash+loan+s.privateDebt-closing};
      // Do not break, preserve timeline for display.
   }
   if(m===s.maxForecastMonths)break;
   gold*=annualFactor(s.goldGrowth,1);
   cash+=futureSalary(s,m+1)-futureExpenses(s,m+1)+freelance(s,m+1);
 }
 const errors=[];
 if(loan>0 && !s.creditEligible)errors.push('Bu konutta banka kredisi kullanılamıyor.');
 if(loan>ltvLimitNow+0.01)errors.push('Kredi tutarı bugünkü ekspertiz / kredi-değer sınırını aşıyor.');
 if(installment>s.salary*s.maxDebtToIncome/100+0.01)errors.push('Kredi taksiti bugünkü maaş / taksit sınırını aşıyor.');
 if(loan+s.privateDebt>purchaseCost+0.01)errors.push('İki borcun toplamı satın alma bedeli ve masraflarından fazla.');
 if(s.salary<=s.expenses && s.freelance===0 && !purchase)errors.push('Aylık tasarruf kapasitesi sıfır veya negatif.');
 let cashflow=null,repayment=null;
 if(purchase){
   const m=purchase.month;
   const sal=purchase.salary, exp=futureExpenses(s,m), gig=freelance(s,m);
   const standard=sal+gig+rentCounted-exp-installment-personalPayment;
   const noRentNoGig=sal-exp-installment-personalPayment;
   cashflow={salary:sal,expenses:exp,freelance:gig,rent:rentCounted,installment,personalPayment,monthlyNet:standard,stressNet:noRentNoGig,afterPersonal:sal+gig+rentCounted-exp-installment};
   repayment=simulateRepayment(s,purchase,loan,installment,rentCounted);
 }
 return {s,loan,installment,personalPayment,bankLimitNow,ltvLimitNow,rentCounted,purchaseCost,neededNow,shortageNow,
  timeline,purchase,cashflow,repayment,errors,fullInterest:Math.max(0,installment*loanMonths-loan)};
}
export function simulateRepayment(s,purchase,loan,installment,rentCounted){
 let balance=loan, liquid=Math.max(0,purchase.balanceAfter),interest=0,payoff=loan===0?0:null,
 debtFree=null,reserveBreach=null,insolvency=null;
 const trajectory=[];
 const r=s.monthlyRate/100;
 const horizon=Math.max(s.mortgageYears*12,s.privateMonths)+24;
 for(let k=1;k<=horizon;k++){
   const m=purchase.month+k;
   const personal=k<=s.privateMonths?s.privateDebt/s.privateMonths:0;
   const i=balance*r;interest+=i;
   const scheduled=Math.min(balance+i,installment);
   balance=Math.max(0,balance+i-scheduled);
   const inflow=futureSalary(s,m)+freelance(s,m)+rentCounted;
   const outflow=futureExpenses(s,m)+personal+scheduled;
   let leftover=inflow-outflow;
   // Prioritize restoring emergency savings before discretionary early mortgage repayment.
   let extra=0;
   if(balance>0 && liquid>=s.reserve && leftover>s.monthlyBuffer){
     extra=Math.min(balance,(leftover-s.monthlyBuffer)*s.earlyRepaymentPercent/100);
     balance-=extra;leftover-=extra;
   }
   liquid+=leftover;
   if(liquid<s.reserve && reserveBreach===null)reserveBreach=k;
   if(liquid<0&&insolvency===null)insolvency=k;
   if(balance<=0.005 && payoff===null)payoff=k;
   if(k%3===0||k===1)trajectory.push({month:k,balance:Math.max(0,balance),liquid});
   if(balance<=0.005 && k>= (s.privateDebt>0?s.privateMonths:0)){debtFree=k;break;}
 }
 return {mortgageMonths:payoff??s.mortgageYears*12,debtFreeMonths:debtFree??Math.max(s.mortgageYears*12,s.privateMonths),
  calendarMonths:purchase.month+(debtFree??Math.max(s.mortgageYears*12,s.privateMonths)), interestPaid:interest,
  reserveBreach,insolvency,liquid,trajectory};
}
