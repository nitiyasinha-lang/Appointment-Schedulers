import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, isPast, formatDistanceToNow } from "date-fns";
import { useListAppointments, useSendReminder, getListAppointmentsQueryKey, getGetAppointmentStatsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, MessageSquare, Clock, Phone, AlertCircle } from "lucide-react";

export default function AppointmentList() {
  const { data: appointments, isLoading } = useListAppointments();
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-5 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-card border-dashed">
        <div className="bg-muted p-4 rounded-full mb-4">
          <CalendarEmptyIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No appointments yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          When you book appointments, they will appear here along with their confirmation status.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="pr-4 -mr-4 h-[calc(100vh-16rem)]">
      <div className="space-y-3 pb-8">
        {appointments.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
      </div>
    </ScrollArea>
  );
}

function AppointmentCard({ appointment }: { appointment: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sendReminder = useSendReminder();
  
  const appointmentDate = new Date(appointment.appointmentTime);
  const isPastAppointment = isPast(appointmentDate);
  
  const handleSendReminder = () => {
    sendReminder.mutate(
      { id: appointment.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAppointmentStatsQueryKey() });
          toast({
            title: "Reminder sent",
            description: `A reminder was sent to ${appointment.customerName}.`,
          });
        },
        onError: () => {
          toast({
            title: "Failed to send reminder",
            description: "There was an error sending the reminder. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div 
      className={`bg-card border rounded-xl p-4 transition-colors ${
        isPastAppointment ? "opacity-75 bg-muted/30" : "hover:border-primary/30 shadow-sm hover:shadow"
      }`}
      data-testid={`appointment-card-${appointment.id}`}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground text-base">
              {appointment.customerName}
            </h4>
            {isPastAppointment ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal">Past</Badge>
            ) : (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-1.5 h-5 border-0 font-normal">Upcoming</Badge>
            )}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground gap-3">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {appointment.phoneNumber}
            </span>
          </div>

          <div className="flex items-center text-sm gap-2 mt-1">
            <div className={`flex items-center gap-1.5 ${isPastAppointment ? "text-muted-foreground" : "text-foreground font-medium"}`}>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {format(appointmentDate, "MMM d, yyyy 'at' h:mm a")}
            </div>
            <span className="text-muted-foreground text-xs">
              ({formatDistanceToNow(appointmentDate, { addSuffix: true })})
            </span>
          </div>
          
          {appointment.notes && (
            <p className="text-sm text-muted-foreground mt-2 border-l-2 pl-2 italic">
              {appointment.notes}
            </p>
          )}
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3">
          <div className="flex gap-2">
            {appointment.confirmationSent ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 pr-2">
                <CheckCircle2 className="h-3 w-3" /> Confirmed
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 pr-2">
                <AlertCircle className="h-3 w-3" /> Pending
              </Badge>
            )}
            
            {appointment.reminderSent && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 pr-2">
                <CheckCircle2 className="h-3 w-3" /> Reminded
              </Badge>
            )}
          </div>

          {!isPastAppointment && (
            <Button
              variant="secondary"
              size="sm"
              className="text-xs h-8"
              onClick={handleSendReminder}
              disabled={sendReminder.isPending}
              data-testid={`button-remind-${appointment.id}`}
            >
              {sendReminder.isPending ? (
                <Spinner className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              )}
              Send Reminder
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}

function CalendarEmptyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  );
}