import { MethodologyView } from "@/components/methodology/methodology-view";
import { getMethodologyDoc } from "@/lib/methodology-doc";
import { methodologyPageMeta } from "@/lib/site-meta";

export const metadata = methodologyPageMeta;

export default async function MethodologyPage() {
  const doc = await getMethodologyDoc();

  return <MethodologyView doc={doc} />;
}
