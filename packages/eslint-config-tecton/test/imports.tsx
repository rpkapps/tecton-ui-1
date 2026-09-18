/** Import guardrails: the wrong component source, and the missing root export. */
import { Button } from "@tecton/react/components/button" // allowed
import { Chip } from "@tecton/react/tecton/chip" // allowed
import { WellIcon } from "@tecton/react/icons" // allowed
import { Badge } from "@tecton/react" // expect: no-restricted-imports
import { Card } from "@/components/ui/card" // expect: no-restricted-imports

export const used = [Button, Chip, WellIcon, Badge, Card]
