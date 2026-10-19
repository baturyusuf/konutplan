import test from 'node:test';
import assert from 'node:assert/strict';
import {payment,evaluate,normalize,annualFactor} from '../engine.mjs';
test('zero interest amortizes uniformly',()=>assert.equal(payment(120000,0,120),1000));
test('nominal mortgage annuity is correct',()=>assert.ok(Math.abs(payment(1000000,2.89,120)-29879)<40));
test('24-month zero interest private borrowing',()=>{
 let e=evaluate({privateDebt:480000,privateMonths:24});assert.equal(e.personalPayment,20000);
});
test('freelance and rent are never included in bank underwriting income',()=>{
 let a=evaluate({freelance:0,rent:0}),b=evaluate({freelance:100000,rent:80000});assert.equal(a.bankLimitNow,b.bankLimitNow);
});
test('credit ineligible property has zero mortgage',()=>{let e=evaluate({creditEligible:false,mortgage:2000000});assert.equal(e.loan,0);assert.equal(e.installment,0)});
test('monthly cashflow is identity',()=>{
 const e=evaluate({housePrice:1200000,savings:1200000,mortgage:300000,privateDebt:0,rent:20000,usableRentPercent:50,occupancy:100,freelance:0});
 assert.ok(e.purchase);assert.ok(Math.abs(e.cashflow.monthlyNet-(e.cashflow.salary+e.cashflow.rent-e.cashflow.expenses-e.installment))<1e-7);
});
test('increasing interest increases installments',()=>assert.ok(payment(1000000,3,120)>payment(1000000,2,120)));
test('narrow cashflow appears with large private debt',()=>{
 let e=evaluate({savings:3000000,housePrice:3000000,mortgage:1000000,privateDebt:1200000,salary:70000,expenses:30000});assert.ok(e.purchase);assert.ok(e.cashflow.stressNet<0);
});
test('rates compound 12 months once',()=>assert.ok(Math.abs(annualFactor(10,12)-1.1)<1e-9));
test('input normalization rejects nonfinite and limits ranges',()=>assert.equal(normalize({salary:-20,interest:'abc'}).salary,0));
