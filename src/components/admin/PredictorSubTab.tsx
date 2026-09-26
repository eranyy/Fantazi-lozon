import React from 'react';
import { Sparkles, Trophy, Target } from 'lucide-react';

interface PredictorSubTabProps {
  predictorStandings: any[];
  whatsappPolls: any[];
  selectedPredictorRound: number;
  setSelectedPredictorRound: (round: number) => void;
}

export const PredictorSubTab: React.FC<PredictorSubTabProps> = ({
  predictorStandings,
  whatsappPolls,
  selectedPredictorRound,
  setSelectedPredictorRound,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 pt-4">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tight drop-shadow-lg flex items-center justify-center gap-3">
          טבלת הנביאים <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-violet-400 fill-current drop-shadow-[0_0_15px_rgba(167,139,250,0.5)]" />
        </h2>
        <p className="text-violet-400 font-black uppercase tracking-[0.2em] md:tracking-widest text-xs md:text-sm mt-3">
          תוצאות סקרי הניחושים, חכמת ההמונים ודירוג הנביאים העונתי (סנכרון בלייב)
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-2 space-y-8">
        {/* 🏆 טבלת הנביאים העונתית */}
        <div className="bg-slate-900/80 rounded-3xl border border-violet-500/30 p-5 md:p-8 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span>טבלת נביאי הליגה העונתית</span>
            </h3>
            <span className="text-xs text-violet-400 font-bold bg-violet-950/60 px-3 py-1 rounded-full border border-violet-800/50">
              {predictorStandings.length} מנג'רים בדירוג
            </span>
          </div>

          {predictorStandings.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold bg-slate-950/50 rounded-2xl border border-slate-800">
              <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-3 opacity-60 animate-pulse" />
              <p className="text-lg text-white font-black">טבלת הנביאים מוכנה לקראת המחזורים הבאים!</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                עם סגירת סקר הניחושים בווצאפ וקבלת תוצאות המשחקים, המנג'רים שקלעו בול ידורגו כאן בטבלה עונתית מרהיבה.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {predictorStandings.map((pUser: any, idx: number) => {
                const isTop1 = idx === 0;
                const isTop2 = idx === 1;
                const isTop3 = idx === 2;
                return (
                  <div key={idx} className={`p-4 md:p-5 rounded-2xl border transition-all flex items-center justify-between ${isTop1 ? 'bg-gradient-to-r from-yellow-950/40 via-slate-900 to-slate-900 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : isTop2 ? 'bg-gradient-to-r from-zinc-800/40 via-slate-900 to-slate-900 border-zinc-400/40' : isTop3 ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-600/40' : 'bg-slate-950/60 border-slate-800/80 hover:border-violet-500/40'}`}>
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="text-xl md:text-2xl font-black w-8 text-center tabular-nums">
                        {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${idx + 1}`}
                      </span>
                      <div>
                        <span className="text-base md:text-xl font-black text-white block">{pUser.name || pUser.teamName}</span>
                        <span className="text-xs text-slate-400 font-bold">פגיעות מדויקות: <span className="text-violet-300 font-black">{pUser.hits || 0}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center bg-slate-900 px-4 py-2 rounded-xl border border-slate-700">
                        <span className="text-xl md:text-2xl font-black text-green-400 block leading-none">{pUser.points || 0}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 block">נקודות</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 📊 פירוט תוצאות סקרי הניחושים לפי מחזור */}
        <div className="bg-slate-900/80 rounded-3xl border border-purple-500/30 p-5 md:p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-violet-400" />
              <span>חכמת ההמונים ופגיעות הניחוס לפי מחזור</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">מחזור:</span>
              <select
                value={selectedPredictorRound}
                onChange={(e) => setSelectedPredictorRound(Number(e.target.value))}
                className="bg-slate-950 text-white font-black text-xs px-3 py-1.5 rounded-xl border border-violet-500/40 outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(r => (
                  <option key={r} value={r}>מחזור {r}</option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const roundPoll = whatsappPolls.find((p: any) => p.round === selectedPredictorRound);
            if (!roundPoll || !roundPoll.votes || Object.keys(roundPoll.votes).length === 0) {
              return (
                <div className="text-center py-8 text-slate-400 font-bold bg-slate-950/40 rounded-2xl border border-slate-800">
                  <Target className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-slate-300 font-bold">טרם התקבלו הצבעות סקר עבור מחזור {selectedPredictorRound}.</p>
                  <p className="text-xs text-slate-500 mt-1">הסקר שנשלח ע"י הבוט לקבוצה בווצאפ ישתקף כאן עם הפירוט המלא של הצבעות המנג'רים!</p>
                </div>
              );
            }

            const votesObj = roundPoll.votes || {};
            const totalVoters = Object.keys(votesObj).length;

            return (
              <div className="space-y-4">
                <div className="bg-purple-950/40 p-4 rounded-2xl border border-purple-800/40 flex items-center justify-between">
                  <span className="text-sm text-purple-300 font-black">סה"כ מנג'רים שהשתתפו בסקר מחזור {selectedPredictorRound}:</span>
                  <span className="text-xl font-black text-white bg-purple-900/60 px-3 py-1 rounded-xl border border-purple-500/40">{totalVoters} מנג'רים</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
