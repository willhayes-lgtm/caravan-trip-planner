#!/usr/bin/env python3
from pathlib import Path
P=Path('public')
def change(file,old,new):
 f=P/file
 s=f.read_text(encoding='utf-8')
 if new in s:
  print('Already applied:',file)
  return
 if s.count(old)!=1:
  raise RuntimeError(f'{file}: expected exactly one anchor, found {s.count(old)}. Stop and share this error.')
 f.write_text(s.replace(old,new,1),encoding='utf-8')
 print('Updated:',file)

# Move the existing safety copy into a native, keyboard-accessible disclosure.
notice='<div class="notice">Uses MTPLM and MIRO from your caravan profile. Check the manufacturer&#39;s MIRO definition: fitted extras, gas, water and other items may or may not already be included. Weigh your loaded caravan to confirm actual weight. Nose weight and tow vehicle limits require separate checks.</div>'
# The repository uses a literal apostrophe, not an HTML entity.
notice=notice.replace('&#39;',"'")
heading='<h2>Payload calculator</h2>'
disclosure='<h2>Payload calculator <details class="payload-safety-info"><summary aria-label="Payload safety information" title="Payload safety information">ⓘ</summary><div class="payload-safety-popover">Uses MTPLM and MIRO from your caravan profile. Check the manufacturer&#39;s MIRO definition: fitted extras, gas, water and other items may or may not already be included. Weigh your loaded caravan to confirm actual weight. Nose weight and tow vehicle limits require separate checks.</div></details></h2>'.replace('&#39;',"'")
# Remove the original notice first, then add the disclosure.
change('index.html',notice,'')
change('index.html',heading,disclosure)
change('index.html','> Count only onboard items</label>','> Onboard only</label>')
change('index.html','> Show items already included in MIRO</label>','> Include MIRO items</label>')
css = r"""/* Payload calculator: compact filters and accessible safety information */
#payloadPage .section-head h2{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#payloadPage .payload-safety-info{position:relative;display:inline-flex;vertical-align:middle;font-size:initial;font-weight:400;flex:0 0 auto}
#payloadPage .payload-safety-info>summary{list-style:none;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;border:1px solid #bed9db;background:#e8f3f3;color:#176d78;font-size:23px;line-height:1;cursor:pointer}
#payloadPage .payload-safety-info>summary::-webkit-details-marker{display:none}
#payloadPage .payload-safety-info>summary:focus-visible{outline:3px solid #168d96;outline-offset:3px}
#payloadPage .payload-safety-popover{position:absolute;left:0;top:calc(100% + 9px);z-index:100;width:min(350px,calc(100vw - 48px));max-width:calc(100vw - 48px);padding:16px;background:#fff;color:#365760;font-size:13px;line-height:1.55;font-weight:400;border:1px solid #c7dedf;border-radius:14px;box-shadow:0 12px 36px #163f4e2b}
#payloadPage .filters{display:flex!important;flex-direction:row!important;align-items:center!important;flex-wrap:wrap!important;gap:8px!important;margin:12px 0 16px!important;min-width:0}
#payloadPage .filters label{display:inline-flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:7px!important;flex:0 1 auto!important;width:auto!important;min-width:0!important;min-height:42px;padding:9px 12px;background:#fff;border:1px solid #d4e5e6;border-radius:12px;color:#315c67;font-size:13px;font-weight:650;line-height:1.2;white-space:nowrap;cursor:pointer}
#payloadPage .filters input[type=checkbox]{width:17px!important;height:17px!important;min-width:17px;min-height:17px;margin:0;accent-color:#168b94}
#payloadPage .filters label:has(input:checked){background:#e6f5f3;border-color:#9fd2cc;color:#135b63}
#payloadPage .filters label:focus-within{outline:2px solid #168b94;outline-offset:2px}
@media(max-width:480px){
 #payloadPage .filters{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
 #payloadPage .filters label{width:100%!important;padding:9px 7px!important;font-size:12px!important;white-space:normal!important;text-align:left;justify-content:center!important}
 #payloadPage .payload-safety-popover{left:auto;right:-12px}
}
"""
(P/'payload-safety-filters.css').write_text(css,encoding='utf-8')
change('index.html','</head>','<link rel="stylesheet" href="/payload-safety-filters.css?v=20261122-1"></head>')
print('Payload safety and filters update installed. No SQL or JavaScript changes.')
