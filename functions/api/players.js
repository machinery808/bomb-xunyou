const APP_ID='4656000';
const STEAMDB_URL=`https://steamdb.info/app/${APP_ID}/charts/`;
const STEAM_API_URL=`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${APP_ID}`;

async function fromSteamDb(){
  const response=await fetch(STEAMDB_URL,{headers:{Accept:'text/html','User-Agent':'Mozilla/5.0 (compatible; BombXunyouLobby/1.0)'}});
  if(!response.ok)throw new Error(`SteamDB HTTP ${response.status}`);
  const html=await response.text();
  const match=html.match(/id="js-charts-button"[\s\S]{0,500}?class="header-thing-number">([\d,]+)</i);
  const playerCount=Number(match?.[1]?.replaceAll(',',''));
  if(!Number.isInteger(playerCount)||playerCount<0)throw new Error('SteamDB player count not found');
  return {playerCount,source:'SteamDB'};
}

async function fromSteamApi(){
  const response=await fetch(STEAM_API_URL,{headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error(`Steam API HTTP ${response.status}`);
  const data=await response.json();
  const playerCount=Number(data?.response?.player_count);
  if(!Number.isInteger(playerCount)||playerCount<0)throw new Error('Steam player count not found');
  return {playerCount,source:'Steam'};
}

export async function onRequestGet(){
  try{
    let result;
    try{result=await fromSteamDb();}catch{result=await fromSteamApi();}
    return new Response(JSON.stringify({...result,appId:APP_ID,updatedAt:new Date().toISOString()}),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=30, s-maxage=60, stale-while-revalidate=120'}});
  }catch{
    return new Response(JSON.stringify({error:'Player count unavailable',appId:APP_ID}),{status:502,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  }
}
