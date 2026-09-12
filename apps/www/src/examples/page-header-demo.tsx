import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

export default function PageHeaderDemo() {
  return (
    <PageHeader className="w-full max-w-2xl">
      <PageHeaderContent>
        <PageHeaderTitle>Gullfaks field development</PageHeaderTitle>
        <PageHeaderDescription>
          Three alternatives evaluated against the P50 volumes from the 2025 reservoir model.
        </PageHeaderDescription>
      </PageHeaderContent>
    </PageHeader>
  )
}
