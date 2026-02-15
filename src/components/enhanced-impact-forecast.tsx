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
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import { ArrowUpRight, TrendingUp, Target, Award, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricData {
  before: number;
  after: number;
  suffix?: string;
}

interface EnhancedImpactForecastProps {
  atsScore: MetricData;
  skillsMatch: MetricData;
  quantifiedAchievements: MetricData;
}

const AnimatedCounter = ({ value, suffix = "", duration = 2000 }: { value: number; suffix?: string; duration?: number }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(value * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{displayValue}{suffix}</span>;
};

const BeforeAfterChart = ({ data, title, color, icon }: { 
  data: MetricData; 
  title: string; 
  color: string; 
  icon: React.ReactNode;
}) => {
  const chartData = [
    { name: 'Before', value: data.before, fill: '#e5e7eb' },
    { name: 'After', value: data.after, fill: color }
  ];

  const improvement = data.after - data.before;
  const improvementPercent = data.before > 0 ? Math.round((improvement / data.before) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 border-primary/10 bg-gradient-to-br from-card/80 to-card/50 overflow-hidden hover:border-primary/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:shadow-md">
                {icon}
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">{title}</CardTitle>
            </div>
            <div className="text-2xl font-bold text-primary group-hover:scale-105 transition-transform duration-300">
              <AnimatedCounter value={data.after} suffix={data.suffix} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Before/After Bar Chart */}
          <div className="h-20 sm:h-24 -ml-1 sm:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 2, left: 0, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  className="text-xs sm:text-sm"
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}${data.suffix}`, '']}
                  labelFormatter={(label) => `${label} Value`}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                  labelStyle={{
                    color: '#e2e8f0',
                    fontWeight: '600',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">Current: {data.before}{data.suffix}</span>
              <span className="font-semibold flex items-center gap-1 text-green-600 group-hover:text-green-500 transition-colors duration-300">
                <ArrowUpRight className="h-3 w-3" />
                +{improvement}{data.suffix}
              </span>
            </div>
            
            <Progress 
              value={data.suffix === '%' ? data.after : Math.min((data.after / 100) * 100, 100)} 
              className="h-2 group-hover:h-3 transition-all duration-300"
            />
            
            {improvementPercent > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="text-xs text-green-600 group-hover:text-green-500 font-medium flex items-center gap-1 transition-colors duration-300"
              >
                <TrendingUp className="h-3 w-3" />
                {improvementPercent}% improvement expected
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const RadialProgressChart = ({ data, title, color, icon }: { 
  data: MetricData; 
  title: string; 
  color: string; 
  icon: React.ReactNode;
}) => {
  const chartData = [
    {
      name: title,
      before: data.before,
      after: data.after,
      fill: color
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="group relative overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 border-primary/10 bg-gradient-to-br from-card/80 via-card/90 to-card/95 hover:border-primary/30 backdrop-blur-sm">
        {/* Animated background gradient */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, 
              ${color}08 0%, 
              ${color}12 25%, 
              ${color}15 50%, 
              ${color}12 75%, 
              ${color}08 100%)`
          }}
        />
        
        <CardHeader className="relative pb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div 
              className="p-2 sm:p-2.5 rounded-xl transition-all duration-300 group-hover:shadow-lg"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}30`
              }}
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {icon}
            </motion.div>
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">{title}</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="relative px-2 sm:px-6">
          <div className="h-28 sm:h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="90%" 
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  dataKey="before"
                  cornerRadius={10}
                  fill="#e5e7eb"
                  stroke="none"
                />
                <RadialBar
                  dataKey="after"
                  cornerRadius={10}
                  fill={color}
                  stroke="none"
                  className="drop-shadow-sm"
                />
              </RadialBarChart>
            </ResponsiveContainer>
            
            {/* Enhanced Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div 
                className="text-xl sm:text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`
                }}
              >
                <AnimatedCounter value={data.after} suffix={data.suffix} duration={1500} />
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">target</div>
            </div>
            
            {/* Glow effect on hover */}
            <div 
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`
              }}
            />
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                Before: {data.before}{data.suffix}
              </span>
              <span className="font-semibold text-green-600 group-hover:text-green-500 transition-colors duration-300 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                +{data.after - data.before}{data.suffix}
              </span>
            </div>
            
            {/* Enhanced improvement indicator */}
            <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-800/50 group-hover:from-green-100/90 group-hover:to-emerald-100/90 dark:group-hover:from-green-900/40 dark:group-hover:to-emerald-900/40 transition-all duration-300">
              <TrendingUp className="h-3 w-3 text-green-600 group-hover:text-green-500 transition-colors duration-300" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300 group-hover:text-green-600 dark:group-hover:text-green-200 transition-colors duration-300">
                {data.before > 0 ? Math.round(((data.after - data.before) / data.before) * 100) : 0}% improvement
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ComparisonChart = ({ atsScore, skillsMatch, quantifiedAchievements }: EnhancedImpactForecastProps) => {
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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <Card className="group border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:border-primary/30 backdrop-blur-sm">
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
                Comprehensive before vs after analysis
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 -ml-2 sm:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 5, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="metric" 
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={25}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const suffix = name === 'improvement' ? (data.find(d => d.metric)?.metric.includes('Results') ? '' : '%') : '%';
                    return [`${value}${suffix}`, name === 'before' ? 'Current' : name === 'after' ? 'Target' : 'Improvement'];
                  }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="before" fill="#e5e7eb" name="before" radius={[2, 2, 0, 0]} />
                <Bar dataKey="after" fill="#3b82f6" name="after" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function EnhancedImpactForecast({ atsScore, skillsMatch, quantifiedAchievements }: EnhancedImpactForecastProps) {
  return (
    <div className="space-y-6">
      {/* Individual Metric Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <BeforeAfterChart 
          data={atsScore}
          title="ATS Compatibility"
          color="#3b82f6"
          icon={<Eye className="h-5 w-5 text-blue-600" />}
        />
        <BeforeAfterChart 
          data={skillsMatch}
          title="Skills Match"
          color="#10b981"
          icon={<Target className="h-5 w-5 text-green-600" />}
        />
        <BeforeAfterChart 
          data={quantifiedAchievements}
          title="Quantified Results"
          color="#8b5cf6"
          icon={<Award className="h-5 w-5 text-purple-600" />}
        />
      </div>

      {/* Alternative: Radial Progress Charts */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <RadialProgressChart 
          data={atsScore}
          title="ATS Compatibility"
          color="#3b82f6"
          icon={<Eye className="h-4 w-4 text-blue-600" />}
        />
        <RadialProgressChart 
          data={skillsMatch}
          title="Skills Match"
          color="#10b981"
          icon={<Target className="h-4 w-4 text-green-600" />}
        />
        <RadialProgressChart 
          data={quantifiedAchievements}
          title="Quantified Results"
          color="#8b5cf6"
          icon={<Award className="h-4 w-4 text-purple-600" />}
        />
      </div>

      {/* Overall Comparison Chart */}
      <ComparisonChart 
        atsScore={atsScore}
        skillsMatch={skillsMatch}
        quantifiedAchievements={quantifiedAchievements}
      />
    </div>
  );
}