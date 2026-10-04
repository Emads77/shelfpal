import { useEffect, useState } from "react";
import { getBookcases } from "./api.js";

export default function BookcasesPage() {
  const [bookcases, setBookcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load(){
    try{
      const data = await getBookcases();
      setBookcases(data)
    }catch (err){
      setError(err);
    }finally {
      setLoading(false)
    }
  }
  load();
  }, []);


  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error.message}</p>;

  return (
    <ul>
      {bookcases.map((bookcase) => (
        <li key={bookcase.id}>{bookcase.name}</li>
      ))}
    </ul>
  );
}
