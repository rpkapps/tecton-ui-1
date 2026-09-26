import * as React from "react"

import { Progress, ProgressValue } from "@tecton/react/components/progress"
import { CircularProgress } from "@tecton/react/tecton/circular-progress"

import { Matrix, Page } from "./matrix"

/**
 * Mirrors 080_components-progress__overview.png: a determinate linear bar at
 * 50% with its value label, and a 32px circular indicator at 50% with the
 * value in the centre. Indeterminate variants are appended as a second column
 * for completeness.
 */
export default function ProgressMatrix() {
  return (
    <Page>
      <Matrix
        columns={["Determinate (50%)", "Indeterminate"]}
        rows={[
          {
            label: "Linear",
            cells: [
              <Progress
                key="determinate"
                aria-label="Linear progress"
                value={50}
                className="w-72 flex-nowrap items-center"
              >
                <ProgressValue className="order-last ml-0 text-foreground" />
              </Progress>,
              <Progress
                key="indeterminate"
                aria-label="Linear progress"
                value={null}
                className="w-72"
              />,
            ],
          },
          {
            label: "Circular",
            cells: [
              <CircularProgress
                key="determinate"
                aria-label="Circular progress"
                value={50}
                size="md"
                showValue
              />,
              <CircularProgress
                key="indeterminate"
                aria-label="Circular progress"
                size="md"
                isIndeterminate
              />,
            ],
          },
        ]}
      />
    </Page>
  )
}
