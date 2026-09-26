// Synced from shadcn/ui (apps/v4/examples/base/accordion-borders.tsx) by scripts/sync-upstream-docs.mts — do not edit.
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
      defaultValue={["billing"]}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          className="border-b last:border-b-0"
        >
          <AccordionTrigger className="px-4">{item.trigger}</AccordionTrigger>
          <AccordionContent className="px-4">{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
