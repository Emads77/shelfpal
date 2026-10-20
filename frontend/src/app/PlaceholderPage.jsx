import { usePageTitle } from "../shared/hooks/usePageTitle.js";
import PageHeader from "../shared/ui/PageHeader.jsx";

export default function PlaceholderPage({ title }) {
  usePageTitle(title);

  return (
    <section>
      <PageHeader title={title} subtitle="Coming soon." />
    </section>
  );
}
