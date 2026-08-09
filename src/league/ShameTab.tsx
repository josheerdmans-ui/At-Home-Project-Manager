// @ts-nocheck
import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { Gavel, Crosshair, Frown, Skull, Siren, Timer, TrendingDown } from 'lucide-react';

const Card = ({ children, title, icon: Icon, className="" }) => (
  <div className={`bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-2xl ${className}`}>
    <div className="flex items-center gap-3 mb-6 text-slate-400 uppercase tracking-widest text-xs font-bold">
      {Icon && <Icon size={18} className="text-cyan-500" />} {title}
    </div>
    {children}
  </div>
);

export default function ShameTab({ data }) {
  // SAFETY CHECK: Prevents crash if data is missing
  if (!data || !data.shame || !data.shame.tilt) {
    return <div className="text-slate-500 text-center p-10">Loading Shame Data...</div>;
  }

  const normalKda = data.shame.tilt.normal.games > 0 ? (data.shame.tilt.normal.kda / data.shame.tilt.normal.games).toFixed(2) : "0.00";
  const lossKda = data.shame.tilt.afterLoss.games > 0 ? (data.shame.tilt.afterLoss.kda / data.shame.tilt.afterLoss.games).toFixed(2) : "0.00";
  const isTilted = parseFloat(lossKda) < parseFloat(normalKda);

  const timeDeadMe = Math.round((data.raw.me.deaths * 35) / 60);
  const timeDeadFr = Math.round((data.raw.friend.deaths * 35) / 60);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="KS Tribunal" icon={Gavel}>
          <div className="text-5xl font-black text-rose-500 text-center">{data.shame.ksTribunal}</div>
          <p className="text-[10px] text-slate-500 text-center mt-2 uppercase font-bold">Kills Stolen from You</p>
        </Card>
        
        <Card title="Pacifist Count" icon={Frown}>
           <div className="flex justify-around items-end">
              <div className="text-center">
                <div className="text-3xl font-black text-white">{data.shame.pacifist.me}</div>
                <div className="text-[10px] text-slate-500">Me</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-slate-500">{data.shame.pacifist.friend}</div>
                <div className="text-[10px] text-slate-500">Him</div>
              </div>
           </div>
           <p className="text-[10px] text-slate-500 text-center mt-2 uppercase font-bold">Wins with Lowest Dmg</p>
        </Card>

        <Card title="Gray Screen Time" icon={Timer}>
           <div className="text-center">
             <div className="text-4xl font-black text-slate-200">{timeDeadMe} <span className="text-lg text-slate-500">min</span></div>
             <p className="text-[10px] text-slate-500 mt-1">You spent watching shop</p>
             <div className="text-xs text-rose-500 mt-2 font-bold">Him: {timeDeadFr} min</div>
           </div>
        </Card>

        <Card title="Master Baiter" icon={Crosshair}>
          <div className="flex justify-around text-center h-full items-center">
            <div>
                <div className="text-3xl font-black text-cyan-400">{data.shame.baits.me}</div>
                <div className="text-[10px] uppercase font-bold text-slate-600">My Baits</div>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div>
                <div className="text-3xl font-black text-rose-500">{data.shame.baits.friend}</div>
                <div className="text-[10px] uppercase font-bold text-slate-600">His Baits</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ANALYSIS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card title="Tilt Diagnosis" icon={Siren}>
          <div className="flex items-center gap-6">
             <div className={`p-4 rounded-full ${isTilted ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                {isTilted ? <TrendingDown size={32} className="text-rose-500" /> : <TrendingDown size={32} className="text-emerald-500 rotate-180" />}
             </div>
             <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Normal KDA</span>
                  <span className="font-bold text-white">{normalKda}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-slate-400">After Loss KDA</span>
                  <span className={`font-bold ${isTilted ? 'text-rose-400' : 'text-emerald-400'}`}>{lossKda}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {isTilted 
                    ? "Warning: Performance drops significantly after a loss. Take a break." 
                    : "Mental of Steel: You actually play better after losing."}
                </div>
             </div>
          </div>
        </Card>

        <Card title="The Int Leaderboard" icon={Skull}>
           <div className="h-32">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart layout="vertical" data={[{ name: 'Me', deaths: data.raw.me.deaths }, { name: 'Friend', deaths: data.raw.friend.deaths }]}>
                 <CartesianGrid stroke="#1e293b" horizontal={false} />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} width={50} />
                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} />
                 <Bar dataKey="deaths" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
           <p className="text-center text-xs text-slate-500 mt-2">Total Deaths in Last {data.summary.games} Games</p>
        </Card>
      </div>
    </div>
  );
}