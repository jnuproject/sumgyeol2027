// Owner-approved roster; new titles have no invented dates, prices or operating commitments.
export const EXTRA_POLICY_DIALOGUES=[
 {
  "id": "lounge",
  "category": "복지",
  "name": "숨결 · 복지",
  "policy": "중앙도서관 복합휴식 라운지 조성",
  "place": "중앙도서관 앞마당",
  "anchor": [
   -118,
   224
  ],
  "color": "#268fab",
  "topic": "공부하다 잠깐 쉴 곳",
  "summary": "중앙도서관에 학우들이 쉬어갈 수 있는 복합휴식 라운지 조성을 추진하는 정책.",
  "source": null,
  "sourceNote": "사용자가 확정한 메타버스 정책 목록. 세부 운영안 미제공.",
  "nodes": {
   "hello": {
    "lines": [
     "공부하다가 쉬려고 나왔어? 나도 잠깐 머리 좀 식히는 중이야."
    ],
    "choices": [
     {
      "text": "앉아서 편하게 쉬고 싶어.",
      "next": "first"
     },
     {
      "text": "도서관 안에 쉴 곳이 있으면 좋겠다.",
      "next": "second"
     }
    ]
   },
   "first": {
    "lines": [
     "계속 책상에 앉아 있으면 쉬는 것도 잘 안 되더라."
    ],
    "next": "plan"
   },
   "second": {
    "lines": [
     "맞아. 잠깐 쉬려고 멀리까지 나가기는 번거롭지."
    ],
    "next": "plan"
   },
   "plan": {
    "lines": [
     "「중앙도서관 복합휴식 라운지 조성」은 도서관에서 공부하는 사이 편하게 쉬어갈 공간을 마련하려는 정책이야."
    ],
    "choices": [
     {
      "text": "어떤 시설이 들어가?",
      "next": "detailA"
     },
     {
      "text": "공부하는 자리랑은 다른 공간이야?",
      "next": "detailB"
     }
    ]
   },
   "detailA": {
    "lines": [
     "구체적인 시설 구성은 아직 전달받은 목록에 없어. 무엇이 필요한지부터 살펴봐야 해."
    ],
    "next": "bye"
   },
   "detailB": {
    "lines": [
     "이번 정책은 쉬어갈 공간에 관한 이야기야. 실제 공간 배치는 도서관과 협의해야 하고."
    ],
    "next": "bye"
   },
   "bye": {
    "lines": [
     "잠깐 쉬고 나면 다시 집중하기도 좋잖아. 너도 조금 쉬었다 가!"
    ],
    "end": true
   }
  }
 },
 {
  "id": "bookcamp",
  "category": "문화/대동제",
  "name": "숨결 · 문화/대동제",
  "policy": "북캠핑 IN ARA",
  "place": "잔디광장 옆 본도로 보도",
  "anchor": [
   -72,
   -205
  ],
  "color": "#648f70",
  "topic": "밖에서 책 읽어볼까?",
  "summary": "야외음악당에서 책과 함께 쉬고, 낮의 피크닉과 저녁의 북토크를 도서관 희망도서 신청으로 잇는 구상.",
  "source": "https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit?tab=t.jgc8diudiz",
  "nodes": {
   "hello": {
    "lines": [
     "날씨 좋을 때는 도서관 안에만 있기 아깝더라. 밖에 앉아서 책 읽어본 적 있어?"
    ],
    "choices": [
     {
      "text": "책 안 읽고 멍만 때려도 돼?",
      "next": "first"
     },
     {
      "text": "친구랑 같이 읽으면 좋겠다.",
      "next": "second"
     }
    ]
   },
   "first": {
    "lines": [
     "그럼! 책 읽다가 쉬어도 되고, 그냥 바람 쐬면서 앉아 있어도 좋지."
    ],
    "next": "plan"
   },
   "second": {
    "lines": [
     "각자 읽던 책 가져와서 재밌었던 부분 얘기해도 좋겠다. 같은 책을 안 읽어도 할 얘기가 많을 것 같아."
    ],
    "next": "plan"
   },
   "plan": {
    "lines": [
     "야외음악당에 의자랑 매트를 놓고 「북캠핑 IN ARA」을 열려고 해. 낮에는 피크닉처럼 쉬고, 저녁에는 북토크도 하는 거야."
    ],
    "choices": [
     {
      "text": "읽고 싶은 책이 도서관에 없으면?",
      "next": "detailA"
     },
     {
      "text": "저녁에는 캠핑처럼 하는 거야?",
      "next": "detailB"
     }
    ]
   },
   "detailA": {
    "lines": [
     "도서관과 연계해서 현장에서 희망도서를 신청할 수 있게 하려고 해. 북토크 듣다가 읽고 싶어진 책도 신청하고."
    ],
    "next": "bye"
   },
   "detailB": {
    "lines": [
     "응, 텐트랑 조명을 두고 간식 먹으면서 책 얘기도 나누는 걸 생각하고 있어. 날씨나 사용할 공간은 더 협의해야 하고."
    ],
    "next": "bye"
   },
   "bye": {
    "lines": [
     "아직 기획 중이야. 책 한 권 들고 편하게 올 수 있는 자리가 생기면 좋겠다."
    ],
    "end": true
   }
  }
 },
 {
  "id": "sports",
  "category": "문화/대동제",
  "name": "숨결 · 문화/대동제",
  "policy": "통합체전 내 부스 활성화",
  "place": "체육관 쪽 본도로 보도",
  "anchor": [
   -97,
   -134
  ],
  "color": "#268db5",
  "topic": "경기 안 뛰어도 재밌게",
  "summary": "경기에 출전하지 않는 학우도 체험·동아리·먹거리 부스로 머물며 함께 즐기는 통합체전 구상.",
  "source": "https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit?tab=t.87ifgzx9mcgw",
  "nodes": {
   "hello": {
    "lines": [
     "체전 때 경기 나가는 편이야? 나는 응원하러 갔다가 친구 경기 끝나면 뭘 할지 모르겠더라."
    ],
    "choices": [
     {
      "text": "나도 구경만 하다가 돌아와.",
      "next": "first"
     },
     {
      "text": "경기 사이에 할 게 있으면 좋겠어.",
      "next": "second"
     }
    ]
   },
   "first": {
    "lines": [
     "나도 그래. 꼭 경기에 나가지 않아도 놀 거리가 있으면 더 오래 있다 갈 텐데."
    ],
    "next": "plan"
   },
   "second": {
    "lines": [
     "맞아. 다음 경기까지 기다릴 때 친구들이랑 들를 곳이 있으면 좋겠어."
    ],
    "next": "plan"
   },
   "plan": {
    "lines": [
     "그래서 통합체전에 동아리 부스랑 체험·먹거리 부스를 늘리려고 해. 경기 보러 온 친구들도 같이 즐길 수 있게."
    ],
    "choices": [
     {
      "text": "나도 부스를 열 수 있어?",
      "next": "detailA"
     },
     {
      "text": "경기하는 데 방해되진 않을까?",
      "next": "detailB"
     }
    ]
   },
   "detailA": {
    "lines": [
     "교내 동아리뿐 아니라 개인도 부스를 신청할 수 있게 기획하고 있어. 직접 해보고 싶은 게 있으면 좋겠네!"
    ],
    "next": "bye"
   },
   "detailB": {
    "lines": [
     "그래서 경기 구역이랑 부스 구역을 나눠야 해. 경기를 방해하지 않고 편하게 오갈 수 있도록 공간을 협의하려고 해."
    ],
    "next": "bye"
   },
   "bye": {
    "lines": [
     "아직 기획 단계지만, 운동을 안 해도 체전이 기다려지면 좋겠어."
    ],
    "end": true
   }
  }
 },
 {
  "id": "student-zone",
  "category": "문화/대동제",
  "name": "숨결 · 문화/대동제",
  "policy": "대동제 재학생존 확대",
  "place": "대운동장 축제장 입구",
  "anchor": [
   -198,
   -86
  ],
  "color": "#268fab",
  "topic": "우리 학교 축제, 가까이서 즐기자",
  "summary": "대동제 재학생 관람 구역을 확대해 재학생의 축제 참여 여건을 개선하려는 정책.",
  "source": null,
  "sourceNote": "사용자가 확정한 메타버스 정책 목록. 세부 운영안 미제공.",
  "nodes": {
   "hello": {
    "lines": [
     "무대 보러 왔어? 친구들이랑 같이 공연 보면 더 재밌지."
    ],
    "choices": [
     {
      "text": "사람 많으면 자리 잡기 어렵더라.",
      "next": "first"
     },
     {
      "text": "재학생이 볼 수 있는 자리가 더 있으면 좋겠어.",
      "next": "second"
     }
    ]
   },
   "first": {
    "lines": [
     "기대하고 왔는데 자리가 부족하면 아쉽지."
    ],
    "next": "plan"
   },
   "second": {
    "lines": [
     "우리 학교 축제니까 재학생이 함께 즐길 공간도 충분했으면 좋겠어."
    ],
    "next": "plan"
   },
   "plan": {
    "lines": [
     "그래서 「대동제 재학생존 확대」를 추진하려고 해. 재학생이 공연을 즐길 수 있는 구역을 넓히자는 거야."
    ],
    "choices": [
     {
      "text": "얼마나 넓어지는 거야?",
      "next": "detailA"
     },
     {
      "text": "여기 보이는 배치로 확정된 거야?",
      "next": "detailB"
     }
    ]
   },
   "detailA": {
    "lines": [
     "아직 구체적인 면적이나 인원은 안내할 수 없어. 실제 행사 공간과 안전 동선을 함께 검토해야 해."
    ],
    "next": "bye"
   },
   "detailB": {
    "lines": [
     "아니, 여기는 축제 분위기를 미리 느껴보는 게임 속 공간이야. 실제 재학생존 배치가 확정된 건 아니야."
    ],
    "next": "bye"
   },
   "bye": {
    "lines": [
     "친구들이랑 함께 즐길 자리가 더 넉넉해지면 좋겠다. 무대도 한번 둘러봐!"
    ],
    "end": true
   }
  }
 },
 {
  "id": "accessibility",
  "category": "인권/평등",
  "name": "숨결 · 인권/평등",
  "policy": "배리어프리 아라캠퍼스",
  "place": "학생회관 진입 마당",
  "anchor": [
   -99,
   -34
  ],
  "color": "#9a779d",
  "topic": "누구나 편하게 다니도록",
  "summary": "단차·안내시설·접근성 지도를 점검하고 행사 기획부터 모두의 이동과 정보 접근을 고려하는 구상.",
  "source": "https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit?tab=t.gz4ehglf9dzr",
  "nodes": {
   "hello": {
    "lines": [
     "여기 턱이 있네. 평소에는 그냥 지나쳤는데, 휠체어나 목발을 쓰면 돌아가야 할 수도 있겠어."
    ],
    "choices": [
     {
      "text": "다른 길로 돌아가야 하면 불편하겠다.",
      "next": "first"
     },
     {
      "text": "행사장도 그런 곳이 있겠네.",
      "next": "second"
     }
    ]
   },
   "first": {
    "lines": [
     "응. 어느 길로 가야 편한지 알기 어려울 때도 있지. 실제로 다녀보면서 불편한 곳부터 찾아보려고 해."
    ],
    "next": "plan"
   },
   "second": {
    "lines": [
     "맞아. 들어갈 수 있는 길이 있는지, 안내는 알아보기 쉬운지도 처음부터 살펴야 해."
    ],
    "next": "plan"
   },
   "plan": {
    "lines": [
     "「배리어프리 아라캠퍼스」는 그런 불편을 줄이려는 정책이야.",
     "보도랑 점자 안내를 점검하고, 편의시설이나 다닐 수 있는 경로를 지도에서 확인할 수 있게 하려고 해."
    ],
    "choices": [
     {
      "text": "행사에서는 뭘 바꾸려고 해?",
      "next": "detailA"
     },
     {
      "text": "불편한 곳을 발견하면 알려도 돼?",
      "next": "detailB"
     }
    ]
   },
   "detailA": {
    "lines": [
     "행사 준비할 때부터 진입로, 휠체어석과 동반자 자리, 이미지의 대체 텍스트 등을 확인할 수 있는 안내 기준을 만들려고 해."
    ],
    "next": "bye"
   },
   "detailB": {
    "lines": [
     "응. 위치랑 사진을 제보할 수 있는 창구를 만들려고 해. 현장을 확인한 뒤에 관련 부서와 개선 방법을 논의하는 거지."
    ],
    "next": "bye"
   },
   "bye": {
    "lines": [
     "아직 준비 중이지만, 어디를 가든 돌아갈 길부터 걱정하지 않아도 되면 좋겠어."
    ],
    "end": true
   }
  }
 },
 {
  "id": "interview",
  "category": "교육취업",
  "name": "숨결 · 교육취업",
  "policy": "교내 AI 면접 스튜디오 구축",
  "place": "경상대 앞 보행로 동쪽",
  "anchor": [
   -22,
   87.6
  ],
  "color": "#9b8254",
  "topic": "화상 면접, 어디서 보지?",
  "summary": "화상·AI 면접을 연습하고 실제 응시에도 이용할 수 있는 장비와 방음 공간을 갖추려는 구상.",
  "source": "https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit?tab=t.oavd62277kcl",
  "nodes": {
   "hello": {
    "lines": [
     "화상 면접 볼 때 어디서 해? 나는 조용한 장소 찾는 것부터 어렵더라."
    ],
    "choices": [
     {
      "text": "집에서는 소음이 신경 쓰여.",
      "next": "first"
     },
     {
      "text": "나는 카메라랑 조명이 걱정돼.",
      "next": "second"
     }
    ]
   },
   "first": {
    "lines": [
     "그렇지. 면접 중에 소리 날까 봐 신경 쓰이잖아. 학교에 조용한 공간이 있으면 좋겠어."
    ],
    "next": "plan"
   },
   "second": {
    "lines": [
     "장비나 인터넷이 잘 될지 미리 확인할 수 있으면 한결 편하겠지."
    ],
    "next": "plan"
   },
   "plan": {
    "lines": [
     "그래서 AI 융복합관과 연계해서 교내 AI 면접 스튜디오를 만들려고 해. 방음 부스랑 장비를 갖춰서 연습도 하고, 실제 화상·AI 면접도 볼 수 있게."
    ],
    "choices": [
     {
      "text": "연습하고 피드백도 받을 수 있어?",
      "next": "detailA"
     },
     {
      "text": "면접 말고 화상 회의에도 쓸 수 있어?",
      "next": "detailB"
     }
    ]
   },
   "detailA": {
    "lines": [
     "진로취업과의 모의면접·피드백 프로그램과 연결하는 내용도 있어. 연습만 하고 끝나는 게 아니라 부족한 부분도 확인할 수 있도록."
    ],
    "next": "bye"
   },
   "detailB": {
    "lines": [
     "소규모 화상 회의에도 쓰는 걸 생각하고 있어. 다만 실제 면접을 우선할 수 있도록 예약 기준은 학교와 정해야 해."
    ],
    "next": "bye"
   },
   "bye": {
    "lines": [
     "아직 구축 계획이지만, 장소랑 장비 걱정을 덜고 면접에 집중할 수 있으면 좋겠어. 준비 잘되길 바랄게!"
    ],
    "end": true
   }
  }
 },
 {
  "id": "scholarship",
  "category": "교육취업",
  "name": "숨결 · 교육취업",
  "policy": "내장학찾기",
  "place": "중앙 잔디광장 옆 보도",
  "anchor": [
   -73,
   -115
  ],
  "color": "#b08c56",
  "topic": "이 장학금, 나도 신청할 수 있나?",
  "summary": "분산된 교내외 장학 공지를 조건에 따라 모으고 비교해 자신에게 맞는 정보를 찾기 쉽게 하는 구상.",
  "source": "https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit?tab=t.eqhn59w13lab",
  "nodes": {
   "hello": {
    "lines": [
     "장학 공지 보다가 신청 기간 놓친 적 있어? 나는 조건 읽다가 내 얘기 아닌 줄 알고 넘긴 적도 있어."
    ],
    "choices": [
     {
      "text": "공지가 흩어져 있어서 자꾸 놓쳐.",
      "next": "first"
     },
     {
      "text": "조건이 복잡해서 헷갈려.",
      "next": "second"
     }
    ]
   },
   "first": {
    "lines": [
     "맞아. 학교 공지도 보고, 다른 기관 홈페이지도 찾아봐야 하니까 놓치기 쉽지."
    ],
    "next": "plan"
   },
   "second": {
    "lines": [
     "성적이나 소득 기준에 제출 서류까지… 여러 공지를 같이 비교하기도 어렵고."
    ],
    "next": "plan"
   },
   "plan": {
    "lines": [
     "「내장학찾기」는 교내외 장학 정보를 모아서 찾아보기 쉽게 하려는 정책이야. 내가 설정한 조건에 맞는 공지를 살펴볼 수 있도록."
    ],
    "choices": [
     {
      "text": "학교 밖 장학금도 볼 수 있어?",
      "next": "detailA"
     },
     {
      "text": "어떤 정보를 비교할 수 있어?",
      "next": "detailB"
     }
    ]
   },
   "detailA": {
    "lines": [
     "응. 지자체나 재단의 장학 공지도 모으려고 해. 지난 공지가 그대로 남지 않게 최신 정보인지 확인하는 것도 중요하고."
    ],
    "next": "bye"
   },
   "detailB": {
    "lines": [
     "지원 조건이랑 제출 서류, 지급 방식, 다른 장학금과 중복해서 받을 수 있는지 등을 비교할 수 있게 하려고 해. 신청 전에는 해당 기관의 기준도 확인해야 하고."
    ],
    "next": "bye"
   },
   "bye": {
    "lines": [
     "아직 시스템을 구상하는 단계야. 나한테 맞는 장학금 찾다가 지치는 일부터 줄여보고 싶어."
    ],
    "end": true
   }
  }
 },
 {
  "id": "fitness",
  "category": "시설/교통",
  "name": "숨결 · 시설/교통",
  "policy": "피트니스센터 운동기구 교체",
  "place": "체육관 서쪽 운동장 길",
  "anchor": [
   -187,
   -120
  ],
  "color": "#268fab",
  "topic": "운동기구도 살펴봐야지",
  "summary": "피트니스센터 운동기구 교체를 추진해 운동 환경을 개선하려는 정책.",
  "source": null,
  "sourceNote": "사용자가 확정한 메타버스 정책 목록. 세부 운영안 미제공.",
  "nodes": {
   "hello": {
    "lines": [
     "운동하러 가는 길이야? 나는 운동기구 상태가 은근 신경 쓰이더라."
    ],
    "choices": [
     {
      "text": "낡은 기구는 쓰기 망설여져.",
      "next": "first"
     },
     {
      "text": "자주 쓰는 기구부터 바뀌면 좋겠어.",
      "next": "second"
     }
    ]
   },
   "first": {
    "lines": [
     "맞아. 편하게 운동하려면 기구 상태부터 믿을 수 있어야지."
    ],
    "next": "plan"
   },
   "second": {
    "lines": [
     "많이 쓰는 기구가 뭔지, 어떤 점이 불편한지 듣는 게 중요하겠네."
    ],
    "next": "plan"
   },
   "plan": {
    "lines": [
     "「피트니스센터 운동기구 교체」를 추진하려고 해. 운동하는 환경을 개선하자는 취지야."
    ],
    "choices": [
     {
      "text": "어떤 기구를 바꿔?",
      "next": "detailA"
     },
     {
      "text": "새 기구는 언제 쓸 수 있어?",
      "next": "detailB"
     }
    ]
   },
   "detailA": {
    "lines": [
     "교체 품목은 아직 이 목록에 나와 있지 않아. 특정 기구를 들여온다고 약속할 수는 없어."
    ],
    "next": "bye"
   },
   "detailB": {
    "lines": [
     "교체 일정도 아직 확정된 내용이 없어. 실제로 바뀌기 전까지는 계획으로 봐줘."
    ],
    "next": "bye"
   },
   "bye": {
    "lines": [
     "운동하러 오는 길이 더 기대되면 좋겠다. 오늘도 무리하지 말고!"
    ],
    "end": true
   }
  }
 },
 {
  "id": "public-tumbler",
  "category": "그린환경",
  "name": "숨결 · 그린환경",
  "policy": "공공텀블러 사업",
  "place": "학생회관 진입 마당",
  "anchor": [
   -112,
   -28
  ],
  "color": "#268fab",
  "topic": "오늘은 텀블러를 깜빡했네",
  "summary": "함께 이용하는 텀블러를 통해 일회용품 사용을 줄이려는 공공텀블러 사업.",
  "source": null,
  "sourceNote": "사용자가 확정한 메타버스 정책 목록. 세부 운영안 미제공.",
  "nodes": {
   "hello": {
    "lines": [
     "음료 마시려는데 텀블러를 두고 왔네. 너도 이런 날 있어?"
    ],
    "choices": [
     {
      "text": "응, 챙긴다고 해놓고 자꾸 잊어.",
      "next": "first"
     },
     {
      "text": "여러 사람이 같이 쓰면 위생은 괜찮을까?",
      "next": "second"
     }
    ]
   },
   "first": {
    "lines": [
     "나도 그래. 깜빡한 날에도 일회용컵을 덜 쓸 수 있으면 좋겠어."
    ],
    "next": "plan"
   },
   "second": {
    "lines": [
     "맞아. 함께 쓰는 만큼 깨끗하게 관리하는 방법이 중요하지."
    ],
    "next": "plan"
   },
   "plan": {
    "lines": [
     "「공공텀블러 사업」은 함께 이용할 수 있는 텀블러로 일회용품 사용을 줄이려는 정책이야."
    ],
    "choices": [
     {
      "text": "어디서 이용하는 거야?",
      "next": "detailA"
     },
     {
      "text": "이용하고 나면 어떻게 해?",
      "next": "detailB"
     }
    ]
   },
   "detailA": {
    "lines": [
     "이용 장소는 아직 전달받은 목록에 정해져 있지 않아. 확정되면 알기 쉽게 안내해야겠지."
    ],
    "next": "bye"
   },
   "detailB": {
    "lines": [
     "이용과 회수, 세척 방식 같은 구체적인 운영안은 더 확인해야 해. 지금 정해진 것처럼 얘기하지는 않을게."
    ],
    "next": "bye"
   },
   "bye": {
    "lines": [
     "텀블러를 깜빡한 날에도 다른 선택이 생기면 좋겠다. 얘기해줘서 고마워!"
    ],
    "end": true
   }
  }
 },
 {
  "id": "council",
  "category": "숨결",
  "name": "숨결 · 숨결",
  "place": "경상대 앞 보행로",
  "color": "#7b83b5",
  "topic": "건의한 뒤에는 어떻게 될까?",
  "policy": "JNU 상생협의체",
  "summary": "학우들의 요구를 모아 학교 본부와 정기적으로 논의하고, 이행 상황과 진행 과정을 점검해 공유하는 소통 구조 구상.",
  "source": "https://docs.google.com/document/d/1RNuE4E4FGFz-o-oba5O2mbU9xEljBUsJaJsBGs9wzh0/edit?tab=t.u3vqo54dd2a",
  "nodes": {
   "hello": {
    "lines": [
     "안녕! 학교 다니면서 바뀌었으면 하는 거 있어? 아까도 여기서 그 얘기 하고 있었어."
    ],
    "choices": [
     {
      "text": "건의해도 잘 안 바뀌는 것 같아.",
      "next": "doubt"
     },
     {
      "text": "내 의견이 어디까지 전달되는지 모르겠어.",
      "next": "where"
     }
    ]
   },
   "doubt": {
    "lines": [
     "그렇게 느낄 만해. 학생회가 들었다고 바로 바꿀 수 있는 건 아니더라. 예산이나 시설 문제는 학교 본부와 얘기해야 하니까."
    ],
    "next": "council"
   },
   "where": {
    "lines": [
     "맞아. 의견을 냈으면 누가 검토하고 있는지도 알아야지.",
     "지금 어디까지 진행됐는지 볼 수 없으면 답답하잖아."
    ],
    "next": "council"
   },
   "council": {
    "lines": [
     "그래서 「JNU 상생협의체」를 만들려고 해. 학우들의 요구를 모아서 학교 본부와 정기적으로 논의하는 자리야.",
     "먼저 실무 협의에서 예산이나 행정 문제를 확인하고, 학생 대표와 본부가 함께 얘기하는 거지."
    ],
    "choices": [
     {
      "text": "회의만 하고 끝나면 어떡해?",
      "next": "followup"
     },
     {
      "text": "우리도 회의 내용을 볼 수 있어?",
      "next": "public"
     }
    ]
   },
   "followup": {
    "lines": [
     "그 뒤에 실제로 진행됐는지 확인하는 것까지 포함했어. 진행 상황을 학우들에게 알리고, 해결 안 된 건 다음 회의에서 다시 다루려고 해."
    ],
    "next": "bye"
   },
   "public": {
    "lines": [
     "응. 일반 학우도 지켜볼 수 있는 공개 회의와 진행 과정 공유를 계획하고 있어. 내가 낸 의견이 어떻게 다뤄지는지 볼 수 있게."
    ],
    "next": "bye"
   },
   "bye": {
    "lines": [
     "아직 기획안이지만, 건의하고 나서 어떻게 됐는지 몰라 답답한 일은 줄이고 싶어. 얘기해줘서 고마워."
    ],
    "end": true
   }
  },
  "anchor": [
   -47,
   87.6
  ]
 },
 {
  "id": "meal-price",
  "category": "숨결",
  "name": "숨결 · 숨결",
  "policy": "제주대학교 학식 단가인하",
  "place": "학생회관 식당 쪽 마당",
  "anchor": [
   -100,
   8
  ],
  "color": "#268fab",
  "topic": "점심값도 매일 쌓이니까",
  "summary": "제주대학교 학식 단가인하를 추진해 학우들의 식비 부담을 줄이려는 정책.",
  "source": null,
  "sourceNote": "사용자가 확정한 메타버스 정책 목록. 세부 운영안 미제공.",
  "nodes": {
   "hello": {
    "lines": [
     "점심 먹었어? 매일 챙겨 먹다 보니까 식비도 꽤 쌓이더라."
    ],
    "choices": [
     {
      "text": "맞아. 한 끼 가격도 신경 쓰여.",
      "next": "first"
     },
     {
      "text": "가격 내려가면 양이 줄지는 않을까?",
      "next": "second"
     }
    ]
   },
   "first": {
    "lines": [
     "매일 먹는 밥이니까 조금만 달라져도 체감이 크지."
    ],
    "next": "plan"
   },
   "second": {
    "lines": [
     "그 걱정도 같이 살펴봐야 해. 가격 얘기할 때 식사의 질을 빼놓을 수는 없잖아."
    ],
    "next": "plan"
   },
   "plan": {
    "lines": [
     "「제주대학교 학식 단가인하」를 추진하려고 해. 학우들의 식비 부담을 덜자는 취지야."
    ],
    "choices": [
     {
      "text": "얼마로 내려가는 거야?",
      "next": "detailA"
     },
     {
      "text": "언제부터 적용돼?",
      "next": "detailB"
     }
    ]
   },
   "detailA": {
    "lines": [
     "인하 금액이나 최종 가격은 아직 이 목록에 정해져 있지 않아. 특정 가격을 약속할 수는 없어."
    ],
    "next": "bye"
   },
   "detailB": {
    "lines": [
     "적용 시기도 아직 안내할 수 없어. 지금은 추진하려는 정책으로 봐줘."
    ],
    "next": "bye"
   },
   "bye": {
    "lines": [
     "밥값 때문에 끼니를 고민하는 일이 줄었으면 좋겠어. 너도 점심 꼭 챙겨 먹어!"
    ],
    "end": true
   }
  }
 }
];
