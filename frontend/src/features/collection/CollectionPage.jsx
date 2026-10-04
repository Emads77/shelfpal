import { useAuth } from "../../state/useAuth.js";

export default function CollectionPage() {
  const { user } = useAuth();
  return (
    <section>
      <h1>My book collection</h1>
      <p>Logged in as {user.username}.</p>
    </section>
  );
}
