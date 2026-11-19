from pathlib import Path
p=Path('public')
def get(name): return (p/name).read_text(encoding='utf-8')
def save(name,s): (p/name).write_text(s,encoding='utf-8')
def swap(s,a,b):
    if s.count(a)!=1: raise SystemExit('Expected unique marker: '+a[:70])
    return s.replace(a,b,1)
i=get('index.html'); h=get('phase2.html')
if 'id="servicePage"' in i: raise SystemExit('Already integrated')
a=h.index('<section id="serviceTab">'); b=h.index('</main>',a)
sections=h[a:b]
split='<section id="payloadTab"'
if sections.count(split)!=1: raise SystemExit('Payload marker missing')
sections=sections.replace('<section id="serviceTab">','<section id="servicePage" class="subpage" hidden><div class="phase2"><section id="serviceTab">',1)
sections=sections.replace(split,'</div></section><section id="payloadPage" class="subpage" hidden><div class="phase2">'+split,1)
# Close outer wrappers following payload's final section.
sections=sections.rstrip()
if not sections.endswith('</section>'): raise SystemExit('Unexpected section ending')
sections+='</div></section>'
d=h[h.index('<dialog id="serviceDialog">'):h.index('<script src="/phase2.js"')]
i=swap(i,'<p class="footnote">','<nav class="tabs" hidden><button data-tab="service" type="button">Service</button><button data-tab="payload" type="button">Payload</button></nav><div id="error" role="alert" hidden></div>'+sections+'<p class="footnote">')
i=swap(i,'<dialog id="editor">',d+'<dialog id="editor">')
i=swap(i,'onclick="location.href=\'/phase2.html#service\'"','data-page="service"')
i=swap(i,'onclick="location.href=\'/phase2.html#payload\'"','data-page="payload"')
i=swap(i,'<link rel="stylesheet" href="/navigation-controller.css','<link rel="stylesheet" href="/phase2.css?v=unified1"><link rel="stylesheet" href="/unified-phase2.css?v=1"><link rel="stylesheet" href="/navigation-controller.css')
i=swap(i,'<script src="/navigation-controller.js','<script src="/phase2.js?v=unified1" defer></script><script src="/navigation-controller.js')
i=i.replace('/phase2.html#payload','/#payload').replace('/phase2.html#service','/#service')
c=get('navigation-controller.js')
c=swap(c,"checklists:'checklistsPage'}","checklists:'checklistsPage',service:'servicePage',payload:'payloadPage'}")
css=get('navigation-controller.css')+'''
body[data-current-page] #servicePage,body[data-current-page] #payloadPage{display:none!important}
body[data-current-page="service"] #servicePage,body[data-current-page="payload"] #payloadPage{display:block!important}
'''
u=get('ux-polish.js')
u=u.replace("el.getAttribute('onclick')?.includes('#service')","el.dataset.page==='service'||el.getAttribute('onclick')?.includes('#service')")
u=u.replace("el.getAttribute('onclick')?.includes('#payload')","el.dataset.page==='payload'||el.getAttribute('onclick')?.includes('#payload')")
v=get('ux-dashboard-v2.js').replace("service:'/phase2.html#service',payload:'/phase2.html#payload'","service:'/#service',payload:'/#payload'")
r=get('ux-refresh.js').replace('/phase2.html#payload','/#payload')
for n,s in [('index.html',i),('navigation-controller.js',c),('navigation-controller.css',css),('ux-polish.js',u),('ux-dashboard-v2.js',v),('ux-refresh.js',r)]:save(n,s);print('UPDATED',n)
save('unified-phase2.css', '''
#servicePage .phase2,#payloadPage .phase2{max-width:none;margin:0;padding:0}
#servicePage,#payloadPage{padding-top:12px}
main>.tabs{display:none!important}
#servicePage[hidden],#payloadPage[hidden]{display:none!important}
''')
print('CREATED unified-phase2.css')
