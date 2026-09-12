import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Send, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Award, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useApplications } from '../context/ApplicationContext';
import { useAuth } from '../context/AuthContext';
import { Job } from '../types';

interface AnalyticsPageProps {
  jobs: Job[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ jobs }) => {
  const { applications } = useApplications();
  const { profile } = useAuth();

  // Metrics
  const totalApplied = applications.length;
  const totalInterviews = applications.filter((a) => a.status === 'interview' || a.status === 'offer').length;
  const totalOffers = applications.filter((a) => a.status === 'offer').length;
  const totalAssessments = applications.filter((a) => a.status === 'assessment').length;
  const responseRate = totalApplied > 0 ? Math.round(((totalInterviews + totalAssessments) / totalApplied) * 100) : 0;
  const latestOffer = applications.find((a) => a.status === 'offer');
  const pctOfApplied = (count: number) => (totalApplied > 0 ? Math.round((count / totalApplied) * 100) : 0);

  // Skill demand aggregation from all active jobs
  const skillCountMap = new Map<string, number>();
  jobs.forEach((j) => {
    (j.skills || []).forEach((sk) => {
      skillCountMap.set(sk, (skillCountMap.get(sk) || 0) + 1);
    });
  });

  const topDemandedSkills = Array.from(skillCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const userSkillNames = (profile?.skills || []).map((s) => s.name.toLowerCase());

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-400" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Job Search Performance Analytics
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time metrics on conversion velocity, interview response rates, and market skill demands.
        </p>
      </div>

      {/* Top 4 Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold">Applications Sent</span>
            <Send className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalApplied}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total tracked applications
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold">Interviews Reached</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-300">{totalInterviews}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active interview pipelines
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold">Interview Response Rate</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-400">{responseRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Interviews + assessments ÷ applications
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold">Offers Received</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{totalOffers}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {latestOffer?.companyName || 'No offers yet'}
          </div>
        </div>
      </div>

      {/* Funnel & Weekly Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Conversion Funnel Breakdown</span>
            </h3>
            <span className="text-xs text-brand-300 font-mono">Stage by Stage</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>1. Applied ({totalApplied})</span>
                <span className="font-bold font-mono">{totalApplied > 0 ? '100%' : '0%'}</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className={`bg-brand-500 h-full rounded-full ${totalApplied > 0 ? 'w-full' : 'w-0'}`} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>2. Technical Assessment ({totalAssessments})</span>
                <span className="font-bold font-mono">
                  {pctOfApplied(totalAssessments)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all"
                  style={{ width: `${pctOfApplied(totalAssessments)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>3. Interviews Scheduled ({totalInterviews})</span>
                <span className="font-bold font-mono">
                  {pctOfApplied(totalInterviews)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${pctOfApplied(totalInterviews)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>4. Offers Secured ({totalOffers})</span>
                <span className="font-bold font-mono text-emerald-400">
                  {pctOfApplied(totalOffers)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${pctOfApplied(totalOffers)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* In-Demand Skills vs Profile Skillset */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>In-Demand Market Skills in Your Target Roles</span>
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Frequencies detected across active listings compared with your verified skillset:
          </p>

          <div className="space-y-3">
            {topDemandedSkills.map(([skill, count]) => {
              const userHasSkill = userSkillNames.some(
                (us) => us === skill.toLowerCase() || us.includes(skill.toLowerCase())
              );
              return (
                <div key={skill} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{skill}</span>
                      {userHasSkill ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                          ✓ In Profile
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                          ⚠ Recommended to Learn
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 font-mono">{count} openings</span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${userHasSkill ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                      style={{ width: `${Math.min(100, (count / jobs.length) * 100 * 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
