import { Dashboard } from "@/components/dashboard/Dashboard";
import { AS_OF, customers } from "@/lib/data/mock-customers";
import { addMonths, lastDayLabel, monthRange } from "@/lib/metrics/months";

const months = monthRange(addMonths(AS_OF, -11), AS_OF);

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Dashboard customers={customers} months={months} dataThroughLabel={lastDayLabel(AS_OF)} />
    </main>
  );
}
