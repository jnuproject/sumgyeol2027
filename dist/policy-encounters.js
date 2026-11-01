// Policy facts and source tabs retained; dialogue revised for everyday spoken Korean.
export const EXTRA_POLICY_DIALOGUES=[
 {"id":"bookcamp","category":"문화/대동제","name":"숨결 · 문화/대동제","policy":"제주대학교 북캠핑","place":"잔디광장 옆 본도로 보도","anchor":[-72,-205],"color":"#648f70","topic":"밖에서 책 읽어볼까?","summary":"야외음악당에서 책과 함께 쉬고, 낮의 피크닉과 저녁의 북토크를 도서관 희망도서 신청으로 잇는 구상.","source":"https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit?tab=t.jgc8diudiz",nodes:{
  hello:{"lines":["날씨 좋을 때는 도서관 안에만 있기 아깝더라. 밖에 앉아서 책 읽어본 적 있어?"],"choices":[{"text":"책 안 읽고 멍만 때려도 돼?","next":"first"},{"text":"친구랑 같이 읽으면 좋겠다.","next":"second"}]},
  first:{"lines":["그럼! 책 읽다가 쉬어도 되고, 그냥 바람 쐬면서 앉아 있어도 좋지."],"next":"plan"},
  second:{"lines":["각자 읽던 책 가져와서 재밌었던 부분 얘기해도 좋겠다. 같은 책을 안 읽어도 할 얘기가 많을 것 같아."],"next":"plan"},
  plan:{"lines":["야외음악당에 의자랑 매트를 놓고 「북캠핑」을 열려고 해. 낮에는 피크닉처럼 쉬고, 저녁에는 북토크도 하는 거야."],"choices":[{"text":"읽고 싶은 책이 도서관에 없으면?","next":"detailA"},{"text":"저녁에는 캠핑처럼 하는 거야?","next":"detailB"}]},
  detailA:{"lines":["도서관과 연계해서 현장에서 희망도서를 신청할 수 있게 하려고 해. 북토크 듣다가 읽고 싶어진 책도 신청하고."],"next":"bye"},
  detailB:{"lines":["응, 텐트랑 조명을 두고 간식 먹으면서 책 얘기도 나누는 걸 생각하고 있어. 날씨나 사용할 공간은 더 협의해야 하고."],"next":"bye"},
  bye:{"lines":["아직 기획 중이야. 책 한 권 들고 편하게 올 수 있는 자리가 생기면 좋겠다."],"end":true}
 }},
 {"id":"sports","category":"문화/대동제","name":"숨결 · 문화/대동제","policy":"통합체전 내 부스 활성화","place":"체육관 쪽 본도로 보도","anchor":[-97,-134],"color":"#268db5","topic":"경기 안 뛰어도 재밌게","summary":"경기에 출전하지 않는 학우도 체험·동아리·먹거리 부스로 머물며 함께 즐기는 통합체전 구상.","source":"https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit?tab=t.87ifgzx9mcgw",nodes:{
  hello:{"lines":["체전 때 경기 나가는 편이야? 나는 응원하러 갔다가 친구 경기 끝나면 뭘 할지 모르겠더라."],"choices":[{"text":"나도 구경만 하다가 돌아와.","next":"first"},{"text":"경기 사이에 할 게 있으면 좋겠어.","next":"second"}]},
  first:{"lines":["나도 그래. 꼭 경기에 나가지 않아도 놀 거리가 있으면 더 오래 있다 갈 텐데."],"next":"plan"},
  second:{"lines":["맞아. 다음 경기까지 기다릴 때 친구들이랑 들를 곳이 있으면 좋겠어."],"next":"plan"},
  plan:{"lines":["그래서 통합체전에 동아리 부스랑 체험·먹거리 부스를 늘리려고 해. 경기 보러 온 친구들도 같이 즐길 수 있게."],"choices":[{"text":"나도 부스를 열 수 있어?","next":"detailA"},{"text":"경기하는 데 방해되진 않을까?","next":"detailB"}]},
  detailA:{"lines":["교내 동아리뿐 아니라 개인도 부스를 신청할 수 있게 기획하고 있어. 직접 해보고 싶은 게 있으면 좋겠네!"],"next":"bye"},
  detailB:{"lines":["그래서 경기 구역이랑 부스 구역을 나눠야 해. 경기를 방해하지 않고 편하게 오갈 수 있도록 공간을 협의하려고 해."],"next":"bye"},
  bye:{"lines":["아직 기획 단계지만, 운동을 안 해도 체전이 기다려지면 좋겠어."],"end":true}
 }},
 {"id":"accessibility","category":"인권/평등","name":"숨결 · 인권/평등","policy":"배리어프리 아라캠퍼스","place":"학생회관 진입 마당","anchor":[-99,-34],"color":"#9a779d","topic":"누구나 편하게 다니도록","summary":"단차·안내시설·접근성 지도를 점검하고 행사 기획부터 모두의 이동과 정보 접근을 고려하는 구상.","source":"https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit?tab=t.gz4ehglf9dzr",nodes:{
  hello:{"lines":["여기 턱이 있네. 평소에는 그냥 지나쳤는데, 휠체어나 목발을 쓰면 돌아가야 할 수도 있겠어."],"choices":[{"text":"다른 길로 돌아가야 하면 불편하겠다.","next":"first"},{"text":"행사장도 그런 곳이 있겠네.","next":"second"}]},
  first:{"lines":["응. 어느 길로 가야 편한지 알기 어려울 때도 있지. 실제로 다녀보면서 불편한 곳부터 찾아보려고 해."],"next":"plan"},
  second:{"lines":["맞아. 들어갈 수 있는 길이 있는지, 안내는 알아보기 쉬운지도 처음부터 살펴야 해."],"next":"plan"},
  plan:{"lines":["「배리어프리 아라캠퍼스」는 그런 불편을 줄이려는 정책이야.","보도랑 점자 안내를 점검하고, 편의시설이나 다닐 수 있는 경로를 지도에서 확인할 수 있게 하려고 해."],"choices":[{"text":"행사에서는 뭘 바꾸려고 해?","next":"detailA"},{"text":"불편한 곳을 발견하면 알려도 돼?","next":"detailB"}]},
  detailA:{"lines":["행사 준비할 때부터 진입로, 휠체어석과 동반자 자리, 이미지의 대체 텍스트 등을 확인할 수 있는 안내 기준을 만들려고 해."],"next":"bye"},
  detailB:{"lines":["응. 위치랑 사진을 제보할 수 있는 창구를 만들려고 해. 현장을 확인한 뒤에 관련 부서와 개선 방법을 논의하는 거지."],"next":"bye"},
  bye:{"lines":["아직 준비 중이지만, 어디를 가든 돌아갈 길부터 걱정하지 않아도 되면 좋겠어."],"end":true}
 }},
 {"id":"interview","category":"교육취업","name":"숨결 · 교육취업","policy":"교내 면접스튜디오 구축","place":"경상대 앞 보행로 동쪽","anchor":[-22,87.6],"color":"#9b8254","topic":"화상 면접, 어디서 보지?","summary":"화상·AI 면접을 연습하고 실제 응시에도 이용할 수 있는 장비와 방음 공간을 갖추려는 구상.","source":"https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit?tab=t.oavd62277kcl",nodes:{
  hello:{"lines":["화상 면접 볼 때 어디서 해? 나는 조용한 장소 찾는 것부터 어렵더라."],"choices":[{"text":"집에서는 소음이 신경 쓰여.","next":"first"},{"text":"나는 카메라랑 조명이 걱정돼.","next":"second"}]},
  first:{"lines":["그렇지. 면접 중에 소리 날까 봐 신경 쓰이잖아. 학교에 조용한 공간이 있으면 좋겠어."],"next":"plan"},
  second:{"lines":["장비나 인터넷이 잘 될지 미리 확인할 수 있으면 한결 편하겠지."],"next":"plan"},
  plan:{"lines":["그래서 AI 융복합관과 연계해서 교내 면접스튜디오를 만들려고 해. 방음 부스랑 장비를 갖춰서 연습도 하고, 실제 화상·AI 면접도 볼 수 있게."],"choices":[{"text":"연습하고 피드백도 받을 수 있어?","next":"detailA"},{"text":"면접 말고 화상 회의에도 쓸 수 있어?","next":"detailB"}]},
  detailA:{"lines":["진로취업과의 모의면접·피드백 프로그램과 연결하는 내용도 있어. 연습만 하고 끝나는 게 아니라 부족한 부분도 확인할 수 있도록."],"next":"bye"},
  detailB:{"lines":["소규모 화상 회의에도 쓰는 걸 생각하고 있어. 다만 실제 면접을 우선할 수 있도록 예약 기준은 학교와 정해야 해."],"next":"bye"},
  bye:{"lines":["아직 구축 계획이지만, 장소랑 장비 걱정을 덜고 면접에 집중할 수 있으면 좋겠어. 준비 잘되길 바랄게!"],"end":true}
 }},
 {"id":"scholarship","category":"교육취업","name":"숨결 · 교육취업","policy":"내장학찾기","place":"중앙 잔디광장 옆 보도","anchor":[-73,-115],"color":"#b08c56","topic":"이 장학금, 나도 신청할 수 있나?","summary":"분산된 교내외 장학 공지를 조건에 따라 모으고 비교해 자신에게 맞는 정보를 찾기 쉽게 하는 구상.","source":"https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit?tab=t.eqhn59w13lab",nodes:{
  hello:{"lines":["장학 공지 보다가 신청 기간 놓친 적 있어? 나는 조건 읽다가 내 얘기 아닌 줄 알고 넘긴 적도 있어."],"choices":[{"text":"공지가 흩어져 있어서 자꾸 놓쳐.","next":"first"},{"text":"조건이 복잡해서 헷갈려.","next":"second"}]},
  first:{"lines":["맞아. 학교 공지도 보고, 다른 기관 홈페이지도 찾아봐야 하니까 놓치기 쉽지."],"next":"plan"},
  second:{"lines":["성적이나 소득 기준에 제출 서류까지… 여러 공지를 같이 비교하기도 어렵고."],"next":"plan"},
  plan:{"lines":["「내장학찾기」는 교내외 장학 정보를 모아서 찾아보기 쉽게 하려는 정책이야. 내가 설정한 조건에 맞는 공지를 살펴볼 수 있도록."],"choices":[{"text":"학교 밖 장학금도 볼 수 있어?","next":"detailA"},{"text":"어떤 정보를 비교할 수 있어?","next":"detailB"}]},
  detailA:{"lines":["응. 지자체나 재단의 장학 공지도 모으려고 해. 지난 공지가 그대로 남지 않게 최신 정보인지 확인하는 것도 중요하고."],"next":"bye"},
  detailB:{"lines":["지원 조건이랑 제출 서류, 지급 방식, 다른 장학금과 중복해서 받을 수 있는지 등을 비교할 수 있게 하려고 해. 신청 전에는 해당 기관의 기준도 확인해야 하고."],"next":"bye"},
  bye:{"lines":["아직 시스템을 구상하는 단계야. 나한테 맞는 장학금 찾다가 지치는 일부터 줄여보고 싶어."],"end":true}
 }},
 {"id":"reading","category":"시설/교통","name":"숨결 · 시설/교통","policy":"중앙도서관 열람실 정비","place":"중앙도서관 앞마당","anchor":[-118,224],"color":"#538c9c","topic":"콘센트 있는 자리 찾는 중?","summary":"좌석 총량을 지키면서 전원 접근성·책상·공간 구성을 학우 수요조사와 공동 설계로 개선하려는 구상.","source":"https://docs.google.com/document/d/1qlYzuaXI4mRgDaOc3JZ5vBsnUvU3q24We7K8dfq6oZw/edit?tab=t.uide5cdaab1j",nodes:{
  hello:{"lines":["도서관 자리 고를 때 뭐부터 봐? 나는 노트북 충전할 수 있는 자리부터 찾게 돼."],"choices":[{"text":"맞아. 콘센트가 제일 중요해.","next":"first"},{"text":"나는 조용한 자리가 좋아.","next":"second"}]},
  first:{"lines":["충전 못 해서 또 옮기면 번거롭지. 전원을 쓰기 편하게 바꾸는 걸 먼저 살펴보려고 해."],"next":"plan"},
  second:{"lines":["그렇지. 노트북 쓰는 사람도 있고 조용히 책 보는 사람도 있으니까, 공간을 어떻게 나눌지 의견을 들어봐야겠어."],"next":"plan"},
  plan:{"lines":["중앙도서관 열람실을 정비하려고 해. 자리 수는 유지하면서 콘센트랑 낡은 책상·칸막이, 이동 동선을 개선하는 거야."],"choices":[{"text":"학생 의견도 물어보고 바꾸는 거야?","next":"detailA"},{"text":"공사할 때는 어디서 공부해?","next":"detailB"}]},
  detailA:{"lines":["응. 필요한 시설을 조사하고, 설계안을 공개해서 의견을 받으려고 해. 먼저 바꿔본 뒤 실제로 써본 학우들의 평가도 받고."],"next":"bye"},
  detailB:{"lines":["방학 중에 일부부터 정비하고, 대신 이용할 열람 공간도 안내하려고 해. 실제 일정이랑 공간은 도서관과 협의해야 해."],"next":"bye"},
  bye:{"lines":["아직 도서관과 함께 준비할 계획이야. 자리 때문에 신경 쓰는 일은 좀 줄었으면 좋겠다."],"end":true}
 }},
 {"id":"bus","category":"시설/교통","name":"숨결 · 시설/교통","policy":"순환버스 개편","place":"중앙도서관 앞 정류장 쪽","anchor":[-82,219],"color":"#417bb4","topic":"버스 언제 오려나","summary":"학우의 실제 이동 수요와 운전원 휴게를 함께 고려해 순환버스 운행 공백·정류장·안내를 개선하려는 구상.","source":"https://docs.google.com/document/d/1qlYzuaXI4mRgDaOc3JZ5vBsnUvU3q24We7K8dfq6oZw/edit?tab=t.hqzufskjpgjb",nodes:{
  hello:{"lines":["버스 기다려? 언제 오는지 모르고 있으면 자꾸 도로만 보게 되더라."],"choices":[{"text":"점심시간에는 타기 어렵더라.","next":"first"},{"text":"나는 내려서도 한참 걸어야 해.","next":"second"}]},
  first:{"lines":["수업 사이에 밥 먹으러 갈 때 아쉽지. 점심 무렵에 얼마나 이용하는지, 운행이 비는 시간은 어떤지부터 확인하려고 해."],"next":"plan"},
  second:{"lines":["정류장 위치가 잘 안 맞는구나. 학우들이 실제로 어디서 어디로 다니는지 물어보고 노선을 살펴봐야겠어."],"next":"plan"},
  plan:{"lines":["순환버스 운행 시간과 정류장을 다시 검토하려고 해. 이용 수요를 조사하고, 기사님 휴게시간도 보장하면서 불편을 줄이는 방법을 찾는 거야."],"choices":[{"text":"운행을 늘리는 것도 쉽진 않겠네.","next":"detailA"},{"text":"시간표라도 보기 쉬우면 좋겠어.","next":"detailB"}]},
  detailA:{"lines":["응. 기사님도 쉬셔야 하니까. 시간을 조정하거나 교대하는 방법이 가능한지 실제 운행 여건을 보고 논의해야 해."],"next":"bye"},
  detailB:{"lines":["맞아. 정류장과 안내 채널에 시간표나 운행하지 않는 시간을 알기 쉽게 보여주려는 내용도 있어. 모르고 기다리는 일은 줄여야지."],"next":"bye"},
  bye:{"lines":["아직 개편 계획이야. 자주 타는 학우들 얘기를 듣고, 지금보다 편하게 다닐 방법을 찾아보려고 해."],"end":true}
 }},
 {"id":"tumbler","category":"그린환경","name":"숨결 · 그린환경","policy":"텀블러 세척기 추가 설치","place":"학생회관 진입 마당","anchor":[-112,-28],"color":"#518e70","topic":"텀블러 씻을 곳이 가까우면","summary":"학생회관 등 이용 수요가 높은 공간에 세척 시설을 늘리고 위생·유지관리까지 함께 마련하려는 구상.","source":"https://docs.google.com/document/d/1qlYzuaXI4mRgDaOc3JZ5vBsnUvU3q24We7K8dfq6oZw/edit?tab=t.rscw9jub4q95",nodes:{
  hello:{"lines":["텀블러 자주 써? 나는 다 마신 다음에 씻을 곳 찾는 게 제일 귀찮더라."],"choices":[{"text":"맞아. 그래서 안 가져오는 날도 있어.","next":"first"},{"text":"나는 세척기가 있어도 깨끗한지 신경 쓰여.","next":"second"}]},
  first:{"lines":["나도 가방에 넣어뒀다가 집에서 씻곤 해. 자주 다니는 곳에 세척기가 있으면 바로 씻고 넣을 텐데."],"next":"plan"},
  second:{"lines":["맞아. 설치만 해놓고 관리가 안 되면 쓰기 꺼려지니까. 청소랑 점검도 같이 챙겨야 해."],"next":"plan"},
  plan:{"lines":["학생회관처럼 많이 이용하는 곳에 텀블러 세척기를 더 설치하려고 해. 어디에 필요한지 조사하고, 관리 방법도 함께 정하는 거야."],"choices":[{"text":"어디에 설치할지는 어떻게 정해?","next":"detailA"},{"text":"설치한 뒤 관리는 누가 해?","next":"detailB"}]},
  detailA:{"lines":["지금 시설이 어디 있는지, 학우들이 얼마나 쓰는지 먼저 살펴보려고 해. 수도랑 전기 연결이 가능한지도 확인해야 하고."],"next":"bye"},
  detailB:{"lines":["일상적인 청소와 위생 확인, 전문 점검을 어떻게 할지 함께 마련하려고 해. 쓰면서 불편한 점을 학생회에 알려줄 수 있게 하고."],"next":"bye"},
  bye:{"lines":["아직 추가 설치를 준비하는 단계야. 텀블러 챙겨 다니는 게 조금은 편해지면 좋겠다."],"end":true}
 }}
];
