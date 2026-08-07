/* Live semantic place discovery for independent custom categories. */
window.addEventListener('load',()=>setTimeout(()=>{
  const button=$('#analyzeCustom'),input=$('#customCategory'),output=$('#customResult');
  if(!button||!input||!output)return;
  const copy={
    ko:{bad:'제대로 입력해 주십시오.',search:'입력 의미를 파악하고 부산의 관련 장소를 검색하고 있습니다…',none:'입력은 확인했지만 부산 내 관련 장소를 찾지 못했습니다. 활동이나 관심사를 조금 더 구체적으로 입력해 주세요.',found:'입력 의미를 바탕으로 부산의 관련 장소를 찾았습니다:'},
    en:{bad:'Please enter a valid word or phrase.',search:'Understanding your request and searching for related places in Busan…',none:'The input was understood, but no related place was found in Busan. Please be a little more specific.',found:'Related places in Busan were found from the meaning of your input:'},
    ja:{bad:'正しく入力してください。',search:'入力の意味を把握し、釜山の関連場所を検索しています…',none:'入力は確認できましたが、釜山で関連場所が見つかりませんでした。もう少し具体的に入力してください。',found:'入力の意味に基づいて釜山の関連場所を見つけました：'},
    zhTW:{bad:'請正確輸入。',search:'正在理解輸入含義並搜尋釜山的相關地點…',none:'已理解輸入內容，但在釜山找不到相關地點。請輸入得更具體。',found:'已根據輸入含義找到釜山的相關地點：'},
    zhCN:{bad:'请正确输入。',search:'正在理解输入含义并搜索釜山的相关地点…',none:'已理解输入内容，但在釜山找不到相关地点。请输入得更具体。',found:'已根据输入含义找到釜山的相关地点：'},
    fr:{bad:'Veuillez saisir un mot ou une expression valide.',search:'Analyse du sens et recherche de lieux associés à Busan…',none:'La saisie a été comprise, mais aucun lieu associé n’a été trouvé à Busan. Soyez un peu plus précis.',found:'Lieux associés trouvés à Busan selon le sens de votre saisie :'},
    de:{bad:'Bitte geben Sie ein gültiges Wort oder einen gültigen Ausdruck ein.',search:'Die Bedeutung wird analysiert und passende Orte in Busan werden gesucht…',none:'Die Eingabe wurde verstanden, aber in Busan wurde kein passender Ort gefunden. Bitte geben Sie etwas Genaueres ein.',found:'Passende Orte in Busan wurden anhand der Bedeutung gefunden:'},
    es:{bad:'Introduzca una palabra o frase válida.',search:'Interpretando el significado y buscando lugares relacionados en Busan…',none:'Se entendió la entrada, pero no se encontró un lugar relacionado en Busan. Sea un poco más específico.',found:'Se encontraron lugares relacionados en Busan según el significado:'}
  };
  const words=[
    {r:/물고기|해양|바닷속|상어|돌고래|aquarium|fish|marine|underwater|魚|海洋|鲨鱼|海豚/i,q:'아쿠아리움 수족관 해양 체험'},
    {r:/별|천문|우주|행성|밤하늘|star|space|planet|astronomy|星|宇宙|天文/i,q:'천문대 전망대 별 관측'},
    {r:/만들|공예|그림|도자|창작|craft|paint|pottery|ceramic|手作|工芸|陶芸|手工|陶瓷/i,q:'공방 만들기 체험'},
    {r:/책|독서|서점|문학|book|read|bookstore|literature|本|読書|書店|书|阅读/i,q:'도서관 서점 책 문화'},
    {r:/음악|춤|공연|연극|영화|콘서트|music|dance|performance|theater|cinema|concert|音楽|公演|映画|音乐|演出|电影/i,q:'공연장 문화 예술 체험'},
    {r:/운동|스포츠|축구|야구|자전거|클라이밍|sport|football|baseball|cycling|climbing|スポーツ|野球|自転車|运动|棒球|自行车/i,q:'스포츠 체험 경기장'},
    {r:/동물|새|고양이|강아지|animal|bird|cat|dog|動物|鳥|猫|犬|动物|鸟/i,q:'동물 생태 체험'},
    {r:/꽃|정원|숲|식물|자연|flower|garden|forest|plant|花|庭園|森|植物|花园/i,q:'공원 수목원 자연 체험'},
    {r:/사진|인생샷|촬영|photo|picture|撮影|写真|摄影|照片/i,q:'사진 명소 전망대'},
    {r:/조용|휴식|힐링|명상|quiet|relax|healing|meditation|静か|瞑想|安静|冥想/i,q:'조용한 공원 숲 산책'},
    {r:/아이|가족|어린이|kid|child|family|子供|家族|儿童|亲子/i,q:'어린이 가족 체험'},
    {r:/비|실내|추위|더위|rain|indoor|cold|hot|雨|室内|下雨/i,q:'실내 체험 박물관'}
  ];
  const message=()=>copy[lang]||copy.en;
  const invalid=s=>{let v=s.trim();if(v.length<2||v.length>60)return true;if(/[ㄱ-ㅎㅏ-ㅣ]/.test(v))return true;if(/[;{}<>\\|^~`]/.test(v))return true;let letters=(v.match(/[가-힣A-Za-zÀ-ÿ一-龥ぁ-んァ-ン]/g)||[]).length;return letters/Math.max(v.length,1)<.65||/(.)\1{4,}/.test(v)};
  const redraw=()=>{let box=$('#customCategoryChips');if(!box)return;box.innerHTML=pmCustomCategories.map((c,i)=>`<button class="active" data-i="${i}">${c.query} ×</button>`).join('');box.querySelectorAll('button').forEach(b=>b.onclick=()=>{pmCustomCategories.splice(+b.dataset.i,1);redraw()})};
  async function osmSearch(query){let u='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&namedetails=1&addressdetails=1&accept-language='+encodeURIComponent(lang)+'&q='+encodeURIComponent(query+', 부산, 대한민국'),r=await fetch(u,{headers:{Accept:'application/json'}});if(!r.ok)return[];return(await r.json()).filter(x=>+x.lat>34.8&&+x.lat<35.5&&+x.lon>128.7&&+x.lon<129.4).map(x=>({name:(x.namedetails?.name||x.display_name.split(',')[0]).trim(),score:Math.round((+x.importance||.5)*100)}))}
  async function wikiSearch(query){let api='https://ko.wikipedia.org/w/api.php?origin=*&action=query&format=json&generator=search&gsrnamespace=0&gsrlimit=8&gsrsearch='+encodeURIComponent('부산 '+query)+'&prop=coordinates',r=await fetch(api);if(!r.ok)return[];let pages=Object.values((await r.json()).query?.pages||{});return pages.filter(x=>x.coordinates?.some(c=>c.lat>34.8&&c.lat<35.5&&c.lon>128.7&&c.lon<129.4)).map(x=>({name:x.title,score:85}))}
  async function analyze(){let raw=input.value.trim();if(invalid(raw)){output.textContent=message().bad;return}output.textContent=message().search;let meaning=words.find(x=>x.r.test(raw))?.q||raw;try{let [osm,wiki]=await Promise.all([osmSearch(raw+' '+meaning),wikiSearch(raw+' '+meaning)]),seen=new Set(),found=[...osm,...wiki].filter(x=>{let k=x.name.toLocaleLowerCase();if(seen.has(k))return false;seen.add(k);return true}).slice(0,5);if(!found.length&&meaning!==raw)found=(await osmSearch(meaning)).slice(0,5);if(!found.length){output.textContent=message().none;return}let candidates=found.map((x,i)=>[x.name,20+i*6,80,Math.max(70,x.score)]);pmCustomCategories.push({id:'live-'+Date.now(),query:raw,candidates});output.textContent=message().found+' '+found.map(x=>x.name).join(', ');input.value='';redraw()}catch(e){output.textContent=message().none}}
  button.onclick=analyze;input.onkeydown=e=>{if(e.key==='Enter')analyze()}
},2200));
