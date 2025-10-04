import { LogForm } from "@/ui/components/forms/LogForm";

export default function LogPage() {
    return (
        <div className="grid gap-6">
            <h2 className="text-xl font-semibold">Add Training Log</h2>
            <LogForm />
        </div>
    );
}