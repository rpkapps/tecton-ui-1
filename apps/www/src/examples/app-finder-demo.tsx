import * as React from "react"

import {
  AppFinder,
  AppFinderGroup,
  AppFinderInput,
  AppFinderItem,
  AppFinderList,
  AppFinderMenu,
  AppFinderTrigger,
} from "@tecton/react/tecton/app-finder"

const catalogue = [
  {
    category: "Subsurface",
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

const allApps = catalogue.flatMap((group) => group.apps)

export default function AppFinderDemo() {
  const [current, setCurrent] = React.useState(allApps[0])

  return (
    <AppFinder>
      <AppFinderTrigger
        aria-label={`Switch application, current: ${current.name}`}
      >
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
