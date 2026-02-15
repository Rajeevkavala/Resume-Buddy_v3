import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { ArrowUpRight, TrendingUp, Target, Award, Eye, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MetricData {
  before: number;
  after: number;
  suffix?: string;
}

interface ComprehensiveImpactForecastProps {
  atsScore: MetricData;
  skillsMatch: MetricData;
  quantifiedAchievements: MetricData;
}

const AnimatedNumber = ({ 
  value, 
  suffix = "", 
  duration = 2000,
  className = "" 
}: { 
  value: number; 
  suffix?: string; 
  duration?: number;
  className?: string;
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Smooth easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(value * easeOutCubic));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span className={className}>{displayValue}{suffix}</span>;
};

const MetricCard = ({ 
  data, 
  title, 
  icon, 
  color,
  index = 0 
}: { 
  data: MetricData; 
  title: string; 
  icon: React.ReactNode; 
  color: string;
  index?: number;
}) => {
  const improvement = data.after - data.before;
  const improvementPercent = data.before > 0 ? Math.round((improvement / data.before) * 100) : 0;
  // Fix: Show actual percentage value, not relative progress
  const progressValue = data.suffix === '%' ? data.after : Math.min((data.after / 100) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.15,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <Card className="group relative overflow-hidden border-primary/10 bg-gradient-to-br from-card/80 via-card/90 to-card/95 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:border-primary/30">
        {/* Enhanced animated background gradient */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, 
              ${color}05 0%, 
              ${color}10 25%, 
              ${color}15 50%, 
              ${color}10 75%, 
              ${color}05 100%)`
          }}
        />
        
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2.5 rounded-xl bg-gradient-to-br transition-all duration-300 group-hover:shadow-lg"
                style={{
                  backgroundColor: `${color}15`,
                  borderColor: `${color}30`
                }}
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {icon}
              </motion.div>
              <div>
                <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {title}
                </CardTitle>
              </div>
            </div>
            
            <motion.div 
              className="text-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.15 + 0.3 }}
            >
              <div 
                className="text-2xl sm:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`
                }}
              >
                <AnimatedNumber 
                  value={data.after} 
                  suffix={data.suffix} 
                  duration={1500 + index * 200}
                />
              </div>
              <div className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">target</div>
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-4">
          {/* Before/After Comparison */}
            <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                Current: {data.before}{data.suffix}
              </span>
              <motion.span 
                className="font-semibold flex items-center gap-1 text-green-600 group-hover:text-green-500 transition-colors duration-300"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 + 0.5 }}
              >
                <ArrowUpRight className="h-3 w-3" />
                +{improvement}{data.suffix}
              </motion.span>
            </div>            {/* Enhanced Progress Bar */}
            <div className="relative">
              <div className="w-full bg-muted/50 group-hover:bg-muted/70 rounded-full h-3 overflow-hidden backdrop-blur-sm transition-colors duration-300">
                <motion.div 
                  className="h-full rounded-full relative overflow-hidden transition-all duration-300"
                  style={{
                    background: `linear-gradient(90deg, ${color} 0%, ${color}dd 50%, ${color}bb 100%)`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressValue}%` }}
                  transition={{ 
                    duration: 1.5, 
                    delay: index * 0.15 + 0.7,
                    ease: "easeOut"
                  }}
                >
                  {/* Enhanced shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      delay: index * 0.15 + 1.5,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </div>
            </div>
            
            <AnimatePresence>
              {improvementPercent > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 + 1 }}
                  className="flex items-center justify-center gap-2 p-2 rounded-lg bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-800/50 group-hover:from-green-100/90 group-hover:to-emerald-100/90 dark:group-hover:from-green-900/40 dark:group-hover:to-emerald-900/40 transition-all duration-300"
                >
                  <Sparkles className="h-3 w-3 text-green-600 group-hover:text-green-500 transition-colors duration-300" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300 group-hover:text-green-600 dark:group-hover:text-green-200 transition-colors duration-300">
                    {improvementPercent}% improvement expected
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ComparisonChart = ({ atsScore, skillsMatch, quantifiedAchievements }: ComprehensiveImpactForecastProps) => {
  const data = [
    {
      metric: 'ATS Score',
      before: atsScore.before,
      after: atsScore.after,
      improvement: atsScore.after - atsScore.before
    },
    {
      metric: 'Skills Match',
      before: skillsMatch.before,
      after: skillsMatch.after,
      improvement: skillsMatch.after - skillsMatch.before
    },
    {
      metric: 'Quantified Results',
      before: quantifiedAchievements.before,
      after: quantifiedAchievements.after,
      improvement: quantifiedAchievements.after - quantifiedAchievements.before
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
    >
      <Card className="group border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent backdrop-blur-sm overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:border-primary/30">
        <CardHeader>
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div 
              className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300"
              whileHover={{ rotate: 5, scale: 1.1 }}
            >
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </motion.div>
            <div>
              <CardTitle className="text-base sm:text-xl font-bold group-hover:text-primary/90 transition-colors duration-300">
                Overall Impact Comparison
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                Visual comparison of before vs after metrics
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 -ml-2 sm:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis 
                  dataKey="metric" 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const suffix = name === 'improvement' && !data.find(d => d.metric.includes('Results')) ? '%' : 
                                   name !== 'improvement' && data.find(d => d.metric)?.metric.includes('Results') ? '' : '%';
                    const displayName = name === 'before' ? 'Current' : name === 'after' ? 'Target' : 'Improvement';
                    return [`${value}${suffix}`, displayName];
                  }}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)',
                    color: '#f8fafc'
                  }}
                  labelStyle={{
                    color: '#e2e8f0',
                    fontWeight: '600'
                  }}
                />
                <Bar 
                  dataKey="before" 
                  fill="#e5e7eb" 
                  name="before" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.7}
                />
                <Bar 
                  dataKey="after" 
                  fill="url(#primaryGradient)" 
                  name="after" 
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ImpactSummary = ({ atsScore, skillsMatch, quantifiedAchievements }: ComprehensiveImpactForecastProps) => {
  const totalImprovement = (atsScore.after - atsScore.before) + 
                          (skillsMatch.after - skillsMatch.before) + 
                          (quantifiedAchievements.after - quantifiedAchievements.before);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className="group text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500 cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="flex items-center justify-center gap-2 mb-3"
      >
        <Zap className="h-6 w-6 text-yellow-500 group-hover:text-yellow-400 transition-colors duration-300" />
        <span className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
          Total Impact
        </span>
      </motion.div>
      
      <div className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform duration-300">
        <AnimatedNumber value={totalImprovement} duration={2500} />
      </div>
      
      <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
        Combined improvement points across all metrics
      </p>
      
      {/* Add subtle glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
    </motion.div>
  );
};

export default function ComprehensiveImpactForecast({ 
  atsScore, 
  skillsMatch, 
  quantifiedAchievements 
}: ComprehensiveImpactForecastProps) {
  return (
    <div className="space-y-8">
      {/* Impact Summary */}
      <ImpactSummary 
        atsScore={atsScore}
        skillsMatch={skillsMatch}
        quantifiedAchievements={quantifiedAchievements}
      />

      {/* Individual Metric Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <MetricCard 
          data={atsScore}
          title="ATS Compatibility"
          icon={<Eye className="h-5 w-5 text-blue-600" />}
          color="#3b82f6"
          index={0}
        />
        <MetricCard 
          data={skillsMatch}
          title="Skills Match"
          icon={<Target className="h-5 w-5 text-green-600" />}
          color="#10b981"
          index={1}
        />
        <MetricCard 
          data={quantifiedAchievements}
          title="Quantified Results"
          icon={<Award className="h-5 w-5 text-purple-600" />}
          color="#8b5cf6"
          index={2}
        />
      </div>

      {/* Comparison Chart */}
      <ComparisonChart 
        atsScore={atsScore}
        skillsMatch={skillsMatch}
        quantifiedAchievements={quantifiedAchievements}
      />
    </div>
  );
}