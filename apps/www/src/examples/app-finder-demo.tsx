import * as React from "react"

import {
  AppFinder,
  AppFinderGroup,
  AppFinderInput,
  AppFinderItem,
  AppFinderList,
  AppFinderMenu,
  AppFinderTrigger,
  type AppFinderTone,
} from "@tecton/react/tecton/app-finder"

const catalogue: {
  category: string
  tone: AppFinderTone
  apps: { id: string; code: string; name: string; description: string }[]
}[] = [
  {
    category: "Subsurface",
    tone: "blue",
    apps: [
      {
        id: "dsg",
        code: "DSG",
        name: "Discovery",
        description: "Regional geology and prospects",
      },
      {
        id: "fwm",
        code: "FWM",
        name: "Framework Modeling",
        description: "Horizons and faults",
      },
      {
        id: "wcr",
        code: "WCR",
        name: "Well Correlation",
        description: "Log correlation and markers",
      },
    ],
  },
  {
    category: "Wells",
    tone: "green",
    apps: [
      {
        id: "dwp",
        code: "DWP",
        name: "Well Planning",
        description: "Well design and comparison",
      },
      {
        id: "trj",
        code: "TRJ",
        name: "Trajectory Design",
        description: "Targets and anti-collision",
      },
    ],
  },
  {
    category: "Facilities",
    tone: "saffron",
    apps: [
      {
        id: "aam",
        code: "AAM",
        name: "Asset Management",
        description: "Field development alternatives",
      },
      {
        id: "sub",
        code: "SUB",
        name: "Subsea Layout",
        description: "Templates, flowlines, umbilicals",
      },
    ],
  },
]

const allApps = catalogue.flatMap((group) =>
  group.apps.map((app) => ({ ...app, tone: group.tone }))
)

export default function AppFinderDemo() {
  const [current, setCurrent] = React.useState(allApps[0])

  return (
    <AppFinder>
      <AppFinderTrigger name={current.name} tone={current.tone}>
        {current.code}
      </AppFinderTrigger>
      <AppFinderMenu>
        <AppFinderInput />
        <AppFinderList
          onAction={(key) => {
            const app = allApps.find((item) => item.id === key)
            if (app) setCurrent(app)
          }}
        >
          {catalogue.map((group) => (
            <AppFinderGroup key={group.category} heading={group.category}>
              {group.apps.map((app) => (
                <AppFinderItem
                  key={app.id}
                  id={app.id}
                  icon={app.code}
                  tone={group.tone}
                  name={app.name}
                  description={app.description}
                  keywords={[app.code, group.category]}
                  isCurrent={app.id === current.id}
                />
              ))}
            </AppFinderGroup>
          ))}
        </AppFinderList>
      </AppFinderMenu>
    </AppFinder>
  )
}
