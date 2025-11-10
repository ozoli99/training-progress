import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dumbbell, ExternalLink, Pencil } from "lucide-react";

type PageProps = {
  params: { orgId: string; exerciseId: string };
};

async function loadExerciseView(orgId: string, exerciseId: string) {
  const ex = await db
    .select({
      id: S.exercise.id,
      orgId: S.exercise.orgId,
      name: S.exercise.name,
      category: S.exercise.category,
      modality: S.exercise.modality,
      createdAt: S.exercise.createdAt,
      updatedAt: S.exercise.updatedAt,
      globalExerciseId: S.exercise.globalExerciseId,
      globalName: S.globalExercise.name,
      globalCategory: S.globalExercise.category,
      globalModality: S.globalExercise.modality,
      globalDescription: S.globalExercise.description,
    })
    .from(S.exercise)
    .leftJoin(
      S.globalExercise,
      eq(S.globalExercise.id, S.exercise.globalExerciseId)
    )
    .where(and(eq(S.exercise.id, exerciseId), eq(S.exercise.orgId, orgId)))
    .limit(1);

  if (ex.length === 0) return null;

  const groups = await db
    .select({
      id: S.movementGroup.id,
      name: S.movementGroup.name,
    })
    .from(S.exerciseMovementGroup)
    .innerJoin(
      S.movementGroup,
      eq(S.movementGroup.id, S.exerciseMovementGroup.movementGroupId)
    )
    .where(eq(S.exerciseMovementGroup.exerciseId, exerciseId));

  let media: {
    id: string;
    mediaType: string;
    url: string;
    title: string | null;
  }[] = [];
  if (ex[0].globalExerciseId) {
    media = await db
      .select({
        id: S.globalExerciseMedia.id,
        mediaType: S.globalExerciseMedia.mediaType,
        url: S.globalExerciseMedia.url,
        title: S.globalExerciseMedia.title,
      })
      .from(S.globalExerciseMedia)
      .where(eq(S.globalExerciseMedia.globalExerciseId, ex[0].globalExerciseId))
      .orderBy(desc(S.globalExerciseMedia.displayOrder));
  }

  const lastProfile = await db
    .select({
      lastPerformed: S.exerciseProfile.lastPerformed,
      est1rm: S.exerciseProfile.estimated1rm,
    })
    .from(S.exerciseProfile)
    .where(
      and(
        eq(S.exerciseProfile.exerciseId, exerciseId),
        eq(S.exerciseProfile.orgId, orgId)
      )
    )
    .orderBy(desc(S.exerciseProfile.lastPerformed))
    .limit(1);

  return {
    exercise: ex[0],
    groups,
    media,
    last: lastProfile[0] ?? null,
  };
}

export default async function ExerciseDetailPage({ params }: PageProps) {
  const { orgId, exerciseId } = params;

  const data = await loadExerciseView(orgId, exerciseId);
  if (!data) notFound();

  const { exercise, groups, media, last } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Dumbbell className="h-5 w-5" aria-hidden />
            {exercise.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {exercise.category ? (
              <Badge variant="secondary">{exercise.category}</Badge>
            ) : null}
            {exercise.modality ? (
              <Badge variant="outline">{exercise.modality}</Badge>
            ) : null}
            {groups.map((g) => (
              <Badge key={g.id} variant="default">
                {g.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link
              href={`/org/${orgId}/exercises/${exercise.id}/edit`}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link
              href={`/org/${orgId}/log/new-set?exerciseId=${exercise.id}`}
              className="gap-2"
            >
              <Dumbbell className="h-4 w-4" />
              Log set
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Last performed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              {last?.lastPerformed
                ? new Date(last.lastPerformed).toLocaleDateString()
                : "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              {last?.est1rm ? `Est. 1RM: ${last.est1rm}` : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Global reference</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {exercise.globalExerciseId ? (
              <div className="space-y-1">
                <div className="font-medium">{exercise.globalName}</div>
                <div className="text-muted-foreground">
                  {exercise.globalCategory || exercise.globalModality
                    ? [exercise.globalCategory, exercise.globalModality]
                        .filter(Boolean)
                        .join(" • ")
                    : "Mapped to global"}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Not linked</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>
              <Link
                className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                href={`/org/${orgId}/sessions?exerciseId=${exercise.id}`}
              >
                Sessions with this exercise{" "}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div>
              <Link
                className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                href={`/org/${orgId}/analytics?focus=exercise&exerciseId=${exercise.id}`}
              >
                Analytics for this exercise{" "}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      {exercise.globalExerciseId &&
      (exercise.globalDescription || media.length > 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>Technique & reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exercise.globalDescription ? (
              <>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {exercise.globalDescription}
                </p>
                <Separator />
              </>
            ) : null}
            {media.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {media.slice(0, 6).map((m) => (
                  <Link
                    key={m.id}
                    href={m.url}
                    target="_blank"
                    className="group rounded-md border overflow-hidden"
                  >
                    <AspectRatio ratio={16 / 9}>
                      {m.mediaType.startsWith("image") ? (
                        <img
                          src={m.url}
                          alt={m.title ?? "Exercise media"}
                          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-sm text-muted-foreground">
                          {m.title ?? m.mediaType}
                        </div>
                      )}
                    </AspectRatio>
                    <div className="px-3 py-2 text-sm">
                      <div className="line-clamp-1">{m.title ?? "Media"}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {m.mediaType}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const row = await db
    .select({ name: S.exercise.name })
    .from(S.exercise)
    .where(
      and(
        eq(S.exercise.id, params.exerciseId),
        eq(S.exercise.orgId, params.orgId)
      )
    )
    .limit(1);

  const title = row[0]?.name ? `${row[0].name} · Exercise` : "Exercise";
  return {
    title,
    openGraph: { title },
  };
}
