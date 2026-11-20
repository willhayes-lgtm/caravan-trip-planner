#!/usr/bin/env python3
"""Make the unified dashboard notifications collapsed by default.
Run once from the caravan-trip-planner repository root.
"""
from pathlib import Path

js=Path('public/ux-dashboard-v2.js')
css=Path('public/unified-notifications.css')
if not js.exists() or not css.exists():
    raise SystemExit('Missing expected website files. Run from the repository root.')
source=js.read_text()
old=""" root.replaceChildren();
 const header=el('div','ux-notification-head');header.append(el('h3','','Notifications & actions'));
 const count=el('span','ux-notification-count',`${unique.length} ${unique.length===1?'action':'actions'}`);header.append(count);root.append(header);
 if(!unique.length){root.append(el('div','ux-notification-empty','✓ You’re all caught up — no upcoming actions.'))}
 else{
  const list=el('div','ux-notification-list');"""
new=""" // Preserve a user's open/closed choice during background refreshes.
 // A fresh page load always starts collapsed.
 const wasOpen=root.querySelector('#uxNotificationDetails')?.open===true;
 root.replaceChildren();
 const details=el('details','ux-notification-details');
 details.id='uxNotificationDetails';
 details.open=wasOpen;
 const summary=el('summary','ux-notification-summary');
 const heading=el('span','ux-notification-summary-title','Notifications & actions');
 const badges=el('span','ux-notification-summary-badges');
 const overdue=unique.filter(n=>n.severity==='critical').length;
 const soon=unique.length-overdue;
 if(overdue)badges.append(el('span','ux-notification-summary-badge ux-notification-summary-critical',`${overdue} overdue / expired`));
 if(soon)badges.append(el('span','ux-notification-summary-badge ux-notification-summary-warning',`${soon} due soon`));
 if(!unique.length)badges.append(el('span','ux-notification-summary-badge ux-notification-summary-clear','All caught up'));
 const chevron=el('span','ux-notification-chevron','⌄');
 chevron.setAttribute('aria-hidden','true');
 summary.append(heading,badges,chevron);
 details.append(summary);
 const content=el('div','ux-notification-content');
 if(!unique.length){content.append(el('div','ux-notification-empty','✓ You’re all caught up — no upcoming actions.'))}
 else{
  const list=el('div','ux-notification-list');"""
old2="""  root.append(list);
 }
 const failed=['maintenance','caravan profile','trips'].filter((_,i)=>sources[i].status==='rejected');
 if(failed.length)root.append(el('p','ux-notification-partial','Some notifications could not be checked ('+failed.join(', ')+'). Refresh to try again.'));
}"""
new2="""  content.append(list);
 }
 const failed=['maintenance','caravan profile','trips'].filter((_,i)=>sources[i].status==='rejected');
 if(failed.length){
  // Show incomplete-data warnings even when the details are collapsed.
  const warning=el('p','ux-notification-partial','Some notifications could not be checked ('+failed.join(', ')+'). Refresh to try again.');
  root.append(details,warning);
 }else root.append(details);
 details.append(content);
}"""
if source.count(old)!=1 or source.count(old2)!=1:
    raise SystemExit('Unexpected JavaScript version. No files changed; send the error for review.')
source=source.replace(old,new).replace(old2,new2)
addition="""

/* Compact, accessible, collapsed-by-default notification overview. */
.ux-notification-centre{padding:0;overflow:hidden}
.ux-notification-details{margin:0}
.ux-notification-summary{display:flex;align-items:center;gap:14px;flex-wrap:wrap;list-style:none;cursor:pointer;padding:18px 22px;min-height:64px}
.ux-notification-summary::-webkit-details-marker{display:none}
.ux-notification-summary:focus-visible{outline:3px solid #238c9a;outline-offset:-4px;border-radius:12px}
.ux-notification-summary-title{font-size:20px;font-weight:750;line-height:1.3}
.ux-notification-summary-badges{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-left:auto}
.ux-notification-summary-badge{display:inline-flex;align-items:center;border-radius:999px;padding:6px 11px;font-size:13px;font-weight:750;white-space:nowrap}
.ux-notification-summary-critical{background:#fbe1de;color:#992f2a}
.ux-notification-summary-warning{background:#fff0cf;color:#855409}
.ux-notification-summary-clear{background:#e4f4ec;color:#28634d}
.ux-notification-chevron{font-size:24px;color:#416773;line-height:1;transition:transform .2s ease}
.ux-notification-details[open] .ux-notification-chevron{transform:rotate(180deg)}
.ux-notification-details[open] .ux-notification-summary{border-bottom:1px solid #e3eeee}
.ux-notification-content{padding:16px 22px 20px}
.ux-notification-partial{margin:0;padding:0 22px 16px}
@media(max-width:650px){
 .ux-notification-summary{padding:15px;gap:10px}
 .ux-notification-summary-title{font-size:17px;flex:1 1 calc(100% - 40px)}
 .ux-notification-summary-badges{order:3;margin-left:0;width:100%}
 .ux-notification-chevron{order:2}
 .ux-notification-content{padding:12px 15px 16px}
 .ux-notification-partial{padding:0 15px 14px}
}
"""
# Avoid CSS duplicate on repeated run; JS guard also ensures one-time use.
js.write_text(source)
css.write_text(css.read_text()+addition)
print('Updated',js,'and',css)
print('Notifications now default to collapsed; summary displays overdue/expired and due-soon counts.')
