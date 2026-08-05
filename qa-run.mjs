import { downloadReportPdf } from '/tmp/qa/report-pdf.mjs';
import fs from 'fs';
const money = (n) => '$' + n.toFixed(0);
// patch save via monkeypatching jsPDF prototype
const { jsPDF } = await import('jspdf');
jsPDF.prototype.save = function(name){ fs.writeFileSync('/tmp/qa/'+name, Buffer.from(this.output('arraybuffer'))); console.log('saved', name); };
await downloadReportPdf({
  clinicName: 'Vetigo Demo Clinic',
  currencyLabel: money,
  stats: [{label:'Revenue (6 mo)',value:'$42,000'},{label:'Appointments (6 mo)',value:'318'},{label:'Completed visits',value:'240'},{label:'Avg. invoice',value:'$132'}],
  months: [['Mar',5200,44],['Apr',6100,52],['May',7300,58],['Jun',6800,51],['Jul',8200,60],['Aug',8400,53]].map(([month,revenue,visits])=>({month,revenue,visits})),
  serviceMix: [{name:'Consultation',value:120},{name:'Vaccination',value:88},{name:'Surgery',value:31},{name:'Grooming',value:44},{name:'Dental',value:22}],
  paidInvoices: Array.from({length:8},(_,i)=>({number:'INV-10'+i, issued:'1 Aug 2026', total:120+i*33})),
});
