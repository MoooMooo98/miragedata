import type { Metadata } from "next";

import FaasDashboard from "@/components/faas/FaasDashboard";

export const metadata: Metadata = {
  title: "FaaS Investor Dashboard — SustainEstates",
  description:
    "Feasibility-as-a-Service: Nutzungsvarianten-Rechner mit monatlichem DCF, IC-Gate-Logik und GO/NO-GO-Entscheidung für Repositionierungs- und Umnutzungsprojekte.",
};

export default function FaasPage() {
  return <FaasDashboard />;
}
