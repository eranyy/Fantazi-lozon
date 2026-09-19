import React from 'react';
import { Flame } from 'lucide-react';

const RecordsTab: React.FC<any> = ({ spicyRecords }: any) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 pt-4">
          <div className="text-center mb-12"><h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tight drop-shadow-lg flex items-center justify-center gap-3">ספרי ההיסטוריה <Flame className="w-10 h-10 text-red-500 fill-current" /></h2><p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mt-3">שיאים, תבוסות, והיריבויות המדממות של הליגה</p></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-900/80 backdrop-blur-xl rounded-[40px] border border-green-500/20 p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute -top-10 -right-10 text-9xl opacity-5 group-hover:opacity-10 transition-opacity rotate-12">🥊</div>
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-4xl mb-6 border border-green-500/20 mx-auto shadow-inner">🥊</div>
              <h4 className="text-center font-black text-xl text-green-400 mb-2 uppercase tracking-widest">מלכי התבוסות</h4>
              <p className="text-center text-[11px] text-zinc-400 mb-8 font-bold">הקבוצות שניצחו ב-20 הפרש ומעלה</p>
              <div className="space-y-3">
                {spicyRecords.blowoutWins.length === 0 ? (<div className="text-center text-zinc-500 text-sm py-4">אין נתונים עדיין</div>) : (spicyRecords.blowoutWins.map((record: any, i: number) => (
                    <div key={i} className={`flex justify-between items-center bg-zinc-950/80 p-4 rounded-2xl border transition-colors ${i===0 ? 'border-green-500/50 shadow-lg' : 'border-white/5 hover:border-white/10'}`}>
                      <div className="flex items-center gap-3"><span className={`font-black text-sm w-5 text-center ${i===0 ? 'text-green-500' : 'text-zinc-600'}`}>#{i+1}</span><span className="font-black text-white text-lg">{record.team}</span></div>
                      <div className="flex items-baseline gap-1"><span className="text-green-400 font-black text-2xl leading-none">{record.count}</span><span className="text-[9px] text-zinc-500 font-bold">פעמים</span></div>
                    </div>
                )))}
              </div>
            </div>

            <div className="bg-zinc-900/80 backdrop-blur-xl rounded-[40px] border border-red-500/20 p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 lg:translate-y-4">
              <div className="absolute -top-10 -right-10 text-9xl opacity-5 group-hover:opacity-10 transition-opacity -rotate-12">🤕</div>
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-4xl mb-6 border border-red-500/20 mx-auto shadow-inner">🤕</div>
              <h4 className="text-center font-black text-xl text-red-400 mb-2 uppercase tracking-widest">שקי החבטות</h4>
              <p className="text-center text-[11px] text-zinc-400 mb-8 font-bold">הקבוצות שהפסידו ב-20 הפרש ומעלה</p>
              <div className="space-y-3">
                {spicyRecords.blowoutLosses.length === 0 ? (<div className="text-center text-zinc-500 text-sm py-4">אין נתונים עדיין</div>) : (spicyRecords.blowoutLosses.map((record: any, i: number) => (
                    <div key={i} className={`flex justify-between items-center bg-zinc-950/80 p-4 rounded-2xl border transition-colors ${i===0 ? 'border-red-500/50 shadow-lg' : 'border-white/5 hover:border-white/10'}`}>
                      <div className="flex items-center gap-3"><span className={`font-black text-sm w-5 text-center ${i===0 ? 'text-red-500' : 'text-zinc-600'}`}>#{i+1}</span><span className="font-black text-white text-lg">{record.team}</span></div>
                      <div className="flex items-baseline gap-1"><span className="text-red-400 font-black text-2xl leading-none">{record.count}</span><span className="text-[9px] text-zinc-500 font-bold">פעמים</span></div>
                    </div>
                )))}
              </div>
            </div>

            <div className="bg-zinc-900/80 backdrop-blur-xl rounded-[40px] border border-blue-500/20 p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 lg:translate-y-8">
              <div className="absolute -top-10 -right-10 text-9xl opacity-5 group-hover:opacity-10 transition-opacity">🐺</div>
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-4xl mb-6 border border-blue-500/20 mx-auto shadow-inner">🐺</div>
              <h4 className="text-center font-black text-xl text-blue-400 mb-2 uppercase tracking-widest">הכבשה השחורה</h4>
              <p className="text-center text-[11px] text-zinc-400 mb-8 font-bold">השפלות ב-20 הפרש בקרבות ראש בראש</p>
              <div className="space-y-4">
                {spicyRecords.biggestVictims.length === 0 ? (<div className="text-center text-zinc-500 text-sm py-4">אין נתונים עדיין</div>) : (spicyRecords.biggestVictims.map((record: any, i: number) => (
                    <div key={i} className={`flex flex-col bg-zinc-950/80 p-5 rounded-3xl border transition-colors ${i===0 ? 'border-blue-500/50 shadow-lg' : 'border-white/5 hover:border-white/10'}`}>
                      <div className="flex justify-between items-center mb-3"><span className="font-black text-white text-xl">{record.predator}</span><span className="text-blue-400 font-black text-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-xl shadow-inner tracking-widest">X{record.count}</span></div>
                      <div className="text-zinc-500 text-xs font-bold bg-zinc-900 px-3 py-2 rounded-xl inline-block self-start">שחטו את <span className="text-zinc-300 font-black">{record.prey}</span></div>
                    </div>
                )))}
              </div>
            </div>
          </div>
        </div>
  );
};

export default RecordsTab;
