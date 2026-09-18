# Tabs

A set of layered sections of content—known as tab panels—that are displayed one at a time.

Source: /docs/components/tabs.md  
React Aria docs: https://react-aria.adobe.com/Tabs  
React Aria API: https://react-aria.adobe.com/Tabs#api

**Example — `tabs-demo`**

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tecton/react/components/tabs"

export function TabsDemo() {
  return (
    <Tabs defaultSelectedKey="overview" className="w-[400px]">
      <TabsList>
        <TabsTrigger id="overview">Overview</TabsTrigger>
        <TabsTrigger id="analytics">Analytics</TabsTrigger>
        <TabsTrigger id="reports">Reports</TabsTrigger>
        <TabsTrigger id="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent id="overview">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              View your key metrics and recent project activity. Track progress
              across all your active projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You have 12 active projects and 3 pending tasks.
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent id="analytics">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              Track performance and user engagement metrics. Monitor trends and
              identify growth opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Page views are up 25% compared to last month.
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent id="reports">
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              Generate and download your detailed reports. Export data in
              multiple formats for analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You have 5 reports ready and available to export.
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent id="settings">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Manage your account preferences and options. Customize your
              experience to fit your needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Configure notifications, security, and themes.
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
```

## Usage

```tsx showLineNumbers
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@tecton/react/components/tabs"
```

```tsx showLineNumbers
<Tabs defaultSelectedKey="account" className="w-[400px]">
  <TabsList>
    <TabsTrigger id="account">Account</TabsTrigger>
    <TabsTrigger id="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent id="account">Make changes to your account here.</TabsContent>
  <TabsContent id="password">Change your password here.</TabsContent>
</Tabs>
```

## Composition

Use the following composition to build `Tabs`:

```text
Tabs
├── TabsList
│   ├── TabsTrigger
│   └── TabsTrigger
├── TabsContent
└── TabsContent
```

## Line

Use the `variant="line"` prop on `TabsList` for a line style.

**Example — `tabs-line`**

```tsx
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

export function TabsLine() {
  return (
    <Tabs defaultSelectedKey="overview">
      <TabsList variant="line">
        <TabsTrigger id="overview">Overview</TabsTrigger>
        <TabsTrigger id="analytics">Analytics</TabsTrigger>
        <TabsTrigger id="reports">Reports</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
```

## Vertical

Use `orientation="vertical"` for vertical tabs.

**Example — `tabs-vertical`**

```tsx
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

export function TabsVertical() {
  return (
    <Tabs defaultSelectedKey="account" orientation="vertical">
      <TabsList>
        <TabsTrigger id="account">Account</TabsTrigger>
        <TabsTrigger id="password">Password</TabsTrigger>
        <TabsTrigger id="notifications">Notifications</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
```

## Disabled

**Example — `tabs-disabled`**

```tsx
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

export function TabsDisabled() {
  return (
    <Tabs defaultSelectedKey="home">
      <TabsList>
        <TabsTrigger id="home">Home</TabsTrigger>
        <TabsTrigger id="settings" isDisabled>
          Disabled
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
```

## Icons

**Example — `tabs-icons`**

```tsx
import { AppWindowIcon, CodeIcon } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

export function TabsIcons() {
  return (
    <Tabs defaultSelectedKey="preview">
      <TabsList>
        <TabsTrigger id="preview">
          <AppWindowIcon />
          Preview
        </TabsTrigger>
        <TabsTrigger id="code">
          <CodeIcon />
          Code
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `tabs-rtl`**

```tsx
"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tecton/react/components/tabs"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      overview: "Overview",
      analytics: "Analytics",
      reports: "Reports",
      settings: "Settings",
      overviewTitle: "Overview",
      overviewDesc:
        "View your key metrics and recent project activity. Track progress across all your active projects.",
      overviewContent: "You have 12 active projects and 3 pending tasks.",
      analyticsTitle: "Analytics",
      analyticsDesc:
        "Track performance and user engagement metrics. Monitor trends and identify growth opportunities.",
      analyticsContent: "Page views are up 25% compared to last month.",
      reportsTitle: "Reports",
      reportsDesc:
        "Generate and download your detailed reports. Export data in multiple formats for analysis.",
      reportsContent: "You have 5 reports ready and available to export.",
      settingsTitle: "Settings",
      settingsDesc:
        "Manage your account preferences and options. Customize your experience to fit your needs.",
      settingsContent: "Configure notifications, security, and themes.",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      overview: "نظرة عامة",
      analytics: "التحليلات",
      reports: "التقارير",
      settings: "الإعدادات",
      overviewTitle: "نظرة عامة",
      overviewDesc:
        "عرض مقاييسك الرئيسية وأنشطة المشروع الأخيرة. تتبع التقدم عبر جميع مشاريعك النشطة.",
      overviewContent: "لديك ١٢ مشروعًا نشطًا و٣ مهام معلقة.",
      analyticsTitle: "التحليلات",
      analyticsDesc:
        "تتبع مقاييس الأداء ومشاركة المستخدمين. راقب الاتجاهات وحدد فرص النمو.",
      analyticsContent: "زادت مشاهدات الصفحة بنسبة ٢٥٪ مقارنة بالشهر الماضي.",
      reportsTitle: "التقارير",
      reportsDesc:
        "إنشاء وتنزيل تقاريرك التفصيلية. تصدير البيانات بتنسيقات متعددة للتحليل.",
      reportsContent: "لديك ٥ تقارير جاهزة ومتاحة للتصدير.",
      settingsTitle: "الإعدادات",
      settingsDesc:
        "إدارة تفضيلات حسابك وخياراته. تخصيص تجربتك لتناسب احتياجاتك.",
      settingsContent: "تكوين الإشعارات والأمان والسمات.",
    },
  },
  he: {
    dir: "rtl",
    values: {
      overview: "סקירה כללית",
      analytics: "אנליטיקה",
      reports: "דוחות",
      settings: "הגדרות",
      overviewTitle: "סקירה כללית",
      overviewDesc:
        "הצג את המדדים העיקריים שלך ופעילות הפרויקט האחרונה. עקוב אחר התקדמות בכל הפרויקטים הפעילים שלך.",
      overviewContent: "יש לך 12 פרויקטים פעילים ו-3 משימות ממתינות.",
      analyticsTitle: "אנליטיקה",
      analyticsDesc:
        "עקוב אחר ביצועים ומדדי מעורבות משתמשים. עקוב אחר מגמות וזהה הזדמנויות צמיחה.",
      analyticsContent: "צפיות בדף עלו ב-25% בהשוואה לחודש שעבר.",
      reportsTitle: "דוחות",
      reportsDesc:
        "צור והורד את הדוחות המפורטים שלך. ייצא נתונים בפורמטים מרובים לניתוח.",
      reportsContent: "יש לך 5 דוחות מוכנים וזמינים לייצוא.",
      settingsTitle: "הגדרות",
      settingsDesc:
        "נהל את העדפות החשבון והאפשרויות שלך. התאם אישית את החוויה שלך כך שתתאים לצרכים שלך.",
      settingsContent: "הגדר התראות, אבטחה וערכות נושא.",
    },
  },
}

export function TabsRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <Tabs defaultSelectedKey="overview" className="w-full max-w-sm" dir={dir}>
      <TabsList dir={dir}>
        <TabsTrigger id="overview">{t.overview}</TabsTrigger>
        <TabsTrigger id="analytics">{t.analytics}</TabsTrigger>
        <TabsTrigger id="reports">{t.reports}</TabsTrigger>
        <TabsTrigger id="settings">{t.settings}</TabsTrigger>
      </TabsList>
      <TabsContent id="overview">
        <Card dir={dir}>
          <CardHeader>
            <CardTitle>{t.overviewTitle}</CardTitle>
            <CardDescription>{t.overviewDesc}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t.overviewContent}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent id="analytics">
        <Card dir={dir}>
          <CardHeader>
            <CardTitle>{t.analyticsTitle}</CardTitle>
            <CardDescription>{t.analyticsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t.analyticsContent}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent id="reports">
        <Card dir={dir}>
          <CardHeader>
            <CardTitle>{t.reportsTitle}</CardTitle>
            <CardDescription>{t.reportsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t.reportsContent}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent id="settings">
        <Card dir={dir}>
          <CardHeader>
            <CardTitle>{t.settingsTitle}</CardTitle>
            <CardDescription>{t.settingsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t.settingsContent}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
```

## API Reference

See the [React Aria Tabs](https://react-aria.adobe.com/Tabs#api) documentation.
