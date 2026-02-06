import { Layout } from "@/components/Layout";
import { useE1RMStats } from "@/hooks/use-stats";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { TrendingUp, Dumbbell } from "lucide-react";

export default function Progress() {
  const [family, setFamily] = useState("Squat");
  const { data: stats, isLoading } = useE1RMStats(family);

  // Transform data for charts
  const chartData = stats?.map(s => ({
    date: format(new Date(s.date), 'MMM d'),
    e1rm: Math.round(s.e1rm),
    weight: s.weight,
    rpe: s.rpe
  })).reverse(); // Assuming API returns desc

  const currentMax = chartData && chartData.length > 0 
    ? Math.max(...chartData.map(d => d.e1rm)) 
    : 0;

  return (
    <Layout
      header={
        <div className="flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Progress</h1>
          <div className="w-40">
            <Select value={family} onValueChange={setFamily}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Movement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Squat">Squat</SelectItem>
                <SelectItem value="Bench">Bench</SelectItem>
                <SelectItem value="Deadlift">Deadlift</SelectItem>
                <SelectItem value="Row">Row</SelectItem>
                <SelectItem value="Carry">Carry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="gym-card p-6 bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-bold uppercase text-xs tracking-wider">All-Time e1RM</span>
          </div>
          <div className="text-4xl font-display font-bold">{currentMax} <span className="text-lg text-muted-foreground">lbs</span></div>
        </div>
        
        <div className="gym-card p-6 col-span-1 md:col-span-2 flex flex-col justify-center">
          <h3 className="text-lg font-bold mb-1">Analyst Notes</h3>
          <p className="text-muted-foreground text-sm">
            Based on your anchor sets, your estimated 1RM for {family} is trending {
              chartData && chartData.length > 1 && chartData[chartData.length-1].e1rm > chartData[0].e1rm ? "upwards" : "stable"
            }.
          </p>
        </div>
      </div>

      <div className="gym-card p-6 h-[400px]">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-primary" /> e1RM Trend
        </h3>
        
        {isLoading ? <LoadingSpinner /> : (
          stats && stats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="e1rm" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <p className="text-muted-foreground max-w-md">
                No anchor logs yet. Log a set in a workout row marked as an anchor to start tracking e1RM.
              </p>
            </div>
          )
        )}
      </div>
    </Layout>
  );
}
