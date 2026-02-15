
import type {AnalyzeResumeContentOutput} from '@/ai/flows/analyze-resume-content';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from './ui/button';
import {RefreshCw, CheckCircle, XCircle, AlertTriangle, Info, Building2, BarChart3, FileText, Layout, Eye, MessageSquare, Zap, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-animations';

import { Separator } from './ui/separator';
import { PieChart, Pie, Label } from 'recharts';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from './ui/chart';
import { useMemo } from 'react';


interface AnalysisTabProps {
  analysis: AnalyzeResumeContentOutput | null;
  onGenerate: () => void;
  isLoading: boolean;
  hasDataChanged?: boolean;
}

const getCriticalityIcon = (criticality: "Critical" | "High" | "Medium" | "Low") => {
  switch (criticality) {
    case "Critical":
      return <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />;
    case "High":
      return <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />;
    case "Medium":
      return <Info className="h-4 w-4 text-yellow-500 mr-2" />;
    case "Low":
      return <Info className="h-4 w-4 text-blue-500 mr-2" />;
    default:
      return null;
  }
};

export default function AnalysisTab({
  analysis,
  onGenerate,
  isLoading,
  hasDataChanged,
}: AnalysisTabProps) {

  const getButtonContent = () => {
    if (isLoading) {
      return <><LoadingSpinner size="sm" /> Analyzing...</>;
    }
    if (analysis && hasDataChanged) {
      return <><RefreshCw className="mr-2 h-4 w-4" /> Regenerate Analysis</>;
    }
    return 'Generate Analysis';
  }

  const missingSkillsByCriticality = useMemo(() => {
    if (!analysis?.keywordAnalysis?.missingKeywords) {
      return [];
    }
    const counts = analysis.keywordAnalysis.missingKeywords.reduce((acc, skill) => {
      acc[skill.criticality] = (acc[skill.criticality] || 0) + 1;
      return acc;
    }, {} as Record<"Critical" | "High" | "Medium" | "Low", number>);

    return [
      { name: 'Critical', value: counts.Critical || 0, fill: 'hsl(var(--destructive))' },
      { name: 'High', value: counts.High || 0, fill: 'hsl(var(--chart-2))' },
      { name: 'Medium', value: counts.Medium || 0, fill: 'hsl(var(--chart-4))' },
      { name: 'Low', value: counts.Low || 0, fill: 'hsl(var(--chart-5))' },
    ].filter(item => item.value > 0);

  }, [analysis?.keywordAnalysis?.missingKeywords]);
  
  const criticalityChartConfig = {
    value: {
      label: 'Skills',
    },
    Critical: {
      label: 'Critical',
      color: 'hsl(var(--destructive))',
    },
    High: {
      label: 'High',
      color: 'hsl(var(--chart-2))',
    },
    Medium: {
      label: 'Medium',
      color: 'hsl(var(--chart-4))',
    },
    Low: {
      label: 'Low',
      color: 'hsl(var(--chart-5))',
    },
  };
  

  if (!analysis || hasDataChanged) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-primary/20 rounded-xl min-h-[500px] bg-gradient-to-br from-primary/5 to-transparent">
        <div className="mb-6 p-4 rounded-full bg-primary/10">
          <RefreshCw className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-3">
          {analysis && hasDataChanged ? 'Content Updated' : 'Ready to Analyze'}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {analysis && hasDataChanged 
            ? 'Your resume or job description has been updated. Generate a fresh analysis to see the latest insights.' 
            : 'Generate an comprehensive AI-powered analysis of your resume against the job description to identify strengths, gaps, and optimization opportunities.'}
        </p>
        <Button onClick={onGenerate} disabled={isLoading} size="lg" className="px-8">
          {getButtonContent()}
        </Button>
      </div>
    );
  }

  const atsScore = analysis.atsScore || 0;
  const atsChartData = [
    { name: 'Score', value: atsScore, fill: 'hsl(var(--primary))' },
    { name: 'Remaining', value: 100 - atsScore, fill: 'hsl(var(--muted))' },
  ];
  const atsChartConfig = {
      Score: {
        label: "ATS Score",
        color: "hsl(var(--primary))",
      },
  };

  const presentKeywordsCount = analysis.keywordAnalysis?.presentKeywords?.length || 0;
  const missingKeywordsCount = analysis.keywordAnalysis?.missingKeywords?.length || 0;
  const totalKeywords = presentKeywordsCount + missingKeywordsCount;
  const skillsMatchPercentage = totalKeywords > 0 ? Math.round((presentKeywordsCount / totalKeywords) * 100) : 0;

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <Button onClick={onGenerate} disabled={isLoading} variant="outline" size="sm" className="shrink-0">
                {isLoading ? (
                    <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>Regenerating...</>
                ) : (
                    <><RefreshCw className="mr-2 h-4 w-4" /> Regenerate</>
                )}
            </Button>
        </div>
      
      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg group">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                <div className="mb-3 p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium mb-4 text-muted-foreground">ATS Compatibility</CardTitle>
                <div className="h-[100px] w-[100px] flex items-center justify-center mb-2">
                    <ChartContainer config={atsChartConfig} className="w-full h-full">
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                data={atsChartData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={30}
                                outerRadius={45}
                                strokeWidth={3}
                            >
                                <Label
                                    content={({ viewBox }) => {
                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            >
                                            <tspan
                                                x={viewBox.cx}
                                                y={(viewBox.cy || 0) - 4}
                                                className="fill-foreground text-lg font-bold"
                                            >
                                                {atsScore.toFixed(0)}
                                            </tspan>
                                            <tspan
                                                x={viewBox.cx}
                                                y={(viewBox.cy || 0) + 12}
                                                className="fill-muted-foreground text-xs"
                                            >
                                                /100
                                            </tspan>
                                            </text>
                                        );
                                        }
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </div>
                <p className="text-xs text-muted-foreground">
                  {atsScore >= 80 ? 'Excellent' : atsScore >= 60 ? 'Good' : atsScore >= 40 ? 'Fair' : 'Needs Work'}
                </p>
            </CardContent>
        </Card>
        <Card className="border-blue-200/50 hover:border-blue-300/70 transition-all duration-300 hover:shadow-lg group">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="mb-3 p-2 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-sm font-medium mb-4 text-muted-foreground">Skills Match</CardTitle>
            <div className="mb-2">
              <span className="text-3xl font-bold text-blue-600">{presentKeywordsCount}</span>
              <span className="text-lg text-muted-foreground">/{totalKeywords}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mb-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${skillsMatchPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{skillsMatchPercentage}% match rate</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200/50 hover:border-green-300/70 transition-all duration-300 hover:shadow-lg group">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="mb-3 p-2 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <AlertTriangle className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle className="text-sm font-medium mb-4 text-muted-foreground">Content Coverage</CardTitle>
            <div className="text-3xl font-bold text-green-600 mb-2">{analysis.contentCoveragePercentage || 0}%</div>
            <div className="w-full bg-muted rounded-full h-2 mb-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${analysis.contentCoveragePercentage || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Job requirements coverage</p>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200/50 hover:border-orange-300/70 transition-all duration-300 hover:shadow-lg group">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="mb-3 p-2 rounded-full bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
              <Info className="h-5 w-5 text-orange-600" />
            </div>
            <CardTitle className="text-sm font-medium mb-4 text-muted-foreground">Resume Length</CardTitle>
            <div className="text-3xl font-bold text-orange-600 mb-2">{analysis.qualityMetrics?.wordCount || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {analysis.qualityMetrics?.wordCount ? 
                (analysis.qualityMetrics.wordCount >= 300 && analysis.qualityMetrics.wordCount <= 800 ? 
                  'Optimal length ✓' : 
                  analysis.qualityMetrics.wordCount < 300 ? 
                    'Consider expanding' : 
                    'Consider condensing'
                ) : 
                'Unable to analyze'
              }
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Executive Summary</CardTitle>
              <CardDescription>AI-powered analysis of your resume's strengths and opportunities</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90 bg-white/50 dark:bg-black/20 p-4 rounded-lg border">
            {analysis.summary}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
            <Card className="h-full border-green-200/30">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Skills Analysis</CardTitle>
                        <CardDescription>Detailed breakdown of skill alignment with job requirements</CardDescription>
                      </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                   <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-green-700 dark:text-green-400 flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4" /> 
                            Matched Skills
                          </h4>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {presentKeywordsCount} found
                          </Badge>
                        </div>
                        {analysis.keywordAnalysis?.presentKeywords && analysis.keywordAnalysis.presentKeywords.length > 0 ? (
                            <div className="flex flex-wrap gap-2 p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-200/30">
                                {analysis.keywordAnalysis.presentKeywords.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 transition-colors">
                                    {skill}
                                </Badge>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed">
                              <p className="text-sm text-muted-foreground text-center">No matching keywords found.</p>
                            </div>
                        )}
                    </div>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center">
                                <XCircle className="mr-2 h-5 w-5 text-red-500" /> 
                                Missing Skills
                            </h4>
                            <Badge variant="destructive" className="text-xs">
                                {missingKeywordsCount} gaps
                            </Badge>
                        </div>
                        {analysis.keywordAnalysis?.missingKeywords && analysis.keywordAnalysis.missingKeywords.length > 0 ? (
                           <>
                            <div className="space-y-4">
                                {/* Critical Skills */}
                                {analysis.keywordAnalysis.missingKeywords.filter(skill => skill.criticality === 'Critical').length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                            <span className="text-sm font-medium text-red-700 dark:text-red-400">Critical</span>
                                            <Badge variant="destructive" size="sm" className="text-xs">
                                                {analysis.keywordAnalysis.missingKeywords.filter(skill => skill.criticality === 'Critical').length}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pl-6">
                                            {analysis.keywordAnalysis.missingKeywords
                                                .filter(skill => skill.criticality === 'Critical')
                                                .map((skill, index) => (
                                                <Badge key={index} variant="destructive" className="text-xs">
                                                    {skill.skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* High Priority Skills */}
                                {analysis.keywordAnalysis.missingKeywords.filter(skill => skill.criticality === 'High').length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                                            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">High Priority</span>
                                            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs">
                                                {analysis.keywordAnalysis.missingKeywords.filter(skill => skill.criticality === 'High').length}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pl-6">
                                            {analysis.keywordAnalysis.missingKeywords
                                                .filter(skill => skill.criticality === 'High')
                                                .map((skill, index) => (
                                                <Badge key={index} className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs">
                                                    {skill.skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Medium Priority Skills */}
                                {analysis.keywordAnalysis.missingKeywords.filter(skill => skill.criticality === 'Medium').length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Info className="h-4 w-4 text-yellow-500" />
                                            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Medium Priority</span>
                                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                                                {analysis.keywordAnalysis.missingKeywords.filter(skill => skill.criticality === 'Medium').length}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pl-6">
                                            {analysis.keywordAnalysis.missingKeywords
                                                .filter(skill => skill.criticality === 'Medium')
                                                .map((skill, index) => (
                                                <Badge key={index} className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                                                    {skill.skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Low Priority Skills */}
                                {analysis.keywordAnalysis.missingKeywords.filter(skill => skill.criticality === 'Low').length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Info className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Low Priority</span>
                                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                                                {analysis.keywordAnalysis.missingKeywords.filter(skill => skill.criticality === 'Low').length}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pl-6">
                                            {analysis.keywordAnalysis.missingKeywords
                                                .filter(skill => skill.criticality === 'Low')
                                                .map((skill, index) => (
                                                <Badge key={index} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                                                    {skill.skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Fallback: Show uncategorized skills */}
                            {analysis.keywordAnalysis.missingKeywords.some(skill => 
                                !['Critical', 'High', 'Medium', 'Low'].includes(skill.criticality)
                            ) && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Other</span>
                                        <Badge variant="outline" size="sm" className="text-xs">
                                            {analysis.keywordAnalysis.missingKeywords.filter(skill => 
                                                !['Critical', 'High', 'Medium', 'Low'].includes(skill.criticality)
                                            ).length}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pl-6">
                                        {analysis.keywordAnalysis.missingKeywords
                                            .filter(skill => !['Critical', 'High', 'Medium', 'Low'].includes(skill.criticality))
                                            .map((skill, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {skill.skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                           </>
                        ) : (
                            <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed">
                                <p className="text-sm text-muted-foreground text-center">No missing keywords found. Great job!</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
         <div className="lg:col-span-2">
            <Card className="h-full">
                 <CardHeader>
                    <CardTitle>Missing Skills Criticality</CardTitle>
                    <CardDescription>A breakdown of missing skills by their importance for the role.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center p-4 sm:p-6">
                    {missingKeywordsCount > 0 ? (
                        <div className="w-full max-w-[500px] mx-auto">
                            <ChartContainer
                                config={criticalityChartConfig}
                                className="mx-auto aspect-square h-[350px] sm:h-[400px] w-full"
                            >
                                <PieChart margin={{ top: 20, right: 40, bottom: 50, left: 40 }}>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={missingSkillsByCriticality}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    strokeWidth={2}
                                    labelLine={false}
                                    label={({
                                        cx,
                                        cy,
                                        midAngle,
                                        innerRadius,
                                        outerRadius,
                                        value,
                                        index,
                                    }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = outerRadius + 35; // Even more space for labels
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                        return (
                                            <text
                                                x={x}
                                                y={y}
                                                className="fill-foreground text-xs sm:text-sm font-medium"
                                                textAnchor={x > cx ? "start" : "end"}
                                                dominantBaseline="central"
                                            >
                                                {missingSkillsByCriticality[index].name} ({value})
                                            </text>
                                        );
                                    }}
                                >
                                     <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) - 8}
                                                            className="fill-foreground text-3xl font-bold"
                                                        >
                                                            {missingKeywordsCount}
                                                        </tspan>
                                                         <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 16}
                                                            className="fill-muted-foreground text-sm"
                                                        >
                                                            Missing Skills
                                                        </tspan>
                                                    </text>
                                                );
                                            }
                                        }}
                                    />
                                </Pie>
                                <ChartLegend 
                                    content={<ChartLegendContent nameKey="name" />}
                                    wrapperStyle={{ paddingTop: '20px' }}
                                />
                            </PieChart>
                        </ChartContainer>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                            <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                            <p className="text-sm font-medium">No Skill Gaps Found</p>
                            <p className="text-xs text-muted-foreground">Great job! All skills match.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      
      {analysis.industryCompatibility && analysis.industryCompatibility.length > 0 && (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <CardTitle className="font-headline text-xl">Industry Compatibility</CardTitle>
                    </div>
                    <CardDescription>How your resume aligns with different industries.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4">
                        {analysis.industryCompatibility.map((item, index) => {
                            const score = typeof item.score === 'number' ? item.score : Number(item.score);
                            const getScoreColor = (score: number) => {
                                if (score >= 85) return 'text-green-600';
                                if (score >= 70) return 'text-blue-600';
                                if (score >= 60) return 'text-yellow-600';
                                return 'text-red-600';
                            };
                            
                            const getStatusColor = (status: string, score: number) => {
                                if (score >= 85) return 'bg-green-100 text-green-700 border-green-200';
                                if (score >= 70) return 'bg-blue-100 text-blue-700 border-blue-200';
                                if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                                return 'bg-red-100 text-red-700 border-red-200';
                            };

                            const getProgressColor = (score: number) => {
                                if (score >= 85) return 'bg-green-500';
                                if (score >= 70) return 'bg-blue-500';
                                if (score >= 60) return 'bg-yellow-500';
                                return 'bg-red-500';
                            };

                            return (
                                <div key={item.industry} className="group p-5 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-base mb-1">{item.industry}</h4>
                                            <Badge 
                                                variant="outline" 
                                                className={`${getStatusColor(item.status, score)} text-xs font-medium`}
                                            >
                                                {item.status}
                                            </Badge>
                                        </div>
                                        <div className="text-right ml-4">
                                            <div className={`text-3xl font-bold ${getScoreColor(score)} mb-1`}>
                                                {item.score}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium">
                                                out of 100
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Compatibility Score</span>
                                            <span className="font-medium">{score}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 delay-${index * 150} rounded-full ${getProgressColor(score)}`}
                                                style={{ 
                                                    width: `${score}%`,
                                                    animation: `slideIn 1s ease-out ${index * 0.15}s both`
                                                }}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Industry insight indicator */}
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <TrendingUp className="h-3 w-3" />
                                                <span>Market Alignment</span>
                                            </div>
                                            <span className={`font-medium ${getScoreColor(score)}`}>
                                                {score >= 85 ? 'Excellent Match' : 
                                                 score >= 70 ? 'Strong Match' : 
                                                 score >= 60 ? 'Good Match' : 'Needs Improvement'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Summary section */}
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Info className="h-4 w-4 text-primary mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">Industry Analysis Summary</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Your resume shows strong compatibility with 
                                    <strong> {analysis.industryCompatibility.filter(item => (typeof item.score === 'number' ? item.score : Number(item.score)) >= 85).length} industries</strong> 
                                    {analysis.industryCompatibility.filter(item => (typeof item.score === 'number' ? item.score : Number(item.score)) >= 85).length > 0 && (
                                        <span> at an excellent level</span>
                                    )}
                                    {analysis.industryCompatibility.filter(item => {
                                        const s = typeof item.score === 'number' ? item.score : Number(item.score);
                                        return s >= 70 && s < 85;
                                    }).length > 0 && (
                                        <span> and <strong>{analysis.industryCompatibility.filter(item => {
                                            const s = typeof item.score === 'number' ? item.score : Number(item.score);
                                            return s >= 70 && s < 85;
                                        }).length}</strong> at a strong level</span>
                                    )}
                                    . Focus on enhancing skills for lower-scoring industries to expand your opportunities.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
      )}

      {analysis.qualityMetrics && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Quality Factors</CardTitle>
                            <CardDescription className="text-sm">Assessment of your resume's content and structure.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <label className="text-sm font-medium">Length Score</label>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-blue-600">{analysis.qualityMetrics.lengthScore}</span>
                                    <span className="text-sm text-muted-foreground">/100</span>
                                </div>
                            </div>
                            <Progress value={analysis.qualityMetrics.lengthScore} className="h-2" />
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Layout className="h-4 w-4 text-green-500" />
                                    <label className="text-sm font-medium">Structure</label>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-green-600">{analysis.qualityMetrics.structureScore}</span>
                                    <span className="text-sm text-muted-foreground">/100</span>
                                </div>
                            </div>
                            <Progress value={analysis.qualityMetrics.structureScore} className="h-2" />
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-purple-500" />
                                    <label className="text-sm font-medium">Readability</label>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-purple-600">{analysis.qualityMetrics.readabilityScore}</span>
                                    <span className="text-sm text-muted-foreground">/100</span>
                                </div>
                            </div>
                            <Progress value={analysis.qualityMetrics.readabilityScore} className="h-2" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Detailed Feedback</CardTitle>
                            <CardDescription className="text-sm">Specific suggestions to improve your resume's content.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-orange-500" />
                            <h4 className="font-semibold text-sm">Action Verb Feedback</h4>
                        </div>
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{analysis.actionVerbFeedback}</p>
                        </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <h4 className="font-semibold text-sm">Quantifiable Results Feedback</h4>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{analysis.quantifiableResultsFeedback}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
