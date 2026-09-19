import { Trophy } from 'lucide-react';
import React from 'react';
import { ScrollText, ShieldAlert, Target, Info, LayoutTemplate, UserCheck } from 'lucide-react';

const RulesTab: React.FC<any> = () => {
  return (
    <div className="p-4 md:p-10 bg-zinc-900/60 backdrop-blur-xl rounded-[32px] md:rounded-[40px] border border-white/5 animate-in fade-in slide-in-from-bottom-4 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col items-center mb-8 border-b border-zinc-800 pb-6 relative z-10 text-center">
            <ScrollText className="w-12 h-12 text-blue-500 mb-3" />
            <h3 className="text-3xl md:text-4xl font-black text-white italic tracking-tight">תקנון וחוקים</h3>
            <p className="text-zinc-400 font-bold uppercase tracking-widest mt-2 text-xs md:text-sm">החוקה הרשמית של פנטזי LUZON 14</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 relative z-10">
            <div className="space-y-6">
              <section className="bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden shadow-lg">
                <div className="bg-zinc-900 px-5 py-4 border-b border-zinc-800 flex items-center gap-3"><Trophy className="w-5 h-5 text-yellow-500" /><h4 className="text-lg font-black text-white">ניקוד במחזור (בטבלה)</h4></div>
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border-r-4 border-green-500"><span className="text-3xl">🔥</span><div><div className="text-white font-black text-base">ניצחון מוחץ <span className="text-green-400 ml-1">(3 נק')</span></div><div className="text-xs text-zinc-400 font-bold mt-0.5">ניצחון ב-20 נקודות הפרש ומעלה.</div></div></div>
                  <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border-r-4 border-blue-500"><span className="text-3xl">⚽</span><div><div className="text-white font-black text-base">ניצחון רגיל <span className="text-blue-400 ml-1">(2 נק')</span></div><div className="text-xs text-zinc-400 font-bold mt-0.5">ניצחון עד 19 נקודות הפרש (כולל).</div></div></div>
                  <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border-r-4 border-yellow-500"><span className="text-3xl">🤝</span><div><div className="text-white font-black text-base">תיקו <span className="text-yellow-500 ml-1">(1 נק' לכל קבוצה)</span></div><div className="text-xs text-zinc-400 font-bold mt-0.5">שוויון מוחלט בנקודות הפנטזי.</div></div></div>
                </div>
              </section>
              <section className="bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden shadow-lg p-5">
                 <div className="flex items-center gap-3 mb-4"><LayoutTemplate className="w-5 h-5 text-indigo-400" /><h4 className="text-lg font-black text-white">מערכים מותרים (שיטות משחק)</h4></div>
                 <div className="flex flex-wrap gap-2 mb-6">{['5-3-2', '5-4-1', '4-5-1', '4-4-2', '4-3-3', '3-5-2', '3-4-3'].map((f: string) => (<span key={f} className="bg-zinc-900 text-indigo-300 font-black px-3 py-1.5 rounded-xl border border-indigo-500/20 shadow-inner text-sm">{f}</span>))}</div>
                 <div className="border-t border-zinc-800 pt-5"><h4 className="text-sm font-black text-white mb-2 flex items-center gap-2"><span>⚖️</span> שובר שוויון בטבלה</h4><p className="text-xs text-zinc-400 leading-relaxed font-bold">במקרה של שוויון בנקודות, המיקום ייקבע על פי <span className="text-white font-black bg-zinc-800 px-1.5 py-0.5 rounded mx-0.5">הפרש השערים</span> (סך נקודות זכות פחות סך נקודות חובה העונה).</p></div>
              </section>
            </div>
            <div className="space-y-4">
              <h4 className="text-xl font-black text-white mb-2 flex items-center gap-2 pl-2"><UserCheck className="w-5 h-5 text-green-400"/> ניקוד שחקנים במחזור</h4>
              <div className="bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden shadow-lg">
                <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800 text-zinc-300 font-black text-sm flex items-center justify-between"><span>ניקוד כללי (לכל השחקנים)</span></div>
                <div className="divide-y divide-zinc-800/50 px-5">
                  {[{ label: 'פתח בהרכב', points: '+1', color: 'text-green-400' }, { label: 'שיחק 60 דקות ומעלה', points: '+1', color: 'text-green-400' }, { label: 'שותף לניצחון (אפילו דקה)', points: '+2', color: 'text-green-400' }, { label: 'יצר / סחט פנדל', points: '+2', color: 'text-green-400' }, { label: 'בישול שער עצמי', points: '+2', color: 'text-green-400' }, { label: 'בסגל (ב-16) ולא שותף', points: '0', color: 'text-zinc-500' }, { label: 'לא בסגל (מחוץ ל-16)', points: '-1', color: 'text-red-400' }, { label: 'כרטיס צהוב', points: '-2', color: 'text-red-400' }, { label: 'צהוב שני (אדום)', points: '-2', color: 'text-red-400' }, { label: 'החטיא פנדל', points: '-3', color: 'text-red-400' }, { label: 'שער עצמי', points: '-3', color: 'text-red-400' }, { label: 'כרטיס אדום ישיר', points: '-5', color: 'text-red-400' }].map((rule, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2.5"><span className="text-zinc-400 text-sm font-bold">{rule.label}</span><span className={`font-black text-base tabular-nums ${rule.color}`}>{rule.points}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden shadow-lg">
                <div className="bg-blue-900/10 px-5 py-3 border-b border-blue-900/30 text-blue-400 font-black text-sm flex items-center justify-between"><span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> שוערים ושחקני הגנה</span></div>
                <div className="divide-y divide-zinc-800/50 px-5">
                  {[{ label: 'שוער כובש', points: '+10', color: 'text-green-400' }, { label: 'שחקן הגנה כובש', points: '+8', color: 'text-green-400' }, { label: 'שוער מבשל', points: '+6', color: 'text-green-400' }, { label: 'שוער (מעל 60 דק\') ולא ספג', points: '+5', color: 'text-green-400' }, { label: 'שחקן הגנה מבשל', points: '+4', color: 'text-green-400' }, { label: 'הגנה (מעל 60 דק\') ולא ספג', points: '+4', color: 'text-green-400' }, { label: 'שוער שעצר פנדל (החטיאו מולו)', points: '+3', color: 'text-green-400' }, { label: 'הגנה/שוער לא ספגו (מתחת ל-60 דק\')', points: '0', color: 'text-zinc-500' }, { label: 'ספיגת שער (בעת שהייה במגרש)', points: '-1 על כל שער', color: 'text-red-400' }, { label: 'שוער לא משחק (ב-16 או לא)', points: '-1', color: 'text-red-400' }].map((rule, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2.5"><span className="text-zinc-400 text-sm font-bold">{rule.label}</span><span className={`font-black text-base tabular-nums ${rule.color}`}>{rule.points}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden shadow-lg">
                <div className="bg-emerald-900/10 px-5 py-3 border-b border-emerald-900/30 text-emerald-400 font-black text-sm flex items-center justify-between"><span className="flex items-center gap-2">⚽ קשרים וחלוצים</span></div>
                <div className="divide-y divide-zinc-800/50 px-5">
                  {[{ label: 'קשר / חלוץ כובש', points: '+5', color: 'text-green-400' }, { label: 'קשר / חלוץ מבשל', points: '+3', color: 'text-green-400' }].map((rule, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2.5"><span className="text-zinc-400 text-sm font-bold">{rule.label}</span><span className={`font-black text-base tabular-nums ${rule.color}`}>{rule.points}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
  );
};

export default RulesTab;
