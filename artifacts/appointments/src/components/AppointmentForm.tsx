import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateAppointment, getListAppointmentsQueryKey, getGetAppointmentStatsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CalendarClock } from "lucide-react";

const formSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(7, "Valid phone number is required"),
  appointmentTime: z.string().min(1, "Appointment time is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AppointmentForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createAppointment = useCreateAppointment();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      phoneNumber: "",
      appointmentTime: "",
      notes: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    createAppointment.mutate(
      {
        data: {
          customerName: values.customerName,
          phoneNumber: values.phoneNumber,
          appointmentTime: new Date(values.appointmentTime).toISOString(),
          notes: values.notes,
        },
      },
      {
        onSuccess: () => {
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAppointmentStatsQueryKey() });
          toast({
            title: "Appointment booked",
            description: "A confirmation message has been sent.",
          });
        },
        onError: () => {
          toast({
            title: "Failed to book appointment",
            description: "There was an error booking the appointment. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg text-primary">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">New Appointment</h2>
          <p className="text-sm text-muted-foreground">Book and send confirmation</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field} data-testid="input-customer-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 000-0000" type="tel" {...field} data-testid="input-phone-number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appointmentTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} data-testid="input-appointment-time" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any special requests or details..." className="resize-none" rows={3} {...field} data-testid="input-notes" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4 mt-auto">
            <Button 
              type="submit" 
              className="w-full h-11 text-base" 
              disabled={createAppointment.isPending}
              data-testid="button-submit-appointment"
            >
              {createAppointment.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Booking...
                </>
              ) : (
                "Book Appointment"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}