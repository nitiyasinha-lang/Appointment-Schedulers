import { useGetAppointmentStats } from "@workspace/api-client-react";
import { Users, CalendarDays, History, Send, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsBar() {
  const { data: stats, isLoading } = useGetAppointmentStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      <StatCard 
        label="Total" 
        value={stats.total} 
        icon={<Users className="h-4 w-4 text-primary" />} 
        dataTestId="stat-total"
      />
      <StatCard 
        label="Upcoming" 
        value={stats.upcoming} 
        icon={<CalendarDays className="h-4 w-4 text-accent-foreground" />} 
        dataTestId="stat-upcoming"
      />
      <StatCard 
        label="Past" 
        value={stats.past} 
        icon={<History className="h-4 w-4 text-muted-foreground" />} 
        dataTestId="stat-past"
      />
      <StatCard 
        label="Confirmations" 
        value={stats.confirmationsSent} 
        icon={<Send className="h-4 w-4 text-emerald-600" />} 
        dataTestId="stat-confirmations"
      />
      <StatCard 
        label="Reminders" 
        value={stats.remindersSent} 
        icon={<MessageSquare className="h-4 w-4 text-blue-600" />} 
        dataTestId="stat-reminders"
      />
    </div>
  );
}

function StatCard({ label, value, icon, dataTestId }: { label: string; value: number | string; icon: React.ReactNode; dataTestId?: string }) {
  return (
    <div className="bg-card border rounded-xl p-4 flex flex-col justify-between" data-testid={dataTestId}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="bg-muted/50 p-1.5 rounded-md">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
    </div>
  );
}