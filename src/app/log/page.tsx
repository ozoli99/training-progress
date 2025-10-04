import { LogForm } from "@/ui/components/forms/LogForm";
import { Card, CardContent } from "@/components/ui/card";

export default function LogPage() {
    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Add Training Log</h1>
                <p className="mt-1 text-sm text-muted-foreground">Pick an exercise, add sets, and save. The form autosaves as you type.</p>
            </div>

            <Card>
                <CardContent className="p-0 md:p-6">
                    <LogForm />
                </CardContent>
            </Card>
        </div>
    );
}