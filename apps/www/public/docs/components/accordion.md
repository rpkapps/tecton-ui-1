# Accordion

A vertically stacked set of interactive headings that each reveal a section of content.

Source: /docs/components/accordion.md  
React Aria docs: https://react-aria.adobe.com/DisclosureGroup  
React Aria API: https://react-aria.adobe.com/DisclosureGroup#api

**Example — `accordion-demo`**

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@tecton/react/components/accordion"

export default function AccordionDemo() {
  return (
    <Accordion defaultExpandedKeys={["shipping"]} className="max-w-lg">
      <AccordionItem id="shipping">
        <AccordionTrigger>What are your shipping options?</AccordionTrigger>
        <AccordionContent>
          We offer standard (5-7 days), express (2-3 days), and overnight
          shipping. Free shipping on international orders.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem id="returns">
        <AccordionTrigger>What is your return policy?</AccordionTrigger>
        <AccordionContent>
          Returns accepted within 30 days. Items must be unused and in original
          packaging. Refunds processed within 5-7 business days.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem id="support">
        <AccordionTrigger>How can I contact customer support?</AccordionTrigger>
        <AccordionContent>
          Reach us via email, live chat, or phone. We respond within 24 hours
          during business days.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
```

## Usage

```tsx showLineNumbers
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@tecton/react/components/accordion"
```

```tsx showLineNumbers
<Accordion defaultExpandedKeys={["item-1"]}>
  <AccordionItem id="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

## Composition

Use the following composition to build an `Accordion`:

```text
Accordion
├── AccordionItem
│   ├── AccordionTrigger
│   └── AccordionContent
└── AccordionItem
    ├── AccordionTrigger
    └── AccordionContent
```

## Basic

A basic accordion that shows one item at a time. The first item is open by default.

**Example — `accordion-basic`**

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@tecton/react/components/accordion"

const items = [
  {
    value: "item-1",
    trigger: "How do I reset my password?",
    content:
      "Click on 'Forgot Password' on the login page, enter your email address, and we'll send you a link to reset your password. The link will expire in 24 hours.",
  },
  {
    value: "item-2",
    trigger: "Can I change my subscription plan?",
    content:
      "Yes, you can upgrade or downgrade your plan at any time from your account settings. Changes will be reflected in your next billing cycle.",
  },
  {
    value: "item-3",
    trigger: "What payment methods do you accept?",
    content:
      "We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through our payment partners.",
  },
]

export function AccordionBasic() {
  return (
    <Accordion defaultExpandedKeys={["item-1"]} className="max-w-lg">
      {items.map((item) => (
        <AccordionItem key={item.value} id={item.value}>
          <AccordionTrigger>{item.trigger}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

## Multiple

Use the `allowsMultipleExpanded` prop to allow multiple items to be open at the same time.

**Example — `accordion-multiple`**

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@tecton/react/components/accordion"

const items = [
  {
    value: "notifications",
    trigger: "Notification Settings",
    content:
      "Manage how you receive notifications. You can enable email alerts for updates or push notifications for mobile devices.",
  },
  {
    value: "privacy",
    trigger: "Privacy & Security",
    content:
      "Control your privacy settings and security preferences. Enable two-factor authentication, manage connected devices, review active sessions, and configure data sharing preferences. You can also download your data or delete your account.",
  },
  {
    value: "billing",
    trigger: "Billing & Subscription",
    content:
      "View your current plan, payment history, and upcoming invoices. Update your payment method, change your subscription tier, or cancel your subscription.",
  },
]

export function AccordionMultiple() {
  return (
    <Accordion
      allowsMultipleExpanded
      className="max-w-lg"
      defaultExpandedKeys={["notifications"]}
    >
      {items.map((item) => (
        <AccordionItem key={item.value} id={item.value}>
          <AccordionTrigger>{item.trigger}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

## Disabled

Use the `isDisabled` prop on `AccordionItem` to disable individual items.

**Example — `accordion-disabled`**

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@tecton/react/components/accordion"

export default function AccordionDisabled() {
  return (
    <Accordion className="w-full">
      <AccordionItem id="item-1">
        <AccordionTrigger>Can I access my account history?</AccordionTrigger>
        <AccordionContent>
          Yes, you can view your complete account history including all
          transactions, plan changes, and support tickets in the Account History
          section of your dashboard.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem id="item-2" isDisabled>
        <AccordionTrigger>Premium feature information</AccordionTrigger>
        <AccordionContent>
          This section contains information about premium features. Upgrade your
          plan to access this content.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem id="item-3">
        <AccordionTrigger>How do I update my email address?</AccordionTrigger>
        <AccordionContent>
          You can update your email address in your account settings.
          You&apos;ll receive a verification email at your new address to
          confirm the change.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
```

## Borders

Add `border` to the `Accordion` and `border-b last:border-b-0` to the `AccordionItem` to add borders to the items.

**Example — `accordion-borders`**

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@tecton/react/components/accordion"

const items = [
  {
    value: "billing",
    trigger: "How does billing work?",
    content:
      "We offer monthly and annual subscription plans. Billing is charged at the beginning of each cycle, and you can cancel anytime. All plans include automatic backups, 24/7 support, and unlimited team members.",
  },
  {
    value: "security",
    trigger: "Is my data secure?",
    content:
      "Yes. We use end-to-end encryption, SOC 2 Type II compliance, and regular third-party security audits. All data is encrypted at rest and in transit using industry-standard protocols.",
  },
  {
    value: "integration",
    trigger: "What integrations do you support?",
    content:
      "We integrate with 500+ popular tools including Slack, Zapier, Salesforce, HubSpot, and more. You can also build custom integrations using our REST API and webhooks.",
  },
]

export default function AccordionBorders() {
  return (
    <Accordion
      className="max-w-lg rounded-lg border"
      defaultExpandedKeys={["billing"]}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          id={item.value}
          className="border-b last:border-b-0"
        >
          <AccordionTrigger className="px-4">{item.trigger}</AccordionTrigger>
          <AccordionContent className="px-4">{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

## Card

Wrap the `Accordion` in a `Card` component.

**Example — `accordion-card`**

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@tecton/react/components/accordion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"

const items = [
  {
    value: "plans",
    trigger: "What subscription plans do you offer?",
    content:
      "We offer three subscription tiers: Starter ($9/month), Professional ($29/month), and Enterprise ($99/month). Each plan includes increasing storage limits, API access, priority support, and team collaboration features.",
  },
  {
    value: "billing",
    trigger: "How does billing work?",
    content:
      "Billing occurs automatically at the start of each billing cycle. We accept all major credit cards, PayPal, and ACH transfers for enterprise customers. You'll receive an invoice via email after each payment.",
  },
  {
    value: "cancel",
    trigger: "How do I cancel my subscription?",
    content:
      "You can cancel your subscription anytime from your account settings. There are no cancellation fees or penalties. Your access will continue until the end of your current billing period.",
  },
]

export default function AccordionCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Subscription & Billing</CardTitle>
        <CardDescription>
          Common questions about your account, plans, payments and
          cancellations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion defaultExpandedKeys={["plans"]}>
          {items.map((item) => (
            <AccordionItem key={item.value} id={item.value}>
              <AccordionTrigger>{item.trigger}</AccordionTrigger>
              <AccordionContent>{item.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `accordion-rtl`**

```tsx
"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@tecton/react/components/accordion"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      question1: "How do I reset my password?",
      answer1:
        "Click on 'Forgot Password' on the login page, enter your email address, and we'll send you a link to reset your password.",
      question2: "Can I change my subscription plan?",
      answer2:
        "Yes, you can upgrade or downgrade your plan at any time from your account settings. Changes will be reflected in your next billing cycle.",
      question3: "What payment methods do you accept?",
      answer3:
        "We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through our payment partners.",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      question1: "كيف يمكنني إعادة تعيين كلمة المرور؟",
      answer1:
        "انقر على 'نسيت كلمة المرور' في صفحة تسجيل الدخول، أدخل عنوان بريدك الإلكتروني، وسنرسل لك رابطًا لإعادة تعيين كلمة المرور. سينتهي صلاحية الرابط خلال 24 ساعة.",
      question2: "هل يمكنني تغيير خطة الاشتراك الخاصة بي؟",
      answer2:
        "نعم، يمكنك ترقية أو تخفيض خطتك في أي وقت من إعدادات حسابك. ستظهر التغييرات في دورة الفوترة التالية.",
      question3: "ما هي طرق الدفع التي تقبلونها؟",
      answer3:
        "نقبل جميع بطاقات الائتمان الرئيسية و PayPal والتحويلات المصرفية. تتم معالجة جميع المدفوعات بأمان من خلال شركاء الدفع لدينا.",
    },
  },
  he: {
    dir: "rtl",
    values: {
      question1: "איך אני מאפס את הסיסמה שלי?",
      answer1:
        "לחץ על 'שכחתי סיסמה' בעמוד ההתחברות, הזן את כתובת האימייל שלך, ונשלח לך קישור לאיפוס הסיסמה. הקישור יפוג תוך 24 שעות.",
      question2: "האם אני יכול לשנות את תוכנית המנוי שלי?",
      answer2:
        "כן, אתה יכול לשדרג או להוריד את התוכנית שלך בכל עת מההגדרות של החשבון שלך. השינויים יבואו לידי ביטוי במחזור החיוב הבא.",
      question3: "אילו אמצעי תשלום אתם מקבלים?",
      answer3: "אנו מקבלים כרטיסי אשראי, PayPal והעברות בנקאיות.",
    },
  },
}

const items = [
  {
    value: "item-1",
    questionKey: "question1" as const,
    answerKey: "answer1" as const,
  },
  {
    value: "item-2",
    questionKey: "question2" as const,
    answerKey: "answer2" as const,
  },
  {
    value: "item-3",
    questionKey: "question3" as const,
    answerKey: "answer3" as const,
  },
] as const

export function AccordionRtl() {
  const { t } = useTranslation(translations, "ar")

  return (
    <Accordion defaultExpandedKeys={["item-1"]} className="max-w-md">
      {items.map((item) => (
        <AccordionItem key={item.value} id={item.value}>
          <AccordionTrigger>{t[item.questionKey]}</AccordionTrigger>
          <AccordionContent>{t[item.answerKey]}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

## API Reference

See the [React Aria](https://react-aria.adobe.com/DisclosureGroup#api) documentation for more information.
