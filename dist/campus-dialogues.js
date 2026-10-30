// Fictional campus conversations. These are not additional policy promises.
const photo={kind:'photo'},map=target=>({kind:'map',target});
export const CAMPUS_DIALOGUES=[
 {id:'campus-newcomer',kind:'campus',name:'산책하는 학우',place:'정문에서 올라오는 길',anchor:[-97,-390],color:'#7e9c8c',topic:'오늘은 어디까지 걸어볼까?',nodes:{
  hello:{lines:['안녕! 여기 처음 와? 길이 쭉 뻗어 있어서 걷다 보면 생각보다 멀리 오게 되더라.'],choices:[{text:'숨결 친구들을 만나보고 싶어.',next:'friends'},{text:'조용히 쉬고 싶은 날이야.',next:'rest'}]},
  friends:{lines:['나도 한 명 만나면 다 끝인 줄 알았는데, 곳곳에서 다른 이야기를 하더라. 오늘은 어느 쪽이 궁금해?'],choices:[{text:'잔디광장 옆 친구를 찾아볼래.',next:'book'},{text:'버스 기다리는 친구는 어디 있어?',next:'bus'}]},
  rest:{lines:['그럼 잔디광장 옆 본도로 보도로 가봐. 책을 들고 있는 숨결 친구가 있어. 바쁜 날에도 쉬는 이야기를 하더라.'],choices:[{text:'지도에서 위치를 보여줘.',next:'book'},{text:'고마워, 조금 더 걸어볼게.',next:'bye'}]},
  book:{lines:['지도에 그 친구 있는 곳을 표시해줄게. 서두르지 않아도 돼.'],end:true,action:map('bookcamp')},bus:{lines:['중앙도서관 앞쪽이야. 지도에서 표시를 보고 찾아가봐!'],end:true,action:map('bus')},bye:{lines:['응, 걷다가 또 만나!'],end:true}
 }},
 {id:'campus-photo',kind:'campus',name:'사진 찍는 학우',place:'학생회관 진입 마당',anchor:[-118,-30],color:'#9a829d',topic:'같이 사진 한 장 찍을래?',nodes:{
  hello:{lines:['방금 여기 빛이 예쁘지 않았어? 풍경만 찍다가 같이 나온 사진도 남기고 싶어졌어.'],choices:[{text:'좋아, 같이 한 장 찍자!',next:'photo'},{text:'어디서 찍으면 예쁠까?',next:'spot'}]},
  spot:{lines:['건물만 꽉 채우기보다 나무랑 하늘을 조금 넣으면 이 길을 걷던 느낌이 남더라. 마음에 드는 쪽으로 화면을 돌려봐.'],choices:[{text:'그럼 같이 찍어보자.',next:'photo'},{text:'오늘은 구경만 할래.',next:'bye'}]},
  photo:{lines:['좋아! 우리 둘이 나오게 카메라를 맞춰볼게. 마음에 들면 사진 저장을 눌러줘.'],end:true,action:photo},bye:{lines:['그것도 좋지. 꼭 사진으로 남기지 않아도 기억에 남는 날이 있으니까.'],end:true}
 }},
 {id:'campus-reader',kind:'campus',name:'책 읽는 학우',place:'중앙도서관 앞 쉼터',anchor:[-124,219],color:'#8d9976',topic:'잠깐 책 이야기할래?',nodes:{
  hello:{lines:['쉿… 아, 여긴 열람실 밖이지. 나도 모르게 작게 말하고 있었네. 잠깐 쉬는 중이야?'],choices:[{text:'응, 집중이 잘 안 돼서.',next:'break'},{text:'재밌는 책 읽고 있어?',next:'book'}]},
  break:{lines:['그럴 때 나는 여기까지 걸어 나와. 뭘 더 해야 한다는 생각을 잠깐 내려놓으면 다시 들어갈 힘이 나더라.'],choices:[{text:'나도 잠깐 하늘 보고 갈래.',next:'bye'},{text:'이왕 나온 김에 사진 한 장?',next:'photo'}]},
  book:{lines:['오늘은 한 문장만 마음에 남아도 괜찮다고 생각하면서 읽고 있어. 다른 날 읽으면 다른 문장이 보이기도 하니까.'],choices:[{text:'잔디에서 읽는 책 이야기도 궁금해.',next:'guide'},{text:'좋은 쉬는 시간이었네.',next:'bye'}]},
  guide:{lines:['잔디광장 옆 숨결 친구한테 가봐. 지도를 표시해줄게.'],end:true,action:map('bookcamp')},photo:{lines:['좋아, 잠깐 책을 덮고 같이 한 장 남기자!'],end:true,action:photo},bye:{lines:['오늘도 너무 몰아붙이지 말자. 잠깐 쉬어도 하루는 이어지니까.'],end:true}
 }},
 {id:'campus-runner',kind:'campus',name:'운동하러 온 학우',place:'체육관 쪽 본도로 보도',anchor:[-97,-88],color:'#b58f77',topic:'뛰는 사람, 구경하는 사람',nodes:{
  hello:{lines:['헉, 반 바퀴 뛰었는데 한 바퀴 뛴 척하고 싶다. 너는 달리러 왔어, 산책하러 왔어?'],choices:[{text:'나는 오늘 산책 팀이야.',next:'walk'},{text:'체전 분위기가 생각나네.',next:'sports'}]},
  walk:{lines:['좋아. 달리는 사람 옆에 걷는 사람도 있어야 운동장이 더 재밌지. 우리 잠깐 사진이나 남길까?'],choices:[{text:'좋아, 운동 인증 한 장!',next:'photo'},{text:'조금 더 걸어볼래.',next:'bye'}]},
  sports:{lines:['체육관 쪽 본도로 보도에 체전 이야기를 하는 숨결 친구가 있어. 경기 밖에서도 놀 거리를 고민하더라.'],choices:[{text:'위치를 알려줘.',next:'guide'},{text:'고마워, 이따 들러볼게.',next:'bye'}]},
  guide:{lines:['지도에 표시해줄게. 내 응원도 전해줘!'],end:true,action:map('sports')},photo:{lines:['좋아! 잠깐 숨 고르고 같이 찍자.'],end:true,action:photo},bye:{lines:['각자 속도로 가자. 나도 이제 남은 반 바퀴 마저 가야겠다!'],end:true}
 }},
 {id:'campus-clouds',kind:'campus',name:'잔디광장의 학우',place:'잔디광장 북쪽 보도',anchor:[-72,-240],color:'#739aa3',topic:'잠깐의 구름 구경',nodes:{
  hello:{lines:['여기서 하늘 보고 있으면 다음 수업 생각이 잠깐 멈춰. 딱 잠깐만 쉬었다 갈래?'],choices:[{text:'좋아, 오늘은 좀 쉬고 싶어.',next:'rest'},{text:'친구한테 보여줄 사진을 남길래.',next:'photo'}]},
  rest:{lines:['아무것도 안 하는 시간도 하나쯤 있어야지. 저쪽 잔디광장 옆 숨결 친구는 캠퍼스에서 쉬는 자리를 구상하고 있더라.'],choices:[{text:'그 친구에게 가보고 싶어.',next:'guide'},{text:'나는 조금 더 여기 있을래.',next:'bye'}]},
  guide:{lines:['지도에 표시해줄게. 오늘 산책의 다음 장면이 될지도 모르겠다.'],end:true,action:map('bookcamp')},photo:{lines:['좋아! 하늘이랑 우리 둘을 같이 담아보자.'],end:true,action:photo},bye:{lines:['응, 충분히 쉬었다 가. 오늘 하늘은 조금 오래 봐도 괜찮을 것 같아.'],end:true}
 }},
 {id:'campus-coffee',kind:'campus',name:'텀블러를 든 학우',place:'학생회관으로 가는 보도',anchor:[-97,-63],color:'#9b8976',topic:'다 마신 커피의 다음 장면',nodes:{
  hello:{lines:['커피는 다 마셨는데 텀블러는 아직 들고 다니는 중이야. 학생회관 쪽으로 가려고.'],choices:[{text:'텀블러 이야기하는 숨결이 있어?',next:'guide'},{text:'가는 길에 사진 한 장 찍을래?',next:'photo'}]},
  guide:{lines:['응. 학생회관 진입 마당에서 만났어. 같은 얘기를 내가 다시 하는 것보다 직접 만나보면 좋겠다. 지도에 표시해줄게.'],end:true,action:map('tumbler')},photo:{lines:['좋아! 오늘의 작은 산책도 한 장 남기자.'],end:true,action:photo}
 }}
];
