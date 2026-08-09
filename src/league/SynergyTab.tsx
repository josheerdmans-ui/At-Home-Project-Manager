// @ts-nocheck
import React from 'react';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area, Legend, PieChart, Pie, Cell } from 'recharts';
import { Scale, Swords, RefreshCw, Skull, Heart, Siren } from 'lucide-react'; // Added Siren for Ganks

const COLORS = {
  bg: "bg-[#0b0c15]",
  card: "bg-[#151823]",
  neonLime: "#39ff14",
  neonPink: "#ff69b4",
  slate: "#64748b",
  red: "#f43f5e",
  cyan: "#22d3ee"
};

const Card = ({ children, className = "" }) => (
  <div className={`${COLORS.card} rounded-sm p-6 shadow-lg border border-slate-800/50 ${className}`}>
    {children}
  </div>
);

// --- BLOOD BROTHERS ---
const BloodBrothersCard = ({ stats }) => {
  const { mutual, total } = stats || { mutual: 0, total: 0 };
  const percentage = total > 0 ? Math.round((mutual / total) * 100) : 0;
  return (
    <Card className="flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
      <div className="absolute top-2 right-2 text-slate-700"><Swords size={48} opacity={0.2} /></div>
      <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Blood Brothers</div>
      <div className="text-7xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{percentage}%</div>
      <div className="mt-4 text-center">
        <div className="text-xs text-slate-500">Kill Participation</div>
        <div className="text-[10px] text-slate-600">Assisted each other on <span className="text-white">{mutual}</span> kills.</div>
      </div>
      <div className="w-full h-1.5 bg-slate-800 mt-6 rounded-full overflow-hidden">
         <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500" style={{width: `${percentage}%`}}></div>
      </div>
    </Card>
  );
};

// --- SOCIALIST (PIE) ---
const SocialistCard = ({ gold }) => {
  if (!gold) return null;
  const data = [{ name: 'Yellowcardfan69', value: gold.me }, { name: 'NicklebackFan69', value: gold.friend }];
  const total = gold.me + gold.friend;
  const mePct = Math.round((gold.me / total) * 100);

  return (
    <Card className="flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
      <div className="absolute top-2 right-2 text-slate-700"><Scale size={48} opacity={0.2} /></div>
      <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">The Socialist Index</div>
      <div className="w-full h-[120px] relative">
         <ResponsiveContainer width="100%" height="100%">
            <PieChart>
               <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value" stroke="none">
                 <Cell key="me" fill={COLORS.neonLime} />
                 <Cell key="friend" fill={COLORS.neonPink} />
               </Pie>
               <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b'}} formatter={(value) => `${(value / 1000).toFixed(1)}k Gold`} />
            </PieChart>
         </ResponsiveContainer>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-black text-white">{mePct}%</div>
      </div>
      <div className="mt-2 flex justify-between w-full px-6 text-[10px] font-bold uppercase">
         <div style={{color: COLORS.neonLime}}>Me</div>
         <div style={{color: COLORS.neonPink}}>Friend</div>
      </div>
    </Card>
  );
};

// --- RECALL SYNC ---
const RecallSyncCard = ({ stats }) => {
  const { synced, total } = stats || { synced: 0, total: 0 };
  const percentage = total > 0 ? Math.round((synced / total) * 100) : 0;
  return (
    <Card className="flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
      <div className="absolute top-2 right-2 text-slate-700"><RefreshCw size={48} opacity={0.2} /></div>
      <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Recall Sync</div>
      <div className="text-7xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">{percentage}%</div>
      <div className="mt-4 text-center">
         <div className="text-xs text-slate-500">Tempo Match</div>
         <div className="text-[10px] text-slate-600">Based together <span className="text-cyan-400">{synced}</span> times.</div>
      </div>
    </Card>
  );
};

// --- ROMEO & JULIET ---
const RomeoJulietCard = ({ count, totalDeaths }) => {
  const deathsTogether = (count || 0) * 2; 
  const pct = totalDeaths > 0 ? Math.round((deathsTogether / totalDeaths) * 100) : 0;
  return (
    <Card className="flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
      <div className="absolute top-2 right-2 text-slate-700"><Skull size={48} opacity={0.2} /></div>
      <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Romeo & Juliet</div>
      <div className="text-7xl font-black text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]">{pct}%</div>
      <div className="mt-4 text-center">
         <div className="text-xs text-slate-500">Death Pact</div>
         <div className="text-[10px] text-slate-600"><span className="text-rose-500">{deathsTogether}</span> shared deaths.</div>
      </div>
    </Card>
  );
};

// --- SAVIOR ---
const SaviorCard = ({ meTaken, friendGiven }) => {
  const pctSaved = meTaken > 0 ? Math.round((friendGiven / meTaken) * 100) : 0;
  const maxVal = Math.max(meTaken, friendGiven);
  const meWidth = maxVal > 0 ? (meTaken / maxVal) * 100 : 0;
  const frWidth = maxVal > 0 ? (friendGiven / maxVal) * 100 : 0;

  return (
    <Card className="flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
      <div className="absolute top-2 right-2 text-slate-700"><Heart size={48} opacity={0.2} /></div>
      <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">The Savior</div>
      <div className="text-5xl font-black text-white mb-4">{pctSaved}% <span className="text-sm font-normal text-slate-500">SAVED</span></div>
      <div className="w-full space-y-4 px-2">
         <div>
            <div className="flex justify-between text-[10px] font-bold mb-1">
               <span className="text-rose-400">DAMAGE I TOOK</span>
               <span className="text-white">{(meTaken / 1000).toFixed(1)}k</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full">
               <div className="h-full bg-rose-500 rounded-full" style={{width: `${meWidth}%`}}></div>
            </div>
         </div>
         <div>
            <div className="flex justify-between text-[10px] font-bold mb-1">
               <span style={{color: COLORS.neonPink}}>PARTNER SHIELDED</span>
               <span className="text-white">{(friendGiven / 1000).toFixed(1)}k</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full">
               <div className="h-full rounded-full" style={{width: `${frWidth}%`, backgroundColor: COLORS.neonPink}}></div>
            </div>
         </div>
      </div>
    </Card>
  );
};

// --- NEW CARD: GANK MAGNET (CAMPOMETER) ---
const GankMagnetCard = ({ stats }) => {
  const { totalLaneDeaths, gankDeaths } = stats || { totalLaneDeaths: 0, gankDeaths: 0 };
  const percentage = totalLaneDeaths > 0 ? Math.round((gankDeaths / totalLaneDeaths) * 100) : 0;

  return (
    <Card className="flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
      <div className="absolute top-2 right-2 text-slate-700"><Siren size={48} opacity={0.2} /></div>
      <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Gank Magnet</div>
      
      <div className="text-7xl font-black text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
         {percentage}%
      </div>
      
      <div className="mt-4 text-center">
         <div className="text-xs text-slate-500">"We got camped!"</div>
         <div className="text-[10px] text-slate-600 mt-1">
            <span className="text-amber-500 font-bold">{gankDeaths}</span> of your {totalLaneDeaths} lane deaths involved a Jungler/Mid.
         </div>
      </div>
    </Card>
  );
};

// --- CARRY SEESAW ---
const CarrySeesaw = ({ data }) => {
  return (
    <Card className="col-span-1 lg:col-span-2 min-h-[300px]">
      <div className="flex justify-between items-center mb-6">
         <div>
            <h3 className="text-white font-bold text-sm uppercase">The Carry Seesaw</h3>
            <p className="text-[10px] text-slate-500">Calculated via Gold, KDA, and Vision impact per game.</p>
         </div>
      </div>
      <div className="h-[240px] w-full pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{top: 10, right: 30, left: 0, bottom: 20}}>
             <defs>
                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor={COLORS.neonLime} stopOpacity={0.3}/>
                   <stop offset="95%" stopColor={COLORS.neonLime} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="splitColor2" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor={COLORS.neonPink} stopOpacity={0.3}/>
                   <stop offset="95%" stopColor={COLORS.neonPink} stopOpacity={0}/>
                </linearGradient>
             </defs>
             <XAxis dataKey="game" tick={{fontSize: 10, fill: '#64748b'}} stroke="#334155" />
             <YAxis tick={false} stroke="#334155" label={{ value: 'Impact Score', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
             <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const me = payload[0].value;
                    const friend = payload[1].value;
                    const winner = me > friend ? "Yellowcardfan69" : "NicklebackFan69";
                    const color = me > friend ? COLORS.neonLime : COLORS.neonPink;
                    return (
                      <div className="bg-[#0f172a] border border-slate-700 p-3 rounded shadow-xl">
                        <p className="text-slate-400 text-[10px] mb-1">Game {label}</p>
                        <p className="font-bold text-sm mb-2" style={{color}}>🏆 {winner}</p>
                        <div className="text-xs text-slate-300">Me: {Math.round(me)}</div>
                        <div className="text-xs text-slate-300">Friend: {Math.round(friend)}</div>
                      </div>
                    );
                  }
                  return null;
                }}
             />
             <Legend wrapperStyle={{fontSize: '11px', paddingTop: '15px'}} />
             <Area type="monotone" dataKey="meScore" name="Yellowcardfan69" stroke={COLORS.neonLime} fill="url(#splitColor)" strokeWidth={2} />
             <Area type="monotone" dataKey="friendScore" name="NicklebackFan69" stroke={COLORS.neonPink} fill="url(#splitColor2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

// --- MATCHUP BAR (Helper) ---
const MatchupBar = ({ label, myScore, enemyScore, myColor, myChamp }) => {
   const total = myScore + enemyScore || 1;
   const myPct = (myScore / total) * 100;
   
   return (
      <div className="flex-1">
         <div className="flex justify-between items-center text-[10px] font-bold mb-1 uppercase text-slate-500">
            {/* Left Label: Name + Champ Icon */}
            <div className="flex items-center gap-1.5">
               {myChamp && (
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/15.1.1/img/champion/${myChamp}.png`} 
                    alt={myChamp} 
                    className="w-4 h-4 rounded-full border border-slate-600"
                  />
               )}
               <span>{label}</span>
            </div>
            
            <span className="text-slate-600">VS</span>
            
            <span>Enemy</span>
         </div>
         
         <div className="flex justify-between items-end mb-1">
            <span className="text-lg font-black" style={{color: myColor}}>{myScore}</span>
            <span className="text-sm font-bold text-rose-500">{enemyScore}</span>
         </div>
         <div className="w-full h-1.5 bg-slate-800 rounded-full flex overflow-hidden">
            <div className="h-full" style={{width: `${myPct}%`, backgroundColor: myColor}}></div>
            <div className="h-full bg-rose-500" style={{width: `${100-myPct}%`}}></div>
         </div>
      </div>
   );
};

// --- LANE MATCHUP HISTORY ---
const LaneMatchupHistory = ({ history }) => {
  if (!history || history.length === 0) return <Card>No Lane History</Card>;
  const recentGames = [...history].reverse().slice(0, 5);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[300px]">
       <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
         <div>
            <h3 className="text-white font-bold text-lg uppercase tracking-wide">Lane Battle History</h3>
            <p className="text-xs text-slate-500 mt-1">Head-to-Head Performance (Last 5 Games)</p>
         </div>
         <div className="text-right">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Average Lane Score</div>
            <div className="text-2xl font-black text-white">
               {Math.round(recentGames.reduce((acc, curr) => acc + curr.us, 0) / recentGames.length)}
            </div>
         </div>
       </div>

       <div className="space-y-4">
         {recentGames.map((game) => {
            const { details, champions } = game;
            
            const myTotal = details.me + details.friend;
            const enTotal = details.enemyAdc + details.enemySupp;
            const diff = myTotal - enTotal;
            const isWin = diff > 0;
            const grandTotal = myTotal + enTotal || 1;
            const ourPct = (myTotal / grandTotal) * 100;
            
            const myChamp = champions?.me || "Unknown";
            const frChamp = champions?.friend || "Unknown";
            const enAdc = champions?.enemyAdc || "Unknown";
            const enSupp = champions?.enemySupp || "Unknown";

            return (
               <div key={game.game} className="bg-[#0f111a] border border-slate-800/50 p-4 rounded-sm hover:border-slate-700 transition-colors relative overflow-hidden">
                  
                  {/* Header Row */}
                  <div className="flex items-center gap-4 mb-4 relative z-10">
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${game.win ? 'bg-cyan-400' : 'bg-rose-500'}`}></div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Game {game.game}</span>
                     </div>
                     <div className="flex items-center gap-3 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                        <div className="flex items-center gap-1 opacity-80">
                           <img src={`https://ddragon.leagueoflegends.com/cdn/15.1.1/img/champion/${myChamp}.png`} className="w-5 h-5 rounded-full border border-slate-600" alt={myChamp} />
                           <img src={`https://ddragon.leagueoflegends.com/cdn/15.1.1/img/champion/${frChamp}.png`} className="w-5 h-5 rounded-full border border-slate-600" alt={frChamp} />
                        </div>
                        <span className="text-[10px] text-slate-600 font-bold">VS</span>
                        <div className="flex items-center gap-1 opacity-60 grayscale">
                           <img src={`https://ddragon.leagueoflegends.com/cdn/15.1.1/img/champion/${enAdc}.png`} className="w-5 h-5 rounded-full border border-slate-700" alt={enAdc} />
                           <img src={`https://ddragon.leagueoflegends.com/cdn/15.1.1/img/champion/${enSupp}.png`} className="w-5 h-5 rounded-full border border-slate-700" alt={enSupp} />
                        </div>
                     </div>
                  </div>

                  {/* Individual Matchups */}
                  <div className="flex gap-6 mb-8">
                     <MatchupBar label="Yellowcardfan69" myChamp={myChamp} myScore={details.me} enemyScore={details.enemyAdc} myColor={COLORS.neonLime} />
                     <div className="w-px bg-slate-800"></div>
                     <MatchupBar label="NicklebackFan69" myChamp={frChamp} myScore={details.friend} enemyScore={details.enemySupp} myColor={COLORS.neonPink} />
                  </div>

                  {/* BADGE IN MIDDLE */}
                  <div className="flex justify-center -mt-4 mb-4 relative z-20">
                     {isWin ? (
                        <div className="bg-[#0f111a] px-4">
                           <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-8 py-1.5 rounded text-lg font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)] transform scale-110">
                              LANE WON (+{diff})
                           </div>
                        </div>
                     ) : (
                        <div className="bg-[#0f111a] px-4">
                           <div className="px-4 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded text-xs font-bold uppercase">
                              LANE GAP ({diff})
                           </div>
                        </div>
                     )}
                  </div>

                  {/* DUO TOTAL */}
                  <div className="pt-2 border-t border-slate-800/50">
                     <div className="flex justify-between items-end mb-2">
                        <div className="text-left">
                           <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Total Duo Score</div>
                           <div className="text-2xl font-black text-white">{myTotal}</div>
                        </div>
                        <div className="text-right">
                           <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Total Enemy Score</div>
                           <div className="text-2xl font-black text-slate-400">{enTotal}</div>
                        </div>
                     </div>
                     <div className="w-full h-3 bg-slate-900 rounded-full flex overflow-hidden border border-slate-800/50">
                        <div className="h-full bg-cyan-400" style={{width: `${ourPct}%`}}></div>
                        <div className="h-full bg-rose-500" style={{width: `${100-ourPct}%`}}></div>
                     </div>
                  </div>

               </div>
            );
         })}
       </div>
    </Card>
  );
};

export default function SynergyTab({ data }) {
  if (!data || !data.synergy) {
     return (
       <Card className="flex items-center justify-center min-h-[500px]">
         <div className="text-center animate-pulse">
           <div className="text-2xl font-bold text-rose-500 mb-2">API Connection Failed</div>
           <div className="text-slate-400 text-sm">Please check your API Key or try again later.</div>
         </div>
       </Card>
     );
  }

  const { bloodBrothers, socialist, seesaw, recallSync, romeoJuliet, savior, laneHistory, gankMagnet } = data.synergy;
  const goldStats = { me: data.raw.me.gold, friend: data.raw.friend.gold };
  const totalDeaths = data.raw.me.deaths + data.raw.friend.deaths;
  const meTaken = data.raw.me.dmgTaken;
  const friendGiven = data.raw.friend.healing + data.raw.friend.shielding;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500`}>
       {/* ROW 1 */}
       <BloodBrothersCard stats={bloodBrothers} />
       <RecallSyncCard stats={recallSync} />
       <SocialistCard gold={goldStats} />
       <RomeoJulietCard count={romeoJuliet} totalDeaths={totalDeaths} />
       
       {/* ROW 2 */}
       <SaviorCard meTaken={meTaken} friendGiven={friendGiven} />
       <GankMagnetCard stats={gankMagnet} /> {/* NEW CARD ADDED */}
       <CarrySeesaw data={seesaw} />
       
       {/* ROW 3 - LIST LAYOUT */}
       <LaneMatchupHistory history={laneHistory} />
    </div>
  );
}