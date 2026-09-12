"use client"

import * as React from "react"
import { cn } from "cn"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"
import { Divider } from "@tecton/react/tecton/divider"
import {
  SelectField,
  SelectFieldItem,
} from "@tecton/react/tecton/select-field"
import { StatusAlert } from "@tecton/react/tecton/status-alert"
import { TextField } from "@tecton/react/tecton/text-field"

import {
  accents,
  channels,
  densities,
  digests,
  roles,
  themes,
  timezones,
  unitSystems,
  type Settings,
} from "../data"

type SectionProps<K extends keyof Settings> = {
  className?: string
  value: Settings[K]
  onChange: (next: Settings[K]) => void
}

function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      data-slot="settings-section"
      className={cn("grid gap-4 md:grid-cols-[14rem_1fr] md:gap-8", className)}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex max-w-xl flex-col gap-4">{children}</div>
    </section>
  )
}

function SwitchRow({
  label,
  description,
  isSelected,
  onChange,
}: {
  label: string
  description?: string
  isSelected: boolean
  onChange: (next: boolean) => void
}) {
  const id = React.useId()
  return (
    <Field orientation="horizontal" data-slot="switch-row" className="justify-between">
      <FieldContent>
        <FieldLabel htmlFor={id} className="text-sm font-normal">
          {label}
        </FieldLabel>
        {description && (
          <FieldDescription className="text-xs">{description}</FieldDescription>
        )}
      </FieldContent>
      <Switch id={id} isSelected={isSelected} onChange={onChange} />
    </Field>
  )
}

function ProfileForm({ className, value, onChange }: SectionProps<"profile">) {
  const set = <K extends keyof Settings["profile"]>(key: K, next: Settings["profile"][K]) =>
    onChange({ ...value, [key]: next })

  return (
    <div data-slot="profile-form" className={cn("flex flex-col gap-8", className)}>
      <SettingsSection
        title="Identity"
        description="How you appear to teammates in comments and change history."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="First name"
            value={value.firstName}
            onChange={(next) => set("firstName", next)}
          />
          <TextField
            label="Last name"
            value={value.lastName}
            onChange={(next) => set("lastName", next)}
          />
        </div>
        <TextField
          label="Email"
          type="email"
          value={value.email}
          isReadOnly
          description="Managed by your identity provider."
        />
        <SelectField
          label="Role"
          selectedKey={value.role}
          onSelectionChange={(key) => set("role", String(key))}
        >
          {roles.map((role) => (
            <SelectFieldItem key={role.id} id={role.id} textValue={role.label}>
              {role.label}
            </SelectFieldItem>
          ))}
        </SelectField>
        <TextField
          label="Bio"
          multiline
          rows={3}
          value={value.bio}
          onChange={(next) => set("bio", next)}
          description={`${value.bio.length}/160`}
          errorMessage={value.bio.length > 160 ? "Keep it under 160 characters." : undefined}
        />
      </SettingsSection>

      <Divider emphasis="subtle" />

      <SettingsSection
        title="Locale"
        description="Time zone and unit system used for readouts across the workspace."
      >
        <SelectField
          label="Time zone"
          selectedKey={value.timezone}
          onSelectionChange={(key) => set("timezone", String(key))}
        >
          {timezones.map((zone) => (
            <SelectFieldItem key={zone.id} id={zone.id} textValue={zone.label}>
              {zone.label}
            </SelectFieldItem>
          ))}
        </SelectField>
        <SelectField
          label="Unit system"
          selectedKey={value.units}
          onSelectionChange={(key) => set("units", String(key) as Settings["profile"]["units"])}
          description="Changing units re-formats depths, pressures and volumes; stored values are unaffected."
        >
          {unitSystems.map((system) => (
            <SelectFieldItem key={system.id} id={system.id} textValue={system.label}>
              {system.label}
            </SelectFieldItem>
          ))}
        </SelectField>
      </SettingsSection>
    </div>
  )
}

function NotificationsForm({ className, value, onChange }: SectionProps<"notifications">) {
  const set = <K extends keyof Settings["notifications"]>(
    key: K,
    next: Settings["notifications"][K]
  ) => onChange({ ...value, [key]: next })

  return (
    <div data-slot="notifications-form" className={cn("flex flex-col gap-8", className)}>
      <StatusAlert
        severity="info"
        variant="outlined"
        title="Rig schedule alerts are off"
        description="You will not be told when a planned spud date moves. Enable them below to stay on top of schedule changes."
      />
      <SettingsSection title="Delivery" description="Where and how often notifications reach you.">
        <SelectField
          label="Channel"
          selectedKey={value.channel}
          onSelectionChange={(key) =>
            set("channel", String(key) as Settings["notifications"]["channel"])
          }
        >
          {channels.map((channel) => (
            <SelectFieldItem key={channel.id} id={channel.id} textValue={channel.label}>
              {channel.label}
            </SelectFieldItem>
          ))}
        </SelectField>
        <SelectField
          label="Frequency"
          selectedKey={value.digest}
          onSelectionChange={(key) =>
            set("digest", String(key) as Settings["notifications"]["digest"])
          }
        >
          {digests.map((digest) => (
            <SelectFieldItem key={digest.id} id={digest.id} textValue={digest.label}>
              {digest.label}
            </SelectFieldItem>
          ))}
        </SelectField>
      </SettingsSection>

      <Divider emphasis="subtle" />

      <SettingsSection title="Activity" description="Events in the projects you are a member of.">
        <SwitchRow
          label="Model runs"
          description="When a facies or velocity model you started finishes or fails."
          isSelected={value.modelRuns}
          onChange={(next) => set("modelRuns", next)}
        />
        <SwitchRow
          label="FDA changes"
          description="When an alternative is nominated, archived or its economics change."
          isSelected={value.fdaChanges}
          onChange={(next) => set("fdaChanges", next)}
        />
        <SwitchRow
          label="Mentions"
          description="When someone @mentions you in a comment or the AI agent hands off to you."
          isSelected={value.mentions}
          onChange={(next) => set("mentions", next)}
        />
        <SwitchRow
          label="Rig schedule"
          description="When a spud date or rig assignment moves."
          isSelected={value.rigSchedule}
          onChange={(next) => set("rigSchedule", next)}
        />
      </SettingsSection>

      <Divider emphasis="subtle" />

      <SettingsSection title="Product" description="Occasional product news from Tecton.">
        <SwitchRow
          label="Release notes and tips"
          isSelected={value.marketing}
          onChange={(next) => set("marketing", next)}
        />
      </SettingsSection>
    </div>
  )
}

function AppearanceForm({ className, value, onChange }: SectionProps<"appearance">) {
  const set = <K extends keyof Settings["appearance"]>(
    key: K,
    next: Settings["appearance"][K]
  ) => onChange({ ...value, [key]: next })

  return (
    <div data-slot="appearance-form" className={cn("flex flex-col gap-8", className)}>
      <SettingsSection title="Theme" description="Dark is the canonical Tecton theme.">
        <SelectField
          label="Colour scheme"
          selectedKey={value.theme}
          onSelectionChange={(key) =>
            set("theme", String(key) as Settings["appearance"]["theme"])
          }
        >
          {themes.map((theme) => (
            <SelectFieldItem key={theme.id} id={theme.id} textValue={theme.label}>
              {theme.label}
            </SelectFieldItem>
          ))}
        </SelectField>
        <SelectField
          label="Accent"
          selectedKey={value.accent}
          onSelectionChange={(key) => set("accent", String(key))}
        >
          {accents.map((accent) => (
            <SelectFieldItem key={accent.id} id={accent.id} textValue={accent.label}>
              <ColorSwatch color={accent.color} size="xs" shape="circle" />
              {accent.label}
            </SelectFieldItem>
          ))}
        </SelectField>
        <SelectField
          label="Density"
          selectedKey={value.density}
          onSelectionChange={(key) =>
            set("density", String(key) as Settings["appearance"]["density"])
          }
        >
          {densities.map((density) => (
            <SelectFieldItem key={density.id} id={density.id} textValue={density.label}>
              {density.label}
            </SelectFieldItem>
          ))}
        </SelectField>
      </SettingsSection>

      <Divider emphasis="subtle" />

      <SettingsSection title="Accessibility">
        <SwitchRow
          label="Reduce motion"
          description="Disable panel and chart transitions."
          isSelected={value.reduceMotion}
          onChange={(next) => set("reduceMotion", next)}
        />
        <SwitchRow
          label="Monospace readouts"
          description="Use IBM Plex Mono with tabular figures for depths, costs and percentages."
          isSelected={value.monoReadouts}
          onChange={(next) => set("monoReadouts", next)}
        />
      </SettingsSection>
    </div>
  )
}

export { ProfileForm, NotificationsForm, AppearanceForm, SettingsSection, SwitchRow }
