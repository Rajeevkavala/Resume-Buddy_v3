import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImpactVisualizationProps {
  atsScore: { before: number; after: number; suffix?: string };
  skillsMatch: { before: number; after: number; suffix?: string };
  quantifiedAchievements: { before: number; after: number; suffix?: string };
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  gray: '#6b7280',
  light: '#e5e7eb'
};

const ImpactPieChart = ({ data, title }: { data: { name: string; value: number; color: string }[]; title: string }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="group relative overflow-hidden border-primary/10 bg-gradient-to-br from-card/80 via-card/90 to-card/95 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:border-primary/30 backdrop-blur-sm">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardHeader className="relative pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors duration-300">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative px-2 sm:px-6">
          <div className="h-28 sm:h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={18}
                  outerRadius={window.innerWidth < 640 ? 38 : 50}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, index) => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={hoveredIndex === index ? entry.color : 'none'}
                      strokeWidth={hoveredIndex === index ? 2 : 0}
                      style={{
                        filter: hoveredIndex === index ? 'brightness(1.1) drop-shadow(0 0 8px rgba(0,0,0,0.3))' : 'none',
                        transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, '']}
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
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center display for hovered segment */}
            {hoveredIndex !== null && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-foreground">
                    {data[hoveredIndex]?.value}%
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {data[hoveredIndex]?.name}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="flex justify-center gap-2 sm:gap-4 mt-2 sm:mt-3 flex-wrap">
            {data.map((item, index) => (
              <motion.div 
                key={index} 
                className="flex items-center gap-1 sm:gap-1.5 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div 
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 border-2 border-transparent hover:border-white/50 flex-shrink-0"
                  style={{ 
                    backgroundColor: item.color,
                    boxShadow: hoveredIndex === index ? `0 0 10px ${item.color}50` : 'none',
                    transform: hoveredIndex === index ? 'scale(1.2)' : 'scale(1)'
                  }}
                />
                <span className={`text-xs transition-colors duration-300 truncate ${
                  hoveredIndex === index ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}>
                  {item.name}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ImprovementTrendChart = ({ atsScore, skillsMatch, quantifiedAchievements }: ImpactVisualizationProps) => {
  const data = [
    {
      phase: 'Current',
      atsScore: atsScore.before,
      skillsMatch: skillsMatch.before,
      quantifiedResults: quantifiedAchievements.before
    },
    {
      phase: 'After AI Enhancement',
      atsScore: atsScore.after,
      skillsMatch: skillsMatch.after,
      quantifiedResults: quantifiedAchievements.after
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
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
                Improvement Trajectory
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                Visual progression of all metrics over time
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="h-48 sm:h-64 relative -ml-2 sm:ml-0">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
            
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 5, left: -5, bottom: 5 }}>
                <defs>
                  <linearGradient id="atsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="skillsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={COLORS.success} stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="quantifiedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.purple} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={COLORS.purple} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis 
                  dataKey="phase" 
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
                    const displayName = name === 'atsScore' ? 'ATS Score' : 
                                       name === 'skillsMatch' ? 'Skills Match' : 
                                       'Quantified Results';
                    const suffix = name === 'quantifiedResults' ? '' : '%';
                    return [`${value}${suffix}`, displayName];
                  }}
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
                <Area
                  type="monotone"
                  dataKey="atsScore"
                  stackId="1"
                  stroke={COLORS.primary}
                  fill="url(#atsGradient)"
                  strokeWidth={3}
                  dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 8, stroke: COLORS.primary, strokeWidth: 3, fill: '#fff', filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' }}
                />
                <Area
                  type="monotone"
                  dataKey="skillsMatch"
                  stackId="2"
                  stroke={COLORS.success}
                  fill="url(#skillsGradient)"
                  strokeWidth={3}
                  dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 8, stroke: COLORS.success, strokeWidth: 3, fill: '#fff', filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.5))' }}
                />
                <Area
                  type="monotone"
                  dataKey="quantifiedResults"
                  stackId="3"
                  stroke={COLORS.purple}
                  fill="url(#quantifiedGradient)"
                  strokeWidth={3}
                  dot={{ fill: COLORS.purple, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 8, stroke: COLORS.purple, strokeWidth: 3, fill: '#fff', filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.5))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ImpactSummaryCards = ({ atsScore, skillsMatch, quantifiedAchievements }: ImpactVisualizationProps) => {
  const totalImprovement = (atsScore.after - atsScore.before) + 
                          (skillsMatch.after - skillsMatch.before) + 
                          (quantifiedAchievements.after - quantifiedAchievements.before);

  const avgImprovement = totalImprovement / 3;

  const metrics = [
    {
      title: 'Total Impact Points',
      value: Math.round(totalImprovement),
      subtitle: 'Combined improvement across all metrics',
      icon: <Zap className="h-5 w-5 text-yellow-600" />,
      color: 'from-yellow-500 to-orange-600'
    },
    {
      title: 'Average Improvement',
      value: `${Math.round(avgImprovement)}%`,
      subtitle: 'Mean enhancement per metric',
      icon: <Target className="h-5 w-5 text-blue-600" />,
      color: 'from-blue-500 to-indigo-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
        >
          <Card className="group relative overflow-hidden border-primary/10 bg-gradient-to-br from-card/80 via-card/90 to-card/95 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:border-primary/30 backdrop-blur-sm">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <motion.div 
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${metric.color} transition-all duration-300 group-hover:shadow-lg`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    style={{ backgroundColor: `${metric.color.split(' ')[1]}15` }}
                  >
                    {metric.icon}
                  </motion.div>
                  <div>
                    <div className="text-3xl font-bold text-primary group-hover:scale-105 transition-transform duration-300">
                      {metric.value}
                    </div>
                    <div className="text-sm font-medium text-foreground group-hover:text-primary/90 transition-colors duration-300">
                      {metric.title}
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                      {metric.subtitle}
                    </div>
                  </div>
                </div>
                
                {/* Add decorative element */}
                <div className="opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default function ImpactVisualization({ atsScore, skillsMatch, quantifiedAchievements }: ImpactVisualizationProps) {
  // Prepare data for pie charts with enhanced colors
  const atsData = [
    { name: 'Current', value: atsScore.before, color: '#e2e8f0' },
    { name: 'Improvement', value: atsScore.after - atsScore.before, color: '#3b82f6' }
  ];

  const skillsData = [
    { name: 'Current', value: skillsMatch.before, color: '#e2e8f0' },
    { name: 'Improvement', value: skillsMatch.after - skillsMatch.before, color: '#10b981' }
  ];

  const quantifiedData = [
    { name: 'Current', value: quantifiedAchievements.before, color: '#e2e8f0' },
    { name: 'Improvement', value: quantifiedAchievements.after - quantifiedAchievements.before, color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <ImpactSummaryCards 
        atsScore={atsScore}
        skillsMatch={skillsMatch}
        quantifiedAchievements={quantifiedAchievements}
      />

      {/* Pie Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <ImpactPieChart data={atsData} title="ATS Compatibility" />
        <ImpactPieChart data={skillsData} title="Skills Match" />
        <ImpactPieChart data={quantifiedData} title="Quantified Results" />
      </div>

      {/* Trend Chart */}
      <ImprovementTrendChart 
        atsScore={atsScore}
        skillsMatch={skillsMatch}
        quantifiedAchievements={quantifiedAchievements}
      />
    </div>
  );
}