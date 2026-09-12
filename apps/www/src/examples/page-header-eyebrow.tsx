import { Chip } from "@tecton/react/tecton/chip"
import { Link } from "@tecton/react/tecton/link"
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderEyebrow,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

export default function PageHeaderEyebrowExample() {
  return (
    <PageHeader className="w-full max-w-2xl">
      <PageHeaderContent>
        <PageHeaderEyebrow className="flex items-center gap-1.5">
          <Link href="#" variant="muted">
            Gullfaks
          </Link>
          <span>/</span>
          <Link href="#" variant="muted">
            Wells
          </Link>
        </PageHeaderEyebrow>
        <PageHeaderTitle className="flex items-center gap-3">
          34/10-A-12
          <Chip size="sm" color="success">
            Producing
          </Chip>
        </PageHeaderTitle>
        <PageHeaderDescription>Drilled 2019 · TD 3 250 m · 2 sidetracks</PageHeaderDescription>
      </PageHeaderContent>
    </PageHeader>
  )
}
