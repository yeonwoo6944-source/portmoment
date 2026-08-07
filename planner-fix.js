/* Semantic custom-input expansion and non-skippable daily meals. */
window.addEventListener('load',()=>setTimeout(()=>{
const concepts=[
{r:/물고기|해양생물|바닷속|상어|돌고래|fish|marine life|underwater|shark|dolphin|魚|海洋生物|鲨鱼|海豚/i,p:[['Busan Sea Life Aquarium',35,100,98],['Busan National Maritime Museum Aquarium',25,80,90]]},
{r:/별|천문|우주|행성|야경|전망|star|space|planet|astronomy|night view|observatory|星|宇宙|夜景|展望/i,p:[['Geumnyeonsan Observatory',28,90,92],['Hwangnyeongsan Observatory',30,90,90]]},
{r:/만들기|공예|그림|도자|체험|craft|make|painting|pottery|ceramic|手作|工芸|陶芸|手工|陶瓷/i,p:[['Busan Pottery Experience Center',30,100,91],['F1963 Creative Space',30,90,86]]},
{r:/책|독서|서점|문학|book|reading|bookstore|literature|本|読書|書店|书|阅读/i,p:[['Bosudong Book Alley',15,90,95],['F1963 Library',30,90,86]]},
{r:/춤|댄스|공연|연극|영화|콘서트|dance|performance|theater|cinema|concert|踊り|公演|映画|舞蹈|演出|电影/i,p:[['Busan Cinema Center',32,120,94],['Busan Cultural Center',28,120,89]]},
{r:/운동|스포츠|축구|야구|자전거|클라이밍|sports?|football|baseball|cycling|climbing|スポーツ|野球|自転車|运动|棒球|自行车/i,p:[['Sajik Sports Complex',30,120,93],['Gwangalli SUP Zone',28,100,87]]},
{r:/동물|새|고양이|강아지|animal|bird|cat|dog|動物|鳥|猫|犬|动物|鸟/i,p:[['Samjung The Park Zoo',30,120,90],['Nakdong Estuary Eco Center',35,100,88]]},
{r:/꽃|정원|숲|식물|자연|flower|garden|forest|plant|花|庭園|森|植物|花园/i,p:[['Busan Citizens Park',25,100,91],['Ahopsan Forest',40,110,89]]}
];
const original=$('#analyzeCustom'),input=$('#customCategory'),result=$('#customResult');
const redraw=()=>{let box=$('#customCategoryChips');if(!box)return;box.innerHTML=pmCustomCategories.map((c,i)=>`<button class="active" data-i="${i}">${c.query} ×</button>`).join('');box.querySelectorAll('button').forEach(b=>b.onclick=()=>{pmCustomCategories.splice(+b.dataset.i,1);redraw()})};
if(original&&input){const prior=original.onclick;async function semanticAdd(){let raw=input.value.trim();if(raw.length<2||/[ㄱ-ㅎㅏ-ㅣ]$/.test(raw)){result.textContent=lang==='ko'?'단어가 완성되지 않았습니다. 다시 입력해 주세요.':'Please enter a complete word.';return}let match=concepts.find(c=>c.r.test(raw));if(match){pmCustomCategories.push({id:'semantic-'+Date.now(),query:raw,candidates:match.p});result.textContent=(lang==='ko'?'관련 활동 장소를 찾았습니다: ':'Related activity places found: ')+match.p.map(p=>p[0]).join(', ');input.value='';redraw();return}await prior.call(original)}original.onclick=semanticAdd;input.onkeydown=e=>{if(e.key==='Enter')semanticAdd()}}
function planner(){
if(!chosen.length&&!pmCustomCategories.length){show(t('noCat'),'','');return}
let info=available(),start=new Date(info.start),end=new Date(start.getTime()+info.left*60000),cruiseStart=new Date(Math.max(start.getTime(),end.getTime()-3600000)),cursor=new Date(start),events=[],used=new Set(),food=[...places.food].sort(()=>Math.random()-.5);
let pool=pmCustomCategories.flatMap(c=>c.candidates.map(p=>({name:p[0],travel:Math.ceil(p[1]*1.3+10),stay:p[2]||80,score:p[3]||80,custom:true,category:c.query}))).concat(chosen.filter(k=>k!=='food').flatMap(k=>(places[k]||[]).map(p=>({name:p[0],travel:Math.ceil(p[1]*1.3+10),stay:70,score:75+Math.random()*20}))));
if(chosen.includes('food'))pool.push(...food.map(p=>({name:p[0],travel:Math.ceil(p[1]*1.3+10),stay:60,score:75+Math.random()*20,extraFood:true})));
let meals=[];for(let day=new Date(start.getFullYear(),start.getMonth(),start.getDate());day<end;day.setDate(day.getDate()+1))[7,12,18].forEach((h,i)=>{let at=new Date(day);at.setHours(h,0,0,0);if(at>=start&&at<cruiseStart)meals.push({at,label:i===0?'아침밥':i===1?'점심밥':'저녁밥'})});
let mi=0,active=0;
while(cursor<cruiseStart){let meal=meals[mi];if(meal&&cursor>=meal.at){let p=food[mi%food.length],finish=new Date(cursor.getTime()+75*60000);if(finish<=cruiseStart){events.push({type:'meal',start:new Date(cursor),end:finish,name:placeName([p[0]]),meta:lang==='ko'?`${meal.label} 추천 · ${String(meal.at.getHours()).padStart(2,'0')}:00 전후`:`Meal recommendation · around ${String(meal.at.getHours()).padStart(2,'0')}:00`});cursor=finish;mi++;active=0;continue}mi++;continue}
let remaining=Math.floor((cruiseStart-cursor)/60000),nextMeal=meals[mi]?.at,fit=pool.filter(x=>!used.has(x.name)&&x.travel+x.stay<=remaining&&(!x.extraFood||(cursor.getHours()>=7&&cursor.getHours()<22))&&(!nextMeal||cursor.getTime()+(x.travel+x.stay)*60000<=nextMeal.getTime())).sort((a,b)=>b.score-a.score||a.travel-b.travel)[0];
if(!fit){let target=nextMeal&&nextMeal<cruiseStart?nextMeal:cruiseStart;if(target>cursor)events.push({type:'rest',start:new Date(cursor),end:new Date(target),name:lang==='ko'?'휴식 시간':'Rest time'});cursor=new Date(target);continue}
if(active>=150&&cursor.getTime()+600000+(fit.travel+fit.stay)*60000<=(nextMeal||cruiseStart).getTime()){let r=new Date(cursor.getTime()+600000);events.push({type:'rest',start:new Date(cursor),end:r,name:lang==='ko'?'휴식 시간':'Rest time'});cursor=r;active=0;continue}
used.add(fit.name);let finish=new Date(cursor.getTime()+(fit.travel+fit.stay)*60000);events.push({type:fit.extraFood?'meal':'place',start:new Date(cursor),end:finish,name:fit.custom?fit.name:placeName([fit.name]),meta:fit.custom?`${lang==='ko'?'직접 입력 카테고리':'Custom category'}: ${fit.category}`:(lang==='ko'?'이동 및 활동':'Travel and activity')});cursor=finish;active+=fit.travel+fit.stay}
events.push({type:'cruise',start:cruiseStart,end,name:lang==='ko'?'크루즈로 이동':'Return to the cruise'});
let last='',f=d=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,rows=events.map((e,i)=>{let key=`${e.start.getFullYear()}-${e.start.getMonth()}-${e.start.getDate()}`,date=key!==last?`${e.start.getFullYear()}.${e.start.getMonth()+1}.${e.start.getDate()} `:'';last=key;return `<div class="detail-row ${e.type}"><span>${e.type==='meal'?'●':e.type==='rest'?'Ⅱ':e.type==='cruise'?'↗':i+1}</span><div><strong>${date}${f(e.start)}–${f(e.end)} · ${e.name}</strong><p>${e.meta||''}</p></div></div>`}).join('');show(t('route'),lang==='ko'?'필수 식사 시간과 직접 입력을 반영한 동선':'Route with mandatory meals and custom interests',rows)}
$('#generatePlan').onclick=planner;$('#refreshRoute').onclick=planner
},1850));
