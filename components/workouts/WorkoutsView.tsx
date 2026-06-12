"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { removeWorkout, useWorkouts } from "@/lib/fitness-store";
import { Button } from "@/components/ui/Button";
import { EmptyState, SectionHeader } from "@/components/ui/PageHeader";
import { DumbbellIcon, PlusIcon } from "@/components/ui/icons";
import { WorkoutBuilder } from "./WorkoutBuilder";
import { WorkoutHistory } from "./WorkoutHistory";

export function WorkoutsView() {
  const searchParams = useSearchParams();
  const workouts = useWorkouts();
  const [building, setBuilding] = useState(
    () => searchParams.get("new") === "1",
  );

  const handleSaved = () => setBuilding(false);
  const handleDelete = (id: string) => removeWorkout(id);

  return (
    <div className="space-y-6">
      {building ? (
        <WorkoutBuilder onSaved={handleSaved} onCancel={() => setBuilding(false)} />
      ) : (
        <Button onClick={() => setBuilding(true)} size="lg" className="w-full">
          <PlusIcon className="h-5 w-5" /> אימון חדש
        </Button>
      )}

      <section>
        <SectionHeader title="היסטוריית אימונים" />
        {workouts.length === 0 ? (
          <EmptyState
            icon={<DumbbellIcon className="h-7 w-7" />}
            title="עדיין אין אימונים"
            description="התחל אימון חדש כדי לתעד סטים, משקלים וחזרות — ולראות את ההתקדמות מצטברת."
          />
        ) : (
          <WorkoutHistory workouts={workouts} onDelete={handleDelete} />
        )}
      </section>
    </div>
  );
}
