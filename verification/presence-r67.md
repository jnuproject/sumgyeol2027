# Background presence r67

- Hidden tabs / screen lock / pagehide / freeze: disconnect immediately when browser delivers the event.
- Visible desktop window without focus: leave after 5 seconds; returning within that grace period cancels departure.
- Focus/visibility restoration automatically reconnects at the retained local position.
- Offline/online events cannot reconnect a hidden, frozen or expired-focus page.
- Background render updates remain inactive and do not send movement polls.
- A failed departure notification can leave the server presence visible until the existing 20-second lease expires; no instant-removal guarantee on abrupt browser termination.
- No inactivity timeout: a focused player watching the festival remains online.
- No database migration, reopening, new backend plan or load test. NEXT remains paused.
- Four new lifecycle tests cover real client calls with a fake network plus timer/event transitions. Not a real-device background test.
