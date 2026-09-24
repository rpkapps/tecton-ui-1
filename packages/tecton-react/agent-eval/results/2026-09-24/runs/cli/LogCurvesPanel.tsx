import { Fragment } from "react"
import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react"

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@tecton/react/components/alert"
import { Button } from "@tecton/react/components/button"
import { Item, ItemContent, ItemGroup, ItemSeparator, ItemTitle } from "@tecton/react/components/item"
import { Progress, ProgressLabel, ProgressValue } from "@tecton/react/components/progress"
import { Skeleton } from "@tecton/react/components/skeleton"

const PLACEHOLDER_ROW_COUNT = 6

export function LogCurvesPanel({
  state,
  curves,
  uploadProgress,
  onRetry,
}: {
  state: "loading" | "error" | "ready"
  curves: string[]
  uploadProgress: number | null
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {uploadProgress !== null && (
        <Progress value={uploadProgress} className="w-full">
          <ProgressLabel>Uploading log curves</ProgressLabel>
          <ProgressValue />
        </Progress>
      )}

      {state === "loading" && (
        <ItemGroup>
          {Array.from({ length: PLACEHOLDER_ROW_COUNT }).map((_, index) => (
            <Fragment key={index}>
              {index > 0 && <ItemSeparator />}
              <Item>
                <ItemContent>
                  <Skeleton className="h-4 w-1/3" />
                </ItemContent>
              </Item>
            </Fragment>
          ))}
        </ItemGroup>
      )}

      {state === "error" && (
        <Alert variant="destructive" appearance="outline">
          <TriangleAlertIcon />
          <AlertTitle>Couldn't load log curves</AlertTitle>
          <AlertDescription>Something went wrong while fetching the curve list.</AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onPress={onRetry}>
              <RefreshCwIcon data-icon="inline-start" />
              Retry
            </Button>
          </AlertAction>
        </Alert>
      )}

      {state === "ready" && (
        <ItemGroup>
          {curves.map((curve, index) => (
            <Fragment key={curve}>
              {index > 0 && <ItemSeparator />}
              <Item>
                <ItemContent>
                  <ItemTitle>{curve}</ItemTitle>
                </ItemContent>
              </Item>
            </Fragment>
          ))}
        </ItemGroup>
      )}
    </div>
  )
}
