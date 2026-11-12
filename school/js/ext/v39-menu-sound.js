// ================= EXT44 (v39): luxury glass Menu (white line icons, English + Vietnamese labels, game tabs, hold to hear English),
// small mentor card on the left, real CC0 sound files, swipe-to-steer boats, natural idle/emote motion, no world drawing under full-screen layers =================
const V39 = {grp:{brain:'#6E8BFF', sports:'#3FD4A0', play:'#FF8A7A', world:'#5FD3E6', system:'#B8C0D8', art:'#E8C27A', life:'#5FD3E6'}, tab:'brain', em:null, idleT:0, idleK:0, steer:null};
// ---------- 28×28 white line icons ----------
const V39_P = {
  gamepad:'<path d="M6.5 8.5h11a4 4 0 0 1 3.9 4.8l-.9 4.2a2.4 2.4 0 0 1-4.2.9L14.6 16H9.4l-1.7 2.4a2.4 2.4 0 0 1-4.2-.9l-.9-4.2a4 4 0 0 1 3.9-4.8z"/><path d="M7.5 11.2v3M6 12.7h3M15.5 12.2h.01M17.5 14h.01"/>',
  map:'<path d="M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
  tent:'<path d="M12 4l9 15H3z"/><path d="M12 4v15M9 19l3-6 3 6M12 4l1.5-1.5"/>',
  clock:'<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.2 2"/>',
  leafcloud:'<path d="M8 17.5h9.5a3.4 3.4 0 0 0 .3-6.8 4.6 4.6 0 0 0-8.8 1.1A2.9 2.9 0 0 0 8 17.5z"/><path d="M4 11C4 6.5 7 3.5 11.5 3.5c0 2.6-1.2 4.6-3.2 5.6M4 11l3.5-3.5"/>',
  bag:'<path d="M5 8h14l-1 12.5H6z"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5"/>',
  home:'<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
  stall:'<path d="M3.5 9l2-4.5h13l2 4.5"/><path d="M3.5 9c0 1.4 1.2 2.4 2.6 2.4S8.7 10.4 8.7 9c0 1.4 1.2 2.4 2.6 2.4S14 10.4 14 9c0 1.4 1.2 2.4 2.6 2.4S20.5 10.4 20.5 9M5 11.4V20h14v-8.6M10 20v-5h4v5"/>',
  scroll:'<path d="M7 3.5h11a2 2 0 0 1 2 2V7h-3"/><path d="M17 7v11.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V17h11"/><path d="M7 3.5a2 2 0 0 0-2 2V17"/><path d="M8.5 8.5h5.5M8.5 11.5h5.5M8.5 14.5h3.5"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5.5H5a3 3 0 0 0 3 4M16 5.5h3a3 3 0 0 1-3 4M12 13v3.5M8.5 20h7M9.5 16.5h5V20h-5z"/>',
  bike:'<circle cx="5.8" cy="16.2" r="3.6"/><circle cx="18.2" cy="16.2" r="3.6"/><path d="M5.8 16.2l3.6-6.6h5.4l3.4 6.6M9.4 9.6l3.2 6.6H5.8M13.2 6.4h2.6l-1 3.2M8.2 7.4h3"/>',
  sail:'<path d="M3 16.5h18l-2.6 4H5.6z"/><path d="M12 16.5V3.5l7 11.5h-7M12 6L6.5 15H12"/>',
  balloon:'<path d="M12 2.8a6.2 6.2 0 0 0-6.2 6.2c0 3.6 3.1 6.1 6.2 7.2 3.1-1.1 6.2-3.6 6.2-7.2A6.2 6.2 0 0 0 12 2.8z"/><path d="M12 2.8c-1.9 2-2.5 4.4-2.5 6.4s1 4.8 2.5 7M12 2.8c1.9 2 2.5 4.4 2.5 6.4s-1 4.8-2.5 7M9.8 16.4l.9 2.9M14.2 16.4l-.9 2.9"/><rect x="10.3" y="19.3" width="3.4" height="2.4" rx=".5"/>',
  anchor:'<circle cx="12" cy="5" r="2"/><path d="M12 7v13.5M8 10.5h8M4.5 13.5a7.5 7.5 0 0 0 15 0M4.5 13.5l-1.5 1.5M19.5 13.5l1.5 1.5"/>',
  smile:'<circle cx="12" cy="12" r="8.6"/><path d="M8.5 14.2a4.2 4.2 0 0 0 7 0M9 9.8h.01M15 9.8h.01"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  globe:'<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4c2.4 2.4 3.6 5.3 3.6 8.6s-1.2 6.2-3.6 8.6c-2.4-2.4-3.6-5.3-3.6-8.6S9.6 5.8 12 3.4z"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/><circle cx="12" cy="12" r="6.4"/>',
  tools:'<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3z"/><path d="M4 4l5 5M3.5 7.5l4-4M7 9.5l2.5 2.5"/>',
  knight:'<path d="M7 20.5h11M8.5 20.5c0-3 1-5 3-6.5-2 .2-3.5-.4-4.5-1.5l2.5-3.5c0-2.5 1.8-4.5 4.5-4.5 3 0 4.5 3 4.5 6.5 0 4-1.5 6-1.5 9.5"/><path d="M12.5 8h.01"/>',
  cube:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5L12 12l8-4.5M12 12v9M8 5.3l8 4.5M16 5.3L8 9.8M4 12l8 4.5 8-4.5"/>',
  boards:'<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/><path d="M7 3.5v7M3.5 7h7M17 13.5v7M13.5 17h7"/>',
  gomoku:'<path d="M4 4h16v16H4zM4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/><circle cx="9.3" cy="9.3" r="1.8"/><path d="M13.4 13.4l2.6 2.6M16 13.4l-2.6 2.6"/>',
  stones:'<circle cx="8.5" cy="9" r="4"/><circle cx="15.5" cy="15" r="4"/><path d="M14 8.5l3 1M7 15.5l2.5-.5"/>',
  cap:'<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5V16c1.6 1.6 3.4 2.4 5.5 2.4s3.9-.8 5.5-2.4v-4.5M21.5 9.5v5"/>',
  book:'<path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h12.5v14.5H7a2.5 2.5 0 0 0-2.5 2.5z"/><path d="M4.5 20A2 2 0 0 0 7 21.5h12.5V17.5"/><path d="M8.5 7h7M8.5 10.3h5"/>',
  players:'<circle cx="8" cy="8.5" r="3"/><circle cx="16.5" cy="8.5" r="3"/><path d="M2.5 19a5.5 5.5 0 0 1 11 0M11 19a5.5 5.5 0 0 1 11 0"/>',
  ball:'<circle cx="12" cy="12" r="8.6"/><path d="M12 7.5l3.6 2.6-1.4 4.3H9.8L8.4 10.1z"/><path d="M12 3.4v4.1M15.6 10.1l4.2-1.3M14.2 14.4l2.5 3.6M9.8 14.4l-2.5 3.6M8.4 10.1L4.2 8.8"/>',
  hoop:'<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4v17.2M5.8 5.8c2.8 3 2.8 9.4 0 12.4M18.2 5.8c-2.8 3-2.8 9.4 0 12.4"/>',
  skate:'<path d="M3 13.5h18c0 1.4-1 2.5-2.5 2.5h-13C4 16 3 14.9 3 13.5z"/><circle cx="7" cy="18.5" r="1.6"/><circle cx="17" cy="18.5" r="1.6"/><path d="M6 13.5l1-6h10l1 6"/>',
  rollers:'<path d="M6 4h5v8h6.5a2.5 2.5 0 0 1 2.5 2.5V16H6z"/><circle cx="8" cy="19" r="1.6"/><circle cx="13" cy="19" r="1.6"/><circle cx="18" cy="19" r="1.6"/><path d="M6 8h5"/>',
  ski:'<circle cx="15" cy="4.5" r="1.8"/><path d="M3 19.5l18-4M9 18.2l3-5.2 3.5 1.6 1.5-5L12 8.2l-3 2.6M12 8.2l3-.8"/>',
  kart:'<path d="M3.5 15.5h17l-1.5-4h-6l-2-3H8l-1 3H4.5z"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/><path d="M12 8.5l1-3h3"/>',
  horse:'<path d="M5 20l1-6c-1.5-1-2.5-3-1-5l3-1 2-3.5h2l-.5 2.5 6.5 1.5 2 3-2 1-3-1-1 4 1 4.5"/><path d="M8 14h7M14.5 6.5h.01"/>',
  stadium:'<ellipse cx="12" cy="9" rx="8.5" ry="3.5"/><path d="M3.5 9v6.5c0 1.9 3.8 3.5 8.5 3.5s8.5-1.6 8.5-3.5V9M8 12.2v6.4M16 12.2v6.4M12 12.5v6.5"/>',
  rod:'<path d="M4 20L18 4M18 4v12"/><path d="M18 16a2 2 0 1 1-2 2"/><path d="M4 20l2-.5"/>',
  fire:'<path d="M12 21c3.6 0 6-2.4 6-5.6 0-3.8-3.2-5.6-3.8-9.4-2.2 1.6-3.2 3.8-3 6-1.2-.8-1.8-2-1.9-3.2C7.6 10.6 6 12.8 6 15.4 6 18.6 8.4 21 12 21z"/><path d="M12 21c-1.5 0-2.6-1.1-2.6-2.6 0-1.8 1.6-2.8 2.6-4.2 1 1.4 2.6 2.4 2.6 4.2 0 1.5-1.1 2.6-2.6 2.6z"/>',
  sky:'<path d="M17.5 3.5a6.5 6.5 0 1 0 3 12.3A7.5 7.5 0 0 1 17.5 3.5z"/><path d="M5 5l.6 1.6L7.2 7.2l-1.6.6L5 9.4l-.6-1.6-1.6-.6 1.6-.6zM9 15.5l.5 1.2 1.2.5-1.2.5L9 18.9l-.5-1.2-1.2-.5 1.2-.5z"/>',
  film:'<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7.5 5v14M16.5 5v14M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4M10.5 9.5l4 2.5-4 2.5z"/>',
  piano:'<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M7.7 5v14M12 5v14M16.3 5v14"/><path d="M6.4 5v7.5M9 5v7.5M14.7 5v7.5M17.6 5v7.5" stroke-width="2.6"/>',
  guitar:'<path d="M19.5 4.5l-6.5 6.5"/><path d="M13 11a3.2 3.2 0 0 0-4.6-.4c-.9.9-.9 2.1-1.7 2.6-.8.5-2.4.3-3.3 1.2a3.6 3.6 0 0 0 0 5.1 3.6 3.6 0 0 0 5.1 0c.9-.9.7-2.5 1.2-3.3.5-.8 1.7-.8 2.6-1.7a3.2 3.2 0 0 0-.4-4.6z"/><path d="M8.5 15.5h.01M17.5 3.5l3 3"/>',
  palette:'<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.3 0 2-.8 2-1.8 0-1.4-1.2-1.6-1.2-2.8 0-.9.7-1.6 1.6-1.6h2.1a4 4 0 0 0 4-4C20.5 6.6 16.7 3.5 12 3.5z"/><path d="M7.5 11h.01M9.5 7.5h.01M14 7h.01M17 10h.01" stroke-width="2.6"/>',
  barn:'<path d="M3 10.5L12 4l9 6.5"/><path d="M5 9v11.5h14V9"/><path d="M9 20.5V14h6v6.5M9 14l6 6.5M15 14l-6 6.5M10 9.5h4"/>',
  lotus:'<path d="M12 18.5c-2.5-2-3.5-4.6-3.5-7.2 0-2.4 1.2-4.6 3.5-6.8 2.3 2.2 3.5 4.4 3.5 6.8 0 2.6-1 5.2-3.5 7.2z"/><path d="M12 18.5c-3.8.4-7.3-1.4-8.5-5.5 2.4-.6 4.3-.4 5.6.4M12 18.5c3.8.4 7.3-1.4 8.5-5.5-2.4-.6-4.3-.4-5.6.4M4 20.5h16"/>',
  mall:'<path d="M3.5 20.5h17M5 20.5V8.5L12 4l7 4.5v12"/><path d="M9 20.5v-4h6v4M8 10.5h2M14 10.5h2M8 13.5h2M14 13.5h2"/>',
  basket:'<path d="M3.5 10h17l-2 10h-13z"/><path d="M8 10l3-6M16 10l-3-6M8.5 14v3M12 14v3M15.5 14v3"/>',
  compass:'<circle cx="12" cy="12" r="8.6"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  wave:'<path d="M2.5 16.5c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2M3 11.5c1.6-4.2 6.2-6.6 10.4-5.2-2.6 1-3.6 3.2-3 5.2 1.2-1.4 3-1.4 4 0M2.5 20.5h19"/>',
  music:'<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="17.5" cy="16" r="2.6"/>',
  lantern:'<path d="M12 2.5v2M9 4.5h6M7.5 7a4.5 6.5 0 0 0 9 0z"/><path d="M7.5 7h9M8 14a4.5 4.6 0 0 1-.5-7M16 14a4.5 4.6 0 0 0 .5-7M8 14h8l-1 3.2h-6zM12 17.2v4"/>',
  truck:'<path d="M2.5 6.5h11v10h-11zM13.5 10h4.2l3 3.4v3.1h-7.2"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
  sub:'<path d="M3 14.5c0-2.6 3.6-4.6 8.5-4.6s9 2 9 4.6-4 4.6-9 4.6S3 17.1 3 14.5z"/><path d="M10 9.9V6.5h3.6v3.4M13.6 6.5h2M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01"/>',
  ship:'<path d="M3 15.5h18l-2.6 4.5H5.6z"/><path d="M12 15.5V3.5M12 4.5l6.5 8H12M12 6.5L7 12.5h5"/>',
  alert:'<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5h.01"/>',
  sunrise:'<path d="M3 18.5h18M6.5 18.5a5.5 5.5 0 0 1 11 0M12 6v3M5.5 10.5l1.6 1.6M18.5 10.5l-1.6 1.6M9.5 4.5L12 2l2.5 2.5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.6v2.2M12 19.2v2.2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.6 12h2.2M19.2 12h2.2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"/>',
  sunset:'<path d="M3 18.5h18M6.5 18.5a5.5 5.5 0 0 1 11 0M12 3v4.5M9.5 5L12 7.5 14.5 5M5.5 11l1.6 1.6M18.5 11l-1.6 1.6"/>',
  moon:'<path d="M18.5 15.5A7.5 7.5 0 0 1 8.5 5.5a7.5 7.5 0 1 0 10 10z"/>',
  forward:'<path d="M4 6l7 6-7 6zM12 6l7 6-7 6z"/>',
  pause:'<rect x="6.5" y="5" width="3.5" height="14" rx="1"/><rect x="14" y="5" width="3.5" height="14" rx="1"/>',
  speed:'<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5M7 17h.01M17 17h.01"/>',
  wavehand:'<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11.5V5a1.5 1.5 0 0 1 3 0v6.5M14 11.5V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.6 6.5-6 6.5-2.4 0-4-1.2-5.4-3.4L3.8 14a1.5 1.5 0 0 1 2.4-1.8L8 14.5"/><path d="M19 3.5c1 .8 1.6 1.8 1.8 3M3.5 4.5c.6-.9 1.4-1.5 2.4-1.8"/>',
  dance:'<circle cx="13" cy="4.5" r="2"/><path d="M13 6.5l-1 6 3.5 3-1 5.5M12 12.5l-4 2.5-1 5M12.5 8.5L17 6.5M12.5 8.5L7.5 9"/><path d="M19.5 12.5l.5 1.5M20.5 9.5l1.5.5"/>',
  jump:'<circle cx="12" cy="4.5" r="2"/><path d="M12 6.5v6M12 8.5L7.5 5.5M12 8.5l4.5-3M12 12.5l-3.5 3 1 3.5M12 12.5l3.5 3-1 3.5M5 21.5h14"/>',
  sit:'<circle cx="9" cy="5" r="2"/><path d="M9 7v6.5h6.5l1 6.5M9 9.5l4 1.5M5 21h14M9 13.5l-2 6.5"/>',
  spark:'<path d="M12 2.8l1.9 6.3 6.3 1.9-6.3 1.9-1.9 6.3-1.9-6.3-6.3-1.9 6.3-1.9z"/>'
};
function v39Ic(n, size, col){ const p = V39_P[n] || (typeof V38_P !== 'undefined' && V38_P[n]) || V39_P.spark; return `<svg viewBox="0 0 24 24" width="${size || 28}" height="${size || 28}" fill="none" stroke="${col || '#F7F5EF'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`; }
// ---------- English names + IPA for hold-to-hear ----------
const V39_IPA = {'Mini Games':'ˈmɪni ɡeɪmz', Map:'mæp', Events:'ɪˈvents', Time:'taɪm', 'Seasons & Weather':'ˈsiːzənz ənd ˈweðər', Shop:'ʃɑːp', 'My Home':'maɪ hoʊm', Market:'ˈmɑːrkɪt', Quests:'kwests', Leaderboard:'ˈliːdərbɔːrd', 'Ride a Bike':'raɪd ə baɪk', Boat:'boʊt', Fly:'flaɪ', 'Pirate Port':'ˈpaɪrət pɔːrt', Emotes:'ɪˈmoʊts', Profile:'ˈproʊfaɪl', Online:'ˌɑːnˈlaɪn', Settings:'ˈsetɪŋz', Owner:'ˈoʊnər',
  Chess:'tʃes', "Rubik's Cube":'ˈruːbɪks kjuːb', 'Chess Tables':'tʃes ˈteɪbəlz', Gomoku:'ɡəˈmoʊkuː', Go:'ɡoʊ', Academy:'əˈkædəmi', Library:'ˈlaɪbreri', '2-Player Games':'tuː ˈpleɪər ɡeɪmz', Soccer:'ˈsɑːkər', Basketball:'ˈbæskɪtbɔːl', Skateboard:'ˈskeɪtbɔːrd', 'Roller Skates':'ˈroʊlər skeɪts', Skiing:'ˈskiːɪŋ', Olympics:'əˈlɪmpɪks', 'Rubik Kart':'ˈruːbɪk kɑːrt', 'Animal Race':'ˈænɪməl reɪs', 'Sports Zone':'spɔːrts zoʊn',
  Fishing:'ˈfɪʃɪŋ', 'Hot-air Balloon':'hɑːt er bəˈluːn', 'Campfire BBQ':'ˈkæmpfaɪər ˈbɑːrbɪkjuː', 'Sky View':'skaɪ vjuː', 'Immersive Tour':'ɪˈmɜːrsɪv tʊr', 'Online Arena':'ˌɑːnˈlaɪn əˈriːnə', 'Boat Trip':'boʊt trɪp', Piano:'piˈænoʊ', Guitar:'ɡɪˈtɑːr', Painting:'ˈpeɪntɪŋ', Farm:'fɑːrm', Meditation:'ˌmedɪˈteɪʃən', 'Shopping Mall':'ˈʃɑːpɪŋ mɔːl', 'My Shop':'maɪ ʃɑːp', 'New Lands':'nuː lændz', Ocean:'ˈoʊʃən',
  Wave:'weɪv', Dance:'dæns', Jump:'dʒʌmp', Sit:'sɪt', Spring:'sprɪŋ', Summer:'ˈsʌmər', Autumn:'ˈɔːtəm', Winter:'ˈwɪntər', Sunny:'ˈsʌni', Rain:'reɪn', Windy:'ˈwɪndi', Storm:'stɔːrm', Snow:'snoʊ', Fog:'fɑːɡ', Rainbow:'ˈreɪnboʊ', Morning:'ˈmɔːrnɪŋ', Noon:'nuːn', Afternoon:'ˌæftərˈnuːn', Evening:'ˈiːvnɪŋ'};
function v39Speak(en){ try { const u = new SpeechSynthesisUtterance(en); u.lang = 'en-US'; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e){}
  let t = $('#v39Say'); if(!t){ t = document.createElement('div'); t.id = 'v39Say'; document.body.appendChild(t); } t.innerHTML = `<b></b><span></span>`; t.querySelector('b').textContent = en; t.querySelector('span').textContent = V39_IPA[en] ? `/${V39_IPA[en]}/` : ''; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }
// ---------- menu items ----------
const v39B = id => () => { const b = $('#' + id); if(b) b.click(); };
function v39MainItems(){
  const L = [['gamepad', 'Mini Games', 'Trò chơi', 'play', 'games'], ['map', 'Map', 'Bản đồ', 'world', () => openBigMap()], ['tent', 'Events', 'Sự kiện', 'play', 'events'], ['clock', 'Time', 'Thời gian', 'system', 'time'],
    ['leafcloud', 'Seasons & Weather', 'Mùa & thời tiết', 'world', 'season'], ['bag', 'Shop', 'Cửa hàng', 'world', () => openShop()], ['home', 'My Home', 'Nhà tôi', 'world', v39B('hHome')], ['stall', 'Market', 'Chợ', 'world', v39B('hMarket')],
    ['scroll', 'Quests', 'Nhiệm vụ', 'brain', () => { renderMissions(); showModal('mMissions'); }], ['trophy', 'Leaderboard', 'Xếp hạng', 'brain', () => openLobby()], ['bike', 'Ride a Bike', 'Đạp xe', 'sports', () => toggleBike()], ['sail', 'Boat', 'Lên thuyền', 'world', () => boardBoat()],
    ['balloon', 'Fly', 'Bay', 'world', () => flyToggle()], ['anchor', 'Pirate Port', 'Bến hải tặc', 'play', () => { const d = DOORS().find(q => q.f === openMissile); if(d) v32Nav(d.x, d.y, 'Tàu hải quân', true, openMissile); else openMissile(); }], ['smile', 'Emotes', 'Biểu cảm', 'play', 'emotes'],
    ['user', 'Profile', 'Hồ sơ', 'system', () => openProfile()], ['globe', 'Online', 'Chơi cùng bạn', 'system', () => openLobby()], ['gear', 'Settings', 'Cài đặt', 'system', () => openSettings()]];
  if(OWNER.is) L.push(['tools', 'Owner', 'Chủ game', 'system', 'owner']);
  return L.map(([ic, en, vi, grp, f]) => ({ic, en, vi, grp, f}));
}
const V39_GAMES = {
  brain:[['openChess', 'knight', 'Chess', 'Cờ vua'], ['openRubik', 'cube', "Rubik's Cube", 'Rubik 3D'], ['xTables', 'boards', 'Chess Tables', 'Xem 5 bàn cờ'], ['xCaro', 'gomoku', 'Gomoku', 'Cờ caro'], ['xGo', 'stones', 'Go', 'Cờ vây'], ['wAcad', 'cap', 'Academy', 'Học viện'], ['wLib', 'book', 'Library', 'Thư viện'], ['wHall', 'players', '2-Player Games', 'Game 2 người']],
  sports:[['xFoot', 'ball', 'Soccer', 'Bóng đá'], ['xBasket', 'hoop', 'Basketball', 'Bóng rổ'], ['xSkate', 'skate', 'Skateboard', 'Trượt ván'], ['xPatin', 'rollers', 'Roller Skates', 'Trượt patin'], ['xSki', 'ski', 'Skiing', 'Trượt tuyết'], ['wOly', 'trophy', 'Olympics', 'Thế vận hội'], ['wKart', 'kart', 'Rubik Kart', 'Đua xe Kart'], ['xRace', 'horse', 'Animal Race', 'Đua thú'], ['xSports', 'stadium', 'Sports Zone', 'Khu thể thao']],
  play:[['openFish', 'rod', 'Fishing', 'Câu cá'], ['xBalloon', 'balloon', 'Hot-air Balloon', 'Khinh khí cầu'], ['xBbq', 'fire', 'Campfire BBQ', 'Lửa trại'], ['skyBtn', 'sky', 'Sky View', 'Ngắm bầu trời'], ['immersiveBtn', 'film', 'Immersive Tour', 'Du lịch đắm chìm'], ['wLobby', 'globe', 'Online Arena', 'Đấu online'], ['boatBtn', 'sail', 'Boat Trip', 'Đi thuyền']],
  art:[['xPiano', 'piano', 'Piano', 'Đàn piano'], ['xGuitar', 'guitar', 'Guitar', 'Đàn guitar'], ['xPaint', 'palette', 'Painting', 'Vẽ tranh']],
  life:[['xFarm', 'barn', 'Farm', 'Nông trại'], ['wZen', 'lotus', 'Meditation', 'Ngồi thiền'], ['xShop', 'bag', 'Shop', 'Cửa hàng'], ['wMall', 'mall', 'Shopping Mall', 'Trung tâm thương mại'], ['wHome', 'home', 'My Home', 'Nhà tôi'], ['wMyShop', 'stall', 'My Shop', 'Cửa hàng của tôi'], ['wMarket', 'basket', 'Market', 'Chợ người chơi'], ['wGoEast', 'compass', 'New Lands', 'Vùng đất mới'], ['wSea', 'wave', 'Ocean', 'Đại dương'], ['openMissions', 'scroll', 'Quests', 'Nhiệm vụ']]
};
const V39_TABS = [['brain', 'Brain', 'Trí tuệ'], ['sports', 'Sports', 'Thể thao'], ['play', 'Play', 'Vui chơi'], ['art', 'Music & Art', 'Nhạc & vẽ'], ['life', 'Life', 'Cuộc sống']];
const V39_SEASON_EN = {xuan:'Spring', ha:'Summer', thu:'Autumn', dong:'Winter'};
const V39_WEATHER_EN = {nang:'Sunny', mua:'Rain', gio:'Windy', bao:'Storm', sieubao:'Super Storm', loc:'Tornado', samset:'Thunder', muada:'Hail', suongmu:'Fog', dongdat:'Earthquake', nangnong:'Heatwave', muaphun:'Drizzle', cauvong:'Rainbow', tuyet:'Snow', baotuyet:'Blizzard', songthan:'Tsunami', nhatthuc:'Eclipse', saobang:'Meteor Shower'};
function v39Sub(kind){
  if(kind === 'games') return V39_GAMES[V39.tab].filter(([id]) => $('#' + id)).map(([id, ic, en, vi]) => ({ic, en, vi, grp:V39.tab, f:v39B(id)}));
  if(kind === 'emotes') return [['wavehand', 'Wave', 'Vẫy tay', 'wave'], ['dance', 'Dance', 'Nhảy múa', 'dance'], ['jump', 'Jump', 'Bật nhảy', 'jump'], ['sit', 'Sit', 'Ngồi nghỉ', 'sit']].map(([ic, en, vi, k]) => ({ic, en, vi, grp:'play', f:() => v39Emote(k)}));
  if(kind === 'events'){ const L = [['concert', 'music', 'Concert'], ['festBtn', 'lantern', 'Festival'], ['picnicBtn', 'basket', 'Picnic'], ['truckBtn', 'truck', 'Delivery Truck'], ['subBtn', 'sub', 'Submarine Trip'], ['pirateBtn', 'ship', 'Pirate Ship'], ['fightBtn', 'alert', 'Scuffle'], ['nextDay', 'sunrise', 'Next Day']];
    return L.filter(([id]) => $('#' + id)).map(([id, ic, en, w]) => { const b = $('#' + id); return {ic, en, vi:b.textContent.trim(), grp:'play', f:() => { b.click(); const p = {concert:'hall', festBtn:'plaza', picnicBtn:'forest', truckBtn:'road', subBtn:'sub', pirateBtn:'sea', fightBtn:'yard'}[id], q = p && v32EventPlace(p); if(q) setTimeout(() => v32Nav(q[0], q[1], b.textContent.trim(), false), 300); }}; }); }
  if(kind === 'time'){ const ic = ['sunrise', 'sun', 'sunset', 'moon'], en = ['Morning', 'Noon', 'Afternoon', 'Evening'];
    const it = V25_TIMES.map(([id, txt, min, label], i) => ({ic:ic[i], en:en[i], vi:label + ' ' + fmt(min), grp:'system', f:() => v25SetTime(min, label)}));
    it.push({ic:'forward', en:'+30 min', vi:'Tua 30 phút', grp:'system', f:() => v32Skip(30)}, {ic:'forward', en:'+60 min', vi:'Tua 60 phút', grp:'system', f:() => v32Skip(60)});
    [['x1', 'Real time', 'Giờ thật ×1', 'clock'], ['x10', 'Speed ×10', 'Nhanh ×10', 'speed'], ['x30', 'Speed ×30', 'Nhanh ×30', 'speed'], ['stop', 'Pause', 'Dừng thời gian', 'pause']].forEach(([m, e, v, i]) => it.push({ic:i, en:e, vi:v, grp:'system', on:V25.mode === m, stay:true, f:() => { v25Mode(m); v32Sub('time'); }}));
    return it; }
  if(kind === 'season'){ const sb = [...document.querySelectorAll('#seasons button')], wb = [...document.querySelectorAll('#weathers button')], sk = Object.keys(SEASONS), wk = Object.keys(WEATHERS);
    return sb.map((b, i) => ({ic:sk[i], en:V39_SEASON_EN[sk[i]] || sk[i], vi:SEASONS[sk[i]].name, grp:'world', on:sk[i] === season, f:() => b.click()})).concat(wb.map((b, i) => ({ic:wk[i], en:V39_WEATHER_EN[wk[i]] || wk[i], vi:WEATHERS[wk[i]].name, grp:'world', on:wk[i] === weather, f:() => b.click()}))); }
  return v32SubItemsOld(kind).map(([e, name, bg, f, on]) => ({ic:'tools', en:name, vi:'', grp:'system', f, on}));
}
const v32SubItemsOld = v32SubItems;
// ---------- grid: tiles grow with their text, never cut ----------
function v39Grid(box, items){
  box.textContent = ''; box.className = 'v39grid'; box.style.gridTemplateColumns = ''; box.style.gridTemplateRows = '';
  items.forEach(it => { const b = document.createElement('button'); b.type = 'button'; b.className = 'v39tile' + (it.on ? ' on' : ''); b.style.setProperty('--ac', V39.grp[it.grp] || '#B8C0D8');
    b.innerHTML = `<span class="ic">${v39Ic(it.ic, 28)}</span><b></b>${it.vi ? '<small></small>' : ''}`; b.querySelector('b').textContent = it.en; if(it.vi) b.querySelector('small').textContent = it.vi;
    let hold = null, held = false; b.addEventListener('pointerdown', () => { held = false; clearTimeout(hold); hold = setTimeout(() => { held = true; v39Speak(it.en); }, 500); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => clearTimeout(hold))); b.addEventListener('contextmenu', e => e.preventDefault());
    b.onclick = () => { if(held){ held = false; return; } v39Sfx('press'); if(typeof it.f === 'string') v32Sub(it.f); else if(it.stay) it.f(); else { v32MenuToggle(false); setTimeout(it.f, 60); } }; box.appendChild(b); });
}
function v39Tabs(){ const t = $('#v39Tabs'); if(!t) return; t.innerHTML = ''; V39_TABS.forEach(([k, en, vi]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'v39tab' + (V39.tab === k ? ' on' : ''); b.style.setProperty('--ac', V39.grp[k]); b.innerHTML = `<b></b><small></small>`; b.querySelector('b').textContent = en; b.querySelector('small').textContent = vi; b.onclick = () => { V39.tab = k; v39Sfx('select'); v32Sub('games'); }; t.appendChild(b); }); }
function v39Hooks(){
  v32Grid = (box, items) => v39Grid(box, (items || []).map(x => Array.isArray(x) ? {ic:'spark', en:x[1], vi:'', grp:'system', f:x[3], on:x[4]} : x));
  v32Items = v39MainItems; v32SubItems = v39Sub;
  v32Sub = function(kind){ const titles = {games:['Mini Games', 'Trò chơi'], events:['Events', 'Sự kiện'], time:['Time', 'Thời gian'], season:['Seasons & Weather', 'Mùa & thời tiết'], owner:['Owner', 'Chủ game'], emotes:['Emotes', 'Biểu cảm']}[kind] || ['', ''];
    $('#v32Back').hidden = false; const h = $('#v32Title'); h.innerHTML = '<b></b> <small></small>'; h.querySelector('b').textContent = titles[0]; h.querySelector('small').textContent = titles[1];
    let t = $('#v39Tabs'); if(!t){ t = document.createElement('div'); t.id = 'v39Tabs'; h.after(t); } t.hidden = kind !== 'games'; if(kind === 'games') v39Tabs(); v39Grid($('#v32Grid'), v32SubItems(kind)); };
  v32Home = function(){ $('#v32Back').hidden = true; $('#v32Title').textContent = ''; const t = $('#v39Tabs'); if(t) t.hidden = true; v32Chips(); v39Grid($('#v32Grid'), v32Items()); };
  v32Chips = function(){ const c = $('#v32Chips'); if(!c) return; c.innerHTML = ''; [[season, `${V39_SEASON_EN[season]} · ${SEASONS[season].name}`, 'season'], [weather, `${V39_WEATHER_EN[weather]} · ${WEATHERS[weather].name}`, 'season'], ['clock', `${fmt(clock)} ×${V25.mode === 'stop' ? '0' : V25.mode.slice(1)}`, 'time']].forEach(([ic, t, k]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'v32chip v39chip'; b.innerHTML = v39Ic(ic, 18) + '<span></span>'; b.querySelector('span').textContent = t; b.onclick = () => v32Sub(k); c.appendChild(b); }); };
  const mt = v32MenuToggle; v32MenuToggle = function(on){ const was = V32.menuOpen; mt(on); if(V32.menuOpen !== was) v39Sfx(V32.menuOpen ? 'open' : 'close'); };
  v35Chips = function(){};
}

// ---------- mentor: a small card on the left that folds into an avatar bubble ----------
function v39Mentor(){
  const m = $('#mentor'); if(!m) return; m.classList.add('v39m'); if(!m.querySelector('.v39x')){ const x = document.createElement('button'); x.type = 'button'; x.className = 'v39x'; x.setAttribute('aria-label', 'Đóng lời dạy'); x.textContent = '✕'; m.appendChild(x); x.addEventListener('click', e => { e.stopPropagation(); m.hidden = true; m.classList.remove('mini'); }); }
  m.addEventListener('click', e => { if(m.classList.contains('mini')){ e.stopImmediatePropagation(); e.preventDefault(); m.classList.remove('mini'); clearTimeout(V39.mT); V39.mT = setTimeout(() => m.classList.add('mini'), 6000); } }, true);
  new MutationObserver(() => { if(!m.hidden){ m.classList.remove('mini'); clearTimeout(V39.mT); V39.mT = setTimeout(() => m.classList.add('mini'), 6000); } }).observe(m, {attributes:true, attributeFilter:['hidden']});
  const sayOld = mentorSay; mentorSay = function(){ const r = sayOld.apply(this, arguments); clearTimeout(MENT.hideT); MENT.hideT = setTimeout(() => { m.hidden = true; }, 40000); return r; };
}

// ---------- sound files (CC0) through Web Audio ----------
const V39S = {buf:{}, loading:{}, bus:null, vol:{sfx:.8, amb:.6}, last:{}};
try { Object.assign(V39S.vol, JSON.parse(localStorage.getItem('truong-vol-v39') || '{}')); } catch(e){}
function v39Bus(){ ensureAC(); if(!V39S.bus){ V39S.bus = AC.createGain(); V39S.bus.connect(AC.destination); } V39S.bus.gain.value = V39S.vol.sfx; return V39S.bus; }
function v39Load(n){ if(V39S.buf[n] || V39S.loading[n]) return V39S.loading[n]; ensureAC(); V39S.loading[n] = fetch('assets/sfx/' + n + '.mp3').then(r => r.arrayBuffer()).then(a => new Promise((ok, no) => AC.decodeAudioData(a, ok, no))).then(b => { V39S.buf[n] = b; return b; }).catch(() => null); return V39S.loading[n]; }
function v39Sfx(n, v, rate){
  if(V39S.vol.sfx <= 0) return; const now = performance.now(); if(now - (V39S.last[n] || 0) < 60) return; V39S.last[n] = now;
  try { const play = b => { if(!b) return; const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = b; s.playbackRate.value = (rate || 1)*(1 + (Math.random() - .5)*.1); g.gain.value = v == null ? .6 : v; s.connect(g); g.connect(v39Bus()); s.start(); };
    if(V39S.buf[n]) play(V39S.buf[n]); else { const p = v39Load(n); if(p) p.then(play); } } catch(e){}
}
function v39Bell(){ try { ensureAC(); const t = AC.currentTime, out = v39Bus(); [[2093, 0], [2637, .13], [2093, .26], [2637, .39]].forEach(([f, d]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t + d); g.gain.exponentialRampToValueAtTime(.25, t + d + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d + .45); o.connect(g); g.connect(out); o.start(t + d); o.stop(t + d + .5); }); } catch(e){} }
function v39VolApply(){ try { if(sfxOut) sfxOut.gain.value = .7*V39S.vol.sfx; } catch(e){} try { AMB.vol = .5*V39S.vol.amb; if(AMB.out) AMB.out.gain.value = AMB.vol; } catch(e){} if(V39S.bus) V39S.bus.gain.value = V39S.vol.sfx; try { localStorage.setItem('truong-vol-v39', JSON.stringify(V39S.vol)); } catch(e){} }
function v39SettingsUi(){
  const m = $('#mSet .mbox'); if(!m || $('#v39Vol')) return; const d = document.createElement('section'); d.id = 'v39Vol'; d.className = 'v39vol';
  d.innerHTML = '<h3>Âm lượng</h3><label>Nhạc <input type="range" min="0" max="1" step=".05" id="v39VM"></label><label>Âm nền <input type="range" min="0" max="1" step=".05" id="v39VA"></label><label>Hiệu ứng <input type="range" min="0" max="1" step=".05" id="v39VS"></label><p class="v39cred">Âm thanh: Kenney &amp; uisfx (CC0) · xem assets/CREDITS.txt</p>';
  const head = m.querySelector('.mhead'); (head && head.nextSibling) ? m.insertBefore(d, head.nextSibling) : m.appendChild(d);
  const vm = $('#v39VM'), va = $('#v39VA'), vs = $('#v39VS'); vm.value = vol; va.value = V39S.vol.amb; vs.value = V39S.vol.sfx;
  vm.oninput = () => { const s = $('#stVol'); if(s){ s.value = vm.value; s.dispatchEvent(new Event('input', {bubbles:true})); s.dispatchEvent(new Event('change', {bubbles:true})); } else { vol = +vm.value; try { if(master) master.gain.value = vol*.8; } catch(e){} } };
  va.oninput = () => { V39S.vol.amb = +va.value; v39VolApply(); }; vs.oninput = () => { V39S.vol.sfx = +vs.value; v39VolApply(); v39Sfx('select'); };
}
function v39SoundHooks(){
  const sm = showModal; showModal = function(id){ const r = sm.apply(this, arguments); v39Sfx('open', .45); if(id === 'mSet') setTimeout(v39SettingsUi, 0); return r; };
  const hm = hideModal; hideModal = function(){ const r = hm.apply(this, arguments); v39Sfx('close', .4); return r; };
  const rw = reward; reward = function(exp, money, why, quiet){ const r = rw.apply(this, arguments); if(PROF && money > 0) v39Sfx('k-coin', .55); else if(PROF && exp >= 20) v39Sfx('reward', .5); return r; };
  const lu = levelUp; levelUp = function(){ const r = lu.apply(this, arguments); v39Sfx('level-up', .7); return r; };
  const mp = mprog; mprog = function(id){ const was = mstate[id + '_done']; const r = mp.apply(this, arguments); if(!was && mstate[id + '_done']) v39Sfx('achievement', .7); return r; };
  const de = doorEnter; doorEnter = function(){ const r = de.apply(this, arguments); if(r) v39Sfx('k-confirm', .5); return r; };
  const tb = toggleBike; toggleBike = function(){ const r = tb.apply(this, arguments); if(PLAYER && PLAYER.cycling) v39Bell(); return r; };
  const ft = flyToggle; flyToggle = function(){ const r = ft.apply(this, arguments); v39Sfx(PLAYER && PLAYER.v16fly ? 'wake' : 'k-land', .55); return r; };
  const bb = boardBoat; boardBoat = function(){ const r = bb.apply(this, arguments); if(PLAYER && PLAYER.boat) v39Sfx('k-impact', .4, .7); return r; };
  const ts = toast; toast = function(t){ const r = ts.apply(this, arguments); const s = String(t); if(/Thắng|thắng|Hoàn thành|Chúc mừng/.test(s)) v39Sfx('success', .45); else if(/Chưa đủ|không thể|Không thể|lỗi|Sai/.test(s)) v39Sfx('error', .35); else if(now39() - (V39S.last.toast || 0) > 4000){ V39S.last.toast = now39(); v39Sfx('notification', .22); } return r; };
  const unlock = () => { ['press', 'open', 'close', 'select', 'k-coin', 'k-step', 'notification'].forEach(v39Load); v39VolApply(); window.removeEventListener('pointerdown', unlock, true); }; window.addEventListener('pointerdown', unlock, true);
}
const now39 = () => performance.now();
function v39Steps(dt){
  const P = PLAYER; if(!P || !P.visible || !P.controlled || !P.moving || P.boat || P.v16fly || P.cycling || P.mount || P.flying){ V39.stepD = 0; return; }
  V39.stepD = (V39.stepD || 0) + Math.hypot(P.x - (V39.px || P.x), P.y - (V39.py || P.y)); V39.px = P.x; V39.py = P.y; if(V39.stepD < 34) return; V39.stepD = 0;
  const rg = regionAt(P.x, P.y), sand = rg === 'beach', wood = ['rubik', 'chess', 'music', 'hall', 'rubikyard', 'office', 'elec'].includes(rg), stone = rg === 'road' || rg === 'yard';
  v39Sfx('k-step', sand ? .16 : wood ? .3 : stone ? .24 : .18, sand ? .78 : wood ? 1.18 : stone ? 1.04 : .9);
}

// ---------- boats: swipe to steer, tap to sail there ----------
function v39BoatInput(){
  const onCv = e => e.target === cvs && PLAYER && PLAYER.boat && PLAYER.controlled;
  window.addEventListener('pointerdown', e => { if(!onCv(e) || e.pointerType === 'mouse') return; e.stopImmediatePropagation(); V39.steer = {x0:e.clientX, y0:e.clientY, x:e.clientX, y:e.clientY, t:performance.now(), drag:false, id:e.pointerId}; }, true);
  window.addEventListener('pointermove', e => { const S = V39.steer; if(!S || e.pointerId !== S.id) return; e.stopImmediatePropagation(); S.x = e.clientX; S.y = e.clientY; if(Math.hypot(S.x - S.x0, S.y - S.y0) > 12){ S.drag = true; V39.boatGoal = null; } }, true);
  const up = e => { const S = V39.steer; if(!S || e.pointerId !== S.id) return; e.stopImmediatePropagation(); if(!S.drag && performance.now() - S.t < 300){ const r = cvs.getBoundingClientRect(), [wx, wy] = toWorld(e.clientX - r.left, e.clientY - r.top); if(wy > 905){ V39.boatGoal = [wx, wy]; v39Sfx('select', .4); } } V39.steer = null; };
  window.addEventListener('pointerup', up, true); window.addEventListener('pointercancel', up, true);
}
function v39BoatMove(c, dt){
  const b = c.boat, S = V39.steer, G = V39.boatGoal; let want = null, pow = 0;
  if(S && S.drag){ const dx = S.x - S.x0, dy = S.y - S.y0, L = Math.hypot(dx, dy); want = Math.atan2(dy/.75, dx); pow = Math.min(1, L/120); }
  else if(G){ const dx = G[0] - c.x, dy = (G[1] - c.y)/.75, L = Math.hypot(dx, dy); if(L < 26) V39.boatGoal = null; else { want = Math.atan2(dy, dx); pow = Math.min(1, L/220); } }
  if(want == null && !(keys.up || keys.down || keys.left || keys.right) && !(Math.abs(b.v) > 2 && b._v39)) return v39BoatBase(c, dt);
  if(want == null && (keys.up || keys.down || keys.left || keys.right)){ b._v39 = false; return v39BoatBase(c, dt); }
  b._v39 = true; const max = b.item ? b.item.s : 330;
  if(want != null){ let d = want - b.h; d = Math.atan2(Math.sin(d), Math.cos(d)); const tr = Math.max(-1.9*dt, Math.min(1.9*dt, d)); b.h += tr; b.tilt = (b.tilt || 0) + ((tr/dt)*.12 - (b.tilt || 0))*Math.min(1, dt*6); const target = max*pow*(Math.abs(d) > 1.6 ? .35 : 1); b.v += (target - b.v)*Math.min(1, dt*1.2); }
  else { b.v *= Math.pow(.45, dt); b.tilt = (b.tilt || 0)*Math.pow(.1, dt); if(Math.abs(b.v) < 3){ b.v = 0; b._v39 = false; } }
  const ok = (x, y) => x > 20 && x < W - 20 && y > 905 && y < H - 22 && !onPier(x, y) && !onIsland(x, y) && boatZoneOK(c, y);
  const nx = c.x + Math.cos(b.h)*b.v*dt, ny = c.y + Math.sin(b.h)*b.v*dt*.75;
  if(ok(nx, ny)){ c.x = nx; c.y = ny; } else if(ok(nx, c.y)){ c.x = nx; b.v *= .96; } else if(ok(c.x, ny)){ c.y = ny; b.v *= .96; } else b.v *= .5;
  c.dir = Math.cos(b.h) < 0 ? -1 : 1; c.moving = Math.abs(b.v) > 5; if(c.y > 1500) mprog('boat');
  b.trail = b.trail || []; if(Math.abs(b.v) > 30 && Math.random() < .6) b.trail.push({x:c.x - Math.cos(b.h)*24 + (Math.random() - .5)*6, y:c.y - Math.sin(b.h)*18, t:1.4});
  b.trail.forEach(p => p.t -= dt); b.trail = b.trail.filter(p => p.t > 0);
}
let v39BoatBase = null;
function v39BoatDraw(){
  const base = drawBoatPerson; drawBoatPerson = function(a){
    const b = a.boat; if(!b || a !== PLAYER) return base(a); const x = a.x, y = a.y, t = realT, bob = Math.sin(t*2.2 + x*.01)*1.6;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.max(-.12, Math.min(.12, b.tilt || 0))); ctx.translate(-x, -y + bob); base(a); ctx.restore();
    if(Math.abs(b.v) > 25){ const fx = x + Math.cos(b.h)*30, fy = y + Math.sin(b.h)*14 + 2; ctx.fillStyle = 'rgba(255,255,255,.75)'; for(let k=0;k<5;k++){ const a2 = b.h + Math.PI/2 + (k - 2)*.45, r = 3 + Math.sin(t*9 + k)*1.5; ctx.fillRect(Math.round(fx + Math.cos(a2)*r*1.6), Math.round(fy + Math.sin(a2)*r*.6), 2, 2); } }
    if(b._v39 || V39.boatGoal){ ctx.save(); ctx.globalAlpha = .35; ctx.translate(x, y + 4); ctx.scale(1, .75); ctx.rotate(b.h); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(52, 0); ctx.lineTo(38, -8); ctx.lineTo(38, 8); ctx.fill(); ctx.fillRect(28, -2, 12, 4); ctx.restore(); }
    if(V39.boatGoal){ const [gx, gy] = V39.boatGoal, r = 8 + Math.sin(t*5)*2; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(gx, gy, r*1.6, r*.7, 0, 0, 7); ctx.stroke(); }
  };
}

// ---------- the player: idle moments, emotes; NPCs chat with little icon bubbles ----------
function v39Emote(k){ V39.em = {k, t0:realT}; V39.idleT = 0; if(k === 'jump') v39Sfx('swipe', .4); if(k === 'dance') v39Sfx('streak', .35); }
function v39Person(){
  const base = drawPerson; drawPerson = function(a){
    if(a !== PLAYER || a.boat || a.v16fly || a.cycling || a.mount || a.flying || a.inSub) return base(a);
    const E = V39.em, x = a.x, y = a.y; let k = E && E.k, el = E ? realT - E.t0 : 0;
    if(E && el > (k === 'sit' ? 6 : k === 'dance' ? 4 : 2.2)){ V39.em = null; k = null; }
    if(!k && V39.idleT > 6){ const i = Math.floor((V39.idleT - 6)/3.5) % 4; k = ['look', 'stretch', 'yawn', 'scratch'][i]; el = (V39.idleT - 6) % 3.5; }
    if(!k) return base(a);
    ctx.save(); ctx.translate(x, y);
    if(k === 'jump'){ const h = Math.max(0, Math.sin(Math.min(1, el/.7)*Math.PI))*22; ctx.translate(0, -h); }
    else if(k === 'dance'){ ctx.rotate(Math.sin(el*9)*.16); ctx.translate(0, -Math.abs(Math.sin(el*9))*3); if(Math.floor(el*2) % 2) ctx.scale(-1, 1); }
    else if(k === 'sit'){ ctx.translate(0, 4); ctx.scale(1, .76); }
    else if(k === 'stretch'){ ctx.scale(1, 1 + Math.sin(Math.min(1, el/1.4)*Math.PI)*.07); }
    else if(k === 'look'){ const d0 = a.dir; a.dir = Math.floor(el/.8) % 2 ? -d0 : d0; ctx.translate(-x, -y); base(a); a.dir = d0; ctx.restore(); return; }
    ctx.translate(-x, -y); base(a); ctx.restore();
    const sk = a.skin || '#f2c9a0';
    if(k === 'wave' || k === 'stretch'){ const sw = k === 'wave' ? Math.sin(el*14)*3 : 0, ax = x + (a.dir > 0 ? 7 : -9) + sw; rect(sk, Math.round(ax), Math.round(y - 42), 2, 10); if(k === 'stretch') rect(sk, Math.round(x - (a.dir > 0 ? 9 : -7)), Math.round(y - 42), 2, 10); }
    if(k === 'scratch'){ const s = Math.sin(el*16)*1.5; rect(sk, Math.round(x + (a.dir > 0 ? 3 : -5) + s), Math.round(y - 37), 3, 3); }
    if(k === 'yawn' && el < 2){ ctx.font = '12px VT323, monospace'; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillText('z', x + 8, y - 44 - el*6); ctx.fillText('z', x + 12, y - 52 - el*6); }
    if(k === 'dance' && Math.floor(el*3) % 2){ ctx.font = '14px VT323, monospace'; ctx.fillStyle = '#E8C27A'; ctx.fillText('♪', x + 10, y - 46); }
  };
}
const V39_CHAT = ['💬', '😄', '📚', '⚽', '🎵', '🧊', '♟️', '🍜', '❤️', '❓'];
function v39Update(dt){
  const P = PLAYER;
  if(P && P.controlled && !P.moving && !V39.em) V39.idleT += dt; else V39.idleT = 0;
  if(P && V39.idleT > 6 && Math.floor((V39.idleT - 6)/3.5) % 4 === 0 && !V39.waved){ const n = agents.find(a => a !== P && a.visible && a.moving && Math.abs(a.x - P.x) < 70 && Math.abs(a.y - P.y) < 50); if(n){ V39.waved = true; v39Emote('wave'); setTimeout(() => V39.waved = false, 20000); } }
  v39Steps(dt);
  V39.chatT = (V39.chatT || 0) - dt; if(V39.chatT <= 0){ V39.chatT = 2.5;
    const vis = agents.filter(a => a.visible && !a.controlled && !a.inSub && inVB(a.x, a.y) && !a.moving);
    for(let i=0;i<vis.length;i++) for(let j=i+1;j<vis.length;j++){ const A = vis[i], B = vis[j]; if(Math.abs(A.x - B.x) < 46 && Math.abs(A.y - B.y) < 22 && !(A.bubble && realT < A.bubbleT) && Math.random() < .35){ A.dir = B.x > A.x ? 1 : -1; B.dir = -A.dir; A.bubble = V39_CHAT[Math.floor(Math.random()*V39_CHAT.length)]; A.bubbleT = realT + 2.6; setTimeout(() => { B.bubble = V39_CHAT[Math.floor(Math.random()*V39_CHAT.length)]; B.bubbleT = realT + 2.6; }, 1300); return; } } }
}

// ---------- performance: don't draw the world under full-screen layers ----------
function v39Covered(){ const m = $('#v32Menu'), mp = $('#v32Map'); return (m && !m.hidden) || (mp && !mp.hidden) || (document.body.classList.contains('v38full') && !!document.querySelector('.modal:not([hidden])')); }
function v39Perf(){ const r0 = render, m0 = renderMini; let skip = 0; render = function(dt){ if(v39Covered()){ skip++; return; } skip = 0; r0(dt); }; renderMini = function(){ if(v39Covered()) return; m0(); }; }

function v39Init(){
  v39Hooks(); v39Mentor(); v39SoundHooks(); v39BoatInput(); v39BoatBase = boatMove; boatMove = v39BoatMove; v39BoatDraw(); v39Person(); v39Perf();
  const eu = extUpdate; extUpdate = function(dt){ eu(dt); try { v39Update(dt); } catch(e){} };
  try { const lg = $('#v32LogoImg'); if(lg){ V32.logo = null; lg.src = v32Logo(); } } catch(e){}
  v39VolApply();
}
