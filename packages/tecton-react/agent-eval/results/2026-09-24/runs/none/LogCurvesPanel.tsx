import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Progress,
  Skeleton,
} from "@tecton/react";

interface LogCurvesPanelProps {
  state: "loading" | "error" | "ready";
  curves: string[];
  uploadProgress: number | null;
  onRetry: () => void;
}

const PLACEHOLDER_ROW_COUNT = 6;

export function LogCurvesPanel({
  state,
  curves,
  uploadProgress,
  onRetry,
}: LogCurvesPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {uploadProgress !== null ? (
        <div
          className="flex flex-col gap-1.5"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Uploading log curves…</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} aria-label="Upload progress" />
        </div>
      ) : null}

      {state === "loading" ? (
        <ul className="flex flex-col gap-2" aria-busy="true" aria-live="off">
          {Array.from({ length: PLACEHOLDER_ROW_COUNT }).map((_, index) => (
            <li
              key={index}
              className="flex h-10 items-center gap-3 rounded-md border px-3"
            >
              <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
              <Skeleton className="h-4 w-40" />
            </li>
          ))}
        </ul>
      ) : null}

      {state === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load log curves</AlertTitle>
          <AlertDescription>
            <p>Something went wrong while fetching the curve list.</p>
            <Button variant="outline" size="sm" onPress={onRetry}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {state === "ready" ? (
        curves.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {curves.map((curve) => (
              <li
                key={curve}
                className="flex h-10 items-center rounded-md border px-3 text-sm"
              >
                {curve}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No log curves found.</p>
        )
      ) : null}
    </div>
  );
}
