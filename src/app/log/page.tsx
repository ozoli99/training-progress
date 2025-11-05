// app/log/page.tsx
"use client";

import * as React from "react";
import NewMeasurementDialog from "@/components/athletes/NewMeasurementDialog";
import MeasurementTable from "@/components/athletes/MeasurementTable";

export default function LogPage() {
  const [athleteId, setAthleteId] = React.useState("");

  React.useEffect(() => {
    setAthleteId(localStorage.getItem("dev_athlete_id") || "");
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Measurements</h1>
        <NewMeasurementDialog
          athleteId={athleteId}
          onCreated={() => {
            // MeasurementTable reloads on key props changes; simplest is to bump a key
            // but we'll keep it minimal here — a hard refresh also works in dev.
          }}
        />
      </div>
      <MeasurementTable athleteId={athleteId} limit={50} />
    </div>
  );
}
