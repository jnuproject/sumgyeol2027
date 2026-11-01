// Fictional everyday conversations. These NPCs can point to policy friends without adding promises.
export const CAMPUS_DIALOGUES=[
 {"id":"campus-newcomer","kind":"campus","name":"산책하는 학우","place":"정문에서 올라오는 길","anchor":[-97,-390],"color":"#7e9c8c","topic":"학교 한 바퀴 돌까?",nodes:{
  hello:{"lines":["안녕! 산책 중이야? 나도 잠깐 걷다가 여기까지 왔어."],"choices":[{"text":"응. 숨결 친구들도 만나보려고.","next":"friends"},{"text":"응, 조용한 데서 좀 쉬고 싶어.","next":"rest"}]},
  friends:{"lines":["나는 잔디광장 쪽이랑 도서관 앞에서 만났어. 어디부터 가볼래?"],"choices":[{"text":"잔디광장부터 가볼까?","next":"book"},{"text":"도서관 앞에는 누가 있어?","next":"bus"}]},
  rest:{"lines":["잔디광장 쪽은 어때? 책 읽다가 쉬기 좋더라. 거기 있는 숨결 친구가 북캠핑도 준비하고 있대."],"choices":[{"text":"어디인지 알려줄래?","next":"book"},{"text":"좋다. 천천히 걸어가 볼게.","next":"bye"}]},
  book:{"lines":["지도에 표시해줄게. 여기서 길 따라 올라가면 돼."],"end":true,"action":{"kind":"map","target":"bookcamp"}},
  bus:{"lines":["버스 정류장 쪽에 있어. 지도에 표시해둘게!"],"end":true,"action":{"kind":"map","target":"bus"}},
  bye:{"lines":["응, 잘 다녀와! 또 보자."],"end":true}
 }},
 {"id":"campus-photo","kind":"campus","name":"사진 찍는 학우","place":"학생회관 진입 마당","anchor":[-118,-30],"color":"#9a829d","topic":"같이 사진 찍을래?",nodes:{
  hello:{"lines":["여기 나무랑 건물이 같이 나오니까 예쁘더라. 혹시 같이 사진 찍을래?"],"choices":[{"text":"좋아! 같이 찍자.","next":"photo"},{"text":"어느 쪽을 보고 찍을까?","next":"spot"}]},
  spot:{"lines":["나무 옆에서 찍어볼까? 하늘도 조금 나오게. 네가 마음에 드는 쪽으로 카메라 돌려봐."],"choices":[{"text":"좋아, 여기서 찍자.","next":"photo"},{"text":"나는 좀 더 둘러보고 올게.","next":"bye"}]},
  photo:{"lines":["자, 여기 봐! 마음에 들면 저장해둬."],"end":true,"action":{"kind":"photo"}},
  bye:{"lines":["응! 예쁜 자리 찾으면 나도 알려줘."],"end":true}
 }},
 {"id":"campus-reader","kind":"campus","name":"책 읽는 학우","place":"중앙도서관 앞 쉼터","anchor":[-124,219],"color":"#8d9976","topic":"잠깐 쉬는 중이야?",nodes:{
  hello:{"lines":["쉿… 아, 밖이었지. 계속 도서관에 있었더니 나도 모르게 작은 소리로 말했네. 너도 쉬러 나왔어?"],"choices":[{"text":"응, 집중이 잘 안 돼서.","next":"break"},{"text":"응. 무슨 책 읽고 있어?","next":"book"}]},
  break:{"lines":["나도 같은 줄만 자꾸 읽어서 나왔어. 바람 좀 쐬고 들어가려고."],"choices":[{"text":"나도 좀 앉아 있다 가야겠다.","next":"bye"},{"text":"우리 쉬는 김에 사진이나 찍을까?","next":"photo"}]},
  book:{"lines":["소설 읽고 있어. 한 장만 더 읽고 들어가려는데 자꾸 다음 장이 궁금해지네."],"choices":[{"text":"잔디에 앉아서 읽어도 좋겠다.","next":"guide"},{"text":"재밌나 보다. 마저 읽어!","next":"bye"}]},
  guide:{"lines":["그러게! 저쪽에 있는 숨결 친구가 야외음악당에서 북캠핑을 준비한대. 위치 알려줄게."],"end":true,"action":{"kind":"map","target":"bookcamp"}},
  photo:{"lines":["좋아! 책은 잠깐 내려놓고 찍자."],"end":true,"action":{"kind":"photo"}},
  bye:{"lines":["응, 쉬었다가 들어가. 나도 조금만 더 있다 가려고."],"end":true}
 }},
 {"id":"campus-runner","kind":"campus","name":"운동하러 온 학우","place":"체육관 쪽 본도로 보도","anchor":[-97,-88],"color":"#b58f77","topic":"반 바퀴만 더!",nodes:{
  hello:{"lines":["헉, 아직 반 바퀴밖에 안 뛰었네. 너도 운동하러 왔어?"],"choices":[{"text":"나는 걷기만 하려고.","next":"walk"},{"text":"뛰는 거 보니까 체전 생각난다.","next":"sports"}]},
  walk:{"lines":["그것도 좋지. 나도 잠깐 걸으면서 숨 좀 돌려야겠다. 같이 사진 찍을래?"],"choices":[{"text":"좋아. 운동한 기념으로!","next":"photo"},{"text":"나는 조금 더 걷고 올게.","next":"bye"}]},
  sports:{"lines":["맞아. 체전 때 사람 많으면 덜 힘든 것 같던데. 저쪽 숨결 친구는 경기 안 뛰는 사람도 놀 수 있게 부스를 늘리려고 한대."],"choices":[{"text":"오, 어디 있어?","next":"guide"},{"text":"재밌겠다. 이따 들러볼게.","next":"bye"}]},
  guide:{"lines":["체육관 쪽 길에 있어. 지도에 표시해줄게."],"end":true,"action":{"kind":"map","target":"sports"}},
  photo:{"lines":["잠깐만, 숨 좀 고르고… 됐다. 찍자!"],"end":true,"action":{"kind":"photo"}},
  bye:{"lines":["잘 다녀와! 나도 남은 반 바퀴 마저 뛰어야겠다."],"end":true}
 }},
 {"id":"campus-clouds","kind":"campus","name":"잔디광장의 학우","place":"잔디광장 북쪽 보도","anchor":[-72,-240],"color":"#739aa3","topic":"저 구름 좀 봐",nodes:{
  hello:{"lines":["저 구름, 아까는 귤 같았는데 지금은 그냥 납작해졌네. 잠깐 보고 갈래?"],"choices":[{"text":"좋아. 나도 좀 쉬고 싶었어.","next":"rest"},{"text":"사라지기 전에 사진 찍자.","next":"photo"}]},
  rest:{"lines":["여기 앉아 있으니까 일어나기가 싫다. 책이랑 간식도 가져올걸."],"choices":[{"text":"여기서 책 읽어도 좋겠다.","next":"guide"},{"text":"난 조금만 더 앉아 있을래.","next":"bye"}]},
  guide:{"lines":["그러면 저쪽 숨결 친구한테 가봐. 야외음악당에서 책 읽고 쉬는 북캠핑을 준비한대. 지도에 표시해줄게."],"end":true,"action":{"kind":"map","target":"bookcamp"}},
  photo:{"lines":["좋아. 구름 모양 또 바뀌기 전에 찍자!"],"end":true,"action":{"kind":"photo"}},
  bye:{"lines":["응. 나도 저 구름만 조금 더 보고 가려고."],"end":true}
 }},
 {"id":"campus-coffee","kind":"campus","name":"텀블러를 든 학우","place":"학생회관으로 가는 보도","anchor":[-97,-63],"color":"#9b8976","topic":"텀블러 씻고 가야겠다",nodes:{
  hello:{"lines":["커피를 다 마셨는데 씻을 데가 없네. 이대로 가방에 넣기는 좀 그렇고…"],"choices":[{"text":"근처에 씻을 데 없을까?","next":"guide"},{"text":"뚜껑 잘 닫아. 가방에서 새면 큰일 나.","next":"photo"}]},
  guide:{"lines":["나도 찾는 중이야. 아까 학생회관 앞에서 만난 숨결 친구가 텀블러 세척기를 더 놓으려고 한다던데. 어디 있는지 표시해줄게."],"end":true,"action":{"kind":"map","target":"tumbler"}},
  photo:{"lines":["그래서 계속 손에 들고 있었어. 커피는 다 마셨는데 짐은 그대로네."],"choices":[{"text":"그럼 잠깐 내려놓고 사진 찍을까?","next":"photoTogether"},{"text":"세척기 놓는다는 친구는 어디 있어?","next":"guide"}]},
  photoTogether:{"lines":["좋아. 텀블러는 옆에 두고… 자, 찍자!"],"end":true,"action":{"kind":"photo"}}
 }}
];
