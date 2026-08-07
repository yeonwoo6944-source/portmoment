/* AI-powered custom category search. Other planning behavior remains in app.js. */
window.addEventListener('load', () => setTimeout(() => {
  document.querySelector('.time-mode-chips')?.remove();
  const button = $('#analyzeCustom'), input = $('#customCategory'), output = $('#customResult');
  if (!button || !input || !output) return;

  const copy = {
    ko:{bad:'제대로 입력해 주십시오.',search:'입력 내용을 이해하기 위해 무료 인터넷 검색 결과를 분석하고 있습니다…',none:'부산의 관련 장소를 찾지 못했습니다. 원하는 경험이나 활동을 조금 더 구체적으로 입력해 주세요.',found:'여러 검색 결과에서 반복되는 주제를 분석해 찾은 부산의 장소:',theme:'주요 주제',offline:'검색 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'},
    en:{bad:'Please enter it correctly.',search:'Analyzing free internet search results to understand your input…',none:'No related place was found in Busan. Please describe the experience or activity more specifically.',found:'Places in Busan selected from recurring themes across multiple search results:',theme:'Main themes',offline:'Could not connect to the search server. Please try again shortly.'},
    ja:{bad:'正しく入力してください。',search:'入力内容を理解するため、無料のインターネット検索結果を分析しています…',none:'釜山で関連する場所が見つかりませんでした。希望する体験や活動をもう少し具体的に入力してください。',found:'複数の検索結果で繰り返されるテーマから選んだ釜山の場所：',theme:'主要テーマ',offline:'検索サーバーに接続できませんでした。しばらくしてからもう一度お試しください。'},
    zhTW:{bad:'請正確輸入。',search:'正在分析免費網路搜尋結果以理解輸入內容…',none:'在釜山找不到相關地點。請更具體地輸入想要的體驗或活動。',found:'根據多個搜尋結果中反覆出現的主題選出的釜山地點：',theme:'主要主題',offline:'無法連接搜尋伺服器，請稍後再試。'},
    zhCN:{bad:'请正确输入。',search:'正在分析免费互联网搜索结果以理解输入内容…',none:'在釜山找不到相关地点。请更具体地输入想要的体验或活动。',found:'根据多个搜索结果中反复出现的主题选出的釜山地点：',theme:'主要主题',offline:'无法连接搜索服务器，请稍后再试。'},
    fr:{bad:'Veuillez saisir correctement votre demande.',search:'Analyse de résultats de recherche Internet gratuits pour comprendre votre saisie…',none:'Aucun lieu associé n’a été trouvé à Busan. Décrivez plus précisément l’expérience ou l’activité souhaitée.',found:'Lieux de Busan sélectionnés selon les thèmes récurrents de plusieurs résultats :',theme:'Thèmes principaux',offline:'Impossible de joindre le serveur de recherche. Réessayez dans un instant.'},
    de:{bad:'Bitte geben Sie Ihre Anfrage korrekt ein.',search:'Kostenlose Internetsuchergebnisse werden analysiert, um Ihre Eingabe zu verstehen…',none:'In Busan wurde kein passender Ort gefunden. Beschreiben Sie das gewünschte Erlebnis oder die Aktivität genauer.',found:'Orte in Busan nach wiederkehrenden Themen mehrerer Suchergebnisse:',theme:'Hauptthemen',offline:'Der Suchserver ist nicht erreichbar. Bitte versuchen Sie es gleich noch einmal.'},
    es:{bad:'Introduzca correctamente su solicitud.',search:'Analizando resultados gratuitos de Internet para comprender la entrada…',none:'No se encontró un lugar relacionado en Busan. Describa con más detalle la experiencia o actividad deseada.',found:'Lugares de Busan elegidos según temas recurrentes de varios resultados:',theme:'Temas principales',offline:'No se pudo conectar con el servidor de búsqueda. Inténtelo de nuevo en unos instantes.'}
  };
  const message = () => copy[lang] || copy.en;
  const normalize = value => value.toLocaleLowerCase().normalize('NFKC').replace(/[\p{P}\p{S}\s]/gu, '');
  const invalid = value => {
    const v = value.trim();
    if (v.length < 2 || v.length > 80 || /[;{}<>\\|^~`]/.test(v) || /(.)\1{4,}/u.test(v)) return true;
    const letters = (v.match(/[\p{L}\p{N}]/gu) || []).length;
    const jamo = (v.match(/[ㄱ-ㅎㅏ-ㅣ]/g) || []).length;
    return letters / Math.max(v.length, 1) < .65 || jamo > Math.max(2, letters * .35);
  };
  const redraw = () => {
    const box = $('#customCategoryChips');
    if (!box) return;
    box.innerHTML = pmCustomCategories.map((category, index) => `<button class="active" data-i="${index}">${category.query} ×</button>`).join('');
    box.querySelectorAll('button').forEach(node => node.onclick = () => { pmCustomCategories.splice(+node.dataset.i, 1); redraw(); });
  };
  const endpoint = location.hostname.endsWith('github.io')
    ? 'https://portmoment.vercel.app/api/custom-search'
    : '/api/custom-search';
  const clearPlaceTypes = [
    {pattern:/수영장|실내수영|swimming\s*pool|piscine|schwimmbad|piscina|プール|游泳池|泳池/i,label:'수영장',term:'swimming pool',stay:100},
    {pattern:/아쿠아리움|수족관|aquarium|水族館|水族馆/i,label:'아쿠아리움',term:'aquarium',stay:90},
    {pattern:/박물관|museum|musée|museo|博物館|博物馆/i,label:'박물관',term:'museum',stay:90},
    {pattern:/미술관|art\s*gallery|gallery|galerie|galería|美術館|美术馆/i,label:'미술관',term:'art gallery',stay:90},
    {pattern:/도서관|library|bibliothèque|bibliothek|biblioteca|図書館|图书馆/i,label:'도서관',term:'library',stay:80},
    {pattern:/동물원|zoo|動物園|动物园/i,label:'동물원',term:'zoo',stay:120},
    {pattern:/영화관|cinema|movie\s*theater|kino|cine|映画館|电影院/i,label:'영화관',term:'cinema',stay:140},
    {pattern:/해수욕장|해변|beach|plage|strand|playa|海水浴場|海滩/i,label:'해수욕장',term:'beach',stay:100}
  ];

  async function findClearPlace(type) {
    const params = new URLSearchParams({format:'jsonv2',limit:'12',namedetails:'1',addressdetails:'1',extratags:'1','accept-language':lang,q:`${type.term} Busan`});
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {headers:{Accept:'application/json'}});
    if (!response.ok) return [];
    return (await response.json()).filter(item => +item.lat > 34.8 && +item.lat < 35.5 && +item.lon > 128.7 && +item.lon < 129.4).map((item,index) => ({
      name:(item.namedetails?.name || item.display_name.split(',')[0]).trim(),
      openingHours:item.extratags?.opening_hours || null,
      estimatedTravelMinutes:20 + index * 6,
      recommendedStayMinutes:type.stay,
      confidence:95
    }));
  }

  async function analyze() {
    const raw = input.value.trim();
    if (invalid(raw)) { output.textContent = message().bad; return; }
    output.textContent = message().search;
    button.disabled = true;
    try {
      const clearType = clearPlaceTypes.find(type => type.pattern.test(raw));
      if (clearType) {
        const places = await findClearPlace(clearType);
        if (!places.length) { output.textContent = message().none; return; }
        const candidates = places.map(place => [place.name,place.estimatedTravelMinutes,place.recommendedStayMinutes,place.confidence,place.openingHours]);
        const existing = pmCustomCategories.findIndex(category => normalize(category.query) === normalize(raw));
        const category = {id:`direct-${Date.now()}`,query:raw,understoodAs:clearType.label,commonThemes:[clearType.label],candidates};
        if (existing >= 0) pmCustomCategories.splice(existing,1,category); else pmCustomCategories.push(category);
        output.textContent = `${message().found} ${message().theme}: ${clearType.label}. ${places.map(place => place.name + (place.openingHours ? ` (${place.openingHours})` : '')).join(', ')}`;
        input.value = ''; redraw(); return;
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: raw, language: lang })
      });
      const result = await response.json();
      if (!response.ok) {
        output.textContent = result.error === 'invalid_query' ? message().bad : result.error === 'no_places' ? message().none : message().offline;
        return;
      }
      if (!result.places?.length) { output.textContent = message().none; return; }
      const candidates = result.places.map(place => [
        place.name,
        place.estimatedTravelMinutes,
        place.recommendedStayMinutes,
        place.confidence,
        place.openingHours || null
      ]);
      const existing = pmCustomCategories.findIndex(category => normalize(category.query) === normalize(raw));
      const category = {
        id: `ai-${Date.now()}`,
        query: raw,
        understoodAs: result.understoodAs,
        commonThemes: result.commonThemes,
        candidates
      };
      if (existing >= 0) pmCustomCategories.splice(existing, 1, category);
      else pmCustomCategories.push(category);
      output.textContent = `${message().found} ${message().theme}: ${result.commonThemes.join(', ')}. ${result.places.map(place => place.name + (place.openingHours ? ` (${place.openingHours})` : '')).join(', ')}`;
      input.value = '';
      redraw();
    } catch (error) {
      output.textContent = message().offline;
    } finally {
      button.disabled = false;
    }
  }
  button.onclick = analyze;
  input.onkeydown = event => { if (event.key === 'Enter' && !button.disabled) analyze(); };
}, 2200));
