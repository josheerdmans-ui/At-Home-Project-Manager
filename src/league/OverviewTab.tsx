// @ts-nocheck
import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, AreaChart, Area, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

const COLORS = {
  bg: "bg-[#0b0c15]",
  card: "bg-[#151823]",
  cyan: "#22d3ee",
  pink: "#f472b6",
  green: "#34d399",
  red: "#f87171",
  purple: "#8b5cf6",
  neonLime: "#39ff14",
  neonPink: "#ff69b4"
};

// --- THE GLOW STYLES ---
const NEON_LIME = `text-[${COLORS.neonLime}] font-black drop-shadow-[0_0_10px_rgba(57,255,20,0.6)] tracking-wide`;
const NEON_PINK = `text-[${COLORS.neonPink}] font-black drop-shadow-[0_0_10px_rgba(255,105,180,0.6)] tracking-wide`;

const Card = ({ children, className = "" }) => (
  <div className={`${COLORS.card} rounded-sm p-4 shadow-lg border border-slate-800/50 ${className}`}>
    {children}
  </div>
);

const Badge = ({ text, color }) => (
  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${color} text-slate-900`}>
    {text}
  </span>
);

const StatBox = ({ label, value }) => (
  <div className="bg-[#0f111a] rounded-sm p-3 flex flex-col items-center justify-center border border-slate-800/50 min-h-[80px]">
    <div className="text-3xl font-black text-white">{value}</div>
    <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">{label}</div>
  </div>
);

const ProfileSection = ({ name, tag, rank, badges, icon, isLeft, neonStyle }) => (
  <div className={`flex flex-col items-center justify-center w-full ${isLeft ? 'border-r border-slate-700/50' : ''}`}>
    <div className="relative mb-3">
      <div className={`w-16 h-16 rounded-full border-2 ${isLeft ? 'border-cyan-400' : 'border-pink-500'} p-0.5`}>
        <div className="w-full h-full rounded-full bg-slate-800 bg-cover bg-center" style={{backgroundImage: `url('${icon}')`}}></div>
      </div>
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#0b0c15] text-[10px] px-2 py-0.5 rounded border border-slate-700 text-amber-400 font-bold whitespace-nowrap">
        {rank}
      </div>
    </div>
    <div className="mt-4 text-center">
      <div className={`text-2xl ${neonStyle}`}>{name} <span className="text-slate-500 text-sm font-normal drop-shadow-none">#{tag}</span></div>
    </div>
    <div className="flex gap-2 mt-2">
      {badges.map((b, i) => <Badge key={i} text={b.text} color={b.color} />)}
    </div>
  </div>
);

const ChampionTable = ({ champs }) => (
  <div className="w-full">
    <div className="grid grid-cols-5 text-xs text-slate-500 font-bold uppercase mb-3 px-3">
      <div className="col-span-2">Champions</div>
      <div className="text-center">Games</div>
      <div className="text-center">Win Rate</div>
      <div className="text-center">KDA</div>
    </div>
    <div className="space-y-2">
      {champs.slice(0, 6).map((c) => {
        const wr = Math.round((c.wins / c.games) * 100);
        const kda = ((c.kills + c.assists) / (c.deaths || 1)).toFixed(1);
        return (
          <div key={c.name} className="grid grid-cols-5 items-center bg-[#0f111a] p-3 rounded-sm border border-slate-800/30">
            <div className="col-span-2 flex items-center gap-3">
               <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white border border-slate-600">
                 {c.name.charAt(0)}
               </div>
               <span className="text-white font-bold text-xs">{c.name}</span>
            </div>
            <div className="text-center text-slate-400 font-bold text-xs">{c.games}</div>
            <div className={`text-center font-bold text-xs ${wr >= 50 ? 'text-cyan-400' : 'text-rose-500'}`}>{wr}%</div>
            <div className="text-center text-slate-400 font-bold text-xs">{kda}</div>
          </div>
        );
      })}
    </div>
  </div>
);

const MasteryPodium = ({ champs, version }) => {
  if (!champs || champs.length === 0) return <div className="text-slate-500 text-xs text-center p-4">No Mastery Data</div>;

  return (
    <div className="flex justify-center items-end gap-4 h-full pb-0">
      {champs.map((c, i) => {
        const isFirst = i === 0;
        const size = isFirst ? "w-20 h-20" : "w-14 h-14";
        const border = isFirst ? "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]" : "border-slate-500";
        const order = isFirst ? "order-2 -mt-6" : (i === 1 ? "order-1" : "order-3");

        return (
          <div key={c.name} className={`flex flex-col items-center ${order}`}>
             <div className={`${size} rounded-full border-2 ${border} p-0.5 bg-[#0f111a] relative z-10`}>
                <div className="w-full h-full rounded-full bg-cover bg-center" 
                     style={{backgroundImage: `url('https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.id}.png')`}}>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0b0c15] text-[9px] px-2 rounded border border-slate-700 text-slate-300 font-bold whitespace-nowrap shadow-sm">
                   Lvl {c.level}
                </div>
             </div>
             <div className="text-center mt-2">
                <div className={`font-bold uppercase ${isFirst ? 'text-sm text-white' : 'text-xs text-slate-300'}`}>{c.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">{(c.points / 1000).toFixed(0)}k pts</div>
             </div>
          </div>
        );
      })}
    </div>
  );
};

const ComparisonBar = ({ label, us, them, unit = "" }) => {
  const total = us + them || 1;
  const usPct = (us / total) * 100;
  
  return (
    <div className="mb-4">
      <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
         <span className="text-cyan-400">{us.toLocaleString()} {unit}</span>
         <span className="text-slate-500">{label}</span>
         <span className="text-rose-500">{them.toLocaleString()} {unit}</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full flex overflow-hidden">
        <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: `${usPct}%` }}></div>
        <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${100 - usPct}%` }}></div>
      </div>
    </div>
  );
};

const GPI_DESCRIPTIONS = {
  Versatility: "Breadth of champion pool played.",
  Fighting: "Kills + Assists participation.",
  Farming: "CS (Creep Score) efficiency.",
  Vision: "Vision score contribution.",
  Aggression: "Damage dealt to champions.",
  Survivability: "Ability to avoid deaths.",
  Objectives: "Dragon and neutral objective control.",
  Consistency: "Overall win rate stability."
};

export default function OverviewTab({ data }) {
  const games = data.summary.games;
  const recentActivity = data.dailyActivity.slice(-42); 

  const meMastery = data.mastery?.me || [];
  const frMastery = data.mastery?.friend || [];
  const sortM = (arr) => [...arr].sort((a,b) => b.points - a.points);

  // Use the new Latest Matchup data
  const usLatest = data.latestMatchup.us;
  const themLatest = data.latestMatchup.them;

  return (
    <div className={`space-y-6 animate-in fade-in duration-500 font-sans ${COLORS.bg} p-4 min-h-screen`}>
      
      {/* HEADER ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-3 p-0 overflow-hidden relative min-h-[220px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-cyan-500 to-purple-500"></div>
          <div className="flex h-full py-8">
            <ProfileSection 
              name="Yellowcardfan69" tag="6767" rank={data.ranks.me}
              icon="https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/588.png"
              badges={[{text:"Already Dead", color:"bg-rose-500"}]}
              isLeft={true}
              neonStyle={NEON_LIME} 
            />
            <ProfileSection 
              name="NicklebackFan69" tag="NA1" rank={data.ranks.friend}
              icon="https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/29.png"
              badges={[{text:"Vision Focused", color:"bg-emerald-400"}]}
              neonStyle={NEON_PINK} 
            />
          </div>
          <div className="bg-[#0f111a] p-3 border-t border-slate-800 flex justify-between items-center px-8 absolute bottom-0 w-full">
             <div className="text-xs font-bold text-slate-300 uppercase">Duo Total Win/Loss Rate</div>
             <div className="w-1/2 h-2 bg-slate-800 rounded-full flex overflow-hidden mx-4">
                <div className="h-full bg-cyan-400" style={{width: `${data.summary.winRate}%`}}></div>
                <div className="h-full bg-rose-500" style={{width: `${100-data.summary.winRate}%`}}></div>
             </div>
             <div className="text-xs font-bold text-white">{data.raw.me.wins}W {games - data.raw.me.wins}L ({data.summary.winRate}%)</div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between h-full min-h-[220px]">
           <div className="flex justify-between items-start mb-2">
             <div className="text-[10px] font-bold text-slate-400 uppercase">Recent Activity</div>
             <div className="text-[9px] text-slate-600">Last 6 Weeks</div>
           </div>
           <div className="grid grid-rows-7 grid-flow-col gap-1.5 flex-1 w-full h-full">
             {recentActivity.map((day) => {
               let color = "bg-[#23263a]";
               if(day.games > 0) color = day.wins/day.games >= 0.5 ? "bg-cyan-400" : "bg-rose-500";
               return (
                 <div key={day.date} className={`rounded-[2px] ${color} cursor-help group/item relative w-full h-full`}>
                    <div className="hidden group-hover/item:block absolute bottom-full right-0 mb-1 bg-black border border-slate-700 p-2 z-50 whitespace-nowrap shadow-xl">
                      <div className="text-white font-bold text-xs">{day.date}</div>
                      <div className="text-cyan-400 text-xs">{day.games > 0 ? `${day.wins}W - ${day.games-day.wins}L` : 'No Games'}</div>
                    </div>
                 </div>
               );
             })}
           </div>
           <div className="flex justify-between items-end mt-4 text-[9px] text-slate-500">
             <div><div className="text-white font-bold">{games} games</div></div>
             <div className="flex gap-1"><div className="w-2 h-2 bg-rose-500"></div><div className="w-2 h-2 bg-cyan-400"></div></div>
           </div>
        </Card>
      </div>

      {/* MATCHUP & CHAMPS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        <Card className="min-h-[350px] flex flex-col">
          <div className="mb-6 border-b border-slate-800 pb-2">
            <h3 className="text-white font-bold text-sm uppercase tracking-wide">Lane Matchup (Latest Game)</h3>
            <p className="text-[10px] text-slate-500 mt-1">Us (Blue) vs. Lane Opponents (Red)</p>
          </div>
          <div className="flex-1 flex flex-col justify-center">
             <ComparisonBar label="Total Kills" us={usLatest.kills} them={themLatest.kills} />
             <ComparisonBar label="Total Gold" us={usLatest.gold} them={themLatest.gold} unit="g" />
             <ComparisonBar label="Total Damage" us={usLatest.dmg} them={themLatest.dmg} />
             <ComparisonBar label="Vision Score" us={usLatest.vision} them={themLatest.vision} />
          </div>
        </Card>

        <Card className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[350px]">
           <div>
             <div className={`mb-4 text-xl ${NEON_LIME}`}>Yellowcardfan69</div>
             <ChampionTable champs={data.topChamps.me} />
           </div>
           <div>
             <div className={`mb-4 text-xl ${NEON_PINK}`}>NicklebackFan69</div>
             <ChampionTable champs={data.topChamps.friend} />
           </div>
        </Card>
      </div>

      {/* STAT BOXES */}
      <div className="space-y-4">
        <div>
          <div className={`mb-2 ml-1 text-lg ${NEON_LIME}`}>YELLOWCARDFAN69</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatBox label="GD@15" value={data.performance.me.gd15} />
            <StatBox label="Vision" value={data.performance.me.vision} />
            <StatBox label="Control Wards" value={data.performance.me.control} />
            <StatBox label="Solo Deaths" value={data.performance.me.soloDeaths} />
            <StatBox label="Solo Kills" value={data.performance.me.soloKills} />
          </div>
        </div>
        <div>
          <div className={`mb-2 ml-1 text-lg ${NEON_PINK}`}>NICKLEBACKFAN69</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatBox label="GD@15" value={data.performance.friend.gd15} />
            <StatBox label="Vision" value={data.performance.friend.vision} />
            <StatBox label="Control Wards" value={data.performance.friend.control} />
            <StatBox label="Solo Deaths" value={data.performance.friend.soloDeaths} />
            <StatBox label="Solo Kills" value={data.performance.friend.soloKills} />
          </div>
        </div>
      </div>

      {/* GRAPHS ROW: GPI RADAR & MASTERY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
         <Card className="min-h-[350px]">
          <div className="mb-4">
            <h3 className="text-white font-bold text-sm">Gamer Performance Index (GPI)</h3>
            <p className="text-[10px] text-slate-500 mt-1">8-point analysis of playstyle and performance.</p>
          </div>
          <div className="h-[280px]">
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.gpi}>
                  <PolarGrid stroke="#2d2d55" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={({ x, y, payload }) => (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={0} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight="bold">{payload.value}</text>
                        <title>{GPI_DESCRIPTIONS[payload.value]}</title>
                      </g>
                    )} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Yellowcardfan69" dataKey="A" stroke={COLORS.neonLime} fill={COLORS.neonLime} fillOpacity={0.3} strokeWidth={2} />
                  <Radar name="NicklebackFan69" dataKey="B" stroke={COLORS.neonPink} fill={COLORS.neonPink} fillOpacity={0.3} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }} />
                </RadarChart>
             </ResponsiveContainer>
          </div>
        </Card>

         <Card className="lg:col-span-2 min-h-[350px] flex flex-col">
            <div className="text-xs font-bold text-purple-400 uppercase mb-2 text-center">Highest Champion Mastery</div>
            <div className="grid grid-cols-2 gap-4 flex-1 items-center">
               <div className="border-r border-slate-800 flex flex-col justify-center">
                  <div className={`text-center mb-8 text-sm ${NEON_LIME}`}>Yellowcardfan69</div>
                  <MasteryPodium champs={sortM(meMastery)} version={data.version || '14.1.1'} />
               </div>
               <div className="flex flex-col justify-center">
                  <div className={`text-center mb-8 text-sm ${NEON_PINK}`}>NicklebackFan69</div>
                  <MasteryPodium champs={sortM(frMastery)} version={data.version || '14.1.1'} />
               </div>
            </div>
         </Card>
      </div>

      {/* VS GOLD GRAPH */}
      <div className="w-full h-[200px] relative mt-8">
        <div className="text-center text-purple-500 font-bold uppercase tracking-widest text-sm mb-2">Latest Game: Us (Purple) vs Them (Red) Gold</div>
        <ResponsiveContainer width="100%" height="100%">
           {data.goldGraph.length > 0 ? (
             <AreaChart data={data.goldGraph}>
               <defs>
                 <linearGradient id="colorUs" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                   <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                 </linearGradient>
                 <linearGradient id="colorThem" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                   <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <Area type="monotone" dataKey="usGold" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUs)" />
               <Area type="monotone" dataKey="themGold" stroke="#f87171" fillOpacity={1} fill="url(#colorThem)" />
               <Tooltip contentStyle={{ backgroundColor: '#0f172a' }} />
             </AreaChart>
           ) : (
             <div className="flex items-center justify-center h-full text-slate-500 text-xs font-bold border border-slate-800 border-dashed rounded bg-[#0f111a]">
               Timeline Data Not Available
             </div>
           )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}