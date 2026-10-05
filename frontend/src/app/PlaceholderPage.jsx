import {usePageTitle} from "../shared/hooks/usePageTitle.js";

export default function PlaceholderPage({ title }) {
  usePageTitle(title);

  return (
    <section>
      <h1>{title}</h1>
      <p>Coming soon.</p>
    </section>
  );
}
