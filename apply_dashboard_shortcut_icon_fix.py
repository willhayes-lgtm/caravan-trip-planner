#!/usr/bin/env python3
"""Fix mobile dashboard shortcut overflow, retaining existing click handling."""
from pathlib import Path
import re
css=Path('public/compact-mobile-page-actions.css')
html=Path('public/index.html')
if not css.exists() or not html.exists():
    raise SystemExit('Expected compact mobile page actions files missing. Run from repository root.')
old=css.read_text()
page=html.read_text()
marker='/* CMH dashboard icon overflow fix v2 */'
if marker in old: raise SystemExit('Fix already installed. Do not run twice.')
if 'cmh-in-heading' not in old or '/compact-mobile-page-actions.css' not in page:
    raise SystemExit('Existing compact page actions version not recognised; no changes made.')
fix='''
/* CMH dashboard icon overflow fix v2 */
@media (max-width:900px){
 .cmh-compact-heading>.ux-page-pinbar.cmh-in-heading{
   flex:0 0 42px!important;width:42px!important;min-width:42px!important;max-width:42px!important;
 }
 .cmh-compact-heading>.ux-page-pinbar.cmh-in-heading #uxPinCurrent{
   position:relative!important;display:inline-flex!important;flex:0 0 42px!important;
   align-items:center!important;justify-content:center!important;
   width:42px!important;min-width:42px!important;max-width:42px!important;
   height:42px!important;min-height:42px!important;max-height:42px!important;
   box-sizing:border-box!important;overflow:hidden!important;white-space:nowrap!important;
   text-indent:0!important;font-size:0!important;line-height:0!important;
   letter-spacing:0!important;padding:0!important;margin:0!important;
   border-radius:11px!important;isolation:isolate!important;
 }
 .cmh-compact-heading>.ux-page-pinbar.cmh-in-heading #uxPinCurrent::before{
   content:"▦";display:block;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
   font-size:23px!important;line-height:1!important;font-weight:650!important;color:#164b5b;
 }
 .cmh-compact-heading>.ux-page-pinbar.cmh-in-heading #uxPinCurrent[aria-pressed="true"]{
   background:#d6eeee!important;border-color:#258b94!important;
 }
 .cmh-compact-heading>.ux-page-pinbar.cmh-in-heading #uxPinCurrent[aria-pressed="true"]::before{
   content:"✓";color:#176c74;
 }
}
'''
page2,n=re.subn(r'(/compact-mobile-page-actions\.css\?v=)[^"\']+',r'\g<1>2',page,count=1)
if n!=1: raise SystemExit('Unable to update CSS cache version; no changes made.')
css.write_text(old.rstrip()+'\n'+fix)
html.write_text(page2)
print('Fixed compact Dashboard shortcut: 42px icon-only control with selected-state checkmark.')
print('Preserved existing dashboard add/remove functionality. No database migration.')
