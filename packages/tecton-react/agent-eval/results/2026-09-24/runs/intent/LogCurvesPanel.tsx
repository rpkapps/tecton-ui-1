import { Fragment } from "react"
import { AlertTriangleIcon } from "lucide-react"

import { LogCurveIcon } from "@tecton/react/icons"
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@tecton/react/tecton/panel"
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@tecton/react/components/item"
import { Skeleton } from "@tecton/react/components/skeleton"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"
import { Button } from "@tecton/react/components/button"
import { Progress, ProgressLabel, ProgressValue } from "@tecton/react/components/progress"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tecton/react/components/empty"

const PLACEHOLDER_ROW_COUNT = 5

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
    <Panel className="w-full">
      <PanelHeader>
        <PanelTitle>Log curves</PanelTitle>
      </PanelHeader>
      <PanelContent className="flex flex-col gap-4">
        {uploadProgress !== null && (
          <Progress value={uploadProgress} className="w-full">
            <ProgressLabel>Uploading log curves</ProgressLabel>
            <ProgressValue />
          </Progress>
        )}

        {state === "loading" && (
          <div className="flex flex-col gap-2">
            <span className="sr-only">Loading log curves…</span>
            {Array.from({ length: PLACEHOLDER_ROW_COUNT }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-3 py-2.5" aria-hidden="true">
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {state === "error" && (
          <Alert variant="destructive" appearance="outline">
            <AlertTriangleIcon />
            <AlertTitle>Couldn&apos;t load log curves</AlertTitle>
            <AlertDescription>
              Something went wrong while loading the curve list. Try again.
            </AlertDescription>
            <AlertAction>
              <Button variant="outline" size="sm" onPress={onRetry}>
                Retry
              </Button>
            </AlertAction>
          </Alert>
        )}

        {state === "ready" &&
          (curves.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LogCurveIcon />
                </EmptyMedia>
                <EmptyTitle>No log curves</EmptyTitle>
                <EmptyDescription>
                  Upload a log to see its curves here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup>
              {curves.map((curve, index) => (
                <Fragment key={curve}>
                  <Item size="sm">
                    <ItemMedia variant="icon">
                      <LogCurveIcon />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{curve}</ItemTitle>
                    </ItemContent>
                  </Item>
                  {index < curves.length - 1 && <ItemSeparator />}
                </Fragment>
              ))}
            </ItemGroup>
          ))}
      </PanelContent>
    </Panel>
  )
}
