"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  createColumns,
  DataTable,
  DataTableActionBar,
  DataTableActiveFilters,
  DataTableContent,
  DataTableFilter,
  DataTableFooter,
  DataTableGroupBy,
  DataTablePagination,
  DataTableSearch,
  DataTableToolbar,
} from "@tecton/react/tecton/data-table"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      table: "Wells",
      well: "Well",
      field: "Field",
      operator: "Operator",
      status: "Status",
      depth: "TD (m)",
      spud: "Spud date",
      producing: "Producing",
      shutIn: "Shut in",
      drilling: "Drilling",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      table: "الآبار",
      well: "البئر",
      field: "الحقل",
      operator: "المشغّل",
      status: "الحالة",
      depth: "العمق الكلي (م)",
      spud: "تاريخ بدء الحفر",
      producing: "منتجة",
      shutIn: "مغلقة",
      drilling: "قيد الحفر",
    },
  },
  he: {
    dir: "rtl",
    values: {
      table: "בארות",
      well: "באר",
      field: "שדה",
      operator: "מפעיל",
      status: "סטטוס",
      depth: "עומק סופי (מ׳)",
      spud: "תאריך תחילת קידוח",
      producing: "מפיקה",
      shutIn: "סגורה",
      drilling: "בקידוח",
    },
  },
}

type Well = {
  id: string
  name: string
  field: string
  operator: string
  status: "producing" | "shut-in" | "drilling"
  depth: number
  spud: Date
}

const FIELDS = ["Gullfaks", "Snorre", "Valhall", "Balder"]
const OPERATORS = ["Equinor", "Equinor", "Aker BP", "Aker BP"]
const STATUSES: Array<Well["status"]> = ["producing", "shut-in", "drilling"]

const wells: Array<Well> = Array.from({ length: 24 }, (_, i) => ({
  id: `w${i + 1}`,
  name: `34/10-${String.fromCharCode(65 + (i % 3))}-${i + 1}`,
  field: FIELDS[i % FIELDS.length],
  operator: OPERATORS[i % OPERATORS.length],
  status: STATUSES[(i * 5) % STATUSES.length],
  depth: 1800 + ((i * 389) % 2600),
  spud: new Date(Date.UTC(2008 + (i % 12), (i * 5) % 12, 1 + ((i * 7) % 27))),
}))

export default function DataTableRtl() {
  const { t } = useTranslation(translations, "ar")
  // New columns when the language changes, the same ones otherwise.
  const columns = React.useMemo(
    () =>
      createColumns<Well>([
        // Well names read left to right in either direction.
        {
          id: "name",
          header: t.well,
          cell: (_, { text }) => <bdi>{text}</bdi>,
        },
        { id: "field", header: t.field },
        { id: "operator", header: t.operator },
        {
          id: "status",
          header: t.status,
          type: "options",
          options: [
            { value: "producing", label: t.producing, variant: "success" },
            { value: "shut-in", label: t.shutIn, variant: "warning" },
            { value: "drilling", label: t.drilling, variant: "info" },
          ],
        },
        { id: "depth", header: t.depth, type: "number" },
        {
          id: "spud",
          header: t.spud,
          type: "date",
          format: { dateStyle: "medium", timeZone: "UTC" },
        },
      ]),
    [t]
  )

  return (
    <DataTable
      items={wells}
      columns={columns}
      selectionMode="multiple"
      pagination
      defaultPageSize={5}
      resizableColumns
      reorderableColumns
      hideableColumns
      pinnableColumns
      filterable
      groupable
      defaultView={{
        grouping: ["field"],
        columns: { pinned: { start: ["name"], end: [] } },
      }}
      className="w-full"
    >
      <DataTableToolbar>
        <DataTableSearch />
        <DataTableFilter column="status" />
        <DataTableFilter column="depth" />
        <DataTableFilter column="spud" />
        <DataTableGroupBy />
      </DataTableToolbar>
      <DataTableActiveFilters />
      <DataTableActionBar />
      <DataTableContent aria-label={t.table} totals />
      <DataTableFooter>
        <DataTablePagination pageSizes={[]} />
      </DataTableFooter>
    </DataTable>
  )
}
