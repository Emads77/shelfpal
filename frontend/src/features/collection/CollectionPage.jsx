import { useAuth } from "../../state/useAuth.js";
import {usePageTitle} from "../../shared/hooks/usePageTitle.js";

export default function CollectionPage() {
  const { user } = useAuth();
  usePageTitle("Collection");

  return (
    <section>
      <h1>My book collection</h1>
      <p>Logged in as {user.username}.</p>
    </section>
  );
}
