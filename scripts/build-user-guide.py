#!/usr/bin/env python3
"""Build a portable user manual from the canonical Markdown chapters."""
from pathlib import Path
import base64
import html
import json
import re
import os
import unicodedata
import markdown
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/user-guide'
PUBLIC = ROOT / 'public/docs'
PUBLIC.mkdir(parents=True, exist_ok=True)
SITE_URL = os.environ.get('NEXT_PUBLIC_SITE_URL', 'https://sentry-pos-landing.vercel.app').rstrip('/')
CHAPTERS = [
    ('README.md', 'start', 'Start here', 'Getting started'),
    ('accounts-and-access.md', 'accounts', 'Accounts & access', 'Getting started'),
    ('workflows.md', 'workflows', 'Complete workflows', 'Getting started'),
    ('platform-admin.md', 'admin', 'Platform administrator', 'Role guides'),
    ('owner.md', 'owner', 'Business owner', 'Role guides'),
    ('manager.md', 'manager', 'Manager', 'Role guides'),
    ('cashier.md', 'cashier', 'Cashier', 'Role guides'),
    ('cms-editor.md', 'cms', 'Website & CMS editor', 'Role guides'),
    ('pos-terminal.md', 'pos', 'POS terminal', 'Task reference'),
    ('troubleshooting.md', 'help', 'Troubleshooting', 'Task reference'),
    ('glossary.md', 'glossary', 'Glossary', 'Task reference'),
    ('feature-index.md', 'features', 'Feature index & permissions', 'Task reference'),
]
FILES = {name: cid for name, cid, _, _ in CHAPTERS}

def slug(value, separator='-'):
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode()
    value = re.sub(r'[^\w\s-]', '', value.lower())
    return re.sub(r'[-\s]+', separator, value).strip(separator)

panels, navigation, search, toc = [], [], [], {}
group_prev = None
for name, cid, label, group in CHAPTERS:
    source = (OUT / name).read_text()
    doc = BeautifulSoup(markdown.markdown(source, extensions=['tables', 'toc', 'sane_lists', 'fenced_code'], extension_configs={'toc': {'slugify': slug}}), 'html.parser')
    heads = doc.find_all(re.compile('^h[1-6]$'))
    for head in heads:
        old = head.get('id', slug(head.get_text()))
        head['id'] = cid if head.name == 'h1' else f'{cid}--{old}'
        head['tabindex'] = '-1'
    for link in doc.find_all('a', href=True):
        href = link['href']
        if href.startswith('#'):
            link['href'] = f'#{cid}--{href[1:]}'
        else:
            target, _, anchor = href.partition('#')
            if target in FILES:
                link['href'] = '#' + FILES[target] + (f'--{anchor}' if anchor else '')
            elif href.startswith('https://'):
                link['target'] = '_blank'
                link['rel'] = 'noopener noreferrer'
    for table in doc.find_all('table'):
        wrap = doc.new_tag('div', attrs={'class': 'table-wrap', 'tabindex': '0', 'role': 'region', 'aria-label': 'Scrollable reference table'})
        table.wrap(wrap)
    toc[cid] = [{'id': h['id'], 'text': h.get_text(' ', strip=True)} for h in heads if h.name == 'h2']
    # Search indexes bounded task sections and retains readable snippets.
    for head in heads:
        chunks = []
        for sibling in head.next_siblings:
            if getattr(sibling, 'name', None) in ['h1', 'h2', 'h3']:
                break
            if hasattr(sibling, 'get_text'):
                chunks.append(sibling.get_text(' ', strip=True))
            else:
                chunks.append(str(sibling).strip())
        text = ' '.join(chunks).strip()
        if not text:
            children = []
            for sibling in head.next_siblings:
                if getattr(sibling, 'name', None) in ['h1', 'h2']:
                    break
                if getattr(sibling, 'name', None) == 'h3':
                    children.append(sibling.get_text(' ', strip=True))
            text = 'Includes: ' + '; '.join(children) if children else 'Open this section for instructions and reference details.'
        search.append({'id': head['id'], 'chapter': label, 'heading': head.get_text(' ', strip=True), 'text': text})
    panels.append(f'<article class="chapter" data-chapter="{cid}" aria-labelledby="{cid}">{doc}</article>')
    if group != group_prev:
        navigation.append(f'<div class="nav-group">{html.escape(group)}</div>')
        group_prev = group
    navigation.append(f'<a class="chapter-link" href="#{cid}" data-id="{cid}">{html.escape(label)}</a>')

font = OUT / 'assets/figtree.woff2'
font_rule = ''
if font.exists():
    font_rule = "@font-face{font-family:Figtree;src:url(data:font/woff2;base64," + base64.b64encode(font.read_bytes()).decode() + ") format('woff2');font-weight:300 900;font-display:swap}"
logo = (ROOT / 'public/brand/sentry-mark.svg').read_text()
logo = re.sub(r'<\?xml[^>]*\?>', '', logo)
# Theme both filled paths and the SVG's embedded CSS, preserving the green accent.
logo = logo.replace('#001E2B', 'var(--ink)').replace('#FFFFFF', 'var(--card)')
logo = re.sub(r'<svg\b', '<svg aria-hidden="true" class="brand-mark"', logo, count=1)

STYLE = r'''
:root{color-scheme:light;--ink:#001e2b;--teal:#00684a;--green:#00ed64;--muted:#52656b;--border:#dce6e3;--surface:#f6f9f8;--card:#fff;--mint:#e6f6ee;--nav-ink:#3c5359;--topbar:rgba(246,249,248,.96);--code:#eef4f2;--table-head:#eef5f2;--table-row:#fbfdfc;--notice-border:#c9e8d9;--notice-bg:#edf8f2;--mark:#cdf6dd;--focus:#00a35c;--font:Figtree,Arial,sans-serif}
:root[data-theme="dark"]{color-scheme:dark;--ink:#e6f0ed;--teal:#69e7ae;--muted:#9bafa8;--border:#30443c;--surface:#101a17;--card:#182620;--mint:#1d3b2e;--nav-ink:#bbcdc5;--topbar:rgba(16,26,23,.96);--code:#25372e;--table-head:#22392e;--table-row:#1b2c24;--notice-border:#315a43;--notice-bg:#1a3427;--mark:#315b43;--focus:#00ed64}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:100px}body{margin:0;background:var(--surface);color:var(--ink);font:16px/1.65 var(--font)}a{color:var(--teal);text-decoration-thickness:1px;text-underline-offset:3px}a:hover{text-decoration:underline}button,input{font:inherit;color:inherit}input::placeholder{color:var(--muted)}button{cursor:pointer}button:focus-visible,a:focus-visible,input:focus-visible,[tabindex]:focus-visible{outline:3px solid var(--focus);outline-offset:3px}button:disabled{cursor:default}.skip{position:fixed;top:-80px;left:16px;background:var(--card);padding:10px;z-index:99}.skip:focus{top:10px}.sidebar{width:268px;position:fixed;inset:0 auto 0 0;background:var(--card);border-right:1px solid var(--border);padding:24px 18px;overflow-y:auto;z-index:30}.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink);font-weight:750;font-size:21px}.brand-mark{width:34px;height:34px;flex:none}.brand-sub{font-size:12px;color:var(--muted);margin:4px 0 23px 44px;letter-spacing:.09em;text-transform:uppercase}.search-label{font-size:12px;font-weight:650;display:block;margin:0 0 7px}.search-box{position:relative}.search-box input{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:11px 40px 11px 12px;font-size:14px}.shortcut{position:absolute;right:9px;top:13px;font-size:10px;border:1px solid var(--border);padding:0 4px;border-radius:4px;color:var(--muted)}.nav-group{color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-size:10px;font-weight:700;margin:25px 11px 8px}.chapter-link{display:block;padding:8px 11px;margin:2px 0;border-radius:7px;text-decoration:none;color:var(--nav-ink);font-size:14px;font-weight:550;line-height:1.4}.chapter-link:hover{background:var(--surface);text-decoration:none}.chapter-link[aria-current=page]{background:var(--mint);color:var(--teal);font-weight:750}.side-note{font-size:11px;color:var(--muted);margin:27px 11px 0}.shell{margin-left:268px;min-width:0}.topbar{position:sticky;top:0;background:var(--topbar);border-bottom:1px solid var(--border);height:70px;padding:0 30px;display:flex;justify-content:space-between;align-items:center;gap:16px;z-index:20}.breadcrumb{font-size:13px;color:var(--muted)}.actions{display:flex;gap:10px;flex-shrink:0}.button{border:1px solid var(--border);background:var(--card);border-radius:8px;padding:8px 13px;font-size:12px;font-weight:650;color:var(--ink);text-decoration:none;line-height:1.4}.button:hover{background:var(--mint);text-decoration:none}.button.theme-toggle{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;padding:0}.theme-toggle[hidden]{display:none}.theme-toggle svg{width:18px;height:18px;flex:none}.theme-sun{display:none}[data-theme="dark"] .theme-moon{display:none}[data-theme="dark"] .theme-sun{display:block}.menu-button{display:none}.workspace{display:grid;grid-template-columns:minmax(0,860px) 185px;gap:35px;max-width:1200px;margin:0 auto;padding:38px 36px 90px;align-items:start}main{min-width:0}.chapter{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:36px 40px;margin-bottom:28px;min-width:0}.chapter h1:focus,.chapter h2:focus,.chapter h3:focus{outline:none}.chapter h1{font-size:32px;line-height:1.17;letter-spacing:-.025em;margin:0 0 22px;font-weight:740}.chapter h2{font-size:24px;line-height:1.3;letter-spacing:-.015em;margin:42px 0 16px;padding-top:8px;border-top:1px solid var(--border)}.chapter h3{font-size:18px;line-height:1.4;margin:28px 0 12px}.chapter p{margin:13px 0;overflow-wrap:anywhere}.chapter ul,.chapter ol{padding-left:25px}.chapter li{margin:8px 0}.chapter li p{margin:8px 0}.chapter strong{font-weight:740}.chapter code{font-size:.9em;background:var(--code);border-radius:4px;padding:1px 4px;overflow-wrap:anywhere}.chapter pre{white-space:pre-wrap;word-break:break-word}.chapter blockquote{margin:22px 0;border-left:3px solid var(--teal);background:var(--mint);padding:5px 18px}.table-wrap{overflow-x:auto;max-width:100%;margin:20px 0;border:1px solid var(--border);border-radius:9px}table{border-collapse:collapse;width:100%;font-size:13px;line-height:1.55}th,td{padding:11px 12px;vertical-align:top;border-bottom:1px solid var(--border);text-align:left;overflow-wrap:anywhere}th{background:var(--table-head);font-size:12px;font-weight:750}tr:last-child td{border-bottom:0}tr:nth-child(even) td{background:var(--table-row)}.page-toc{position:sticky;top:104px;max-height:calc(100vh - 130px);overflow:auto;font-size:12px;min-width:0}.page-toc h2{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 13px}.page-toc a{display:block;color:var(--muted);padding:6px 0;text-decoration:none;line-height:1.5}.page-toc a:hover{color:var(--teal)}.chapter-footer{display:flex;justify-content:space-between;gap:20px;font-size:13px;padding:10px 0 25px}.chapter-footer a{max-width:48%;line-height:1.45}.notice{border:1px solid var(--notice-border);background:var(--notice-bg);border-radius:10px;padding:15px 18px;font-size:13px;line-height:1.6;margin-bottom:24px}.notice strong{color:var(--teal)}.launch{margin:0 0 27px}.launch-label{font-size:11px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;font-weight:700;margin:0 0 12px}.role-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.role-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:15px;text-decoration:none;font-size:14px;font-weight:750;line-height:1.35;color:var(--ink);min-width:0}.role-card:hover{border-color:var(--teal);background:var(--mint);text-decoration:none}.role-card span{font-size:11px;font-weight:450;color:var(--muted);display:block;margin-top:5px}.search-heading{display:flex;align-items:start;justify-content:space-between;gap:20px}.search-heading h1{font-size:28px;margin:0 0 5px}.search-summary{font-size:13px;color:var(--muted);margin:0 0 24px}.result{display:block;padding:20px 0;border-top:1px solid var(--border);text-decoration:none;color:var(--ink)}.result:hover{text-decoration:none}.result:hover h2{text-decoration:underline;color:var(--teal)}.result small{font-size:11px;color:var(--teal);font-weight:650}.result h2{font-size:18px;line-height:1.4;margin:4px 0 7px;border:0;padding:0}.result p{font-size:13px;color:var(--muted);margin:0}.result mark{background:var(--mark);color:var(--ink)}.empty-search{padding:25px 0;line-height:1.7}.overlay{display:none}.print-only{display:none}.enhanced .chapter{display:none}.enhanced .chapter.is-active{display:block}.enhanced .chapter[hidden]{display:none}#search-results{display:none}.enhanced #search-results.is-active{display:block}.enhanced [hidden]{display:none!important}
@media(min-width:1600px){.workspace{max-width:1290px;grid-template-columns:minmax(0,900px) 205px;gap:45px}}
@media(max-width:1200px){.workspace{grid-template-columns:minmax(0,1fr);max-width:940px}.page-toc{display:none}.chapter{padding:30px}}
@media(max-width:800px){.back-to-site{display:none}.sidebar{transform:translateX(-100%);visibility:hidden;width:285px;transition:transform .18s}.shell{margin:0}.menu-button{display:inline-block}.topbar{padding:0 12px;height:62px;gap:8px}.actions{gap:8px}.breadcrumb{display:none}.workspace{padding:24px 16px 60px;gap:0}.chapter{padding:25px 20px;border-radius:11px}.chapter h1{font-size:28px}.chapter h2{font-size:22px}.chapter h3{font-size:18px}.role-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.button{padding:8px 10px}.nav-open .sidebar{transform:none;visibility:visible}.nav-open .overlay{display:block;position:fixed;inset:0;background:rgba(0,30,43,.32);z-index:25;border:0}.notice{padding:13px 15px;font-size:12px}body{font-size:15px}.table-wrap{margin-right:0}th,td{padding:10px}table{min-width:460px;font-size:12px}.side-note{margin-top:20px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.sidebar{transition:none}}
@page{size:A4;margin:17mm 15mm 19mm}
@media(max-width:380px){.download-label{display:none}}
@media print{:root,:root[data-theme="dark"]{color-scheme:light;--ink:#001e2b;--teal:#00684a;--green:#00ed64;--muted:#52656b;--border:#dce6e3;--surface:#f6f9f8;--card:#fff;--mint:#e6f6ee;--nav-ink:#3c5359;--topbar:rgba(246,249,248,.96);--code:#eef4f2;--table-head:#eef5f2;--table-row:#fbfdfc;--notice-border:#c9e8d9;--notice-bg:#edf8f2;--mark:#cdf6dd;--focus:#00a35c}html{scroll-behavior:auto}body{background:white;color:#001e2b;font:10pt/1.45 Arial,sans-serif}.sidebar,.topbar,.page-toc,.launch,.notice,.chapter-footer,#search-results,.skip,.overlay{display:none!important}.shell{margin:0}.workspace{display:block;padding:0;max-width:none}.chapter,.enhanced .chapter,.enhanced .chapter[hidden]{display:block!important;border:0;border-radius:0;padding:0;margin:0;break-before:page}.chapter:first-of-type{break-before:auto}.chapter h1{font-size:25pt;margin:0 0 20pt}.chapter h2{font-size:16pt;margin:22pt 0 10pt;break-after:avoid}.chapter h3{font-size:12pt;margin:15pt 0 8pt;break-after:avoid}.chapter p,.chapter li{orphans:3;widows:3}.chapter p{margin:8pt 0}.chapter li{margin:4pt 0}.table-wrap{overflow:visible;border:0;border-radius:0;margin:12pt 0;break-inside:auto}table{min-width:0;font-size:8.2pt;line-height:1.35;table-layout:fixed}th,td{padding:6pt 5pt;word-wrap:break-word}thead{display:table-header-group}tr{break-inside:avoid}.chapter a{color:#005b41;text-decoration:none}.chapter code{font-size:8.5pt}a[href^="https://"]{word-break:break-word}.print-only{display:block}.print-contents{margin-top:22pt}.print-contents a{display:block;padding:4pt 0;font-size:11pt}.chapter ul,.chapter ol{padding-left:19pt}}
'''

roles = [('admin','Platform admin','Accounts & access control'),('owner','Business owner','Set up and manage stores'),('manager','Manager','Assigned branches & approvals'),('cashier','Cashier','Sell and close the drawer'),('cms','Website editor','Marketing content & policies'),('pos','Counter tasks','Sales, payments & shifts')]
role_html = ''.join(f'<a class="role-card" href="#{cid}">{label}<span>{sub}</span></a>' for cid,label,sub in roles)
print_toc = ''.join(f'<a href="#{cid}">{i+1:02d}. {html.escape(label)}</a>' for i,(_,cid,label,_) in enumerate(CHAPTERS))
panels[0] = panels[0].replace('</h1>', '</h1><div class="print-only print-contents"><strong>Contents</strong>' + print_toc + '</div>', 1)

THEME_JS = r'''
(() => {
  const key = 'sentry-docs-theme';
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  try {
    const stored = localStorage.getItem(key);
    if (stored === 'light' || stored === 'dark') preference = stored;
  } catch {}
  function applyTheme(theme) {
    root.dataset.theme = theme;
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const dark = theme === 'dark';
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', 'Dark mode');
    button.title = label;
  }
  function followPreference() {
    applyTheme(preference || (system.matches ? 'dark' : 'light'));
  }
  followPreference();
  system.addEventListener('change', () => {
    if (!preference) followPreference();
  });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : null;
    followPreference();
  });
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    followPreference();
    button.hidden = false;
    button.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(preference);
      try { localStorage.setItem(key, preference); } catch {}
    });
  });
})();
'''

JS = r'''
const chapters=__CHAPTERS__, tocData=__TOC__, records=__SEARCH__;
document.documentElement.classList.add('enhanced');
const articles=[...document.querySelectorAll('.chapter[data-chapter]')], links=[...document.querySelectorAll('.chapter-link')], field=document.getElementById('task-search'), results=document.getElementById('search-results'), toc=document.getElementById('toc-links'), footer=document.getElementById('chapter-footer'), launch=document.getElementById('launch'), notice=document.getElementById('notice');
let current='start';
function closeMenu(){document.body.classList.remove('nav-open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false')}
function navigate(){let hash=decodeURIComponent(location.hash.slice(1))||'start';let cid=hash.split('--')[0];if(!chapters.some(c=>c.id===cid)){cid='start';hash=cid}current=cid;field.value='';results.classList.remove('is-active');document.getElementById('search-state').hidden=true;document.getElementById('view-results').hidden=true;articles.forEach(a=>{a.classList.toggle('is-active',a.dataset.chapter===cid);a.hidden=a.dataset.chapter!==cid});links.forEach(l=>{if(l.dataset.id===cid)l.setAttribute('aria-current','page');else l.removeAttribute('aria-current')});document.querySelector('.page-toc').hidden=false;launch.hidden=cid!=='start';notice.hidden=cid!=='start';document.getElementById('crumb').textContent='User guide / '+chapters.find(c=>c.id===cid).label;toc.replaceChildren();(tocData[cid]||[]).forEach(t=>{const a=document.createElement('a');a.href='#'+t.id;a.textContent=t.text;toc.append(a)});const index=chapters.findIndex(c=>c.id===cid);footer.replaceChildren();if(index>0){const a=document.createElement('a');a.href='#'+chapters[index-1].id;a.textContent='← '+chapters[index-1].label;footer.append(a)}else footer.append(document.createElement('span'));if(index<chapters.length-1){const a=document.createElement('a');a.href='#'+chapters[index+1].id;a.textContent=chapters[index+1].label+' →';footer.append(a)};closeMenu();document.title=chapters[index].label+' · Sentry POS user guide';requestAnimationFrame(()=>{const target=document.getElementById(hash)||document.getElementById(cid);window.scrollTo({top:hash===cid?0:target.getBoundingClientRect().top+window.scrollY-document.querySelector('.topbar').offsetHeight-22,behavior:'instant'});if(document.activeElement!==field)target.focus({preventScroll:true})})}
function matchText(parent,text,terms){const expr=new RegExp('('+terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','ig');let prev=0;for(const m of text.matchAll(expr)){parent.append(document.createTextNode(text.slice(prev,m.index)));const mark=document.createElement('mark');mark.textContent=m[0];parent.append(mark);prev=m.index+m[0].length}parent.append(document.createTextNode(text.slice(prev)))}
function search(){const query=field.value.trim();if(!query){navigate();field.focus();return}const terms=query.toLowerCase().split(/\s+/).filter(Boolean);let found=records.filter(r=>terms.every(t=>(r.chapter+' '+r.heading+' '+r.text).toLowerCase().includes(t)));found.sort((a,b)=>terms.filter(t=>b.heading.toLowerCase().includes(t)).length-terms.filter(t=>a.heading.toLowerCase().includes(t)).length);articles.forEach(a=>a.hidden=true);launch.hidden=true;notice.hidden=true;document.querySelector('.page-toc').hidden=true;footer.replaceChildren();results.classList.add('is-active');const state=document.getElementById('search-state');state.hidden=false;state.textContent=found.length+' matching sections';document.getElementById('view-results').hidden=false;results.replaceChildren();const header=document.createElement('div');header.className='search-heading';const title=document.createElement('h1');title.textContent='Find a task';const back=document.createElement('button');back.className='button';back.textContent='Clear search';back.onclick=()=>{navigate();field.focus()};header.append(title,back);results.append(header);const summary=document.createElement('p');summary.className='search-summary';summary.setAttribute('aria-live','polite');summary.textContent=found.length+' matching sections for “'+query+'”'+(found.length>30?' · showing the first 30':'');results.append(summary);if(!found.length){const p=document.createElement('p');p.className='empty-search';p.textContent='Try a shorter task or a screen label, such as account, temporary PIN, refund, receive stock, or close shift.';results.append(p)}found.slice(0,30).forEach(r=>{const a=document.createElement('a');a.className='result';a.href='#'+r.id;a.addEventListener('click',()=>{if(location.hash==='#'+r.id)navigate()});const label=document.createElement('small');label.textContent=r.chapter;const h=document.createElement('h2');matchText(h,r.heading,terms);const p=document.createElement('p');const lower=r.text.toLowerCase();const positions=terms.map(t=>lower.indexOf(t)).filter(i=>i>=0);const pos=positions.length?Math.max(0,Math.min(...positions)-65):0;let snippet=r.text.slice(pos,pos+240);if(pos)snippet='…'+snippet;if(pos+240<r.text.length)snippet+='…';matchText(p,snippet,terms);a.append(label,h,p);results.append(a)});window.scrollTo({top:0,behavior:'instant'})}
field.addEventListener('input',search);field.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=results.querySelector('.result');if(first){location.hash=first.getAttribute('href');closeMenu()}}});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.body.classList.add('nav-open');document.getElementById('menu-toggle').setAttribute('aria-expanded','true');field.focus()}if(e.key==='Escape'){if(field.value)navigate();closeMenu()}});document.getElementById('menu-toggle').onclick=()=>{const open=document.body.classList.toggle('nav-open');document.getElementById('menu-toggle').setAttribute('aria-expanded',String(open));if(open)field.focus()};document.getElementById('overlay').onclick=closeMenu;document.getElementById('print-button').onclick=()=>window.print();document.getElementById('view-results').onclick=()=>{closeMenu();results.querySelector('h1').setAttribute('tabindex','-1');results.querySelector('h1').focus()};window.addEventListener('hashchange',navigate);document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{if(a.getAttribute('href')===location.hash)navigate()}));navigate();
'''
JS = JS.replace('__CHAPTERS__', json.dumps([{'id':cid,'label':label} for _,cid,label,_ in CHAPTERS], ensure_ascii=False)).replace('__TOC__', json.dumps(toc, ensure_ascii=False)).replace('__SEARCH__', json.dumps(search, ensure_ascii=False)).replace('</', r'<\/')
page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Sentry POS user manual: account setup and step-by-step guides for platform admins, owners, managers, cashiers and website editors."><title>Sentry POS user guide</title><link rel="canonical" href="{html.escape(SITE_URL)}/docs"><script>{THEME_JS}</script><style>{font_rule}{STYLE}</style></head>
<body><a href="#start" class="skip">Skip to guide</a><button id="overlay" class="overlay" aria-label="Close navigation"></button>
<aside class="sidebar" id="navigation"><a class="brand" href="/" aria-label="Sentry website">{logo}<span>Sentry</span></a><div class="brand-sub">User documentation</div><label class="search-label" for="task-search">Find a task</label><div class="search-box"><input id="task-search" type="search" placeholder="Account, sale, stock…" autocomplete="off"><span class="shortcut" aria-hidden="true">⌘ K</span></div><div id="search-state" class="side-note" aria-live="polite" hidden></div><button id="view-results" class="button" style="margin-top:8px;width:100%" hidden>View search results →</button><nav aria-label="Guide chapters">{''.join(navigation)}</nav><div class="side-note">Checked 4 October 2026<br>Philippine pesos · Manila time<br>12 chapters · all user roles</div></aside>
<div class="shell"><header class="topbar"><button id="menu-toggle" class="button menu-button" aria-controls="navigation" aria-expanded="false">☰ Chapters</button><span class="breadcrumb" id="crumb">User guide</span><div class="actions"><a class="button back-to-site" href="/" aria-label="Back to Sentry website">Sentry</a><button class="button theme-toggle" id="theme-toggle" type="button" aria-label="Dark mode" aria-pressed="false" hidden><svg class="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.9 13.1A9 9 0 0 1 10.9 3.1 9 9 0 1 0 20.9 13.1Z"/></svg><svg class="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button><a class="button" href="/docs/SentryPOS-User-Guide.pdf" download><span class="download-label">Download </span>PDF</a><button class="button" id="print-button">Print all</button></div></header>
<div class="workspace"><main id="manual"><section class="launch" id="launch" aria-label="Choose your role"><p class="launch-label">Start with your role</p><div class="role-grid">{role_html}</div></section><div class="notice" id="notice"><strong>Testing the current deployment?</strong> Email delivery is off. Existing active accounts and cashier PIN setup work; new owner/manager email onboarding needs email enabled. <a href="#accounts--current-email-restriction">See account setup limits →</a></div><section class="chapter" id="search-results" aria-label="Search results"></section>{''.join(panels)}<nav class="chapter-footer" id="chapter-footer" aria-label="Previous and next chapters"></nav></main><aside class="page-toc" aria-label="Current chapter contents"><h2>On this page</h2><nav id="toc-links"></nav></aside></div></div><script>{JS}</script></body></html>'''
(PUBLIC / 'index.html').write_text(page)
report = {'chapters':len(CHAPTERS),'taskSections':len(search),'words':sum(len((OUT/name).read_text().split()) for name,_,_,_ in CHAPTERS),'htmlBytes':len(page.encode()),'build':'2026-10-04','sources':[name for name,_,_,_ in CHAPTERS]}

print(json.dumps(report, indent=2))
