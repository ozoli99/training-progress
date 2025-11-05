// components/athletes/NewMeasurementDialog.tsx
"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Props = {
  athleteId: string;
  onCreated?: () => void;
};

export default function NewMeasurementDialog({ athleteId, onCreated }: Props) {
  const [open, setOpen] = React.useState(false);
  const [measuredAt, setMeasuredAt] = React.useState<string>(() =>
    new Date().toISOString()
  );
  const [type, setType] = React.useState("bodyweight");
  const [valueNum, setValueNum] = React.useState<string>("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const canSave = athleteId && type && measuredAt;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await api(`/api/athletes/${athleteId}/measurements`, {
        method: "POST",
        json: {
          measuredAt,
          type,
          valueNum: valueNum ? Number(valueNum) : undefined,
          notes: notes || undefined,
          source: "manual",
        },
      });
      toast("Measurement created");
      setOpen(false);
      onCreated?.();
    } catch (e: any) {
      toast(e?.message || "Failed to create measurement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Add Measurement</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Measurement</DialogTitle>
        </DialogHeader>

        {!athleteId ? (
          <p className="text-sm text-muted-foreground">
            Set an <strong>athleteId</strong> in the Dev Auth bar first.
          </p>
        ) : (
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Measured At (ISO)</Label>
              <Input
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                placeholder="2025-01-02T09:30:00.000Z"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="bodyweight"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Value (number)</Label>
              <Input
                value={valueNum}
                onChange={(e) => setValueNum(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 82.3"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!canSave || saving} onClick={save}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
