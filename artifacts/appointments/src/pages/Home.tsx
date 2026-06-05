import AppointmentForm from "@/components/AppointmentForm";
import AppointmentList from "@/components/AppointmentList";
import StatsBar from "@/components/StatsBar";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground h-8 w-8 rounded-md flex items-center justify-center font-bold text-lg">
            A
          </div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Appointa</h1>
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          Front Desk Workspace
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <AppointmentForm />
          </div>

          <div className="lg:col-span-8 flex flex-col min-h-0">
            <StatsBar />
            <div className="flex items-center justify-between mb-4 mt-2">
              <h2 className="text-lg font-semibold text-foreground">Appointments</h2>
            </div>
            <AppointmentList />
          </div>

        </div>
      </main>
    </div>
  );
}