// @ts-nocheck
import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, Tooltip, Bar, Cell } from 'recharts';
import { Map as MapIcon, Brain, Clock, Skull, AlertTriangle } from 'lucide-react';

const Card = ({ children, title, icon: Icon, className="" }) => (
  <div className={`bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-2xl ${className}`}>
    <div className="flex items-center gap-3 mb-6 text-slate-400 uppercase tracking-widest text-xs font-bold">
      {Icon && <Icon size={18} className="text-cyan-500" />} {title}
    </div>
    {children}
  </div>
);

export default function FutureTab({ data }) {
  const nightmares = Object.entries(data.future.nightmares).sort((a,b) => b[1] - a[1]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEATMAP & DRAFT DOCTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* HEATMAP */}
        <Card title="Heatmap of Death" icon={MapIcon} className="lg:col-span-2 aspect-video relative overflow-hidden bg-[#050505] flex items-center justify-center p-0 border-0">
          <div className="absolute inset-0 opacity-60 bg-[url('https://ddragon.leagueoflegends.com/cdn/6.8.1/img/map/map11.png')] bg-cover bg-center grayscale contrast-125 brightness-50"></div>
          {data.future.deathsMap.map((d, i) => (
            <div 
              key={i} 
              className={`absolute w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,1)] ${d.victim === 'Me' ? 'bg-cyan-400 z-20 border border-cyan-200' : 'bg-rose-500 z-10 opacity-80'}`} 
              style={{ left: `${d.x}%`, top: `${d.y}%` }} 
              title={d.victim}
            />
          ))}
          <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-2 rounded border border-slate-800 text-[10px] text-slate-400 flex gap-3">
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-400"></div> You</span>
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Friend</span>
          </div>
        </Card>

        {/* DRAFT DOCTOR LIST */}
        <Card title="Duo Synergy (Draft Doctor)" icon={Brain} className="overflow-y-auto max-h-[400px]">
          <div className="space-y-2">
            {Object.keys(data.future.pairs).map(pair => {
              const wr = Math.round((data.future.pairs[pair].wins / data.future.pairs[pair].games) * 100);
              return (
                <div key={pair} className="flex justify-between items-center p-3 bg-slate-950/50 rounded border border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-300">{pair}</div>
                    <div className="text-[10px] text-slate-600">{data.future.pairs[pair].games} Games</div>
                  </div>
                  <div className={`text-sm font-black ${wr >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {wr}%
                  </div>
                </div>
              );
            })}
            {Object.keys(data.future.pairs).length === 0 && <div className="text-slate-500 text-xs text-center py-10">Play more games to unlock stats.</div>}
          </div>
        </Card>
      </div>

      {/* ROW 2: TIMING & NIGHTMARES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* PLAYTIME BUFF */}
         <Card title="Playtime Buff (Win Rate by Hour)" icon={Clock} className="h-64">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={data.hourlyData}>
               <CartesianGrid stroke="#1e293b" vertical={false} />
               <XAxis dataKey="hour" tick={{fill: '#64748b', fontSize: 10}} />
               <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} />
               <Bar dataKey="winRate" fill="#06b6d4">
                 {data.hourlyData.map((entry, index) => <Cell key={index} fill={entry.winRate >= 50 ? '#10b981' : '#f43f5e'} />)}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </Card>

        {/* NIGHTMARE LIST */}
        <Card title="Matchup Nightmares" icon={AlertTriangle}>
           <div className="space-y-2">
             {nightmares.length > 0 ? nightmares.map(([enemy, losses]) => (
               <div key={enemy} className="flex items-center gap-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded">
                  <Skull size={16} className="text-rose-500" />
                  <div className="text-xs font-bold text-rose-200 flex-1">{enemy}</div>
                  <div className="text-xs font-bold text-rose-500">{losses} Losses</div>
               </div>
             )) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                 <Brain size={24} className="opacity-20" />
                 <span className="text-xs">No specific enemy counters found yet.</span>
               </div>
             )}
           </div>
        </Card>

      </div>
    </div>
  );
}